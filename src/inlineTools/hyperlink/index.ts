import SelectionUtils from "./utils";
import "./index.css";
import type {
  InlineTool,
  InlineToolConstructorOptions,
  ToolConfig,
} from "@sse-editor/types";
import type {
  I18n,
  InlineToolbar,
  Toolbar,
  Tooltip,
} from "@sse-editor/types/api";

interface HyperlinkCSS {
  wrapper: string;
  wrapperShowed: string;
  button: string;
  buttonActive: string;
  buttonModifier: string;
  buttonUnlink: string;
  input: string;
  selectTarget: string;
  selectRel: string;
  buttonSave: string;
}

type TargetAttributes = "_blank" | "_self" | "_parent" | "_top";
type RelAttributes =
  | "alternate"
  | "author"
  | "bookmark"
  | "external"
  | "help"
  | "license"
  | "next"
  | "nofollow"
  | "noreferrer"
  | "noopener"
  | "prev"
  | "search"
  | "tag";

interface HyperlinkNodes {
  button: HTMLButtonElement | null;
  wrapper: HTMLElement | null;
  input: HTMLInputElement | null;
  selectTarget: HTMLSelectElement | null;
  selectRel: HTMLSelectElement | null;
  buttonSave: HTMLButtonElement | null;
}

export default class Hyperlink implements InlineTool {
  private toolbar: Toolbar;
  private inlineToolbar: InlineToolbar;
  private tooltip: Tooltip;
  private i18n: I18n;
  private config: ToolConfig;
  private selection: SelectionUtils;
  private commandLink: string;
  private commandUnlink: string;
  private CSS: HyperlinkCSS;
  private inputOpened: boolean;
  private targetAttributes: TargetAttributes[];
  private relAttributes: RelAttributes[];
  private nodes: HyperlinkNodes;

  constructor({ config, api }: InlineToolConstructorOptions) {
    this.toolbar = api.toolbar;
    this.inlineToolbar = api.inlineToolbar;
    this.tooltip = api.tooltip;
    this.i18n = api.i18n;
    this.config = config;
    this.selection = new SelectionUtils();

    this.commandLink = "createLink";
    this.commandUnlink = "unlink";

    this.CSS = {
      wrapper: "ce-inline-tool-hyperlink-wrapper",
      wrapperShowed: "ce-inline-tool-hyperlink-wrapper--showed",
      button: "ce-inline-tool",
      buttonActive: "ce-inline-tool--active",
      buttonModifier: "ce-inline-tool--link",
      buttonUnlink: "ce-inline-tool--unlink",
      input: "ce-inline-tool-hyperlink--input",
      selectTarget: "ce-inline-tool-hyperlink--select-target",
      selectRel: "ce-inline-tool-hyperlink--select-rel",
      buttonSave: "ce-inline-tool-hyperlink--button",
    };

    this.targetAttributes = this.config.availableTargets || [
      "_blank",
      "_self",
      "_parent",
      "_top",
    ];

    this.relAttributes = this.config.availableRels || [
      "alternate",
      "author",
      "bookmark",
      "external",
      "help",
      "license",
      "next",
      "nofollow",
      "noreferrer",
      "noopener",
      "prev",
      "search",
      "tag",
    ];

    this.nodes = {
      button: null,
      wrapper: null,
      input: null,
      selectTarget: null,
      selectRel: null,
      buttonSave: null,
    };

    this.inputOpened = false;
  }

  render() {
    this.nodes.button = document.createElement("button");
    this.nodes.button.type = "button";
    this.nodes.button.classList.add(this.CSS.button, this.CSS.buttonModifier);
    this.nodes.button.appendChild(this.iconSvg("link", 14, 10));
    this.nodes.button.appendChild(this.iconSvg("unlink", 15, 11));
    return this.nodes.button;
  }

