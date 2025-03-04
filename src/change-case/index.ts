import type { API } from "@sse-editor/types";
import "./index.css";
import * as states from "./utils";
import { IconChangeCase } from "@sse-editor/icons";

interface ConfigParams {
  locale: string;
  showLocaleOption: boolean;
}

interface ChangeCaseParams {
  api: API;
  config: ConfigParams;
}

interface ChangeCaseCSS {
  actions: string;
  toolbarLabel: string;
  tool: string;
  toolbarBtnActive: string;
  inlineButton: string;
}

interface ChangeCaseOptions {
  titleCase?: string;
  lowerCase?: string;
  upperCase?: string;
  localeLowerCase?: string;
  localeUpperCase?: string;
  sentenceCase?: string;
  toggleCase?: string;
}

type ChangeCaseType =
  | "titleCase"
  | "lowerCase"
  | "upperCase"
  | "localeLowerCase"
  | "localeUpperCase"
  | "sentenceCase"
  | "toggleCase";

export default class ChangeCase {
  private _state: boolean;
  private button: HTMLButtonElement | null;
  private optionButtons: HTMLElement[];
  private api: API;
  private selectedText: DocumentFragment | null;
  private range: Range | null;
  private caseOptions: ChangeCaseOptions;
  private _CSS: ChangeCaseCSS;
  private _settings: ConfigParams;
  private actions: HTMLDivElement;

  constructor({ config, api }: ChangeCaseParams) {
    this.api = api;
    this.button = null;
    this.optionButtons = [];
    this._state = true;
    this.selectedText = null;
    this.range = null;
    this._settings = config;
    this.actions = document.createElement("div") as HTMLDivElement;

    this._CSS = {
      actions: "change-case-action",
      toolbarLabel: "change-case-toolbar__label",
      tool: "change-case-tool",
      toolbarBtnActive: this.api.styles.settingsButtonActive,
      inlineButton: this.api.styles.inlineToolButton,
    };

    this.caseOptions = {
      titleCase: "Title Case",
      lowerCase: "lower case",
      upperCase: "UPPER CASE",
      localeLowerCase: "localé lower casé",
      localeUpperCase: "LöCALE UPPER CASE",
      sentenceCase: "Sentence case",
      toggleCase: "tOGGLE cASE",
    };
  }

  get state(): boolean {
    return this._state;
  }

  set state(state: boolean) {
    this._state = state;
    this.button?.classList.toggle(this._CSS.toolbarBtnActive, state);
  }

  static get inInline(): boolean {
    return true;
  }

  get title(): string {
    return "Change Case";
  }

  render(): HTMLButtonElement {
    this.button = document.createElement("button") as HTMLButtonElement;
    this.button.type = "button";
    this.button.innerHTML = IconChangeCase;
    this.button.classList.add(this._CSS.inlineButton);
    return this.button as HTMLButtonElement;
  }

  checkState(selection: Selection): void {
    const text = selection.anchorNode;
    if (!text) return;
  }

  convertCase(range: Range, option: ChangeCaseType): void {
    if (!range) return;
    const clone = range.cloneContents();
    if (!clone) return;

    clone.childNodes.forEach((node) => {
      if (node.nodeName !== "#text") return;

      switch (option) {
        case "titleCase":
          node.textContent = states.titleCase(node.textContent || "");
          break;

        case "lowerCase":
          node.textContent = states.lowerCase(node.textContent || "");
          break;

        case "upperCase":
          node.textContent = states.upperCase(node.textContent || "");
          break;

        case "localeLowerCase":
          node.textContent = states.localeLowerCase(
            node.textContent || "",
            this._settings.locale
          );
          break;

        case "localeUpperCase":
          node.textContent = states.localeUpperCase(
            node.textContent || "",
            this._settings.locale
          );
          break;

        case "sentenceCase":
          node.textContent = states.sentenceCase(node.textContent || "");
          break;

        case "toggleCase":
          node.textContent = states.toggleCase(node.textContent || "");
          break;

        default:
          break;
      }
    });

    range.extractContents();
    range.insertNode(clone);
    this.api.inlineToolbar.close();
  }

  surround(range: Range): void {
    this.selectedText = range.cloneContents();
    this.actions.hidden = !this.actions.hidden;
    this.range = !this.actions.hidden ? range : null;
    this.state = !this.actions.hidden;
  }

  renderActions(): HTMLDivElement {
    this.actions = document.createElement("div");
    this.actions.classList.add(this._CSS.actions);
    const actionsToolbar = document.createElement("div");
    actionsToolbar.classList.add(this._CSS.toolbarLabel);
    actionsToolbar.innerHTML = "Change Case";
    this.actions.appendChild(actionsToolbar);

    if (!this._settings.showLocaleOption) {
      delete this.caseOptions.localeLowerCase;
      delete this.caseOptions.localeUpperCase;
    }

    this.optionButtons = Object.keys(this.caseOptions).map((option) => {
      const btnOption = document.createElement("div");
      btnOption.classList.add(this._CSS.tool);
      btnOption.dataset.mode = option;
      btnOption.innerHTML = this.caseOptions[option as ChangeCaseType]!;
      return btnOption;
    });

    for (const btnOption of this.optionButtons) {
      this.actions.appendChild(btnOption);
      this.api.listeners.on(btnOption, "click", () => {
        this.convertCase(this.range!, btnOption.dataset.mode as ChangeCaseType);
      });
    }

    this.actions.hidden = true;
    return this.actions;
  }

  destroy() {
    for (const btnOption of this.optionButtons) {
      this.api.listeners.off(btnOption, "click", () => {
        this.convertCase(this.range!, btnOption.dataset.mode as ChangeCaseType);
      });
    }
  }
}
