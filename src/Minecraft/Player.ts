import { Entity } from "@/Minecraft/Entity";
import GameProfile from "@/Minecraft/GameProfile";
import Connection from "@/Network/Connection";

export class Player extends Entity {
    constructor(
        public readonly connection: Connection,
        private _profile: GameProfile
    ) {
        super();

    }

    public get uuid() { return this._profile.uuid; }
    public get profile() { return this._profile; }
}