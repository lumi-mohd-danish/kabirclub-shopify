import clsx from 'clsx';
import Price from './price';

/**
 * The floating title/price chip laid over a `GridTileImage`.
 *
 * On a paper ground the chip is a paper-raised pill with a hairline, ink type
 * and the price in the metal for paper (`zari-700`, 4.85:1). The old
 * `bg-blue-600` price pellet is gone: blue was the last non-brand saturated
 * colour in the listing stack, and the price is the one metallic element the
 * design allows on a plate. The `dark:` pair is gone too — this system paints
 * its own grounds, it does not follow the OS.
 */
const Label = ({
  title,
  amount,
  currencyCode,
  position = 'bottom'
}: {
  title: string;
  amount: string;
  currencyCode: string;
  position?: 'bottom' | 'center';
}) => {
  return (
    <div
      className={clsx('absolute bottom-0 left-0 flex w-full px-4 pb-4 @container/label', {
        'lg:px-20 lg:pb-[35%]': position === 'center'
      })}
    >
      <div className="flex items-center rounded-pill border border-line bg-paper-raised/90 p-1 text-ink backdrop-blur-md">
        <h3 className="mr-4 line-clamp-2 flex-grow pl-2 text-caption leading-none">{title}</h3>
        <Price
          className="num flex-none rounded-pill px-3 py-1 text-body font-medium text-zari-700"
          amount={amount}
          currencyCode={currencyCode}
        />
      </div>
    </div>
  );
};

export default Label;
