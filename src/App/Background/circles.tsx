import { useState } from 'react';
import './circles.css';

const SpinningCircles = (props: {theme: boolean}) => {
    const theme = props.theme;
    document.body.setAttribute('style', `background-color: ${theme ? "#fdfdfd" : "#040404"}`);
    return <>
        <img src={'../resources/circle1.svg'} className={ `bgcircle ${theme ? "" : "invert"} `}></img>
        <img src={'../resources/circle2.svg'} className={ `bgcircle2 ${theme ? "" : "invert"} `}></img>
    </>
}

export default SpinningCircles;