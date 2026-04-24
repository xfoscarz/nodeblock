import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundKeepAlivePlayPacket extends ServerboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x1b);
    }
}