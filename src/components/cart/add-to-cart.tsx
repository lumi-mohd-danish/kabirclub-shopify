'use client';

import clsx from 'clsx';
import { useSearchParams } from 'next/navigation';

function ContactUsButton({
  availableForSale,
  selectedVariantId,
  productHandle
}: {
  availableForSale: boolean;
  selectedVariantId: string | undefined;
  productHandle: string;
}) {
  // A WhatsApp hand-off is a secondary action on the PDP's PAPER ground, so it
  // takes the bare ink hairline rather than a fill - the single gold element on
  // that view belongs to Add to Cart. The unavailable state overrides the
  // recipe with utilities (which outrank the components layer) instead of
  // stacking `.btn-cart-disabled`, whose `w-full` would fight `w-fit`. The old
  // `opacity-60` is gone: it dropped an 11.1:1 pairing to about 3.5:1.
  const buttonClasses = 'btn btn-secondary w-fit';
  const disabledClasses =
    'cursor-not-allowed border-transparent bg-ink-600 text-paper hover:bg-ink-600 hover:text-paper';

  if (!availableForSale) {
    return (
      <div className="flex justify-center">
        <button aria-disabled className={clsx(buttonClasses, disabledClasses)}>
          Out Of Stock
        </button>
      </div>
    );
  }

  if (!selectedVariantId) {
    return (
      <div className="flex justify-center">
        <button aria-disabled className={clsx(buttonClasses, disabledClasses)}>
          Please select an option
        </button>
      </div>
    );
  }

  const productUrl = `https://kabirclub.com/product/${productHandle}`;
  const whatsappMessage = `Hi KabirClub, I am interested in your products. ${productUrl}`;
  const encodedMessage = encodeURIComponent(whatsappMessage);

  return (
    <div className="flex justify-center">
      <a
        href={`https://wa.me/917991812899?text=${encodedMessage}`}
        target="_blank"
        rel="noopener noreferrer"
        className={buttonClasses}
      >
        Contact Us
      </a>
    </div>
  );
}

export function AddToCart({
  variants,
  availableForSale,
  productHandle
}: {
  variants: any[];
  availableForSale: boolean;
  productHandle: string;
}) {
  const searchParams = useSearchParams();
  const defaultVariantId = variants.length === 1 ? variants[0]?.id : undefined;
  const variant = variants.find((variant: any) =>
    variant.selectedOptions.every(
      (option: any) => option.value === searchParams.get(option.name.toLowerCase())
    )
  );
  const selectedVariantId = variant?.id || defaultVariantId;

  return <ContactUsButton availableForSale={availableForSale} selectedVariantId={selectedVariantId} productHandle={productHandle} />;
}
