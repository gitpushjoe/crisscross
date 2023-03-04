import { Ensured } from '../utils/types';

enum MessageType {
    Request,
    Share,
    Reply,
    Success,
    Error,
    Failure,
}

class Message<DetailType> {
    constructor(
        public readonly type: MessageType,
        public readonly detail: DetailType,
        public readonly sender: string,
        public payload: object
    ) {
        this.type = type;
        this.detail = detail;
        this.sender = sender;
        this.payload = payload;
    }

    get pack(): [MessageType, {detail: DetailType, sender: string, payload: object}] {
        return [this.type, {detail: this.detail, sender: this.sender, payload: this.payload}];
    }
}

function messageFactory<DetailType, PayloadType extends object = object>(type: MessageType, detail: DetailType) {
    return class extends Message<DetailType> {
        constructor(public payload: PayloadType, public sender: string) {
            super(type, detail, sender, payload);
        }
    }
}

function errorFactory<DetailType>(detail: DetailType) {
    return messageFactory<DetailType, {error: string}>(MessageType.Error, detail);
}
//     return class extends Message<DetailType> {
//         constructor(public payload: {error: string}, public sender: string) {
//             super(MessageType.Error, detail, sender, payload);
//         }
//     }
// }

function nullFactory<DetailType>(type: MessageType, detail: DetailType) {
    return messageFactory<DetailType, {}>(type, detail);
}
//     return class extends Message<DetailType> {
//         constructor(public sender: string) {
//             super(MessageType.Success, detail, sender, {});
//         }
//     }
// }

const nf = nullFactory<MessageType>(MessageType.Success, MessageType.Success);

export {
    MessageType,
    Message,
    errorFactory,
    nullFactory,
    messageFactory
}