import { EnumString } from "@/PortWatcher";

export type VanillaFloatProviderTypes = EnumString<
    | "minecraft:constant"
    | "minecraft:uniform"
    | "minecraft:clamped_normal"
    | "minecraft:trapezoid"
>;