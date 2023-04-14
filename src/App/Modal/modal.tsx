import './modal.css';
import { BiPlusMedical as BiX } from 'react-icons/bi';

type optType = [string, string, string, Function];
type headerType = [string, string];

const Modal = (props: {theme: Boolean, header: headerType, prompt: string, opts: optType[], closeModal: Function}) => {
    return <>
        <div className="modal-background"></div>
        <div className="modal">
            <BiX className="close-button" onClick={() => props.closeModal()}></BiX>
            <div className="modal-header" style={{color: props.header[1], marginBottom: 0}}>
               <b>{props.header[0]}</b>
            </div>
            <div className="modal-prompt">
                {props.prompt}
            </div>
            <div className="padding" style={{
                height: '.5em',
                width: '100%',
                backgroundColor: 'transparent',
            }}></div>            
            <div className="modal-options-container">
                {props.opts.map((opt, i) => {
                    return <div className="modal-option" key={i}>
                        <button className="modal-option-button" style={{backgroundColor: opt[2]}} onClick={() => {props.closeModal(); opt[3]();}}>{opt[0]}
                        </button>
                    </div>
                })
                }
            </div>
        </div>
    </>
}

export default Modal;