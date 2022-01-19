import { Type, RangeType } from './types';

type PropsType = {
  preIcon: string;
  nextIcon: string;
  type: Type;
  value: string;
  data: RangeType[];
  index: number;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onCutover: (index: number) => void;
};

export default class MainContent {
  public static readonly NAMESPACE_CLASS: string = 'find-replace';

  public readonly root: any;
  public props: PropsType;

  private _isMoving: boolean;
  private _moveStartClient: number[];
  private _constructorPosition: number[];

  public constructor(container: HTMLElement, props: PropsType) {
    this.props = props;
    this.root = this._render(container);
    this._isMoving = false;
    this._moveStartClient = [0, 0];
    this._constructorPosition = [0, 0];

    this._onValueChange();
  }

  // 搜索文本发现改变时触发
  private _onValueChange: () => void = (() => {
    let time: NodeJS.Timeout | null = null;
    return () => {
      if (time) {
        clearTimeout(time);
        time = null;
      }
      time = setTimeout(() => {
        this.props.onSearchChange(this.props.value);
      }, 1000);
    }
  })();

  // 渲染查找替换框拖动标签
  private _renderMoveBox(): HTMLElement {
    const el = document.createElement('DIV');
    el.classList.add(`${MainContent.NAMESPACE_CLASS}--move`);
    
    const getElPosition = (el: HTMLElement, name: string) => {
      return parseInt(el.style[name]?.replace(/px/, '') || '0');
    };

    el.addEventListener('mousedown', (e: any) => {
      this._isMoving = true;
      this._moveStartClient = [e.clientX, e.clientY];
      this._constructorPosition = [
        getElPosition(this.root, 'left'),
        getElPosition(this.root, 'top')
      ];
      this.root.classList.add('move-active');
    });

    document.addEventListener('mousemove', (e: MouseEvent) => {
      if (this._isMoving) {
        const bodyW = document.documentElement.clientWidth;
        const bodyH = document.documentElement.clientHeight;
        let changeLeft = e.clientX - this._moveStartClient[0];
        let changeTop = e.clientY - this._moveStartClient[1];
        let left = this._constructorPosition[0] + changeLeft;
        let top = this._constructorPosition[1] + changeTop;
        if (left <= 10) left = 10;
        if (left + this.root.offsetWidth + 10 >= bodyW) {
          left = bodyW - this.root.offsetWidth - 10;
        }
        if (top <= 10) top = 10;
        if (top + this.root.offsetHeight + 10 >= bodyH) {
          top = bodyH - this.root.offsetHeight - 10;
        }
        this.root.style.left = left + 'px';
        this.root.style.top = top + 'px';
      }
    });

    el.addEventListener('mouseup', () => {
      this._isMoving = false;
      this._moveStartClient = [0, 0];
      this._constructorPosition = [
        getElPosition(this.root, 'left'),
        getElPosition(this.root, 'top'),
      ];
      this.root.classList.remove('move-active');
    });

    return el;
  }

  // 渲染查找替换框关闭按钮
  private _renderCloseBox(): HTMLElement {
    const el = document.createElement('SPAN');
    el.classList.add(`${MainContent.NAMESPACE_CLASS}--close`);
    el.addEventListener('click', this.props.onClose, false);
    return el;
  }

