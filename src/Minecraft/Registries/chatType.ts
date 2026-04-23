import { TextComponent } from "../textComponent";

export type ChatType = {
    chat: {
        translation_key: TextComponent.Translatable.VanillaKeys;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
    narration: {
        translation_key: TextComponent.Translatable.VanillaKeys;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
}