import { ListOfAtLeastOne } from "../../../PortWatcher";
import { VanillaIntProviderTypes } from "../vanilla/intProviders";

export type IntProvider = number | {
    type: VanillaIntProviderTypes;
} | {
    type: "minecraft:constant";
    value: number;
} | {
    type: "minecraft:uniform" | "minecraft:biased_to_bottom";
    min_inclusive: number;
    max_inclusive: number;
} | {
    type: "minecraft:clamped";
    min_inclusive: number;
    max_inclusive: number;
    source: IntProvider;
} | {
    type: "minecraft:clamped_normal";
    mean: number;
    deviation: number;
    min_inclusive: number;
    max_inclusive: number;
} | {
    type: "minecraft:weighted_list";
    distribution: ListOfAtLeastOne<{
        data: IntProvider;
        weight: number;
    }>
} | {
    type: string;
    [key: string]: any;
}