import { Identifier } from "../../Minecraft/Identifier";
import { ClientboundPacket } from "../Packet";

export default class FeatureFlagsPacket extends ClientboundPacket {
    constructor(
        public features: Identifier[]
    ) {
        super(0x0C);
    }

    public override write(): void {
        this.writePrefixedArray(this.features.length, i => this.writeIdentifier(this.features[i]));
    }
}