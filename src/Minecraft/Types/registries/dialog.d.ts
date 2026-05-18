import { ListOfAtLeastOne } from "../../../PortWatcher";
import { TextComponent } from "../../Text";
import { DialogAction, DialogBody, DialogInput } from "../primitives/dialog";
import { VanillaDialogTypes } from "../vanilla/dialog";

export type Dialog = {
    title: TextComponent;
    external_title?: TextComponent;
    body?: DialogBody | DialogBody[];
    inputs?: DialogInput;
    can_close_with_escape?: boolean;
    pause?: boolean;
    after_action?: "close" | "none" | "wait_for_response";
} & ({
    type: VanillaDialogTypes;
} | {
    type: "minecraft:notice";
    action?: DialogAction.Labeled;
} | {
    type: "minecraft:confirmation";
    yes: DialogAction.Labeled;
    no: DialogAction.Labeled;
} | {
    type: "minecraft:multi_action";
    actions: ListOfAtLeastOne<DialogAction.Labeled>;
    columns?: number;
    exit_action: DialogAction.Labeled;
} | {
    type: "minecraft:server_links";
    exit_action: DialogAction.Labeled;
    columns?: number;
    button_width?: number;
} | {
    type: "minecraft:dialog_list";
    dialogs: string | Dialog | (string | Dialog)[];
    exit_action: DialogAction.Labeled;
    columns?: number;
    button_width?: number;
} | {
    type: string;
    [key: string]: any;
});