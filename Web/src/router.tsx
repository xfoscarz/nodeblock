import { createBrowserRouter } from "react-router-dom";
import Home from "@/Pages/Home";
import ServerIndex from "@/Pages/Server/Index";
import ServerConsole from "@/Pages/Server/Console";
import ServerSettings from "@/Pages/Server/Settings";
import ServerPlayerManager from "@/Pages/Server/PlayerManager";

import RootLayout from "@/Layouts/RootLayout";
import ServerLayout from "@/Layouts/ServerLayout";

export default createBrowserRouter([
    {
        Component: RootLayout,

        children: [
            {
                index: true,
                Component: Home
            },
            {
                path: "server/:serverID",
                Component: ServerLayout,

                children: [
                    { index: true, Component: ServerIndex, },
                    { path: "console", Component: ServerConsole },
                    { path: "settings", Component: ServerSettings },
                    { path: "players", Component: ServerPlayerManager }
                ]
            }
        ]
    }
]);