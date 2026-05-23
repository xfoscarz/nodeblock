import { Identifier } from "@/Minecraft/Identifier";
import { BufferedWriter } from "@/Network/BufferedIO";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundCustomPayloadPacket extends ClientboundPacket {
    private _writer = new BufferedWriter();

    private constructor(
        public channel: Identifier,
        data: Uint8Array
    ) {
        super(1);
        this._writer.writeBytes(data);
    }

    public override write(): void {
        this.writeIdentifier(this.channel);
        this.writeBytes(this._writer.buffer);
    }

    public static brand(brand: string): ClientboundCustomPayloadPacket {
        const writer = new BufferedWriter().writeString(brand);
        return new ClientboundCustomPayloadPacket(Identifier.ofVanilla("brand"), writer.buffer)
    }

    public static raw(channel: Identifier, data: Uint8Array = new Uint8Array()) {
        return new ClientboundCustomPayloadPacket(channel, data);
    }
}