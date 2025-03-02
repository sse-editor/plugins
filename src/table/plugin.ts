import Table from "./table";
import * as $ from "./utils/dom";
import {
  IconTable,
  IconTableWithHeadings,
  IconTableWithoutHeadings,
  IconStretch,
  IconCollapse,
} from "@sse-editor/icons";
import type {
  API,
  ToolConfig,
  PasteEvent,
  HTMLPasteEventDetail,
} from "@sse-editor/types";

/**
 * TableData - configuration that the user can set for the table
 */
interface TableData {
  withHeadings: boolean;
  stretched: boolean;
  content: string[][];
}

/**
 * TableConstructor
 */
interface TableConstructor {
  data: TableData;
  config: ToolConfig;
  api: API;
  readOnly: boolean;
  block: any; // Adjust this type based on your block structure
}

interface GetConfig {
  configName: "withHeadings" | "stretched" | "content";
  defaultValue: boolean;
  savedData: TableData;
}

/**
 * Table block for Editor.js
 */
export default class TableBlock {
  private api: API;
  private readOnly: boolean;
  private config: ToolConfig;
  private data: TableData;
  private table: Table | null;
  private block: any; // Adjust this type based on your block structure
  private container: HTMLDivElement | null = null;

  constructor({ data, config, api, readOnly, block }: TableConstructor) {
    this.api = api;
    this.readOnly = readOnly;
    this.config = config;
    this.data = {
      //   withHeadings: this.getConfig("withHeadings", false, data),
      //   stretched: this.getConfig("stretched", false, data),
      withHeadings: this.getConfig({
        configName: "withHeadings",
        defaultValue: false,
        savedData: data,
      }),
      stretched: this.getConfig({
        configName: "stretched",
        defaultValue: false,
        savedData: data,
      }),
      content: data?.content || [],
    };
    this.table = null;
    this.block = block;
  }

  static get isReadOnlySupported(): boolean {
    return true;
  }

  static get enableLineBreaks(): boolean {
    return true;
  }

  static get toolbox() {
    return {
      icon: IconTable,
      title: "Table",
    };
  }

  render(): HTMLDivElement {
    this.table = new Table({
      readOnly: this.readOnly,
      api: this.api,
      data: this.data,
      config: this.config,
    });
    this.container = $.make("div", this.api.styles.block) as HTMLDivElement;
    this.container.appendChild(this.table.getWrapper());
    this.table.setHeadingsSetting(this.data.withHeadings);
    return this.container;
  }

  renderSettings() {
    return [
      {
        label: this.api.i18n.t("With headings"),
        icon: IconTableWithHeadings,
        isActive: this.data.withHeadings,
        closeOnActivate: true,
        toggle: true,
        onActivate: () => {
          this.data.withHeadings = true;
          this.table?.setHeadingsSetting(this.data.withHeadings);
        },
      },
      {
        label: this.api.i18n.t("Without headings"),
        icon: IconTableWithoutHeadings,
        isActive: !this.data.withHeadings,
        closeOnActivate: true,
        toggle: true,
        onActivate: () => {
          this.data.withHeadings = false;
          this.table?.setHeadingsSetting(this.data.withHeadings);
        },
      },
      {
        label: this.data.stretched
          ? this.api.i18n.t("Collapse")
          : this.api.i18n.t("Stretch"),
        icon: this.data.stretched ? IconCollapse : IconStretch,
        closeOnActivate: true,
        toggle: true,
        onActivate: () => {
          this.data.stretched = !this.data.stretched;
          this.block.stretched = this.data.stretched;
        },
      },
    ];
  }

  save(): TableData {
    const tableContent = this.table?.getData() || [];
    return {
      withHeadings: this.data.withHeadings,
      stretched: this.data.stretched,
      content: tableContent,
    };
  }

  destroy(): void {
    this.table?.destroy();
  }

  private getConfig(config: GetConfig): any {
    const data = this.data || config.savedData;
    if (data) {
      return data[config.configName] !== undefined
        ? data[config.configName]
        : config.defaultValue;
    }
    return this.config[config.configName] !== undefined
      ? this.config[config.configName]
      : config.defaultValue;
  }

  static get pasteConfig() {
    return { tags: ["TABLE", "TR", "TH", "TD"] };
  }

  onPaste(event: PasteEvent): void {
    const table = (event.detail as HTMLPasteEventDetail).data;
    const firstRowHeading = table.querySelector(
      ":scope > thead, tr:first-of-type th"
    );
    const rows = Array.from(table.querySelectorAll("tr"));
    const content = rows.map((row) => {
      const cells = Array.from(row.querySelectorAll("th, td"));
      return cells.map((cell) => cell.innerHTML);
    });

    this.data = {
      withHeadings: firstRowHeading !== null,
      content,
      stretched: false,
    };

    if (this.table?.wrapper) {
      this.table.wrapper.replaceWith(this.render());
    }
  }
}
