import GameProfile from "@/Minecraft/GameProfile";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundLoginFinishedPacket extends ClientboundPacket {
    constructor(
        public gameProfile: GameProfile
    ) {
        super(0x2);
    }

    public override write(): void {
        this.writeGameProfile(this.gameProfile);
    }
}