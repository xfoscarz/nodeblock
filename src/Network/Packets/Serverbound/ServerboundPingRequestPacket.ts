import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundPingRequestPacket extends ServerboundPacket {
    constructor(
        public timestamp: bigint
    ) {
        super(0x1);
    }
}