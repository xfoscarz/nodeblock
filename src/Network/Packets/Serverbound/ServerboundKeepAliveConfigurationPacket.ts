import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundKeepAliveConfigurationPacket extends ServerboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x4);
    }
}