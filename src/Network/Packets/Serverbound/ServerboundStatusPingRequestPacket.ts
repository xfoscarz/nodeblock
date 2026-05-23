import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundStatusPingRequestPacket extends ServerboundPacket {
    constructor(
        public timestamp: bigint
    ) {
        super(0x1);
    }
}