import { MojangAPI } from "../Network/MojangAPI";
import { toBase64 } from "../Util";
import UUID from "./UUID";

interface GameProfileProperties {
    textures: {
        timestamp: number;
        profileId: UUID;
        profileName: string;
        signatureRequired?: boolean;
        textures: {
            SKIN?: { url: string; metadata?: { model: "slim" } };
            CAPE?: { url: string; }
        };
    };
};

export default class GameProfile implements GameProfileProperties {
    private constructor(
        public readonly uuid: UUID,
        public readonly textures: GameProfileProperties["textures"],
        public readonly username: string
    ) {}

    public getBase64Data() {
        return toBase64(JSON.stringify(this.textures));
    }

    public static async fromUUID(uuid: UUID): Promise<GameProfile> {
        const properties = await MojangAPI.getSkin(uuid);
        
        if (properties) {
            return new GameProfile(uuid, {
                timestamp: Date.now(),
                profileId: uuid,
                profileName: properties.name,
                textures: properties.properties[0].value.textures
            }, properties.name);
        } else {
            return this.getDefault();
        }
    }

    public static async fromUsername(username: string): Promise<GameProfile> {
        const uuid = await MojangAPI.getUUID(username);
        if (!uuid) return GameProfile.getDefault();
        return GameProfile.fromUUID(uuid);
    }

    public static getDefault(name: string = "nodeblock") {
        const uuid = new UUID("f08fb6f8b56e4d84acbabc8dabf2b45d");
        const profile = new GameProfile(uuid, {
            timestamp: Date.now(),
            profileId: uuid,
            profileName: name,
            textures: {
                SKIN: { url: "http://textures.minecraft.net/texture/d0a951d0f4b6bd0ce51e08afff65f93ef07c00dd6fbff8564c13fe443581f74a" }
            }
        }, name);
        return profile;
    }
}