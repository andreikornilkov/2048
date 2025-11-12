// GAME.js - ПОЛНАЯ ВЕРСИЯ С ИСПРАВЛЕННЫМИ БОНУСАМИ И СЧЕТАМИ
class Game2048 {
    constructor() {
        this.config = window.AppConfig || {
            GAME: {
                INITIAL_TILES: 2,
                PROBABILITY_4: 0.1,
                DEFAULT_SIZE: 4,
                ANIMATION_DURATION: 150
            }
        };
        
        this.state = {
            size: 4,
            board: [],
            score: 0,
            bestScore: 0,
            isGameOver: false,
            moveCount: 0,
            lastAddedTile: null,
            gameMode: '4x4',
            targetTile: 2048,
            hasWon: false,
            history: [],
            abilities: {
                undo: { uses: 2, maxUses: 2 },
                removeTwos: { uses: 2, maxUses: 2 },
                explode: { uses: 2, maxUses: 2 }
            }
        };
        
        this.elements = {
            mainMenu: document.getElementById('main-menu'),
            gameScreen: document.getElementById('game-screen'),
            board: document.getElementById('board'),
            score: document.getElementById('score'),
            bestScore: document.getElementById('best-score'),
            notice: document.getElementById('notice'),
            winModal: document.getElementById('win-modal'),
            winScore: document.getElementById('win-score'),
            winTarget: document.getElementById('win-target')
        };
        
        this.init();
    }
    
    init() {
        this.loadBestScore();
        this.setupEventListeners();
        this.showMainMenu();
    }
    
    showMainMenu() {
        this.elements.mainMenu.style.display = 'flex';
        this.elements.gameScreen.style.display = 'none';
        this.elements.winModal.style.display = 'none';
    }
    
    showGameScreen() {
        this.elements.mainMenu.style.display = 'none';
        this.elements.gameScreen.style.display = 'block';
        this.elements.winModal.style.display = 'none';
    }
    
    start(gameMode) {
        this.state.gameMode = gameMode;
        this.state.size = gameMode === '5x5' ? 5 : 4;
        this.state.targetTile = gameMode === '5x5' ? 4096 : 2048;
        this.state.board = this.createEmptyBoard(this.state.size);
        this.state.score = 0;
        this.state.isGameOver = false;
        this.state.hasWon = false;
        this.state.moveCount = 0;
        this.state.lastAddedTile = null;
        this.state.history = [];
        
        // Сбрасываем способности
        this.state.abilities = {
            undo: { uses: 2, maxUses: 2 },
            removeTwos: { uses: 2, maxUses: 2 },
            explode: { uses: 2, maxUses: 2 }
        };
        
        this.updateAllScores();
        this.setupBoardDOM();
        this.updateAbilitiesDisplay();
        
        for (let i = 0; i < this.config.GAME.INITIAL_TILES; i++) {
            this.addRandomTile();
        }
        
        this.saveToHistory();
        this.render();
        this.showGameScreen();
        
        if (window.TelegramApp) {
            window.TelegramApp.tg?.MainButton.hide();
        }
    }
    
    createEmptyBoard(size) {
        return Array.from({ length: size }, () => Array(size).fill(0));
    }
    
