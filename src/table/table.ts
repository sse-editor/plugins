import type { API } from "@sse-editor/types";
import Toolbox from "./toolbox";
import * as $ from "./utils/dom";
import throttled from "./utils/throttled";

import {
  IconDirectionLeftDown,
  IconDirectionRightDown,
  IconDirectionUpRight,
  IconDirectionDownRight,
  IconCross,
  IconPlus,
} from "@sse-editor/icons";

/**
 * TableConfig - Tool's config from Editor
 */
export interface TableConfig {
  withHeadings: boolean;
  maxRows: number;
  maxCols: number;
  rows: number;
  cols: number;
  stretched: boolean;
}

/**
 * TableData - object with the data transferred to form a table
 */
export interface TableData {
  withHeadings: boolean;
  stretched: boolean;
  content: string[][];
}

export interface TableParams {
  readOnly: boolean;
  api: API;
  data: TableData;
  config: TableConfig;
}

export interface BinSearch {
  numberOfCells: number;
  getCell: (mid: number) => HTMLElement;
  beforeTheLeftBorder: (coords: any) => boolean;
  afterTheRightBorder: (coords: any) => boolean;
}

/**
 * Generates and manages table contents.
 */
export default class Table {
  private readOnly: boolean;
  private api: API;
  private data: TableData;
  private config: TableConfig;
  wrapper: HTMLElement | null;
  private table: HTMLElement | null;
  private toolboxColumn: Toolbox;
  private toolboxRow: Toolbox;
  private hoveredRow: number;
  private hoveredColumn: number;
  private selectedRow: number;
  private selectedColumn: number;
  private tunes: { withHeadings: boolean };
  private focusedCell: { row: number; column: number };

  /**
   * Creates
   *
   * @constructor
   * @param {boolean} readOnly - read-only mode flag
   * @param {API} api - Editor.js API
   * @param {TableData} data - Editor.js API
   * @param {TableConfig} config - Editor.js API
   */
  constructor(params: TableParams) {
    this.readOnly = params.readOnly;
    this.api = params.api;
    this.data = params.data;
    this.config = params.config;

    /**
     * DOM nodes
     */
    this.wrapper = null;
    this.table = null;

    /**
     * Toolbox for managing of columns
     */
    this.toolboxColumn = this.createColumnToolbox();
    this.toolboxRow = this.createRowToolbox();

    /**
     * Create table and wrapper elements
     */
    this.createTableWrapper();

    // Current hovered row index
    this.hoveredRow = 0;

    // Current hovered column index
    this.hoveredColumn = 0;

    // Index of last selected row via toolbox
    this.selectedRow = 0;

    // Index of last selected column via toolbox
    this.selectedColumn = 0;

    // Additional settings for the table
    this.tunes = { withHeadings: false };

    /**
     * Resize table to match config/data size
     */
    this.resize();

    /**
     * Fill the table with data
     */
    this.fill();

    /**
     * The cell in which the focus is currently located, if 0 and 0 then there is no focus
     * Uses to switch between cells with buttons
     */

    this.focusedCell = { row: 0, column: 0 };

    /**
     * Global click listener allows to delegate clicks on some elements
     */
    this.documentClicked = this.documentClicked.bind(this);

    if (!this.readOnly) this.bindEvents();
  }

  /**
   * Style classes
   */
  static get CSS() {
    return {
      wrapper: "tc-wrap",
      wrapperReadOnly: "tc-wrap--readonly",
      table: "tc-table",
      row: "tc-row",
      withHeadings: "tc-table--heading",
      rowSelected: "tc-row--selected",
      cell: "tc-cell",
      cellSelected: "tc-cell--selected",
      addRow: "tc-add-row",
      addRowDisabled: "tc-add-row--disabled",
      addColumn: "tc-add-column",
      addColumnDisabled: "tc-add-column--disabled",
    };
  }

  /**
   * Returns the rendered table wrapper
   *
   * @returns {Element}
   */
  getWrapper(): HTMLElement {
    return this.wrapper as HTMLElement;
  }

