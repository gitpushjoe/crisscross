// import { MessageType, Message, messageFactory, errorFactory, nullFactory } from "./types";
import { Ensured } from "../utils/types";

interface RoomActivity {

}

interface RoomInfo {
    roomCode?: string;
    hostName?: string;
    capacity?: number;
    activity?: RoomActivity;
}

// enum RoomTopic {
//     Host,
//     Join,
//     Leave,
//     Ready,
// }

// const { Host, Join, Leave, Ready } = RoomTopic;
// const { Request, Share, Reply, Success, Error, Failure } = MessageType;

// function roomMessageFactory<P extends keyof RoomInfo>(type: MessageType, topic: RoomTopic) {
//     return messageFactory<RoomTopic, Ensured<RoomInfo, P>>(type, topic);
// }

// function roomErrorFactory(topic: RoomTopic) { return errorFactory<RoomTopic>(topic); }
// function roomNullFactory(type: MessageType, topic: RoomTopic) { return nullFactory<RoomTopic>(type, topic); }

// const RequestHost = roomMessageFactory<'hostName' | 'capacity'>(Request, Host);
// const SuccessHost = roomMessageFactory<keyof RoomInfo>(Success, Host);
// const FailureHost = roomErrorFactory(Host);

// const RequestJoin = roomMessageFactory<'roomCode'>(Request, Join);
// const SuccessJoin = roomMessageFactory<keyof RoomInfo>(Success, Join);
// const FailureJoin = roomErrorFactory(Join);

// const RequestLeave = roomMessageFactory<'roomCode'>(Request, Leave);
// const SuccessLeave = roomNullFactory(Success, Leave);
// const FailureLeave = roomErrorFactory(Leave);

// export const RoomMsg = { RequestHost, SuccessHost, FailureHost, RequestJoin, SuccessJoin, FailureJoin, RequestLeave, SuccessLeave, FailureLeave };
// export default RoomTopic;

// export const ShareReady = messageFactory<'roomCode'|>('Share', 'Ready');

export type { RoomInfo };

