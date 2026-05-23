import { ServerboundPacket } from "@/Network/Packet";

export enum HandshakeIntent {
    STATUS = 1,
    LOGIN = 2,
    TRANSFER = 3
}

export default class ServerboundIntentionPacket extends ServerboundPacket {
    constructor(
        public protocolVersion: number,
        public serverAddress: string,
        public serverPort: number,
        public intent: HandshakeIntent
    ) {
        super(0x0);
    }
}