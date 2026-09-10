import clsx from 'clsx';
import Image from 'next/image';
import Label from '../common/label';

/**
 * A photo on the mat.
 *
 * Plate, not card: zero radius (`rounded-plate`), a 1px hairline, no resting
 * shadow, and `bg-paper-sunk` behind every image so a transparent PNG or a
 * slow load still reads as a framed garment rather than a hole in the page.
 *
 * `isInteractive` no longer scales the photograph — the design's hover is the
 * mat lifting from `paper-sunk` to `paper-raised` with `shadow-card` fading in,
 * which is compositor-cheap and does not distort the garment. `active` marks
 * the selected thumbnail with the metal for paper instead of a 2px blue ring.
 */
export function GridTileImage({
  isInteractive = true,
  active,
  label,
  ...props
}: {
  isInteractive?: boolean;
  active?: boolean;
  label?: {
    title: string;
    amount: string;
    currencyCode: string;
    position?: 'bottom' | 'center';
  };
} & React.ComponentProps<typeof Image>) {
  return (
    <div
      className={clsx(
        'group flex h-full w-full items-center justify-center overflow-hidden rounded-plate border bg-paper-sunk transition-colors duration-fast ease-cloth',
        {
          relative: label,
          'hover:bg-paper-raised hover:shadow-card': isInteractive,
          'border-zari-700': active,
          'border-line': !active
        }
      )}
    >
      {props.src ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- `alt` is inherited from `props`, which is being enforced with TypeScript
        <Image className="relative h-full w-full object-contain" {...props} />
      ) : null}
      {label ? (
        <Label
          title={label.title}
          amount={label.amount}
          currencyCode={label.currencyCode}
          position={label.position}
        />
      ) : null}
    </div>
  );
}
