import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundFinishConfigurationPacket extends ServerboundPacket {
    constructor() {
        super(0x3);
    }
}