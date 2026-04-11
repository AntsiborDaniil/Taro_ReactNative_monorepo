const createPath = () => ({
  reset: () => undefined,
  moveTo: () => undefined,
  lineTo: () => undefined,
  cubicTo: () => undefined,
  close: () => undefined,
});

export default {};
export const Skia = {
  Path: {
    Make: createPath,
  },
  Typeface: {},
};
export const Canvas = () => null;
export const Path = () => null;
export const Fill = () => null;
export const Group = () => null;
export const Image = () => null;
export const LinearGradient = () => null;
export const useImage = () => null;
export const useFont = () => ({});
export const usePathValue = (fn: any, initialPath?: any) => {
  const path = initialPath ?? createPath();
  fn?.(path);
  return path;
};
export const useDerivedValue = (fn: any) => ({ value: fn() });
export const useSharedValue = (v: any) => ({ value: v });
export const vec = (x: number, y: number) => ({ x, y });
export const rect = () => ({});
export const rrect = () => ({});
