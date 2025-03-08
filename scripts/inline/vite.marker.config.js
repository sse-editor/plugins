import path from "path";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import * as pkg from "../../package.json";
import { entryPoints } from "../utils";
// import dts from "vite-plugin-dts";

const NODE_ENV = process.argv.mode || "development";
const VERSION = pkg.version;

export default {
  build: {
    outDir: `${process.cwd()}/dist/inline/${entryPoints.inline.marker.fileName}`,
    copyPublicDir: false,
    lib: {
      entry: path.resolve(process.cwd(), "src", "inlineTools",entryPoints.inline.marker.entry),
      name: entryPoints.inline.marker.name,
      fileName: entryPoints.inline.marker.fileName,
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
    //     outDir: `./dist/${entryPoints.inline.marker.fileName}`,
    //   },
    //   include: [`src/${entryPoints.inline.marker.entry}`],
    //   exclude: ["node_modules"],
    // }),
  ],
};