    setupBoardDOM() {
        const { size } = this.state;
        const tileSize = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--tile-size')) || 70;
        const gap = parseInt(getComputedStyle(document.documentElement)
            .getPropertyValue('--gap-size')) || 5;
        
        const boardSize = size * tileSize + (size - 1) * gap + 10;
        
        this.elements.board.style.width = `${boardSize}px`;
        this.elements.board.style.height = `${boardSize}px`;
        this.elements.board.style.gridTemplateColumns = 
            `repeat(${size}, ${tileSize}px)`;
        this.elements.board.style.gridTemplateRows = 
            `repeat(${size}, ${tileSize}px)`;
            
        this.elements.board.innerHTML = '';
        
        const fragment = document.createDocumentFragment();
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                fragment.appendChild(cell);
            }
        }
        this.elements.board.appendChild(fragment);
    }
    
    addRandomTile() {
        const emptyCells = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length === 0) {
            return false;
        }
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < this.config.GAME.PROBABILITY_4 ? 4 : 2;
        
        this.state.board[randomCell.r][randomCell.c] = value;
        this.state.lastAddedTile = { r: randomCell.r, c: randomCell.c, value: value };
        
        return true;
    }
    
    makeMove(direction) {
        if (this.state.isGameOver || this.state.hasWon) return;
        
        const { moved, newBoard, scoreIncrease } = this.move(this.state.board, direction);
        
        if (moved) {
            this.saveToHistory('move', { direction, scoreIncrease });
            
            this.state.board = newBoard;
            this.state.score += scoreIncrease;
            this.state.moveCount++;
            
            this.addRandomTile();
            
            this.render();
            // ОБНОВЛЯЕМ ОБА СЧЕТА ОДНОВРЕМЕННО
            this.updateAllScores();
            
            this.checkWinCondition();
            
            if (!this.canMove(this.state.board)) {
                this.gameOver();
            }
        }
    }
    
    // НОВЫЙ МЕТОД ДЛЯ ОБНОВЛЕНИЯ ОБОИХ СЧЕТОВ
    updateAllScores() {
        // Обновляем текущий счет
        if (this.elements.score) {
            this.elements.score.textContent = this.state.score;
        }
        
        // Проверяем и обновляем рекорд
        if (this.state.score > this.state.bestScore) {
            this.state.bestScore = this.state.score;
            localStorage.setItem('tg_2048_best', this.state.bestScore);
            
            if (window.TelegramApp) {
                window.TelegramApp.showShareButton(this.state.score);
            }
        }
        
        // Обновляем отображение рекорда
        if (this.elements.bestScore) {
            this.elements.bestScore.textContent = this.state.bestScore;
        }
    }
    
    checkWinCondition() {
        if (this.state.hasWon) return;
        
        const target = this.state.targetTile;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === target) {
                    this.showWinScreen();
                    return;
                }
            }
        }
    }
    
    showWinScreen() {
        this.state.hasWon = true;
        this.elements.winScore.textContent = this.state.score;
        this.elements.winTarget.textContent = this.state.targetTile;
        this.elements.winModal.style.display = 'block';
        
        if (window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    continueGame() {
        this.state.hasWon = false;
        this.elements.winModal.style.display = 'none';
    }
    
    // ИСПРАВЛЕННЫЕ СПОСОБНОСТИ
    undoMove() {
        if (this.state.abilities.undo.uses <= 0) {
            this.showNotice('Не осталось использований для отмены хода!');
            return false;
        }
        
        if (this.state.history.length <= 1) {
            this.showNotice('Нечего отменять - это первый ход!');
            return false;
        }
        
        // Получаем последнее действие из истории
        const lastAction = this.state.history.pop();
        
        // Восстанавливаем состояние
        this.state.board = this.cloneMatrix(lastAction.board);
        this.state.score = lastAction.score;
        this.state.moveCount = lastAction.moveCount;
        
        // Если это был бонус - возвращаем использование
        if (lastAction.type === 'ability') {
            this.state.abilities[lastAction.abilityType].uses++;
        }
        
        // Тратим использование для отмены
        this.state.abilities.undo.uses--;
        
        this.updateAbilitiesDisplay();
        this.render();
        this.updateAllScores(); // Обновляем оба счета
        this.showNotice('Действие отменено!');
        return true;
    }

    removeAllTwos() {
        if (this.state.abilities.removeTwos.uses <= 0) {
            this.showNotice('Не осталось использований для удаления двоек!');
            return false;
        }
        
        // Подсчет двоек ДО удаления
        let twoCountBefore = 0;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 2) {
                    twoCountBefore++;
                }
            }
        }
        
        // Проверка: есть ли двойки для удаления
        if (twoCountBefore === 0) {
            this.showNotice('На поле нет двоек для удаления!');
            return false;
        }
        
        // СОХРАНЯЕМ ИСТОРИЮ ПЕРЕД действием
        this.saveToHistory('ability', { 
            abilityType: 'removeTwos',
            removedCount: twoCountBefore 
        });
        
        // Удаляем двойки
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 2) {
                    this.state.board[r][c] = 0;
                }
            }
        }
        
        // Тратим использование ТОЛЬКО после успешного удаления
        this.state.abilities.removeTwos.uses--;
        
        this.updateAbilitiesDisplay();
        this.render();
        this.showNotice(`Удалено ${twoCountBefore} двоек! Сделайте ход для появления новых плиток.`);
        
        // НЕ добавляем новую плитку - она появится только после свайпа!
        
        return true;
    }

    explode35Percent() {
        if (this.state.abilities.explode.uses <= 0) {
            this.showNotice('Не осталось использований для взрыва!');
            return false;
        }
        
        // Собираем все плитки
        const tiles = [];
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push({
                        r, c,
                        value: this.state.board[r][c]
                    });
                }
            }
        }
        
        const totalTilesBefore = tiles.length;
        
        // Проверка: есть ли плитки для взрыва
        if (totalTilesBefore === 0) {
            this.showNotice('На поле нет плиток для взрыва!');
            return false;
        }
        
        // Вычисляем сколько взорвать
        const removeCount = Math.max(1, Math.floor(totalTilesBefore * 0.35));
        
        // Проверка: после взрыва должно остаться плиток
        const tilesAfterExplosion = totalTilesBefore - removeCount;
        if (tilesAfterExplosion <= 0) {
            this.showNotice('Нельзя взорвать все плитки!');
            return false;
        }
        
        // Если всего 1-2 плитки - нельзя взорвать
        if (totalTilesBefore <= 2) {
            this.showNotice('Слишком мало плиток для взрыва!');
            return false;
        }
        
        // Сортируем и взрываем
        tiles.sort((a, b) => a.value - b.value);
        const removedTiles = tiles.slice(0, removeCount);
        
        // СОХРАНЯЕМ ИСТОРИЮ ПЕРЕД действием
        this.saveToHistory('ability', { 
            abilityType: 'explode',
            removedCount: removeCount,
            totalTiles: totalTilesBefore
        });
        
        // Взрываем плитки
        for (const tile of removedTiles) {
            this.state.board[tile.r][tile.c] = 0;
        }
        
        // Тратим использование ТОЛЬКО после успешного взрыва
        this.state.abilities.explode.uses--;
        
        this.updateAbilitiesDisplay();
        this.render();
        this.showNotice(`Взорвано ${removedTiles.length} плиток! Сделайте ход для появления новых плиток.`);
        
        // НЕ добавляем новую плитку - она появится только после свайпа!
        
        return true;
    }
    
    // ОБНОВЛЕННЫЙ МЕТОД СОХРАНЕНИЯ ИСТОРИИ
    saveToHistory(type = 'move', data = {}) {
        if (this.state.history.length >= 20) {
            this.state.history.shift();
        }
        
        this.state.history.push({
            type: type,
            board: this.cloneMatrix(this.state.board),
            score: this.state.score,
            moveCount: this.state.moveCount,
            timestamp: Date.now(),
            ...data
        });
    }
    
    updateAbilitiesDisplay() {
        const abilities = this.state.abilities;
        
        document.getElementById('undo-btn').querySelector('.ability-uses').textContent = 
            abilities.undo.uses;
        document.getElementById('remove-twos-btn').querySelector('.ability-uses').textContent = 
            abilities.removeTwos.uses;
        document.getElementById('explode-btn').querySelector('.ability-uses').textContent = 
            abilities.explode.uses;
        
        document.getElementById('undo-btn').disabled = abilities.undo.uses <= 0;
        document.getElementById('remove-twos-btn').disabled = abilities.removeTwos.uses <= 0;
        document.getElementById('explode-btn').disabled = abilities.explode.uses <= 0;
    }
    
    move(board, direction) {
        const size = board.length;
        let moved = false;
        let scoreIncrease = 0;
        
        const newBoard = this.cloneMatrix(board);
        
        const processRow = (rowIndex, getCell, setCell) => {
            const row = [];
            
            for (let i = 0; i < size; i++) {
                const cell = getCell(rowIndex, i);
                if (cell !== 0) {
                    row.push(cell);
                }
            }
            
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    scoreIncrease += row[i];
                    row.splice(i + 1, 1);
                }
            }
            
            while (row.length < size) {
                row.push(0);
            }
            
            for (let i = 0; i < size; i++) {
                const oldValue = getCell(rowIndex, i);
                const newValue = row[i];
                setCell(rowIndex, i, newValue);
                
                if (oldValue !== newValue) {
                    moved = true;
                }
            }
        };
        
        switch (direction) {
            case 'left':
                for (let r = 0; r < size; r++) {
                    processRow(
                        r,
                        (row, col) => newBoard[row][col],
                        (row, col, value) => newBoard[row][col] = value
                    );
                }
                break;
                
            case 'right':
                for (let r = 0; r < size; r++) {
                    processRow(
                        r,
                        (row, col) => newBoard[row][size - 1 - col],
                        (row, col, value) => newBoard[row][size - 1 - col] = value
                    );
                }
                break;
                
            case 'up':
                for (let c = 0; c < size; c++) {
                    processRow(
                        c,
                        (col, row) => newBoard[row][col],
                        (col, row, value) => newBoard[row][col] = value
                    );
                }
                break;
                
            case 'down':
                for (let c = 0; c < size; c++) {
                    processRow(
                        c,
                        (col, row) => newBoard[size - 1 - row][col],
                        (col, row, value) => newBoard[size - 1 - row][col] = value
                    );
                }
                break;
        }
        
        return { moved, newBoard, scoreIncrease };
    }
    
    cloneMatrix(matrix) {
        return matrix.map(row => [...row]);
    }
    
    canMove(matrix) {
        const size = matrix.length;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === 0) {
                    return true;
                }
            }
        }
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size - 1; c++) {
                if (matrix[r][c] === matrix[r][c + 1]) {
                    return true;
                }
            }
        }
        
        for (let r = 0; r < size - 1; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === matrix[r + 1][c]) {
                    return true;
                }
            }
        }
        
        return false;
    }
    
    render() {
        const { board, size } = this.state;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.getElementById(`cell-${r}-${c}`);
                const value = board[r][c];
                
                cell.innerHTML = '';
                
                if (value !== 0) {
                    const tile = document.createElement('div');
                    tile.className = 'tile';
                    tile.textContent = value;
                    tile.setAttribute('data-value', value);
                    
                    if (this.state.lastAddedTile && 
                        this.state.lastAddedTile.r === r && 
                        this.state.lastAddedTile.c === c) {
                        tile.classList.add('new');
                    }
                    
                    cell.appendChild(tile);
                }
            }
        }
        
        // УБИРАЕМ вызов updateDisplay() - заменяем на updateAllScores()
        this.state.lastAddedTile = null;
    }
    
    // УДАЛЯЕМ старый метод updateDisplay() и заменяем его на updateAllScores()
    
    gameOver() {
        this.state.isGameOver = true;
        this.showNotice('Игра окончена!');
        
        const gameOverEl = document.createElement('div');
        gameOverEl.className = 'game-over';
        gameOverEl.textContent = 'Игра окончена!';
        gameOverEl.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(255, 255, 255, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 24px;
            font-weight: bold;
            border-radius: 10px;
        `;
        this.elements.board.appendChild(gameOverEl);
        
        if (window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    setupEventListeners() {
        document.getElementById('play-4x4').addEventListener('click', () => {
            this.start('4x4');
        });
        
        document.getElementById('play-5x5').addEventListener('click', () => {
            this.start('5x5');
        });
        
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undoMove();
        });
        
        document.getElementById('remove-twos-btn').addEventListener('click', () => {
            this.removeAllTwos();
        });
        
        document.getElementById('explode-btn').addEventListener('click', () => {
            this.explode35Percent();
        });
        
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.start(this.state.gameMode);
        });
        
        document.getElementById('menu-btn').addEventListener('click', () => {
            this.showMainMenu();
        });
        
        document.getElementById('continue-btn').addEventListener('click', () => {
            this.continueGame();
        });
        
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.setupSwipeControls();
    }
    
    handleKeyPress(e) {
        if (this.state.isGameOver) return;
        
        const keyMap = {
            'ArrowLeft': 'left',
            'ArrowRight': 'right', 
            'ArrowUp': 'up',
            'ArrowDown': 'down'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.makeMove(direction);
        }
    }
    
    setupSwipeControls() {
        let touchStartX, touchStartY;
        
        this.elements.board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        this.elements.board.addEventListener('touchend', (e) => {
            if (!touchStartX || !touchStartY) return;
            
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            
            const dx = touchEndX - touchStartX;
            const dy = touchEndY - touchStartY;
            const minSwipeDistance = 30;
            
            if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > minSwipeDistance) {
                this.makeMove(dx > 0 ? 'right' : 'left');
            } else if (Math.abs(dy) > minSwipeDistance) {
                this.makeMove(dy > 0 ? 'down' : 'up');
            }
            
            touchStartX = touchStartY = null;
            e.preventDefault();
        }, { passive: false });
    }
    
    loadBestScore() {
        this.state.bestScore = parseInt(localStorage.getItem('tg_2048_best')) || 0;
    }
    
    showNotice(message, duration = 2000) {
        const notice = this.elements.notice;
        if (notice) {
            notice.textContent = message;
            notice.style.display = 'block';
            
            setTimeout(() => {
                notice.style.display = 'none';
            }, duration);
        }
    }
}

if (typeof window.AppConfig === 'undefined') {
    window.AppConfig = {
        GAME: {
            INITIAL_TILES: 2,
            PROBABILITY_4: 0.1,
            DEFAULT_SIZE: 4,
            ANIMATION_DURATION: 150
        }
    };
}

document.addEventListener('DOMContentLoaded', () => {
    window.Game2048 = new Game2048();
    console.log('Игра 2048 с исправленными счетами и бонусами инициализирована!');
});