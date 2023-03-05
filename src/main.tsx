import React from 'react'
import ReactDOM from 'react-dom/client'
import Shell from './Shell'

const root : HTMLElement = document.getElementById('root')!;
if (root !== null) {
    ReactDOM.createRoot(root).render(
        <React.StrictMode>
            <Shell />
        </React.StrictMode>
    )
}