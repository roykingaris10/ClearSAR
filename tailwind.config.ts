import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "SF Pro Text",
          "Helvetica Neue",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
      colors: {
        canvas: "#f4f5f7",
        surface: "#ffffff",
        ink: {
          DEFAULT: "#0a0a0a",
          muted: "#6b6b70",
          subtle: "#9a9aa0",
        },
        azure: {
          50: "#eaf4ff",
          100: "#d5e9ff",
          200: "#a8d2ff",
          300: "#74b5ff",
          400: "#3d99ff",
          500: "#0078ff",
          600: "#0066db",
          700: "#0054b3",
          800: "#003f85",
          900: "#002a59",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 20px rgba(15, 23, 42, 0.04)",
        glass:
          "0 1px 2px rgba(15, 23, 42, 0.04), 0 10px 40px rgba(15, 23, 42, 0.06)",
        "azure-glow": "0 8px 32px rgba(0, 120, 255, 0.18)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "fade-in-up": "fadeInUp 0.6s ease-out forwards",
        "pulse-subtle": "pulseSubtle 2s ease-in-out infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseSubtle: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
