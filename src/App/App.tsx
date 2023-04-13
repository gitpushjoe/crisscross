import React, { useEffect, useRef, useState } from 'react';
import "./App.css";
import SpinningCircles from './Background/circles';
import Nav from './Navbar/nav';
import Settings from './Settings/settings';
import Lobby from './Lobby/lobby';
import { io } from 'socket.io-client';
import { message } from '../../messaging/protocol';
import User from '../../user/types';
import Game from './Game/game';

function App(props: {user: User, socket: any}) {
    const [username, setUsername] = useState(localStorage.getItem("username") || "");
    const [theme, setTheme] = useState(localStorage.getItem("theme") === "true" || false);
    const [screen, setScreen] = useState(username === "" ? 0 : 1);
    const {user, socket} = props;

    socket.on('connect', () => {
        console.log('%c connected', 'color: lightgreen; font-weight: bold;')
        user.socket = socket;
    });
    
    socket.on('disconnect', () => {
        console.log('%c disconnected', 'color: red; font-weight: bold;')
        user.socket = null;
    });
    
    socket.on('response', (msg: message) => {
        console.log(`%c type: ${msg.type}`, 'color: orange; font-weight: bold;');
        console.log(`%c topic: ${msg.topic}`, 'color: orange; font-weight: bold;');
        console.log(`%c raw: ${JSON.stringify(msg)}`, 'color: yellow; font-weight: bold;');
        if (msg.type === 'warn')
            alert(msg.errorMsg);
        else if (msg.type === 'error')
            alert(msg.errorMsg);
        else if (msg.type === 'success' && msg.topic === 'host')
            setScreen(2);
    });

    return (
        <>
            <SpinningCircles theme={theme} />
            <Nav theme={theme} username={username} setScreen={setScreen}/>
            {screen === 0 ? <Settings theme={theme} setTheme={setTheme} setScreen={setScreen} refreshUsername={setUsername}/> : 
            screen === 1 ? <Lobby theme={theme} user={props.user} username={username}/> : 
            screen === 2 ? <Game/> : <></>}
            
        </>
    );
  }

export default App;