  renderActions() {
    this.nodes.wrapper = document.createElement("div");
    this.nodes.wrapper.classList.add(this.CSS.wrapper);

    // Input
    this.nodes.input = document.createElement("input");
    this.nodes.input.placeholder = "https://...";
    this.nodes.input.classList.add(this.CSS.input);

    let i;

    // Target
    this.nodes.selectTarget = document.createElement("select");
    this.nodes.selectTarget.classList.add(this.CSS.selectTarget);
    this.addOption(this.nodes.selectTarget, this.i18n.t("Select target"), "");
    for (i = 0; i < this.targetAttributes.length; i++) {
      this.addOption(
        this.nodes.selectTarget,
        this.targetAttributes[i],
        this.targetAttributes[i]
      );
    }

    if (!!this.config.target) {
      if (this.targetAttributes.length === 0) {
        this.addOption(
          this.nodes.selectTarget,
          this.config.target,
          this.config.target
        );
      }

      this.nodes.selectTarget.value = this.config.target;
    }

    // Rel
    this.nodes.selectRel = document.createElement("select");
    this.nodes.selectRel.classList.add(this.CSS.selectRel);
    this.addOption(this.nodes.selectRel, this.i18n.t("Select rel"), "");
    for (i = 0; i < this.relAttributes.length; i++) {
      this.addOption(
        this.nodes.selectRel,
        this.relAttributes[i],
        this.relAttributes[i]
      );
    }

    if (!!this.config.rel) {
      if (this.relAttributes.length === 0) {
        this.addOption(
          this.nodes.selectTarget,
          this.config.rel,
          this.config.rel
        );
      }

      this.nodes.selectRel.value = this.config.rel;
    }

    // Button
    this.nodes.buttonSave = document.createElement("button");
    this.nodes.buttonSave.type = "button";
    this.nodes.buttonSave.classList.add(this.CSS.buttonSave);
    this.nodes.buttonSave.innerHTML = this.i18n.t("Save");
    this.nodes.buttonSave.addEventListener("click", (event) => {
      this.savePressed(event);
    });

    // append
    this.nodes.wrapper.appendChild(this.nodes.input);

    if (!!this.targetAttributes && this.targetAttributes.length > 0) {
      this.nodes.wrapper.appendChild(this.nodes.selectTarget);
    }

    if (!!this.relAttributes && this.relAttributes.length > 0) {
      this.nodes.wrapper.appendChild(this.nodes.selectRel);
    }

    this.nodes.wrapper.appendChild(this.nodes.buttonSave);

    return this.nodes.wrapper;
  }

  surround(range: Range) {
    if (range) {
      if (!this.inputOpened) {
        this.selection.setFakeBackground();
        this.selection.save();
      } else {
        this.selection.restore();
        this.selection.removeFakeBackground();
      }
      const parentAnchor = this.selection.findParentTag("A");
      if (parentAnchor) {
        this.selection.expandToTag(parentAnchor);
        this.unlink();
        this.closeActions();
        this.checkState();
        this.toolbar.close();
        return;
      }
    }
    this.toggleActions();
  }

  get shortcut() {
    return this.config.shortcut || "CMD+L";
  }

  get title() {
    return "Hyperlink";
  }

  static get isInline() {
    return true;
  }

  static get sanitize() {
    return {
      a: {
        href: true,
        target: true,
        rel: true,
      },
    };
  }

  checkState() {
    const anchorTag = this.selection.findParentTag("A");
    if (anchorTag) {
      this.nodes.button?.classList.add(this.CSS.buttonUnlink);
      this.nodes.button?.classList.add(this.CSS.buttonActive);
      this.openActions();
      const hrefAttr = anchorTag.getAttribute("href");
      const targetAttr = anchorTag.getAttribute("target");
      const relAttr = anchorTag.getAttribute("rel");
      this.nodes.input!.value = !!hrefAttr ? hrefAttr : "";
      this.nodes.selectTarget!.value = !!targetAttr ? targetAttr : "";
      this.nodes.selectRel!.value = !!relAttr ? relAttr : "";
      this.selection.save();
    } else {
      this.nodes.button?.classList.remove(this.CSS.buttonUnlink);
      this.nodes.button?.classList.remove(this.CSS.buttonActive);
    }
    return !!anchorTag;
  }

  clear() {
    this.closeActions();
  }

