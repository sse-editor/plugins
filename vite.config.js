import path, { format } from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "./package.json";
import dts from "vite-plugin-dts";

// const entryPoints = [
//   { name: "Header", fileName: "header", entry: "header/index.ts" },
//   { name: "Paragraph", fileName: "paragraph", entry: "paragraph/index.ts" },
//   { name: "Quote", fileName: "quote", entry: "quote/index.ts" },
//   { name: "Delimiter", fileName: "delimiter", entry: "delimiter/index.ts" },
//   { name: "Warning", fileName: "warning", entry: "warning/index.ts" },
//   { name: "Code", fileName: "code", entry: "code/index.ts" },
//   { name: "index", fileName: "index", entry: "index.ts" },
//   {
//     name: "Simple Image",
//     fileName: "simple-image",
//     entry: "simple-image/index.ts",
//   },
// ];

const entryPoints = {
  header: { name: "Header", fileName: "header", entry: "header/index.ts" },
  paragraph: {
    name: "Paragraph",
    fileName: "paragraph",
    entry: "paragraph/index.ts",
  },
  quote: { name: "Quote", fileName: "quote", entry: "quote/index.ts" },
  delimiter: {
    name: "Delimiter",
    fileName: "delimiter",
    entry: "delimiter/index.ts",
  },
  warning: { name: "Warning", fileName: "warning", entry: "warning/index.ts" },
  code: { name: "Code", fileName: "code", entry: "code/index.ts" },
  index: { name: "index", fileName: "index", entry: "index.ts" },
  simpleImage: {
    name: "Image",
    fileName: "image",
    entry: "image/index.ts",
  },
};

const NODE_ENV = process.argv.mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    copyPublicDir: false,
    lib: {
      entry: path.resolve(__dirname, `src/${entryPoints.index.entry}`),
      // filen
    },
  },
  define: {
    NODE_ENV: JSON.stringify(NODE_ENV),
    VERSION: JSON.stringify(VERSION),
  },
  plugins: [
    cssInjectedByJsPlugin({
      dev: { enableDev: true },
      injectCodeFunction: function injectCodeCustom(cssCode, options) {
        try {
          if (typeof document != "undefined") {
            var elementStyle = document.createElement("style");

            // SET ALL ATTRIBUTES
            for (const attribute in options.attributes) {
              elementStyle.setAttribute(
                attribute,
                options.attributes[attribute]
              );
            }

            elementStyle.appendChild(document.createTextNode(`${cssCode}`));
            document.head.appendChild(elementStyle);
          }
        } catch (e) {
          console.error("sse-vite-plugin-css-injected-by-js", e);
        }
      },
    }),
    dts({
      tsconfigPath: "./tsconfig.json",
    }),
  ],
};
