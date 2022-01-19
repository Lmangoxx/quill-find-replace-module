import { tuple } from '../utils/type';

const Types = tuple('find', 'replace');
export type Type = typeof Types[number];

export type RangeType = {
  index: number;
  name: string;
  length: number;
}

export type OptionsType = {
  customClass?: string; // 搜索框自定义类名
  resultBackground?: string; // 搜索结果背景
  activeResultBackground?: string; // 选中搜索结果背景
  resultPreIcon?: string; // 搜索结果“上一个”按钮图标
  resultNextIcon?: string; // 搜索结果“下一个”按钮图标
}