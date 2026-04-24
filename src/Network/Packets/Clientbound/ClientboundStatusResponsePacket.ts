import { ClientboundPacket } from "@/Network/Packet";

export type StatusResponseData = {
    version: {
        name: string;
        protocol: number;
    };
    players: {
        max: number;
        online: number;
        sample?: {
            name: string;
            id: string;
        }[]
    };
    description?: {
        text: string;
    };
    favicon?: string;
    enforcesSecureChat?: boolean;
};

export default class ClientboundStatusResponsePacket extends ClientboundPacket {
    public version: StatusResponseData["version"];
    public players: StatusResponseData["players"];
    public description: StatusResponseData["description"];
    public favicon: string = "";
    public enforcesSecureChat: false = false;

    constructor(options: StatusResponseData) {
        super(0x0);
        this.version = options.version;
        this.players = options.players;
        this.description = options.description || { "text": "A nodeblock server" }
        this.favicon = options.favicon || "";
    }

    public override write(): void {
        const data: Record<string, any> = {
            version: this.version,
            players: this.players,
            description: this.description,
            enforcesSecureChat: this.enforcesSecureChat
        };
        if (this.favicon) {
            data["favicon"] = "data:image/png;base64," + this.favicon;
        }
        this.writeString(JSON.stringify(data));
    }
}