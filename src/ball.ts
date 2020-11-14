import * as S from 'sanctuary';
import * as R from 'Ramda';

import { ViewportSize } from './viewport';
import { Rect } from './geo';

interface Maybe<A> {
  '@@type': 'sanctuary/Maybe';
}

export interface BallState {
  lastUpdateTimestamp: Maybe<number>;
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
  lastUpdateTimestamp: S.Nothing,
  topLeft: { x: 0, y: 0 },
  velocity: { x: 0.3, y: 0.1 },
};

export function ballRect({ topLeft: { x, y } }: BallState): Rect {
  return {
    x,
    y,
    width: ball.offsetWidth,
    height: ball.offsetHeight,
  };
}

const chooseSelfOrInverse = (chooser: (x: number) => (x: number) => number) => (
  x: number
) => {
  return chooser(x)(-1 * x);
};
export const forceDirection = (direction: number) => (
  ballState: BallState
): BallState => {
  const chooser = direction > 0 ? S.max : S.min;
  return R.evolve({ velocity: { x: chooseSelfOrInverse(chooser) } }, ballState);
};

function createBallElement(): HTMLElement {
  const element = document.createElement('div');
  element.style.width = '25px';
  element.style.height = '25px';
  element.style.borderRadius = '12px';
  element.style.backgroundColor = 'red';
  element.style.position = 'absolute';
  element.style.left = '0px';
  element.style.top = '0px';
  return element;
}
const ball = createBallElement();
document.body.appendChild(ball);

export const updateBallState = (
  timestamp: number,
  viewportSize: ViewportSize
) => ({ lastUpdateTimestamp, topLeft, velocity }: BallState): BallState => {
  const timeDiff: number = S.maybe(0)(S.flip(S.sub)(timestamp))(
    lastUpdateTimestamp
  );

  const left = topLeft.x;
  const right = left + ball.offsetWidth;
  const top = topLeft.y;
  const bottom = top + ball.offsetHeight;

  const shouldFlipHorizontally =
    right + velocity.x * timeDiff > viewportSize.width && velocity.x > 0;
  const xMultiplier = shouldFlipHorizontally ? -1 : 1;

  const shouldFlipVertically =
    (bottom + velocity.y * timeDiff > viewportSize.height && velocity.y > 0) ||
    (top + velocity.y * timeDiff < 0 && velocity.y < 0);
  const yMultiplier = shouldFlipVertically ? -1 : 1;

  const newVelocity = {
    x: xMultiplier * velocity.x,
    y: yMultiplier * velocity.y,
  };

  return {
    lastUpdateTimestamp: S.Just(timestamp),
    topLeft: {
      x: topLeft.x + newVelocity.x * timeDiff,
      y: topLeft.y + newVelocity.y * timeDiff,
    },
    velocity: newVelocity,
  };
};

export const updateWorldBall = ({ topLeft: { x, y } }: BallState) => {
  // prettier-ignore
  ball.style.transform = `translateX(${Math.round(x)}px) translateY(${Math.round(y)}px)`;
};