  /**
   * Hangs the necessary handlers to events
   */
  bindEvents() {
    // set the listener to close toolboxes when click outside
    document.addEventListener("click", this.documentClicked);

    // Update toolboxes position depending on the mouse movements
    this.table!.addEventListener(
      "mousemove",
      throttled(150, (event) => this.onMouseMoveInTable(event)),
      { passive: true }
    );

    // Controls some of the keyboard buttons inside the table
    this.table!.onkeypress = (event) => this.onKeyPressListener(event);

    // Tab is executed by default before keypress, so it must be intercepted on keydown
    this.table!.addEventListener("keydown", (event) =>
      this.onKeyDownListener(event)
    );

    // Determine the position of the cell in focus
    this.table!.addEventListener("focusin", (event) =>
      this.focusInTableListener(event)
    );
  }

  /**
   * Configures and creates the toolbox for manipulating with columns
   *
   * @returns {Toolbox}
   */
  createColumnToolbox(): Toolbox {
    return new Toolbox({
      api: this.api,
      cssModifier: "column",
      items: [
        {
          label: this.api.i18n.t("Add column to left"),
          icon: IconDirectionLeftDown,
          hideIf: () => {
            return this.numberOfColumns === this.config.maxCols;
          },
          onClick: () => {
            this.addColumn(this.selectedColumn, true);
            this.hideToolboxes();
          },
        },
        {
          label: this.api.i18n.t("Add column to right"),
          icon: IconDirectionRightDown,
          hideIf: () => {
            return this.numberOfColumns === this.config.maxCols;
          },
          onClick: () => {
            this.addColumn(this.selectedColumn + 1, true);
            this.hideToolboxes();
          },
        },
        {
          label: this.api.i18n.t("Delete column"),
          icon: IconCross,
          hideIf: () => {
            return this.numberOfColumns === 1;
          },
          confirmationRequired: true,
          onClick: () => {
            this.deleteColumn(this.selectedColumn);
            this.hideToolboxes();
          },
        },
      ],
      onOpen: () => {
        this.selectColumn(this.hoveredColumn);
        this.hideRowToolbox();
      },
      onClose: () => {
        this.unselectColumn();
      },
    });
  }

  /**
   * Configures and creates the toolbox for manipulating with rows
   *
   * @returns {Toolbox}
   */
  createRowToolbox(): Toolbox {
    return new Toolbox({
      api: this.api,
      cssModifier: "row",
      items: [
        {
          label: this.api.i18n.t("Add row above"),
          icon: IconDirectionUpRight,
          hideIf: () => {
            return this.numberOfRows === this.config.maxRows;
          },
          onClick: () => {
            this.addRow(this.selectedRow, true);
            this.hideToolboxes();
          },
        },
        {
          label: this.api.i18n.t("Add row below"),
          icon: IconDirectionDownRight,
          hideIf: () => {
            return this.numberOfRows === this.config.maxRows;
          },
          onClick: () => {
            this.addRow(this.selectedRow + 1, true);
            this.hideToolboxes();
          },
        },
        {
          label: this.api.i18n.t("Delete row"),
          icon: IconCross,
          hideIf: () => {
            return this.numberOfRows === 1;
          },
          confirmationRequired: true,
          onClick: () => {
            this.deleteRow(this.selectedRow);
            this.hideToolboxes();
          },
        },
      ],
      onOpen: () => {
        this.selectRow(this.hoveredRow);
        this.hideColumnToolbox();
      },
      onClose: () => {
        this.unselectRow();
      },
    });
  }

  /**
   * When you press enter it moves the cursor down to the next row
   * or creates it if the click occurred on the last one
   */
  moveCursorToNextRow() {
    if (this.focusedCell.row !== this.numberOfRows) {
      this.focusedCell.row += 1;
      // this.focusCell(this.focusedCell);
      this.focusCell();
    } else {
      this.addRow();
      this.focusedCell.row += 1;
      // this.focusCell(this.focusedCell);
      this.focusCell();
      this.updateToolboxesPosition(0, 0);
    }
  }

  /**
   * Get table cell by row and col index
   *
   * @param {number} row - cell row coordinate
   * @param {number} column - cell column coordinate
   * @returns {HTMLElement}
   */
  getCell(row: number, column: number): HTMLElement {
    return this.table?.querySelectorAll(
      `.${Table.CSS.row}:nth-child(${row}) .${Table.CSS.cell}`
    )[column - 1] as HTMLElement;
  }

