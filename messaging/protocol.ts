import { Ensured } from '../utils/types';

enum MessageType {
    request = 'request',
    post = 'post',
    reply = 'reply',
    success = 'success',
    error = 'error',
    failure = 'failure',
}

type message = {
    type: string,
    topic: string,
    [arg: string]: string|object,
}

type protocolError = {
    error: {
        errorType: string,
        [arg: string]: string|number|object,
    }
}

type returnObject = message | protocolError;

class ProtocolClass {
    public readonly syntaxes: Map<string, string[]>; // type topic arg1 arg2 arg3
    public readonly validTypes: Set<string>;
    public readonly validTopics: Set<string>;
    constructor(
        syntaxes: string[],
        public readonly argValidations: {[key: string]: (value: string) => boolean},
    ) {
        this.syntaxes = new Map<string, string[]>();
        this.validTypes = new Set<string>();
        this.validTopics = new Set<string>();
        for (const syntax of syntaxes) {
            if (syntax.split(' ').length < 2) {
                throw new Error(`Invalid syntax: ${syntax}`);
            }
            const [type, topic, ...args] = syntax.split(' ');
            this.validTypes.add(type);
            this.validTopics.add(topic);
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
            const [myArg, templateArg] = [commandSplit[a] !== '{}' ? commandSplit[a] : json, template[a]];
            if (templateArg.startsWith('$')) {
                const argName = templateArg.slice(1);
                if (typeof myArg === 'string' && this.argValidations[argName] && !this.argValidations[argName](myArg)) {
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

    public validateArgs(message: message) : boolean {
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
        'request host $username $privacy $cwSize $capacity', // to-do: warn logic
        'success host $roomInfo_success_host',
        'error host $errorMsg',
        'warn host $warnMsg',

        'request join $roomCode $username',
        'success join $roomInfo_success_join',
        'error join $errorMsg',

        'request leave $roomCode',
        'success leave',
        'error leave $errorMsg',

        'post start $countdownEnable',
        'broadcast start $timeToStart $roomInfo_broadcast_start',
        'error start $errorMsg',

        'post crossword $crossword',
        'broadcast crossword $roomInfo_broadcast_crossword',
        'error crossword $errorMsg',

        'broadcast hintLetter $timeToHint $hintLetter $roomInfo_broadcast_hintLetter',

        'post verifycw $crossword',
        'broadcast end $timeToEnd $roomInfo_broadcast_end',
        'error verifycw $errorMsg',

        'post close',
        'broadcast close',
        'error close $errorMsg',

        'dev get all',
        'reply dev $data'
    ], {
        username: (value: string) => value.length > 0 && /^[a-zA-Z0-9]+$/.test(value),
        privacy: (value: string) => value == 'public' || value == 'private',
        cwSize: (value: string) => value == 'mini' || value == 'medium' || value == 'max',
        capacity: (value: string) => parseInt(value) > 1 && parseInt(value) <= 16,
        roomCode: (value: string) => (value.length == 8) && Boolean(parseInt(value)),
        errorMsg: (value: string) => value.length > 0,
        warnMsg: (value: string) => value.length > 0,
        ignoreWarnings: (value: string) => value == 'true' || value == 'false'
    }
);

export { MessageType, Protocol, };
export type { message, protocolError };