import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundStatusRequestPacket extends ServerboundPacket {
    constructor() {
        super(0x0);
    }
}