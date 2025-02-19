// tsup-plugin-inject-css.ts
import fs from "fs";
import path from "path";

export function injectCssPlugin() {
  return {
    name: "inject-css",
    async transform(code, id) {
      // Check if the file imports any CSS
      const cssImportRegex = /import\s+.*?['"](.+?\.css)['"]/g;
      const cssImports: string[] = [];
      let match;

      while ((match = cssImportRegex.exec(code)) !== null) {
        cssImports.push(match[1]); // Capture the CSS file path
      }

      // If no CSS imports are found, return the original code
      if (cssImports.length === 0) {
        return null; // No transformation needed
      }

      // Read and concatenate all CSS content
      let cssContent = "";
      for (const cssFile of cssImports) {
        const cssFilePath = path.resolve(path.dirname(id), cssFile);
        if (fs.existsSync(cssFilePath)) {
          cssContent += fs.readFileSync(cssFilePath, "utf-8") + "\n";
        }
      }

      // Create a style tag with the CSS content
      const styleTag = `
        (function() {
          const style = document.createElement('style');
          style.appendChild(document.createTextNode(\`${cssContent}\`));
          document.head.appendChild(style);
        })();
      `;

      // Prepend the style tag to the original code
      return {
        code: styleTag + code,
        map: null, // You can generate a source map if needed
      };
    },
  };
}
