import * as _ from "../utils";
import Swal from "sweetalert2";
import { IconColumn } from "@sse-editor/icons";
import "./index.css";
import {
  API,
  BlockTool,
  BlockToolConstructorOptions,
  BlockToolData,
  OutputData,
  ToolConfig,
} from "@sse-editor/types";

interface ColumnData extends BlockToolData {
  cols: OutputData[];
}

export default class Columns implements BlockTool {
  private api: API;
  private readOnly: boolean;
  private config: ToolConfig;
  private _CSS: { block: string; wrapper: string };
  private editors: { cols: any[]; numberOfColumns: number };
  private colWrapper: HTMLElement | undefined;
  private data: ColumnData;

  constructor({
    data,
    config,
    api,
    readOnly,
  }: BlockToolConstructorOptions<ColumnData>) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config || {};

    this._CSS = {
      block: this.api.styles.block,
      wrapper: "ce-EditorJsColumns",
    };

    if (!this.readOnly) {
      this.onKeyUp = this.onKeyUp.bind(this);
    }

    this.editors = { cols: [], numberOfColumns: 0 };
    this.colWrapper = undefined;
    this.data = data;

    if (!Array.isArray(this.data.cols)) {
      this.data.cols = [];
      this.editors.numberOfColumns = 2;
    } else {
      this.editors.numberOfColumns = this.data.cols.length;
    }
  }

  static get enableLineBreaks(): boolean {
    return true;
  }

  static get isReadOnlySupported() {
    return true;
  }

  onKeyUp(e: KeyboardEvent) {
    if (e.code !== "Backspace" && e.code !== "Delete") {
      return;
    }
  }

  get CSS() {
    return {
      settingsButton: this.api.styles.settingsButton,
      settingsButtonActive: this.api.styles.settingsButtonActive,
    };
  }

  renderSettings() {
    return [
      {
        icon: "2",
        label: this.api.i18n.t("2 Columns"),
        onActivate: () => {
          this._updateCols(2);
        },
      },
      {
        icon: "3",
        label: this.api.i18n.t("3 Columns"),
        onActivate: () => {
          this._updateCols(3);
        },
      },
      {
        icon: "R",
        label: this.api.i18n.t("Roll Columns"),
        onActivate: () => {
          this._rollColumns();
        },
      },
    ];
  }

  _rollColumns() {
    this.data.cols.unshift(this.data.cols.pop()!);
    this.editors.cols.unshift(this.editors.cols.pop()!);
    this._rerender();
  }

  async _updateCols(num: number) {
    if (num === 2) {
      if (this.editors.numberOfColumns === 3) {
        const resp = await Swal.fire({
          title: this.api.i18n.t("Are you sure?"),
          text: this.api.i18n.t("This will delete Column 3!"),
          icon: "warning",
          showCancelButton: true,
          cancelButtonText: this.api.i18n.t("Cancel"),
          confirmButtonColor: "#3085d6",
          cancelButtonColor: "#d33",
          confirmButtonText: this.api.i18n.t("Yes, delete it!"),
        });

        if (resp.isConfirmed) {
          this.editors.numberOfColumns = 2;
          this.data.cols.pop();
          this.editors.cols.pop();
          this._rerender();
        }
      }
    }
    if (num === 3) {
      this.editors.numberOfColumns = 3;
      this._rerender();
    }
  }

  async _rerender() {
    await this.save();

    for (let index = 0; index < this.editors.cols.length; index++) {
      this.editors.cols[index].destroy();
    }
    this.editors.cols = [];
    this.colWrapper!.innerHTML = "";

    for (let index = 0; index < this.editors.numberOfColumns; index++) {
      const col = document.createElement("div");
      col.classList.add("ce-editorjsColumns_col");
      col.classList.add("editorjs_col_" + index);

      const editor_col_id = _.generateBlockId("column");
      col.id = editor_col_id;

      this.colWrapper!.appendChild(col);

      const editorjs_instance = new this.config.EditorJsLibrary({
        defaultBlock: "paragraph",
        holder: editor_col_id,
        tools: this.config.tools,
        data: this.data.cols[index]?.blocks || [], // Ensure we pass the correct data structure
        readOnly: this.readOnly,
        minHeight: 50,
      });

      this.editors.cols.push(editorjs_instance);
    }
  }

  render() {
    this.colWrapper = document.createElement("div");
    this.colWrapper.classList.add("ce-editorjsColumns_wrapper");

    this.colWrapper.addEventListener(
      "paste",
      (event) => {
        event.stopPropagation();
      },
      true
    );

    this.colWrapper.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
      if (event.key === "Tab") {
        event.preventDefault();
        event.stopImmediatePropagation();
        event.stopPropagation();
      }
    });

    for (let index = 0; index < this.editors.cols.length; index++) {
      this.editors.cols[index].destroy();
    }
    this.editors.cols = [];

    for (let index = 0; index < this.editors.numberOfColumns; index++) {
      const col = document.createElement("div");
      col.classList.add("ce-editorjsColumns_col");
      col.classList.add("editorjs_col_" + index);

      const editor_col_id = _.generateBlockId("column");
      col.id = editor_col_id;

      this.colWrapper.appendChild(col);

      const editorjs_instance = new this.config.EditorJsLibrary({
        defaultBlock: "paragraph",
        holder: editor_col_id,
        tools: this.config.tools,
        data: this.data.cols[index]?.blocks || [], // Ensure we pass the correct data structure
        readOnly: this.readOnly,
        minHeight: 50,
      });

      this.editors.cols.push(editorjs_instance);
    }
    return this.colWrapper;
  }

  async save(): Promise<ColumnData> {
    if (!this.readOnly) {
      const currentTime = Date.now();
      for (let index = 0; index < this.editors.cols.length; index++) {
        const colData = await this.editors.cols[index].save();
        this.data.cols[index] = {
          time: currentTime,
          blocks: colData.blocks,
          version: colData.version || "2.24.3", // Default version if not provided
        };
      }
    }
    return this.data;
  }

  static get toolbox() {
    return {
      icon: IconColumn,
      title: "Columns",
    };
  }
}
