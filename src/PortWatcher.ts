import { serverPortListener } from "@/NetServerProvider";
import net, { Server } from "node:net";

export class PortWatcher {
    constructor(
        public readonly port: number
    ) {}

    public check(): Promise<boolean> {
        const server = new net.Server();
        return new Promise(res => {
            server.on("error", () => res(false));
            serverPortListener(server, this.port, () => server.close(() => res(true)));
        });
    }

    public waitForFree(timeout: number = 30_000): Promise<void> {
        return new Promise(async (res, rej) => {
            if (await this.check()) return res();

            const poller = setInterval(async () => {
                if (await this.check()) {
                    clearInterval(poller);
                    clearTimeout(timeoutProcess);
                    res();
                }
            }, 1000);

            const timeoutProcess = setTimeout(() => {
                clearInterval(poller);
                rej();
            }, timeout);
        });
    }
}