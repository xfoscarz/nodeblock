import { BufferedReader } from "@/Network/BufferedIO";
import { ServerboundPacket } from "@/Network/Packet";
import {
    ServerboundPingRequestPacket,
    ServerboundStatusRequestPacket
} from "@/Network/Packets.barrel";

export default Status;
namespace Status {
    export async function decode(reader: BufferedReader, packetID: number): Promise<ServerboundPacket> {
        switch (packetID) {
            case 0x0: // STATUS_REQUEST
                return new ServerboundStatusRequestPacket();
            case 0x1: // PING_REQUEST
                const timestamp = await reader.readNextLong();
                return new ServerboundPingRequestPacket(timestamp);
        }

        throw new TypeError("Packet decode error. State: Status");
    }
}