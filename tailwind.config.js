module.exports = {
  purge: [],
  darkMode: 'class', // or 'media' or false
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#06b6d4', // cyan-500
          foreground: '#f1f5f9',
        },
        secondary: {
          DEFAULT: '#64748b', // slate-500
          foreground: '#f1f5f9',
        },
        background: {
          DEFAULT: '#f1f5f9', // slate-100
          dark: '#0f172a', // slate-900
        },
        card: {
          DEFAULT: '#fff',
          dark: '#0f172a',
        },
        border: {
          DEFAULT: '#e2e8f0', // slate-200
          dark: '#334155', // slate-800
        },
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
