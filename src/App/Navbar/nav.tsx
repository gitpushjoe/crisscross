import HamburgerMenu from 'react-hamburger-menu';
import { useState } from 'react';
import { FiSettings } from 'react-icons/fi';
import './nav.css';

const Nav = (props: {theme: any, username: any, setScreen: Function}) => {
    const [isOpen, setIsOpen] = useState(false);
    const theme = props.theme;
    return <>
        <nav id='navbar' style={{backgroundColor: theme ? "white" : "black", 
        borderColor: theme ? "black": "#444444",
        color: theme ? "black": "white"}}>
            <div className='padding' style={{width: '2%'}}></div>
            <HamburgerMenu isOpen={isOpen}  color={!theme ? "white" : "black"} menuClicked={() => setIsOpen(io => !io)} />
            <p className='heading'>crisscross.live</p>
            <p className='heading username'>{props.username}</p>
            <FiSettings className='heading settings' onClick={() => props.setScreen(0)}/>
        </nav>
    </>
}

export default Nav;