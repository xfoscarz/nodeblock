import { VanillaAttributes } from "../attribute";
import { VanillaDamageTypes } from "../damageType";
import { VanillaItems, VanillaItemTags } from "../item";
import { Particle } from "../particle";
import { VanillaSoundEvents } from "../sound";
import { TextComponent } from "../textComponent"

export type Enchantment = {
    description: TextComponent;
    exclusive_set?: string | string[]; // TODO enchantment identifier
    supported_items: (VanillaItems | VanillaItems[] | VanillaItemTags)[];
    primary_items?: (VanillaItems | VanillaItems[] | VanillaItemTags)[];
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
    effects?: Enchantment.EffectComponent;
}

namespace Enchantment {
    type BaseEffect<T> = {
        effect: T;
        requirements?: {};
    }

    type ValueEffect = {
        type: "minecraft:set"
        value: LevelBasedValue;
    } | {
        type: "minecraft:add"
        value: LevelBasedValue;
    } | {
        type: "minecraft:multiply"
        factor: LevelBasedValue;
    } | {
        type: "minecraft:remove_binomial"
        chance: LevelBasedValue;
    } | {
        type: "minecraft:all_of";
        effects: (ValueEffect | LocationBasedEffect)[];
    } | {
        type: string;
        [key: string]: any;
    }

    type AttributeEffect = {
        attribute: VanillaAttributes;
        amount: LevelBasedValue;
        operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
        id: string; // TODO resource location ???
    }

    type EntityEffect = {
        type: "minecraft:all_of";
        effects: (EntityEffect | LocationBasedEffect)[];
    } | {
        type: "minecraft:apply_impulse";
        direction: [ number, number, number ];
        coordinate_scale: [ number, number, number ];
        magnitude: LevelBasedValue;
    } | {
        type: "minecraft:apply_exhaustion";
        amount: LevelBasedValue;
    } | {
        type: "minecraft:apply_mob_effect";
        to_apply: string | string[]; // TODO status effect id
        min_duration: LevelBasedValue;
        max_duration: LevelBasedValue;
        min_amplifier: LevelBasedValue;
        max_amplifier: LevelBasedValue;
    } | {
        type: "minecraft:damage_entity";
        damage_type: VanillaDamageTypes;
        min_damage: LevelBasedValue;
        max_damage: LevelBasedValue;
    } | {
        type: "minecraft:change_item_damage";
        amount: LevelBasedValue;
    } | {
        type: "minecraft:explode";
        attribute_to_user: boolean;
        damage_type: VanillaDamageTypes;
        immune_blocks: string | string[]; // TODO block id
        knockback_multiplier?: LevelBasedValue;
        offset?: [ number, number, number ];
        radius: LevelBasedValue;
        create_fire: boolean;
        block_interaction: "none" | "block" | "mob" | "tnt" | "trigger";
        small_particle: Particle;
        large_particle: Particle;
        block_particles?: {
            weight: number;
            particle: Particle;
            scaling: number;
            speed: number;
        }[];
        sound: VanillaSoundEvents;
    } | {
        type: "minecraft:ignite";
        duration: LevelBasedValue;
    } | {
        type: "minecraft:play_sound";
        sound: (VanillaSoundEvents | {
            sound_id: VanillaSoundEvents;
            range?: number;
        })[];
        volume: FloatProvider;
        pitch: FloatProvider;
    } | {
        type: "minecraft:replace_block";
        block_state: {} // TODO blockstate
        offset?: [ number, number, number ];
        trigger_game_event?: string; // TODO game event
        predicate?: {} // TODO block predicate
    } | {
        type: "minecraft:replace_disk";
        block_state: {} // TODO block state
        offset?: [ number, number, number ];
        radius: LevelBasedValue;
        height: LevelBasedValue;
        trigger_game_event?: string; // TODO game event
        predicate?: {} // TODO block predicate
    } | {
        type: "minecraft:run_function";
        function: string;
    } | {
        type: "minecraft:set_block_properties";
        offset?: [ number, number, number ];
        properties: {} // TODO blockstate key value pair
        trigger_game_event?: string; // TODO game event
    } | {
        type: "minecraft:spawn_particles";
        particle: Particle;
        horizontal_position: {
            type: "entity_position";
            offset?: number;
        } | {
            type: "in_bounding_box";
            offset?: number;
            scale?: number;
        }
        vertical_position: {
            type: "entity_position";
            offset?: number;
        } | {
            type: "in_bounding_box";
            offset?: number;
            scale?: number;
        }
        horizontal_velocity: {
            base?: FloatProvider;
            movement_scale?: number;
        }
        vertical_velocity: {
            base?: FloatProvider;
            movement_scale?: number;
        }
        speed?: FloatProvider;
    } | {
        type: "minecraft:summon_entity";
        entity: string | string[];
        join_team: boolean;
    } | {
        type: string;
        [key: string]: any;
    }

