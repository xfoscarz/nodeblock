import { ServerboundPacket } from "@/Network/Packet";

export default class ServerboundMovePlayerPosRotPacket extends ServerboundPacket {
    constructor(
        public x: number,
        public feetY: number,
        public z: number,
        public yaw: number,
        public pitch: number,
        public flags: number
    ) {
        super(0x1e);
    }
}