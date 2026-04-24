import { Identifier } from "@/Minecraft/Identifier";
import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundServerboundPluginMessagePacket extends ServerboundPacket {
    constructor(
        public channel: Identifier,
        public data: Uint8Array
    ) {
        super(0x2);
    }
}