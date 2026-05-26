import { Identifier } from "@/Minecraft/Identifier";
import { Player } from "@/Minecraft/Player";
import { ClientboundPacket } from "@/Network/Packet";

export default class ClientboundLoginPacket extends ClientboundPacket {
    constructor(
        public readonly entityID: number,
        public readonly isHardcore: boolean,
        public readonly dimensionNames: Identifier[],
        public readonly maxPlayers: number,
        public readonly viewDistance: number,
        public readonly simulationDistance: number,
        public readonly reducedDebugInfo: boolean,
        public readonly enableRespawnScreen: boolean,
        public readonly doLimitedCrafting: boolean,
        public readonly dimensionType: number,
        public readonly dimensionName: Identifier,
        public readonly hashedSeed: bigint | number,
        public readonly gameMode: number,
        public readonly previousGameMode: number,
        public readonly isDebug: boolean,
        public readonly isFlat: boolean,
        public readonly hasDeathLocation: boolean,
        public readonly deathDimensionName: Identifier | null,
        public readonly deathLocation: | null,
        public readonly portalCooldown: number,
        public readonly seaLevel: number,
        public readonly enforcesSecureChat: boolean
    ) {
        super(0x30);
    }

    public override write(): void {
        this.writeInt(this.entityID)
            .writeBoolean(this.isHardcore)
            .writePrefixedArray(this.dimensionNames.length, i => this.writeIdentifier(this.dimensionNames[i]))
            .writeVarInt(this.maxPlayers)
            .writeVarInt(this.viewDistance)
            .writeVarInt(this.simulationDistance)
            .writeBoolean(this.reducedDebugInfo)
            .writeBoolean(this.enableRespawnScreen)
            .writeBoolean(this.doLimitedCrafting)
            .writeVarInt(this.dimensionType)
            .writeIdentifier(this.dimensionName)
            .writeLong(this.hashedSeed)
            .writeUnsignedByte(this.gameMode)
            .writeByte(this.previousGameMode)
            .writeBoolean(this.isDebug)
            .writeBoolean(this.isFlat)
            .writeBoolean(this.hasDeathLocation);

        if (this.hasDeathLocation) {
            this.writeIdentifier(this.deathDimensionName!)
                .writePosition(this.deathLocation);
        }

        this.writeVarInt(this.portalCooldown);
        this.writeVarInt(this.seaLevel);
        this.writeBoolean(this.enforcesSecureChat);
    }
}