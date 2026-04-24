import { EnvironmentAttributes } from "../primitives/dimensionTypes";
import { IntProvider } from "../primitives/intProvider";

export type DimensionType = {
    coordinate_scale: number;
    has_skylight: boolean;
    has_ceiling: boolean;
    has_ender_dragon_fight?: boolean;
    ambient_light: number;
    has_fixed_time?: boolean;
    monster_spawn_block_light_limit: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15;
    monster_spawn_light_level: IntProvider;
    logical_height: number;
    min_y: number;
    height: number;
    infiniburn: `#${string}`;
    skybox?: "none" | "overworld" | "end";
    cardinal_light?: "default" | "nether";
    attributes?: EnvironmentAttributes;
    default_clock?: string;
    timelines?: string | string[]; // TODO timeline
}