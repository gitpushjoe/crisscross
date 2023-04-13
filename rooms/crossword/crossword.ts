import { createHash } from 'crypto';

interface Clue {
    square: number;
    clue: string;
    year?: number;
}

interface HintLetter {
    square: number;
    letter: string;
}

interface CrosswordPuzzle {
    crossword: string;
    hints?: HintLetter[];
    clues?: {
        across: Clue[];
        down: Clue[];
    },
    solution?: string;
}

function exampleCrossword(): Required<CrosswordPuzzle> {
    return {
        crossword: '0',
        hints: [],
        clues: {
            across: [
                {square: 1, clue: 'Gale of wind.'},
                {square: 6, clue: 'Provincial capital in the Dominican Republic.'},
                {square: 10, clue: 'Rogen and Green.'},
                {square: 16, clue: 'Gazelle gait.'},
                {square: 22, clue: 'Sp. compass point'},
            ],
            down: [
                {square: 1, clue: 'Engineering degrees.'},
                {square: 2, clue: 'Family of a 20\'s-30\'s tennis star.'},
                {square: 3, clue: 'Figure-eight steps, in an Argentine tango'},
                {square: 4, clue: '"But to see her ___ love her": Burns'},
            ]
        },
        solution: createHash('sha256').update('0blow0mocaseths0stot00sso').digest('hex')
    }
}

function randomCrossword(): Required<CrosswordPuzzle> {
    return exampleCrossword(); // for now
}

function hideLetters(crossword: CrosswordPuzzle): CrosswordPuzzle {
    return {
        crossword: crossword.crossword.replace(/[a-zA-Z]/g, '?'),
    }
}

function generateHint(players: CrosswordPuzzle[], previousHints: HintLetter[], answer: string): HintLetter {
    const previousSquares = previousHints.map(hint => hint.square);
    const squares = new Set<number>(Array.from({length: answer.length}, (_, i) => i));
    [...answer].forEach((l, i) => {l === '0' ? squares.delete(i) : null});
    previousSquares.forEach(square => squares.delete(square));
    if (squares.size === 0) return {square: -1, letter: ''};
    const square = [...squares][Math.floor(Math.random() * squares.size)];
    return {square, letter: answer[square]};
}

export type { CrosswordPuzzle, HintLetter, Clue };
export { exampleCrossword, randomCrossword, hideLetters, generateHint };
