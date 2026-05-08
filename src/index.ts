import { LegacyText } from "@/Minecraft/Text";
import { Versions } from "./Minecraft/MinecraftVersion";
import Server from "./Network/Server";

const server = new Server({
    minecraftVersions: [ Versions["1.21.11"] ],
    motd: {
        centered: true,
        text: LegacyText.transform("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
    }
});
server.start({ minecraft: true });