// CONFIG.js - настройки приложения
window.AppConfig = {
    GAME: {
        INITIAL_TILES: 2,
        PROBABILITY_4: 0.1,
        DEFAULT_SIZE: 4,
        ANIMATION_DURATION: 150,
        TIME_ATTACK_DURATION: 90,
        EXPLODE_PERCENTAGE: 0.48
    },
    
    TELEGRAM: {
        BUTTON_HEIGHT: 40,
        USE_THEME: true
    },
    
    // НАСТРОЙКИ ВИБРАЦИИ
    VIBRATION: {
        ENABLED: true,
        MOVE: 50,        // Обычные ходы
        MERGE: 150,      // Объединение плиток
        WIN: 300,        // Победа
        LOSE: 200,       // Поражение
        BUTTON: 30       // Нажатия кнопок
    },
    
    THEMES: {
        default: { 
            bgColor: '#faf8ef', 
            primaryColor: '#635BFF', 
            secondaryColor: '#8B85FF', 
            textColor: '#222222' 
        },
        green: { 
            bgColor: '#f1f8e9', 
            primaryColor: '#4CAF50', 
            secondaryColor: '#45a049', 
            textColor: '#1b5e20' 
        },
        purple: { 
            bgColor: '#f3e5f5', 
            primaryColor: '#9C27B0', 
            secondaryColor: '#7B1FA2', 
            textColor: '#4a148c' 
        },
        orange: { 
            bgColor: '#fff3e0', 
            primaryColor: '#FF9800', 
            secondaryColor: '#F57C00', 
            textColor: '#e65100' 
        },
        blue: { 
            bgColor: '#e3f2fd', 
            primaryColor: '#2196F3', 
            secondaryColor: '#1976D2', 
            textColor: '#0d47a1' 
        }
    }
};