import { BufferedReader } from "../BufferedIO";
import { Packet } from "./Packet";
import { PingRequestPacket, StatusRequestPacket } from "./Serverbound";

export namespace Status {
    export async function decode(reader: BufferedReader, packetID: number): Promise<Packet> {
        switch (packetID) {
            case 0x0: // STATUS_REQUEST
                return new StatusRequestPacket();
            case 0x1: // PING_REQUEST
                const timestamp = await reader.readNextLong();
                return new PingRequestPacket(timestamp);
        }

        throw new TypeError("Packet decode error. State: Status");
    }
}