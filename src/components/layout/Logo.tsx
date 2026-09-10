// next
import Image from 'next/image';

// clsx
import clsx from 'clsx';

const Logo = ({ size, className }: { size: 'sm' | 'lg'; className?: string }) => {
  return (
    <Image
      src="/images/logo.png"
      width="594"
      height="206"
      sizes={size === 'sm' ? '150px' : '288px'}
      // Heights moved off arbitrary pixels and onto the 4px scale: 40/52 ->
      // h-10 / xl:h-12 (40/48) and 64/100 -> h-16 / md:h-24 (64/96). Nothing
      // else about the mark changes - the header owns its own final height and
      // passes it through `className`.
      className={clsx('w-auto max-w-none', className, {
        'h-10 xl:h-12': size === 'sm',
        'h-16 md:h-24': size === 'lg'
      })}
      alt="logo"
      priority
    />
  );
};

export default Logo;
