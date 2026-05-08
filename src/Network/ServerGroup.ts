import Server, { ServerOptions } from "@/Network/Server";
import { ListOfAtLeastOne } from "@/Util";

export default class ServerGroup {
    private readonly servers: Record<string, Server> = {};

    constructor(serverOptions: ListOfAtLeastOne<Omit<ServerOptions, "web"> & { "name": string }>) {
        for (const options of serverOptions) {
            this.servers[options.name] = new Server(options);
        }
    }
}