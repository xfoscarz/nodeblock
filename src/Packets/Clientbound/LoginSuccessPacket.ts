import GameProfile from "../../Minecraft/gameProfile";
import { ClientboundPacket } from "../Packet";

export default class LoginSuccessPacket extends ClientboundPacket {
    constructor(
        public gameProfile: GameProfile
    ) {
        super(0x2);
    }

    public override write(): void {
        this.writeGameProfile(this.gameProfile);
    }
}