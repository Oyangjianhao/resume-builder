/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 暗色主题基础色
        dark: {
          900: '#08081a',
          800: '#0c0c24',
          700: '#111130',
          600: '#1a1a3e',
          500: '#24244a',
        },
        // 主色调：青蓝渐变
        primary: {
          50: '#e6fefe',
          100: '#cbfcfc',
          200: '#9af8f8',
          300: '#5ef0f0',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // 强调色：琥珀/金
        accent: {
          300: '#fcd34d',
          400: '#fbbf24',
          500: '#f59e0b',
          600: '#d97706',
        },
        // 玻璃表面
        glass: {
          light: 'rgba(15, 23, 42, 0.35)',
          DEFAULT: 'rgba(15, 23, 42, 0.55)',
          heavy: 'rgba(15, 23, 42, 0.75)',
          border: 'rgba(99, 102, 241, 0.18)',
          highlight: 'rgba(255, 255, 255, 0.06)',
        },
        // 保留原有 surface 用于过渡
        surface: '#f8f7f4',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
        'glass-hover': '0 12px 40px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.08), 0 0 20px rgba(34, 211, 238, 0.08)',
        'glow-sm': '0 0 12px rgba(34, 211, 238, 0.15)',
        'glow-md': '0 0 24px rgba(34, 211, 238, 0.2)',
        'glow-lg': '0 0 40px rgba(34, 211, 238, 0.25)',
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.03)',
        'card-hover': '0 4px 12px -2px rgba(0, 0, 0, 0.08), 0 2px 4px -2px rgba(0, 0, 0, 0.04)',
        'elevated': '0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 4px 10px -6px rgba(0, 0, 0, 0.04)',
      },
      backgroundImage: {
        'hero-gradient': 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(34, 211, 238, 0.08) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 80%, rgba(99, 102, 241, 0.06) 0%, transparent 50%)',
        'card-gradient': 'linear-gradient(135deg, rgba(34, 211, 238, 0.04) 0%, rgba(99, 102, 241, 0.02) 50%, transparent 100%)',
        'glow-line': 'linear-gradient(90deg, transparent, rgba(34, 211, 238, 0.3), transparent)',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '400ms',
      },
      animation: {
        'float': 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'shimmer-slow': 'shimmer 3s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { boxShadow: '0 0 8px rgba(34, 211, 238, 0.1)' },
          '50%': { boxShadow: '0 0 20px rgba(34, 211, 238, 0.3)' },
        },
      },
    },
  },
  plugins: [],
}
