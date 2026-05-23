import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundPlayKeepAlivePacket extends ServerboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x1b);
    }
}