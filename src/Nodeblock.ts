import { NodeblockServer, ServerOptions, ServerState } from "@/Network/NodeblockServer";
import { ClientboundPacket } from "@/Network/Packet";
import { PortWatcher } from "@/PortWatcher";
import WebServer from "@/WebPanel/WebServer";
import { API, UnknownAPIDataTypeError } from "@shared/API";
import { ListItem } from "@shared/Util";

type ContainerizedServerOptions = ServerOptions & { name: string, port: number, folderName?: string };
type ServerEntry = { server: NodeblockServer, name: string };

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
                    console.log(`[${process.pid}] Stopping ${entries.length} nodeblock instances`);
                    await Promise.all(entries.map(entry => entry.server.stop()));
                }

                if (this._webServer) {
                    console.log(`[${process.pid}] Stopping webserver`);
                    await this._webServer.stop();
                }

                process.exit(0);
            });
        }
    }

    private async _startWithPortProtection(port: number, starter: Function) {
        const portWatcher = new PortWatcher(port);

        if (await portWatcher.check()) {
            starter();
        } else {
            console.log(`Waiting for port :${port} availability...`);
            await portWatcher.waitForFree()
                .then(() => starter())
                .catch(() => console.error(`Couldn't start server on :${port}, port in use`));
        }
    }

    public attachWeb(port: number) {
        if (this._webServer) throw new Error("A webserver is already attached");
        this._webServer = new WebServer();
        this._startWithPortProtection(port, () => this._webServer!.start(port));
        return this._webServer;
    }
    
    public attachDefaultWebMonitor() {
        this.attachMonitor(new WebMonitor(this, this._webServer!));
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

export class WebMonitor extends ServerGroupMonitor {
    constructor(
        container: NodeblockServerGroup,
        private _webserver: WebServer
    ) {
        super(container);

        this._webserver.on("websocketopen", connection => {
            connection.on("message", async message => {
                let request: API.Request<API.Type>;
                try {
                    if (typeof message !== "string") throw new Error();
                    request = JSON.parse(message);
                } catch (error) {
                    console.error(error);
                    connection.close(1006, "Abnormal payload");
                    return;
                }

                this._handleRequest(request).then(response => {
                    connection.send(JSON.stringify(response));
                }).catch(error => {
                    if (error instanceof UnknownAPIDataTypeError) {
                        connection.close(1006, "Unknown datatype: " + request.datatype);
                    } else {
                        console.error(error);
                    }
                });
            });

            connection.on("error", console.error);
        });
    }

    private async _handleRequest(req: API.Request<API.Type>): Promise<API.Response<API.Type>> {
        switch (req.datatype) {
            case API.Type.ServerList: {
                const request = req as API.Request<API.Type.ServerList>;
                let response: API.Response<API.Type.ServerList>["data"] = {
                    "servers": []
                }
                const mapper: (entry: ServerEntry) => ListItem<API.Response<API.Type.ServerList>["data"]["servers"]> = ({ name, server }) => ({
                    "id": server.id.toString(),
                    "name": name,
                    "state": server.state,
                    "players": [ server.playerCount, server.maxPlayers ],
                    "port": server.port,
                    "favicon": server.favicon,
                    "motd": server.motd
                });

                const sortBy = "name" as "name" | "id" | "port" | "state" | "players";
                const orderBy = "asc" as "asc" | "desc";

                const sorted = [ ...this.group.servers ];

                switch (sortBy) {
                    case "name": {
                        sorted.sort((a, b) => a.name.localeCompare(b.name));
                        break;
                    }
                    case "id": {
                        sorted.sort((a, b) => a.server.id.toString(false).localeCompare(b.server.id.toString(false)));
                        break;
                    }
                    case "players": {
                        sorted.sort((a, b) => (a.server.playerCount - b.server.playerCount) || (a.server.maxPlayers - b.server.maxPlayers));
                        break;
                    }
                    case "port": {
                        sorted.sort((a, b) => a.server.port - b.server.port);
                        break;
                    }
                    case "state": {
                        const stateWeight = {
                            [ServerState.OFFLINE]: 0,
                            [ServerState.STOPPING]: 1,
                            [ServerState.STARTING]: 2,
                            [ServerState.ONLINE]: 3
                        };
                        sorted.sort((a, b) => stateWeight[a.server.state] - stateWeight[b.server.state]);
                        break;
                    }
                }
                
                if (orderBy == "desc") sorted.reverse();

                if (request.data.pagination) {
                    let { count, page } = request.data.pagination;

                    page = Math.max(0, page);

                    if ((count * page) > sorted.length) {
                        response.servers = [];
                    } else {
                        response.servers = sorted.slice(count * page, count * page + count).map(mapper);
                    }
                    response.pagination = { pages: Math.ceil(sorted.length / count) }
                } else {
                    response.servers = sorted.map(mapper);
                    response.pagination = { pages: 1 }
                }
                return { "datatype": API.Type.ServerList, "data": response, "success": true };
            }
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
        server.on("playerremove", stateChange);
        server.on("statechange", stateChange);
    }

    public incomingPacket() {}
    public incomingRaw() {}
    public outgoingPacket() {}

    public broadcast<T extends API.Type>(type: T, data: API.Response<T>["data"], success: boolean = true) {
        this._webserver.websocketBroadcast(JSON.stringify({ "datatype": type, data, success }));
    }
}