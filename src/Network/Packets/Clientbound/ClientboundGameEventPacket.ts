import { ClientboundPacket } from "@/Network/Packet";

export enum GameEvent {
    RESPAWN_OBSTRUCTED = 0,
    RAIN_BEGIN = 1,
    RAIN_END = 2,
    GAME_MODE = 3,
    WIN_GAME = 4,
    DEMO_EVENT = 5,
    ARROW_HIT_PLAYER = 6,
    RAIN_LEVEL = 7,
    THUNDER_LEVEL = 8,
    PUFFERFISH_STING = 9,
    ELDER_GUARDIAN_CURSE = 10,
    RESPAWN_SCREEN = 11,
    LIMITED_CRAFTING = 12,
    START_WAITING_CHUNKS = 13
}

type GameEventData = {
    [GameEvent.RESPAWN_OBSTRUCTED]: [];
    [GameEvent.RAIN_BEGIN]: [];
    [GameEvent.RAIN_END]: [];
    [GameEvent.GAME_MODE]: [ 0 | 1 | 2 | 3 ]; // TODO gamemode
    [GameEvent.WIN_GAME]: [ 0 | 1 ];
    [GameEvent.DEMO_EVENT]: [ 0 | 101 | 102 | 103 | 104 ];
    [GameEvent.ARROW_HIT_PLAYER]: [];
    [GameEvent.RAIN_LEVEL]: [ number ];
    [GameEvent.THUNDER_LEVEL]: [ number ];
    [GameEvent.PUFFERFISH_STING]: [];
    [GameEvent.ELDER_GUARDIAN_CURSE]: [];
    [GameEvent.RESPAWN_SCREEN]: [ 0 | 1 ];
    [GameEvent.LIMITED_CRAFTING]: [ 0 | 1 ];
    [GameEvent.START_WAITING_CHUNKS]: [];
}

export default class ClientboundGameEventPacket<T extends GameEvent> extends ClientboundPacket {
    constructor(
        gameEvent: T,
        data?: GameEventData[T][0]
    );
    constructor(
        public gameEvent: number,
        public data?: number
    ) {
        super(0x26);
    }

    public override write(): void {
        this.writeUnsignedByte(this.gameEvent);
        if (this.data) this.writeFloat(this.data);
    }
}