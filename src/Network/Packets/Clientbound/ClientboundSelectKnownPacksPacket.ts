import { PackDefinition } from "@/Network/NodeblockServer";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundSelectKnownPacksPacket extends ClientboundPacket {
    constructor(
        public packs: PackDefinition[]
    ) {
        super(0x0e);
    }

    public override write(): void {
        this.writePrefixedArray(this.packs.length, i =>
            this.writeString(this.packs[i].namespace)
                .writeString(this.packs[i].id)
                .writeString(this.packs[i].version)
        );
    }
}