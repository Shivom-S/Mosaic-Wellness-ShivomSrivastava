import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";

// Font sizes are written as text-[15px] in the components. Emit them as rem so the
// "Easier on the eyes" mode (html { font-size: 18px }) scales all text, not just the Tailwind scale.
const pxFontSizeToRem = {
  postcssPlugin: "px-font-size-to-rem",
  Declaration: {
    "font-size": (decl) => {
      const m = /^(\d*\.?\d+)px$/.exec(decl.value.trim());
      if (m) decl.value = `${parseFloat((parseFloat(m[1]) / 16).toFixed(4))}rem`;
    },
  },
};

export default {
  plugins: [tailwindcss(), autoprefixer(), pxFontSizeToRem],
};
