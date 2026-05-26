import { PackDefinition } from "@/Network/NodeblockServer";
import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundSelectKnownPacksPacket extends ServerboundPacket {
    constructor(
        public packs: PackDefinition[]
    ) {
        super(0x07);
    }
}