import { useCachedState } from "@/Caching";
import { useClientReadyEffect, useSubscribeEffect, WebsocketClient } from "@/Websocket";
import { API } from "@shared/API";
import { useState } from "react";
import { Link } from "react-router-dom";

type ServerListEntry = {
    id: string;
    name: string;
    favicon: string;
    port: number;
    state: string;
    players: [ number, number ],
    motd: string;
}
export function ServerList() {
    const DEFAULT_MOTD = "";
    const DEFAULT_FAVICON = "/brand.png";

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
                "motd": s.motd || DEFAULT_MOTD,
                "port": s.port,
                "players": s.players,
                "favicon": s.favicon ? `data:image/png;base64,${s.favicon}` : DEFAULT_FAVICON
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

    return <div className="overflow-scroll relative w-full h-full p-3">
        <ul className={`flex flex-col gap-1 transition-opacity duration-500 ${serverList ? "opacity-100" : "opacity-0"}`}>{serverList ? serverList.map(entry => <ServerEntry key={entry.id} entry={entry}/>) : ""}</ul>
        <div className={`flex items-center pointer-events-none justify-center w-full h-full transition-opacity duration-500 absolute top-0 left-0 ${serverList ? "opacity-0" : "opacity-100"}`}>
            <span>Loading servers...</span>
        </div>
    </div>
}

type ServerEntryProps = {
    entry: ServerListEntry;
}
function ServerEntry({ entry }: ServerEntryProps) {
    const stateColor = {
        "online": "color-safe bg-safe",
        "offline": "color-severe bg-severe",
        "starting": "color-warn bg-warn",
        "stopping": "color-warn bg-warn"
    }[entry.state];

    const canStateUpdate = entry.state == "online" || entry.state == "offline";
    const stateChangeBtn = entry.state == "online" ? "btn-icon-severe" : "btn-icon-safe";
    const stateChangeIcon = entry.state == "online" ? "fa-stop" : "fa-play";

    const serverPanelRoot = `/server/${entry.id}`;

    return <li className={`group flex flex-row items-center gap-3 p-4 bg-bg-primary rounded-lg`}>
        <div className={`transition-[width] size-1.5 rounded-full ${stateColor} duration-500 transition-colors`}>
            <span className="hidden">{entry.state}</span>
        </div>
        {/* <div>
            <img src={entry.favicon} />
        </div> */}
        <div className="flex flex-row gap-2 items-center flex-1">
            <div className="capitalize">
                <Link to={serverPanelRoot}>
                    <span>{entry.name}</span>
                </Link>
            </div>

            <div className="chip-bg-hint">
                <span>{entry.players[0]}</span>
                <span>/</span>
                <span>{entry.players[1]}</span>
            </div>

            <div className="group-hover:opacity-100 transition-opacity duration-250 opacity-0 flex-1 flex flex-row gap-1">
                <Link to={`#`}>
                    <button className={`${stateChangeBtn} loading`} disabled={!canStateUpdate}>
                        <i className={`fas ${stateChangeIcon}`}></i>
                        <span className="sr-only">Start/Stop</span>
                    </button>
                </Link>
                <Link to={`${serverPanelRoot}/console`}>
                    <button className="btn-icon-info">
                        <i className="fas fa-terminal"></i>
                        <span className="sr-only">Console</span>
                    </button>
                </Link>
                <Link to={`${serverPanelRoot}/settings`}>
                    <button className="btn-icon-warn">
                        <i className="fas fa-gears"></i>
                        <span className="sr-only">Settings</span>
                    </button>
                </Link>
            </div>

            {/* <div>
                <span className="text-hint">{entry.id}</span>
                <span>{entry.port}</span>
            </div> */}
        </div>

        <button
            title="Copy IP address"
            className="code cursor-pointer"
            onClick={() => {
                navigator.clipboard.writeText("")
            }}
        >:{entry.port}</button>
    </li>
}