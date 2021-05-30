const colors = require("tailwindcss/colors");

module.exports = {
  mode: "jit",
  purge: ["./pages/**/*.{js,ts,jsx,tsx}"],
  darkMode: "media", // or 'media' or 'class'
  theme: {
    extend: {
      colors: {
        warmGray: colors.warmGray,
        darkTheme:{
          background: "#06050A",
          primary: "#F3ECFF",
          secondary: "#787586",
          positive: "#D3FBD8",
          coin: {
            primary: "#f5f495",
            secondary: "#f5f4d5"
          }
        }
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