    type LocationBasedEffect = {
        type: "minecraft:attribute";
        attribute: VanillaAttributes;
        amount: LevelBasedValue;
        operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
        id: string; // TODO resource location
    } | EntityEffect;

    type LevelBasedValue = number | {
        type: "minecraft:exponent";
        base: LevelBasedValue;
        power: LevelBasedValue;
    } | {
        type: "minecraft:linear";
        base: number;
        per_level_above_first: number;
    } | {
        type: "minecraft:levels_squared";
        added: number;
    } | {
        type: "minecraft:clamped";
        value: LevelBasedValue;
        min: number;
        max: number;
    } | {
        type: "minecraft:fraction";
        numerator: LevelBasedValue;
        denominator: LevelBasedValue;
    } | {
        type: "minecraft:lookup";
        values: number[];
        fallback: LevelBasedValue;
    } | {
        type: string;
        [key: string]: any;
    }

    export type EffectComponent = {
        "minecraft:armor_effectiveness"?: BaseEffect<ValueEffect>[],
        "minecraft:damage"?: BaseEffect<ValueEffect>[],
        "minecraft:damage_protection"?: BaseEffect<ValueEffect>[],
        "minecraft:smash_damage_per_fallen_block"?: BaseEffect<ValueEffect>[],
        "minecraft:knockback"?: BaseEffect<ValueEffect>[],
        "minecraft:ammo_use"?: BaseEffect<ValueEffect>[],
        "minecraft:projectile_piercing"?: BaseEffect<ValueEffect>[],
        "minecraft:block_experience"?: BaseEffect<ValueEffect>[],
        "minecraft:repair_with_xp"?: BaseEffect<ValueEffect>[],
        "minecraft:item_damage"?: BaseEffect<ValueEffect>[],
        "minecraft:projectile_count"?: BaseEffect<ValueEffect>[],
        "minecraft:trident_return_acceleration"?: BaseEffect<ValueEffect>[],
        "minecraft:projectile_spread"?: BaseEffect<ValueEffect>[],
        "minecraft:fishing_time_reduction"?: BaseEffect<ValueEffect>[],
        "minecraft:fishing_luck_bonus"?: BaseEffect<ValueEffect>[],
        "minecraft:mob_experience"?: BaseEffect<ValueEffect>[],
        "minecraft:equipment_drops"?: (BaseEffect<ValueEffect> | { enchanted: "attacker" | "victim"; })[];

        "minecraft:crossbow_charge_time"?: ValueEffect;
        "minecraft:trident_spin_attack_strength"?: ValueEffect;

        "minecraft:hit_block"?: BaseEffect<EntityEffect>[],
        "minecraft:tick"?: BaseEffect<EntityEffect>[],
        "minecraft:projectile_spawned"?: BaseEffect<EntityEffect>[],
        "minecraft:post_piercing_attack"?: BaseEffect<EntityEffect>[],
        "minecraft:post_attack"?: (BaseEffect<EntityEffect> | {
            enchanted: "attacker" | "victim" | "damaging_entity";
            affected: "attacker" | "victim" | "damaging_entity";
        })[],

        "minecraft:location_changed"?: BaseEffect<LocationBasedEffect>[];

        "minecraft:damage_immunity"?: BaseEffect<{}>[];

        "minecraft:prevent_equipment_drop"?: {};
        "minecraft:prevent_armor_change"?: {};

        "minecraft:attributes"?: AttributeEffect;

        "minecraft:crossbow_charging_sounds"?: {
            start?: VanillaSoundEvents;
            mid?: VanillaSoundEvents;
            end?: VanillaSoundEvents;
        }[];

        "minecraft:trident_sound"?: VanillaSoundEvents[];

        [componentID: string]: any;
    }

    type FloatProvider = {
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
}