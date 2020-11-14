import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

function createBallElement() {
  const element = document.createElement('div');
  element.style.width = '25px';
  element.style.height = '25px';
  element.style.borderRadius = '12px';
  element.style.backgroundColor = 'red';
  element.style.position = 'absolute';
  return element;
}
const ball = createBallElement();
document.body.appendChild(ball);

var velocity = {x: 4, y: 8};
const ticks = interval(10).pipe(take(1000));
ticks.subscribe(_ => {
  const rect = ball.getBoundingClientRect();
  const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0)
  if (rect.right + velocity.x > vw || rect.left + velocity.x < 0) {
    velocity.x *= -1;
  }
  if (rect.bottom + velocity.y > vh || rect.top + velocity.y < 0) {
    velocity.y *= -1;
  }
  ball.style.left = `${ball.offsetLeft + velocity.x}px`;
  ball.style.top = `${ball.offsetTop + velocity.y}px`;
});
