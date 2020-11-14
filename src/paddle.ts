import * as S from 'sanctuary';
import * as R from 'Ramda';

import {
  ControllerState,
  totalControllerTimes,
  totalTimeDiff,
} from './controller';
import { ViewportSize } from './viewport';

export interface PaddleState {
  top: number;
  appliedButtonPressTimes: { [key: string]: number };
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
export const updatePaddleState = (
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

export function updateWorldPaddle(paddleState: PaddleState): void {
  leftPaddle.style.top = `${Math.round(paddleState.top)}px`;
}
