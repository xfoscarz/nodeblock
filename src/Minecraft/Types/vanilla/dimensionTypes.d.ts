import { EnumString } from "@/Util";

export type VanillaVillagerAIs = EnumString<
    | "minecraft:core"
    | "minecraft:hide"
    | "minecraft:idle"
    | "minecraft:meet"
    | "minecraft:panic"
    | "minecraft:play"
    | "minecraft:pre_raid"
    | "minecraft:raid"
    | "minecraft:rest"
>;