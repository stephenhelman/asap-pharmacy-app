import type { Config } from "tailwindcss";

/**
 * ASAP Design Token Master → Tailwind.
 * Grayscale is retired; every color is an ASAP brand or semantic role.
 * Components map to SEMANTIC roles (page/card/text-primary/accent/…), not raw hex.
 */
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette (authoritative)
        navy: {
          DEFAULT: "#1B3A5C",
          dark: "#0F2540",
          light: "#2D5282",
        },
        teal: {
          DEFAULT: "#3D9E7C",
          dark: "#2E7A5F",
          light: "#E8F5F1",
          mid: "#A8D8C8",
        },
        amber: {
          DEFAULT: "#D97706",
          light: "#FEF3C7",
        },
        red: {
          DEFAULT: "#C53030",
          light: "#FFF5F5",
        },
        green: { DEFAULT: "#276749" },

        // Semantic roles — components target these
        page: "#F8FAFB",
        desk: "#EBF0F8",
        card: "#FFFFFF",
        border: {
          DEFAULT: "#E2E8F0",
          strong: "#CBD5E0",
        },
        text: {
          primary: "#1B3A5C",
          secondary: "#4A5568",
          muted: "#A0AEC0",
        },
        "fill-control": "#EDF2F7",
        accent: "#1B3A5C",
        "accent-2": "#3D9E7C",
        "icon-tile": "#EBF0F8",
      },
      borderRadius: {
        control: "8px",
        card: "12px",
        "card-sm": "10px",
        frame: "20px",
        pill: "999px",
        tile: "9px",
      },
      fontSize: {
        // style · [size, {lineHeight}] — weights applied via font-* utilities
        display: ["20px", { lineHeight: "24px", fontWeight: "600" }],
        h2: ["18px", { lineHeight: "22px", fontWeight: "600" }],
        "title-name": ["17px", { lineHeight: "22px", fontWeight: "600" }],
        "num-hero": ["22px", { lineHeight: "26px", fontWeight: "600" }],
        "title-card": ["14px", { lineHeight: "20px", fontWeight: "600" }],
        body: ["13px", { lineHeight: "20px" }],
        "body-strong": ["13px", { lineHeight: "20px", fontWeight: "600" }],
        "label-strong": ["12px", { lineHeight: "17px", fontWeight: "600" }],
        label: ["12px", { lineHeight: "17px" }],
        nav: ["10px", { lineHeight: "13px" }],
        micro: ["11px", { lineHeight: "13px" }],
        section: ["11px", { lineHeight: "14px", fontWeight: "600", letterSpacing: "0.04em" }],
      },
      spacing: {
        "4.5": "18px",
        "5.5": "22px",
      },
      boxShadow: {
        pane: "-8px 0 32px rgba(15,37,64,0.18)",
        float: "0 8px 24px rgba(15,37,64,0.16)",
        card: "0 1px 2px rgba(15,37,64,0.04)",
      },
      maxWidth: {
        phone: "390px",
        column: "560px",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
