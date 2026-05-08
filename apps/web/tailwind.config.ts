import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        "rq-bg": "rgb(var(--rq-bg) / <alpha-value>)",
        "rq-surface": "rgb(var(--rq-surface) / <alpha-value>)",
        "rq-ink": "rgb(var(--rq-ink) / <alpha-value>)",
        "rq-ink-muted": "rgb(var(--rq-ink-muted) / <alpha-value>)",
        "rq-brand": "rgb(var(--rq-brand) / <alpha-value>)",
        "rq-brand-ink": "rgb(var(--rq-brand-ink) / <alpha-value>)",
        "rq-accent": "rgb(var(--rq-accent) / <alpha-value>)",
        "rq-success": "rgb(var(--rq-success) / <alpha-value>)",
        "rq-warn": "rgb(var(--rq-warn) / <alpha-value>)",
        "rq-danger": "rgb(var(--rq-danger) / <alpha-value>)",
        "rq-line": "rgb(var(--rq-line) / <alpha-value>)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      ringWidth: {
        3: "3px",
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        sans: ['var(--font-poppins)', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;

