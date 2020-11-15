import { interval, animationFrameScheduler } from 'rxjs';
import {
  take,
  map,
  withLatestFrom,
  scan,
  tap,
  takeWhile,
} from 'rxjs/operators';
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
  gameOver: boolean;
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

const detectGameOver = ({ width, height }: ViewportSize) => (
  gameState: GameState
): GameState => {
  const { ballState } = gameState;
  const viewportRect = { x: 0, y: 0, width, height };
  return R.assoc(
    'gameOver',
    !collide(viewportRect, ballRect(ballState)),
    gameState
  );
};

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
    detectGameOver(viewportSize),
  ])(gameState);
};

const updateWorld = ({ gameOver, paddleState, ballState }: GameState) => {
  if (gameOver) {
    document.body.innerText = 'Game Over!';
  } else {
    updateWorldPaddle(paddleState);
    updateWorldBall(ballState);
  }
};

const initialGameState: GameState = {
  gameOver: false,
  paddleState: initialPaddleState,
  ballState: initialBallState,
};

interval(0, animationFrameScheduler)
  .pipe(
    map(() => window.performance.now()),
    withLatestFrom(viewportSizeObservable, controllerStateObservable),
    map(([timestamp, viewportSize, controllerState]) => ({
      timestamp,
      viewportSize,
      controllerState,
    })),
    scan(updateGameState, initialGameState),
    tap(updateWorld),
    takeWhile(({ gameOver }) => !gameOver)
  )
  .subscribe();
