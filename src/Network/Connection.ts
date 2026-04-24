import { HTMLLogger, info, printBuffer } from "@/Debug";
import GameProfile from "@/Minecraft/GameProfile";
import { Identifier } from "@/Minecraft/Identifier";
import { BufferedReader } from "@/Network/BufferedIO";
import Client from "@/Network/Client";
import { ClientboundPacket, ServerboundPacket } from "@/Network/Packet";
import {
    ClientboundDisconnectConfigurationPacket,
    ClientboundDisconnectLoginPacket,
    ClientboundDisconnectPlayPacket,
    ClientboundFeatureFlagsPacket,
    ClientboundFinishConfigurationPacket,
    ClientboundKeepAliveConfigurationPacket,
    ClientboundKeepAlivePlayPacket,
    ClientboundLoginSuccessPacket,
    ClientboundPongResponsePacket,
    ServerboundAcknowledgeFinishConfigurationPacket,
    ServerboundClientInformationPacket,
    ServerboundHandshakePacket,
    ServerboundKeepAliveConfigurationPacket,
    ServerboundKeepAlivePlayPacket,
    ServerboundLoginAcknowledgedPacket,
    ServerboundLoginStartPacket,
    ServerboundPingRequestPacket,
    ServerboundPluginMessagePacket,
    ServerboundStatusRequestPacket
} from "@/Network/Packets.barrel";
import { HandshakeIntent } from "@/Network/Packets/Serverbound/ServerboundHandshakePacket";
import Server, { ServerMode } from "@/Network/Server";
import { Configuration, Handshaking, Login, Play, Status } from "@/Network/States.barrel";
import EventEmitter from "node:events";
import { Socket } from "node:net";
import { v4 } from "uuid";
import ClientboundStatusResponsePacket, { StatusResponseData } from "@/Network/Packets/Clientbound/ClientboundStatusResponsePacket";
import { ServerConfiguration } from "@/ServerConfiguration";
import { LegacyText } from "@/Minecraft/Text";

interface ConnectionEvents {
    "login": [];
    "configuration": [];
    "serverlist": [];
    "play": [];
    "playpacket": [ ServerboundPacket ];
    
    "pluginmessage": [ Identifier, BufferedReader ];
}

export default class Connection extends EventEmitter<ConnectionEvents> {
    public static readonly KEEP_ALIVE_THRESHOLD = 15 * 1000;

    public readonly uuid: string;
    public readonly encrypted: boolean = false;

    private readonly _socket: Socket;

    private _client: Client = new Client();
    private _profile!: GameProfile;

    private _protocolVersion: number = -1;
    private _transfered: boolean = false;
    private _state: ConnectionState = ConnectionState.HANDSHAKING;
    private _processingPacket: boolean = false;
    private _bufferedReader: BufferedReader = new BufferedReader();
    private _ended: boolean = false;
    private _lastKeepaliveCheck: number = 0;
    private _keepaliveID: bigint = 0n;

    private _timeouts: Record<string, NodeJS.Timeout> = {};

    constructor(public readonly server: Server, socket: Socket) {
        super();

        this._socket = socket;

        this.uuid = v4();
        this.encrypted = server.mode != ServerMode.OFFLINE;

        info(`New connection { ${this.uuid} }`);

        this._initializeHandlers();
    }

    private _initializeHandlers() {
        this._socket.on("data", chunk => {
            if (typeof chunk == "string") return this.close();

            HTMLLogger.serverbound(chunk);

            if (this._state != ConnectionState.PLAY) {
                printBuffer(chunk, "[Chunk]: ");
            }
            
            if (!this._processingPacket) {
                this._processingPacket = true;
                this._processPacket();
            }
            this._bufferedReader.write(chunk);
        });

        this._socket.on("close", () => {
            this._ended = true;
            info(`Connection { ${this.uuid} } closed`);
        });
    }

