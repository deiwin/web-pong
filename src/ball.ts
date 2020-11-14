import { ViewportSize } from './viewport';

export interface BallState {
  velocity: Velocity;
}
interface Velocity {
  x: number;
  y: number;
}

export const initialBallState = { velocity: { x: 4, y: 8 } };

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
  velocity,
}: BallState): BallState => {
  const rect = ball.getBoundingClientRect();

  const shouldFlipHorizontally =
    (rect.right + velocity.x > viewportSize.width && velocity.x > 0) ||
    (rect.left + velocity.x < 0 && velocity.x < 0);
  const xMultiplier = shouldFlipHorizontally ? -1 : 1;

  const shouldFlipVertically =
    (rect.bottom + velocity.y > viewportSize.height && velocity.y > 0) ||
    (rect.top + velocity.y < 0 && velocity.y < 0);
  const yMultiplier = shouldFlipVertically ? -1 : 1;

  return {
    velocity: {
      x: xMultiplier * velocity.x,
      y: yMultiplier * velocity.y,
    },
  };
};

export const updateWorldBall = (ballState: BallState) => {
  ball.style.left = `${ball.offsetLeft + ballState.velocity.x}px`;
  ball.style.top = `${ball.offsetTop + ballState.velocity.y}px`;
};
