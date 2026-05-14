import { info } from "@/Debug";
import { Identifier } from "@/Minecraft/Identifier";
import { LegacyText } from "@/Minecraft/Text";
import Connection from "@/Network/Connection";
import { ClientboundPacket } from "@/Network/Packet";
import net from "node:net";
import fs from "fs"
import path from "path"

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

export class NodeblockServer {
    public static readonly SIGNALS = [ "SIGINT", "SIGTERM", "SIGHUP" ];

    public readonly server: net.Server;

    public readonly port: number;
    public readonly mode: ServerMode;
    public readonly minecraftVersions: number[];
    private readonly _configurationFolder: ConfigurationFolder;

    public connections: Set<Connection> = new Set();
    public maxPlayers: number;
    public motd: { centered: boolean, text: string };
    public softwareName: string;
    public featureFlags: Identifier[];

    private _running: boolean = false;
    private _connectionGC?: NodeJS.Timeout;
    private _handleNodeSignalsGracefully = true;

    constructor(
        folder: string, options: ServerOptions,
        public readonly monitor: NodeblockMonitor = new NodeblockMonitor()
    ) {
        this.port = options.port || 25565;
        this.minecraftVersions = options.minecraftVersions;
        this.mode = options.mode || ServerMode.OFFLINE;
        this._configurationFolder = new ConfigurationFolder(folder);
        
        this.motd = ((typeof options.motd == "string") ? { centered: false, text: options.motd } : options.motd) || { centered: false, text: LegacyText.transform("&fA &9node&bblock&f server") };
        this.maxPlayers = options.maxPlayers || 20;
        this.softwareName = options.softwareName || "nodeblock";
        this.featureFlags = options.featureFlags || [ Identifier.ofVanilla("vanilla") ];

        this.server = new net.Server();

        this.server.on("connection", socket => this.connections.add(new Connection(this, socket)));

        for (const SIGNAL of NodeblockServer.SIGNALS) process.once(SIGNAL, () => this._handleNodeSignalsGracefully ? this.stop() : "");
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
        if (!this._running) return;

        for (const connection of this.connections) {
            await connection.send(packet);
        }
    }

    public dontHandleNodeSignalsGracefully() {
        this._handleNodeSignalsGracefully = false;
        return this;
    }

    public async stop(): Promise<void> {
        if (!this._running) return;
        this._running = false;

        return new Promise(async res => {
            clearInterval(this._connectionGC);
            
            for (const connection of this.connections) {
                // TODO configurable
                await connection.disconnect("Server closed.");
            }
            this.connections.clear();

            this.server.close(() => res());
        });
    }

    public start() {
        if (this._running) return;
        this._running = true;

        this.server.listen(this.port, () => {
            info(`Minecraft server started on ${this.port}`);
        });

        this._connectionGC = setInterval(() => {
            this._cleanupConnections();
        }, 1000);
    }

    public getFile(path: string): Uint8Array {
        return this._configurationFolder.getFile(path);
    }

    public getProperty(name: string): any {

    }

    public get running() {
        return this._running;
    }
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

    public getFile(filePath: string): Uint8Array {
        try {
            const data = fs.readFileSync(path.join(this.folderPath, filePath));
            return data;
        } catch (error) {
            console.log(error);
            return new Uint8Array();
        }
    }
}

export class NodeblockMonitor {
    public incomingRaw(chunk: Uint8Array) {}
    public outgoingPacket(packet: ClientboundPacket) {}
    public incomingPacket(size: number, packetID: number, data: Uint8Array) {}
}