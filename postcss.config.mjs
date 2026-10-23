import postcssImport from "postcss-import";
import nesting from "tailwindcss/nesting/index.js";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

export default { plugins: [postcssImport(), nesting(), tailwindcss(), autoprefixer()] };
