import { RangeType } from './types';
import { HighlightInfoType, HighlightCanvasOptionsType, CanvasType } from './types/highlightCanvas'

String.prototype.getIndicesOf = function(searchStr: string) {
  let searchStrLen = searchStr.length;
  let startIndex = 0,
    index,
    indices = [];
  while ((index = this.toLowerCase().indexOf(searchStr.toLowerCase(), startIndex)) > -1) {
    indices.push({index, length: searchStrLen});
    startIndex = index + searchStrLen;
  }
  return indices;
};

const highlightCanvasContainer: HTMLDivElement[] = [];

class HighlightCanvas {
  public static readonly CANVAS_MAX_HEIGHT: number = 5000;

  public readonly quill: any;
  public readonly options: HighlightCanvasOptionsType;

  public container: HTMLDivElement;
  private _canvasGroup: RangeType[];
  private canvasGroup: RangeType[];
  private canvas: CanvasType[];
  public canvasIsClear: boolean; // 画布是否是干净的
  // @ts-ignore
  private value: HighlightInfoType | HighlightInfoType[] | null; // 搜索内容
  private index: number; // 当前查找索引

  public constructor(quill: any, options: HighlightCanvasOptionsType) {
    this.quill = quill;
    this.options = options;
    this.container = this.quill.addContainer('ql-highlight-canvas');
    this.container.setAttribute(
      'style',
      [
        'position: absolute',
        'pointer-events: none',
        'top: 0',
        'bottom: 0',
        'right: 0',
        'left: 0',
        'z-index: -1',
      ].join(';')
    );
    highlightCanvasContainer.push(this.container);
    this._canvasGroup = [];
    this.canvasGroup = [];
    this.canvas = [];
    this.canvasIsClear = true;
    this.value = null;
    this.index = -1;

    Object.defineProperty(this, 'canvasGroup', {
      enumerable: true,
      configurable: true,
      get: () => {
        return this._canvasGroup;
      },
      set: (newValue) => {
        // console.log(this.options.type + '’s highlight', newValue);
        this._canvasGroup = newValue;
        if (Array.isArray(newValue) && newValue.length) {
          this.drawCanvasGroup(0);
        } else {
          this.clearCanvas();
        }
      }
    });
  }

  /**
   * @description: 搜索内容查找匹配
   * @param {string} value 搜索的内容
   * @return {array} 搜索匹配到的range集合
   */
  public searchMatchText(value: HighlightInfoType | HighlightInfoType[]) {
    this.value = value;
    if (!Array.isArray(value)) value = [value];
    let totalText = this.quill.getText();
    return this.canvasGroup = value.reduce((result: RangeType[], item: HighlightInfoType) => {
      if (!item.name) return result;
      let re = new RegExp(item.name, 'gi');
      let match = re.test(totalText);
      let data = match ? totalText.getIndicesOf(item.name) : [];
      data = data.map((_: any) => ({..._, ...item}));
      return result = [...result, ...data];
    }, []);
  }

  private _createCanvas(width: number, height: number) {
    this.container.innerHTML = '';
    this.canvas = [];
    let num = Math.ceil(height / HighlightCanvas.CANVAS_MAX_HEIGHT);
    for (let i = 0; i < num; i++) {
      let canvas = document.createElement('canvas') as CanvasType;
      canvas.setAttribute('style', 'vertical-align: bottom;');
      canvas.width = width;
      canvas.height = i === num - 1 ? height % HighlightCanvas.CANVAS_MAX_HEIGHT : HighlightCanvas.CANVAS_MAX_HEIGHT;
      canvas.ctx2D = canvas.getContext('2d') as CanvasRenderingContext2D;
      this.container.append(canvas);
      this.canvas.push(canvas);
    }
  }

  private _paint(index: number, color: string, bounds: any) {
    let canvas = this.canvas[index];
    if (!canvas.ctx2D) return;
    canvas.ctx2D.fillStyle = color;
    canvas.ctx2D.fillRect(bounds.left, bounds.top - index * HighlightCanvas.CANVAS_MAX_HEIGHT, bounds.width, bounds.height);
  }

  /**
   * @description: 开始画搜索内容位置
   * @param {number} index 当前active索引
   * @return {*} null
   */
  public drawCanvasGroup(index: number, cutover?: boolean) {
    this.index = index;
    this.clearCanvas();
    let width = this.quill.container.offsetWidth;
    let height = this.quill.container.offsetHeight;
    if (!cutover) this._createCanvas(width, height);
    this.canvasGroup.forEach((range: RangeType, i: number) => {
      let active = i === this.index && this.options.activeBackground;
      let color = active ? this.options.activeBackground : this.options.defaultBackground;
      for (let i = 0; i < range.length; i++) {
        let bounds = this.quill.getBounds(range.index + i, 1);
        let topIndex = Math.floor(bounds.top / HighlightCanvas.CANVAS_MAX_HEIGHT);
        let bottomIndex = Math.floor((bounds.top + bounds.height) / HighlightCanvas.CANVAS_MAX_HEIGHT);
        if (topIndex === bottomIndex) {
          this._paint(bottomIndex, color, bounds);
        } else {
          this._paint(topIndex, color, bounds);
          this._paint(bottomIndex, color, bounds);
        }
        this.canvasIsClear = false;
        const scrollingContainer = this.quill.scrollingContainer;
        if (
          !this.quill.hasFocus() &&
          active &&
          (
            bounds.top < scrollingContainer.scrollTop ||
            bounds.top > scrollingContainer.scrollTop + scrollingContainer.offsetHeight
          )
        ) {
          scrollingContainer.scrollTop = bounds.top - scrollingContainer.offsetHeight / 3;
        }
      }
    })
  }

  /**
   * @description: 清除画布
   */
  public clearCanvas() {
    if (this.canvas.length && !this.canvasIsClear) {
      this.canvas.forEach((canvas: CanvasType) => {
        canvas.ctx2D.clearRect(0, 0, canvas.width, canvas.height);
      })
      this.canvasIsClear = true;
    }
  }

  public clear() {
    this._canvasGroup = [];
    this.canvasGroup = [];
    this.canvas = [];
    this.canvasIsClear = true;
    this.value = null;
    this.index = -1;
  }

  public destroy() {
    Object.defineProperty(this, 'canvasGroup', {});
  }
}

export default HighlightCanvas;
