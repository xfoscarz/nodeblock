import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundClientTickEndPacket extends ServerboundPacket {
    constructor() {
        super(0xc);
    }
}