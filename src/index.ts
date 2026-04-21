import { readFileSync } from "node:fs";
import { NBT } from "./Minecraft/NBT/nbt";

const data = readFileSync("../test/bigtest.nbt");
NBT.parse(data).then(console.log);

// const server = new Server({
//     minecraftVersions: [ MinecraftVersions.V_1_21_11 ],
//     motd: {
//         centered: true,
//         text: chatcolor("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
//     },
//     webPanelPort: 5000
// });
// server.start({ minecraft: false });