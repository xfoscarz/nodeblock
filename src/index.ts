import { writeFileSync } from "node:fs";
import { chatcolor } from "./Minecraft/legacyText";
import { MinecraftVersions } from "./Minecraft/versions";
import Server from "./Network/Server";
import attributes from "./Data/Registries/attributes";

// const server = new Server({
//     minecraftVersions: [ MinecraftVersions.V_1_21_11 ],
//     motd: {
//         centered: true,
//         text: chatcolor("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
//     },
//     webPanelPort: 5000
// });
// server.start({ minecraft: true });