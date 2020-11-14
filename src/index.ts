import { interval, fromEvent } from 'rxjs';
import { take, map, startWith, withLatestFrom, scan } from 'rxjs/operators';

interface Velocity {
  x: number;
  y: number;
}

interface ViewportSize {
  height: number;
  width: number;
}

function createBallElement() {
  const element = document.createElement('div');
  element.style.width = '25px';
  element.style.height = '25px';
  element.style.borderRadius = '12px';
  element.style.backgroundColor = 'red';
  element.style.position = 'absolute';
  return element;
}

const getViewportSize = (): ViewportSize => ({
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
});

const updateVelocity = (velocity: Velocity, viewportSize: ViewportSize): Velocity => {
  const rect = ball.getBoundingClientRect();

  const shouldFlipHorizontally =
    (rect.right + velocity.x > viewportSize.width && velocity.x > 0) ||
    (rect.left + velocity.x < 0 && velocity.x < 0)
  const xMultiplier = shouldFlipHorizontally ? -1 : 1;

  const shouldFlipVertically =
    (rect.bottom + velocity.y > viewportSize.height && velocity.y > 0) ||
    (rect.top + velocity.y < 0 && velocity.y < 0)
  const yMultiplier = shouldFlipVertically ? -1 : 1;

  return {
    x: xMultiplier * velocity.x,
    y: yMultiplier * velocity.y,
  }
};

const updateWorld = (velocity: Velocity) => {
  ball.style.left = `${ball.offsetLeft + velocity.x}px`;
  ball.style.top = `${ball.offsetTop + velocity.y}px`;
};

const ball = createBallElement();
document.body.appendChild(ball);

const initialVelocity: Velocity = {x: 4, y: 8};

const ticks = interval(10).pipe(take(1000));
const viewportSizeObservable = fromEvent(window, 'resize').pipe(
  startWith({}),
  map(_ => getViewportSize())
);

ticks.pipe(
  withLatestFrom(viewportSizeObservable),
  map(([_, viewportSize]) => viewportSize),
  scan(updateVelocity, initialVelocity)
).subscribe(updateWorld);
