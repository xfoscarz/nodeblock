import { chatcolor } from "./Minecraft/legacyText";
import { MinecraftVersions } from "./Minecraft/versions";
import Server from "./Network/Server";

const server = new Server({
    minecraftVersions: [ MinecraftVersions.V_1_21_11 ],
    motd: {
        centered: true,
        text: chatcolor("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
    },
    webPanelPort: 5000
});
server.start({ minecraft: false });