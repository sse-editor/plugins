import {
  IconLowerRoman,
  IconNumber,
  IconUpperRoman,
  IconLowerAlpha,
  IconUpperAlpha,
} from "@sse-editor/icons";
import type {
  CheckListRenderer,
  OrderedListRenderer,
  UnorderedListRenderer,
} from "./ListRenderer";

/**
 * Type that represents the list item
 */
export type ItemElement = HTMLElement;

/**
 * Type that represents children wrapper of the list item
 */
export type ItemChildWrapperElement = HTMLElement;

/**
 * Type that represents content element of the item
 */
export type ItemContentElement = HTMLElement;

export type OlCounterType =
  | "numeric"
  | "upper-roman"
  | "lower-roman"
  | "upper-alpha"
  | "lower-alpha";

/**
 * Map that represents all of the supported styles of the counters for ordered list
 */
export const OlCounterTypesMap = new Map<string, string>([
  /**
   * Value that represents default arabic numbers for counters
   */
  ["Numeric", "numeric"],

  /**
   * Value that represents lower roman numbers for counteres
   */
  ["Lower Roman", "lower-roman"],

  /**
   * Value that represents upper roman numbers for counters
   */
  ["Upper Roman", "upper-roman"],

  /**
   * Value that represents lower alpha characters for counters
   */
  ["Lower Alpha", "lower-alpha"],

  /**
   * Value that represents upper alpha characters for counters
   */
  ["Upper Alpha", "upper-alpha"],
]);

/**
 * Map that represents relation between supported counter types and theirs icons to be displayed in toolbox
 */
export const OlCounterIconsMap = new Map<string, string>([
  /**
   * Value that represents Icon for Numeric counter type
   */
  ["numeric", IconNumber],

  /**
   * Value that represents Icon for Lower Roman counter type
   */
  ["lower-roman", IconLowerRoman],

  /**
   * Value that represents Icon for Upper Roman counter type
   */
  ["upper-roman", IconUpperRoman],

  /**
   * Value that represents Icon for Lower Alpha counter type
   */
  ["lower-alpha", IconLowerAlpha],

  /**
   * Value that represents Icon for Upper Alpha counter type
   */
  ["upper-alpha", IconUpperAlpha],
]);

/**
 * Meta information of each list item
 */
export interface ItemMetaBase {}

/**
 * Meta information of checklist item
 */
export interface ChecklistItemMeta extends ItemMetaBase {
  /**
   * State of the checkbox of the item
   */
  checked: boolean;
}

/**
 * Meta information of ordered list item
 */
export interface OrderedListItemMeta extends ItemMetaBase {
  /**
   * If passed, ordered list counters will start with this index
   */
  start?: number;
  /**
   * Counters type used only in ordered list
   */
  counterType?: OlCounterType;
}

/**
 * Meta information of unordered list item
 */
export interface UnorderedListItemMeta extends ItemMetaBase {}

/**
 * Type that represents all available meta objects for list item
 */
export type ItemMeta =
  | ChecklistItemMeta
  | OrderedListItemMeta
  | UnorderedListItemMeta;

/**
 * list style to make list as ordered or unordered
 */
export type ListDataStyle = "ordered" | "unordered" | "checklist";

/**
 * Interface that represents data of the List tool
 */
export type ListData = Omit<ListItem, "content"> & {
  /**
   * Style of the list tool
   */
  style: ListDataStyle;
};

/**
 * Interface that represents data of the List tool
 */
export interface OldListData {
  /**
   * Style of the List tool
   */
  style: "ordered" | "unordered";
  /**
   * Array of items of the List tool
   */
  items: string[];
}

/**
 * Type that represents data of the List tool
 */
export type OldNestedListData = Omit<ListData, "meta">;

/**
 * Interface that represents old checklist data format
 */
export interface OldChecklistData {
  /**
   * Checklist items
   */
  items: OldChecklistItem[];
}

/**
 * Interface that represents old checklist item format
 */
interface OldChecklistItem {
  /**
   * Text of the checklist item
   */
  text: string;
  /**
   * Checked state of the checklist item
   */
  checked: boolean;
}

/**
 * List item within the output data
 */
export interface ListItem {
  /**
   * list item text content
   */
  content: string;

  /**
   * Meta information of each list item
   */
  meta: ItemMeta;

  /**
   * sublist items
   */
  items: ListItem[];
}

/**
 * Tool's configuration
 */
export interface ListConfig {
  /**
   * default list style: ordered or unordered
   * default is unordered
   */
  defaultStyle?: ListDataStyle;
  /**
   * Max level of the nesting in list
   * If nesting is not needed, it could be set to 1
   */
  maxLevel?: number;
}

/**
 * Type that represents all possible list renderer types
 */
export type ListRenderer =
  | CheckListRenderer
  | OrderedListRenderer
  | UnorderedListRenderer;

/**
 * Paste event for tag substitution, similar to editor.js PasteEvent but with a different data type
 */
export interface PasteEvent extends CustomEvent {
  /**
   * Pasted element
   */
  detail: {
    /**
     * Supported elements fir the paste event
     */
    data: HTMLUListElement | HTMLOListElement | HTMLLIElement;
  };
}
