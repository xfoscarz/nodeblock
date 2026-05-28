import { Log } from "@/Debug";
import { NodeblockServer, ServerOptions } from "@/Network/NodeblockServer";
import { ClientboundPacket } from "@/Network/Packet";
import { PortWatcher } from "@/PortWatcher";
import ServerListHandler from "@/WebPanel/WebMonitorHandlers/ServerListHandler";
import ServerStateHandler from "@/WebPanel/WebMonitorHandlers/ServerStateHandler";
import WebServer, { WebsocketServer } from "@/WebPanel/WebServer";
import { API, UnknownAPIDataTypeError } from "@shared/API";
import { Server } from "node:net";

export type ServerEntry = { server: NodeblockServer, name: string };
type ContainerizedServerOptions = ServerOptions & { name: string, port: number, folderName?: string };

export class NodeblockServerGroup {
    private _servers: Record<string, ServerEntry> = {};
    private _webServer?: WebServer;
    private _monitor?: ServerGroupMonitor;

    constructor(
        optionsList: ContainerizedServerOptions[] = []
    ) {
        for (const options of optionsList) this.addAndStart(options);

        for (const SIGNAL of NodeblockServer.SIGNALS) {
            process.once(SIGNAL, async () => {
                const entries = Object.values(this._servers);

                if (entries.length !== 0) {
                    Log.info(`Stopping ${entries.length} nodeblock instances`);
                    await Promise.all(entries.map(entry => entry.server.stop()));
                }

                if (this._webServer) {
                    Log.info("Stopping webserver");
                    // BUG not stopping
                    await this._webServer.stop();
                }

                // TODO netserverprovider keeps track of all opened servers + ports, we can use this to track if all servers are closed
                const improperShutdown = false;
                if (improperShutdown) {
                    Log.info("Improper shutdown detected!");
                } else {
                    Log.info("Bye!");
                }
            });
        }
    }

    private async _startWithPortProtection(port: number, starter: Function) {
        const portWatcher = new PortWatcher(port);

        if (await portWatcher.check()) {
            starter();
        } else {
            Log.warn(`Waiting for port :${port} availability...`);
            await portWatcher.waitForFree()
                .then(() => starter())
                .catch(() => Log.error(`Couldn't start server on :${port}, port in use`));
        }
    }

    public attachWeb(port: number) {
        if (this._webServer) throw new Error("A webserver is already attached");
        this._webServer = new WebServer();
        this._startWithPortProtection(port, () => this._webServer!.start(port));
        return this._webServer;
    }
    
    public attachDefaultWebMonitor(port: number) {
        if (this._webServer) throw new Error("A webserver has already been attached");
        this.attachMonitor(new WebMonitor(this, this.attachWeb(port)));
        return this;
    }

    public attachMonitor(monitor: ServerGroupMonitor) {
        this._monitor = monitor;
        for (const id in this._servers) {
            const server = this._servers[id].server;
            server.monitor = monitor;
            monitor.initializeEvents(server);
        }
    }

    public add(options: ContainerizedServerOptions): NodeblockServer {
        const instance = new NodeblockServer(options.folderName ?? options.name, options, this._monitor)
            .dontHandleNodeSignalsGracefully();
        this._servers[instance.id.toString()] = { name: options.name, server: instance }
        return instance;
    }
    public addAndStart(options: ContainerizedServerOptions): NodeblockServer {
        const server = this.add(options);
        this._startWithPortProtection(server.port, () => server.start());
        return server;
    }

    public async stopIf(condition: (server: ServerEntry) => boolean) {
        Promise.all(Object.values(this._servers).filter(condition).map(entry => entry.server.stop()));
    }
    public async stopAll() { await this.stopIf(() => true); }

    public startIf(condition: (server: ServerEntry) => boolean) {
        Object.values(this._servers).filter(condition).forEach(entry => this._startWithPortProtection(entry.server.port, () => entry.server.start()));
    }
    public startAll() { this.startIf(() => true); }

    public get(id: string): ServerEntry | undefined { return this._servers[id]; }

    public get servers() { return Object.values(this._servers); }
}

export abstract class ServerGroupMonitor {
    constructor(
        public readonly group: NodeblockServerGroup
    ) {}

    public abstract initializeEvents(server: NodeblockServer): void;
    public abstract incomingRaw(server: NodeblockServer, chunk: Uint8Array): void;
    public abstract outgoingPacket(server: NodeblockServer, packet: ClientboundPacket): void;
    public abstract incomingPacket(server: NodeblockServer, size: number, packetID: number, data: Uint8Array): void;
}

export type WebMonitorRequestHandler = (req: API.Request<API.Type.ServerList>, group: NodeblockServerGroup) => API.Response<any> | null;

export class WebMonitor extends ServerGroupMonitor {
    private _websocketServer: WebsocketServer;

    constructor(
        container: NodeblockServerGroup,
        private _webserver: WebServer
    ) {
        super(container);

        this._websocketServer = this._webserver.useWebsocket("/");

        this._websocketServer.onopen = connection => {
            connection.on("message", async message => {
                let request: API.Request<API.Type>;
                try {
                    if (typeof message !== "string") throw new Error();
                    request = JSON.parse(message);
                } catch (error) {
                    Log.error(error);
                    connection.close(1006, "Abnormal payload");
                    return;
                }

                this._handleRequest(request).then(response => {
                    if (!response) return;
                    connection.send(JSON.stringify(response));
                }).catch(error => {
                    if (error instanceof UnknownAPIDataTypeError) {
                        connection.close(1006, "Unknown datatype: " + request.datatype);
                    } else {
                        Log.error(error);
                    }
                });
            });

            connection.on("error", Log.error);
        }
    }

    private async _handleRequest(req: API.Request<API.Type>): Promise<API.Response<API.Type> | null> {
        switch (req.datatype) {
            case API.Type.ServerList:
                return ServerListHandler(req as any, this.group);
            case API.Type.StateChange:
                return ServerStateHandler(req as any, this.group);
            default: {
                throw new UnknownAPIDataTypeError();
            }
        }
    }

    public initializeEvents(server: NodeblockServer) {
        const stateChange = () => this.broadcast(API.Type.StateChange, {
            "id": server.id.toString(),
            "players": [ server.playerCount, server.maxPlayers ],
            "state": server.state
        });

        server.on("playeradd", stateChange);
        server.on("playerleave", stateChange);
        server.on("statechange", stateChange);
    }

    public incomingPacket() {}
    public incomingRaw() {}
    public outgoingPacket() {}

    public broadcast<T extends API.Type>(type: T, data: API.Response<T>["data"], success: boolean = true) {
        this._websocketServer.broadcast(JSON.stringify({ "datatype": type, data, success }));
    }
}