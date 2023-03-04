import { MessageType, Message, messageFactory, errorFactory, nullFactory } from "./types";
import { Ensured } from "../utils/types";

interface RoomActivity {

}

interface RoomInfo {
    roomCode?: string;
    hostName?: string;
    capacity?: number;
    activity?: RoomActivity;
}

enum RoomDetail {
    Host,
    Join,
    Leave,
    Ready,
}

const { Host, Join, Leave, Ready } = RoomDetail;
const { Request, Share, Reply, Success, Error, Failure } = MessageType;

function roomMessageFactory <P extends keyof RoomInfo>(type: MessageType, detail: RoomDetail) {
    return messageFactory<RoomDetail, Ensured<RoomInfo, P>>(type, detail);
}

function roomErrorFactory(detail: RoomDetail) {return errorFactory<RoomDetail>(detail);}
function roomNullFactory(type: MessageType, detail: RoomDetail) {return nullFactory<RoomDetail>(type, detail);}

// function messageFactory<P extends keyof RoomInfo>(type: keyof typeof MessageType, detail: keyof typeof RoomDetail) {
//     return class extends Message<RoomDetail> {
//         constructor(public payload: Ensured<RoomInfo, P>, public sender: string) {
//             super(MessageType[type], RoomDetail[detail], sender, payload);
//         }
//     }
// }

// function errorFactory(type: keyof typeof MessageType, detail: keyof typeof RoomDetail) {
//     return class extends Message<RoomDetail> {
//         constructor(public payload: {error: string}, public sender: string) {
//             super(MessageType[type], RoomDetail[detail], sender, payload);
//         }
//     }
// }

// function nullFactory(type: keyof typeof MessageType, detail: keyof typeof RoomDetail) {
//     return class extends Message<RoomDetail> {
//         constructor(public sender: string) {
//             super(MessageType[type], RoomDetail[detail], sender, {});
//         }
//     }
// }

export const RequestHost = roomMessageFactory<'hostName'|'capacity'>(Request, Host);
export const SuccessHost = roomMessageFactory<keyof RoomInfo>(Success, Host);
export const FailureHost = roomErrorFactory(Host);

export const RequestJoin = roomMessageFactory<'roomCode'>(Request, Join);
export const SuccessJoin = roomMessageFactory<keyof RoomInfo>(Success, Join);
export const FailureJoin = roomErrorFactory(Join);

export const RequestLeave = roomMessageFactory<'roomCode'>(Request, Leave);
export const SuccessLeave = roomNullFactory(Success, Leave);
export const FailureLeave = roomErrorFactory(Leave);

// export const ShareReady = messageFactory<'roomCode'|>('Share', 'Ready');

export type { RoomInfo };

