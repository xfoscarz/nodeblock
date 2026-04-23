import { Particle } from "../particle";
import { TextComponent } from "../textComponent"

export type Enchantment = {
    description: TextComponent;
    exclusive_set?: string | string[];
    supported_items: string | string[];
    primary_items?: string | string[];
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
        value: {} // TODO level value based
    } | {
        type: "minecraft:add"
        value: {} // TODo level value based
    } | {
        type: "minecraft:multiply"
        factor: {} // TODO level value based
    } | {
        type: "minecraft:remove_binomial"
        chance: {} // TODO level value based
    } | {
        type: "minecraft:all_of";
        effects: (ValueEffect | LocationBasedEffect)[];
    }

    type EntityEffect = {
        type: "minecraft:all_of";
        effects: EntityEffect[];
    } | {
        type: "minecraft:apply_impulse";
        direction: [ number, number, number ];
        coordinate_scale: [ number, number, number ];
        magnitude: {} // TODO
    } | {
        type: "minecraft:apply_exhaustion";
        amount: {} // TODO
    } | {
        type: "minecraft:apply_mob_effect";
        to_apply: string | string[];
        min_duration: {} // TODO
        max_duration: {} // TODO
        min_amplifier: {} // TODO
        max_amplifier: {} // TODO
    } | {
        type: "minecraft:damage_entity";
        damage_type: string;
        min_damage: {} // TODO
        max_damage: {} // TODO
    } | {
        type: "minecraft:change_item_damage";
        amount: {} // TODO
    } | {
        type: "minecraft:explode";
        attribute_to_user: boolean;
        damage_type: string;
        immune_blocks: string | string[];
        knockback_multiplier?: {} // TODO
        offset?: [ number, number, number ];
        radius: {} // TODO
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
        sound: string;
    } | {
        type: "minecraft:ignite";
        duration: {} // TODO
    } | {
        type: "minecraft:play_sound";
        sound: (string | {
            sound_id: string;
            range?: number;
        })[];
        volume: FloatProvider;
        pitch: FloatProvider;
    } | {
        type: "minecraft:replace_block";
        block_state: {} // TODO
        offset?: [ number, number, number ];
        trigger_game_event?: string;
        predicate?: {} // TODO
    } | {
        type: "minecraft:replace_disk";
        block_state: {} // TODO
        offset?: [ number, number, number ];
        radius: {} // TODO
        height: {} // TODO
        trigger_game_event?: string;
        predicate?: {} // TODO
    } | {
        type: "minecraft:run_function";
        function: string;
    } | {
        type: "minecraft:set_block_properties";
        offset?: [ number, number, number ];
        properties: {} // TODO blockstate key value pair
        trigger_game_event?: string;
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
    }

    type LocationBasedEffect = {
        type: "minecraft:attribute";
        attribute: string;
        amount: {} // TODO
        operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
        id: string;
    }
    
    type AttributeEffectComponent = {
        attribute: string;
        amount: {} // TODO
        operation: "add_value" | "add_multiplied_base" | "add_multiplied_total";
        id: string;
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

        "minecraft:attributes"?: AttributeEffectComponent;

        "minecraft:crossbow_charging_sounds"?: ValueEffect[];

        "minecraft:trident_sound"?: ValueEffect[];

        [componentID: string]: ValueEffect | any;
    }

    type FloatProvider = {};
}