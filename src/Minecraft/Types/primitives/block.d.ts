import { IntProvider } from "./intProvider";
import { Noise } from "./noise";
import { VanillaBlocks, VanillaBlockTags, VanillaBlockPredicateTypes, VanillaBlockStateProviderTypes, VanillaBlockStateProperties } from "../vanilla/blocks";
import { IdentifierOrTag, ListOfAtLeastOne } from "../../../Util";
import { VanillaNoises } from "../vanilla/noises";

type BlockStateString<T extends string> = (string & {}) | T;
type BlockStateBoolean = BlockStateString<"true" | "false">;
type BlockStateInteger<T extends number = number> = BlockStateString<`${T}`>;

export type BlockState = {
    Name: VanillaBlocks;
    Properties?: BlockState.Properties;
}

export namespace BlockState {
    export type Properties = {
        age?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24 | 25>;
        attached?: BlockStateBoolean;
        attachment?: BlockStateString<"ceiling" | "double_wall" | "floor" | "single_wall">;
        axis?: BlockStateString<"x" | "y" | "z">;
        berries?: BlockStateBoolean;
        bites?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6>;
        bloom?: BlockStateBoolean;
        bottom?: BlockStateBoolean;
        can_summon?: BlockStateBoolean;
        candles?: BlockStateInteger<1 | 2 | 3 | 4>;
        charges?: BlockStateInteger<0 | 1 | 2 | 3 | 4>;
        conditional?: BlockStateBoolean;
        copper_golem_pose?: BlockStateString<"standing" | "sitting" | "running" | "star">;
        cracked?: BlockStateBoolean;
        crafting?: BlockStateBoolean;
        creaking_heart_state?: BlockStateString<"uprooted" | "dormant" | "awake">;
        delay?: BlockStateInteger<1 | 2 | 3 | 4>;
        disarmed?: BlockStateBoolean;
        distance?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>;
        down?: BlockStateBoolean;
        drag?: BlockStateBoolean;
        dusted?: BlockStateInteger<0 | 1 | 2 | 3>;
        east?: BlockStateBoolean | BlockStateString<"none" | "side" | "up" | "low" | "tall">;
        eggs?: BlockStateInteger<1 | 2 | 3 | 4>;
        enabled?: BlockStateBoolean;
        extended?: BlockStateBoolean;
        eye?: BlockStateInteger;
        face?: BlockStateString<"ceiling" | "floor" | "wall">;
        facing?: BlockStateString<"down" | "east" | "north" | "south" | "west" | "up">;
        falling?: BlockStateBoolean;
        flower_amount?: BlockStateInteger<1 | 2 | 3 | 4>;
        half?: BlockStateString<"lower" | "upper" | "bottom" | "top">;
        hanging?: BlockStateBoolean;
        has_book?: BlockStateBoolean;
        has_bottle_0?: BlockStateBoolean;
        has_bottle_1?: BlockStateBoolean;
        has_bottle_2?: BlockStateBoolean;
        has_record?: BlockStateBoolean;
        hatch?: BlockStateInteger<0 | 1 | 2>;
        hinge?: BlockStateString<"left" | "right">;
        honey_level?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5>;
        in_wall?: BlockStateBoolean;
        instrument?: BlockStateString<"banjo" | "basedrum" | "bass" | "bell" | "bit" | "chime" | "cow_bell"
            | "creeper" | "custom_head" | "didgeridoo" | "dragon" | "flute" | "guitar" | "harp" | "hat"
            | "iron_xylophone" | "piglin" | "pling" | "skeleton" | "snare" | "xylophone" | "zombie">;
        inverted?: BlockStateBoolean;
        layers?: BlockStateInteger<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
        leaves?: BlockStateString<"large" | "none" | "small">;
        level?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15>;
        lit?: BlockStateBoolean;
        locked?: BlockStateBoolean;
        mode?: BlockStateString<"compare" | "subtract" | "corner" | "data" | "load" | "save" | "accept" | "fail" | "log" | "start">;
        moisture?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7>;
        natural?: BlockStateBoolean;
        north?: BlockStateBoolean | BlockStateString<"up" | "side" | "none" | "low" | "tall">;
        note?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16 | 17 | 18 | 19 | 20 | 21 | 22 | 23 | 24>;
        occupied?: BlockStateBoolean;
        ominous?: BlockStateBoolean;
        open?: BlockStateBoolean;
        orientation?: BlockStateString<"down_east" | "down_north" | "down_south" | "down_west" | "east_up"
            | "north_up" | "south_up" | "up_east" | "up_north" | "up_south" | "up_west" | "west_up">;
        part?: BlockStateString<"foot" | "head">;
        persistent?: BlockStateBoolean;
        pickles?: BlockStateInteger<1 | 2 | 3 | 4>;
        power?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15>;
        powered?: BlockStateBoolean;
        rotation?: BlockStateInteger<0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15>;
        sculk_sensor_phase?: BlockStateString<"active" | "cooldown" | "inactive">;
        segment_amoung?: BlockStateInteger<1 | 2 | 3 | 4>;
        shape?: BlockStateString<"ascending_east" | "ascending_north" | "ascending_south" | "ascending_west"
            | "east_west" | "north_south" | "inner_left" | "inner_right" | "outer_left" | "outer_right"
            | "straight" | "north_east" | "north_west" | "south_east" | "south_west">;
        short?: BlockStateBoolean;
        shrieking?: BlockStateBoolean;
        side_chain?: BlockStateString<"inactive" | "active" | "unlocking" | "ejecting">;
        signal_fire?: BlockStateBoolean;
        slot_0_occupied?: BlockStateBoolean;
        slot_1_occupied?: BlockStateBoolean;
        slot_2_occupied?: BlockStateBoolean;
        slot_3_occupied?: BlockStateBoolean;
        slot_4_occupied?: BlockStateBoolean;
        slot_5_occupied?: BlockStateBoolean;
        snowy?: BlockStateBoolean;
        south?: BlockStateBoolean | BlockStateString<"none" | "side" | "up" | "low" | "tall">;
        stage?: BlockStateInteger<0 | 1>;
        thickness?: BlockStateString<"base" | "frustum" | "middle" | "tip" | "tip_merge">;
        tilt?: BlockStateString<"full" | "none" | "partial" | "unstable">;
        tip?: BlockStateBoolean;
        trial_spawner_state?: BlockStateString<"inactive" | "waiting_for_players" | "active" | "waiting_for_reward_ejection" | "ejecting_reward" | "cooldown">;
        triggered?: BlockStateBoolean;
        type?: BlockStateString<"normal" | "sticky" | "left" | "right" | "single" | "bottom" | "double" | "top">;
        unstable?: BlockStateBoolean;
        up?: BlockStateBoolean;
        vault_state?: BlockStateString<"inactive" | "active" | "unlocking" | "ejecting">;
        vertical_direction?: BlockStateString<"down" | "up">;
        waterlogged?: BlockStateBoolean;
        west?: BlockStateBoolean | BlockStateString<"none" | "side" | "up" | "low" | "tall">;
    }

