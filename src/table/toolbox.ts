import Popover from "./utils/popover";
import * as $ from "./utils/dom";
import { IconMenuSmall } from "@sse-editor/icons";
import type { API } from "@sse-editor/types";

/**
 * Represents a single item in the popover.
 */
type AnyFunction = () => void;
export interface PopoverItem {
  label: string; // button text
  icon: string; // button icon
  confirmationRequired?: boolean;
  hideIf?: () => boolean;
  onClick: AnyFunction;
}

interface ToolboxParams {
  api: API;
  items: PopoverItem[];
  onOpen: AnyFunction;
  onClose: AnyFunction;
  cssModifier?: string;
}

/**
 * Toolbox is a menu for manipulation of rows/cols
 *
 * It contains toggler and Popover:
 *   <toolbox>
 *     <toolbox-toggler />
 *     <popover />
 *   <toolbox>
 */
export default class Toolbox {
  private api: API;
  private items: PopoverItem[];
  private onOpen: AnyFunction;
  private onClose: AnyFunction;
  private cssModifier: string;
  private popover: Popover | null;
  private wrapper: HTMLElement;

  /**
   * Creates toolbox buttons and toolbox menus
   *
   * @param {Object} config
   * @param {API} config.api - Editor.js api
   * @param {PopoverItem[]} config.items - Editor.js api
   * @param {function} config.onOpen - callback fired when the Popover is opening
   * @param {function} config.onClose - callback fired when the Popover is closing
   * @param {string} config.cssModifier - the modifier for the Toolbox. Allows to add some specific styles.
   */
  constructor(config: ToolboxParams) {
    this.api = config.api;
    this.items = config.items;
    this.onOpen = config.onOpen;
    this.onClose = config.onClose;
    this.cssModifier = config.cssModifier || "";

    this.popover = null;
    this.wrapper = this.createToolbox();
  }

  /**
   * Style classes
   */
  static get CSS() {
    return {
      toolbox: "tc-toolbox",
      toolboxShowed: "tc-toolbox--showed",
      toggler: "tc-toolbox__toggler",
    };
  }

  /**
   * Returns rendered Toolbox element
   */
  get element(): HTMLElement {
    return this.wrapper;
  }

  /**
   * Creating a toolbox to open menu for manipulating columns
   *
   * @returns {HTMLElement}
   */
  private createToolbox(): HTMLElement {
    const wrapper = $.make("div", [
      Toolbox.CSS.toolbox,
      this.cssModifier ? `${Toolbox.CSS.toolbox}--${this.cssModifier}` : "",
    ]);

    wrapper.dataset.mutationFree = "true";
    const popover = this.createPopover();
    const toggler = this.createToggler();

    wrapper.appendChild(toggler);
    wrapper.appendChild(popover);

    return wrapper;
  }

  /**
   * Creates the Toggler
   *
   * @returns {HTMLElement}
   */
  private createToggler(): HTMLElement {
    const toggler = $.make("div", Toolbox.CSS.toggler, {
      innerHTML: IconMenuSmall,
    });

    toggler.addEventListener("click", () => {
      this.togglerClicked();
    });

    return toggler;
  }

  /**
   * Creates the Popover instance and render it
   *
   * @returns {HTMLElement}
   */
  private createPopover(): HTMLElement {
    this.popover = new Popover({
      items: this.items,
    });

    return this.popover.render();
  }

  /**
   * Toggler click handler. Opens/Closes the popover
   *
   * @returns {void}
   */
  private togglerClicked(): void {
    if (this.popover?.opened) {
      this.popover.close();
      this.onClose();
    } else {
      this.popover?.open();
      this.onOpen();
    }
  }

  /**
   * Shows the Toolbox
   *
   * @param {function} computePositionMethod - method that returns the position coordinate
   * @returns {void}
   */
  show(computePositionMethod: () => { top: string; left: string }): void {
    const position = computePositionMethod();

    /**
     * * Set 'top' or 'left' style
     */
    Object.entries(position).forEach(([prop, value]) => {
      // @ts-expect-error
      this.wrapper.style[prop] = value;
    });

    this.wrapper.classList.add(Toolbox.CSS.toolboxShowed);
  }

  /**
   * Hides the Toolbox
   *
   * @returns {void}
   */
  hide(): void {
    this.popover?.close();
    this.wrapper.classList.remove(Toolbox.CSS.toolboxShowed);
  }
}
