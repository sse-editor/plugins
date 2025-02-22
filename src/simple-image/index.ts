import "./index.css";

import {
  IconAddBorder,
  IconStretch,
  IconAddBackground,
} from "@sse-editor/icons";
import type {
  API,
  ToolboxConfig,
  ToolConfig,
  BlockToolData,
  PasteConfig,
} from "@sse-editor/types";

/**
 * SimpleImage Tool's input and output data
 */
export interface SimpleImageData extends BlockToolData {
  url: string;
  caption: string;
  withBorder: boolean;
  withBackground: boolean;
  stretched: boolean;
}

/**
 * SimpleImage Tool's initial configuration
 */
export interface SimpleImageConfig extends ToolConfig {}

/**
 * SimpleImage Tool's constructor arguments
 */
interface SimpleImageParams {
  data: SimpleImageData;
  config?: SimpleImageConfig;
  api: API;
  readOnly: boolean;
}

interface SimpleImageNodes {
  wrapper: HTMLElement | null;
  imageHolder: HTMLElement | null;
  image: HTMLImageElement | null;
  caption: HTMLElement | null;
}

interface SimpleImageTunes {
  name: "withBorder" | "stretched" | "withBackground";
  icon: string;
  label: string;
}

interface SimpleImageCSS {
  baseClass: string;
  loading: string;
  input: string;
  wrapper: string;
  imageHolder: string;
  caption: string;
}

/**
 * SimpleImage Tool for the Editor.js
 * Works only with pasted image URLs and requires no server-side uploader.
 *
 * @typedef {object} SimpleImageData
 * @description Tool's input and output data format
 * @property {string} url — image URL
 * @property {string} caption — image caption
 * @property {boolean} withBorder - should image be rendered with border
 * @property {boolean} withBackground - should image be rendered with background
 * @property {boolean} stretched - should image be stretched to full width of container
 */
export default class SimpleImage {
  private api: API;
  private readOnly: boolean;
  private blockIndex: number;
  private _data: SimpleImageData;
  private nodes: SimpleImageNodes;
  private _CSS: SimpleImageCSS;

  private tunes: SimpleImageTunes[] = [
    {
      name: "withBorder",
      label: "Add Border",
      icon: IconAddBorder,
    },
    {
      name: "stretched",
      label: "Stretch Image",
      icon: IconStretch,
    },
    {
      name: "withBackground",
      label: "Add Background",
      icon: IconAddBackground,
    },
  ];

  constructor({ data, config, api, readOnly }: SimpleImageParams) {
    /**
     * Editor.js API
     */
    this.api = api;
    this.readOnly = readOnly;

    /**
     * When block is only constructing,
     * current block points to previous block.
     * So real block index will be +1 after rendering
     *
     * @todo place it at the `rendered` event hook to get real block index without +1;
     * @type {number}
     */
    this.blockIndex = this.api.blocks.getCurrentBlockIndex() + 1;

    /**
     * Styles
     */
    this._CSS = {
      baseClass: this.api.styles.block,
      loading: this.api.styles.loader,
      input: this.api.styles.input,
      wrapper: "cdx-simple-image",
      imageHolder: "cdx-simple-image__picture",
      caption: "cdx-simple-image__caption",
    };

    /**
     * Nodes cache
     */
    this.nodes = {
      wrapper: null,
      imageHolder: null,
      image: null,
      caption: null,
    };

    /**
     * Tool's initial data
     */
    this._data = {
      url: data.url || "",
      caption: data.caption || "",
      withBorder: data.withBorder !== undefined ? data.withBorder : false,
      withBackground:
        data.withBackground !== undefined ? data.withBackground : false,
      stretched: data.stretched !== undefined ? data.stretched : false,
    };
  }

  static get toolbox(): ToolboxConfig {
    return {
      icon: IconAddBorder, // Replace with appropriate icon
      title: "Simple Image",
    };
  }

  /**
   * Creates a Block:
   *  1) Show preloader
   *  2) Start to load an image
   *  3) After loading, append image and caption input
   *
   * @public
   */
  render(): HTMLElement {
    const wrapper = this._make("div", [this._CSS.baseClass, this._CSS.wrapper]);
    const loader = this._make("div", this._CSS.loading);
    const imageHolder = this._make("div", this._CSS.imageHolder);
    const image = this._make("img");
    const caption = this._make("div", [this._CSS.input, this._CSS.caption], {
      contentEditable: !this.readOnly,
      innerHTML: this.data.caption || "",
    });

    caption.dataset.placeholder = "Enter a caption";
    wrapper.appendChild(loader);
    if (this.data.url) image.src = this.data.url;

    image.onload = () => {
      wrapper.classList.remove(this._CSS.loading);
      imageHolder.appendChild(image);
      wrapper.appendChild(imageHolder);
      wrapper.appendChild(caption);
      loader.remove();
    };

    image.onerror = (e) => {
      // @todo use api.Notifies.show() to show error notification
      console.log("Failed to load an image", e);
    };

    this.nodes.imageHolder = imageHolder;
    this.nodes.wrapper = wrapper;
    this.nodes.image = image;
    this.nodes.caption = caption;

    return wrapper;
  }

