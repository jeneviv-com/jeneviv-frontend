/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#ff4a00",
          dark: "#e33f00",
          soft: "#fff1ea",
          peach: "#ffb596",
        },
        ink: {
          DEFAULT: "#14110f",
          soft: "#4c463f",
          muted: "#7c756c",
          faint: "#a39b91",
        },
        line: {
          DEFAULT: "#e7e1d8",
          soft: "#f1ece4",
        },
        cream: {
          DEFAULT: "#faf6ef",
          deep: "#f3eee4",
        },
        maroon: {
          DEFAULT: "#35100a",
          soft: "#45170d",
          deep: "#260b06",
        },
        success: "#0f7a4f",
        warning: "#b26a00",
        danger: "#c8362b",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "14px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(20,17,15,0.04), 0 10px 26px -20px rgba(20,17,15,0.28)",
        pop: "0 2px 6px rgba(20,17,15,0.06), 0 24px 48px -20px rgba(20,17,15,0.34)",
      },
      fontSize: {
        "2xs": ["11px", "15px"],
        "3xs": ["10px", "14px"],
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-220px 0" },
          "100%": { backgroundPosition: "220px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
