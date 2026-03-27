/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./pages/**/*.{js,jsx}', './components/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      colors: {
        ios: {
          blue:   '#007aff',
          green:  '#34c759',
          red:    '#ff3b30',
          orange: '#ff9500',
          purple: '#af52de',
          teal:   '#5ac8fa',
          'blue-dark':   '#0a84ff',
          'green-dark':  '#30d158',
          'red-dark':    '#ff453a',
          'orange-dark': '#ff9f0a',
        },
      },
      borderRadius: { '2xl': '1rem', '3xl': '1.5rem', '4xl': '2rem' },
      boxShadow: {
        'ios':      '0 2px 16px rgba(0,0,0,0.08)',
        'ios-md':   '0 4px 24px rgba(0,0,0,0.12)',
        'ios-lg':   '0 8px 40px rgba(0,0,0,0.16)',
        'ios-glow': '0 0 20px rgba(0,122,255,0.3)',
      },
    },
  },
  plugins: [],
};
