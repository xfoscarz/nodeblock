import { NBT } from "@/Minecraft/NBT";
import { TextComponent } from "@/Minecraft/Types/primitives/textComponent";
import UUID from "@/Minecraft/UUID";
import { ClientboundPacket } from "@/Network/Packet";

export enum PlayerAction {
    ADD_PLAYER = 0x01,
    INITIALIZE_CHAT = 0x02,
    UPDATE_GAME_MODE = 0x04,
    UPDATE_LISTED = 0x08,
    UPDATE_LATENCY = 0x010,
    UPDATE_DISPLAY_NAME = 0x20,
    UPDATE_LIST_PRIORITY = 0x40,
    UPDATE_HAT = 0x80
}

type PlayerActionData = {
    [PlayerAction.ADD_PLAYER]: { addPlayer: { name: string, properties: Record<string, { value: string, signature?: string }> } },
    [PlayerAction.INITIALIZE_CHAT]: { initializeChat?: { chatSessionID: UUID, expiry: bigint | number, publicKey: Uint8Array, signature: Uint8Array } },
    [PlayerAction.UPDATE_GAME_MODE]: { updateGamemode: { gamemode: number } },
    [PlayerAction.UPDATE_LISTED]: { updateListed: { listed: boolean } },
    [PlayerAction.UPDATE_LATENCY]: { updateLatency: { millis: number } },
    [PlayerAction.UPDATE_DISPLAY_NAME]: { updateDisplayName?: { displayName: NBT.Compound } },
    [PlayerAction.UPDATE_LIST_PRIORITY]: { updateListPriority: { listPriority: number } },
    [PlayerAction.UPDATE_HAT]: { updateHat: { visible: boolean } }
}

type CombinedPlayerActionData<T extends PlayerAction> = 
    (
        T extends any
            ? (x: PlayerActionData[T]) => void
            : never
    ) extends (x: infer I) => void
        ? I
        : never


export default class ClientboundPlayerInfoUpdatePacket<const T extends readonly PlayerAction[]> extends ClientboundPacket {
    private _actions: Map<UUID, CombinedPlayerActionData<T[number]>> = new Map();

    constructor(
        public actions: T
    ) {
        super(0x44);
    }
    
    public add(uuid: UUID, data: CombinedPlayerActionData<T[number]>): this {
        this._actions.set(uuid, data);
        return this;
    }
    
    public override write(): void {
        const enumset = this.actions.reduce((prev, action) => prev | action, 0);
        const entries = this._actions.keys().toArray();
        
        this.writeByte(enumset).writePrefixedArray(entries.length, i => {
            const uuid = entries[i];
            const data = this._actions.get(uuid)! as any;

            this.writeUUID(uuid);

            for (const action of this.actions.toSorted((a, b) => a - b)) {
                switch (action) {
                    case PlayerAction.ADD_PLAYER:
                        const { addPlayer } = data as PlayerActionData[PlayerAction.ADD_PLAYER];
                        this.writeString(addPlayer.name);

                        const keys = Object.keys(addPlayer.properties);
                        this.writePrefixedArray(keys.length, i => {
                            const key = keys[i];
                            const { value, signature } = addPlayer.properties[key];
                            this.writeString(value)
                                .writePrefixedOptional(!!signature, () => this.writeString(signature!));
                        });
                        break;
                    case PlayerAction.INITIALIZE_CHAT:
                        const { initializeChat } = data as PlayerActionData[PlayerAction.INITIALIZE_CHAT];
                        this.writePrefixedOptional(!!initializeChat, () => {
                            this.writeUUID(initializeChat!.chatSessionID)
                                .writeLong(initializeChat!.expiry)
                                .writePrefixedArray(initializeChat!.publicKey.byteLength, i => this.writeByte(initializeChat!.publicKey[i]))
                                .writePrefixedArray(initializeChat!.signature.byteLength, i => this.writeByte(initializeChat!.signature[i]))
                        });
                        break;
                    case PlayerAction.UPDATE_GAME_MODE:
                        const { updateGamemode } = data as PlayerActionData[PlayerAction.UPDATE_GAME_MODE];
                        this.writeVarInt(updateGamemode.gamemode);
                        break;
                    case PlayerAction.UPDATE_LISTED:
                        const { updateListed } = data as PlayerActionData[PlayerAction.UPDATE_LISTED];
                        this.writeBoolean(updateListed.listed);
                        break;
                    case PlayerAction.UPDATE_LATENCY:
                        const { updateLatency } = data as PlayerActionData[PlayerAction.UPDATE_LATENCY];
                        this.writeVarInt(updateLatency.millis);
                        break;
                    case PlayerAction.UPDATE_DISPLAY_NAME:
                        const { updateDisplayName } = data as PlayerActionData[PlayerAction.UPDATE_DISPLAY_NAME];
                        this.writePrefixedOptional(!!updateDisplayName, () => this.writeNBT(updateDisplayName!.displayName));
                        break;
                    case PlayerAction.UPDATE_LIST_PRIORITY:
                        const { updateListPriority } = data as PlayerActionData[PlayerAction.UPDATE_LIST_PRIORITY];
                        this.writeVarInt(updateListPriority.listPriority);
                        break;
                    case PlayerAction.UPDATE_HAT:
                        const { updateHat } = data as PlayerActionData[PlayerAction.UPDATE_HAT];
                        this.writeBoolean(updateHat.visible);
                        break;
                }
            }
        });
    }
}

new ClientboundPlayerInfoUpdatePacket([ PlayerAction.ADD_PLAYER, PlayerAction.UPDATE_HAT ])
    .add(new UUID(), {
        "addPlayer": { name: "", properties: {} },
        "updateHat": { visible: true, }
    });