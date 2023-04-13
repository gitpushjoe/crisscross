import React from 'react' 
import ReactDOM from 'react-dom/client'
import Shell from './Shell/Shell'
import App from './App/App';
import User from '../user/types';
import { io } from 'socket.io-client';
import { message } from '../messaging/protocol';

const root : HTMLElement = document.getElementById('root')!;
const user = new User();
const socket = io('http://localhost:3000', {
        withCredentials: true,
        query: {
            arg: new URLSearchParams(window.location.search).toString(),
        }
 });

if (root !== null) {
    ReactDOM.createRoot(root).render(
        <>
            <App user={user} socket={socket}/>
        </>
    )
}