import React, { useState, useRef, useEffect } from 'react'
import { Room } from '../rooms/rooms'
import { io } from 'socket.io-client'
import { Protocol, message} from '../messaging/protocol'
import User from '../user/types'
import handleInput from '../messaging/client'
import './Shell.css'
import { Scheduler, Task } from '../utils/scheduling/scheduler'

function App(this: any) {

    let socket : any;
    let [user, setUser] = useState<User | null>(null);

    function makeConsoleText(text: string, color = 'white', bold = false, italic = false): ConsoleText {
        text = text.replace('\t', '    ');
        text = text.replace(' ', '\u00A0');
        return {
            text: text,
            color: color,
            bold: bold,
            italic: italic
        }
    }

    function useMessageLog(...text: ConsoleText[][]) {
        setMessageLog(m => [...m, ...text]);
        if (cursorRef && cursorRef.current)
            setTimeout(() => cursorRef.current!.scrollIntoView(), 2);
    };

    function createLocalLog(text: string): ConsoleText[] {
        return [makeConsoleText('local > ', 'brown', true), 
            makeConsoleText(text, 'tomato')]
    }

    useEffect(() => {if (!socket) {
        // const scheduler = new Scheduler();
        socket = io('http://localhost:3000', {
            withCredentials: true,
            query: {
                arg: new URLSearchParams(window.location.search).toString(),
            }
        });

        socket.on('connect', () => {
            useMessageLog(createLocalLog(`connected to localhost:3000 as ${socket.id}`));
        });

        setUser(_ => new User(
            localStorage.getItem('username') ?? '',
            localStorage.getItem('publicId') ?? '',
            localStorage.getItem('authId') ?? '',
            socket
        ));

        if (socket) {
            console.log(socket)
            socket.on('response', (msg: message) => {
                console.log(msg);
                useMessageLog([
                    makeConsoleText(`server >  ${msg.type} ${msg.topic} `, '#8BC34A', true),
                ]);
                for (const [key, value] of Object.entries(msg)) {
                    if (key !== 'type' && key !== 'topic') {
                        const val = typeof value === 'string' ? value : JSON.stringify(value, null, 4);
                        useMessageLog([
                            makeConsoleText(`\t${key}: `, 'lightgreen', true),
                            makeConsoleText(val, 'lightgreen')
                        ]);
                    }
                }
                handleServerMessage('reply ' + msg);
            });
        }
        
        function handleServerMessage(msg: string) {
            // scheduler.push(new Task(x => console.log(x), ['test'], -1, 1000), 1000);
            const msgWords = msg.split(' ');
            if (msg.startsWith('reply id ')) {
                const [idType, idData] = [msgWords[2], msgWords[3]]
                switch (idType) {
                    case 'auth': {
                        user!.authId = idData;
                        const prevId = localStorage.getItem('authId') ?? 'null';
                        localStorage.setItem('authId', idData);
                        useMessageLog(
                            createLocalLog(`authId: ${prevId} -> ${idData}`)
                        );
                    }
                }
            }
        }
    }}, []);

    const [coralText, lightGreenText, whiteText] = [
        "color: coral; font-weight: bold;",
        "color: #8BC34A;",
        "color: white;"
    ]

    interface ConsoleText {
        text: string;
        color: string;
        bold: boolean;
        italic: boolean;
    }

    const [message, setMessage] = useState('');
    const [messageLog, setMessageLog] = useState<ConsoleText[][]>([]);

    const messageRef = useRef<HTMLInputElement>(null);
    const cursorRef = useRef<HTMLInputElement>(null);
    const messageLogRef = useRef<HTMLInputElement>(null);

    const handleInputChange = (event: any) => {
        setMessage(event.target.value);
    };    

    function handleSubmit(e: any): React.FormEventHandler<HTMLFormElement> | undefined  {
        e.preventDefault();
        setMessage('');
        const response : string = handleInput(messageRef!.current!.value, user!);
        useMessageLog([
            makeConsoleText('client > ', 'orange', true),
            makeConsoleText(messageRef!.current!.value, 'lightgray')],
        createLocalLog(response));
        messageRef!.current!.value = '';
        cursorRef!.current!.scrollIntoView();
        return;
    }

    return <>
        <div className="shell">
            <div className="messageLog">
                {messageLog.map((text, index) => {
                    return <p key={`messageLog${index}`}>
                        {text.map((text, index) => {
                            return <span key={index} style={{color: text.color, fontWeight: text.bold ? 700 : 400, fontStyle: text.italic ? 'italic' : 'normal'}}>{text.text}</span>
                        })}
                    </p>
                })
                }
            </div>
            <form onSubmit={e => handleSubmit(e)}>
                <input autoFocus type="text" ref={messageRef} onChange={e => handleInputChange(e)} autoComplete='off' id="input"/>
            </form>
            <p ref={cursorRef}><span style={{color: 'orange', fontWeight: 700}}>{'client > '}</span>{message}</p>
        </div>
    </>
}

export default App
