import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundDisconnectLoginPacket extends ClientboundPacket {
    constructor(
        public reason: string // BUG no text component for now
    ) {
        super(0x0);
    }

    public override write(): void {
        this.writeString(JSON.stringify(this.reason));
    }
}