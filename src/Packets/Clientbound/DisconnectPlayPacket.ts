import { ClientboundPacket } from "../Packet";
import nbt from "prismarine-nbt";

export default class DisconnectPlayPacket extends ClientboundPacket {
    constructor(
        public reason: string
    ) {
        super(0x20);
    }

    public override write(): void {
        const data = nbt.comp({
            "text": nbt.string(this.reason),
            "color": nbt.string("red")
        });
        this.writeNBT(data);
    }
}