import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        /** Near-black stage — matches reference art backdrop */
        void: {
          DEFAULT: "#050506",
          soft: "#0a0a0c",
          lift: "#101014",
          panel: "#15151a",
          line: "#1f1f26",
        },
        /** Electric cyan from reference (eyes, clips, studs) */
        glow: {
          300: "#8ad9ff",
          400: "#5cccff",
          500: "#3abef9",
          600: "#1aa6eb",
          700: "#0b7dbd",
        },
        /** Warm off-white / ivory — hair highlights in reference */
        parchment: {
          DEFAULT: "#f7f4ec",
          muted: "#c9c3b8",
          dim: "#8a847a",
        },
        /** Soft blush — cheeks in reference, use sparingly */
        coral: {
          soft: "#f88379",
          glow: "#ff9a93",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-outfit)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      boxShadow: {
        "glow-sm": "0 0 24px -4px rgba(58, 190, 249, 0.45)",
        "glow-md": "0 0 48px -8px rgba(58, 190, 249, 0.5)",
        "glow-lg": "0 0 80px -12px rgba(58, 190, 249, 0.55)",
        "inner-glow":
          "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 0 40px -20px rgba(58, 190, 249, 0.12)",
      },
      animation: {
        "slow-pulse": "slow-pulse 5s ease-in-out infinite",
        drift: "drift 20s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
      },
      keyframes: {
        "slow-pulse": {
          "0%, 100%": { opacity: "0.35" },
          "50%": { opacity: "0.75" },
        },
        drift: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "40%": { transform: "translate(3%, -2%) scale(1.04)" },
          "70%": { transform: "translate(-2%, 3%) scale(0.98)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.5", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.15)" },
        },
      },
      backgroundImage: {
        "grid-soft":
          "linear-gradient(to right, rgba(255,255,255,0.035) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.035) 1px, transparent 1px)",
        "rim-cyan":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgba(58, 190, 249, 0.22), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;
