import { ServerboundPacket } from "@/Network/Packet";

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
export default class ServerboundClientInformationPacket extends ServerboundPacket {
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