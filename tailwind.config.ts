import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/hooks/**/*.{ts,tsx}",
  ],
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        brand: {
          orange: "#FE4900",
          "orange-hover": "#E63D00",
          peach: "#FFAD86",
          cream: "#FAF5EC",
          brown: "#4D1810",
          "brown-soft": "#5C1F12",
          "brown-deep": "#2E0D08",
        },
        ink: {
          DEFAULT: "#1A1A1A",
          black: "#111111",
          body: "#444444",
          muted: "#6B6B6B",
        },
        line: {
          DEFAULT: "#E8E8E8",
          soft: "#F0F0F0",
        },
        amber: {
          banner: "#FFF7E6",
          "banner-border": "#F2C765",
          "banner-text": "#7A5300",
        },
        success: "#10B981",
        danger: "#DC2626",
        "danger-soft": "#FEE2E2",
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"],
        serif: ['"Fraunces"', "Georgia", "serif"],
        mono: ['"DM Mono"', "ui-monospace", "monospace"],
      },
      borderRadius: {
        sm: "8px",
        md: "14px",
        lg: "20px",
        xl: "28px",
        "2xl": "20px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(17,17,17,0.04), 0 4px 16px rgba(17,17,17,0.04)",
        "card-hover": "0 2px 4px rgba(17,17,17,0.06), 0 8px 24px rgba(17,17,17,0.08)",
        fab: "0 8px 24px rgba(254,73,0,0.32)",
      },
    },
  },
  plugins: [],
};

export default config;
