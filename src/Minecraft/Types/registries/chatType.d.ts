import { TextComponent } from "../../Text";
import { VanillaTranslatables } from "../vanilla/textComponents";

export type ChatType = {
    chat: {
        translation_key: VanillaTranslatables;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
    narration: {
        translation_key: VanillaTranslatables;
        parameters: ( "sender" | "target" | "content" )[];
        style?: TextComponent.Styles;
    }
}