type TextComponents = (
    | TextComponent.Text
    | TextComponent.Translatable
    | TextComponent.Score
    | TextComponent.Selector
    | TextComponent.Keybind
    | TextComponent.NBT
    | TextComponent.Atlas
    | TextComponent.Player
) & TextComponent.Styles;

export type TextComponent = string | TextComponents | (string | TextComponents)[];

export namespace TextComponent {
    export type Text = {
        type?: "text";
        text: string;
    }

    export type Translatable = {
        type?: "translatable";
        translate: VanillaTranslatables;
        fallback?: string;
        width?: string[];
    }

    export type Score = {
        type?: "score";
        score: {
            name: string;
            objective: string;
        }
    }

    export type Selector = {
        type?: "selector";
        selector: string;
        separator?: TextComponents;
    }

    export type Keybind = {
        type?: "keybind";
        keybind: VanillaKeybinds;
    }

    export type NBT = {
        type?: "nbt";
        source?: "block" | "entity" | "storage";
        nbt: string;
        interpret?: boolean;
        separator?: TextComponents;
        entity?: string;
        block?: string;
        storage?: string; // TODO resource location
    }

    export type Atlas = {
        type?: "atlas";
        object?: "atlas";
        atlas?: string; // TODO texture atlas
        sprite: string; // TODO sprite name
    }

    export type Player = {
        type?: "player";
        object: "player";
        player: string | {
            name: string;
            id?: [number, number, number, number];
            properties?: [
                {
                    name: "textures";
                    value: string;
                    signature?: string;
                }
            ];
            texture?: string;
            cape?: string;
            elytra?: string;
            model?: "wide" | "slim";
        };
    }

    export type Styles = {
        extra?: TextComponents[];
        color?:
            | "black"
            | "dark_blue"
            | "dark_green"
            | "dark_aqua"
            | "dark_red"
            | "dark_purple"
            | "gold"
            | "gray"
            | "dark_gray"
            | "blue"
            | "green"
            | "aqua"
            | "red"
            | "light_purple"
            | "yellow"
            | "white"
            | `#${string}`;
        font?: string;
        bold?: boolean;
        italic?: boolean;
        underlined?: boolean;
        strikethrough?: boolean;
        obfuscated?: boolean;
        shadow_color?: number | [number, number, number, number];
        insertion?: string;
        
        click_event?: {
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
            dialog: string | Dialog;
        } | {
            action: "custom";
            id: string;
            payload?: any;
        };

        hover_event?: {
            action: "show_text";
            value: (string | TextComponents)[];
        } | {
            action: "show_item";
            id: string;
            count?: number;
            components?: {}; // TODO DataComponent
        } | {
            action: "show_entity";
            name?: string;
            id: string;
            uuid: string | [number, number, number, number];
        };
    }
}