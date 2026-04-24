import { VanillaSoundEvents } from "../vanilla/sounds";

export type SoundEvent = VanillaSoundEvents | {
    sound_id: VanillaSoundEvents;
    range?: number;
}

export type DelayedSoundEvent = {
    max_delay: number;
    min_delay: number;
    sound: SoundEvent;
    replace_current_music?: boolean;
}