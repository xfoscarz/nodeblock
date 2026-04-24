import { BlockState } from "./block";
import { VanillaParticles } from "../vanilla/particles";
import { VanillaItems } from "@/Minecraft/Types/vanilla/items";

export type Particle = {
    type: VanillaParticles;
} | {
    type: "minecraft:block" | "minecraft:block_crumble" | "minecraft:block_marker" | "minecraft:dust_pillar" | "minecraft:falling_dust";
    block_state: BlockState;
} | {
    type: "minecraft:dragon_breath";
    power?: number;
} | {
    type: "minecraft:dust";
    color: number | [number, number, number];
    scale: number;
} | {
    type: "minecraft:dust_color_transition";
    from_color: number | [number, number, number];
    to_color: number | [number, number, number];
    scale: number;
} | {
    type: "minecraft:effect" | "minecraft:instant_effect";
    power?: number;
    color?: number | [number, number, number];
} | {
    type: "minecraft:entity_effect" | "minecraft:flash";
    color: number | [number, number, number];
} | {
    type: "minecraft:item";
    item: { id: string; components?: {} } | VanillaItems;
} | {
    type: "minecraft:sculk_charge";
    roll: number;
} | {
    type: "minecraft:shriek";
    delay: number;
} | {
    type: "minecraft:trail";
    target: [number, number, number];
    color: number | [number, number, number];
    duration: number;
} | {
    type: "minecraft:vibration";
    destination: { type: "block"; pos: [number, number, number]; };
    arrival_in_ticks: number;
} | {
    type: string;
    [key: string]: any;
}
