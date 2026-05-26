import { NBT } from "@/Minecraft/NBT";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundConfigurationDisconnectPacket extends ClientboundPacket {
    constructor(
        public reason: string // BUG no text component for now
    ) {
        super(0x2);
    }

    public override write(): void {
        const data = NBT.compound({
            "text": NBT.string(this.reason),
            "color": NBT.string("red")
        });
        this.writeNBT(data);
    }
}