    export type Provider = {
        type: VanillaBlockStateProviderTypes;
    } | {
        type: "minecraft:single_state_provider";
        state: BlockState;
    } | {
        type: "minecraft:rotated_block_provider";
        state: BlockState;
    } | {
        type: "minecraft:weighted_state_provider";
        entries: ListOfAtLeastOne<{ data: BlockState; weight: number; }>;
    } | {
        type: "minecraft:randomized_int_state_provider";
        property: VanillaBlockStateProperties;
        values: IntProvider;
        source: Provider;
    } | {
        type: "minecraft:noise_provider";
        seed: bigint | number;
        noise: VanillaNoises | Noise;
        scale: number;
        states: ListOfAtLeastOne<BlockState>;
    } | {
        type: "minecraft:dual_noise_provider";
        seed: bigint | number;
        noise: VanillaNoises | Noise;
        scale: number;
        slow_noise: VanillaNoises | Noise;
        variety: { min_inclusive: number; max_inclusive: number; } | [number, number] | number;
        states: BlockState[];
    } | {
        type: "minecraft:noise_threshold_provider";
        seed: bigint | number;
        noise: VanillaNoises | Noise;
        scale: number;
        threshold: number;
        high_chance: number;
        default_state: BlockState;
        low_states: ListOfAtLeastOne<BlockState>;
        high_states: ListOfAtLeastOne<BlockState>;
    } | {
        type: string;
        [key: string]: any;
    }
}

export type FluidState = { /* TODO */ } | FluidState.Properties;

export namespace FluidState {
    export type Properties = {
        falling?: BlockStateBoolean;
        level?: BlockStateInteger<1 | 2 | 3 | 4 | 5 | 6 | 7 | 8>;
    }
}

type StripHash<T extends string> = T extends `#${infer Tag}` ? Tag : T;

export type BlockPredicate = {
    type: VanillaBlockPredicateTypes;
} | {
    type: "minecraft:true";
} | {
    type: "minecraft:all_of";
} | {
    type: "minecraft:any_of";
    predicates: BlockPredicate[];
} | {
    type: "minecraft:not";
    predicate: BlockPredicate;
} | {
    type: "minecraft:has_sturdy_face";
    offset?: [number, number, number];
} | {
    type: "minecraft:inside_world_bounds";
    offset?: [number, number, number];
} | {
    type: "minecraft:matching_block_tag";
    offset?: [number, number, number];
    tag: StripHash<VanillaBlockTags>;
} | {
    type: "minecraft:matching_blocks";
    offset?: [number, number, number];
    blocks: IdentifierOrTag<VanillaBlocks, VanillaBlockTags>;
} | {
    type: "minecraft:replaceable";
    offset?: [number, number, number];
} | {
    type: "minecraft:solid";
    offset?: [number, number, number];
} | {
    type: "minecraft:would_survive";
    offset?: [number, number, number];
    state: BlockState;
} | {
    type: string;
    [key: string]: any;
}
