import { LegacyText } from "@/Minecraft/Text";
import { corePackFor, ServerState } from "@/Network/NodeblockServer";
import { NodeblockServerGroup } from "@/Nodeblock";
import { Versions } from "@shared/MinecraftVersion";
import { wait } from "@shared/Util";

const container = new NodeblockServerGroup([{
    name: "main",
    port: 25565,
    minecraftVersions: [ Versions["1.21.11"] ],
    motd: {
        centered: true,
        text: LegacyText.transform("&r&c❤ &9&lHatsune &b&lMiku &r&c❤")
    },
    packs: [ corePackFor("1.21.11") ]
}]);

// container.addAndStart({
//     name: "second server",
//     port: 25566,
//     minecraftVersions: [ Versions["1.21.11"] ],
//     motd: {
//         centered: true,
//         text: LegacyText.transform("&r&c❤ &9&lHatsune &b&lMiku &r&c❤\n&c&lSecond Server!")
//     }
// });

// const privateServer = container.addAndStart({
//     name: "private server",
//     port: 25577,
//     minecraftVersions: [ Versions["1.21.11"] ]
// });

// container.addAndStart({
//     name: "dev server",
//     port: 25578,
//     softwareName: "nodepixel",
//     minecraftVersions: [ Versions["1.21.11"] ]
// })

// container.addAndStart({
//     name: "old combat",
//     port: 25579,
//     minecraftVersions: [ Versions["1.8.9"] ]
// })

// privateServer.on("statechange", state => {
//     if (state == ServerState.ONLINE) {
//         wait(2_000).then(() => privateServer.stop());
//     }
// })

// container.attachWeb(3000).useDefaultWebPanel();
// container.attachDefaultWebMonitor();