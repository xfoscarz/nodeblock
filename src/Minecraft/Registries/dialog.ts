import { ListOfAtLeastOne, StringContaining } from "../../Util";
import { TextComponent } from "../textComponent";

type DialogNBT = {
    title: TextComponent;
    external_title?: TextComponent;
    body?: Dialog.Body | Dialog.Body[];
    inputs?: Dialog.Input;
    can_close_with_escape?: boolean;
    pause?: boolean;
    after_action?: "close" | "none" | "wait_for_response";
} & ({
    type: "minecraft:notice";
    action?: Dialog.LabeledAction;
} | {
    type: "minecraft:confirmation";
    yes: Dialog.LabeledAction;
    no: Dialog.LabeledAction;
} | {
    type: "minecraft:multi_action";
    actions: ListOfAtLeastOne<Dialog.LabeledAction>;
    columns?: number;
    exit_action: Dialog.LabeledAction;
} | {
    type: "minecraft:server_links";
    exit_action: Dialog.LabeledAction;
    columns?: number;
    button_width?: number;
} | {
    type: "minecraft:dialog_list";
    dialogs: Dialog | Dialog[];
    exit_action: Dialog.LabeledAction;
    columns?: number;
    button_width?: number;
});

namespace Dialog {
    export type Body = {
        type: "minecraft:plain_message";
        contents: Exclude<TextComponent, TextComponent.NBT | TextComponent.Score | TextComponent.Selector>;
        width?: number;
    } | {
        type: "minecraft:item";
        item: string | {
            id: string;
            count?: number;
            components?: []; // TODO ItemComponent s
        }
        description?: {
            contents: Exclude<TextComponent, TextComponent.NBT | TextComponent.Score | TextComponent.Selector>;
            width?: number;
        }
        show_decoration?: boolean;
        show_tooltip?: boolean;
        width?: number;
        height?: number;
    }

    export type Input = {
        key: string;
        label: TextComponent;
    } & ({
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

    export type LabeledAction = {
        label: TextComponent;
        tooltip?: TextComponent;
        width?: number;
        action?: Dialog.Action;
    }

    export type Action = {
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
        dialog: Dialog;
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
    }
}

export type Dialog = DialogNBT | string;