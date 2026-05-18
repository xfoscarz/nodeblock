import type { API } from "@shared/API";
import { wait } from "@shared/Util";
import { useEffect } from "react";

type Handler<T extends API.Type> = (error: boolean, data: API.Response<T>["data"]) => void;

class WebsocketError extends Error {}
export class WebsocketTimeoutError extends Error {}

const ENDPOINT = location.host === "localhost:5173" ? "ws://localhost:3000" : "/";

abstract class WebsocketSingleton {
    public static readonly MAX_RETRIES = 10;

    public static reconnectHandler: () => void = () => {}
    
    private static _handlers = {} as Record<API.Type, Set<Handler<API.Type>>>;
    private static _client: WebSocket;
    private static _closed: boolean = false;
    private static _retries: number = 0;
    
    public static async getClient(): Promise<WebSocket> {
        if (this._retries >= WebsocketSingleton.MAX_RETRIES) throw new WebsocketError("Could not connect to service");

        if (!this._client || this._closed) {
            this._client = new WebSocket(ENDPOINT);

            return new Promise(res => {
                this._client.onmessage = async message => {
                    await wait(2000); // BUG artificial latency

                    this._retries = 0;
                    
                    try {
                        const data = JSON.parse(message.data) as API.Response<API.Type>;

                        if (!(data.datatype in this._handlers)) return;

                        for (const handler of this._handlers[data.datatype]) {
                            handler(!data.success, data.data);
                        }
                    } catch (error) {
                        console.error(error);
                    }
                }

                this._client.onopen = () => {
                    this._closed = false;
                    res(this._client!);
                    if (this._retries !== 0) this.reconnectHandler();
                }
                this._client.onclose = () => {
                    this._closed = true;

                    setTimeout(() => {
                        this._retries++;
                        console.log("Attempting reconnect...", this._retries);
                        this.getClient();
                    }, 3000);
                }
                this._client.onerror = console.error;
            });
        }
    
        if (this._client.readyState == this._client.OPEN) {
            return this._client;
        } else {
            return new Promise(res => {
                const resolver = () => {
                    this._client.removeEventListener("open", resolver);
                    res(this._client);
                }

                this._client.addEventListener("open", resolver);
            });
        }
    }

    public static subscribe<T extends API.Type>(event: T, handler: Handler<T>): () => void {
        if (!(event in this._handlers)) this._handlers[event] = new Set();
        this._handlers[event].add(handler as Handler<API.Type>);
        return () => { this._handlers[event].delete(handler as Handler<API.Type>) };
    }

    public static send<T extends API.Type>(type: T, data: API.Request<T>["data"]) {
        const payload: API.Request<T> = { datatype: type, data }

        this.getClient()
            .then(client => client.send(JSON.stringify(payload)))
            .catch(console.error);
    }
}

export namespace WebsocketClient {
    export function subscribe<T extends API.Type>(event: T, handler: Handler<T>) {
        return WebsocketSingleton.subscribe(event, handler);
    }
    
    export function send<T extends API.Type>(event: T, data: API.Request<T>["data"]) {
        WebsocketSingleton.send(event, data);
    }
    
    export function sendAndWait<T extends API.Type>(event: T, data: API.Request<T>["data"], timeout: number = -1): Promise<API.Response<T>["data"]> {
        WebsocketSingleton.send(event, data);
        
        return new Promise((res, rej) => {
            let timeoutProcess: number;
            
            const unsubscribe = WebsocketSingleton.subscribe(event, (error, data) => {
                if (error) rej(data);
                else res(data);
                unsubscribe();
                
                if (timeout !== -1) clearInterval(timeoutProcess);
            });
            
            if (timeout !== -1) {
                timeoutProcess = setTimeout(() => {
                    unsubscribe();
                    rej(new WebsocketTimeoutError("Response timed out"));
                }, timeout);
            }
        });
    }

}

export function useSubscribeEffect<T extends API.Type>(event: T, handler: Handler<T>, dependencies: any[] = []) {
    useEffect(() => WebsocketClient.subscribe(event, handler), dependencies);
}

export function useClientReadyEffect(handler: () => void, dependencies: any[] = []) {
    useEffect(() => {
        WebsocketSingleton.reconnectHandler = handler;
        handler();
        return () => { WebsocketSingleton.reconnectHandler = () => {} };
    }, dependencies);
}