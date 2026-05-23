import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundPlayKeepAlivePacket extends ClientboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x2b);
    }

    public override write(): void {
        this.writeLong(this.keepAliveID);
    }
}