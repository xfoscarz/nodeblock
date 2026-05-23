import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundConfigurationKeepAlivePacket extends ServerboundPacket {
    constructor(
        public keepAliveID: bigint
    ) {
        super(0x4);
    }
}