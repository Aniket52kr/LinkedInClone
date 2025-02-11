/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
     "./src/**/*.{js,ts,jsx,tsx}"
    ],
  theme: {
    extend: {
      height: {
        "1/10": "10%",
        "6/10": "60%",
        "9/10": "90%",
      }
    },
  },
  plugins: [],
};
