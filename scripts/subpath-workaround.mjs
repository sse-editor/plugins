#!/usr/bin/env zx

import fs from "fs";

const loadJSON = (path) =>
  JSON.parse(fs.readFileSync(new URL(path, import.meta.url)));
const writeJSON = (path, contents) =>
  fs.writeFileSync(
    new URL(path, import.meta.url),
    JSON.stringify(contents, null, 2)
  );

const pkgJsonPlaceholder = (name) => ({
  main: `../dist/${name}.umd.js`,
  module: `../dist/${name}.mjs`,
});

const pkgJsonBarrelPlaceholder = (name) => ({
  main: `../dist/${name}/${name}.umd.js`,
  module: `../dist/${name}/${name}.mjs`,
  types: `../types/${name}/index.d.ts`
});

async function run() {
  console.log("Loading package.json");
  const pkgFile = loadJSON(`../package.json`);

  const subpathHelperFile = await import("../subpaths.mjs");

  console.log(
    `Found ${subpathHelperFile.subpathNames.length} subpaths and ${subpathHelperFile.subpathFoldersBarrel.length} subpath barrels`
  );

  const allFilesNames = [
    ...subpathHelperFile.subpathNames,
    ...subpathHelperFile.subpathFoldersBarrel,
    ...subpathHelperFile.ignoredFolders,
    "dist",
    "types",
  ];

  //   console.log(allFilesNames);

  if (pkgFile.files.length !== allFilesNames.length) {
    throw new Error(
      'The package.json "files" array length does not match the subpaths.js'
    );
  }

  const hasAllSubpathsInFiles = pkgFile.files.every((name) =>
    allFilesNames.includes(name)
  );

  if (!hasAllSubpathsInFiles) {
    throw new Error(
      'Not all subpaths from the package.json "files" array are in the subpaths.js'
    );
  }

  subpathHelperFile.subpathNames.forEach((name) => {
    const dir = new URL(`../${name}`, import.meta.url);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    writeJSON(`../${name}/package.json`, pkgJsonPlaceholder(name)); // Adjusted path
  });

  subpathHelperFile.subpathFoldersBarrel.forEach(name => {
    const dir = new URL(`../${name}`, import.meta.url); // Adjusted path
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }
    writeJSON(`../${name}/package.json`, pkgJsonBarrelPlaceholder(name)); // Adjusted path
  });

  console.log('Successfully created subpath directories with placeholder files');
}


run();
