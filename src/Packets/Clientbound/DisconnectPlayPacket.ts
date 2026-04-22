import { NBT } from "../../Minecraft/NBT/nbt";
import { ClientboundPacket } from "../Packet";

export default class DisconnectPlayPacket extends ClientboundPacket {
    constructor(
        public reason: string
    ) {
        super(0x20);
    }

    public override write(): void {
        const data = NBT.compound({
            "text": NBT.string(this.reason),
            "color": NBT.string("red")
        });
        this.writeNBT(data);
    }
}