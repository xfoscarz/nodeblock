import { IdentifierOrTag } from "../../../Util";
import { TextComponent } from "../../Text";
import { EffectComponent } from "../primitives/enchantment";
import { VanillaEnchantments, VanillaEnchantmentTags } from "../vanilla/enchantments";
import { VanillaItems, VanillaItemTags } from "../vanilla/items";

export type Enchantment = {
    description: TextComponent;
    exclusive_set?: IdentifierOrTag<VanillaEnchantments, VanillaEnchantmentTags>;
    supported_items: IdentifierOrTag<VanillaItems, VanillaItemTags>;
    primary_items?: IdentifierOrTag<VanillaItems, VanillaItemTags>;
    weight: number;
    max_level: number;
    min_cost: {
        base: number;
        per_level_above_first: number;
    }
    max_cost: {
        base: number;
        per_level_above_first: number;
    }
    anvil_cost: number;
    slots: ("any" | "hand" | "mainhand" | "offhand" | "armor" | "feet" | "legs" | "chest" | "head" | "body" | "saddle")[];
    effects?: EffectComponent;
}