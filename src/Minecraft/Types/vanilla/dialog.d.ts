
export type VanillaDialogTypes = (string & {})
    | "minecraft:notice"
    | "minecraft:confirmation"
    | "minecraft:multi_action"
    | "minecraft:server_links"
    | "minecraft:dialog_list";

export type VanillaDialogBodyTypes = (string & {})
    | "minecraft:plain_message"
    | "minecraft:item";

export type VanillaInputTypes = (string & {})
    | "minecraft:text"
    | "minecraft:boolean"
    | "minecraft:single_option"
    | "minecraft:number_range";

export type VanillaActionTypes = (string & {})
    | "minecraft:open_url"
    | "minecraft:run_command"
    | "minecraft:suggest_command"
    | "minecraft:change_page"
    | "minecraft:copy_to_clipboard"
    | "minecraft:show_dialog"
    | "minecraft:custom"
    | "minecraft:dynamic/run_command"
    | "minecraft:dynamic/custom";