import { ClientboundPacket } from "../Packet";

export default class FinishConfigurationPacket extends ClientboundPacket {
    constructor() {
        super(0x3);
    }

    public override write(): void {
    }
}