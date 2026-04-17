import { ClientboundPacket } from "../Packet";

export default class PongResponsePacket extends ClientboundPacket {
    constructor(
        public timestamp: number
    ) {
        super(0x1);
    }

    public override write(): void {
        this.writeLong(this.timestamp);
    }
}