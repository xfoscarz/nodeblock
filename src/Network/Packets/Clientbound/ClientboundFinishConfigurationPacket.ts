import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundFinishConfigurationPacket extends ClientboundPacket {
    constructor() {
        super(0x3);
    }

    public override write(): void {
    }
}