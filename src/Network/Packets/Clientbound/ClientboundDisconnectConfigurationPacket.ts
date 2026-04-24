import { NBT } from "@/Minecraft/NBT";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundDisconnectConfigurationPacket extends ClientboundPacket {
    constructor(
        public reason: string // BUG no text component for now
    ) {
        super(0x2);
    }

    public override write(): void {
        const data = NBT.compound({
            "text": NBT.string("red"),
            "color": NBT.string("red")
        });
        this.writeNBT(data);
    }
}