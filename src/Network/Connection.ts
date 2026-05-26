import { Log, printBuffer, printBytes } from "@/Debug";
import { UnknownPacketError } from "@/Errors";
import GameProfile from "@/Minecraft/GameProfile";
import { Identifier } from "@/Minecraft/Identifier";
import { Player } from "@/Minecraft/Player";
import { TeleportFlag } from "@/Minecraft/TeleportFlags";
import { BufferedReader, BufferedReaderTimeoutError } from "@/Network/BufferedIO";
import Client from "@/Network/Client";
import { NodeblockServer, ServerMode } from "@/Network/NodeblockServer";
import { ClientboundPacket, ServerboundPacket } from "@/Network/Packet";
import {
    ClientboundConfigurationDisconnectPacket,
    ClientboundConfigurationKeepAlivePacket,
    ClientboundFinishConfigurationPacket,
    ClientboundLoginDisconnectPacket,
    ClientboundLoginFinishedPacket,
    ClientboundPlayDisconnectPacket,
    ClientboundPlayKeepAlivePacket,
    ClientboundPongResponsePacket,
    ClientboundUpdateEnabledFeaturesPacket,
    ServerboundClientInformationPacket,
    ServerboundCustomPayloadPacket,
    ServerboundFinishConfigurationPacket,
    ServerboundIntentionPacket,
    ServerboundHelloPacket,
    ServerboundConfigurationKeepAlivePacket,
    ServerboundPlayKeepAlivePacket,
    ServerboundLoginAcknowledgedPacket,
    ServerboundStatusPingRequestPacket,
    ServerboundStatusRequestPacket,
    ClientboundCustomPayloadPacket,
    ClientboundLoginPacket,
    ClientboundSelectKnownPacksPacket,
    ClientboundStatusResponsePacket,
    ServerboundSelectKnownPacksPacket,
    ClientboundUpdateTagsPacket
} from "@/Network/Packets.barrel";
import ClientboundPlayerPositionPacket from "@/Network/Packets/Clientbound/ClientboundPlayerPositionPacket";
import ClientboundRegistryDataPacket, { REQUIRED_REGISTRIES } from "@/Network/Packets/Clientbound/ClientboundRegistryDataPacket";
import { StatusResponseData } from "@/Network/Packets/Clientbound/ClientboundStatusResponsePacket";
import { HandshakeIntent } from "@/Network/Packets/Serverbound/ServerboundIntentionPacket";
import { Configuration, Handshaking, Login, Play, Status } from "@/Network/States.barrel";
import EventEmitter from "node:events";
import { Socket } from "node:net";
import { v4 } from "uuid";

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

    public readonly encrypted: boolean;
    public readonly uuid: string;

    private _client: Client = new Client();
    private _player!: Player;

    private _protocolVersion: number = -1;
    private _transfered: boolean = false;
    private _state: ConnectionState = ConnectionState.HANDSHAKING;
    private _processingPacket: boolean = false;
    private _bufferedReader: BufferedReader = new BufferedReader();
    private _ended: boolean = false;
    private _lastKeepaliveCheck: number = 0;
    private _keepaliveID: bigint = 0n;

    private _timeouts: Record<string, NodeJS.Timeout> = {};

    constructor(
        public readonly server: NodeblockServer,
        private readonly _socket: Socket
    ) {
        super();

        this.uuid = v4();
        this.encrypted = server.mode != ServerMode.OFFLINE;

        Log.info(`New connection { ${this.uuid} }`);

        this._initializeHandlers();
    }

    private _initializeHandlers() {
        this._socket.on("data", chunk => {
            if (this._ended) return;
            if (typeof chunk == "string") return this._cleanup();

            this.server.monitor?.incomingRaw(this.server, chunk);

            if (this._state != ConnectionState.PLAY) {
                printBuffer(chunk, "[Inc. Raw Data]: ");
            }
            this._bufferedReader.write(chunk);
            
            if (!this._processingPacket) {
                this._processingPacket = true;
                this._processPacket();
            }
        });

        this._socket.on("error", error => Log.error(error));

        this._socket.on("close", hasError => {
            this._ended = true;
            this._cleanup();
            this._socket.end();
            Log.info(`Connection { ${this.uuid} } closed ${hasError ? "with errors" : ""}`);
        });
    }

    private async _processPacket() {
        if (this._ended) return;

        let size = await this._bufferedReader.readNextVarInt();
        let packetID = 0;
        
        try {
            const data = await this._bufferedReader.waitForBytes(size);
            size -= 1;
            using reader = new BufferedReader(data);
            packetID = await reader.readNextVarInt();
    
            this.server.monitor?.incomingPacket(this.server, size, packetID, reader.buffer);
    
            if ((this._state != ConnectionState.PLAY) || ((packetID != 0xc) && (packetID != 0x1b))) printBuffer(reader.buffer, `[Parsed ${this._state} Packet #0x${packetID.toString(16)} ${size}b]: `);
    
            let packet;

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
            if (error instanceof BufferedReaderTimeoutError) {
                this.disconnect("Timed out");
            } else if (error instanceof UnknownPacketError) {
                await this.disconnect(`Unknown packet format: 0x${packetID.toString(16)}`);
            } else {
                Log.error(error);
                await this.disconnect(`Internal Server Error:\n\n${error}`);
            }
        }
        
        this._finishPacket();
    }

    private async _handleHandshake(packet: ServerboundPacket) {
        if (packet instanceof ServerboundIntentionPacket) {
            this._protocolVersion = packet.protocolVersion;

            switch (packet.intent) {
                case HandshakeIntent.STATUS:
                    this._state = ConnectionState.STATUS;
                    this.emit("serverlist");
                    break;
                case HandshakeIntent.TRANSFER:
                    this._transfered = true;
                    break;
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
                "description": { "text": this.server.motd },
                "enforcesSecureChat": false,
                "favicon": this.server.favicon
            };
            await this.send(new ClientboundStatusResponsePacket(data));
        } else if (packet instanceof ServerboundStatusPingRequestPacket) {
            const timestamp = BigInt(Date.now());
            await this.send(new ClientboundPongResponsePacket(timestamp));
        }
    }

    private async _handleLogin(packet: ServerboundPacket) {
        if (packet instanceof ServerboundHelloPacket) {
            if (this.encrypted) {
                this.disconnect("Encrypted servers are not supported yet.");
                return;
            } else {
                this._player = new Player(await GameProfile.fromUsername(packet.name));
                await this.send(new ClientboundLoginFinishedPacket(this._player.profile));
            }
        } else if (packet instanceof ServerboundLoginAcknowledgedPacket) {
            this._state = ConnectionState.CONFIGURATION;
            this.emit("configuration");

            if (!this.authenticated) {
                this.disconnect("Client has not properly authenticated.");
                return;
            }

            this._timeouts["keep-alive"] = setTimeout(() => this._sendKeepalive(), 5 * 1000);

            await this.send(ClientboundCustomPayloadPacket.brand(this.server.softwareName));
            await this._enableFeatures();
            await this.send(new ClientboundSelectKnownPacksPacket(this.server.packs));
        }
    }

    private async _handleConfiguration(packet: ServerboundPacket) {
        if (packet instanceof ServerboundSelectKnownPacksPacket) {
            Log.info("Client Known Packs:", packet.packs);
            await this._configureClientPacks();
        } else if (packet instanceof ServerboundClientInformationPacket) {
            this._client.locale = packet.locale;
            this._client.chatMode = packet.chatMode;
            this._client.viewDistance = packet.viewDistance;
        } else if (packet instanceof ServerboundCustomPayloadPacket) {
            using reader = new BufferedReader(packet.data);
            printBuffer(packet.data, `  Channel ${packet.channel} -> `);

            if (packet.channel.equals(Identifier.ofVanilla("brand"))) {
                this._client.brand = await reader.readNextString();
            }
            this.emit("pluginmessage", packet.channel, reader);
        } else if (packet instanceof ServerboundFinishConfigurationPacket) {
            this._state = ConnectionState.PLAY;
            this.emit("play");
            await this._initializeClientPlay();
        } else if (packet instanceof ServerboundConfigurationKeepAlivePacket) {
            this._verifyKeepaliveResponse(packet);
        }
    }

    private async _handlePlay(packet: ServerboundPacket) {
        if (packet instanceof ServerboundPlayKeepAlivePacket) {
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
                if ((packet instanceof ServerboundConfigurationKeepAlivePacket) || (packet instanceof ServerboundPlayKeepAlivePacket)) {
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
                    this.send(new ClientboundConfigurationKeepAlivePacket(this._keepaliveID));
                    break;
                case ConnectionState.PLAY:
                    this.send(new ClientboundPlayKeepAlivePacket(this._keepaliveID));
                    break;
            }
        }

        this._timeouts["keep-alive"].refresh();
    }

    private async _configureClientPacks() {
        await this._synchronizeRegistries();
        await this._updateTags(); 
        await this.send(new ClientboundFinishConfigurationPacket());
    }

    private async _initializeClientPlay() {
        Log.info("Initialize login here", this._player.id);
        const p = new ClientboundLoginPacket(
            this._player.id,
            false,
            [ Identifier.ofVanilla("overworld") ],
            this.server.maxPlayers,
            8, 8,
            false, true, false,
            0, Identifier.ofVanilla("overworld"),
            0, 0, 0,
            false, true,
            false, null, null,
            0, 0,
            false
        );
        await this.send(p);
        await this.send(new ClientboundPlayerPositionPacket(2, 0, 0, 0, 0, 0, 0, 0, 0, 0));
    }

    private async _enableFeatures() {
        await this.send(new ClientboundUpdateEnabledFeaturesPacket(this.server.featureFlags));
    }

    private async _updateTags() {
        await this.send(new ClientboundUpdateTagsPacket());
    }

    private async _synchronizeRegistries() {
        for (const registry in REQUIRED_REGISTRIES) {
            const contents = REQUIRED_REGISTRIES[registry];
            await this.send(new ClientboundRegistryDataPacket(registry, contents));
        }
    }

    public async send(packet: ClientboundPacket): Promise<void> {
        this.server.monitor?.outgoingPacket(this.server, packet);
        return new Promise(res => this._socket.write(packet.payload, () => res()));
    }

    // TODO add text components
    public async disconnect(reason: string) {
        if (this._ended) return;

        this._ended = true;

        switch (this._state) {
            case ConnectionState.LOGIN:
                await this.send(new ClientboundLoginDisconnectPacket(reason));
                break;
            case ConnectionState.CONFIGURATION:
                await this.send(new ClientboundConfigurationDisconnectPacket(reason));
                break;
            case ConnectionState.PLAY:
                await this.send(new ClientboundPlayDisconnectPacket(reason));
                break;
        }
        this._cleanup();
    }

    private _clearAllTimeouts() {
        Object.values(this._timeouts).forEach(clearTimeout);
    }

    public get profile() { return this._player.profile; }
    public get ended() { return this._ended; }
    public get transfered() { return this._transfered; }
    public get authenticated() { return !!this._player; }
    public get isPlay() { return this._state == ConnectionState.PLAY; }

    private _cleanup() {
        if (!this._socket.destroyed) this._socket.end();
        this.removeAllListeners();
        this._clearAllTimeouts();
        this._bufferedReader.close();
    }
}

export enum ConnectionState {
    HANDSHAKING = "Handshake",
    STATUS = "Status",
    LOGIN = "Login",
    CONFIGURATION = "Config",
    PLAY = "Play"
}