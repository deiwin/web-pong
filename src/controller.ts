import { fromEvent, NEVER } from 'rxjs';
import { startWith, scan, merge, filter } from 'rxjs/operators';
import * as S from 'sanctuary';
import * as R from 'Ramda';

interface Maybe<A> {
  '@@type': 'sanctuary/Maybe';
}
export type ControllerState = { [key: string]: ButtonState };
interface ButtonState {
  realizedPressTime: number;
  keyDownSince: Maybe<number>;
}

const calculateTimeToApply = (timestamp: number) => ({
  realizedPressTime,
  keyDownSince,
}: ButtonState): number => {
  const unrealizedTime = S.maybe(0)(S.flip(S.sub)(timestamp))(keyDownSince);
  return R.defaultTo(0, realizedPressTime) + unrealizedTime;
};
export function calculateTotalControllerTimes(
  timestamp: number,
  controllerState: ControllerState
): { [key: string]: number } {
  return S.map(calculateTimeToApply(timestamp))(controllerState);
}

function includes<T>(val: T): (arr: Array<T>) => boolean {
  return S.any(S.equals(val));
}
function isRelevantKey(event: Event): boolean {
  return includes((event as KeyboardEvent).code)(['ArrowDown', 'ArrowUp']);
}

function updateControllerState(
  acc: ControllerState,
  event: Event
): ControllerState {
  const keyboardEvent = event as KeyboardEvent;
  const keyDownSinceLens = R.lensPath([keyboardEvent.code, 'keyDownSince']);

  if (keyboardEvent.type == 'keydown') {
    const setTimestampIfUnset: (
      x: Maybe<number> | undefined
    ) => Maybe<number> = S.pipe([
      R.defaultTo(S.Nothing),
      S.fromMaybe(event.timeStamp),
      S.Just,
    ]);

    return R.over(keyDownSinceLens, setTimestampIfUnset, acc);
  } else if (keyboardEvent.type == 'keyup') {
    const realizedTimeLens = R.lensPath([
      keyboardEvent.code,
      'realizedPressTime',
    ]);
    const realizedTime = S.pipe([
      R.view(keyDownSinceLens),
      R.defaultTo(S.Nothing),
      S.maybe(0)(S.flip(S.sub)(event.timeStamp)),
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
export const controllerStateObservable = NEVER.pipe(
  merge(fromEvent(document, 'keydown'), fromEvent(document, 'keyup')),
  filter(isRelevantKey),
  scan(updateControllerState, initialControllerState),
  startWith(initialControllerState)
);
