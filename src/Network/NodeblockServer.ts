import { info } from "@/Debug";
import { Identifier } from "@/Minecraft/Identifier";
import { LegacyText } from "@/Minecraft/Text";
import UUID from "@/Minecraft/UUID";
import Connection from "@/Network/Connection";
import { ClientboundPacket } from "@/Network/Packet";
import { ServerGroupMonitor } from "@/Nodeblock";
import { isErrorCode, wait } from "@shared/Util";
import { EventEmitter } from "events";
import fs from "fs";
import net from "node:net";
import path from "path";

export type ServerOptions = {
    port?: number;
    minecraftVersions: number[];
    mode?: ServerMode;
    softwareName?: string;
    maxPlayers?: number;
    motd?: string | { centered: boolean, text: string };
    featureFlags?: Identifier[];
};

export enum ServerMode {
    OFFLINE,
    OFFLINE_ENCRYPTED,
    ONLINE_ENCRYPTED,
}

export enum ServerState {
    STARTING = "starting",
    ONLINE = "online",
    STOPPING = "stopping",
    OFFLINE = "offline"
}

type NodeblockServerEvents = {
    "statechange": [ ServerState ];
    "playeradd": [ ]; // TODO
    "playerleave": [ ]; // TODO
}

export class NodeblockServer extends EventEmitter<NodeblockServerEvents> {
    public static readonly SIGNALS = [ "SIGINT", "SIGTERM", "SIGHUP", "SIGUSR2" ];

    public readonly id: UUID = new UUID();
    public server!: net.Server;

    public readonly port: number;
    public readonly mode: ServerMode;
    public readonly minecraftVersions: number[];
    private readonly _configurationFolder: ConfigurationFolder;

    public connections: Set<Connection> = new Set();
    public maxPlayers: number;
    public rawMotd: { centered: boolean, text: string };
    public softwareName: string;
    public featureFlags: Identifier[];

    private _state: ServerState = ServerState.OFFLINE;
    private _connectionGC?: NodeJS.Timeout;
    private _handleNodeSignalsGracefully = true;

    constructor(
        folder: string, options: ServerOptions,
        public monitor?: ServerGroupMonitor
    ) {
        super();

        this.port = options.port || 25565;
        this.minecraftVersions = options.minecraftVersions;
        this.mode = options.mode || ServerMode.OFFLINE;
        this._configurationFolder = new ConfigurationFolder(folder);
        
        this.rawMotd = ((typeof options.motd == "string") ? { centered: false, text: options.motd } : options.motd) || { centered: false, text: LegacyText.transform("&fA &9node&bblock&f server") };
        this.maxPlayers = options.maxPlayers || 20;
        this.softwareName = options.softwareName || "nodeblock";
        this.featureFlags = options.featureFlags || [ Identifier.ofVanilla("vanilla") ];
        
        for (const SIGNAL of NodeblockServer.SIGNALS) process.once(SIGNAL, () => this._handleNodeSignalsGracefully ? this.stop() : "");
        
        monitor?.initializeEvents(this);
    }

    private _cleanupConnections() {
        const length = this.connections.size;
        for (const connection of this.connections) {
            if (connection.ended) {
                this.connections.delete(connection);
            }
        }
        const difference = length - this.connections.size;

        if (difference > 0) {
            info(`Cleaned up ${difference} stale connections.`);
        }
    }

    public async broadcast(packet: ClientboundPacket): Promise<void> {
        if (!this.online) return;

        for (const connection of this.connections) {
            await connection.send(packet);
        }
    }

    public dontHandleNodeSignalsGracefully() {
        this._handleNodeSignalsGracefully = false;
        return this;
    }

    public async stop(): Promise<void> {
        if (!this.online) return;

        this._setState(ServerState.STOPPING);
        try {
            await this._deinitialize();
        } catch (error) {
            this.server.close();
            console.error(error);
        }
        this._setState(ServerState.OFFLINE);
        console.log(`[${process.pid}] Stopped minecraft server on ${this.port}`);
    }

    public start() {
        if (!this.offline) return;
        this._setState(ServerState.STARTING);
        this.server = new net.Server();
        this.server.on("connection", socket => this.connections.add(new Connection(this, socket)));

        try {
            this._initialize().then(() => this._setState(ServerState.ONLINE));
        } catch (error) {
            this._setState(ServerState.OFFLINE);
            console.error(error);
        }
    }

    public getFile(path: string): Uint8Array {
        return this._configurationFolder.getFile(path);
    }

    public getProperty(name: string): any {

    }

    protected _setState(state: ServerState) {
        this._state = state;
        this.emit("statechange", this._state);
    }

    public get online() {
        return this._state == ServerState.ONLINE;
    }

    public get offline() {
        return this._state == ServerState.OFFLINE;
    }

    protected async _initialize() {
        await new Promise<void>(res => this.server.listen(this.port, () => res()));
        
        info(`[${process.pid}] Minecraft server started on ${this.port}`);
        
        this._connectionGC = setInterval(() => {
            this._cleanupConnections();
        }, 1000);

        await wait(1000); // BUG artificial
    }

    protected async _deinitialize() {
        clearInterval(this._connectionGC);

        await Promise.all(this.connections.values().map(connection => connection.disconnect("Server closed.")));
        this.connections.clear();

        await wait(1000); // BUG artificial
        
        await new Promise<void>(res => this.server.close(() => res()));
    }

    public get favicon() {
        const faviconData = this.getFile("server-icon.png");
        return faviconData.length != 0 ? Buffer.from(faviconData).toString("base64") : "";
    }

    public get motd() { return this.rawMotd.centered ? LegacyText.centerMOTD(this.rawMotd.text) : this.rawMotd.text }
    public get state() { return this._state; }
    public get playConnections() { return this.connections.values().filter(connection => connection.isPlay).toArray(); }
    public get playerCount() { return this.playConnections.length; }
}

export class ConfigurationFolder {
    public static ROOT_FOLDER = "./Config";

    public readonly folderPath: string;

    constructor(
        folder: string
    ) {
        this.folderPath = path.join(ConfigurationFolder.ROOT_FOLDER, folder);
        
        try {
            if (!fs.statSync(this.folderPath).isDirectory()) {
                fs.rmSync(this.folderPath, { recursive: true, force: true });
                throw new Error("Configuration folder path is not a directory.");
            }
        } catch (error) {
            fs.mkdirSync(this.folderPath);
        }
    }

    private _erroredCache: Record<string, boolean> = {};
    public getFile(filePath: string): Uint8Array {
        const fullPath = path.join(this.folderPath, filePath);
        try {
            const data = fs.readFileSync(fullPath);
            return data;
        } catch (error) {
            if (isErrorCode(error, "ENOENT")) {
                if (!(filePath in this._erroredCache)) {
                    console.log(`File not found: ${fullPath}`);
                    this._erroredCache[filePath] = true;
                }
            } else {
                console.error(error);
            }
            return new Uint8Array();
        }
    }
}