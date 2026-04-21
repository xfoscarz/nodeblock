import { BufferedReader } from "../BufferedIO";
import { Packet } from "./Packet";
import { AcknowledgeFinishConfiguration, ClientInformationPacket, ServerboundKeepAliveConfigurationPacket, ServerboundPluginMessagePacket } from "./Serverbound";

export namespace Configuration {
    export async function decode(reader: BufferedReader, packetID: number): Promise<Packet> {
        switch (packetID) {
            case 0x0: // CLIENT_INFORMATION
                const locale = await reader.readNextString();
                const viewDistance = await reader.readNextByte();
                const chatMode = await reader.readNextVarInt();
                const chatColors = await reader.readNextBoolean();
                const displayedSkinParts = await reader.readNextUnsignedByte();
                const mainHand = await reader.readNextVarInt();
                const enableTextFiltering = await reader.readNextBoolean();
                const allowServerListings = await reader.readNextBoolean();
                const particleStatus = await reader.readNextVarInt();
                return new ClientInformationPacket(
                    locale,
                    viewDistance,
                    chatMode,
                    chatColors,
                    displayedSkinParts,
                    mainHand,
                    enableTextFiltering,
                    allowServerListings,
                    particleStatus
                );
            case 0x2: // SERVERBOUND_PLUGIN_MESSAGE
                const identifier = await reader.readNextIdentifier();
                const data = await reader.readAllBytes();
                return new ServerboundPluginMessagePacket(identifier, data);
            case 0x3: // ACKNOWLEDGE_FINISH_CONFIGURATION
                return new AcknowledgeFinishConfiguration();
            case 0x4: // SERVERBOUND_KEEP_ALIVE
                const keepAliveID = await reader.readNextLong();
                return new ServerboundKeepAliveConfigurationPacket(keepAliveID);
        }
        throw new TypeError("Packet decode error");
    }
}