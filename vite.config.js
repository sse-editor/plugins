import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "./package.json";
import dts from "vite-plugin-dts";

const entryPoints = [
  { name: "Header", fileName: "header", entry: "header/index.ts" },
  { name: "Paragraph", fileName: "paragraph", entry: "paragraph/index.ts" },
  { name: "Quote", fileName: "quote", entry: "quote/index.ts" },
  { name: "Delimiter", fileName: "delimiter", entry: "delimiter/index.ts" },
  { name: "Warning", fileName: "warning", entry: "warning/index.ts" },
  { name: "index", fileName: "index", entry: "index.ts" },
];

const NODE_ENV = process.argv.mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    copyPublicDir: false,
    lib: {
      // Use an array to define multiple entry points
      entry: entryPoints.reduce((acc, { entry }) => {
        acc[entry] = path.resolve(__dirname, "src", entry);
        return acc;
      }, {}),
    },
  },
  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },
  plugins: [
    cssInjectedByJsPlugin(),
    dts({
      tsconfigPath: "./tsconfig.json",
    }),
  ],
};
