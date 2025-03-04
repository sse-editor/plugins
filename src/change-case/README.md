# Change Case Inline Tool

Change Case Tool for the [SSE Editor](https://github.com/sse-editor/editor)

![](/assets/change-case.gif)

## Installation

### Install via NPM

Get the package

```shell
npm i --save-dev @sse-editor/plugins
```

OR

```shell
yarn add @sse-editor/plugins
```

Include module at your application

```javascript
import ChangeCase from "@sse-editor/plugins/change-case";
```

## Usage

Add a new Tool to the `tools` property of the Editor.js initial config.
The locale parameter used to convert according to locale-specific case mappings.

```javascript
var editor = SSEEditor({
  tools: {
    changeCase: {
      class: ChangeCase,
      config: {
        showLocaleOption: true, // enable locale case options
        locale: "tr", // or ['tr', 'TR', 'tr-TR']
      },
    },
  },
});
```
