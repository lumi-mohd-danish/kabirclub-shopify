'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { bulkCreateProducts } from '@/lib/supabase/admin-api';
import { useState } from 'react';

interface CSVProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  handle: string;
  images: string[];
}

// See src/app/admin/products/page.tsx for the shared admin control vocabulary.
// The one filled gold element here is the "Upload Catalog" submit.
const BTN_GOLD =
  'btn w-full px-4 py-3 text-body-sm disabled:border-transparent disabled:bg-ink-600 disabled:text-paper disabled:cursor-not-allowed';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px';
const LABEL = 'eyebrow mb-2 block text-paper-muted';

// The method tabs: the selected one takes the gold edge — the woven thread as
// active-tile marker — rather than a gold fill.
const TAB =
  'rounded-control border px-4 py-3 text-body-sm font-medium transition-colors duration-fast ease-cloth';
const TAB_ON = 'border-zari-500 bg-ink-700 text-paper';
const TAB_OFF = 'border-ink-faint text-paper-muted hover:border-paper-muted hover:text-paper';

const FILE_INPUT =
  'block w-full text-body-sm text-paper-muted file:mr-4 file:rounded-control file:border-0 file:bg-ink-700 file:px-4 file:py-2 file:text-body-sm file:font-medium file:text-paper hover:file:bg-ink-600';

