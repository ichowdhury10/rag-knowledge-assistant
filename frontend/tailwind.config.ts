import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        // Streaming cursor
        "cursor-blink": "cursor-blink 0.9s step-end infinite",
        // Entry animations
        "fade-up":        "fade-up 0.2s ease-out both",
        "fade-in":        "fade-in 0.15s ease-out both",
        "slide-in-right": "slide-in-right 0.25s cubic-bezier(0.16,1,0.3,1) both",
        "slide-in-left":  "slide-in-left 0.25s cubic-bezier(0.16,1,0.3,1) both",
        // Skeleton
        "shimmer": "shimmer 1.8s linear infinite",
        // Toast
        "toast-in":  "toast-in 0.3s cubic-bezier(0.16,1,0.3,1) both",
        "toast-out": "toast-out 0.2s ease-in forwards",
        // Spinner
        "spin-slow": "spin 1.2s linear infinite",
      },
      keyframes: {
        "cursor-blink": {
          "0%, 100%": { opacity: "1" },
          "50%":       { opacity: "0" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to:   { opacity: "1" },
        },
        "slide-in-right": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "slide-in-left": {
          from: { opacity: "0", transform: "translateX(-20px)" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "shimmer": {
          from: { backgroundPosition: "-200% center" },
          to:   { backgroundPosition: "200% center" },
        },
        "toast-in": {
          from: { opacity: "0", transform: "translateX(calc(100% + 1.5rem))" },
          to:   { opacity: "1", transform: "translateX(0)" },
        },
        "toast-out": {
          from: { opacity: "1", transform: "translateX(0)",           maxHeight: "100px" },
          to:   { opacity: "0", transform: "translateX(calc(100% + 1.5rem))", maxHeight: "0",   marginBottom: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
