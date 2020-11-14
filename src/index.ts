import { interval, fromEvent, animationFrameScheduler } from 'rxjs';
import { take, map, startWith, withLatestFrom, scan } from 'rxjs/operators';
import * as S from 'sanctuary';
import * as R from 'Ramda';

import {
  ControllerState,
  controllerStateObservable,
  totalControllerTimes,
  totalTimeDiff,
} from './controller';

interface GameState {
  paddleState: PaddleState;
  velocity: Velocity;
}

interface PaddleState {
  top: number;
  appliedButtonPressTimes: { [key: string]: number };
}

interface Velocity {
  x: number;
  y: number;
}

interface ViewportSize {
  height: number;
  width: number;
}

function createBallElement(): HTMLElement {
  const element = document.createElement('div');
  element.style.width = '25px';
  element.style.height = '25px';
  element.style.borderRadius = '12px';
  element.style.backgroundColor = 'red';
  element.style.position = 'absolute';
  return element;
}

function createPaddle(): HTMLElement {
  const element = document.createElement('div');
  element.style.width = '15px';
  element.style.height = '75px';
  element.style.backgroundColor = 'blue';
  element.style.position = 'absolute';
  return element;
}
const leftPaddle = createPaddle();
leftPaddle.style.left = '0px';
leftPaddle.style.top = '0px';
document.body.appendChild(leftPaddle);

const paddleSpeed = 0.5;

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

const updateGameState = (
  gameState: GameState,
  {
    timestamp,
    viewportSize,
    controllerState,
  }: {
    timestamp: number;
    viewportSize: ViewportSize;
    controllerState: ControllerState;
  }
): GameState => {
  return R.evolve(
    {
      paddleState: updatePaddleState(timestamp, viewportSize, controllerState),
      velocity: updateVelocity(viewportSize),
    },
    gameState
  );
};

const updatePaddleState = (
  timestamp: number,
  viewportSize: ViewportSize,
  controllerState: ControllerState
) => (paddleState: PaddleState): PaddleState => {
  const buttonPressesToApply = totalControllerTimes(timestamp, controllerState);
  const diff = totalTimeDiff({
    old: paddleState.appliedButtonPressTimes,
    next: buttonPressesToApply,
  });
  const newTop = S.pipe([
    R.defaultTo(0),
    S.add(diff * paddleSpeed),
    S.max(0),
    S.min(viewportSize.height - leftPaddle.offsetHeight),
  ])(paddleState.top);
  return {
    top: newTop,
    appliedButtonPressTimes: buttonPressesToApply,
  };
};

const updateVelocity = (viewportSize: ViewportSize) => (
  velocity: Velocity
): Velocity => {
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
    x: xMultiplier * velocity.x,
    y: yMultiplier * velocity.y,
  };
};

const updateWorld = ({ paddleState, velocity }: GameState) => {
  leftPaddle.style.top = `${Math.round(paddleState.top)}px`;
  ball.style.left = `${ball.offsetLeft + velocity.x}px`;
  ball.style.top = `${ball.offsetTop + velocity.y}px`;
};

const ball = createBallElement();
document.body.appendChild(ball);

const initialGameState: GameState = {
  paddleState: { top: 0, appliedButtonPressTimes: {} },
  velocity: { x: 4, y: 8 },
};

const ticks = interval(0, animationFrameScheduler).pipe(take(1000));
const viewportSizeObservable = fromEvent(window, 'resize').pipe(
  startWith({}),
  map((_) => getViewportSize())
);

ticks
  .pipe(
    map(() => window.performance.now()),
    withLatestFrom(viewportSizeObservable, controllerStateObservable),
    map(([timestamp, viewportSize, controllerState]) => ({
      timestamp,
      viewportSize,
      controllerState,
    })),
    scan(updateGameState, initialGameState)
  )
  .subscribe(updateWorld);