    private async _processPacket() {
        const size = await this._bufferedReader.readNextVarInt();
        const data = await this._bufferedReader.waitForBytes(size);
        
        const reader = new BufferedReader(data);
        const packetID = await reader.readNextVarInt();

        HTMLLogger.completePacket(size, packetID, reader.buffer);
        if (packetID != 0x1b) printBuffer(reader.buffer, `[${this._state} Packet #0x${packetID} ${size}b]: `);

        let packet;

        try {
            switch (this._state) {
                case ConnectionState.HANDSHAKING:
                    packet = await Handshaking.decode(reader, packetID);
                    await this._handleHandshake(packet);
                    break;
                case ConnectionState.STATUS:
                    packet = await Status.decode(reader, packetID);
                    await this._handleStatus(packet);
                    break;
                case ConnectionState.LOGIN:
                    packet = await Login.decode(reader, packetID);
                    await this._handleLogin(packet);
                    break;
                case ConnectionState.CONFIGURATION:
                    packet = await Configuration.decode(reader, packetID);
                    await this._handleConfiguration(packet);
                    break;
                case ConnectionState.PLAY:
                    packet = await Play.decode(reader, packetID);
                    await this._handlePlay(packet);
                    break;
            }
        } catch (error) {
            if (error instanceof TypeError) {
                await this.disconnect(`Unknown packet format: 0x${packetID.toString(16)}`);
            } else {
                console.error(error);
                await this.disconnect(`Internal Server Error:\n\n${error}`);
            }
        }
        
        this._finishPacket();
    }

    private async _handleHandshake(packet: ServerboundPacket) {
        if (packet instanceof ServerboundHandshakePacket) {
            this._protocolVersion = packet.protocolVersion;

            switch (packet.intent) {
                case HandshakeIntent.STATUS:
                    this._state = ConnectionState.STATUS;
                    this.emit("serverlist");
                    break;
                case HandshakeIntent.TRANSFER:
                    this._transfered = true;
                case HandshakeIntent.LOGIN:
                    this._state = ConnectionState.LOGIN
                    this.emit("login");
                    break;
            }
        }
    }

    private async _handleStatus(packet: ServerboundPacket) {
        if (packet instanceof ServerboundStatusRequestPacket) {
            const onlinePlayers = 0;

            let base64Data = ServerConfiguration.getFile("server-icon.png");
            let matchVersion = this.server.minecraftVersions.includes(this._protocolVersion);

            const data: StatusResponseData = {
                "version": {
                    "name": this.server.softwareName,
                    "protocol": matchVersion ? this._protocolVersion : -1
                },
                "players": {
                    "max": this.server.maxPlayers,
                    "online": onlinePlayers,
                    "sample": []
                },
                "description": { "text": this.server.motd.centered ? LegacyText.centerMOTD(this.server.motd.text) : this.server.motd.text },
                "enforcesSecureChat": false,
                "favicon": base64Data.length != 0 ? Buffer.from(base64Data).toString("base64") : ""
            };
            await this.send(new ClientboundStatusResponsePacket(data));
        } else if (packet instanceof ServerboundPingRequestPacket) {
            const timestamp = BigInt(Date.now());
            await this.send(new ClientboundPongResponsePacket(timestamp));
        }
    }

    private async _handleLogin(packet: ServerboundPacket) {
        if (packet instanceof ServerboundLoginStartPacket) {
            if (this.encrypted) {
                this.disconnect("Encrypted servers are not supported yet.");
                return;
            } else {
                this._profile = await GameProfile.fromUsername(packet.name);
                await this.send(new ClientboundLoginSuccessPacket(this._profile));
            }
        } else if (packet instanceof ServerboundLoginAcknowledgedPacket) {
            this._state = ConnectionState.CONFIGURATION;
            this.emit("configuration");

            if (!this.authenticated) {
                this.disconnect("Client has not properly authenticated.");
                return;
            }

            this._initializeEventListeners();

            this._timeouts["keep-alive"] = setTimeout(() => this._sendKeepalive(), 5 * 1000);

            await this._configureClient();
        }
    }

    private async _handleConfiguration(packet: ServerboundPacket) {
        if (packet instanceof ServerboundClientInformationPacket) {
            this._client.locale = packet.locale;
            this._client.chatMode = packet.chatMode;
            this._client.viewDistance = packet.viewDistance;
        } else if (packet instanceof ServerboundPluginMessagePacket) {
            const reader = new BufferedReader(packet.data);
            printBuffer(packet.data, `  Channel ${packet.channel} -> `);

            if (packet.channel.equals(Identifier.ofVanilla("brand"))) {
                this._client.brand = await reader.readNextString();
            }
            this.emit("pluginmessage", packet.channel, reader);
        } else if (packet instanceof ServerboundAcknowledgeFinishConfigurationPacket) {
            this._state = ConnectionState.PLAY;
            this.emit("play");
        } else if (packet instanceof ServerboundKeepAliveConfigurationPacket) {
            this._verifyKeepaliveResponse(packet);
        }
    }

