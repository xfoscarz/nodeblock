import { TextComponent } from "../../Text";
import { VanillaVillagerAIs } from "../vanilla/dimensionTypes";
import { Particle } from "./particle";
import { DelayedSoundEvent, SoundEvent } from "./sound";

export type EnvironmentAttributes = {
    "minecraft:audio/ambient_sounds"?: EnvironmentAttributes.Modifier<{
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
    "minecraft:audio/background_music"?: EnvironmentAttributes.Modifier<{
        default?: DelayedSoundEvent;
        creative?: DelayedSoundEvent;
        underwater?: DelayedSoundEvent;
    }>;
    "minecraft:audio/firefly_bush_sounds"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:audio/music_volume"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:gameplay/baby_villager_activity"?: EnvironmentAttributes.Modifier<VanillaVillagerAIs>;
    "minecraft:gameplay/bed_rule"?: EnvironmentAttributes.Modifier<{
        can_sleep: "always" | "when_dark" | "never";
        can_set_spawn: "always" | "when_dark" | "never";
        explodes?: boolean;
        error_message?: TextComponent;
    }>;
    "minecraft:gameplay/bees_stay_in_hive"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/can_pillager_patrol_spawn"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/can_start_raid"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/cat_waking_up_gift_chance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:gameplay/creaking_active"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/eyeblossom_open"?: EnvironmentAttributes.Modifier.Overridable<string | boolean>;
    "minecraft:gameplay/fast_lava"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/increased_fire_burnout"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/monsters_burn"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/nether_portal_spawns_piglin"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/piglins_zombify"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/respawn_anchor_works"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/sky_light_level"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:gameplay/snow_golem_melts"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:gameplay/surface_slime_spawn_chance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:gameplay/turtle_egg_hatch_chance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:gameplay/villager_activity"?: EnvironmentAttributes.Modifier.Overridable<VanillaVillagerAIs>;
    "minecraft:gameplay/water_evaporates"?: EnvironmentAttributes.Modifier.Boolean;
    "minecraft:visual/ambient_light_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/ambient_particles"?: EnvironmentAttributes.Modifier.Overridable<{ particle: Particle; probability: number; }[]>;
    "minecraft:visual/block_light_tint"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/cloud_color"?: EnvironmentAttributes.Modifier.ARGB;
    "minecraft:visual/cloud_fog_end_distance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/cloud_height"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/default_dripstone_particle"?: EnvironmentAttributes.Modifier.Overridable<Particle>;
    "minecraft:visual/fog_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/fog_end_distance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/fog_start_distance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/moon_angle"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/moon_phase"?: EnvironmentAttributes.Modifier.Overridable<"full_moon" | "waning_gibbous" | "third_quarter" | "waning_crescent" | "new_moon" | "waxing_crescent" | "first_quarter" | "waxing_gibbous">;
    "minecraft:visual/night_vision_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/sky_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/sky_fog_end_distance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/sky_light_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/sky_light_factor"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/star_angle"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/star_brightness"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/sun_angle"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/sunrise_sunset_color"?: EnvironmentAttributes.Modifier.ARGB;
    "minecraft:visual/water_fog_color"?: EnvironmentAttributes.Modifier.RGB;
    "minecraft:visual/water_fog_end_distance"?: EnvironmentAttributes.Modifier.Float;
    "minecraft:visual/water_fog_start_distance"?: EnvironmentAttributes.Modifier.Float;

    [environmentAttribute: string]: { modifier: string; argument: any; } | any;
}

export namespace EnvironmentAttributes {
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