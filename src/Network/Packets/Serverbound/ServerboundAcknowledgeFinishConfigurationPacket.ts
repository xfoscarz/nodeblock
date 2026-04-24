import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundAcknowledgeFinishConfigurationPacket extends ServerboundPacket {
    constructor() {
        super(0x3);
    }
}