  /**
   * Get table row by index
   *
   * @param {number} row - row coordinate
   * @returns {HTMLElement}
   */
  getRow(row: number): HTMLElement {
    return this.table?.querySelector(
      `.${Table.CSS.row}:nth-child(${row})`
    ) as HTMLElement;
  }

  /**
   * The parent of the cell which is the row
   *
   * @param {HTMLElement} cell - cell element
   * @returns {HTMLElement}
   */
  getRowByCell(cell: HTMLElement): HTMLElement {
    return cell.parentElement as HTMLElement;
  }

  /**
   * Ger row's first cell
   *
   * @param {Element} row - row to find its first cell
   * @returns {Element}
   */
  getRowFirstCell(row: Element): Element {
    return row.querySelector(`.${Table.CSS.cell}:first-child`) as Element;
  }

  /**
   * Set the sell's content by row and column numbers
   *
   * @param {number} row - cell row coordinate
   * @param {number} column - cell column coordinate
   * @param {string} content - cell HTML content
   */
  setCellContent(row: number, column: number, content: string) {
    const cell = this.getCell(row, column);
    cell.innerHTML = content;
  }

  /**
   * Add column in table on index place
   * Add cells in each row
   *
   * @param {number} columnIndex - number in the array of columns, where new column to insert, -1 if insert at the end
   * @param {boolean} [setFocus] - pass true to focus the first cell
   */
  addColumn(columnIndex: number = -1, setFocus: boolean = false) {
    let numberOfColumns = this.numberOfColumns;
    /**
     * Check if the number of columns has reached the maximum allowed columns specified in the configuration,
     * and if so, exit the function to prevent adding more columns beyond the limit.
     */
    if (
      this.config &&
      this.config.maxCols &&
      this.numberOfColumns >= this.config.maxCols
    ) {
      return;
    }

    /**
     * Iterate all rows and add a new cell to them for creating a column
     */
    for (let rowIndex = 1; rowIndex <= this.numberOfRows; rowIndex++) {
      let cell;
      const cellElem = this.createCell();

      if (columnIndex > 0 && columnIndex <= numberOfColumns) {
        cell = this.getCell(rowIndex, columnIndex);

        $.insertBefore(cellElem, cell);
      } else {
        cell = this.getRow(rowIndex).appendChild(cellElem);
      }

      /**
       * Autofocus first cell
       */
      if (rowIndex === 1) {
        const firstCell = this.getCell(
          rowIndex,
          columnIndex > 0 ? columnIndex : numberOfColumns + 1
        );

        if (firstCell && setFocus) {
          $.focus(firstCell);
        }
      }
    }

    const addColButton = this.wrapper?.querySelector(`.${Table.CSS.addColumn}`);
    if (
      this.config?.maxCols &&
      this.numberOfColumns > this.config.maxCols - 1 &&
      addColButton
    ) {
      addColButton.classList.add(Table.CSS.addColumnDisabled);
    }
    this.addHeadingAttrToFirstRow();
  }

  /**
   * Add row in table on index place
   *
   * @param {number} index - number in the array of rows, where new column to insert, -1 if insert at the end
   * @param {boolean} [setFocus] - pass true to focus the inserted row
   * @returns {HTMLElement} row
   */
  addRow(index: number = -1, setFocus: boolean = false) {
    let insertedRow;
    let rowElem = $.make("div", Table.CSS.row);

    if (this.tunes.withHeadings) {
      this.removeHeadingAttrFromFirstRow();
    }

    /**
     * We remember the number of columns, because it is calculated
     * by the number of cells in the first row
     * It is necessary that the first line is filled in correctly
     */
    let numberOfColumns = this.numberOfColumns;
    /**
     * Check if the number of rows has reached the maximum allowed rows specified in the configuration,
     * and if so, exit the function to prevent adding more columns beyond the limit.
     */
    const addRowButton = this.wrapper!.querySelector(`.${Table.CSS.addRow}`);
    if (
      this.config &&
      this.config.maxRows &&
      this.numberOfRows >= this.config.maxRows &&
      addRowButton
    ) {
      return;
    }

    if (index > 0 && index <= this.numberOfRows) {
      let row = this.getRow(index);
      insertedRow = $.insertBefore(rowElem, row);
    } else {
      insertedRow = this.table!.appendChild(rowElem);
    }

    this.fillRow(insertedRow, numberOfColumns);
    if (this.tunes.withHeadings) {
      this.addHeadingAttrToFirstRow();
    }

    const insertedRowFirstCell = this.getRowFirstCell(insertedRow);
    if (insertedRowFirstCell && setFocus) {
      $.focus(insertedRowFirstCell);
    }

    if (
      this.config &&
      this.config.maxRows &&
      this.numberOfRows >= this.config.maxRows &&
      addRowButton
    ) {
      addRowButton.classList.add(Table.CSS.addRowDisabled);
    }

    return insertedRow;
  }

