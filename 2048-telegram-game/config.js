// CONFIG.js - основные настройки приложения
window.AppConfig = {
    // Настройки игры
    GAME: {
        INITIAL_TILES: 2,
        PROBABILITY_4: 0.1,
        DEFAULT_SIZE: 4,
        ANIMATION_DURATION: 150
    },
    
    // Настройки Telegram
    TELEGRAM: {
        BUTTON_HEIGHT: 40,
        USE_THEME: true,
        SHOW_CONFIRMATION: true
    },
    
    // Локализация
    TEXT: {
        GAME_OVER: 'Игра окончена!',
        NEW_GAME: 'Новая игра',
        SCORE: 'Счет',
        BEST_SCORE: 'Рекорд',
        YOU_WIN: 'Поздравляем! Вы выиграли!'
    }
};

console.log('AppConfig загружен');