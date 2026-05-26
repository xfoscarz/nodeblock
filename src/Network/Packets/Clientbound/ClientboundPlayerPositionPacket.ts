import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundPlayerPositionPacket extends ClientboundPacket {
    constructor(
        public teleportID: number,
        public x: number,
        public y: number,
        public z: number,
        public velocityX: number,
        public velocityY: number,
        public velocityZ: number,
        public yaw: number,
        public pitch: number,
        public flags: number
    ) {
        super(0x46);
    }

    public override write(): void {
        this.writeVarInt(this.teleportID)
            .writeDouble(this.x)
            .writeDouble(this.y)
            .writeDouble(this.z)
            .writeDouble(this.velocityX)
            .writeDouble(this.velocityY)
            .writeDouble(this.velocityZ)
            .writeFloat(this.yaw)
            .writeFloat(this.pitch)
            .writeTeleportFlags(this.flags);
    }
}