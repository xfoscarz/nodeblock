import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundKeepAliveConfigurationPacket extends ClientboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x4);
    }

    public override write(): void {
        this.writeLong(this.keepAliveID);
    }
}