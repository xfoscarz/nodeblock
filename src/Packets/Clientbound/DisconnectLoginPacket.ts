import { ClientboundPacket } from "../Packet"

export default class DisconnectLoginPacket extends ClientboundPacket {
    constructor(
        public reason: string // BUG no text component for now
    ) {
        super(0x0);
    }

    public override write(): void {
        this.writeString(JSON.stringify(this.reason));
    }
}