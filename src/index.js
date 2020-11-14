import { interval, fromEvent } from 'rxjs';
import { take, map, startWith, withLatestFrom } from 'rxjs/operators';

function createBallElement() {
  const element = document.createElement('div');
  element.style.width = '25px';
  element.style.height = '25px';
  element.style.borderRadius = '12px';
  element.style.backgroundColor = 'red';
  element.style.position = 'absolute';
  return element;
}

const getViewportWidth = () =>
  Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
const getViewportHeight = () =>
  Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0);

const ball = createBallElement();
document.body.appendChild(ball);

const viewportStateObservable = fromEvent(window, 'resize').pipe(
  startWith({}),
  map(_ => ({height: getViewportHeight(), width: getViewportWidth()}))
);


var velocity = {x: 4, y: 8};
const ticks = interval(10).pipe(
  take(1000),
  withLatestFrom(viewportStateObservable)
);
ticks.subscribe(([_, viewportState]) => {
  const rect = ball.getBoundingClientRect();
  const shouldFlipHorizontally =
    (rect.right + velocity.x > viewportState.width && velocity.x > 0) ||
    (rect.left + velocity.x < 0 && velocity.x < 0)
  if (shouldFlipHorizontally) {
    velocity.x *= -1;
  }
  const shouldFlipVertically =
    (rect.bottom + velocity.y > viewportState.height && velocity.y > 0) ||
    (rect.top + velocity.y < 0 && velocity.y < 0)
  if (shouldFlipVertically) {
    velocity.y *= -1;
  }
  ball.style.left = `${ball.offsetLeft + velocity.x}px`;
  ball.style.top = `${ball.offsetTop + velocity.y}px`;
});
