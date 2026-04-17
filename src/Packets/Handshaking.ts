import { BufferedReader } from "../BufferedIO";
import { Packet } from "./Packet";
import { HandshakePacket } from "./Serverbound";

export namespace Handshaking {
    export async function decode(reader: BufferedReader, packetID: number): Promise<Packet> {
        switch (packetID) {
            case 0x0: // HANDSHAKE
                const protocolVersion = await reader.readNextVarInt();
                const serverAddress = await reader.readNextString();
                const serverPort = await reader.readNextUnsignedShort();
                const nextState = await reader.readNextVarInt();
                return new HandshakePacket(protocolVersion, serverAddress, serverPort, nextState);
        }

        throw new TypeError("Packet decode error");
    }
}