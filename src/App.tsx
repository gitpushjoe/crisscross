import { useState, useRef, useEffect } from 'react'
import { RoomInfo, RoomMsg } from '../communications/rooms'
import { io } from 'socket.io-client'
import User from '../user/types'
import './App.css'

const socket = io('http://localhost:3000', {
    query: {
        arg: new URLSearchParams(window.location.search).toString()
    }
});

let user = new User(
    localStorage.getItem('username') ?? '',
    localStorage.getItem('publicId') ?? '',
    localStorage.getItem('privateId') ?? '',
    socket
);

socket.on('Reply', (msg: any) => {
    console.log(msg);
});

function App() {

    const [coralText, lightGreenText, whiteText] = [
        "color: coral; font-weight: bold;",
        "color: #8BC34A;",
        "color: white;"
    ]
    const [message, setMessage] = useState('')
    const messageRef = useRef<HTMLInputElement>(null);
    const sendMessage = () => {
        const input: string = messageRef.current?.value!;
        const inputWords = input.split(' ');
        switch (inputWords[0]) {
            case 'host': {
                const hostName = inputWords[1];
                const capacity = inputWords[2];
                const sender = inputWords[3];
                console.log(`%csending RequestHost: \n%c   host: %c${hostName} \n%c   capacity: %c${capacity}  \n%c   sender: %c${sender}`,
                    coralText, whiteText, lightGreenText, whiteText, lightGreenText, whiteText, lightGreenText);
            }
        }
    }
    return <>
        <p>Post message: &nbsp;
        <span>
            <input type="text" id="message" ref={messageRef}/>
            <button onClick={sendMessage}>Send</button>
            </span>
        </p>
        <p className="guide"><strong>host</strong> {'<hostName> <capacity> <sender>'}</p>
    </>
}

export default App
