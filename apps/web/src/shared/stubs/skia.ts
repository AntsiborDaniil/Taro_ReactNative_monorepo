import React from 'react';

const makePath = () => ({
  reset: () => {},
  moveTo: () => {},
  lineTo: () => {},
  cubicTo: () => {},
  quadTo: () => {},
  close: () => {},
  op: () => false,
  copy: () => makePath(),
  toSVGString: () => '',
  isEmpty: () => true,
  getBounds: () => ({ x: 0, y: 0, width: 0, height: 0 }),
});

export const Skia = {
  Path: { Make: makePath },
  Color: (color: string) => color,
  Point: (x: number, y: number) => ({ x, y }),
  Matrix: () => ({}),
  RuntimeEffect: { Make: () => null },
  Shader: { MakeColor: () => null },
  Paint: () => ({}),
};

// Canvas components — render nothing on web
export const Canvas = ({ children, ...props }: any) => null;
export const Path = () => null;
export const Fill = () => null;
export const Group = () => null;
export const Image = () => null;
export const LinearGradient = () => null;
export const RadialGradient = () => null;
export const Circle = () => null;
export const Rect = () => null;
export const Text = () => null;
export const Blur = () => null;
export const ColorMatrix = () => null;

// Hooks
export const useImage = () => null;
export const useFont = () => null;
// usePathValue returns the initial path so Skia.Path.Make() result flows through safely
export const usePathValue = (_fn: any, initial?: any) =>
  initial !== undefined ? initial : makePath();
export const useDerivedValue = (fn: any) => {
  try {
    return { value: fn() };
  } catch {
    return { value: null };
  }
};
export const useSharedValue = (v: any) => ({ value: v });
export const useComputedValue = (fn: any) => {
  try {
    return { value: fn() };
  } catch {
    return { value: null };
  }
};
export const usePaintRef = () => ({ current: null });
export const useCanvasRef = () => ({ current: null });

// Geometry helpers
export const vec = (x: number, y: number) => ({ x, y });
export const rect = (x: number, y: number, w: number, h: number) => ({
  x,
  y,
  width: w,
  height: h,
});
export const rrect = (r: any, rx: number, ry: number) => ({ rect: r, rx, ry });

// Types re-exported as values (needed for instanceof checks)
export type SkPath = ReturnType<typeof makePath>;
export type SkPoint = { x: number; y: number };
export type SkRect = { x: number; y: number; width: number; height: number };
export type SkFont = null;
export type SkImage = null;

export default {
  Skia,
  Canvas,
  Path,
  Fill,
  Group,
  Image,
  LinearGradient,
  vec,
  rect,
  rrect,
  usePathValue,
  useSharedValue,
  useDerivedValue,
};
