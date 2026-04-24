import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundPongResponsePacket extends ClientboundPacket {
    constructor(
        public timestamp: bigint
    ) {
        super(0x1);
    }

    public override write(): void {
        this.writeLong(this.timestamp);
    }
}