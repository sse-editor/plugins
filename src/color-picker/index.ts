import type { API } from "@sse-editor/types";
import { InlineTool } from "@sse-editor/types";
import { IconColor } from "@sse-editor/icons";

import "./style.css";

type ColorPickerConfig = {
  colors: string[];
  columns: number;
};

interface ConstructorArgs { api: API; config: ColorPickerConfig; }

// export default class ColorPicker extends InlineTool {}