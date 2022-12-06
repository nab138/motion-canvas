import '@motion-canvas/player';
import type {MotionCanvasPlayerProps} from '@motion-canvas/player';
import React, {ComponentProps} from 'react';
import styles from './styles.module.css';
import AnimationLink from './AnimationLink';
import clsx from 'clsx';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace JSX {
    interface IntrinsicElements {
      'motion-canvas-player': MotionCanvasPlayerProps & ComponentProps<'div'>;
    }
  }
}

export interface AnimationBannerProps {
  banner?: boolean;
  small?: boolean;
  name: string;
}

export default function AnimationPlayer({
  name,
  banner,
  small,
}: AnimationBannerProps) {
  return (
    <div
      className={clsx(
        styles.container,
        banner && styles.banner,
        small && styles.small,
      )}
    >
      <motion-canvas-player
        class={styles.player}
        src={`/examples/${name}.js`}
        auto={banner}
      />
      <AnimationLink name={name} />
    </div>
  );
}
