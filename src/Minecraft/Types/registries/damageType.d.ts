export type DamageType = {
    message_id: string;
    exhaustion: number;
    scaling: "never" | "always" | "when_caused_by_living_non_player";
    effects?: "hurt" | "thorns" | "drowning" | "burning" | "poking" | "freezing";
    death_message_type?: "default" | "fall_variants" | "intentional_game_design";
}