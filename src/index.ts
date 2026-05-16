import { LegacyText } from "@/Minecraft/Text";
import Nodeblock from "@/Nodeblock";
import { Versions } from "@shared/MinecraftVersion";

const container = new Nodeblock.ServerContainer([{
    name: "main",
    port: 25565,
    minecraftVersions: [ Versions["1.21.11"] ],
    motd: {
        centered: true,
        text: LegacyText.transform("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
    }
}]);

container.addAndStart({
    name: "second server",
    port: 25566,
    minecraftVersions: [ Versions["1.21.11"] ],
    motd: {
        centered: true,
        text: LegacyText.transform("&r&c❤ &9&lHatsune &b&lMiku &r&c❤\n&c&lSecond Server!")
    }
});

container.attachWeb(3000).useDefaultWebPanel();