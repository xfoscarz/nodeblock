import { ChatType } from "../../Minecraft/Types/registries/chatType";

const chatTypes: Record<string, ChatType> = {
    "chat": {
        "chat": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text"
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    },
    "emote_command": {
        "chat": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.emote"
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.emote"
        }
    },
    "msg_command_incoming": {
        "chat": {
            "parameters": ["sender", "content"],
            "translation_key": "commands.message.display.incoming",
            "style": { "color": "gray", "italic": true }
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    },
    "msg_command_outgoing": {
        "chat": {
            "parameters": ["target", "content"],
            "translation_key": "commands.message.display.outgoing",
            "style": { "color": "gray", "italic": true }
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    },
    "say_command": {
        "chat": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.announcement"
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    },
    "team_msg_command_incoming": {
        "chat": {
            "parameters": ["target", "sender", "content"],
            "translation_key": "chat.type.team.text"
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    },
    "team_msg_command_outgoing": {
        "chat": {
            "parameters": ["target", "sender", "content"],
            "translation_key": "chat.type.team.sent"
        },
        "narration": {
            "parameters": ["sender", "content"],
            "translation_key": "chat.type.text.narrate"
        }
    }
}

export default chatTypes;