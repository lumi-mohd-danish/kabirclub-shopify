import clsx from 'clsx';

/**
 * Three blinking dots. Colour is the caller's job because the dots appear on
 * both grounds: `bg-ink` on paper, `bg-paper` on ink. `rounded-pill` rather
 * than `rounded-md` — a 4px dot should be a dot, and the radius scale reserves
 * the pill for exactly this kind of round element.
 */
const dots = 'mx-px inline-block h-1 w-1 animate-blink rounded-pill';

const LoadingDots = ({ className }: { className: string }) => {
  return (
    <span className="mx-2 inline-flex items-center">
      <span className={clsx(dots, className)} />
      <span className={clsx(dots, 'animation-delay-[200ms]', className)} />
      <span className={clsx(dots, 'animation-delay-[400ms]', className)} />
    </span>
  );
};

export default LoadingDots;
