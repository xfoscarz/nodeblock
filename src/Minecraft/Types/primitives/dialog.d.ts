import { ListOfAtLeastOne, StringContaining } from "../../../PortWatcher";
import { TextComponent } from "../../Text";
import { Dialog } from "../registries/dialog";
import { VanillaActionTypes, VanillaDialogBodyTypes, VanillaInputTypes } from "../vanilla/dialog";
import { VanillaItems } from "../vanilla/items";

export type DialogBody = {
    type: VanillaDialogBodyTypes;
} | {
    type: "minecraft:plain_message";
    contents: Exclude<TextComponent, TextComponent.NBT | TextComponent.Score | TextComponent.Selector>;
    width?: number;
} | {
    type: "minecraft:item";
    item: VanillaItems | {
        id: VanillaItems;
        count?: number;
        components?: []; // TODO Item Component
    }
    description?: {
        contents: Exclude<TextComponent, TextComponent.NBT | TextComponent.Score | TextComponent.Selector>;
        width?: number;
    }
    show_decoration?: boolean;
    show_tooltip?: boolean;
    width?: number;
    height?: number;
} | {
    type: string;
    [key: string]: any;
}

export type DialogInput = {
    key: string;
    label: TextComponent;
} & ({
    type: VanillaInputTypes;
} | {
    type: "minecraft:text";
    width?: number;
    label_visible?: boolean;
    initial?: string;
    max_length?: number;
    multiline?: {
        max_lines?: number;
        height?: number;
    }
} | {
    type: "minecraft:boolean";
    initial?: boolean;
    on_true?: string;
    on_false?: string;
} | {
    type: "minecraft:single_option";
    label_visible?: boolean;
    width?: number;
    options: ListOfAtLeastOne<{
        id: string;
        display: TextComponent;
        initial: boolean;
    }>;
} | {
    type: "minecraft:number_range";
    label_format?: string;
    width?: number;
    start: number;
    end: number;
    step?: number;
    initial?: number;
});

export type DialogAction = {
    type: VanillaActionTypes;
} | {
    type: "minecraft:open_url";
    url: string;
} | {
    type: "minecraft:run_command";
    command: string;
} | {
    type: "minecraft:suggest_command";
    command: string;
} | {
    type: "minecraft:change_page";
    page: number;
} | {
    type: "minecraft:copy_to_clipboard";
    value: string;
} | {
    type: "minecraft:show_dialog";
    dialog: string | Dialog;
} | {
    type: "minecraft:custom";
    id: string;
    payload?: any;
} | {
    type: "minecraft:dynamic/run_command";
    template: StringContaining<`$(${string})`>;
} | {
    type: "minecraft:dynamic/custom";
    additions?: any;
    id: string;
} | {
    type: string;
    [key: string]: any;
}

export namespace DialogAction {
    export type Labeled = {
        label: TextComponent;
        tooltip?: TextComponent;
        width?: number;
        action?: DialogAction;
    }
}