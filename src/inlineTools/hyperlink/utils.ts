import React from "react";

export default class SelectionUtils {
  selection: Selection | null;
  savedSelectionRange: Range | null;
  isFakeBackgroundEnabled: boolean;
  commandBackground: string;
  commandRemoveFormat: string;

  constructor() {
    this.selection = null;
    this.savedSelectionRange = null;
    this.isFakeBackgroundEnabled = false;
    this.commandBackground = "backColor";
    this.commandRemoveFormat = "removeFormat";
  }

  private isElement(node: Node | null): node is Element {
    return node !== null && node.nodeType === Node.ELEMENT_NODE;
  }

  private isContentEditable(element: HTMLElement): boolean {
    return element.contentEditable === "true";
  }

  private isNativeInput(target: HTMLElement | null): boolean {
    const nativeInputs = ["INPUT", "TEXTAREA"];
    return target !== null && target.tagName
      ? nativeInputs.includes(target.tagName)
      : false;
  }

  private canSetCaret(target: HTMLElement): boolean {
    let result = true;
    if (this.isNativeInput(target)) {
      switch ((target as HTMLInputElement).type) {
        case "file":
        case "checkbox":
        case "radio":
        case "hidden":
        case "submit":
        case "button":
        case "image":
        case "reset":
          result = false;
          break;
        default:
      }
    } else {
      result = this.isContentEditable(target);
    }

    return result;
  }

  public static CSS() {
    return {
      editorWrapper: "codex-editor",
      editorZone: "codex-editor__redactor",
    };
  }

  public anchorNode(): Node | null {
    const selection = window.getSelection();
    return selection ? selection.anchorNode : null;
  }

  public anchorElement(): Element | null {
    const selection = window.getSelection();

    if (!selection) {
      return null;
    }

    const anchorNode = selection.anchorNode;

    if (!anchorNode) {
      return null;
    }

    if (!this.isElement(anchorNode)) {
      return anchorNode.parentElement;
    } else {
      return anchorNode;
    }
  }

  public anchorOffset(): number | null {
    const selection = window.getSelection();
    return selection ? selection.anchorOffset : null;
  }

  public isCollapsed(): boolean | null {
    const selection = window.getSelection();
    return selection ? selection.isCollapsed : null;
  }

  public isAtEditor(): boolean {
    const selection = this.get();
    let selectedNode = selection?.anchorNode || selection?.focusNode;

    if (selectedNode && selectedNode.nodeType === Node.TEXT_NODE) {
      selectedNode = selectedNode.parentNode;
    }

    let editorZone: Element | null = null;

    if (selectedNode) {
      editorZone = (selectedNode as Element).closest(
        `.${SelectionUtils.CSS().editorZone}`
      );
    }
    return editorZone !== null && editorZone.nodeType === Node.ELEMENT_NODE;
  }

  public isSelectionExists(): boolean {
    const selection = this.get();
    return !!selection?.anchorNode;
  }

  public static get range(): Range | null {
    const selection = window.getSelection();
    return selection && selection.rangeCount ? selection.getRangeAt(0) : null;
  }

  public static get rect(): DOMRect {
    // @ts-expect-error
    let sel = document.selection,
      range;

    let rect: DOMRect = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
    } as DOMRect;

    if (sel && sel.type !== "Control") {
      range = sel.createRange();
      rect.x = range.boundingLeft;
      rect.y = range.boundingTop;
      rect.width = range.boundingWidth;
      rect.height = range.boundingHeight;
      return rect;
    }

    if (!window.getSelection) {
      return rect;
    }

    sel = window.getSelection();

    if (sel.rangeCount === null || isNaN(sel.rangeCount)) {
      return rect;
    }

    if (sel.rangeCount === 0) {
      return rect;
    }

    range = sel.getRangeAt(0).cloneRange();

    if (range.getBoundingClientRect) {
      rect = range.getBoundingClientRect();
    }

    if (rect.x === 0 && rect.y === 0) {
      const span = document.createElement("span");

      if (span.getBoundingClientRect) {
        span.appendChild(document.createTextNode("\u200b"));
        range.insertNode(span);
        rect = span.getBoundingClientRect();
        const spanParent = span.parentNode;
        spanParent?.removeChild(span);
        spanParent?.normalize();
      }
    }

    return rect;
  }

  public static get text(): string {
    const selection = window.getSelection();
    return selection ? selection.toString() : "";
  }

  public get(): Selection | null {
    return window.getSelection();
  }

  public setCursor(
    element: HTMLElement,
    offset: number = 0
  ): DOMRect | undefined {
    const range = document.createRange();
    const selection = window.getSelection();

    if (this.isNativeInput(element)) {
      if (!this.canSetCaret(element)) {
        return;
      }

      element.focus();
      (element as HTMLInputElement).selectionStart = (
        element as HTMLInputElement
      ).selectionEnd = offset;
      return element.getBoundingClientRect();
    }

    range.setStart(element, offset);
    range.setEnd(element, offset);

    selection?.removeAllRanges();
    selection?.addRange(range);

    return range.getBoundingClientRect();
  }

  public removeFakeBackground(): void {
    if (!this.isFakeBackgroundEnabled) {
      return;
    }
    this.isFakeBackgroundEnabled = false;
    document.execCommand(this.commandRemoveFormat);
  }

  public setFakeBackground(): void {
    document.execCommand(this.commandBackground, false, "#a8d6ff");
    this.isFakeBackgroundEnabled = true;
  }

  public save(): void {
    this.savedSelectionRange = SelectionUtils.range;
  }

  public restore(): void {
    if (!this.savedSelectionRange) {
      return;
    }
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(this.savedSelectionRange);
  }

  public clearSaved(): void {
    this.savedSelectionRange = null;
  }

  public collapseToEnd(): void {
    const sel = window.getSelection();
    const range = document.createRange();
    if (sel?.focusNode) {
      range.selectNodeContents(sel.focusNode);
    }
    range.collapse(false);
    sel?.removeAllRanges();
    sel?.addRange(range);
  }

  public findParentTag(
    tagName: string,
    className: string | null = null,
    searchDepth: number = 10
  ): Element | null {
    const selection = window.getSelection();
    let parentTag: Element | null = null;
    if (!selection || !selection.anchorNode || !selection.focusNode) {
      return null;
    }
    const boundNodes = [selection.anchorNode, selection.focusNode];

    boundNodes.forEach((parent) => {
      let searchDepthIterable = searchDepth;
      while (searchDepthIterable > 0 && parent.parentNode) {
        if ((parent as Element).tagName === tagName) {
          parentTag = parent as Element;
          if (
            className &&
            (parent as Element).classList &&
            !(parent as Element).classList.contains(className)
          ) {
            parentTag = null;
          }
          if (parentTag) {
            break;
          }
        }
        parent = parent.parentNode;
        searchDepthIterable--;
      }
    });
    return parentTag;
  }

  public expandToTag(element: Element): void {
    const selection = window.getSelection();
    selection?.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(element);
    selection?.addRange(range);
  }
}
