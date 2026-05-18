import { BlockState } from "@/Minecraft/Types/primitives/block";
import { EnvironmentAttributes } from "@/Minecraft/Types/primitives/dimensionTypes";
import { TextComponent } from "@/Minecraft/Types/primitives/textComponent";
import { VanillaDataComponentTypes, VanillaItems } from "@/Minecraft/Types/vanilla/items"
import { VanillaTranslatables } from "@/Minecraft/Types/vanilla/textComponents";
import { EnumString } from "@/PortWatcher";

const tset: DataComponent = {}

type BaseColors = EnumString<
    | "red"
    | "orange"
    | "yellow"
    | "green"
    | "lime"
    | "cyan"
    | "light_blue"
    | "blue"
    | "magenta"
    | "pink"
    | "purple"
    | "brown"
    | "white"
    | "black"
    | "light_gray"
    | "gray"
>;

export type DataComponent = {
    "minecraft:attack_range"?: {
        min_reach?: number;
        max_reach?: number;
        min_creative_reach?: number;
        max_creative_reach?: number;
        hitbox_margin?: number;
        mob_factor?: number;
    }
    "minecraft:attribute_modifiers"?: {
        id?: string;
        type?: EnumString<"add_value" | "add_multiplied_base" | "add_multipled_total">;
        slot?: EnumString<"any" | "hand" | "armor" | "mainhand" | "offhand" | "head" | "chest" | "legs" | "feet" | "body" | "saddle">;
        operation?: EnumString<"add_value" | "add_multiplied_base" | "add_multiplied_total">;
        amount: number;
        display?: {
            type: EnumString<"default" | "hidden">;
        } | {
            type: "override";
            value: TextComponent;
        }
    }[];
    "minecraft:banner_patterns"?: {
        color: BaseColors;
        pattern: string | {// TODO banner patterns
            asset_id: string; // TODO resource location for texture asset
            translation_key: VanillaTranslatables;
        }
    }[];
    "minecraft:base_color"?: BaseColors;
    "minecraft:bees"?: {
        entity_data: {} // TODO entity format
        min_ticks_in_hive: number;
        ticks_in_hive: number;
    }[];
    "minecraft:block_entity_data"?: {}
    "minecraft:block_state"?: {}
    "minecraft:blocks_attacks"?: {}
    "minecraft:break_sound"?: {}
    "minecraft:bucket_entity_data"?: {}
    "minecraft:bundle_contents"?: {}
    "minecraft:can_break"?: {}
    "minecraft:can_place_on"?: {}
    "minecraft:charged_projectiles"?: {}
    "minecraft:consumable"?: {}
    "minecraft:container"?: {}
    "minecraft:container_loot"?: {}
    "minecraft:custom_data"?: {}
    "minecraft:custom_model_data"?: {}
    "minecraft:custom_name"?: {}
    "minecraft:damage"?: {}
    "minecraft:damage_resistant"?: {}
    "minecraft:damage_type"?: {}
    "minecraft:death_protection"?: {}
    "minecraft:debug_stick_state"?: {}
    "minecraft:dye"?: {}
    "minecraft:dyed_color"?: {}
    "minecraft:enchantable"?: {}
    "minecraft:enchantment_glint_override"?: {}
    "minecraft:enchantments"?: {}
    "minecraft:entity_data"?: {}
    "minecraft:equippable"?: {}
    "minecraft:firework_explosion"?: {}
    "minecraft:fireworks"?: {}
    "minecraft:food"?: {}
    "minecraft:glider"?: {}
    "minecraft:instrument"?: {}
    "minecraft:intangible_projectile"?: {}
    "minecraft:item_model"?: {}
    "minecraft:item_name"?: {}
    "minecraft:jukebox_playable"?: {}
    "minecraft:kinetic_weapon"?: {}
    "minecraft:lock"?: {}
    "minecraft:lodestone_tracker"?: {}
    "minecraft:lore"?: {}
    "minecraft:map_color"?: {}
    "minecraft:map_decorations"?: {}
    "minecraft:map_id"?: {}
    "minecraft:max_damage"?: {}
    "minecraft:max_stack_size"?: {}
    "minecraft:minimum_attack_charge"?: {}
    "minecraft:note_block_sound"?: {}
    "minecraft:ominous_bottle_amplifier"?: {}
    "minecraft:piercing_weapon"?: {}
    "minecraft:pot_decorations"?: {}
    "minecraft:potion_contents"?: {}
    "minecraft:potion_duration_scale"?: {}
    "minecraft:profile"?: {}
    "minecraft:provides_banner_patterns"?: {}
    "minecraft:provides_trim_material"?: {}
    "minecraft:rarity"?: {}
    "minecraft:recipes"?: {}
    "minecraft:repair_cost"?: {}
    "minecraft:repairable"?: {}
    "minecraft:stored_enchantments"?: {}
    "minecraft:sulfur_cube_content"?: {}
    "minecraft:suspicious_stew_effects"?: {}
    "minecraft:swing_animation"?: {}
    "minecraft:tool"?: {}
    "minecraft:tooltip_display"?: {}
    "minecraft:tooltip_style"?: {}
    "minecraft:trim"?: {}
    "minecraft:unbreakable"?: {}
    "minecraft:use_cooldown"?: {}
    "minecraft:use_effects"?: {}
    "minecraft:use_remainder"?: {}
    "minecraft:weapon"?: {}
    "minecraft:writable_book_content"?: {}
    "minecraft:written_book_content"?: {}

    [negativeComponent: `!${VanillaDataComponentTypes}`]: {}

    // [key: string]: any;
}

export type Test = {
    "test"?: number;
    [negative: "!a"]: number; // TODO
}