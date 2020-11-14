import { ViewportSize } from './viewport';

export interface BallState {
  topLeft: Point;
  velocity: Velocity;
}
interface Point {
  x: number;
  y: number;
}
interface Velocity {
  x: number;
  y: number;
}

export const initialBallState = {
  topLeft: { x: 0, y: 0 },
  velocity: { x: 4, y: 8 },
};

function createBallElement(): HTMLElement {
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

export const updateBallState = (viewportSize: ViewportSize) => ({
  topLeft,
  velocity,
}: BallState): BallState => {
  const left = topLeft.x;
  const right = left + ball.offsetWidth;
  const top = topLeft.y;
  const bottom = top + ball.offsetHeight;

  const shouldFlipHorizontally =
    (right + velocity.x > viewportSize.width && velocity.x > 0) ||
    (left + velocity.x < 0 && velocity.x < 0);
  const xMultiplier = shouldFlipHorizontally ? -1 : 1;

  const shouldFlipVertically =
    (bottom + velocity.y > viewportSize.height && velocity.y > 0) ||
    (top + velocity.y < 0 && velocity.y < 0);
  const yMultiplier = shouldFlipVertically ? -1 : 1;

  return {
    topLeft: {
      x: topLeft.x + xMultiplier * velocity.x,
      y: topLeft.y + yMultiplier * velocity.y,
    },
    velocity: {
      x: xMultiplier * velocity.x,
      y: yMultiplier * velocity.y,
    },
  };
};

export const updateWorldBall = ({ topLeft: { x, y } }: BallState) => {
  ball.style.left = `${x}px`;
  ball.style.top = `${y}px`;
};
