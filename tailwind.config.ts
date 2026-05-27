import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette
        teal:   { DEFAULT: "#adfcf9", dim: "rgba(173,252,249,0.12)", glow: "rgba(173,252,249,0.06)" },
        sage:   { DEFAULT: "#89a894", dim: "rgba(137,168,148,0.15)" },
        forest: { DEFAULT: "#4b644a" },
        wine:   { DEFAULT: "#49393b", glass: "rgba(73,57,59,0.35)" },
        deep:   { DEFAULT: "#341c1c" },

        // Background layers
        bg: {
          base:   "#0d0f0e",
          layer1: "#1a1c1b",
          layer2: "#222625",
          layer3: "#2c3030",
        },

        // Glass
        glass: {
          border:       "rgba(173,252,249,0.12)",
          "border-strong": "rgba(173,252,249,0.25)",
          surface:      "rgba(173,252,249,0.04)",
        },
      },

      fontFamily: {
        display: ["Syne", "sans-serif"],
        body:    ["Space Grotesk", "sans-serif"],
        mono:    ["Space Mono", "monospace"],
        sans:    ["Space Grotesk", "sans-serif"],
      },

      fontSize: {
        // Brutalist display scale
        "display-2xl": ["clamp(40px,7vw,80px)",  { lineHeight: "0.9",  letterSpacing: "-0.04em" }],
        "display-xl":  ["clamp(32px,5vw,64px)",  { lineHeight: "0.92", letterSpacing: "-0.04em" }],
        "display-lg":  ["clamp(28px,4vw,48px)",  { lineHeight: "0.95", letterSpacing: "-0.03em" }],
        "display-md":  ["clamp(22px,3vw,32px)",  { lineHeight: "1.0",  letterSpacing: "-0.03em" }],
        "h1":          ["28px",  { lineHeight: "1.1",  letterSpacing: "-0.03em", fontWeight: "700" }],
        "h2":          ["20px",  { lineHeight: "1.2",  letterSpacing: "-0.02em", fontWeight: "700" }],
        "h3":          ["16px",  { lineHeight: "1.3",  letterSpacing: "-0.01em", fontWeight: "600" }],
        "body":        ["14px",  { lineHeight: "1.65" }],
        "body-sm":     ["13px",  { lineHeight: "1.6"  }],
        "label":       ["12px",  { lineHeight: "1.4",  letterSpacing: "0.01em"  }],
        "mono-sm":     ["10px",  { lineHeight: "1.5",  letterSpacing: "0.1em"   }],
        "mono-xs":     ["9px",   { lineHeight: "1.4",  letterSpacing: "0.12em"  }],
        "eyebrow":     ["10px",  { lineHeight: "1",    letterSpacing: "0.2em"   }],
      },

      spacing: {
        // Explicit design system scale
        "sp-1": "4px",
        "sp-2": "8px",
        "sp-3": "12px",
        "sp-4": "16px",
        "sp-5": "24px",
        "sp-6": "32px",
        "sp-7": "48px",
        "sp-8": "64px",
        "sp-9": "96px",
      },

      borderRadius: {
        none:   "0",
        sm:     "4px",
        md:     "8px",
        lg:     "12px",
        xl:     "14px",
        "2xl":  "16px",
        "3xl":  "20px",
        full:   "9999px",
      },

      boxShadow: {
        "dark-sm":     "0 2px 8px rgba(0,0,0,0.3)",
        "dark-md":     "0 4px 16px rgba(0,0,0,0.4), 0 1px 4px rgba(0,0,0,0.3)",
        "dark-lg":     "0 8px 32px rgba(0,0,0,0.5), 0 2px 8px rgba(0,0,0,0.3)",
        "dark-xl":     "0 16px 48px rgba(0,0,0,0.6), 0 4px 16px rgba(0,0,0,0.4)",
        "teal-ring":   "0 0 0 1px rgba(173,252,249,0.15), 0 4px 24px rgba(0,0,0,0.4)",
        "teal-focus":  "0 0 0 2px rgba(173,252,249,0.4)",
        "glass-inset": "0 0 0 1px rgba(173,252,249,0.2), inset 0 1px 0 rgba(173,252,249,0.08)",
        "teal-ambient":"0 0 32px rgba(173,252,249,0.08), 0 4px 16px rgba(0,0,0,0.4)",
        "card-hover":  "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(173,252,249,0.15)",
        "brutal-offset":"4px 4px 0 rgba(173,252,249,0.15)",
      },

      backgroundImage: {
        "glass-top":    "linear-gradient(180deg, rgba(173,252,249,0.06) 0%, transparent 100%)",
        "glass-shimmer":"linear-gradient(90deg, transparent, rgba(173,252,249,0.06), transparent)",
        "teal-gradient":"linear-gradient(135deg, rgba(173,252,249,0.15), rgba(75,100,74,0.2))",
        "dark-gradient":"linear-gradient(180deg, #1a1c1b 0%, #0d0f0e 100%)",
      },

      keyframes: {
        "pulse-teal": {
          "0%,100%": { boxShadow: "0 0 0 0 rgba(173,252,249,0.3)" },
          "50%":      { boxShadow: "0 0 0 8px rgba(173,252,249,0)" },
        },
        scan: {
          "0%":   { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(300%)" },
        },
        flicker: {
          "0%,100%": { opacity: "1" },
          "48%":     { opacity: "1" },
          "50%":     { opacity: "0.4" },
          "52%":     { opacity: "1" },
        },
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%":     { transform: "translateY(-5px)" },
        },
        "fade-in-up": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "slide-in-right": {
          "0%":   { opacity: "0", transform: "translateX(16px)" },
          "100%": { opacity: "1", transform: "translateX(0)" },
        },
        blink: {
          "0%,100%": { opacity: "1" },
          "50%":     { opacity: "0" },
        },
        "spin-slow": {
          from: { transform: "rotate(0deg)" },
          to:   { transform: "rotate(360deg)" },
        },
        "stagger-in": {
          "0%":   { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },

      animation: {
        "pulse-teal":     "pulse-teal 2s ease-in-out infinite",
        "scan":           "scan 2s linear infinite",
        "flicker":        "flicker 4s ease-in-out infinite",
        "float":          "float 3s ease-in-out infinite",
        "fade-in-up":     "fade-in-up 0.2s cubic-bezier(0,0,0.2,1) both",
        "fade-in":        "fade-in 0.15s ease-out both",
        "slide-in-right": "slide-in-right 0.2s cubic-bezier(0,0,0.2,1) both",
        "blink":          "blink 1s step-end infinite",
        "spin-slow":      "spin-slow 2s linear infinite",
      },

      transitionTimingFunction: {
        snappy:  "cubic-bezier(0.4, 0, 0.2, 1)",
        bounce:  "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
      },

      transitionDuration: {
        "75":  "75ms",
        "100": "100ms",
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
      },

      backdropBlur: {
        glass: "12px",
        "glass-lg": "20px",
      },

      screens: {
        xs:  "480px",
        sm:  "640px",
        md:  "768px",
        lg:  "1024px",
        xl:  "1280px",
        "2xl": "1440px",
      },

      maxWidth: {
        content: "1280px",
        prose:   "680px",
      },

      zIndex: {
        sidebar:  "40",
        topbar:   "50",
        modal:    "60",
        toast:    "70",
        tooltip:  "80",
        command:  "90",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
  ],
};

export default config;
