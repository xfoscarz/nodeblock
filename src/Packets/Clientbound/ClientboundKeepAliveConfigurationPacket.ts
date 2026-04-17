import { ClientboundPacket } from "../Packet";

export default class ClientboundKeepAliveConfigurationPacket extends ClientboundPacket {
    constructor(
        public keepAliveID: number
    ) {
        super(0x4);
    }

    public override write(): void {
        this.writeLong(this.keepAliveID);
    }
}