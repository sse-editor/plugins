import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import postcss from "rollup-plugin-postcss";
import { terser } from "rollup-plugin-terser";
import path from "path";
import fs from "fs";

// Function to get all index.ts files in the src folder
const getInputFiles = (dir) => {
  const folders = fs.readdirSync(dir).filter((file) => {
    return fs.statSync(path.join(dir, file)).isDirectory();
  });

  return folders.map((folder) => path.join(dir, folder, "index.ts"));
};

const inputFiles = getInputFiles("src");

export default {
  input: inputFiles,
  output: {
    dir: "dist",
    format: "cjs", // Set to CommonJS as per your tsconfig
    sourcemap: true,
  },
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      tsconfig: "./tsconfig.json", // Use your tsconfig.json
    }),
    postcss({
      extract: true, // Extract CSS to a separate file
      minimize: true, // Minimize CSS
    }),
    terser(), // Minify the output
  ],
};
