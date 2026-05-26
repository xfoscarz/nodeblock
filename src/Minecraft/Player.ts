import { Entity } from "@/Minecraft/Entity";
import GameProfile from "@/Minecraft/GameProfile";

export class Player extends Entity {
    constructor(
        private _profile: GameProfile
    ) {
        super();

    }

    public get profile() { return this._profile; }
}