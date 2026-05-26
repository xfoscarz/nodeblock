import { printBuffer } from "@/Debug";
import { Identifier } from "@/Minecraft/Identifier";
import { ClientboundPacket } from "@/Network/Packet";

export const REQUIRED_REGISTRIES: Record<string, string[]> = {
            "damage_type": [
                "cactus",
                "campfire",
                "cramming",
                "dragon_breath",
                "drown",
                "dry_out",
                "ender_pearl",
                "fall",
                "fly_into_wall",
                "freeze",
                "generic",
                "generic_kill",
                "hot_floor",
                "in_fire",
                "in_wall",
                "lava",
                "lightning_bolt",
                "magic",
                "on_fire",
                "out_of_world",
                "outside_border",
                "stalagmite",
                "starve",
                "sweet_berry_bush",
                "wither"
            ],
            "dimension_type": [ "overworld" ],
            "painting_variant": [
                "alban",
                "aztec",
                "aztec2",
                "backyard",
                "baroque",
                "bomb",
                "bouquet",
                "burning_skull",
                "bust",
                "cavebird",
                "changing",
                "cotan",
                "courbet",
                "creebet",
                "dennis",
                "donkey_kong",
                "earth",
                "endboss",
                "fern",
                "fighters",
                "finding",
                "fire",
                "graham",
                "humble",
                "kebab",
                "lowmist",
                "match",
                "meditative",
                "orb",
                "owlemons",
                "passage",
                "pigscene",
                "plant",
                "pointer",
                "pond",
                "pool",
                "prairie_ride",
                "sea",
                "skeleton",
                "skull_and_roses",
                "stage",
                "sunflowers",
                "sunset",
                "tides",
                "unpacked",
                "void",
                "wanderer",
                "wasteland",
                "water",
                "wind",
                "wither"
            ],
            "worldgen/biome": [ "plains" ],
            "cat_variant": [ "all_black", "black", "british_shorthair", "calico", "jellie", "persian", "ragdoll", "red", "siamese", "tabby", "white" ],
            "cow_variant": [ "cold", "temperate", "warm" ],
            "chicken_variant": [ "cold", "temperate", "warm" ],
            "frog_variant": [ "cold", "temperate", "warm" ],
            "pig_variant": [ "cold", "temperate", "warm" ],
            "wolf_variant": [ "ashen", "black", "chestnut", "pale", "rusty", "snowy", "spotted", "striped", "woods" ],
            "wolf_sound_variant": [ "angry", "big", "classic", "cute", "grumpy", "puglin", "sad"],
            "zombie_nautilus_variant": [ "temperate", "warm" ]
        };

// TODO
export default class ClientboundRegistryDataPacket extends ClientboundPacket {
    constructor(
        public name: string,
        public contents: string[]
    ) {
        super(0x07);
    }

    public override write(): void {
        this.writeIdentifier(this.name);
        this.writePrefixedArray(this.contents.length, i =>
            this.writeIdentifier(this.contents[i])
                .writePrefixedOptional(false, () => {}) // TODO
        );
    }
}