import { DataComponentNBT } from "./dataComponent";
import { DialogNBT } from "./dialog";

type ComponentNBT = (({
    type?: "text";
    text: string;
} | {
    type?: "translatable";
    translate: string;
    fallback?: string;
    width?: string[] 
} | {
    type?: "score";
    score: {
        name: string;
        objective: string;
    }
} | {
    type?: "selector";
    selector: string;
    separator?: TextComponentNBT;
} | {
    type?: "keybind";
    keybind: string;
} | {
    type?: "nbt";
    source?: "block" | "entity" | "storage";
    nbt: string;
    interpret?: boolean;
    separator?: TextComponentNBT;
    entity?: string;
    block?: string;
    storage?: string;
} | {
    type?: "atlas";
    object?: "atlas";
    atlas?: string;
    sprite: string;
} | {
    type?: "player";
    object: "player";
    player: string | {
        name: string;
        id?: [ number, number, number, number ];
        properties?: [{
            name: "textures"
            value: string;
            signature?: string;
        }];
        texture?: string;
        cape?: string;
        elytra?: string;
        model?: "wide" | "slim";
    }
}) & {
    extra?: TextComponentNBT[];
    color?: "black" | "dark_blue" | "dark_green" | "dark_aqua" | "dark_red" | "dark_purple" | "gold" | "gray" | "dark_gray" | "blue" | "green" | "aqua" | "red" | "light_purple" | "yellow" | "white" | `#${string}`
    font?: string;
    bold?: boolean;
    italic?: boolean;
    underlined?: boolean;
    strikethrough?: boolean;
    obfuscated?: boolean;
    shadow_color?: number | [ number, number, number, number ];
    insertion?: string;
    click_event?: TextClickEventNBT;
    hover_event?: TextHoverEventNBT;
});

export type TextComponentNBT = (string | ComponentNBT) | (string | ComponentNBT)[];

type TextClickEventNBT = {
    action: "open_url";
    url: string;
} | {
    action: "open_file";
    path: string;
} | {
    action: "run_command";
    command: string;
} | {
    action: "suggest_command";
    command: string;
} | {
    action: "change_page";
    page: number;
} | {
    action: "copy_to_clipboard";
    value: string;
} | {
    action: "show_dialog";
    dialog: string | DialogNBT;
} | {
    action: "custom";
    id: string;
    payload?: string;
};

type TextHoverEventNBT = {
    action: "show_text";
    value: (string | TextComponentNBT)[];
} | {
    action: "show_item";
    id: string;
    count?: number;
    components?: DataComponentNBT;
} | {
    action: "show_entity";
    name?: string;
    id: string;
    uuid: string | [ number, number, number, number ]
};