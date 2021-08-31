const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./pages/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class', // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        warmGray: colors.warmGray,
        lightTheme: {
          primary: '#f7f8f8',
          secondary: '#121212',
          background: {
            primary: '#d8e1e8',
            secondary: '#ccd8e0',
            third: '#86939c',
          },
          gradient: {
            primary: '#188ddb',
            secondary: '#ba3f8f',
          },
          green: {
            200: '#D3FBD8',
          },
          yellow: {
            200: '#f5f4d5',
            400: '#F9F871',
            800: '#EB9929',
          },
        },
        darkTheme: {
          primary: '#F3ECFF',
          secondary: '#787586',
          background: '#06050A',
          green: {
            200: '#D3FBD8',
          },
          yellow: {
            200: '#f5f4d5',
            400: '#f5f495',
          },
        },
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark'],
    },
  },
  plugins: [],
};
