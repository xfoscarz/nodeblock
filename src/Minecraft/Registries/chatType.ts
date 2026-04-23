import { TextComponent } from "../textComponent";

export type ChatType = {
    chat: {
        translation_key: string;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
    narration: {
        translation_key: string;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
}