    private async _handlePlay(packet: ServerboundPacket) {
        if (packet instanceof ServerboundKeepAlivePlayPacket) {
            this._verifyKeepaliveResponse(packet);
        }
        
        this.emit("playpacket", packet);
    }

    private _finishPacket() {
        this._processingPacket = false;

        if (!this._ended && this._bufferedReader.readable) {
            this._processPacket();
        }
    }

    private _verifyKeepaliveResponse(packet: ServerboundPacket) {
        let delta = 0;
        let keepAliveID = 0n;

        switch (this._state) {
            case ConnectionState.CONFIGURATION:
            case ConnectionState.PLAY:
                if ((packet instanceof ServerboundKeepAliveConfigurationPacket) || (packet instanceof ServerboundKeepAlivePlayPacket)) {
                    delta = Date.now() - this._lastKeepaliveCheck;
                    keepAliveID = packet.keepAliveID;
                }
                break;
        }

        if (delta >= Connection.KEEP_ALIVE_THRESHOLD) {
            this.disconnect("Timed Out");
        } else if (keepAliveID != this._keepaliveID) {
            this.disconnect("Keep Alive: Client-server mismatch");
        } else {
            this._keepaliveID = 0n;
        }
    }

    private _sendKeepalive() {
        if (this._ended) return;

        if (this._keepaliveID != 0n) {
            const delta = Date.now() - this._lastKeepaliveCheck
            
            if (delta >= Connection.KEEP_ALIVE_THRESHOLD) {
                this.disconnect("Timed Out");
            }
        } else {
            this._lastKeepaliveCheck = Date.now();
            this._keepaliveID = BigInt(Date.now());
            
            switch (this._state) {
                case ConnectionState.CONFIGURATION:
                    this.send(new ClientboundKeepAliveConfigurationPacket(this._keepaliveID));
                    break;
                case ConnectionState.PLAY:
                    this.send(new ClientboundKeepAlivePlayPacket(this._keepaliveID));
                    break;
            }
        }

        this._timeouts["keep-alive"].refresh();
    }

    private async _configureClient() {
        await this._enableFeatures();
        await this._updateTags();
        await this._synchronizeRegistries();

        await this.send(new ClientboundFinishConfigurationPacket());
    }

    private async _enableFeatures() {
        await this.send(new ClientboundFeatureFlagsPacket(this.server.featureFlags));
    }

    private async _updateTags() {}

    private async _synchronizeRegistries() {}


    private _initializeEventListeners() {
    }

    public async send(packet: ClientboundPacket): Promise<void> {
        HTMLLogger.clientbound(packet.payload);
        return new Promise(res => this._socket.write(packet.payload, () => res()));
    }

    // TODO add text components
    public async disconnect(reason: string) {
        if (this._ended) return;

        this._ended = true;

        switch (this._state) {
            case ConnectionState.HANDSHAKING:
                this.close();
                break;
            case ConnectionState.LOGIN:
                await this.send(new ClientboundDisconnectLoginPacket(reason));
                break;
            case ConnectionState.CONFIGURATION:
                await this.send(new ClientboundDisconnectConfigurationPacket(reason));
                break;
            case ConnectionState.PLAY:
                await this.send(new ClientboundDisconnectPlayPacket(reason));
                break;
        }
    }

    private _clearAllTimeouts() {
        Object.values(this._timeouts).forEach(clearTimeout);
    }

    public get ended() {
        return this._ended;
    }

    public get transfered() {
        return this._transfered;
    }

    public get authenticated() {
        return !!this._profile;
    }

    public close() {
        this._ended = true;
        this._socket.end();
        this.removeAllListeners();
        this._clearAllTimeouts();
    }
}

export enum ConnectionState {
    HANDSHAKING = "Handshake",
    STATUS = "Status",
    LOGIN = "Login",
    CONFIGURATION = "Config",
    PLAY = "Play"
}