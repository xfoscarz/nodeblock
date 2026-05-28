import net from "node:net"

export async function serverPortListener(server: net.Server, port: number, callback: () => void = () => {}): Promise<void> {
    return new Promise(res => {
        server.listen(port, "127.0.0.1", () => [ res(), callback() ]);
    });
}

export async function waitForServerClose(server: net.Server): Promise<void> {
    if (!server.listening) return;

    const closePromise = new Promise<void>(res => server.once("close", () => res()));
    
    server.close();

    return closePromise;
}