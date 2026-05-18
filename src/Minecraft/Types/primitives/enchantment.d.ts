import { IdentifierOrTag } from "../../../PortWatcher";
import { VanillaAttributes } from "../vanilla/attributes";
import { VanillaBlocks, VanillaBlockTags } from "../vanilla/blocks";
import { VanillaDamageTypes } from "../vanilla/damageTypes";
import { VanillaEntityEffectTypes, VanillaLevelBasedValueTypes, VanillaLocationBasedEffectTypes, VanillaValueEffectTypes } from "../vanilla/enchantments";
import { VanillaSoundEvents } from "../vanilla/sounds";
import { BlockPredicate, BlockState } from "./block";
import { FloatProvider } from "./floatProvider";
import { Particle } from "./particle";

export type EffectComponent = {
    "minecraft:armor_effectiveness"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:damage"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:damage_protection"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:smash_damage_per_fallen_block"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:knockback"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:ammo_use"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:projectile_piercing"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:block_experience"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:repair_with_xp"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:item_damage"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:projectile_count"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:trident_return_acceleration"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:projectile_spread"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:fishing_time_reduction"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:fishing_luck_bonus"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:mob_experience"?: RequisiteEffect<Effect.ValueEffect>[],
    "minecraft:equipment_drops"?: (RequisiteEffect<Effect.ValueEffect> | { enchanted: EnumString<"attacker" | "victim">; })[];

    "minecraft:crossbow_charge_time"?: Effect.ValueEffect;
    "minecraft:trident_spin_attack_strength"?: Effect.ValueEffect;

    "minecraft:hit_block"?: RequisiteEffect<Effect.EntityEffect>[],
    "minecraft:tick"?: RequisiteEffect<Effect.EntityEffect>[],
    "minecraft:projectile_spawned"?: RequisiteEffect<Effect.EntityEffect>[],
    "minecraft:post_piercing_attack"?: RequisiteEffect<Effect.EntityEffect>[],
    "minecraft:post_attack"?: (RequisiteEffect<Effect.EntityEffect> | {
        enchanted: EnumString<"attacker" | "victim" | "damaging_entity">;
        affected: EnumString<"attacker" | "victim" | "damaging_entity">;
    })[],

    "minecraft:location_changed"?: RequisiteEffect<Effect.LocationBasedEffect>[];

    "minecraft:damage_immunity"?: RequisiteEffect<{}>[];

    "minecraft:prevent_equipment_drop"?: {};
    "minecraft:prevent_armor_change"?: {};

    "minecraft:attributes"?: Effect.AttributeEffect;

    "minecraft:crossbow_charging_sounds"?: {
        start?: VanillaSoundEvents;
        mid?: VanillaSoundEvents;
        end?: VanillaSoundEvents;
    }[];

    "minecraft:trident_sound"?: VanillaSoundEvents[];

    [componentID: string]: any;
}

type RequisiteEffect<T> = {
    effect: T;
    requirements?: {}; // TODO predicate
}

namespace Effect {
    export type ValueEffect = {
        type: VanillaValueEffectTypes;
    } | {
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
    
    export type AttributeEffect = {
        attribute: VanillaAttributes;
        amount: LevelBasedValue;
        operation: EnumString<"add_value" | "add_multiplied_base" | "add_multiplied_total">;
        id: string; // TODO resource location ???
    }
    
    export type EntityEffect = {
        type: VanillaEntityEffectTypes;
    } | {
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
        damage_type?: VanillaDamageTypes;
        immune_blocks?: IdentifierOrTag<VanillaBlocks, VanillaBlockTags>;
        knockback_multiplier?: LevelBasedValue;
        offset?: [ number, number, number ];
        radius: LevelBasedValue;
        create_fire: boolean;
        block_interaction: EnumString<"none" | "block" | "mob" | "tnt" | "trigger">;
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
        sound: VanillaSoundEvents | {
            sound_id: VanillaSoundEvents;
            range?: number;
        } | (VanillaSoundEvents | {
            sound_id: VanillaSoundEvents;
            range?: number;
        })[];
        volume: FloatProvider;
        pitch: FloatProvider;
    } | {
        type: "minecraft:replace_block";
        block_state: BlockState.Provider;
        offset?: [ number, number, number ];
        trigger_game_event?: string; // TODO game event
        predicate?: BlockPredicate;
    } | {
        type: "minecraft:replace_disk";
        block_state: BlockState.Provider;
        offset?: [ number, number, number ];
        radius: LevelBasedValue;
        height: LevelBasedValue;
        trigger_game_event?: string; // TODO game event
        predicate?: BlockPredicate;
    } | {
        type: "minecraft:run_function";
        function: string;
    } | {
        type: "minecraft:set_block_properties";
        offset?: [ number, number, number ];
        properties: BlockState.Properties;
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
        entity: string | string[]; // TODO entity types
        join_team: boolean;
    } | {
        type: string;
        [key: string]: any;
    }
    
    export type LocationBasedEffect = {
        type: VanillaLocationBasedEffectTypes;
    } | {
        type: "minecraft:attribute";
        attribute: VanillaAttributes;
        amount: LevelBasedValue;
        operation: EnumString<"add_value" | "add_multiplied_base" | "add_multiplied_total">;
        id: string; // TODO resource location
    } | {
        type: string;
        [key: string]: any;
    } | EntityEffect;
}

type LevelBasedValue = number | {
    type: VanillaLevelBasedValueTypes;
} | {
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