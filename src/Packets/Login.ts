import { BufferedReader } from "../BufferedIO";
import { Packet } from "./Packet";
import { LoginAcknowledged, LoginStartPacket } from "./Serverbound";

export namespace Login {
    export async function decode(reader: BufferedReader, packetID: number): Promise<Packet> {
        switch (packetID) {
            case 0x0: // LOGIN_START
                const name = await reader.readNextString();
                const playerUUID = await reader.readNextUUID();
                return new LoginStartPacket(name, playerUUID);
            case 0x3: // LOGIN_ACKNOWLEDGED
                return new LoginAcknowledged();
        }

        throw new TypeError("Packet decode error");
    }
}