import { useCachedState } from "@/Caching";
import { useAlerts } from "@/Components/AlertsProviderContext";
import { useClientReadyEffect, useSubscribeEffect, WebsocketClient } from "@/Websocket";
import { API } from "@shared/API";
import { protocolToVersionRange } from "@shared/MinecraftVersion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

type ServerListEntry = {
    id: string;
    name: string;
    favicon: string;
    port: number;
    state: string;
    players: [ number, number ];
    protocols: number[];
    software: string;
}
export function ServerList() {
    const DEFAULT_MOTD = "";
    const DEFAULT_FAVICON = "/images/grass_block.png";

    const [ serverList, setServerList ] = useCachedState<ServerListEntry[]>("server-list");
    const [ page, setPage ] = useState<number>(0);
    const [ count, setCount ] = useState<number>(10);

    useClientReadyEffect(() => {
        WebsocketClient.sendAndWait(API.Type.ServerList, {
            "pagination": { count, page }
        }).then(response => {
            setServerList(response.servers.map(s => ({
                "id": s.id,
                "name": s.name,
                "state": s.state,
                "port": s.port,
                "players": s.players,
                "favicon": s.favicon ? `data:image/png;base64,${s.favicon}` : DEFAULT_FAVICON,
                "protocols": s.protocols,
                "software": s.software
            })));
        }).catch(console.error);
    }, [ page, count ]);

    useSubscribeEffect(API.Type.StateChange, (error, data) => {
        setServerList(prev => prev ? prev.map(entry => {
            if (entry.id == data.id) {
                return { ...entry, ...data }
            }
            return entry;
        }) : prev);
    });

    return <div className="overflow-y-scroll relative w-full h-full py-2.5 scrollbar-gutter-both scrollbar-track-transparent scrollbar-thumb-secondary">
        <ul className={`flex flex-col gap-1 transition-opacity duration-500 ${serverList ? "opacity-100" : "opacity-0"}`}>
            {serverList ? serverList.map(entry => <ServerEntry key={entry.id} entry={entry}/>) : ""}
        </ul>
        <div className={`flex items-center pointer-events-none justify-center w-full h-full transition-opacity duration-500 absolute top-0 left-0 ${serverList ? "opacity-0" : "opacity-100"}`}>
            <span>Loading servers...</span>
        </div>
    </div>
}

type ServerEntryProps = {
    entry: ServerListEntry;
}
function ServerEntry({ entry }: ServerEntryProps) {
    const showAlert = useAlerts();
    const [ transitioning, setTransitioning ] = useState(false);

    const stateColor = {
        "online": "chip-safe",
        "offline": "chip-severe",
        "starting": "chip-warn",
        "stopping": "chip-warn"
    }[entry.state];

    const canStateUpdate = entry.state == "online" || entry.state == "offline";
    const stateChangeBtn = entry.state == "online" ? "btn-icon-severe" : "btn-icon-safe";
    const stateChangeIcon = {
        "online": "fa-stop",
        "offline": "fa-play",
        "starting": "fa-hourglass",
        "stopping": "fa-hourglass"
    }[entry.state]

    const serverPanelRoot = `/server/${entry.id}`;

    const stateChanger = (id: string) => {
        if (transitioning) return;
        setTransitioning(true);
        WebsocketClient.sendAndWait(API.Type.StateChange, { id });

        if (entry.state == "online") {
            showAlert("Stopping server...", "power-off");
        } else {
            showAlert("Starting server...", "power-off");
        }
    }

    useEffect(() => setTransitioning(!canStateUpdate), [ entry ]);

    return <li className={`group relative flex flex-row items-center gap-3 py-4 px-4.5 bg-bg-primary rounded-xl overflow-hidden`}>
        <div className="z-0 absolute top-0 bottom-0 left-0 aspect-square bg-black">
            <div className="absolute pointer-events-none h-full w-full bg-linear-to-l from-bg-primary to-bg-primary/75 group-hover:to-bg-primary/0 transition-colors"></div>
            <Link to={serverPanelRoot}>
                <img className="h-full aspect-square" src={entry.favicon} alt="Server icon" />
            </Link>
        </div>

        <div className="z-1 flex flex-col gap-0.5 h-full aspect-square mr-5">
            <div className="chip-bg-hint" title={`${entry.players[0]} of ${entry.players[1]} players connected`}>
                <Link to={serverPanelRoot + "/players"}>
                    <span>{entry.players[0]}</span>
                    <span>/</span>
                    <span>{entry.players[1]}</span>
                </Link>
            </div>

            <button
                title="Copy port"
                className="code cursor-pointer"
                onClick={e => {
                    const el = e.target as HTMLButtonElement;
                    window.getSelection()?.selectAllChildren(el);
                    navigator.clipboard.writeText(`:${entry.port}`);
                    showAlert("Server port copied to clipboard", "clipboard");
                }}
            >{entry.port}</button>
        </div>

        <div className={`transition-[width] size-1.5 rounded-full ${stateColor} duration-500 transition-colors`}>
            <span className="hidden">{entry.state}</span>
        </div>
        
        <div className="flex flex-row gap-2 items-center flex-1">
            <div className="capitalize text-xl">
                <Link to={serverPanelRoot}>
                    <span>{entry.name}</span>
                </Link>
            </div>

            <div className="flex-1 space-x-1">
                {
                    entry.software
                        ? <div className={entry.software == "nodeblock" ? "chip-info" : "chip-info"}>{entry.software}</div>
                        : ""
                }
                {
                    entry.protocols.map(s => {
                        const versionRange = protocolToVersionRange(s);
                        let versionString = "";
                        if (versionRange) {
                            if (Array.isArray(versionRange)) {
                                versionString = versionRange.toReversed().join(" - ");
                            } else {
                                versionString = versionRange;
                            }
                        } else {
                            versionString = "protocol" + s;
                        }
                        return <div key={s} className="chip-bg-hint">{versionString}</div>
                    })
                }
            </div>

            <div className="group-hover:opacity-100 transition-opacity duration-100 opacity-0 flex flex-row gap-1">
                <Link to={`#`}>
                    <button
                        className={`${transitioning ? "btn-icon-secondary loading" : stateChangeBtn}`}
                        disabled={transitioning}
                        onClick={() => stateChanger(entry.id)}
                        title="Start/stop server"
                    >
                        {
                            transitioning
                                ? <i className="fas fa-hourglass"></i>
                                : <>
                                    <i className={`fas ${stateChangeIcon}`}></i>
                                    <span className="sr-only">Start/Stop</span>
                                </>
                        }
                    </button>
                </Link>
                <Link to={`${serverPanelRoot}/console`}>
                    <button className="btn-icon-info" title="Open server console">
                        <i className="fas fa-terminal"></i>
                        <span className="sr-only">Console</span>
                    </button>
                </Link>
                <Link to={`${serverPanelRoot}/settings`}>
                    <button className="btn-icon-warn" title="Manage server settings">
                        <i className="fas fa-gears"></i>
                        <span className="sr-only">Settings</span>
                    </button>
                </Link>
            </div>

            {/* <div className="absolute text-hint text-sm bottom-0 right-0 p-2">{entry.id}</div> */}
        </div>
    </li>
}