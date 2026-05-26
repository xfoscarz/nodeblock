import { Identifier } from "@/Minecraft/Identifier";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundUpdateTagsPacket extends ClientboundPacket {
    constructor() {
        super(0x0d);
    }

    public override write(): void {
        this.writePrefixedArray(1, () => {
            this.writeIdentifier("timeline")
                .writePrefixedArray(1, () => {
                    this.writeIdentifier("in_overworld");
                    this.writePrefixedArray(4, i => this.writeVarInt([ 3, 0, 1, 2 ][i]));
                })
        });
    }
}