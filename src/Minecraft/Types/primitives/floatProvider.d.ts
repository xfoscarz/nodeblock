import { VanillaFloatProviderTypes } from "../vanilla/floatProviders";

export type FloatProvider = {
    type: VanillaFloatProviderTypes;
} | {
    type: "minecraft:constant";
    value: number;
} | {
    type: "minecraft:uniform";
    min_inclusive: number;
    max_exclusive: number;
} | {
    type: "minecraft:clamped_normal";
    mean: number;
    deviation: number;
    min: number;
    max: number;
} | {
    type: "minecraft:trapezoid";
    min: number;
    max: number;
    plateau: number;
} | {
    type: string;
    [key: string]: any;
}