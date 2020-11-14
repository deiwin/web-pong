import { interval, animationFrameScheduler } from 'rxjs';
import { take, map, withLatestFrom, scan } from 'rxjs/operators';
import * as S from 'sanctuary';
import * as R from 'Ramda';

import { ControllerState, controllerStateObservable } from './controller';
import {
  PaddleState,
  initialPaddleState,
  updatePaddleState,
  updateWorldPaddle,
  paddleRect,
} from './paddle';
import { ViewportSize, viewportSizeObservable } from './viewport';
import {
  BallState,
  initialBallState,
  updateBallState,
  updateWorldBall,
  ballRect,
  forceDirection,
} from './ball';
import { collide } from './geo';

interface GameState {
  paddleState: PaddleState;
  ballState: BallState;
}

function detectCollision(gameState: GameState): GameState {
  const { paddleState, ballState } = gameState;
  if (collide(paddleRect(paddleState), ballRect(ballState))) {
    return R.evolve({ ballState: forceDirection(1) }, gameState);
  } else {
    return gameState;
  }
}

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
  return S.pipe([
    R.evolve({
      paddleState: updatePaddleState(timestamp, viewportSize, controllerState),
      ballState: updateBallState(timestamp, viewportSize),
    }),
    detectCollision,
  ])(gameState);
};

const updateWorld = ({ paddleState, ballState }: GameState) => {
  updateWorldPaddle(paddleState);
  updateWorldBall(ballState);
};

const initialGameState: GameState = {
  paddleState: initialPaddleState,
  ballState: initialBallState,
};

const ticks = interval(0, animationFrameScheduler).pipe(take(5000));

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
