export type HighlightCanvasOptionsType = {
  defaultBackground: string;
  activeBackground: string;
}

export type HighlightInfoType = {
  name: string;
}

export type CanvasType = HTMLCanvasElement & {
  ctx2D: CanvasRenderingContext2D;
}