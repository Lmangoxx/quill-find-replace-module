declare module 'quill';

declare interface Window {
  Quill: any;
}

declare interface String {
  getIndicesOf(searchStr: string): any;
}
