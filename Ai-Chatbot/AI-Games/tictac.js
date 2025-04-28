const board = document.querySelector('.board');
const cells = document.querySelectorAll('.cell');
const resetButton = document.getElementById('resetButton');
const multiplayerButton = document.getElementById('multiplayerButton');
const aiButton = document.getElementById('aiButton');

let currentPlayer = 'X';
let gameBoard = ['', '', '', '', '', '', '', '', ''];
let gameActive = true;
let gameMode = 'ai';

const winningCombos = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// Core Game Logic
function handleClick(e) {
    if (!gameActive) return;
    const index = e.target.dataset.index;
    if (gameBoard[index] !== '') return;

    gameBoard[index] = currentPlayer;
    e.target.classList.add(currentPlayer.toLowerCase());

    if (checkWin()) {
        endGame(`${currentPlayer} wins! 🎉`, true);
        return;
    }

    if (checkTie()) {
        endGame("It's a draw! 🤝", false);
        return;
    }

    currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    if (gameMode === 'ai' && currentPlayer === 'O') setTimeout(aiMove, 500);
}

function aiMove() {
    let bestMove = findBestMove(gameBoard);
    gameBoard[bestMove] = 'O';
    cells[bestMove].classList.add('o');

    if (checkWin()) {
        endGame("O wins! 🎉", true);
        return;
    }

    if (checkTie()) {
        endGame("It's a draw! 🤝", false);
        return;
    }

    currentPlayer = 'X';
}

function findBestMove(board) {
    let bestScore = -Infinity;
    let move = null;
    for (let i = 0; i < 9; i++) {
        if (board[i] !== '') continue;
        board[i] = 'O';
        let score = minimax(board, 0, false);
        board[i] = '';
        if (score > bestScore) {
            bestScore = score;
            move = i;
        }
    }
    return move;
}

function minimax(board, depth, isMaximizing) {
    if (checkWinMiniMax(board) === 'O') return 1;
    if (checkWinMiniMax(board) === 'X') return -1;
    if (checkTie()) return 0;

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = 'O';
            let score = minimax(board, depth + 1, false);
            board[i] = '';
            bestScore = Math.max(score, bestScore);
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (board[i] !== '') continue;
            board[i] = 'X';
            let score = minimax(board, depth + 1, true);
            board[i] = '';
            bestScore = Math.min(score, bestScore);
        }
        return bestScore;
    }
}

function checkWin() {
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (gameBoard[a] && gameBoard[a] === gameBoard[b] && gameBoard[a] === gameBoard[c]) {
            return combo;
        }
    }
    return null;
}

function checkTie() {
    return gameBoard.every(cell => cell !== '');
}

function checkWinMiniMax(board) {
    for (const combo of winningCombos) {
        const [a, b, c] = combo;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

// Animations and UI Updates
function endGame(msg, isWin) {
    gameActive = false;
    isWin ? celebrateWin() : celebrateDraw();
}

function celebrateWin() {
    const winningCombo = checkWin();
    const containerRect = board.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    cells.forEach((cell, index) => {
        if (winningCombo.includes(Number(cell.dataset.index))) {
            const rect = cell.getBoundingClientRect();
            cell.style.setProperty('--translateX', `${centerX - (rect.left + rect.width / 2)}px`);
            cell.style.setProperty('--translateY', `${centerY - (rect.top + rect.height / 2)}px`);
            if (currentPlayer === 'X') {
                cell.style.setProperty('--scale', '1.9');
            } else {
                cell.style.setProperty('--scale', '1.5');
            }
            cell.style.animation = 'collectAndFix 1.5s forwards';
            cell.style.backgroundColor = 'transparent';
            cell.style.borderColor = 'transparent';
        } else {
            cell.style.opacity = '0';
        }
    });
}

function celebrateDraw() {
    const containerRect = board.getBoundingClientRect();
    const centerX = containerRect.left + containerRect.width / 2;
    const centerY = containerRect.top + containerRect.height / 2;

    cells.forEach((cell, index) => {
        const rect = cell.getBoundingClientRect();
        if (cell.classList.contains('o')) {
            cell.style.setProperty('--translateX', `${centerX - (rect.left + rect.width / 2) - 80}px`);
            cell.style.setProperty('--translateY', `${centerY - (rect.top + rect.height / 2)}px`);
            cell.style.setProperty('--scale', '1.5');
        } else if (cell.classList.contains('x')) {
            cell.style.setProperty('--translateX', `${centerX - (rect.left + rect.width / 2) + 80}px`);
            cell.style.setProperty('--translateY', `${centerY - (rect.top + rect.height / 2)}px`);
            cell.style.setProperty('--scale', '1.9');
        }
        cell.style.animation = 'drawCollect 1.5s forwards';
        cell.style.backgroundColor = 'transparent';
        cell.style.borderColor = 'transparent';
    });
}

function resetGame() {
    gameBoard = ['', '', '', '', '', '', '', '', ''];
    gameActive = true;
    currentPlayer = 'X';
    cells.forEach(cell => {
        cell.classList.remove('x', 'o');
        cell.style.cssText = '';
    });
}

// Event Listeners
cells.forEach(cell => cell.addEventListener('click', handleClick));
resetButton.addEventListener('click', resetGame);
multiplayerButton.addEventListener('click', () => {
    gameMode = 'multiplayer';
    resetGame();
});
aiButton.addEventListener('click', () => {
    gameMode = 'ai';
    resetGame();
});