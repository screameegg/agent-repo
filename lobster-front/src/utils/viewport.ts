export const DESKTOP_EDITOR_MIN_WIDTH = 768;

export function shouldShowDesktopEditor(width: number, minWidth = DESKTOP_EDITOR_MIN_WIDTH) {
  return width >= minWidth;
}
