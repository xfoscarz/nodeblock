export namespace API {
    export type Response<T extends Type> = {
        datatype: T;
        success: boolean;
        data: ResponseData[T];
    }

    export type Request<T extends Type> = {
        datatype: T;
        data: RequestData[T];
    }

    export enum Type {
        ServerList,
        StateChange,
    }
}

interface RequestData {
    [datatype: number]: any;

    [API.Type.ServerList]: {
        "search"?: string;
        "pagination"?: {
            "count": number,
            "page": number
        }
    }
    [API.Type.StateChange]: {
        "id": string;
    }
}

interface ResponseData {
    [datatype: number]: any;
    
    [API.Type.ServerList]: {
        "servers": {
            "id": string;
            "name": string;
            "state": string;
            "players": [ number, number ];
            "port": number;
            "favicon"?: string;
            "protocols": number[];
            "software": string;
        }[],
        "pagination"?: {
            "pages": number;
        }
    }

    [API.Type.StateChange]: {
        "id": string;
        "state": string;
        "players": [ number, number ];
    }
}


export class UnknownAPIDataTypeError extends Error {}