export namespace HTTPAPI {
    export type APIResponse<T = any> = {
        success: boolean;
        data: T;
    }

    export type ServerListData = APIResponse<{
        "name": string;
        "online": boolean;
        "players": [ number, number ],
        "port": number;
        "motd"?: string;
        "favicon"?: string;
    }[]>;
}