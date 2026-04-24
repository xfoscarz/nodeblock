import { NBT } from "@/Minecraft/NBT";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundDisconnectPlayPacket extends ClientboundPacket {
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