  /**
   * Delete a column by index
   *
   * @param {number} index
   */
  deleteColumn(index: number) {
    for (let i = 1; i <= this.numberOfRows; i++) {
      const cell = this.getCell(i, index);
      if (!cell) return;
      cell.remove();
    }
    const addColButton = this.wrapper?.querySelector(`.${Table.CSS.addColumn}`);
    if (addColButton) {
      addColButton.classList.remove(Table.CSS.addColumnDisabled);
    }
  }

  /**
   * Delete a row by index
   *
   * @param {number} index
   */
  deleteRow(index: number) {
    this.getRow(index).remove();
    const addRowButton = this.wrapper?.querySelector(`.${Table.CSS.addRow}`);
    if (addRowButton) {
      addRowButton.classList.remove(Table.CSS.addRowDisabled);
    }

    this.addHeadingAttrToFirstRow();
  }

  /**
   * Create a wrapper containing a table, toolboxes
   * and buttons for adding rows and columns
   *
   * @returns {HTMLElement} wrapper - where all buttons for a table and the table itself will be
   */
  createTableWrapper() {
    this.wrapper = $.make("div", Table.CSS.wrapper);
    this.table = $.make("div", Table.CSS.table);

    if (this.readOnly) {
      this.wrapper.classList.add(Table.CSS.wrapperReadOnly);
    }

    this.wrapper.appendChild(this.toolboxRow.element);
    this.wrapper.appendChild(this.toolboxColumn.element);
    this.wrapper.appendChild(this.table);

    if (!this.readOnly) {
      const addColumnButton = $.make("div", Table.CSS.addColumn, {
        innerHTML: IconPlus,
      });
      const addRowButton = $.make("div", Table.CSS.addRow, {
        innerHTML: IconPlus,
      });
      this.wrapper.appendChild(addColumnButton);
      this.wrapper.appendChild(addRowButton);
    }
  }

  /**
   * Returns the size of the table based on initial data or config "size" property
   *
   * @return {{rows: number, cols: number}} - number of cols and rows
   */
  computeInitialSize(): { rows: number; cols: number } {
    const content = this.data && this.data.content;
    const isValidArray = Array.isArray(content);
    const isNotEmptyArray = isValidArray ? content.length : false;
    const contentRows = isValidArray ? content.length : undefined;
    const contentCols = isNotEmptyArray ? content[0].length : undefined;
    const parsedRows = Number.parseInt(
      this.config && this.config.rows.toString()
    );
    const parsedCols = Number.parseInt(
      this.config && this.config.cols.toString()
    );

    /**
     * Value of config have to be positive number
     */
    const configRows =
      !isNaN(parsedRows) && parsedRows > 0 ? parsedRows : undefined;
    const configCols =
      !isNaN(parsedCols) && parsedCols > 0 ? parsedCols : undefined;
    const defaultRows = 2;
    const defaultCols = 2;
    const rows = contentRows || configRows || defaultRows;
    const cols = contentCols || configCols || defaultCols;

    return { rows, cols };
  }

  /**
   * Resize table to match config size or transmitted data size
   *
   * @return {{rows: number, cols: number}} - number of cols and rows
   */
  resize() {
    const { rows, cols } = this.computeInitialSize();

    for (let i = 0; i < rows; i++) {
      this.addRow();
    }

    for (let i = 0; i < cols; i++) {
      this.addColumn();
    }
  }

  /**
   * Fills the table with data passed to the constructor
   *
   * @returns {void}
   */
  fill(): void {
    const data = this.data;

    if (data && data.content) {
      for (let i = 0; i < data.content.length; i++) {
        for (let j = 0; j < data.content[i].length; j++) {
          this.setCellContent(i + 1, j + 1, data.content[i][j]);
        }
      }
    }
  }

