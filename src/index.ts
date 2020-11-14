import { interval, animationFrameScheduler } from 'rxjs';
import { take, map, withLatestFrom, scan } from 'rxjs/operators';
import * as R from 'Ramda';

import { ControllerState, controllerStateObservable } from './controller';
import {
  PaddleState,
  initialPaddleState,
  updatePaddleState,
  updateWorldPaddle,
} from './paddle';
import { ViewportSize, viewportSizeObservable } from './viewport';
import {
  BallState,
  initialBallState,
  updateBallState,
  updateWorldBall,
} from './ball';

interface GameState {
  paddleState: PaddleState;
  ballState: BallState;
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
  return R.evolve(
    {
      paddleState: updatePaddleState(timestamp, viewportSize, controllerState),
      ballState: updateBallState(viewportSize),
    },
    gameState
  );
};

const updateWorld = ({ paddleState, ballState }: GameState) => {
  updateWorldPaddle(paddleState);
  updateWorldBall(ballState);
};

const initialGameState: GameState = {
  paddleState: initialPaddleState,
  ballState: initialBallState,
};

const ticks = interval(0, animationFrameScheduler).pipe(take(1000));

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
