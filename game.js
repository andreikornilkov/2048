// game.js - полный файл с исправленным таймером и форматированием счетов
class Game2048 {
    constructor() {
        this.config = window.AppConfig;
        this.elements = this.cacheElements();
        this.state = this.initialState();
        this.init();
    }
    
    cacheElements() {
        const elements = {};
        const ids = [
            'main-menu', 'game-screen', 'board', 'score', 'best-score',
            'game-end-modal', 'best-tile', 'time-left', 'time-container', 
            'best-tile-container', 'new-record-badge', 'total-games', 
            'total-wins', 'best-score-overall', 'cheat-input', 'apply-cheat-btn', 
            'cheat-modal', 'close-cheat', 'main-cheat-btn', 'game-cheat-btn',
            'main-menu-modal', 'in-game-menu-modal', 'themes-modal', 'stats-modal',
            'confirm-modal', 'start-time-modal'
        ];
        
        ids.forEach(id => {
            const element = document.getElementById(id);
            if (element) elements[id] = element;
        });
        return elements;
    }
    
    initialState() {
        return {
            size: 4,
            board: [],
            score: 0,
            bestScore: 0,
            bestSpeedScore: 0,
            isGameOver: false,
            moveCount: 0,
            lastAddedTile: null,
            gameMode: '4x4',
            targetTile: 2048,
            hasWon: false,
            history: [],
            bestTile: 0,
            timeLeft: 90,
            timerInterval: null,
            totalGames: 0,
            totalWins: 0,
            vibration: true,
            currentTheme: 'default',
            gamePaused: false
        };
    }
    
    init() {
        this.loadStatistics();
        this.loadSettings();
        this.setupEventListeners();
        this.applyTheme(this.state.currentTheme);
        this.showMainMenu();
    }
    
