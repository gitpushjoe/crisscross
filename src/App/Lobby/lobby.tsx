import './lobby.css';
import { FaPlus, FaLongArrowAltRight as FaJoin } from 'react-icons/fa';
import { useState, useRef } from 'react';
import User from '../../../user/types';

const Lobby = (props: {theme: any, user: User, username: string}) => {
    const {theme, username} = props;
    const [screen, setScreen] = useState(1);
    const privacy = useRef<any>(null);
    const difficulty = useRef<any>(null);
    const size = useRef<any>(null);
    const maxPlayers = useRef<any>(null);
    const emit = () => {
        props.user.emit(`request host ${username} ${privacy!.current!.value!} ${difficulty!.current!.value!} ${size!.current!.value!} ${maxPlayers!.current!.value!}`);
    }
    return <>
        <div className={'button create'} onClick={() => setScreen(0)}>
            <FaPlus></FaPlus>&nbsp;&nbsp;Create Room
        </div>
        <div className={'button join'}>
            <FaJoin></FaJoin>&nbsp;&nbsp;Join Room
        </div>
        {screen === 0 ? <div className={`create menu ${theme ? '' : 'invert'}`}>
            <p>Privacy:&nbsp;&nbsp;
                <select ref={privacy}>
                    <option value="private">Private</option>
                    <option value="public" disabled>Public</option>
                </select>
            </p>
            <p>Difficulty:&nbsp;&nbsp;
                <select ref={difficulty}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard" disabled>Hard</option>
                </select>
            </p>
            <p>Crossword Size:&nbsp;&nbsp;
                <select ref={size}>
                    <option value="mini">Mini (5x5)</option>
                    <option value="medium">Medium (7x7)</option>
                    <option value="max" disabled>Max (9x9)
                    </option>
                </select>
            </p>
            <p>Maximum Players: &nbsp;
                <select ref={maxPlayers}>
                    <option value="2">2</option>
                    <option value="3">3</option>
                    <option value="4">4</option>
                    <option value="5">5</option>
                    <option value="6">6</option>
                    <option value="7">7</option>
                    <option value="8">8</option>
                    <option value="9">9</option>
                    <option value="10">10</option>
                    <option value="11">11</option>
                    <option value="12">12</option>
                    <option value="13">13</option>
                    <option value="14">14</option>
                    <option value="15">15</option>
                    <option value="16">16</option>
                </select>
            </p>
            <div className={`host ${theme ? '' : 'invert'}`} onClick={emit}>Host!</div>
        </div> : <></>}
    </>;
}

export default Lobby;