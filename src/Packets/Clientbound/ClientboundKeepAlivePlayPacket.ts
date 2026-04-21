import { ClientboundPacket } from "../Packet";

export default class ClientboundKeepAlivePlayPacket extends ClientboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x2b);
    }

    public override write(): void {
        this.writeLong(this.keepAliveID);
    }
}