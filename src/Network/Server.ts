import net from "net";
import { Identifier } from "../Minecraft/identifier";
import { chatcolor } from "../Minecraft/legacyText";
import Connection from "./Connection";
import { info } from "../Debug";
import WebServer from "../Panel/WebServer";

type ServerOptions = {
    port?: number;
    minecraftVersions: number[];
    mode?: ServerMode;
    softwareName?: string;
    maxPlayers?: number;
    motd?: string | { centered: boolean, text: string };
    featureFlags?: Identifier[];
    webPanelPort?: number;
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
    public readonly web: number;
    
    public connections: Connection[] = [];
    public maxPlayers: number;
    public motd: { centered: boolean, text: string };
    public softwareName: string;
    public featureFlags: Identifier[];

    private _started: boolean = false;
    private _web: WebServer = new WebServer();

    constructor(options: ServerOptions) {
        this.port = options.port || 25565;
        this.minecraftVersions = options.minecraftVersions;
        this.mode = options.mode || ServerMode.OFFLINE;
        this.web = options.webPanelPort || -1;
        
        if (this.port == this.web) throw new Error("Minecraft server port and web port cannot be the same.");

        this.motd = ((typeof options.motd == "string") ? { centered: false, text: options.motd } : options.motd) || { centered: false, text: chatcolor("&fA &9node&bblock&f server") };
        this.maxPlayers = options.maxPlayers || 20;
        this.softwareName = options.softwareName || "nodeblock";
        this.featureFlags = options.featureFlags || [ Identifier.ofVanilla("vanilla") ];

        this.server = new net.Server();

        this.server.on("connection", socket => this.connections.push(new Connection(this, socket)));
        
        setInterval(() => {
            this._cleanupConnections();
        }, 1000);
    }

    private _cleanupConnections() {
        const length = this.connections.length;
        this.connections = this.connections.filter(connection => !connection.ended);
        const difference = length - this.connections.length;

        if (difference > 0) {
            info(`Cleaned up ${difference} stale connections.`);
        }
    }

    public start({
        minecraft = true,
        web = true
    }: { minecraft?: boolean, web?: boolean } = {}) {
        if (this._started) return;
        this._started = true;

        if (minecraft) {
            this.server.listen(this.port, () => {
                info(`Minecraft server started on ${this.port}`);
            });
        }

        if (web) {
            if (this.web != -1) {
                this._web.start(this.web);
            }
        }
    }
}