  toggleActions() {
    if (!this.inputOpened) {
      this.openActions(true);
    } else {
      this.closeActions(false);
    }
  }

  openActions(needFocus: boolean = false) {
    this.nodes.wrapper?.classList.add(this.CSS.wrapperShowed);
    if (needFocus) {
      this.nodes.input?.focus();
    }
    this.inputOpened = true;
  }

  closeActions(clearSavedSelection = true) {
    if (this.selection.isFakeBackgroundEnabled) {
      const currentSelection = new SelectionUtils();
      currentSelection.save();
      this.selection.restore();
      this.selection.removeFakeBackground();
      currentSelection.restore();
    }
    this.nodes.wrapper?.classList.remove(this.CSS.wrapperShowed);
    this.nodes.input!.value = "";
    this.nodes.selectTarget!.value = "";
    this.nodes.selectRel!.value = "";

    if (clearSavedSelection) {
      this.selection.clearSaved();
    }
    this.inputOpened = false;
  }

  savePressed(event: Event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    let value = this.nodes.input?.value || "";
    let target = this.nodes.selectTarget?.value || "";
    let rel = this.nodes.selectRel?.value || "";

    if (!value.trim()) {
      this.selection.restore();
      this.unlink();
      event.preventDefault();
      this.closeActions();
    }

    if (
      !!this.config.validate &&
      !!this.config.validate === true &&
      !this.validateURL(value)
    ) {
      this.tooltip.show(this.nodes.input!, "The URL is not valid.", {
        placement: "top",
      });
      setTimeout(() => {
        this.tooltip.hide();
      }, 1000);
      return;
    }

    value = this.prepareLink(value);

    this.selection.restore();
    this.selection.removeFakeBackground();

    this.insertLink(value, target, rel);

    this.selection.collapseToEnd();
    this.inlineToolbar.close();
  }

  validateURL(str: string): boolean {
    const pattern = new RegExp(
      "^(https?:\\/\\/)?" + // protocol
        "((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|" + // domain name
        "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
        "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*" + // port and path
        "(\\?[;&a-z\\d%_.~+=-]*)?" + // query string
        "(\\#[-a-z\\d_]*)?$",
      "i"
    ); // fragment locator
    return !!pattern.test(str);
  }

  prepareLink(link: string): string {
    link = link.trim();
    link = this.addProtocol(link);
    return link;
  }

  addProtocol(link: string): string {
    if (/^(\w+):(\/\/)?/.test(link)) {
      return link;
    }

    const isInternal = /^\/[^/\s]?/.test(link),
      isAnchor = link.substring(0, 1) === "#",
      isProtocolRelative = /^\/\/[^/\s]/.test(link);

    if (!isInternal && !isAnchor && !isProtocolRelative) {
      link = "http://" + link;
    }

    return link;
  }

  insertLink(link: string, target: string = "", rel: string = ""): void {
    let anchorTag = this.selection.findParentTag("A") as HTMLAnchorElement;
    if (anchorTag) {
      this.selection.expandToTag(anchorTag);
    } else {
      document.execCommand(this.commandLink, false, link);
      anchorTag = this.selection.findParentTag("A") as HTMLAnchorElement;
    }
    if (anchorTag) {
      if (!!target) {
        anchorTag["target"] = target;
      } else {
        anchorTag.removeAttribute("target");
      }
      if (!!rel) {
        anchorTag["rel"] = rel;
      } else {
        anchorTag.removeAttribute("rel");
      }
    }
  }

  unlink() {
    document.execCommand(this.commandUnlink);
  }

  iconSvg(
    name: string,
    width: number = 14,
    height: number = 14
  ): SVGSVGElement {
    const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    icon.classList.add("icon", "icon--" + name);
    icon.setAttribute("width", width + "px");
    icon.setAttribute("height", height + "px");
    icon.innerHTML = `<use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#${name}"></use>`;
    return icon;
  }

  addOption(element: HTMLSelectElement, text: string, value: string = "") {
    let option = document.createElement("option");
    option.text = text;
    option.value = value;
    element.add(option);
  }
}
