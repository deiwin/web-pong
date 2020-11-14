import { fromEvent } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

export interface ViewportSize {
  height: number;
  width: number;
}

const getViewportSize = (): ViewportSize => ({
  height: Math.max(
    document.documentElement.clientHeight || 0,
    window.innerHeight || 0
  ),
  width: Math.max(
    document.documentElement.clientWidth || 0,
    window.innerWidth || 0
  ),
});

export const viewportSizeObservable = fromEvent(window, 'resize').pipe(
  startWith({}),
  map((_) => getViewportSize())
);