  /**
   * Fills a row with cells
   *
   * @param {HTMLElement} row - row to fill
   * @param {number} numberOfColumns - how many cells should be in a row
   */
  fillRow(row: HTMLElement, numberOfColumns: number) {
    for (let i = 1; i <= numberOfColumns; i++) {
      const newCell = this.createCell();
      row.appendChild(newCell);
    }
  }

  /**
   * Creating a cell element
   *
   * @return {Element}
   */
  createCell() {
    return $.make("div", Table.CSS.cell, {
      contentEditable: !this.readOnly,
    });
  }

  /**
   * Get number of rows in the table
   */
  get numberOfRows() {
    return this.table!.childElementCount;
  }

  /**
   * Get number of columns in the table
   */
  get numberOfColumns() {
    if (this.numberOfRows) {
      return this.table!.querySelectorAll(
        `.${Table.CSS.row}:first-child .${Table.CSS.cell}`
      ).length;
    }

    return 0;
  }

  /**
   * Is the column toolbox menu displayed or not
   *
   * @returns {boolean}
   */
  get isColumnMenuShowing(): boolean {
    return this.selectedColumn !== 0;
  }

  /**
   * Is the row toolbox menu displayed or not
   *
   * @returns {boolean}
   */
  get isRowMenuShowing(): boolean {
    return this.selectedRow !== 0;
  }

  /**
   * Recalculate position of toolbox icons
   *
   * @param {Event} event - mouse move event
   */
  onMouseMoveInTable(event: MouseEvent) {
    const { row, column } = this.getHoveredCell(event);
    this.hoveredColumn = column;
    this.hoveredRow = row;
    this.updateToolboxesPosition();
  }

  /**
   * Prevents default Enter behaviors
   * Adds Shift+Enter processing
   *
   * @param {KeyboardEvent} event - keypress event
   */
  onKeyPressListener(event: KeyboardEvent) {
    if (event.key === "Enter") {
      if (event.shiftKey) {
        return true;
      }

      this.moveCursorToNextRow();
    }

    return event.key !== "Enter";
  }

  /**
   * Prevents tab keydown event from bubbling
   * so that it only works inside the table
   *
   * @param {KeyboardEvent} event - keydown event
   */
  onKeyDownListener(event: KeyboardEvent) {
    if (event.key === "Tab") {
      event.stopPropagation();
    }
  }

  /**
   * Set the coordinates of the cell that the focus has moved to
   *
   * @param {FocusEvent} event - focusin event
   */
  focusInTableListener(event: FocusEvent) {
    const cell = event.target as HTMLElement;
    const row = this.getRowByCell(cell);

    this.focusedCell = {
      row: this.table
        ? Array.from(this.table!.querySelectorAll(`.${Table.CSS.row}`)).indexOf(
            row
          ) + 1
        : 0,
      column:
        Array.from(row.querySelectorAll(`.${Table.CSS.cell}`)).indexOf(cell) +
        1,
    };
  }

  /**
   * Unselect row/column
   * Close toolbox menu
   * Hide toolboxes
   *
   * @returns {void}
   */
  hideToolboxes(): void {
    this.hideRowToolbox();
    this.hideColumnToolbox();
    this.updateToolboxesPosition();
  }

  /**
   * Unselect row, close toolbox
   *
   * @returns {void}
   */
  hideRowToolbox(): void {
    this.unselectRow();
    this.toolboxRow.hide();
  }

  /**
   * Unselect column, close toolbox
   *
   * @returns {void}
   */
  hideColumnToolbox(): void {
    this.unselectColumn();
    this.toolboxColumn.hide();
  }

  /**
   * Set the cursor focus to the focused cell
   *
   * @returns {void}
   */
  focusCell(): void {
    this.focusedCellElem.focus();
  }

  /**
   * Get current focused element
   *
   * @returns {HTMLElement} - focused cell
   */
  get focusedCellElem(): HTMLElement {
    const { row, column } = this.focusedCell;
    return this.getCell(row, column);
  }

