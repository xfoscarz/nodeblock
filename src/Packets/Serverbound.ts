import { Identifier } from "../Minecraft/identifier";
import UUID from "../Minecraft/uuid";
import { Packet } from "./Packet";

export class HandshakePacket extends Packet {
    constructor(
        public protocolVersion: number,
        public serverAddress: string,
        public serverPort: number,
        public intent: HandshakeIntent
    ) {
        super(0x0);
    }
}

export enum HandshakeIntent {
    STATUS = 1,
    LOGIN = 2,
    TRANSFER = 3
}

export class StatusRequestPacket extends Packet {
    constructor() {
        super(0x0);
    }
}

export class PingRequestPacket extends Packet {
    constructor(
        public timestamp: number
    ) {
        super(0x1);
    }
}

export class LoginStartPacket extends Packet {
    constructor(
        public name: string,
        public uuid: UUID
    ) {
        super(0x0);
    }
}

export class LoginAcknowledged extends Packet {
    constructor() {
        super(0x3);
    }
}

export class ServerboundPluginMessagePacket extends Packet {
    constructor(
        public channel: Identifier,
        public data: Uint8Array
    ) {
        super(0x2);
    }
}

export class ServerboundKeepAliveConfigurationPacket extends Packet {
    constructor(
        public keepAliveID: number
    ) {
        super(0x4);
    }
}

export enum ClientInformationChatMode {
    ENABLED = 0,
    COMMANDS_ONLY = 1,
    HIDDEN = 2
}
export enum ClientInformationDisplayedSkinPartsFlags {
    CAPE             = 0b0000001,
    JACKET           = 0b0000010,
    LEFT_SLEEVE      = 0b0000100,
    RIGHT_SLEEVE     = 0b0001000,
    LEFT_PANTS_LEG   = 0b0010000,
    RIGHT_PANTS_LEG  = 0b0100000,
    HAT              = 0b1000000
}
export enum ClientInformationMainhand {
    LEFT = 0,
    RIGHT = 1
}
export enum ClientInformationParticleStatus {
    ALL = 0,
    DECREASED = 1,
    MINIMAL = 2
}
export class ClientInformationPacket extends Packet {
    constructor(
        public locale: string,
        public viewDistance: number,
        public chatMode: ClientInformationChatMode,
        public chatColors: boolean,
        public displayedSkinParts: number,
        public mainHand: ClientInformationMainhand,
        public enableTextFiltering: boolean,
        public allowServerListings: boolean,
        public particleStatus: ClientInformationParticleStatus
    ) {
        super(0x0);
    }
}

export class AcknowledgeFinishConfiguration extends Packet {
    constructor() {
        super(0x3);
    }
}

export class ServerboundKeepAlivePlayPacket extends Packet {
    constructor(
        public keepAliveID: number
    ) {
        super(0x1b);
    }
}