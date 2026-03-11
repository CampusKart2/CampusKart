import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#1877F2",
        "primary-dark": "#166FE5",
        "primary-light": "#E7F0FF",
        surface: "#F0F2F5",
        card: "#FFFFFF",
        border: "#DADDE1",
        "text-primary": "#1C1E21",
        "text-secondary": "#65676B",
        "text-muted": "#8A8D91",
        success: "#42B72A",
        danger: "#FA3E3E",
        "badge-new": "#42B72A",
        "badge-likenew": "#31A24C",
        "badge-good": "#F7B928",
        "badge-fair": "#E88A18",
        "badge-poor": "#FA3E3E",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: {
        card: "8px",
        button: "6px",
        input: "6px",
        badge: "4px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(0,0,0,0.1)",
        "card-hover": "0 2px 8px rgba(0,0,0,0.15)",
      },
    },
  },
};

export default config;