  /**
   * Update toolboxes position
   *
   * @param {number} row - hovered row
   * @param {number} column - hovered column
   */
  updateToolboxesPosition(
    row: number = this.hoveredRow,
    column: number = this.hoveredColumn
  ) {
    if (!this.isColumnMenuShowing) {
      if (column > 0 && column <= this.numberOfColumns) {
        // not sure this statement is needed. Maybe it should be fixed in getHoveredCell()
        this.toolboxColumn.show(() => {
          return {
            left: `calc((100% - var(--cell-size)) / (${this.numberOfColumns} * 2) * (1 + (${column} - 1) * 2))`,
            top: ``,
          };
        });
      }
    }

    if (!this.isRowMenuShowing) {
      if (row > 0 && row <= this.numberOfRows) {
        // not sure this statement is needed. Maybe it should be fixed in getHoveredCell()
        this.toolboxRow.show(() => {
          const hoveredRowElement = this.getRow(row);
          const { fromTopBorder } = $.getRelativeCoordsOfTwoElems(
            this.table!,
            hoveredRowElement
          );
          const { height } = hoveredRowElement.getBoundingClientRect();

          return {
            top: `${Math.ceil(fromTopBorder + height / 2)}px`,
            left: ``,
          };
        });
      }
    }
  }

  /**
   * Makes the first row headings
   *
   * @param {boolean} withHeadings - use headings row or not
   */
  setHeadingsSetting(withHeadings: boolean) {
    this.tunes.withHeadings = withHeadings;

    if (withHeadings) {
      this.table?.classList.add(Table.CSS.withHeadings);
      this.addHeadingAttrToFirstRow();
    } else {
      this.table?.classList.remove(Table.CSS.withHeadings);
      this.removeHeadingAttrFromFirstRow();
    }
  }

  /**
   * Adds an attribute for displaying the placeholder in the cell
   */
  addHeadingAttrToFirstRow() {
    for (let cellIndex = 1; cellIndex <= this.numberOfColumns; cellIndex++) {
      let cell = this.getCell(1, cellIndex);

      if (cell) {
        cell.setAttribute("heading", this.api.i18n.t("Heading"));
      }
    }
  }

  /**
   * Removes an attribute for displaying the placeholder in the cell
   */
  removeHeadingAttrFromFirstRow() {
    for (let cellIndex = 1; cellIndex <= this.numberOfColumns; cellIndex++) {
      let cell = this.getCell(1, cellIndex);

      if (cell) {
        cell.removeAttribute("heading");
      }
    }
  }

  /**
   * Add effect of a selected row
   *
   * @param {number} index
   */
  selectRow(index: number) {
    const row = this.getRow(index);

    if (row) {
      this.selectedRow = index;
      row.classList.add(Table.CSS.rowSelected);
    }
  }

  /**
   * Remove effect of a selected row
   */
  unselectRow() {
    if (this.selectedRow <= 0) return;
    const row = this.table?.querySelector(`.${Table.CSS.rowSelected}`);

    if (row) {
      row.classList.remove(Table.CSS.rowSelected);
    }

    this.selectedRow = 0;
  }

  /**
   * Add effect of a selected column
   *
   * @param {number} index
   */
  selectColumn(index: number) {
    for (let i = 1; i <= this.numberOfRows; i++) {
      const cell = this.getCell(i, index);

      if (cell) {
        cell.classList.add(Table.CSS.cellSelected);
      }
    }

    this.selectedColumn = index;
  }

  /**
   * Remove effect of a selected column
   */
  unselectColumn() {
    if (this.selectedColumn <= 0) {
      return;
    }

    let cells = this.table!.querySelectorAll(`.${Table.CSS.cellSelected}`);

    Array.from(cells).forEach((column) => {
      column.classList.remove(Table.CSS.cellSelected);
    });

    this.selectedColumn = 0;
  }

