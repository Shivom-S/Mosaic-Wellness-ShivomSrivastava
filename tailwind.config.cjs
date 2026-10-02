/** @type {import('tailwindcss').Config} */
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: v("bg"),
        surface: v("surface"),
        "surface-2": v("surface-2"),
        line: v("line"),
        ink: v("ink"),
        "ink-muted": v("ink-muted"),
        "ink-faint": v("ink-faint"),
        lamp: v("lamp"),
        "on-lamp": v("on-lamp"),
        normal: v("normal"),
        watch: v("watch"),
        doctor: v("doctor"),
        // shadcn compatibility (used by the few ui/ primitives we keep)
        border: v("line"),
        background: v("bg"),
        foreground: v("ink"),
        primary: { DEFAULT: v("lamp"), foreground: v("on-lamp") },
        secondary: { DEFAULT: v("surface-2"), foreground: v("ink") },
        muted: { DEFAULT: v("surface-2"), foreground: v("ink-muted") },
        accent: { DEFAULT: v("surface-2"), foreground: v("ink") },
        destructive: { DEFAULT: v("doctor"), foreground: v("bg") },
        ring: v("lamp"),
        input: v("line"),
        popover: { DEFAULT: v("surface"), foreground: v("ink") },
        card: { DEFAULT: v("surface"), foreground: v("ink") },
      },
      fontFamily: {
        display: ['"Fraunces Variable"', "Georgia", "serif"],
        sans: ['"Figtree Variable"', "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
      },
      fontSize: {
        // 17px on phones, 18px on laptops (see --fs-body). `small` is the 14px floor.
        body: ["var(--fs-body)", { lineHeight: "1.55" }],
        small: ["0.875rem", { lineHeight: "1.5" }],
      },
      borderRadius: {
        lg: "1rem",
        md: "0.75rem",
        sm: "0.5rem",
      },
      keyframes: {
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        twinkle: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "0.9" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.6)", opacity: "0" },
          "70%": { transform: "scale(1.08)", opacity: "1" },
          "100%": { transform: "scale(1)" },
        },
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "fade-up": "fade-up 420ms cubic-bezier(.2,.7,.2,1) both",
        twinkle: "twinkle 4s ease-in-out infinite",
        "pop-in": "pop-in 320ms cubic-bezier(.2,.7,.2,1) both",
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
