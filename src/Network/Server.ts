import { info } from "@/Debug";
import { Identifier } from "@/Minecraft/Identifier";
import { LegacyText } from "@/Minecraft/Text";
import Connection from "@/Network/Connection";
import { ClientboundPacket } from "@/Network/Packet";
import WebServer from "@/WebPanel/WebServer";
import net from "node:net";

export type ServerOptions = {
    port?: number;
    minecraftVersions: number[];
    mode?: ServerMode;
    softwareName?: string;
    maxPlayers?: number;
    motd?: string | { centered: boolean, text: string };
    featureFlags?: Identifier[];
    panel?: {
        port?: number
    };
};

export enum ServerMode {
    OFFLINE,
    OFFLINE_ENCRYPTED,
    ONLINE_ENCRYPTED,
}

export default class Server {
    public readonly server: net.Server;

    public readonly port: number;
    public readonly mode: ServerMode;
    public readonly minecraftVersions: number[];
    public readonly webConfig: Required<Required<ServerOptions>["panel"]>;
    
    public connections: Set<Connection> = new Set();
    public maxPlayers: number;
    public motd: { centered: boolean, text: string };
    public softwareName: string;
    public featureFlags: Identifier[];

    private _running: boolean = false;
    private _web: WebServer = new WebServer();
    private _connectionGC?: NodeJS.Timeout;

    constructor(options: ServerOptions) {
        this.port = options.port || 25565;
        this.minecraftVersions = options.minecraftVersions;
        this.mode = options.mode || ServerMode.OFFLINE;
        this.webConfig = {
            port: options.panel?.port || 25560
        }
        
        if (this.port == this.webConfig.port) throw new Error("Minecraft server port and web port cannot be the same.");

        this.motd = ((typeof options.motd == "string") ? { centered: false, text: options.motd } : options.motd) || { centered: false, text: LegacyText.transform("&fA &9node&bblock&f server") };
        this.maxPlayers = options.maxPlayers || 20;
        this.softwareName = options.softwareName || "nodeblock";
        this.featureFlags = options.featureFlags || [ Identifier.ofVanilla("vanilla") ];

        this.server = new net.Server();

        this.server.on("connection", socket => this.connections.add(new Connection(this, socket)));
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

    public async stop() {
        if (!this._running) return;
        this.server.close();
        clearInterval(this._connectionGC);
        
        for (const connection of this.connections) {
            // TODO configurable
            await connection.disconnect("Server closed.");
        }
        this.connections.clear();
        this._running = false;
    }

    public start({
        minecraft = true,
        web = true
    }: { minecraft?: boolean, web?: boolean } = {}) {
        if (this._running) return;
        this._running = true;

        if (minecraft) {
            this.server.listen(this.port, () => {
                info(`Minecraft server started on ${this.port}`);
            });

            this._connectionGC = setInterval(() => {
                this._cleanupConnections();
            }, 1000);
        }

        if (web) {
            this._web.start(this.webConfig.port);
        }
    }

    public get running() {
        return this._running;
    }
}