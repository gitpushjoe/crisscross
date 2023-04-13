import { useState } from "react";
import "./settings.css";

const Settings = (props: {theme: boolean, setTheme: Function, setScreen: Function, refreshUsername: Function}) => {
    const {theme, setTheme, setScreen} = props;
    const [username, setUsername] = useState(localStorage.getItem('username') as string || '');
    const [validUsername, setValidUsername] = useState(username.length > 2 && username.length <= 16 && /^[a-zA-Z0-9]+$/.test(username));
    const handleUsernameUpdate = (e: any) => {
        const user = e.target.value.replace(/\W/g, '');
        setUsername(prev => user);
        setValidUsername(user.length > 2 && user.length <= 16 && /^[a-zA-Z0-9]+$/.test(user))
    };
    const handleClick = () => {
        if (validUsername) {
            localStorage.setItem("username", username);
            localStorage.setItem("theme", theme.toString());
            props.refreshUsername(username);
            setScreen(1);
        }
    }
    return <>
            <div className={`container ${theme ? 'light' : 'dark'}`}>
                <p className="label">Username:</p>
                <input className="input" type="text" placeholder="" onChange={handleUsernameUpdate} value={username}/>
                <br></br>
                <p className="label">Theme:</p>
                <div className={`theme-toggle`} onClick={() => setTheme(!theme)}>
                    <div className={`toggle-circle ${theme ? 'light' : 'dark'}`}></div>
                </div>
                <div className={`done ${validUsername ? 'clickable' : 'unclickable'}`} onClick={handleClick}>Done!</div>
            </div></>
}

export default Settings