  // 渲染查找功能框
  private _renderFindBox(): HTMLElement {
    const el: any = document.createElement('DIV');
    el.classList.add(`${MainContent.NAMESPACE_CLASS}--find`);

    const btnEl = document.createElement('BUTTON') as HTMLElement;
    btnEl.classList.add(`${MainContent.NAMESPACE_CLASS}--find-button`);
    btnEl.innerHTML = '查找';
    btnEl.addEventListener('click', () => {
      let _type: Type = this.props.type === 'find' ? 'replace' : 'find';
      this.props.type = _type;
    });
    el.btnEl = btnEl;

    const inputEl = document.createElement('INPUT') as HTMLInputElement;
    inputEl.classList.add(`${MainContent.NAMESPACE_CLASS}--find-input`);
    inputEl.value = this.props.value;
    inputEl.autocomplete = 'off';
    inputEl.autocapitalize = 'off';
    inputEl.spellcheck = false;
    inputEl.placeholder = '请输入查找内容';
    inputEl.addEventListener('input', (e: any) => {
      this.props.value = e.target.value;
      this._onValueChange();
    });
    inputEl.addEventListener('keydown', this._findInputKeyDown);
    this._findInputFocus();
    el.inputEl = inputEl;

    const resultEl = this._renderFindResult();
    el.resultEl = resultEl;

    el.append(btnEl, inputEl, resultEl);

    return el;
  }

  private _renderFindResult(): HTMLElement {
    const resultEl: any = document.createElement('DIV');
    resultEl.classList.add(`${MainContent.NAMESPACE_CLASS}--find-result`);

    resultEl.preBtn = document.createElement('SPAN');
    resultEl.preBtn.classList.add('result-action-item', 'result-pre');
    resultEl.preBtn.innerHTML = this.props.preIcon;
    resultEl.preBtn.addEventListener('click', () => this._onArrowClick(-1))

    resultEl.text = document.createElement('SPAN');
    resultEl.text.classList.add('result-text');

    resultEl.nextBtn = document.createElement('SPAN');
    resultEl.nextBtn.classList.add('result-action-item', 'result-next');
    resultEl.nextBtn.innerHTML = this.props.nextIcon;
    resultEl.nextBtn.addEventListener('click', () => this._onArrowClick(1))

    resultEl.append(resultEl.preBtn, resultEl.text, resultEl.nextBtn);

    return resultEl;
  }

  private _updateFindResult() {
    const resultEl = this.root.findBox.resultEl

    if (!resultEl) return

    if (this.props.value) {
      if (this.props.data.length) {
        resultEl.text.innerHTML = `${this.props.index + 1}/${this.props.data.length}`
      } else {
        resultEl.text.innerHTML = '未找到'
      }
      resultEl.classList.toggle('no-found', !this.props.data.length)
      resultEl.classList.toggle('found', this.props.data.length)
    } else {
      resultEl.classList.toggle('no-found', false)
      resultEl.classList.toggle('found', false)
      resultEl.text.innerHTML = ''
    }
  }

  private _onArrowClick (value: 1 | -1) {
    let i = this.props.index + value;
    if (i < 0) {
      i = this.props.data.length - 1;
    }
    if (i >= this.props.data.length) {
      i = 0;
    }
    this.props.index = i;
    this._updateFindResult();
    this.props.onCutover(i);
  }

  // 查找输入框获取焦点
  private _findInputFocus():void {
    setTimeout(() => {
      const inputEl = this.root.findBox.inputEl;
      inputEl && inputEl.focus();
    });
  }

  private _findInputKeyDown = (e: KeyboardEvent) => {
    const oEvent = e || window.event;
    if (oEvent.keyCode === 13 && this.props.data.length) {
      this._onArrowClick(1)
    }
  };

  // 渲染查找替换功能框
  private _render(parentContainer: any): HTMLElement {
    // 渲染moveBox
    parentContainer.moveBox = this._renderMoveBox();

    // 渲染关闭按钮
    parentContainer.closeBox = this._renderCloseBox();

    // 渲染查找Box
    parentContainer.findBox = this._renderFindBox();

    parentContainer.append(
      parentContainer.moveBox,
      parentContainer.closeBox,
      parentContainer.findBox
    );
    
    return parentContainer;
  }

  // 更新查找替换框
  public update(props: PropsType) {
    if (this.props.value !== props.value) {
      this.root.findBox.inputEl.value = props.value;
      this._onValueChange();
    }

    Object.assign(this.props, props);

    this._findInputFocus();
    this._updateFindResult();
  }
}