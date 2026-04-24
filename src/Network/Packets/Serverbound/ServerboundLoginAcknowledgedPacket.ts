import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundLoginAcknowledgedPacket extends ServerboundPacket {
    constructor() {
        super(0x3);
    }
}