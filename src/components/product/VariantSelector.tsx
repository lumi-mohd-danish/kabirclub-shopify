import { Product } from '@/lib/supabase/types';

interface VariantSelectorProps {
  product: Product;
}

export default function VariantSelector({ product }: VariantSelectorProps) {
  // Since Supassbase products don't have variants like Shopify, we'll show basic product info
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Product Information</h3>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-600">Category:</span>
            <span className="font-medium capitalize">{product.category}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Product ID:</span>
            <span className="font-medium text-sm">{product.id}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-600">Added:</span>
            <span className="font-medium">{new Date(product.created_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <p className="text-sm text-gray-500">
          This product is available in standard sizing. Please refer to our size guide for accurate measurements.
        </p>
      </div>
    </div>
  );
}