    // ФОРМАТИРОВАНИЕ ЧИСЕЛ
    formatNumber(num) {
        if (num <= 999999) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        } else if (num <= 999999999) {
            return (num / 1000000).toFixed(2).replace('.', ',') + ' M';
        } else if (num <= 999999999999) {
            return (num / 1000000000).toFixed(2).replace('.', ',') + ' B';
        } else {
            return (num / 1000000000000).toFixed(2).replace('.', ',') + ' T';
        }
    }
    
    formatGameScore(num) {
        if (num <= 9999999) {
            return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
        } else if (num <= 999999999) {
            return (num / 1000000).toFixed(2).replace('.', ',') + ' M';
        } else if (num <= 999999999999) {
            return (num / 1000000000).toFixed(2).replace('.', ',') + ' B';
        } else {
            return (num / 1000000000000).toFixed(2).replace('.', ',') + ' T';
        }
    }
    
    // ВИБРАЦИЯ
    vibrate(duration) {
        if (!this.state.vibration) return;
        
        try {
            if (navigator.vibrate) {
                navigator.vibrate(duration);
            }
        } catch (error) {
            console.log('Вибрация не поддерживается');
        }
    }
    
    // ПАУЗА ТАЙМЕРА
    pauseTimer() {
        if (this.state.gameMode === '4x4-time' && this.state.timerInterval) {
            this.stopTimer();
            this.state.gamePaused = true;
        }
    }
    
    resumeTimer() {
        if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
            this.startTimer();
            this.state.gamePaused = false;
        }
    }
    
    showMainMenu() {
        this.elements['main-menu'].style.display = 'flex';
        this.elements['game-screen'].style.display = 'none';
        this.elements['game-end-modal'].style.display = 'none';
        this.closeAllModals();
        this.updateMainMenuStats();
    }
    
    showGameScreen() {
        this.elements['main-menu'].style.display = 'none';
        this.elements['game-screen'].style.display = 'block';
        this.elements['game-end-modal'].style.display = 'none';
    }
    
    start(gameMode) {
        this.initializeGame(gameMode);
        
        if (gameMode === '4x4-time') {
            setTimeout(() => this.showStartTimeModal(), 100);
        }
    }
    
    initializeGame(gameMode) {
        const modeSettings = {
            '4x4': { size: 4, target: 2048, showTime: false, showBestTile: true },
            '5x5': { size: 5, target: 4096, showTime: false, showBestTile: true },
            '4x4-time': { size: 4, target: 2048, showTime: true, showBestTile: false },
            '5x5-zen': { size: 5, target: null, showTime: false, showBestTile: true }
        };
        
        const settings = modeSettings[gameMode];
        if (!settings) return;
        
        Object.assign(this.state, {
            gameMode: gameMode,
            size: settings.size,
            targetTile: settings.target,
            board: this.createEmptyBoard(settings.size),
            score: 0,
            isGameOver: false,
            hasWon: false,
            moveCount: 0,
            lastAddedTile: null,
            bestTile: 0,
            history: [],
            timeLeft: this.config.GAME.TIME_ATTACK_DURATION,
            gamePaused: false
        });
        
        this.elements['time-container'].style.display = settings.showTime ? 'block' : 'none';
        this.elements['best-tile-container'].style.display = settings.showBestTile ? 'block' : 'none';
        this.elements['new-record-badge'].style.display = 'none';
        
        this.updateAllScores();
        this.setupBoardDOM();
        
        for (let i = 0; i < this.config.GAME.INITIAL_TILES; i++) {
            this.addRandomTile();
        }
        
        this.saveToHistory();
        this.render();
        this.showGameScreen();
        
        this.state.totalGames++;
        this.saveStatistics();
        this.updateMainMenuStats();
        
        window.TelegramApp?.tg?.MainButton.hide();
    }
    
    showStartTimeModal() {
        const modal = document.getElementById('start-time-modal');
        if (modal) modal.style.display = 'block';
    }
    
    startTimer() {
        this.stopTimer();
        this.updateTimeDisplay();
        
        this.state.timerInterval = setInterval(() => {
            this.state.timeLeft--;
            this.updateTimeDisplay();
            
            if (this.state.timeLeft <= 0) {
                this.stopTimer();
                this.gameOver();
            }
        }, 1000);
    }
    
    stopTimer() {
        if (this.state.timerInterval) {
            clearInterval(this.state.timerInterval);
            this.state.timerInterval = null;
        }
    }
    
    updateTimeDisplay() {
        if (this.elements['time-left']) {
            this.elements['time-left'].textContent = this.state.timeLeft.toString();
        }
    }
    
    createEmptyBoard(size) {
        return Array.from({ length: size }, () => Array(size).fill(0));
    }
    
    setupBoardDOM() {
        const { size } = this.state;
        const tileSize = 70;
        const gap = 5;
        const boardSize = size * tileSize + (size - 1) * gap + 10;
        
        const board = this.elements['board'];
        if (!board) return;
        
        board.style.width = `${boardSize}px`;
        board.style.height = `${boardSize}px`;
        board.style.gridTemplateColumns = `repeat(${size}, ${tileSize}px)`;
        board.style.gridTemplateRows = `repeat(${size}, ${tileSize}px)`;
        
        board.innerHTML = '';
        const fragment = document.createDocumentFragment();
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.id = `cell-${r}-${c}`;
                fragment.appendChild(cell);
            }
        }
        board.appendChild(fragment);
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
        
        if (emptyCells.length === 0) return false;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        const value = Math.random() < this.config.GAME.PROBABILITY_4 ? 4 : 2;
        
        this.state.board[randomCell.r][randomCell.c] = value;
        this.state.lastAddedTile = { r: randomCell.r, c: randomCell.c, value: value };
        
        this.updateBestTile();
        return true;
    }
    
    updateBestTile() {
        let currentBest = 0;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > currentBest) {
                    currentBest = this.state.board[r][c];
                }
            }
        }
        
        if (currentBest > this.state.bestTile) {
            this.state.bestTile = currentBest;
            if (this.elements['best-tile']) {
                this.elements['best-tile'].textContent = currentBest;
            }
        }
    }
    
    makeMove(direction) {
        if (this.state.isGameOver || this.state.hasWon) return;
        
        const { moved, newBoard, scoreIncrease, merged } = this.move(this.state.board, direction);
        
        if (moved) {
            this.vibrate(this.config.VIBRATION.MOVE);
            
            if (merged > 0) {
                setTimeout(() => {
                    this.vibrate(this.config.VIBRATION.MERGE);
                }, 100);
            }
            
            this.saveToHistory('move', { direction, scoreIncrease });
            
            this.state.board = newBoard;
            this.state.score += scoreIncrease;
            this.state.moveCount++;
            
            this.addRandomTile();
            this.render();
            this.updateAllScores();
            this.updateBestTile();
            
            this.checkWinCondition();
            
            if (!this.canMove(this.state.board)) {
                this.gameOver();
            }
        }
    }
    
    updateAllScores() {
        const shouldUpdateBest = this.state.score > this.state.bestScore;
        
        if (shouldUpdateBest) {
            this.state.bestScore = this.state.score;
            if (this.elements['new-record-badge']) {
                this.elements['new-record-badge'].style.display = 'block';
            }
        }
        
        if (this.elements['score']) {
            this.elements['score'].textContent = this.formatGameScore(this.state.score);
        }
        if (this.elements['best-score']) {
            this.elements['best-score'].textContent = this.formatNumber(this.state.bestScore);
        }
        
        if (shouldUpdateBest && window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    checkWinCondition() {
        if (this.state.hasWon || !this.state.targetTile) return;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === this.state.targetTile) {
                    this.vibrate(this.config.VIBRATION.WIN);
                    this.showGameEndScreen(true);
                    return;
                }
            }
        }
    }
    
    showGameEndScreen(isWin) {
        this.state.isGameOver = true;
        this.stopTimer();
        
        if (isWin) {
            this.state.totalWins++;
        } else if (this.state.gameMode === '4x4-time' && this.canMove(this.state.board)) {
            this.state.totalWins++;
            isWin = true;
        }
        
        this.vibrate(isWin ? this.config.VIBRATION.WIN : this.config.VIBRATION.LOSE);
        
        this.saveStatistics();
        
        let titleText, tileValue;
        
        if (isWin) {
            titleText = 'Вы победили!';
            tileValue = this.state.targetTile || this.getMaxTile();
        } else {
            titleText = 'Игра окончена';
            tileValue = this.state.bestTile;
        }
        
        const modal = this.elements['game-end-modal'];
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content game-end-modal">
                <div class="game-end-icon">${isWin ? '🎉' : '😔'}</div>
                <h3>${titleText}</h3>
                <div class="tile-display">
                    <div class="tile-value">${tileValue}</div>
                </div>
                <div class="game-end-stats">
                    <div class="game-end-stat">
                        <span>Ваш счет:</span>
                        <strong>${this.formatGameScore(this.state.score)}</strong>
                    </div>
                </div>
                <button class="tg-button large" id="to-main-menu-btn">Меню</button>
            </div>
        `;
        
        modal.style.display = 'block';
        
        const menuButton = modal.querySelector('#to-main-menu-btn');
        if (menuButton) {
            menuButton.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.showMainMenu();
            });
        }
        
        if (window.TelegramApp) {
            window.TelegramApp.showShareButton(this.state.score);
        }
    }
    
    getMaxTile() {
        let maxTile = 0;
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > maxTile) {
                    maxTile = this.state.board[r][c];
                }
            }
        }
        return maxTile;
    }
    
    gameOver() {
        this.showGameEndScreen(false);
    }
    
    // ЧИТ-КОДЫ - ИСПРАВЛЕННАЯ ЛОГИКА ТАЙМЕРА
    applyCheatCode(code) {
        const upperCode = code.toUpperCase().trim();
        
        const cheats = {
            'NONONO': () => this.cheatUndo(),
            'IHATETWOTOO': () => this.cheatRemoveTwos(),
            'BIGBADABOOM': () => this.cheatExplode70(),
            'ALLTIMEMYTIME': () => this.cheatAddTime(),
            'GIVEMEMY2048': () => this.cheatAddTile(2048),
            'OHMYGOD4096': () => this.cheatAddTile(4096),
            'LOVEMYCLEAN': () => this.cheatOrganizeTilesDiagonal(),
            'CHACHACHAOS': () => this.cheatShuffleTiles(),
            'DOUBLEBOUBLE': () => this.cheatDoubleTiles(),
            'MILLIONADONA': () => this.cheatAddMillion()
        };
        
        if (cheats[upperCode]) {
            this.vibrate(this.config.VIBRATION.BUTTON);
            
            const success = cheats[upperCode]();
            
            if (success) {
                // После успешного применения чита закрываем модальное окно
                const cheatModal = document.getElementById('cheat-modal');
                const cheatInput = document.getElementById('cheat-input');
                if (cheatModal) cheatModal.style.display = 'none';
                if (cheatInput) cheatInput.value = '';
                
                // В режиме на время возобновляем таймер после применения чита
                if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                    this.resumeTimer();
                }
                return true;
            }
        }
        return false;
    }
    
    cheatUndo() {
        if (this.state.history.length <= 1) {
            return false;
        }
        
        const lastAction = this.state.history.pop();
        this.state.board = this.cloneMatrix(lastAction.board);
        this.state.score = lastAction.score;
        this.state.moveCount = lastAction.moveCount;
        
        this.render();
        this.updateAllScores();
        this.updateBestTile();
        return true;
    }
    
    cheatRemoveTwos() {
        let removedCount = 0;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 2) {
                    this.state.board[r][c] = 0;
                    removedCount++;
                }
            }
        }
        
        if (removedCount > 0) {
            this.addRandomTile();
            this.render();
            this.updateBestTile();
            return true;
        } else {
            return false;
        }
    }
    
    cheatExplode70() {
        const tiles = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push({ r, c, value: this.state.board[r][c] });
                }
            }
        }
        
        const totalTilesBefore = tiles.length;
        
        if (totalTilesBefore <= 1) {
            if (totalTilesBefore === 1) {
                this.state.board[tiles[0].r][tiles[0].c] = 0;
            }
            this.render();
            return true;
        }
        
        const removeCount = Math.max(1, Math.floor(totalTilesBefore * 0.7));
        tiles.sort((a, b) => a.value - b.value);
        
        const removedTiles = tiles.slice(0, removeCount);
        
        for (const tile of removedTiles) {
            this.state.board[tile.r][tile.c] = 0;
        }
        
        this.addRandomTile();
        this.render();
        this.updateBestTile();
        return true;
    }
    
    cheatAddTime() {
        if (this.state.gameMode === '4x4-time') {
            this.state.timeLeft += 7;
            this.updateTimeDisplay();
            return true;
        }
        return false;
    }
    
    cheatAddTile(value) {
        const emptyCells = [];
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] === 0) {
                    emptyCells.push({ r, c });
                }
            }
        }
        
        if (emptyCells.length === 0) return false;
        
        const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
        this.state.board[randomCell.r][randomCell.c] = value;
        this.state.lastAddedTile = { r: randomCell.r, c: randomCell.c, value: value };
        
        this.updateBestTile();
        this.render();
        return true;
    }
    
    cheatOrganizeTilesDiagonal() {
        const tiles = [];
        
        // Собираем все ненулевые плитки
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push(this.state.board[r][c]);
                }
            }
        }
        
        // Сортируем плитки по убыванию (самые большие в начале)
        tiles.sort((a, b) => b - a);
        
        // Создаем новую пустую доску
        const newBoard = this.createEmptyBoard(this.state.size);
        
        let tileIndex = 0;
        
        // Заполняем диагонали от правого верхнего угла к левому нижнему
        // Главная диагональ и выше - от правого верхнего угла
        for (let diag = this.state.size - 1; diag >= 0; diag--) {
            let r = 0;
            let c = diag;
            while (c < this.state.size && r < this.state.size) {
                if (tileIndex < tiles.length) {
                    newBoard[r][c] = tiles[tileIndex];
                    tileIndex++;
                }
                r++;
                c++;
            }
        }
        
        // Диагонали ниже главной - продолжаем заполнение
        for (let diag = 1; diag < this.state.size; diag++) {
            let r = diag;
            let c = 0;
            while (r < this.state.size && c < this.state.size) {
                if (tileIndex < tiles.length) {
                    newBoard[r][c] = tiles[tileIndex];
                    tileIndex++;
                }
                r++;
                c++;
            }
        }
        
        // Копируем новую доску в состояние игры
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                this.state.board[r][c] = newBoard[r][c];
            }
        }
        
        this.render();
        this.updateBestTile();
        return true;
    }
    
    cheatShuffleTiles() {
        const tiles = [];
        const positions = [];
        
        // Собираем все плитки и их позиции
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    tiles.push(this.state.board[r][c]);
                    positions.push({ r, c });
                }
            }
        }
        
        // Перемешиваем плитки
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
        
        // Заполняем поле перемешанными плитками
        for (let i = 0; i < positions.length; i++) {
            const { r, c } = positions[i];
            this.state.board[r][c] = tiles[i];
        }
        
        this.render();
        return true;
    }
    
    cheatDoubleTiles() {
        let doubled = false;
        
        for (let r = 0; r < this.state.size; r++) {
            for (let c = 0; c < this.state.size; c++) {
                if (this.state.board[r][c] > 0) {
                    this.state.board[r][c] *= 2;
                    doubled = true;
                }
            }
        }
        
        if (doubled) {
            this.updateBestTile();
            this.render();
        }
        
        return doubled;
    }
    
    cheatAddMillion() {
        this.state.score += 1000000;
        this.updateAllScores();
        return true;
    }
    
    // СИСТЕМА СТАТИСТИКИ
    loadStatistics() {
        const stats = JSON.parse(localStorage.getItem('tg_2048_stats')) || {
            totalGames: 0, totalWins: 0, bestScore: 0, bestSpeedScore: 0, bestTile: 0
        };
        
        Object.assign(this.state, stats);
    }
    
    saveStatistics() {
        const stats = {
            totalGames: this.state.totalGames,
            totalWins: this.state.totalWins,
            bestScore: Math.max(this.state.bestScore, this.state.score),
            bestSpeedScore: Math.max(this.state.bestSpeedScore, this.state.score),
            bestTile: Math.max(this.state.bestTile, this.state.bestTile)
        };
        
        localStorage.setItem('tg_2048_stats', JSON.stringify(stats));
        this.updateMainMenuStats();
    }
    
    updateMainMenuStats() {
        const elements = this.elements;
        if (elements['total-games']) elements['total-games'].textContent = this.state.totalGames;
        if (elements['total-wins']) elements['total-wins'].textContent = this.state.totalWins;
        if (elements['best-score-overall']) {
            elements['best-score-overall'].textContent = this.formatNumber(this.state.bestScore);
        }
    }
    
    resetBestScore() {
        this.state.bestScore = 0;
        this.state.bestSpeedScore = 0;
        this.saveStatistics();
        this.updateMainMenuStats();
        this.closeAllModals();
    }
    
    resetAllStatistics() {
        Object.assign(this.state, {
            totalGames: 0, totalWins: 0, bestScore: 0, bestSpeedScore: 0, bestTile: 0
        });
        this.saveStatistics();
        this.updateMainMenuStats();
        this.closeAllModals();
    }
    
    closeAllModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    // СИСТЕМА ТЕМ
    applyTheme(themeName) {
        const theme = this.config.THEMES[themeName];
        if (!theme) return;
        
        const docStyle = document.documentElement.style;
        docStyle.setProperty('--tg-bg-color', theme.bgColor);
        docStyle.setProperty('--tg-primary-color', theme.primaryColor);
        docStyle.setProperty('--tg-secondary-color', theme.secondaryColor);
        docStyle.setProperty('--tg-text-color', theme.textColor);
        
        this.state.currentTheme = themeName;
        this.saveSettings();
    }
    
    loadSettings() {
        const settings = JSON.parse(localStorage.getItem('tg_2048_settings')) || {
            vibration: true, theme: 'default'
        };
        
        this.state.vibration = settings.vibration;
        this.state.currentTheme = settings.theme;
        
        const toggles = ['main-vibration-toggle', 'vibration-toggle'];
        toggles.forEach(id => {
            const toggle = document.getElementById(id);
            if (toggle) toggle.checked = this.state.vibration;
        });
    }
    
    saveSettings() {
        const settings = {
            vibration: this.state.vibration,
            theme: this.state.currentTheme
        };
        localStorage.setItem('tg_2048_settings', JSON.stringify(settings));
    }
    
    // ИГРОВАЯ ЛОГИКА
    move(board, direction) {
        const size = board.length;
        let moved = false;
        let scoreIncrease = 0;
        let merged = 0;
        
        const newBoard = this.cloneMatrix(board);
        
        const processRow = (rowIndex, getCell, setCell) => {
            const row = [];
            
            for (let i = 0; i < size; i++) {
                const cell = getCell(rowIndex, i);
                if (cell !== 0) row.push(cell);
            }
            
            for (let i = 0; i < row.length - 1; i++) {
                if (row[i] === row[i + 1]) {
                    row[i] *= 2;
                    scoreIncrease += row[i];
                    row.splice(i + 1, 1);
                    merged++;
                }
            }
            
            while (row.length < size) row.push(0);
            
            for (let i = 0; i < size; i++) {
                const oldValue = getCell(rowIndex, i);
                const newValue = row[i];
                setCell(rowIndex, i, newValue);
                
                if (oldValue !== newValue) moved = true;
            }
        };
        
        switch (direction) {
            case 'left':
                for (let r = 0; r < size; r++) {
                    processRow(r, (row, col) => newBoard[row][col], (row, col, value) => newBoard[row][col] = value);
                }
                break;
                
            case 'right':
                for (let r = 0; r < size; r++) {
                    processRow(r, (row, col) => newBoard[row][size - 1 - col], 
                              (row, col, value) => newBoard[row][size - 1 - col] = value);
                }
                break;
                
            case 'up':
                for (let c = 0; c < size; c++) {
                    processRow(c, (col, row) => newBoard[row][col], 
                              (col, row, value) => newBoard[row][col] = value);
                }
                break;
                
            case 'down':
                for (let c = 0; c < size; c++) {
                    processRow(c, (col, row) => newBoard[size - 1 - row][col],
                              (col, row, value) => newBoard[size - 1 - row][col] = value);
                }
                break;
        }
        
        return { moved, newBoard, scoreIncrease, merged };
    }
    
    cloneMatrix(matrix) {
        return matrix.map(row => [...row]);
    }
    
    canMove(matrix) {
        const size = matrix.length;
        
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (matrix[r][c] === 0) return true;
                
                if (c < size - 1 && matrix[r][c] === matrix[r][c + 1]) return true;
                if (r < size - 1 && matrix[r][c] === matrix[r + 1][c]) return true;
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
                
                if (cell) {
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
        }
        
        this.state.lastAddedTile = null;
    }
    
    saveToHistory(type = 'move', data = {}) {
        if (this.state.history.length >= 20) {
            this.state.history.shift();
        }
        
        this.state.history.push({
            type, board: this.cloneMatrix(this.state.board),
            score: this.state.score, moveCount: this.state.moveCount,
            timestamp: Date.now(), ...data
        });
    }
    
    setupEventListeners() {
        // Кнопки режимов игры
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                const mode = e.currentTarget.getAttribute('data-mode');
                if (mode) this.start(mode);
            });
        });
        
        // Главное меню
        const mainMenuBtn = document.getElementById('main-menu-btn');
        if (mainMenuBtn) {
            mainMenuBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('main-menu-modal').style.display = 'block';
            });
        }
        
        const mainThemesBtn = document.getElementById('main-themes-btn');
        if (mainThemesBtn) {
            mainThemesBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('themes-modal').style.display = 'block';
            });
        }
        
        const closeMainMenu = document.getElementById('close-main-menu');
        if (closeMainMenu) {
            closeMainMenu.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('main-menu-modal').style.display = 'none';
            });
        }
        
        // Чит-коды - ИСПРАВЛЕННАЯ ЛОГИКА ОТКРЫТИЯ/ЗАКРЫТИЯ
        const mainCheatBtn = document.getElementById('main-cheat-btn');
        if (mainCheatBtn) {
            mainCheatBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                // В режиме на время паузим таймер при открытии модального окна
                if (this.state.gameMode === '4x4-time') {
                    this.pauseTimer();
                }
                document.getElementById('cheat-modal').style.display = 'block';
                document.getElementById('main-menu-modal').style.display = 'none';
            });
        }
        
        const gameCheatBtn = document.getElementById('game-cheat-btn');
        if (gameCheatBtn) {
            gameCheatBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                // В режиме на время паузим таймер при открытии модального окна
                if (this.state.gameMode === '4x4-time') {
                    this.pauseTimer();
                }
                document.getElementById('cheat-modal').style.display = 'block';
                document.getElementById('in-game-menu-modal').style.display = 'none';
            });
        }
        
        const closeCheat = document.getElementById('close-cheat');
        if (closeCheat) {
            closeCheat.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('cheat-modal').style.display = 'none';
                // В режиме на время возобновляем таймер при закрытии модального окна
                if (this.state.gameMode === '4x4-time' && this.state.gamePaused) {
                    this.resumeTimer();
                }
                // Возвращаемся в предыдущее меню
                if (this.state.gamePaused) {
                    document.getElementById('in-game-menu-modal').style.display = 'block';
                } else {
                    document.getElementById('main-menu-modal').style.display = 'block';
                }
            });
        }
        
        const applyCheatBtn = document.getElementById('apply-cheat-btn');
        if (applyCheatBtn) {
            applyCheatBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                const cheatInput = document.getElementById('cheat-input');
                const code = cheatInput ? cheatInput.value : '';
                
                if (!this.applyCheatCode(code)) {
                    alert('Неверный чит код!');
                    if (cheatInput) {
                        cheatInput.value = '';
                        cheatInput.focus();
                    }
                }
            });
        }
        
        // Вибрация
        const mainVibrationToggle = document.getElementById('main-vibration-toggle');
        if (mainVibrationToggle) {
            mainVibrationToggle.addEventListener('change', (e) => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.state.vibration = e.target.checked;
                const vibrationToggle = document.getElementById('vibration-toggle');
                if (vibrationToggle) vibrationToggle.checked = this.state.vibration;
                this.saveSettings();
            });
        }
        
        // Статистика - ИСПРАВЛЕННАЯ ЛОГИКА
        const mainStatsBtn = document.getElementById('main-stats-btn');
        if (mainStatsBtn) {
            mainStatsBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                // Закрываем основное меню и открываем статистику
                document.getElementById('main-menu-modal').style.display = 'none';
                this.showStatsModal();
            });
        }
        
        // Кнопки управления в игре - ИСПРАВЛЕННАЯ ЛОГИКА ПЕРЕЗАПУСКА
        const gameMenuBtn = document.getElementById('game-menu-btn');
        if (gameMenuBtn) {
            gameMenuBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.pauseTimer();
                document.getElementById('in-game-menu-modal').style.display = 'block';
            });
        }
        
        const toMainMenuBtn = document.getElementById('to-main-menu-btn');
        if (toMainMenuBtn) {
            toMainMenuBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.showMainMenu();
            });
        }
        
        const startTimeBtn = document.getElementById('start-time-btn');
        if (startTimeBtn) {
            startTimeBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('start-time-modal').style.display = 'none';
                this.startTimer();
            });
        }
        
        const restartGameBtn = document.getElementById('restart-game-btn');
        if (restartGameBtn) {
            restartGameBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                // Останавливаем текущий таймер
                this.stopTimer();
                // Сбрасываем состояние паузы
                this.state.gamePaused = false;
                // Перезапускаем игру
                this.initializeGame(this.state.gameMode);
                document.getElementById('in-game-menu-modal').style.display = 'none';
                
                // В режиме на время запускаем таймер после перезапуска
                if (this.state.gameMode === '4x4-time') {
                    setTimeout(() => this.showStartTimeModal(), 100);
                }
            });
        }
        
        const toLobbyBtn = document.getElementById('to-lobby-btn');
        if (toLobbyBtn) {
            toLobbyBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.showMainMenu();
                document.getElementById('in-game-menu-modal').style.display = 'none';
            });
        }
        
        const closeGameMenu = document.getElementById('close-game-menu');
        if (closeGameMenu) {
            closeGameMenu.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.resumeTimer();
                document.getElementById('in-game-menu-modal').style.display = 'none';
            });
        }
        
        // Статистика из игры - ИСПРАВЛЕННАЯ ЛОГИКА
        const gameStatsBtn = document.getElementById('game-stats-btn');
        if (gameStatsBtn) {
            gameStatsBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                // Закрываем игровое меню и открываем статистику
                document.getElementById('in-game-menu-modal').style.display = 'none';
                this.showStatsModal();
            });
        }
        
        // Темы
        const closeThemes = document.getElementById('close-themes');
        if (closeThemes) {
            closeThemes.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('themes-modal').style.display = 'none';
            });
        }
        
        document.querySelectorAll('.theme-option').forEach(theme => {
            theme.addEventListener('click', (e) => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                const themeName = e.currentTarget.dataset.theme;
                this.applyTheme(themeName);
            });
        });
        
        // Подтверждения
        const confirmYes = document.getElementById('confirm-yes');
        if (confirmYes) {
            confirmYes.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                if (this.confirmCallback) this.confirmCallback();
            });
        }
        
        const confirmNo = document.getElementById('confirm-no');
        if (confirmNo) {
            confirmNo.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                document.getElementById('confirm-modal').style.display = 'none';
            });
        }
        
        // Вибрация в игре
        const vibrationToggle = document.getElementById('vibration-toggle');
        if (vibrationToggle) {
            vibrationToggle.addEventListener('change', (e) => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.state.vibration = e.target.checked;
                const mainVibrationToggle = document.getElementById('main-vibration-toggle');
                if (mainVibrationToggle) mainVibrationToggle.checked = this.state.vibration;
                this.saveSettings();
            });
        }
        
        // Управление стрелками
        document.addEventListener('keydown', this.handleKeyPress.bind(this));
        this.setupSwipeControls();
    }
    
    showStatsModal() {
        const modal = document.getElementById('stats-modal');
        if (!modal) return;
        
        modal.innerHTML = `
            <div class="modal-content">
                <button class="close-btn" id="close-stats">×</button>
                <h3>Моя статистика</h3>
                <div class="stats-content">
                    <div class="stats-section">
                        <div class="stat-row">
                            <span>Всего игр:</span>
                            <strong>${this.state.totalGames}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Побед:</span>
                            <strong>${this.state.totalWins}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Лучший счёт:</span>
                            <strong>${this.formatNumber(this.state.bestScore)}</strong>
                        </div>
                        <div class="stat-row">
                            <span>Лучший счет на скорость:</span>
                            <strong>${this.formatNumber(this.state.bestSpeedScore)}</strong>
                        </div>
                    </div>
                    <div class="stats-actions">
                        <button class="tg-button secondary" id="reset-best-score-btn">Стереть лучший счет</button>
                        <button class="tg-button secondary" id="reset-all-stats-btn">Стереть всю статистику</button>
                    </div>
                </div>
            </div>
        `;
        
        modal.style.display = 'block';
        
        // Добавляем обработчики для новых кнопок
        const closeStats = modal.querySelector('#close-stats');
        if (closeStats) {
            closeStats.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                modal.style.display = 'none';
                // Возвращаемся в предыдущее меню
                if (this.state.gamePaused) {
                    document.getElementById('in-game-menu-modal').style.display = 'block';
                } else {
                    document.getElementById('main-menu-modal').style.display = 'block';
                }
            });
        }
        
        const resetBestScoreBtn = modal.querySelector('#reset-best-score-btn');
        if (resetBestScoreBtn) {
            resetBestScoreBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.showConfirmModal('Стереть лучший счет?', 'Вы точно хотите стереть лучший счет?', 
                    () => this.resetBestScore()
                );
            });
        }
        
        const resetAllStatsBtn = modal.querySelector('#reset-all-stats-btn');
        if (resetAllStatsBtn) {
            resetAllStatsBtn.addEventListener('click', () => {
                this.vibrate(this.config.VIBRATION.BUTTON);
                this.showConfirmModal('Стереть всю статистику?', 'Вы точно хотите стереть всю статистику?', 
                    () => this.resetAllStatistics()
                );
            });
        }
    }
    
    showConfirmModal(title, message, callback) {
        const confirmTitle = document.getElementById('confirm-title');
        const confirmMessage = document.getElementById('confirm-message');
        const confirmModal = document.getElementById('confirm-modal');
        
        if (confirmTitle) confirmTitle.textContent = title;
        if (confirmMessage) confirmMessage.textContent = message;
        this.confirmCallback = callback;
        if (confirmModal) confirmModal.style.display = 'block';
    }
    
    handleKeyPress(e) {
        if (this.state.isGameOver) return;
        
        const keyMap = {
            'ArrowLeft': 'left', 
            'ArrowRight': 'right', 
            'ArrowUp': 'up', 
            'ArrowDown': 'down',
            'KeyA': 'left', 
            'KeyD': 'right', 
            'KeyW': 'up', 
            'KeyS': 'down'
        };
        
        const direction = keyMap[e.key];
        if (direction) {
            e.preventDefault();
            this.makeMove(direction);
        }
    }
    
    setupSwipeControls() {
        const board = this.elements['board'];
        if (!board) return;
        
        let touchStartX, touchStartY;
        
        board.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
            e.preventDefault();
        }, { passive: false });
        
        board.addEventListener('touchend', (e) => {
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
}

// Инициализация игры
document.addEventListener('DOMContentLoaded', () => {
    window.Game2048 = new Game2048();
});