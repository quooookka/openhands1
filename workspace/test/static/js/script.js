document.addEventListener('DOMContentLoaded', function() {
  const gameBoard = document.querySelector('.game-board');
  const timerElement = document.querySelector('.timer');
  const minesElement = document.querySelector('.mines');
  const scoreElement = document.querySelector('.score');
  const gameOverElement = document.querySelector('.game-over');
  const restartButton = document.querySelector('.restart');

  let board = [];
  let mines = 10; // Number of mines
  let revealedCells = 0;
  let timerInterval;
  let startTime;
  let score = 0;

  // Initialize the game board
  function initGame() {
    board = createBoard(9, 9, mines);
    renderBoard();
    revealedCells = 0;
    startTime = new Date();
    startTimer();
    score = 0;
    updateScore();
  }

  // Create the game board array
  function createBoard(rows, cols, mines) {
    const board = [];
    for (let i = 0; i < rows; i++) {
      board[i] = [];
      for (let j = 0; j < cols; j++) {
        board[i][j] = {
          isMine: false,
          isRevealed: false,
          isFlagged: false,
          adjacentMines: 0
        };
      }
    }

    // Place mines randomly
    let minesPlaced = 0;
    while (minesPlaced < mines) {
      const row = Math.floor(Math.random() * rows);
      const col = Math.floor(Math.random() * cols);
      if (!board[row][col].isMine) {
        board[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // Calculate adjacent mines for each cell
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        if (!board[i][j].isMine) {
          board[i][j].adjacentMines = countAdjacentMines(i, j);
        }
      }
    }

    return board;
  }

  // Count adjacent mines
  function countAdjacentMines(row, col) {
    let count = 0;
    for (let i = row - 1; i <= row + 1; i++) {
      for (let j = col - 1; j <= col + 1; j++) {
        if (i >= 0 && i < board.length && j >= 0 && j < board[0].length && board[i][j].isMine) {
          count++;
        }
      }
    }
    return count;
  }

  // Render the game board
  function renderBoard() {
    gameBoard.innerHTML = '';
    for (let i = 0; i < board.length; i++) {
      for (let j = 0; j < board[0].length; j++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        cell.dataset.row = i;
        cell.dataset.col = j;
        if (board[i][j].isRevealed) {
          cell.classList.add('revealed');
          if (board[i][j].isMine) {
            cell.classList.add('mine');
          } else if (board[i][j].adjacentMines > 0) {
            cell.classList.add('number');
            cell.classList.add(`number-${board[i][j].adjacentMines}`);
            cell.textContent = board[i][j].adjacentMines;
          }
        } else if (board[i][j].isFlagged) {
          cell.classList.add('flag');
        } else {
          cell.classList.add('hidden');
        }
        cell.addEventListener('click', handleCellClick);
        cell.addEventListener('contextmenu', handleRightClick);
        gameBoard.appendChild(cell);
      }
    }
  }

  // Handle cell click
  function handleCellClick(event) {
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    if (board[row][col].isMine) {
      gameOver(false);
    } else {
      revealCell(row, col);
      if (revealedCells === 81 - mines) {
        gameOver(true);
      }
    }
  }

  // Handle right click
  function handleRightClick(event) {
    event.preventDefault();
    const cell = event.target;
    const row = parseInt(cell.dataset.row);
    const col = parseInt(cell.dataset.col);

    if (board[row][col].isRevealed) {
      return;
    }

    board[row][col].isFlagged = !board[row][col].isFlagged;
    renderBoard();
  }

  // Reveal a cell and its adjacent empty cells
  function revealCell(row, col) {
    if (board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    board[row][col].isRevealed = true;
    revealedCells++;

    if (board[row][col].adjacentMines === 0) {
      for (let i = row - 1; i <= row + 1; i++) {
        for (let j = col - 1; j <= col + 1; j++) {
          if (i >= 0 && i < board.length && j >= 0 && j < board[0].length) {
            revealCell(i, j);
          }
        }
      }
    }

    renderBoard();
  }

  // Start the timer
  function startTimer() {
    timerInterval = setInterval(function() {
      const elapsedTime = new Date() - startTime;
      const minutes = Math.floor(elapsedTime / 60000);
      const seconds = Math.floor((elapsedTime % 60000) / 1000);
      timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  }

  // Stop the timer
  function stopTimer() {
    clearInterval(timerInterval);
  }

  // Game over
  function gameOver(win) {
    stopTimer();
    if (win) {
      gameOverElement.innerHTML = `<h2>You Win!</h2><button class="restart">Play Again</button>`;
      score += 100;
      updateScore();
    } else {
      gameOverElement.innerHTML = `<h2>Game Over!</h2><button class="restart">Play Again</button>`;
      for (let i = 0; i < board.length; i++) {
        for (let j = 0; j < board[0].length; j++) {
          if (board[i][j].isMine) {
            const cell = gameBoard.children[i * 9 + j];
            cell.classList.add('mine');
          }
        }
      }
    }
    gameOverElement.style.display = 'block';
    restartButton.addEventListener('click', function() {
      gameOverElement.style.display = 'none';
      initGame();
    });
  }

  // Update score
  function updateScore() {
    scoreElement.textContent = score;
  }

  // Initialize the game
  initGame();

  // Restart button event listener
  restartButton.addEventListener('click', function() {
    gameOverElement.style.display = 'none';
    initGame();
  });
});
