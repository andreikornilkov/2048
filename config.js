// CONFIG.js - ОБНОВЛЕННЫЕ НАСТРОЙКИ ТЕМ
window.AppConfig = {
    // Настройки игры
    GAME: {
        INITIAL_TILES: 2,
        PROBABILITY_4: 0.1,
        DEFAULT_SIZE: 4,
        ANIMATION_DURATION: 150,
        TIME_ATTACK_DURATION: 90,
        EXPLODE_PERCENTAGE: 0.35
    },
    
    // Настройки Telegram
    TELEGRAM: {
        BUTTON_HEIGHT: 40,
        USE_THEME: true,
        SHOW_CONFIRMATION: true
    },
    
    // Настройки способностей
    ABILITIES: {
        UNDO: { uses: 2, maxUses: 2 },
        REMOVE_TWOS: { uses: 2, maxUses: 2 },
        EXPLODE: { uses: 2, maxUses: 2 },
        ADD_TIME: { uses: 2, maxUses: 2 }
    },
    
    // ОБНОВЛЕННЫЕ НАСТРОЙКИ ТЕМ (соответствуют HTML)
    THEMES: {
        'default': {
            bgColor: '#63697B',
            primaryColor: '#635BFF',
            secondaryColor: '#8B85FF',
            textColor: '#FFFFFF'
        },
        'moon-dust': {
            bgColor: '#63697B',
            primaryColor: '#635BFF',
            secondaryColor: '#8B85FF',
            textColor: '#FFFFFF'
        },
        'whisper-leaves': {
            bgColor: '#7F8B7D',
            primaryColor: '#5D7257',
            secondaryColor: '#8B9C85',
            textColor: '#FFFFFF'
        },
        'wet-stone': {
            bgColor: '#8B847D',
            primaryColor: '#726B65',
            secondaryColor: '#9C958D',
            textColor: '#FFFFFF'
        },
        'deep-space': {
            bgColor: '#3B3D46',
            primaryColor: '#2B2D36',
            secondaryColor: '#4B4D56',
            textColor: '#FFFFFF'
        },
        'unicorn-dream': {
            bgColor: '#D9A5B3',
            primaryColor: '#C98394',
            secondaryColor: '#E9C7D1',
            textColor: '#FFFFFF'
        }
    },
    
    // Локализация
    TEXT: {
        GAME_OVER: 'Игра окончена!',
        NEW_GAME: 'Новая игра',
        SCORE: 'Счет',
        BEST_SCORE: 'Рекорд',
        YOU_WIN: 'Поздравляем! Вы выиграли!',
        YOU_LOSE: 'Это поражение',
        BEST_TILE: 'Лучшая плитка',
        TIME_LEFT: 'Время'
    }
};

console.log('AppConfig загружен');