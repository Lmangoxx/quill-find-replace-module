import Quill from 'quill';
import HighlightCanvas from './highlightCanvas';
import MainContent from './mainContent';
import { tuple } from './utils/type';

import '../assets/style.less';

const Types = tuple('find', 'replace');
export type Type = typeof Types[number];

type RangeType = {
  index: number;
  name: string;
  color: string;
  length: number;
}

const Delta = Quill.import('delta');

export default class FindReplace {
  quill: any;
  options: any;
  container: HTMLDivElement;
  mainContent: MainContent | null;
  color: string;
  type: Type;
  index: number;
  value: string;
  data: RangeType[];
  highlightCanvas: HighlightCanvas;

  constructor(quill: any, options = {}) {
    this.quill = quill;
    this.options = options;
    this.color = 'rgb(245, 212, 122)';
    this.type = 'find';
    this.index = 0;
    this.value = '';
    this.data = [];
    this.container = this.buildContainer();
    this.mainContent = null;
    this.highlightCanvas = new HighlightCanvas(quill, { activeColor: '#accaec' });

    document.addEventListener('keydown', this.handleKeydown, false)
  }

  buildContainer() {
    const box = document.createElement('div');
    box.setAttribute('style', [
      'position: fixed',
      'z-index: 1',
      'top: 0',
      'left: 0',
      'pointer-events: none'
    ].join(';'));
    const container = document.createElement('div');
    container.classList.add('ql-find-replace-container', 'ql-hidden');
    container.setAttribute('style', [
      'position: absolute',
      `top: 10px`,
      `left: 10px`,
      'pointer-events: auto',
    ].join(';'));
    box.append(container);
    this.quill.container.append(box);
    return container;
  }

  handleKeydown = (oEvent: KeyboardEvent) => {
    oEvent = oEvent || window.event;
    const nKeyCode = oEvent.keyCode || oEvent.which || oEvent.charCode;
    const ctrlKeyCode = oEvent.ctrlKey || oEvent.metaKey;
    const isHide = this.container.classList.contains('ql-hidden');
    if (this.quill.hasFocus()) {
      let range = this.quill.getSelection();
      if (range) {
        let text = this.quill.getText(range).replace(/\n|\u21b5/g, '');
        if (text !== '' && text !== this.value) {
          this.value = text;
        }
      }
    }
    // F查找  H替换
    if (
      (nKeyCode === 70 && ctrlKeyCode) ||
      (nKeyCode === 72 && ctrlKeyCode)
    ) {
      oEvent.preventDefault();
      this.type = nKeyCode === 70 ? 'find' : 'replace';
      isHide ? (this.show()) : (this.render());
    }
  }

  onSearchChange = (value?: string) => {
    if (typeof value === 'string') this.value = value;
    this.data = this.highlightCanvas.searchMatchText({
      name: this.value,
      color: this.color,
    });
    this.render();
  }

  onTextChange = (() => {
    let time: NodeJS.Timeout | null = null;
    return () => {
      time && clearTimeout(time);
      if (!this.highlightCanvas.canvasIsClear) {
        this.highlightCanvas.clearCanvas();
      }
      time = setTimeout(this.onSearchChange, 1000);
    }
  })();

  onSelectionChange = (range: any) => {
    if (!range) return;
    let index = this.data.findIndex((item: RangeType) => {
      let start = item.index;
      let end = item.index + item.length;
      return range.index >= start && range.index + range.length <= end;
    });
    if (index >= 0) {
      this.onCutover(index);
      this.render();
    }
  }

  onCutover = (index: number) => {
    this.index = index;
    this.highlightCanvas.drawCanvasGroup(this.index, true);
  }

  onReplace = (value: string = '', range: RangeType | RangeType[]) => {
    if (Array.isArray(range)) {
      // 这里要先倒序然后再全部替换
      const allDelta = range.reverse().reduce((delta: any, item: RangeType) => {
        let format = this.quill.getFormat(item);
        return delta.compose(new Delta().retain(item.index).delete(item.length).insert(value, format));
      }, new Delta());
      this.quill.updateContents(allDelta, Quill.sources.user);
      this.quill.history.cutoff();
    } else {
      let format = this.quill.getFormat(range);
      this.quill.updateContents(
        new Delta().retain(range.index).delete(range.length).insert(value, format),
        Quill.sources.user
      );
    }
  }

  show = () => {
    this.container.classList.remove('ql-hidden');
    this.render();
    this.quill.on(this.quill.constructor.events.TEXT_CHANGE, this.onTextChange);
    this.quill.on(this.quill.constructor.events.SELECTION_CHANGE, this.onSelectionChange);
  }

  hide = () => {
    this.container.classList.add('ql-hidden');
    this.value = '';
    this.index = 0;
    this.data = [];
    this.quill.off(this.quill.constructor.events.TEXT_CHANGE, this.onTextChange);
    this.quill.off(this.quill.constructor.events.SELECTION_CHANGE, this.onSelectionChange);
    this.highlightCanvas.clear();
    this.render();
  }

  render() {
    const options = {
      value: this.value,
      index: this.index,
      data: this.data,
      type: this.type,
      onSearchChange: this.onSearchChange,
      onCutover: this.onCutover,
      onReplace: this.onReplace,
      onClose: this.hide
    }
    if (!this.mainContent) {
      this.mainContent = new MainContent(this.container, options);
      return;
    }
    this.mainContent.update(options);
  }

  destroy() {
    document.removeEventListener('keydown', this.handleKeydown);
    this.quill.off(this.quill.constructor.events.TEXT_CHANGE, this.onTextChange);
    this.quill.off(this.quill.constructor.events.SELECTION_CHANGE, this.onSelectionChange);
  }
}

if (window.Quill) {
  window.Quill.register('modules/findReplace', FindReplace);
}
