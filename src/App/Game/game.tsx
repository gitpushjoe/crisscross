import './game.css';
import { FiArrowDown, FiArrowRight } from 'react-icons/fi';

const Game = () => {
    return <>
        <div className="main-container">
            <div className="main-container-flex">
                <div className="game-container">
                    <div className="game-header">
                        <p>
                        <b>5<FiArrowRight className="arrow"/></b>&nbsp;Provincial capital in the Dominican Republic.
                        </p>
                    </div>
                    <canvas id="canvas"></canvas>
                </div>
                <div className="game-info-container">
                    <div className="top clues-container">
                        <div className="across header">Across</div>
                            <div className="across clues-container">
                                <div className="across clue">
                                    <div className="square">1</div>
                                    <div className="clue-text">Gale of wind.</div>
                                </div>
                                <div className="across clue">
                                    <div className="square">5</div>
                                    <div className="clue-text">Provincial capital in the Dominican Republic.</div>
                                </div>
                                <div className="across clue">
                                    <div className="square">6</div>
                                    <div className="clue-text">Rogen and Green.</div>
                                </div>
                                <div className="across clue">
                                    <div className="square">7</div>
                                    <div className="clue-text">Gazelle gait.</div>
                                </div>
                                <div className="across clue">
                                    <div className="square">8</div>
                                    <div className="clue-text">Sp. compass point.</div>
                                </div>
                            </div>
                        <div className="down header">Down</div>
                            <div className="down clues-container">
                                    <div className="down clue">
                                        <div className="square">1</div>
                                        <div className="clue-text">Engineering degrees.</div>
                                    </div>
                                    <div className="down clue">
                                        <div className="square">2</div>
                                        <div className="clue-text">Family of a 20's-30's tennis star.</div>
                                    </div>
                                    <div className="down clue">
                                        <div className="square">3</div>
                                        <div className="clue-text">Figure-eight steps, in an Argentine tango</div>
                                    </div>
                                    <div className="down clue">
                                        <div className="square">4</div>
                                        <div className="clue-text">"But to see her ___ love her": Burns</div>
                                    </div>

                                </div>
                    </div>
                    <div className="leaderboard">
                        
                    </div>
                </div>
            </div>
        </div>
    </>
}

export default Game;