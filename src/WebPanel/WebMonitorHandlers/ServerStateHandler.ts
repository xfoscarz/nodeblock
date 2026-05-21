import { NodeblockServerGroup } from "@/Nodeblock";
import { API } from "@shared/API";

const handler = (req: API.Request<API.Type.StateChange>, group: NodeblockServerGroup) => {
    const serverID = req.data.id;
    const entry = group.get(serverID);

    if (!entry) return null;

    if (entry.server.online) {
        entry.server.stop();
    } else if (entry.server.offline) {
        entry.server.start();
    }
    
    return null;
}

export default handler;