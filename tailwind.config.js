const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: ["./pages/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        warmGray: colors.warmGray,
        darkTheme:{
          primary: "#F3ECFF",
          secondary: "#787586",
          background: "#06050A",
          green: {
            200: "#D3FBD8"
          },
          yellow: {
            200: "#f5f4d5",
            400: "#f5f495"
          }
        }
      },
    },
  },
  variants: {
    extend: {
      backgroundColor: ['dark'],
      textColor: ['dark']
    },
  },
  plugins: [],
};
