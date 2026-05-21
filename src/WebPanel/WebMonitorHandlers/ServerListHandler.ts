import { ServerState } from "@/Network/NodeblockServer";
import { NodeblockServerGroup, ServerEntry, WebMonitorRequestHandler } from "@/Nodeblock";
import { API } from "@shared/API";
import { ListItem } from "@shared/Util";

const handler: WebMonitorRequestHandler = (req: API.Request<API.Type.ServerList>, group: NodeblockServerGroup) => {
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
        "motd": server.motd,
        "protocols": server.minecraftVersions,
        "software": server.softwareName
    });

    const sortBy = "name" as "name" | "id" | "port" | "state" | "players";
    const orderBy = "asc" as "asc" | "desc";

    const sorted = [ ...group.servers ];

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

    if (req.data.pagination) {
        let { count, page } = req.data.pagination;

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
export default handler;