import {Latex, Rect} from '@motion-canvas/2d/lib/components';
import {makeScene2D} from '@motion-canvas/2d/lib/scenes';
import {waitFor} from '@motion-canvas/core/lib/flow';
import {createRef} from '@motion-canvas/core/lib/utils';

export default makeScene2D(function* (view) {
  const tex = createRef<Latex>();
  view.add(
    <Rect layout>
      <Latex
        ref={tex}
        tex={['x', '=', '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}']}
        fill="white"
      />
    </Rect>,
  );

  yield* waitFor(2);
  yield* tex().opacity(0, 1);
  yield* tex().opacity(1, 1);
  yield* waitFor(2);
  yield* tex().tex(
    ['x', '=', '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}', '+', '3'],
    1,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '1',
      '+',
      '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}',
      '+',
      '3',
    ],
    1.2,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '5',
      '+',
      '9',
      '+',
      '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}',
      '+',
      '7',
      '+',
      '8',
    ],
    1.2,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '5',
      '+',
      '2',
      '+',
      '9',
      '+',
      '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}',
      '+',
      '7',
      '+',
      '1',
      '+',
      '8',
    ],
    1.2,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '7',
      '+',
      '1',
      '+',
      '8',
      '+',
      '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}',
      '+',
      '5',
      '+',
      '2',
      '+',
      '9',
    ],
    1.2,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '3',
      '+',
      '{{\\sin \\left(}} \\pi + 3 {{\\over}} 2 {{\\right)}}',
      '+',
      '1',
    ],
    1.2,
  );
  yield* tex().tex(
    [
      'x',
      '=',
      '{{\\sin \\left(}} \\pi + 3 {{\\over}} 2 {{\\right)}}',
      '+',
      '3',
      '+',
      '1',
    ],
    1.2,
  );
  yield* tex().tex(
    ['x', '=', '{{\\sin \\left(}} \\pi {{\\over}} 2 {{\\right)}}'],
    1.2,
  );
  yield* waitFor(2);
});
