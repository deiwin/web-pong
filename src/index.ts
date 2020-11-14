import { interval, fromEvent, animationFrameScheduler, NEVER } from 'rxjs';
import { take, map, startWith, withLatestFrom, scan, merge, filter } from 'rxjs/operators';
import * as S from 'sanctuary';
import * as R from 'Ramda';

interface Maybe<A> {
  '@@type': 'sanctuary/Maybe';
}

interface GameState {
  paddleState: PaddleState;
  velocity: Velocity;
}

interface PaddleState {
  top: number;
  appliedButtonPressTimes: { [key:string]: number };
};

interface Velocity {
  x: number;
  y: number;
}

interface ViewportSize {
  height: number;
  width: number;
}

type ControllerState = { [key:string]:ButtonState; };

interface ButtonState {
  realizedPressTime: number;
  keyDownSince: Maybe<number>;
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

function includes<T>(val: T): (arr: Array<T>) => boolean {
  return S.any(S.equals(val));
}
function isRelevantKey(event: Event): boolean {
  return includes((event as KeyboardEvent).code)(['ArrowDown', 'ArrowUp']);
}

function updateControllerState(acc: ControllerState, event: Event): ControllerState {
  const keyboardEvent = event as KeyboardEvent
  const keyDownSinceLens = R.lensPath([keyboardEvent.code, 'keyDownSince']);

  if (keyboardEvent.type == 'keydown') {
    const setTimestampIfUnset: ((x: Maybe<number> | undefined) => Maybe<number>) = S.pipe([
      R.defaultTo(S.Nothing),
      S.fromMaybe(event.timeStamp),
      S.Just
    ]);

    return R.over(keyDownSinceLens, setTimestampIfUnset, acc);
  } else if (keyboardEvent.type == 'keyup') {
    const realizedTimeLens = R.lensPath([keyboardEvent.code, 'realizedPressTime']);
    const realizedTime = S.pipe([
      R.view(keyDownSinceLens),
      R.defaultTo(S.Nothing),
      S.maybe(0)(S.flip(S.sub)(event.timeStamp))
    ])(acc);
    return S.pipe([
      R.over(realizedTimeLens, S.pipe([R.defaultTo(0), S.add(realizedTime)])),
      R.set(keyDownSinceLens, S.Nothing),
    ])(acc);
  }
  console.error('Unexpected!');
  return acc;
}

const initialControllerState = {};
const controllerStateObservable = NEVER.pipe(
  merge(fromEvent(document, 'keydown'), fromEvent(document, 'keyup')),
  filter(isRelevantKey),
  scan(updateControllerState, initialControllerState),
  startWith(initialControllerState)
)

const getViewportSize = (): ViewportSize => ({
  height: Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0),
  width: Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0)
});

const updateGameState = (
  gameState: GameState,
  {timestamp, viewportSize, controllerState}: {timestamp: number, viewportSize: ViewportSize, controllerState: ControllerState}
): GameState => {
  return R.evolve({
    paddleState: updatePaddleState(timestamp, viewportSize, controllerState),
    velocity: updateVelocity(viewportSize)
  }, gameState);
};

const updatePaddleState =
  (timestamp: number, viewportSize: ViewportSize, controllerState: ControllerState) =>
  (paddleState: PaddleState): PaddleState => {
  const calculateTimeToApply = ({realizedPressTime, keyDownSince}: ButtonState) => {
    const unrealizedTime = S.maybe(0)(S.flip(S.sub)(timestamp))(keyDownSince)
    return R.defaultTo(0, realizedPressTime) + unrealizedTime;
  };
  const buttonPressesToApply = S.map(calculateTimeToApply)(controllerState);
  const timeDeltas = R.mergeWith(R.subtract, buttonPressesToApply, paddleState.appliedButtonPressTimes);
  const totalTimeDiff = R.defaultTo(0, timeDeltas['ArrowDown']) + (-1 * R.defaultTo(0, timeDeltas['ArrowUp']));
  const newTop = S.pipe([
    R.defaultTo(0),
    S.add(totalTimeDiff * paddleSpeed),
    S.max(0),
    S.min(viewportSize.height - leftPaddle.offsetHeight)
  ])(paddleState.top);
  return {
    top: newTop,
    appliedButtonPressTimes: buttonPressesToApply,
  };
};

const updateVelocity = (viewportSize: ViewportSize) => (velocity: Velocity): Velocity => {
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

const updateWorld = ({paddleState, velocity}: GameState) => {
  leftPaddle.style.top = `${Math.round(paddleState.top)}px`;
  ball.style.left = `${ball.offsetLeft + velocity.x}px`;
  ball.style.top = `${ball.offsetTop + velocity.y}px`;
};

const ball = createBallElement();
document.body.appendChild(ball);

const initialGameState: GameState = {
  paddleState: {top: 0, appliedButtonPressTimes: {}},
  velocity: {x: 4, y: 8}
};

const ticks = interval(0, animationFrameScheduler).pipe(take(1000));
const viewportSizeObservable = fromEvent(window, 'resize').pipe(
  startWith({}),
  map(_ => getViewportSize())
);

ticks.pipe(
  map(() => window.performance.now()),
  withLatestFrom(viewportSizeObservable, controllerStateObservable),
  map(([timestamp, viewportSize, controllerState]) => ({timestamp, viewportSize, controllerState})),
  scan(updateGameState, initialGameState)
).subscribe(updateWorld);
