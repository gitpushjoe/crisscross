import { Protocol, message } from './protocol';
import User from '../user/types'

function handleInput(input: string, user : User): string {
    const startTime = Date.now();
    const message = Protocol.parse(input);
    if (!message.error) user.emit(message);
    const endTime = Date.now();
    return JSON.stringify(message, null, 4) + ` ${endTime - startTime}ms`;
}

export default handleInput;