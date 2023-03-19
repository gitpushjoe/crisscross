import { Ensured } from '../utils/types';

enum MessageType {
    request = 'request',
    post = 'post',
    reply = 'reply',
    success = 'success',
    error = 'error',
    failure = 'failure',
}

type successfulReturn = {
    type: string,
    topic: string,
    [arg: string]: string|object,
}

type errorReturn = {
    error: {
        errorType: string,
        [arg: string]: string|number|object,
    }
}

type returnObject = successfulReturn | errorReturn;

class ProtocolClass {
    public readonly syntaxes: Map<string, string[]>; // type topic arg1 arg2 arg3
    constructor(
        syntaxes: string[],
        public readonly validTypes: string[],
        public readonly validTopics: string[],
        public readonly argValidations: {[key: string]: (value: string) => boolean},
    ) {
        this.syntaxes = new Map<string, string[]>();
        for (const syntax of syntaxes) {
            const [type, topic, ...args] = syntax.split(' ');
            if (validTypes.indexOf(type) == -1) {
                throw new Error(`Invalid type: ${type}`);
            }
            if (validTopics.indexOf(topic) == -1) {
                throw new Error(`Invalid topic: ${topic}`);
            }
            if (this.syntaxes.has(`${type} ${topic}`)) {
                throw new Error(`Duplicate definition for: ${type} ${topic}`);
            }
            this.syntaxes.set(`${type} ${topic}`, syntax.split(' '));
        }
    }

    public parse(command: string, json: object = {}) : returnObject {
        const commandSplit = command.split(' ');
        if (commandSplit.length < 2) {
            return {error: {errorType: 'incomplete', commandLength: commandSplit.length}};
        }
        const [type, topic, ...args] = command.split(' ');
        const template = this.syntaxes.get(`${type} ${topic}`);
        if (!template) {
            return {error: {errorType: 'no_template', type, topic}};
        }
        if (template.length != args.length + 2) {
            return {error: {errorType: 'syntax', template: template.join(' ')}};
        }
        let argMap : returnObject = {type, topic};
        for (let a in template) {
            const [myArg, templateArg] = [commandSplit[a] !== '{}' ? commandSplit[a] : JSON.stringify(json), template[a]];
            if (templateArg.startsWith('$')) {
                const argName = templateArg.slice(1);
                if (this.argValidations[argName] && !this.argValidations[argName](myArg)) {
                    return {error: {errorType: 'argument', argName, argValue: myArg, argValidation: this.argValidations[argName].toString()}};
                }
                argMap[argName] = myArg;
            }
        }
        return argMap;
    }

    public validate(command: string, json: object = {}) : boolean {
        const commandSplit = command.split(' ');
        if (commandSplit.length < 2) {
            return false;
        }
        const [type, topic, ...args] = command.split(' ');
        const template = this.syntaxes.get(`${type} ${topic}`);
        if (!template || template.length != args.length + 2) {
            return false;
        }
        for (let a in template) {
            const [myArg, templateArg] = [args[a] !== '{}' ? args[a] : JSON.stringify(json), template[a]];
            if (templateArg.startsWith('$')) {
                const argName = templateArg.slice(1);
                if (this.argValidations[argName] && !this.argValidations[argName](myArg)) {
                    return false;
                }
            }
        }
        return true;
    }

    public validateArgs(message: successfulReturn) : boolean {
        if (message.error) {
            return false;
        }
        for (const key in message) {
            if (this.argValidations[key] && !this.argValidations[key](message[key] as string)) {
                return false;
            }
        }
        return true;
    }
}

const Protocol = new ProtocolClass(
    [
        'request host $username $privacy $cwSize $capacity',
        'success host $roomInfo_success_host',
        'error host $errorMsg',

        'request join $roomCode $username',
        'success join $roomInfo_success_join',
        'error join $errorMsg',

        'request leave $roomCode',
        'success leave',
        'error leave $errorMsg',

        'post ready $roomCode $readyStatus',
        'broadcast ready $roomInfo_broadcast_ready',
        'error ready $errorMsg',

        'post crossword $roomCode $crossword',
        'broadcast crossword $roomInfo_broadcast_crossword',
        'error crossword $errorMsg',
    ], [
        'request',
        'post',
        'reply',
        'success',
        'error',
        'failure',
        'broadcast'
    ], [
        'host',
        'join',
        'leave',
        'ready',
        'crossword',
    ], {
        username: (value: string) => value.length > 0 && /^[a-zA-Z0-9]+$/.test(value),
        privacy: (value: string) => value == 'public' || value == 'private',
        cwSize: (value: string) => value == 'mini' || value == 'medium' || value == 'max',
        capacity: (value: string) => parseInt(value) > 0 && parseInt(value) <= 16,
        roomCode: (value: string) => (value.length == 6) && Boolean(parseInt(value)),
        readyStatus: (value: string) => value == 'true' || value == 'false',
        errorMsg: (value: string) => value.length > 0
    }
);

export { MessageType, Protocol, };
export type { successfulReturn, errorReturn, returnObject };