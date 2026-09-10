import { Product } from '@/lib/supabase/types';

interface VariantSelectorProps {
  product: Product;
}

export default function VariantSelector({ product }: VariantSelectorProps) {
  // Since Supassbase products don't have variants like Shopify, we'll show basic product info
  return (
    <div className="space-y-4">
      <div>
        <p className="eyebrow mb-3 text-ink-muted">Product Information</p>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-ink-muted">Category:</span>
            <span className="font-medium capitalize text-ink">{product.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Product ID:</span>
            <span className="num text-body-sm font-medium text-ink">{product.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-ink-muted">Added:</span>
            <span className="num font-medium text-ink">
              {new Date(product.created_at).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      <div className="border-t border-line pt-4">
        <p className="text-body-sm text-ink-muted">
          This product is available in standard sizing. Please refer to our size guide for accurate
          measurements.
        </p>
      </div>
    </div>
  );
}
