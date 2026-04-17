import { TextComponentNBT } from "../../Minecraft/NBT/textComponent";
import { ClientboundPacket } from "../Packet";
import nbt from "prismarine-nbt";

export default class DisconnectConfigurationPacket extends ClientboundPacket {
    constructor(
        public reason: string // BUG no text component for now
    ) {
        super(0x2);
    }

    public override write(): void {
        const data = nbt.comp({
            "text": nbt.string(this.reason),
            "color": nbt.string("red")
        });
        this.writeNBT(data);
    }
}