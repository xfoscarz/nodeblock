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
        }

        public attachWebPanel(port: number) {
            this._webServer = new WebServer();
            this._webMonitor.attachServer(this._webServer);
            this._webServer.start(port);
        }

        public add(options: ContainerizedServerOptions): NodeblockServer {
            return this._servers[options.name] = new NodeblockServer(options.folderName ?? options.name, options, this._webMonitor);
        }
        public addAndStart(options: ContainerizedServerOptions): NodeblockServer {
            const server = this.add(options);
            server.start();
            return server;
        }

        public stopIf(condition: (serevr: NodeblockServer) => boolean) {
            Object.values(this._servers).filter(condition).forEach(server => server.stop());
        }
        public stopAll() { this.stopIf(() => true); }

        public startIf(condition: (server: NodeblockServer) => boolean) {
            Object.values(this._servers).filter(condition).forEach(server => server.start());
        }
        public startAll() { this.startIf(() => true); }
    }
}

export default Nodeblock;