  /**
   * @public
   * @param {Element} blockContent - Tool's wrapper
   * @returns {SimpleImageData}
   */
  save(blockContent: HTMLElement): SimpleImageData {
    const image = blockContent.querySelector("img");
    const caption = blockContent.querySelector(
      "." + this._CSS.input
    ) as HTMLElement;

    if (!image) return this.data;

    return Object.assign(this.data, {
      url: image.src,
      caption: caption.innerHTML,
    });
  }

  /**
   * Sanitizer rules
   */
  static get sanitize() {
    return {
      url: {},
      withBorder: {},
      withBackground: {},
      stretched: {},
      caption: {
        br: true,
      },
    };
  }

  /**
   * Notify core that read-only mode is suppoorted
   *
   * @returns {boolean}
   */
  static get isReadOnlySupported() {
    return true;
  }

  /**
   * Read pasted image and convert it to base64
   *
   * @static
   * @param {File} file
   * @returns {Promise<SimpleImageData>}
   */
  onDropHandler(file: File): Promise<SimpleImageData> {
    const reader = new FileReader();

    reader.readAsDataURL(file);

    return new Promise((resolve) => {
      reader.onload = (event) => {
        resolve({
          url: event.target?.result as string,
          caption: file.name,
          withBorder: false,
          withBackground: false,
          stretched: false,
        });
      };
    });
  }

  /**
   * On paste callback that is fired from Editor.
   *
   * @param {PasteEvent} event - event with pasted config
   */
  onPaste(event: any) {
    switch (event.type) {
      case "tag": {
        const img = event.detail.data;
        this.data = {
          url: img.src,
          caption: this.data.caption,
          withBorder: this.data.withBorder,
          withBackground: this.data.withBackground,
          stretched: this.data.stretched,
        };
        break;
      }
      case "pattern": {
        const { data: text } = event.detail;
        this.data = {
          url: text,
          caption: this.data.caption,
          withBorder: this.data.withBorder,
          withBackground: this.data.withBackground,
          stretched: this.data.stretched,
        };
        break;
      }
      case "file": {
        const { file } = event.detail;
        this.onDropHandler(file).then((data) => {
          this.data = data;
        });
        break;
      }
    }
  }

  /**
   * Returns image data
   *
   * @returns {SimpleImageData}
   */
  get data(): SimpleImageData {
    return this._data;
  }

  /**
   * Set image data and update the view
   *
   * @param {SimpleImageData} data
   */
  set data(data: SimpleImageData) {
    this._data = Object.assign({}, this.data, data);

    if (this.nodes.image) {
      this.nodes.image.src = this.data.url;
    }

    if (this.nodes.caption) {
      this.nodes.caption.innerHTML = this.data.caption;
    }
  }

  /**
   * Specify paste substitutes
   *
   * @see {@link ../../../docs/tools.md#paste-handling}
   * @public
   */
  static get pasteConfig(): PasteConfig {
    return {
      patterns: {
        image: /https?:\/\/\S+\.(gif|jpe?g|tiff|png|webp)$/i,
      },
      tags: [
        {
          img: { src: true },
        },
      ],
      files: {
        mimeTypes: ["image/*"],
      },
    };
  }

  /**
   * Returns image tunes config
   *
   * @returns {Array}
   */
  renderSettings() {
    return this.tunes.map((tune) => ({
      ...tune,
      label: this.api.i18n.t(tune.label),
      toggle: true,
      onActivate: () => this._toggleTune(tune.name),
      isActive: !!this.data[tune.name],
    }));
  }

  /**
   * Helper for making Elements with attributes
   *
   * @param  {string} tagName           - new Element tag name
   * @param  {Array|string} classNames  - list or name of CSS classname(s)
   * @param  {object} attributes        - any attributes
   * @returns {Element}
   */
  private _make<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    classNames: string | string[] | null = null,
    attributes: { [key: string]: any } = {}
  ): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName);

    if (Array.isArray(classNames)) {
      el.classList.add(...classNames);
    } else if (classNames) {
      el.classList.add(classNames);
    }

    for (const attrName in attributes) {
      (el as any)[attrName] = attributes[attrName];
    }

    return el;
  }

  private _toggleTune(tune: string) {
    this.data[tune] = !this.data[tune];
    this._acceptTuneView();
  }

  private _acceptTuneView() {
    this.tunes.forEach((tune) => {
      this.nodes.imageHolder?.classList.toggle(
        `cdx-simple-image__picture--${tune.name}`,
        !!this.data[tune.name]
      );

      if (tune.name === "stretched") {
        this.api.blocks.stretchBlock(this.blockIndex, !!this.data.stretched);
      }
    });
  }
}