  /**
   * Calculates the row and column that the cursor is currently hovering over
   * The search was optimized from O(n) to O (log n) via bin search to reduce the number of calculations
   *
   * @param {Event} event - mousemove event
   * @returns hovered cell coordinates as an integer row and column
   */
  getHoveredCell(event: MouseEvent) {
    let hoveredRow: number | undefined = this.hoveredRow;
    let hoveredColumn: number | undefined = this.hoveredColumn;
    const { width, height, x, y } = $.getCursorPositionRelativeToElement(
      this.table!,
      event
    );

    // Looking for hovered column
    if (x >= 0) {
      hoveredColumn = this.binSearch({
        numberOfCells: this.numberOfColumns,
        getCell: (mid) => this.getCell(1, mid),
        beforeTheLeftBorder: ({ fromLeftBorder }) => x < fromLeftBorder,
        afterTheRightBorder: ({ fromRightBorder }) =>
          x > width - fromRightBorder,
      });
    }

    // Looking for hovered row
    if (y >= 0) {
      hoveredRow = this.binSearch({
        numberOfCells: this.numberOfRows,
        getCell: (mid: number) => this.getCell(mid, 1),
        beforeTheLeftBorder: ({ fromTopBorder }: { fromTopBorder: number }) =>
          y < fromTopBorder,
        afterTheRightBorder: ({
          fromBottomBorder,
        }: {
          fromBottomBorder: number;
        }) => y > height - fromBottomBorder,
      });
    }

    return {
      row: hoveredRow || this.hoveredRow,
      column: hoveredColumn || this.hoveredColumn,
    };
  }

  /**
   * Looks for the index of the cell the mouse is hovering over.
   * Cells can be represented as ordered intervals with left and
   * right (upper and lower for rows) borders inside the table, if the mouse enters it, then this is our index
   *
   * @param {number} numberOfCells - upper bound of binary search
   * @param {function} getCell - function to take the currently viewed cell
   * @param {function} beforeTheLeftBorder - determines the cursor position, to the left of the cell or not
   * @param {function} afterTheRightBorder - determines the cursor position, to the right of the cell or not
   * @returns {number}
   */
  binSearch(config: BinSearch) {
    let leftBorder = 0;
    let rightBorder = config.numberOfCells + 1;
    let totalIterations = 0;
    let mid;

    while (leftBorder < rightBorder - 1 && totalIterations < 10) {
      mid = Math.ceil((leftBorder + rightBorder) / 2);

      const cell = config.getCell(mid);
      const relativeCoords = $.getRelativeCoordsOfTwoElems(this.table!, cell);

      if (config.beforeTheLeftBorder(relativeCoords)) {
        rightBorder = mid;
      } else if (config.afterTheRightBorder(relativeCoords)) {
        leftBorder = mid;
      } else {
        break;
      }

      totalIterations++;
    }

    return mid;
  }

  /**
   * Collects data from cells into a two-dimensional array
   *
   * @returns {string[][]}
   */
  getData() {
    const data = [];

    for (let i = 1; i <= this.numberOfRows; i++) {
      const row = this.table!.querySelector(
        `.${Table.CSS.row}:nth-child(${i})`
      ) as Element;
      const cells = Array.from(
        row.querySelectorAll(`.${Table.CSS.cell}`)
      ) as Element[];
      const isEmptyRow = cells.every((cell) => !cell.textContent?.trim());

      if (isEmptyRow) continue;
      data.push(cells.map((cell) => cell.innerHTML));
    }

    return data;
  }

  /**
   * Document CLicked
   */

  private documentClicked(event: MouseEvent) {
    const target = event.target as HTMLElement;
    const clickedInsideTable = target.closest(`.${Table.CSS.table}`) !== null;
    const outsideTableClicked =
      target.closest(`.${Table.CSS.wrapper}`) === null;
    const clickedOutsideToolboxes = clickedInsideTable || outsideTableClicked;

    if (clickedOutsideToolboxes) this.hideToolboxes();

    const clickedOnAddRowButton = target.closest(`.${Table.CSS.addRow}`);
    const clickedOnAddColumnButton = target.closest(`.${Table.CSS.addColumn}`);

    /**
     * Also, check if clicked in current table, not other (because documentClicked bound to the whole document)
     */
    if (
      clickedOnAddRowButton &&
      clickedOnAddRowButton.parentNode === this.wrapper
    ) {
      this.addRow(undefined, true);
      this.hideToolboxes();
    } else if (
      clickedOnAddColumnButton &&
      clickedOnAddColumnButton.parentNode === this.wrapper
    ) {
      this.addColumn(undefined, true);
      this.hideToolboxes();
    }
  }

  /**
   * Remove listeners on the document
   */
  destroy() {
    document.removeEventListener("click", this.documentClicked);
  }
}
