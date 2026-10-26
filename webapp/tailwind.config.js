/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        /* The logo orange (#ff4800) is an accent only — focus rings, active
           markers and small highlights. Black carries the brand. */
        brand: {
          DEFAULT: "#ff4800",
          dark: "#dc3e00",
          soft: "#fff2ec",
          peach: "#ff9971",
        },
        ink: {
          DEFAULT: "#101010",
          soft: "#3f3f3f",
          muted: "#6d6d6d",
          faint: "#9b9b9b",
        },
        line: {
          DEFAULT: "#e4e4e4",
          soft: "#efefef",
        },
        cream: {
          DEFAULT: "#f7f7f5",
          deep: "#eeeeeb",
        },
        /* Kept as aliases so existing surfaces become the black shell. */
        maroon: {
          DEFAULT: "#0b0b0b",
          soft: "#161616",
          deep: "#000000",
        },
        success: "#0f7a4f",
        warning: "#9a6700",
        danger: "#c0362c",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "-apple-system", "sans-serif"],
        mono: ['"DM Mono"', "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        card: "10px",
        pill: "999px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(16,16,16,0.03)",
        pop: "0 2px 4px rgba(16,16,16,0.05), 0 18px 40px -24px rgba(16,16,16,0.28)",
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
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "page-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "rise-in": {
          from: { opacity: "0", transform: "translateY(12px) scale(0.995)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "pop-in": {
          from: { opacity: "0", transform: "translateY(-4px) scale(0.97)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateY(10px) scale(0.98)" },
          to: { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        "slide-in": {
          from: { opacity: "0", transform: "translateX(16px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-7px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-220px 0" },
          "100%": { backgroundPosition: "220px 0" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.32s cubic-bezier(0.22,1,0.36,1) both",
        "fade-in": "fade-in 0.24s ease both",
        "page-in": "page-in 0.4s cubic-bezier(0.22,1,0.36,1)",
        "rise-in": "rise-in 0.45s cubic-bezier(0.22,1,0.36,1) both",
        "pop-in": "pop-in 0.16s cubic-bezier(0.22,1,0.36,1) both",
        "toast-in": "toast-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        "slide-in": "slide-in 0.28s cubic-bezier(0.22,1,0.36,1) both",
        float: "float 7s ease-in-out infinite",
        shimmer: "shimmer 1.4s linear infinite",
      },
    },
  },
  plugins: [],
};
