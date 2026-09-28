/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        stone: {
          950: "#0a0c10",
          900: "#12161c",
          800: "#1b212a",
          700: "#272f3a",
          600: "#3a4453",
          500: "#5b6675",
          400: "#8d97a5",
          300: "#c2c9d4",
        },
        grass: {
          600: "#3f7a2a",
          500: "#5aa03a",
          400: "#7cc44f",
        },
        lava: {
          500: "#ff8a1f",
          400: "#ffb347",
        },
        diamond: "#4fd6d2",
      },
      fontFamily: {
        pixel: ['"Press Start 2P"', "ui-monospace", "monospace"],
        body: ['"VT323"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        block: "0 6px 0 0 rgba(0,0,0,0.45)",
        "block-lg": "0 10px 0 0 rgba(0,0,0,0.5)",
        inset: "inset 0 -4px 0 0 rgba(0,0,0,0.28), inset 0 4px 0 0 rgba(255,255,255,0.12)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-12px)" },
        },
        clouds: {
          "0%": { transform: "translateX(-25%)" },
          "100%": { transform: "translateX(125%)" },
        },
        flicker: {
          "0%, 100%": { opacity: "1" },
          "45%": { opacity: "0.75" },
          "70%": { opacity: "0.95" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        clouds: "clouds 60s linear infinite",
        flicker: "flicker 3s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
      },
    },
  },
  plugins: [],
};