export default function CatalogUploadPage() {
  const { requireAdmin } = useAdminAuth();
  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [uploadMethod, setUploadMethod] = useState<'csv' | 'json' | 'manual'>('manual');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type === 'text/csv') {
        setUploadMethod('csv');
      } else if (selectedFile.type === 'application/json') {
        setUploadMethod('json');
      }
    }
  };

  const parseCSV = (csvText: string): CSVProduct[] => {
    const lines = csvText.split('\n');
    const products: CSVProduct[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const values = line.split(',').map((v) => v.trim());
      if (values.length >= 6) {
        const product: CSVProduct = {
          title: values[0] || '',
          description: values[1] || '',
          price: parseFloat(values[2] || '0') || 0,
          category: values[3] || '',
          handle: values[4] || '',
          images: values[5] ? values[5].split('|').filter((img) => img.trim()) : []
        };

        if (product.title && product.price > 0 && product.handle) {
          products.push(product);
        }
      }
    }
    return products;
  };

  const handleUpload = async () => {
    try {
      requireAdmin();
      setIsLoading(true);
      setMessage(null);

      let products: CSVProduct[] = [];

      if (uploadMethod === 'csv' && file) {
        const csvText = await file.text();
        products = parseCSV(csvText);
      } else if (uploadMethod === 'json' && file) {
        const jsonText = await file.text();
        products = JSON.parse(jsonText);
      } else if (uploadMethod === 'json' && jsonData) {
        products = JSON.parse(jsonData);
      }

      if (products.length === 0) {
        throw new Error('No valid products found to upload');
      }

      // Validate products
      for (const product of products) {
        if (!product.title || !product.handle || product.price <= 0) {
          throw new Error(`Invalid product data: ${product.title || 'Unknown'}`);
        }
      }

      const result = await bulkCreateProducts(products);

      setMessage({
        type: 'success',
        text: `Successfully uploaded ${result.length} products!`
      });

      // Reset form
      setFile(null);
      setJsonData('');
      if (document.getElementById('file-upload')) {
        (document.getElementById('file-upload') as HTMLInputElement).value = '';
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to upload catalog'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSampleCSV = () => {
    const sampleCSV = `title,description,price,category,handle,images
"Premium White T-Shirt","High quality cotton t-shirt in white",999,"Topwear","premium-white-tshirt","https://example.com/image1.jpg|https://example.com/image2.jpg"
"Blue Denim Jeans","Classic blue denim jeans",1999,"Bottomwear","blue-denim-jeans","https://example.com/image3.jpg"
"Cotton Shirt","Comfortable cotton shirt",1499,"Topwear","cotton-shirt","https://example.com/image4.jpg"`;

    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'sample-catalog.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  const downloadSampleJSON = () => {
    const sampleJSON = [
      {
        title: 'Premium White T-Shirt',
        description: 'High quality cotton t-shirt in white',
        price: 999,
        category: 'Topwear',
        handle: 'premium-white-tshirt',
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg']
      },
      {
        title: 'Blue Denim Jeans',
        description: 'Classic blue denim jeans',
        price: 1999,
        category: 'Bottomwear',
        handle: 'blue-denim-jeans',
        images: ['https://example.com/image3.jpg']
      }
    ];

    const blob = new Blob([JSON.stringify(sampleJSON, null, 2)], { type: 'application/json' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'sample-catalog.json';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow text-zari-500">Catalogue</p>
        <h1 className="mt-2 font-display text-h2 text-paper">Catalog Upload</h1>
        <div className="rule-zari mt-3 w-12" />
        <p className="mt-3 text-body-sm text-paper-muted">
          Upload products in bulk using CSV, JSON, or manual entry
        </p>
      </div>

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`px-4 py-3 text-body-sm ${
            message.type === 'success' ? 'bg-neem text-paper' : 'bg-madder text-paper'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Upload Method Selection */}
      <div className="space-y-5 border border-ink-700 bg-ink-800 p-4 md:p-6">
        <div>
          <h2 className="eyebrow text-paper-muted">Upload Method</h2>
          <div className="mt-3 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setUploadMethod('manual')}
              aria-pressed={uploadMethod === 'manual'}
              className={`${TAB} ${uploadMethod === 'manual' ? TAB_ON : TAB_OFF}`}
            >
              Manual Entry
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('csv')}
              aria-pressed={uploadMethod === 'csv'}
              className={`${TAB} ${uploadMethod === 'csv' ? TAB_ON : TAB_OFF}`}
            >
              CSV Upload
            </button>
            <button
              type="button"
              onClick={() => setUploadMethod('json')}
              aria-pressed={uploadMethod === 'json'}
              className={`${TAB} ${uploadMethod === 'json' ? TAB_ON : TAB_OFF}`}
            >
              JSON Upload
            </button>
          </div>
        </div>

        {/* CSV Upload */}
        {uploadMethod === 'csv' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="file-upload" className={LABEL}>
                Upload CSV File
              </label>
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className={FILE_INPUT}
              />
            </div>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={downloadSampleCSV} className={BTN_GHOST}>
                Download Sample CSV
              </button>
            </div>

            <div className="border border-ink-700 bg-ink-900 p-4">
              <h3 className="eyebrow text-paper-muted">CSV Format</h3>
              <p className="mt-2 text-body-sm text-paper">
                CSV should have columns: title, description, price, category, handle, images
              </p>
              <p className="mt-2 text-caption text-paper-muted">
                Images column should contain URLs separated by | (pipe) character
              </p>
            </div>
          </div>
        )}

        {/* JSON Upload */}
        {uploadMethod === 'json' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="json-file-upload" className={LABEL}>
                Upload JSON File or Paste JSON Data
              </label>
              <input
                id="json-file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className={`${FILE_INPUT} mb-4`}
              />

              <textarea
                value={jsonData}
                onChange={(e) => setJsonData(e.target.value)}
                aria-label="Paste JSON data"
                placeholder="Or paste JSON data here..."
                rows={10}
                className="field-ink py-2"
              />
            </div>

            <button type="button" onClick={downloadSampleJSON} className={BTN_GHOST}>
              Download Sample JSON
            </button>
          </div>
        )}

        {/* Manual Entry */}
        {uploadMethod === 'manual' && (
          <div className="border border-ink-700 bg-ink-900 p-4">
            <p className="mb-4 text-body-sm text-paper">
              For manual entry, use the{' '}
              <a href="/admin/products/new" className="thread-link-ink text-zari-500">
                Add New Product
              </a>{' '}
              page.
            </p>
            <a href="/admin/products/new" className={BTN_GHOST}>
              Add New Product
            </a>
          </div>
        )}

        {/* Upload Button */}
        {(uploadMethod === 'csv' && file) || (uploadMethod === 'json' && (file || jsonData)) ? (
          <button type="button" onClick={handleUpload} disabled={isLoading} className={BTN_GOLD}>
            {isLoading ? 'Uploading...' : 'Upload Catalog'}
          </button>
        ) : null}
      </div>

      {/* Instructions */}
      <div className="border border-ink-700 bg-ink-800 p-4 md:p-6">
        <h2 className="eyebrow text-paper-muted">Instructions</h2>
        <div className="mt-3 space-y-2 text-body-sm text-paper-muted">
          <p>
            • <strong className="font-medium text-paper">CSV Format:</strong> Use comma-separated
            values with headers
          </p>
          <p>
            • <strong className="font-medium text-paper">JSON Format:</strong> Array of product
            objects
          </p>
          <p>
            • <strong className="font-medium text-paper">Required fields:</strong> title, price,
            handle, category
          </p>
          <p>
            • <strong className="font-medium text-paper">Images:</strong> Provide valid URLs (for
            CSV, separate multiple URLs with |)
          </p>
          <p>
            • <strong className="font-medium text-paper">Handle:</strong> Must be unique
            URL-friendly identifier (e.g., &quot;premium-white-tshirt&quot;)
          </p>
          <p>
            • <strong className="font-medium text-paper">Price:</strong> In rupees (e.g., 999 for
            ₹999)
          </p>
        </div>
      </div>
    </div>
  );
}
