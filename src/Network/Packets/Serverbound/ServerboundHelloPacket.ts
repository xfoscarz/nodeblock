import UUID from "@/Minecraft/UUID";
import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundHelloPacket extends ServerboundPacket {
    constructor(
        public name: string,
        public uuid: UUID
    ) {
        super(0x0);
    }
}
