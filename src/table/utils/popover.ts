import * as $ from "./dom";

/**
 * Represents a single item in the popover.
 */
export interface PopoverItem {
  label: string;
  icon: string;
  confirmationRequired?: boolean;
  hideIf?: () => boolean;
  onClick: () => void;
}

/**
 * This class provides a popover rendering.
 */
export default class Popover {
  private items: PopoverItem[];
  private wrapper?: HTMLElement;
  private itemEls: HTMLElement[];

  /**
   * @param {object} options - constructor options
   * @param {PopoverItem[]} options.items - constructor options
   */
  constructor({ items }: { items: PopoverItem[] }) {
    this.items = items;
    this.wrapper = undefined;
    this.itemEls = [];
  }

  /**
   * Set of CSS classnames used in popover
   *
   * @returns {object}
   */
  static get CSS() {
    return {
      popover: "tc-popover",
      popoverOpened: "tc-popover--opened",
      item: "tc-popover__item",
      itemHidden: "tc-popover__item--hidden",
      itemConfirmState: "tc-popover__item--confirm",
      itemIcon: "tc-popover__item-icon",
      itemLabel: "tc-popover__item-label",
    };
  }

  /**
   * Returns the popover element
   *
   * @returns {HTMLElement}
   */
  render(): HTMLElement {
    this.wrapper = $.make("div", Popover.CSS.popover);

    this.items.forEach((item, index) => {
      const itemEl = $.make("div", Popover.CSS.item);
      const icon = $.make("div", Popover.CSS.itemIcon, {
        innerHTML: item.icon,
      });
      const label = $.make("div", Popover.CSS.itemLabel, {
        textContent: item.label,
      });

      itemEl.dataset.index = index.toString();

      itemEl.appendChild(icon);
      itemEl.appendChild(label);

      this.wrapper?.appendChild(itemEl);
      this.itemEls.push(itemEl);
    });

    /**
     * Delegate click
     */
    this.wrapper.addEventListener("click", (event) => {
      this.popoverClicked(event);
    });

    return this.wrapper;
  }

  /**
   * Popover wrapper click listener
   * Used to delegate clicks in items
   *
   * @returns {void}
   */
  private popoverClicked(event: MouseEvent): void {
    const clickedItem = (event.target as HTMLElement).closest(
      `.${Popover.CSS.item}`
    ) as HTMLElement | null;

    if (!clickedItem) {
      return;
    }

    // const clickedItem = event.target

    /**
     * Clicks outside or between item
     */
    if (!clickedItem) {
      return;
    }

    const clickedItemIndex = clickedItem.dataset.index;
    const item = this.items[Number(clickedItemIndex)];

    if (item.confirmationRequired && !this.hasConfirmationState(clickedItem)) {
      this.setConfirmationState(clickedItem);
      return;
    }

    item.onClick();
  }

  /**
   * Enable the confirmation state on passed item
   *
   * @returns {void}
   */
  private setConfirmationState(itemEl: HTMLElement): void {
    itemEl.classList.add(Popover.CSS.itemConfirmState);
  }

  /**
   * Disable the confirmation state on passed item
   *
   * @returns {void}
   */
  private clearConfirmationState(itemEl: HTMLElement): void {
    itemEl.classList.remove(Popover.CSS.itemConfirmState);
  }

  /**
   * Check if passed item has the confirmation state
   *
   * @returns {boolean}
   */
  private hasConfirmationState(itemEl: HTMLElement): boolean {
    return itemEl.classList.contains(Popover.CSS.itemConfirmState);
  }

  /**
   * Return an opening state
   *
   * @returns {boolean}
   */
  get opened(): boolean {
    return this.wrapper?.classList.contains(Popover.CSS.popoverOpened) || false;
  }

  /**
   * Opens the popover
   *
   * @returns {void}
   */
  open(): void {
    /**
     * If item provides 'hideIf()' method that returns true, hide item
     */
    this.items.forEach((item, index) => {
      if (typeof item.hideIf === "function") {
        this.itemEls[index].classList.toggle(
          Popover.CSS.itemHidden,
          item.hideIf()
        );
      }
    });

    this.wrapper?.classList.add(Popover.CSS.popoverOpened);
  }

  /**
   * Closes the popover
   *
   * @returns {void}
   */
  close(): void {
    this.wrapper?.classList.remove(Popover.CSS.popoverOpened);
    this.itemEls.forEach((el) => {
      this.clearConfirmationState(el);
    });
  }
}
