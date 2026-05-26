import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundAcceptTeleportation extends ServerboundPacket {
    constructor(
        public teleportID: number
    ) {
        super(0x0);
    }
}