/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      //  COLORS
      colors: {
        // BRAND — Teal (LOCKED)
        brand: {
          50: "#E6F7F5", // Light tint
          100: "#CCFBF1", // Subtle tint (avatars, badges)
          500: "#14B8A6", // Medium teal (focus rings)
          600: "#0F766E", // ⭐ Primary Teal (Main Brand Color)
          700: "#115E59", // Hover / Active
        },

        //  NEUTRAL
        neutral: {
          background: "#F8FAFC",
          surface: "#FFFFFF",
          border: "#E2E8F0",
          muted: "#64748B",
          text: "#0F172A",
        },

        //  SEVERITY (Gap Engine) — WCAG AA Validated
        severity: {
          critical: { DEFAULT: "#B91C1C", bg: "#FEF2F2" },
          moderate: { DEFAULT: "#C2410C", bg: "#FFF7ED" },
          minor: { DEFAULT: "#A16207", bg: "#FEFCE8" },
          met: { DEFAULT: "#15803D", bg: "#F0FDF4" },
          strength: { DEFAULT: "#9333EA", bg: "#FAF5FF" },
        },
      },

      //  TYPOGRAPHY
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      fontSize: {
        h1: ["24px", { lineHeight: "32px", fontWeight: "700" }],
        h2: ["20px", { lineHeight: "28px", fontWeight: "600" }],
        h3: ["18px", { lineHeight: "26px", fontWeight: "600" }],
        h4: ["16px", { lineHeight: "24px", fontWeight: "600" }],
        body: ["14px", { lineHeight: "20px", fontWeight: "400" }],
        small: ["12px", { lineHeight: "16px", fontWeight: "400" }],
      },

      //  SPACING
      spacing: {
        4: "4px",
        8: "8px",
        12: "12px",
        16: "16px",
        24: "24px",
        32: "32px",
      },

      //  BORDER RADIUS
      borderRadius: {
        md: "6px",
        lg: "8px",
      },
    },
  },
  plugins: [],
};
