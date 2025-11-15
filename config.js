// config.js - полная конфигурация приложения без вибрации
window.AppConfig = {
    GAME: {
        INITIAL_TILES: 2,
        PROBABILITY_4: 0.1,
        TIME_ATTACK_DURATION: 90
    },
    
    THEMES: {
        default: {
            bgColor: '#faf8ef',
            primaryColor: '#bbada0', 
            secondaryColor: '#cdc1b4',
            textColor: '#776e65'
        },
        dark: {
            bgColor: '#2d2d2d',
            primaryColor: '#4a4a4a',
            secondaryColor: '#3a3a3a', 
            textColor: '#ffffff'
        },
        blue: {
            bgColor: '#e8f4f8',
            primaryColor: '#3498db',
            secondaryColor: '#aed6f1',
            textColor: '#2c3e50'
        },
        green: {
            bgColor: '#e8f5e8',
            primaryColor: '#27ae60',
            secondaryColor: '#a3e4a3',
            textColor: '#1e5631'
        },
        purple: {
            bgColor: '#f3e8fd',
            primaryColor: '#9C27B0',
            secondaryColor: '#ce93d8',
            textColor: '#4a148c'
        },
        orange: {
            bgColor: '#fff3e0',
            primaryColor: '#FF9800',
            secondaryColor: '#ffcc80',
            textColor: '#e65100'
        }
    },
    
    UI: {
        ANIMATION_DURATION: 100,
        TILE_TRANSITION: 0.1
    },
    
    MODES: {
        '4x4': {
            name: 'Классика 4x4',
            description: 'Собери плитку 2048'
        },
        '5x5': {
            name: 'Эксперт 5x5', 
            description: 'Собери плитку 4096'
        },
        '4x4-time': {
            name: 'На скорость',
            description: '90 секунд на игру'
        },
        '5x5-zen': {
            name: 'Релакс 5x5',
            description: 'Без ограничений'
        }
    }
};