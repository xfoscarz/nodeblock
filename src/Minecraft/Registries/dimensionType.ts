import { ListOfAtLeastOne } from "../../Util";
import { Particle } from "../particle";
import { TextComponent } from "../textComponent";

export type DimensionType = {
    coordinate_scale: number;
    has_skylight: boolean;
    has_ceiling: boolean;
    has_ender_dragon_fight?: boolean;
    ambient_light: number;
    has_fixed_time?: boolean;
    monster_spawn_block_light_limit: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
    monster_spawn_light_level: DimensionType.IntProvider;
    logical_height: number;
    min_y: number;
    height: number;
    infiniburn: `#${string}`;
    skybox?: "none" | "overworld" | "end";
    cardinal_light?: "default" | "nether";
    attributes?: DimensionType.EnvironmentAttributes;
    default_clock?: string;
    timelines?: string | string[];
}

namespace DimensionType {
    export type IntProvider = number | {
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
    }

    export type EnvironmentAttributes = {
        "minecraft:audio/ambient_sounds"?: Modifier<{
            mood?: {
                block_search_extent?: number;
                offset?: number;
                tick_delay?: number;
                sound: SoundEvent;
            };
            additions?: {
                tick_chance?: number;
                sound: SoundEvent;
            };
            loop?: SoundEvent;
        }>;
        "minecraft:audio/background_music"?: Modifier<{
            default?: DelayedSoundEvent;
            creative?: DelayedSoundEvent;
            underwater?: DelayedSoundEvent;
        }>;
        "minecraft:audio/firefly_bush_sounds"?: Modifier.Boolean;
        "minecraft:audio/music_volume"?: Modifier.Float;
        "minecraft:gameplay/baby_villager_activity"?: Modifier<VillagerAI>;
        "minecraft:gameplay/bed_rule"?: Modifier<{
            can_sleep: "always" | "when_dark" | "never";
            can_set_spawn: "always" | "when_dark" | "never";
            explodes?: boolean;
            error_message?: TextComponent;
        }>;
        "minecraft:gameplay/bees_stay_in_hive"?: Modifier.Boolean;
        "minecraft:gameplay/can_pillager_patrol_spawn"?: Modifier.Boolean;
        "minecraft:gameplay/can_start_raid"?: Modifier.Boolean;
        "minecraft:gameplay/cat_waking_up_gift_chance"?: Modifier.Float;
        "minecraft:gameplay/creaking_active"?: Modifier.Boolean;
        "minecraft:gameplay/eyeblossom_open"?: Modifier.Overridable<string | boolean>;
        "minecraft:gameplay/fast_lava"?: Modifier.Boolean;
        "minecraft:gameplay/increased_fire_burnout"?: Modifier.Boolean;
        "minecraft:gameplay/monsters_burn"?: Modifier.Boolean;
        "minecraft:gameplay/nether_portal_spawns_piglin"?: Modifier.Boolean;
        "minecraft:gameplay/piglins_zombify"?: Modifier.Boolean;
        "minecraft:gameplay/respawn_anchor_works"?: Modifier.Boolean;
        "minecraft:gameplay/sky_light_level"?: Modifier.Float;
        "minecraft:gameplay/snow_golem_melts"?: Modifier.Boolean;
        "minecraft:gameplay/surface_slime_spawn_chance"?: Modifier.Float;
        "minecraft:gameplay/turtle_egg_hatch_chance"?: Modifier.Float;
        "minecraft:gameplay/villager_activity"?: Modifier.Overridable<VillagerAI>;
        "minecraft:gameplay/water_evaporates"?: Modifier.Boolean;
        "minecraft:visual/ambient_light_color"?: Modifier.RGB;
        "minecraft:visual/ambient_particles"?: Modifier.Overridable<{ particle: Particle; probability: number; }[]>;
        "minecraft:visual/block_light_tint"?: Modifier.RGB;
        "minecraft:visual/cloud_color"?: Modifier.ARGB;
        "minecraft:visual/cloud_fog_end_distance"?: Modifier.Float;
        "minecraft:visual/cloud_height"?: Modifier.Float;
        "minecraft:visual/default_dripstone_particle"?: Modifier.Overridable<Particle>;
        "minecraft:visual/fog_color"?: Modifier.RGB;
        "minecraft:visual/fog_end_distance"?: Modifier.Float;
        "minecraft:visual/fog_start_distance"?: Modifier.Float;
        "minecraft:visual/moon_angle"?: Modifier.Float;
        "minecraft:visual/moon_phase"?: Modifier.Overridable<"full_moon" | "waning_gibbous" | "third_quarter" | "waning_crescent" | "new_moon" | "waxing_crescent" | "first_quarter" | "waxing_gibbous">;
        "minecraft:visual/night_vision_color"?: Modifier.RGB;
        "minecraft:visual/sky_color"?: Modifier.RGB;
        "minecraft:visual/sky_fog_end_distance"?: Modifier.Float;
        "minecraft:visual/sky_light_color"?: Modifier.RGB;
        "minecraft:visual/sky_light_factor"?: Modifier.Float;
        "minecraft:visual/star_angle"?: Modifier.Float;
        "minecraft:visual/star_brightness"?: Modifier.Float;
        "minecraft:visual/sun_angle"?: Modifier.Float;
        "minecraft:visual/sunrise_sunset_color"?: Modifier.ARGB;
        "minecraft:visual/water_fog_color"?: Modifier.RGB;
        "minecraft:visual/water_fog_end_distance"?: Modifier.Float;
        "minecraft:visual/water_fog_start_distance"?: Modifier.Float;

        [environmentAttribute: string]: { modifier: string; argument: any; } | any;
    };

    export type VillagerAI = "minecraft:core"
        | "minecraft:hide"
        | "minecraft:idle"
        | "minecraft:meet"
        | "minecraft:panic"
        | "minecraft:play"
        | "minecraft:pre_raid"
        | "minecraft:raid"
        | "minecraft:rest";

    export type SoundEvent = string | {
        sound_id: string;
        range?: number;
    }

    export type DelayedSoundEvent = {
        max_delay: number;
        min_delay: number;
        sound: SoundEvent;
        replace_current_music?: boolean;
    }

    export type Modifier<T> = Modifier.Overridable<T> | T;

    export namespace Modifier {
        export type Overridable<T> = {
            modifier: "override";
            argument: T;
        } | T;

        export type Boolean = {
            modifier: "and" | "nand" | "or" | "nor" | "xor" | "xnor";
            argument: boolean;
        } | Overridable<boolean>;
        
        export type Float = {
            modifier: "add" | "subtract" | "multiply" | "minimum" | "maximum";
            argument: number;
        } | {
            modifier: "alpha_blend";
            argument: {
                value: number;
                alpha?: number;
            }
        } | Overridable<number>;

        type RGBValue = `#${string}` | number | [ number, number, number ];
        type ARGBValue = `#${string}` | number | [ number, number, number, number ];
        type RGBAndARGB<T extends RGBValue | ARGBValue> = {
            modifier: "add" | "subtract";
            argument: T;
        } | {
            modifier: "multiply";
            argument: T | ARGBValue;
        } | {
            modifier: "alpha_blend";
            argument: T;
        } | {
            modifier: "blend_to_gray";
            argument: {
                brightness: number;
                factor: number;
            }
        } | Overridable<T>;

        export type RGB = RGBAndARGB<RGBValue>;
        export type ARGB = RGBAndARGB<ARGBValue>;
    }
}
