/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bgMain: "#050A0F",
        bgSidebar: "#0B1218",
        bgCard: "#0E1820",
        bgCardHover: "#101C24",
        borderColor: "#1D3038",
        chiralBlue: "#00E5FF",
        blueMain: "#2F80ED",
        blueLight: "#56CCF2",
        greenMain: "#2ECC71",
        yellowMain: "#F2C94C",
        orangeMain: "#F2994A",
        odradekOrange: "#FF7A00",
        redMain: "#EB5757",
        textMain: "#F4F7FA",
        textSecondary: "#9BAAB4",
        textMuted: "#61717C",
      }
    },
  },
  plugins: [],
}
