import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "../package.json";
import { entryPoints } from "./utils";
// import dts from "vite-plugin-dts";

const NODE_ENV = process.argv.mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    outDir: `${process.cwd()}/dist/${entryPoints.column.fileName}`,
    copyPublicDir: false,
    lib: {
      entry: path.resolve(process.cwd(), "src", entryPoints.column.entry),
      name: entryPoints.column.name,
      fileName: entryPoints.column.fileName,
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
    // dts({
    //   tsconfigPath: "./tsconfig.json",
    //   compilerOptions: {
    //     outDir: `./dist/${entryPoints.column.fileName}`,
    //   },
    //   include: [`src/${entryPoints.column.entry}`],
    //   exclude: ["node_modules"],
    // }),
  ],
};
