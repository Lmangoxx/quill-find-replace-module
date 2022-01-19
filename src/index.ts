import Quill from 'quill';
import HighlightCanvas from './highlightCanvas';
import MainContent from './mainContent';
import { Type, RangeType, OptionsType } from './types'

import '../assets/style.less';

const Delta = Quill.import('delta');

export default class FindReplace {
  static DEFAULTS: OptionsType;

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
    console.log(this.options);
    this.color = 'rgb(245, 212, 122)';
    this.type = 'find';
    this.index = 0;
    this.value = '';
    this.data = [];
    this.container = this.buildContainer();
    this.mainContent = null;
    this.highlightCanvas = new HighlightCanvas(quill, {
      defaultBackground: this.options.resultBackground,
      activeBackground: this.options.activeResultBackground
    });

    // 添加查找替换唤起快捷键
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
    if (this.options.customClass) {
      container.classList.add(this.options.customClass)
    }
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
      isHide
        ? (this.show())
        : (this.render());
    }
  }

  onSearchChange = (value?: string) => {
    if (typeof value === 'string') this.value = value;
    this.data = this.highlightCanvas.searchMatchText({
      name: this.value,
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
      preIcon: this.options.resultPreIcon,
      nextIcon: this.options.resultNextIcon,
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

FindReplace.DEFAULTS = {
  customClass: '',
  resultBackground: 'rgb(245, 212, 122)',
  activeResultBackground: '#accaec',
  resultPreIcon: '<svg t="1642574082983" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="2154" width="18" height="18"><path d="M512 85.333333a426.666667 426.666667 0 1 0 426.666667 426.666667A427.136 427.136 0 0 0 512 85.333333z m0 810.666667a384 384 0 1 1 384-384 384.426667 384.426667 0 0 1-384 384z" fill="#999999" p-id="2155"></path><path d="M592.064 348.629333a21.269333 21.269333 0 0 0-30.101333-2.026666l-170.666667 149.333333a21.333333 21.333333 0 0 0 0 32.128l170.666667 149.333333a21.333333 21.333333 0 1 0 28.074666-32.128L437.717333 512l152.32-133.269333a21.333333 21.333333 0 0 0 2.026667-30.101334z" fill="#999999" p-id="2156"></path></svg>',
  resultNextIcon: '<svg t="1642574011426" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1979" width="18" height="18"><path d="M512 85.333333a426.666667 426.666667 0 1 0 426.666667 426.666667A427.136 427.136 0 0 0 512 85.333333z m0 810.666667a384 384 0 1 1 384-384 384.426667 384.426667 0 0 1-384 384z" fill="#999999" p-id="1980"></path><path d="M462.037333 346.602667a21.333333 21.333333 0 1 0-28.074666 32.128L586.282667 512l-152.32 133.269333a21.333333 21.333333 0 0 0 28.074666 32.128l170.666667-149.333333a21.333333 21.333333 0 0 0 0-32.128z" fill="#999999" p-id="1981"></path></svg>'
}

if (window.Quill) {
  window.Quill.register('modules/findReplace', FindReplace);
}
