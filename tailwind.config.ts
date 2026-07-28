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
        /** Accent ramp — cyan by default (see globals.css), re-themed per
         *  character profile via the `--accent-*` CSS variables. */
        glow: {
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
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
        "glow-sm": "0 0 24px -4px rgb(var(--accent-500) / 0.45)",
        "glow-md": "0 0 48px -8px rgb(var(--accent-500) / 0.5)",
        "glow-lg": "0 0 80px -12px rgb(var(--accent-500) / 0.55)",
        "inner-glow":
          "inset 0 1px 0 0 rgba(255,255,255,0.06), inset 0 0 40px -20px rgb(var(--accent-500) / 0.12)",
      },
      animation: {
        "slow-pulse": "slow-pulse 5s ease-in-out infinite",
        drift: "drift 20s ease-in-out infinite",
        twinkle: "twinkle 3s ease-in-out infinite",
        shimmer: "shimmer 2.2s ease-in-out infinite",
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
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
      backgroundImage: {
        /** Accent-tinted line grid so the backdrop pattern follows the theme */
        "grid-soft":
          "linear-gradient(to right, rgb(var(--accent-500) / 0.07) 1px, transparent 1px), linear-gradient(to bottom, rgb(var(--accent-500) / 0.07) 1px, transparent 1px)",
        "rim-cyan":
          "radial-gradient(ellipse 80% 50% at 50% -20%, rgb(var(--accent-500) / 0.22), transparent 55%)",
        /** Diagonal accent-tinted band swept across skeletons by `animate-shimmer` */
        shimmer:
          "linear-gradient(105deg, transparent 40%, rgb(var(--accent-500) / 0.08) 50%, transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
