import UUID from "@/Minecraft/UUID";
import { fromBase64 } from "@/Util";
import https from "node:http";

export namespace MojangAPI {
    export async function getUUID(username: string): Promise<UUID | null> {
        const REQUEST_URL = "https://api.mojang.com/users/profiles/minecraft/";

        let buffer = "";

        return new Promise((resolve, reject) => {
            https.get(REQUEST_URL + username, response => {
                response.on("data", chunk => buffer += chunk);
    
                response.on("end", () => {
                    if (response.statusCode == 404) {
                        resolve(null);
                        return;
                    } else {
                        const data = JSON.parse(buffer);
                        resolve(new UUID(data.id));
                    }
                });

                response.on("error", error => {
                    console.log(error);
                    reject("Authentication servers are currently down. Please try again later.");
                });
            });
        });
    }

    export type Texture = {
        timestamp: number;
        profileId: string;
        profileName: string;
        signatureRequired?: boolean;
        textures: {
            SKIN?: { url: string; metadata?: { model: "slim" } };
            CAPE?: { url: string; }
        }
    };
    export async function getSkin(uuid: UUID): Promise<{
        id: string;
        name: string;
        legacy?: boolean;
        properties: {
            name: "textures";
            signature?: string;
            value: Texture;
        }[]
    } | null> {
        const REQUEST_URL = "https://sessionserver.mojang.com/session/minecraft/profile/";

        let buffer = "";

        return new Promise((resolve, reject) => {
            https.get(REQUEST_URL + uuid.toString(false), response => {
                response.on("data", chunk => {
                    buffer += chunk;
                });

                response.on("end", () => {
                    if (response.statusCode == 204) {
                        resolve(null);
                    } else if (response.statusCode == 400) {
                        reject(response.statusMessage);
                    } else {
                        const data = JSON.parse(buffer);
                        data.properties = data.properties.map((property: { name: string, value: string }) => ({ name: property.name, value: JSON.parse(fromBase64(property.value)) }));
                        resolve(data);
                    }
                });

                response.on("error", error => {
                    console.log(error);
                    reject("Authentication servers are currently down. Please try again later.");
                });
            });
        });
    }
}