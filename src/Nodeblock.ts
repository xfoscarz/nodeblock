import { NodeblockServer, ServerOptions } from "@/Network/NodeblockServer";
import WebServer, { WebMonitor } from "@/WebPanel/WebServer";

type ContainerizedServerOptions = ServerOptions & { name: string, port: number, folderName?: string };

namespace Nodeblock {
    export class ServerContainer {
        private _webMonitor: WebMonitor = new WebMonitor();
        private _servers: Record<string, NodeblockServer> = {};
        private _webServer?: WebServer;

        constructor(
            optionsList: ContainerizedServerOptions[] = []
        ) {
            for (const options of optionsList) this.addAndStart(options);

            for (const SIGNAL of NodeblockServer.SIGNALS) {
                process.once(SIGNAL, async () => {
                    const instances = Object.values(this._servers);
                    if (instances.length !== 0) {
                        console.log(`Stopping ${instances.length} nodeblock instances`);
                        await Promise.all(instances.map(server => server.stop()))
                    }
                    
                    if (this._webServer) {
                        console.log("Stopping webserver");
                        await this._webServer.stop();
                    }

                    process.removeAllListeners(SIGNAL);
                    process.kill(process.pid, SIGNAL);
                });
            }
        }

        public attachWeb(port: number) {
            this._webServer = new WebServer();
            this._webMonitor.attachServer(this._webServer);
            this._webServer.start(port);
            return this._webServer;
        }

        public add(options: ContainerizedServerOptions): NodeblockServer {
            return this._servers[options.name] = new NodeblockServer(options.folderName ?? options.name, options, this._webMonitor).dontHandleNodeSignalsGracefully();
        }
        public addAndStart(options: ContainerizedServerOptions): NodeblockServer {
            const server = this.add(options);
            server.start();
            return server;
        }

        public async stopIf(condition: (serevr: NodeblockServer) => boolean) {
            Promise.all(Object.values(this._servers).filter(condition).map(server => server.stop()));
        }
        public async stopAll() { await this.stopIf(() => true); }

        public startIf(condition: (server: NodeblockServer) => boolean) {
            Object.values(this._servers).filter(condition).forEach(server => server.start());
        }
        public startAll() { this.startIf(() => true); }
    }
}

export default Nodeblock;