'use client';

import Link from 'next/link';
import { useId, useRef, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  FIELD,
  HINT,
  LABEL,
  PLATE,
  PLATE_SUNK,
  TOGGLE,
  TOGGLE_OFF,
  TOGGLE_ON,
  bannerClass,
  errorMessage,
  type AdminMessage
} from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { bulkCreateProducts } from '@/lib/supabase/admin-api';
import { cn } from '@/lib/utils';

interface CSVProduct {
  title: string;
  description: string;
  price: number;
  category: string;
  handle: string;
  images: string[];
}

type UploadMethod = 'manual' | 'csv' | 'json';

const METHODS: { value: UploadMethod; label: string }[] = [
  { value: 'manual', label: 'Manual entry' },
  { value: 'csv', label: 'CSV upload' },
  { value: 'json', label: 'JSON upload' }
];

const FILE_INPUT =
  'block w-full text-body-sm text-paper-muted file:mr-3 file:rounded-control file:border-0 file:bg-ink-700 file:px-3 file:py-1.5 file:text-body-sm file:font-medium file:text-paper hover:file:bg-ink-600';

const SAMPLE_CSV = `title,description,price,category,handle,images
"Premium White T-Shirt","High quality cotton t-shirt in white",999,"Topwear","premium-white-tshirt","https://example.com/image1.jpg|https://example.com/image2.jpg"
"Blue Denim Jeans","Classic blue denim jeans",1999,"Bottomwear","blue-denim-jeans","https://example.com/image3.jpg"
"Cotton Shirt","Comfortable cotton shirt",1499,"Topwear","cotton-shirt","https://example.com/image4.jpg"`;

const SAMPLE_JSON = [
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

function downloadFile(contents: string, filename: string, type: string): void {
  const url = window.URL.createObjectURL(new Blob([contents], { type }));
  const anchor = document.createElement('a');

  anchor.style.display = 'none';
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(anchor);
}

function parseCSV(csvText: string): CSVProduct[] {
  const lines = csvText.split('\n');
  const products: CSVProduct[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    const values = line.split(',').map((value) => value.trim());
    if (values.length < 6) continue;

    const product: CSVProduct = {
      title: values[0] || '',
      description: values[1] || '',
      price: Number.parseFloat(values[2] || '0') || 0,
      category: values[3] || '',
      handle: values[4] || '',
      images: values[5] ? values[5].split('|').filter((image) => image.trim()) : []
    };

    if (product.title && product.price > 0 && product.handle) {
      products.push(product);
    }
  }

  return products;
}

export default function CatalogUploadPage() {
  const { requireAdmin } = useAdminAuth();
  const fieldId = useId();

  const [file, setFile] = useState<File | null>(null);
  const [jsonData, setJsonData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<AdminMessage | null>(null);
  const [uploadMethod, setUploadMethod] = useState<UploadMethod>('manual');

  const csvInputRef = useRef<HTMLInputElement>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);

  const ids = {
    csvFile: `${fieldId}-csv-file`,
    jsonFile: `${fieldId}-json-file`,
    jsonText: `${fieldId}-json-text`
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);

    if (!selectedFile) return;

    if (selectedFile.type === 'text/csv') {
      setUploadMethod('csv');
    } else if (selectedFile.type === 'application/json') {
      setUploadMethod('json');
    }
  };

  const selectMethod = (method: UploadMethod) => {
    setUploadMethod(method);
    // A file picked for one format must not be uploaded as the other.
    setFile(null);
    if (csvInputRef.current) csvInputRef.current.value = '';
    if (jsonInputRef.current) jsonInputRef.current.value = '';
  };

  const handleUpload = async () => {
    try {
      requireAdmin();
      setIsLoading(true);
      setMessage(null);

      let products: CSVProduct[] = [];

      if (uploadMethod === 'csv' && file) {
        products = parseCSV(await file.text());
      } else if (uploadMethod === 'json' && file) {
        products = JSON.parse(await file.text());
      } else if (uploadMethod === 'json' && jsonData) {
        products = JSON.parse(jsonData);
      }

      if (!Array.isArray(products) || products.length === 0) {
        throw new Error('No valid products found to upload.');
      }

      for (const product of products) {
        if (!product?.title || !product?.handle || !(product.price > 0)) {
          throw new Error(
            `Invalid product data: ${product?.title || 'a row with no title'} — every product needs a title, a handle and a price above zero.`
          );
        }
      }

      const result = await bulkCreateProducts(products);

      setMessage({
        type: 'success',
        text: `Uploaded ${result.length} product${result.length === 1 ? '' : 's'}.`
      });

      setFile(null);
      setJsonData('');
      if (csvInputRef.current) csvInputRef.current.value = '';
      if (jsonInputRef.current) jsonInputRef.current.value = '';
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to upload catalogue') });
    } finally {
      setIsLoading(false);
    }
  };

  const canUpload =
    (uploadMethod === 'csv' && file !== null) ||
    (uploadMethod === 'json' && (file !== null || jsonData.trim().length > 0));

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Catalog upload"
        description="Import products in bulk from a CSV or JSON file."
      />

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      <div className={cn(PLATE, 'space-y-5 p-4')}>
        <fieldset>
          <legend className={LABEL}>Upload method</legend>
          <div className="flex flex-wrap gap-2">
            {METHODS.map((method) => {
              const selected = uploadMethod === method.value;

              return (
                <button
                  key={method.value}
                  type="button"
                  onClick={() => selectMethod(method.value)}
                  aria-pressed={selected}
                  className={cn(
                    TOGGLE,
                    selected ? TOGGLE_ON : TOGGLE_OFF,
                    'px-3 py-1.5 text-body-sm font-medium'
                  )}
                >
                  {method.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        {uploadMethod === 'csv' ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={ids.csvFile} className={LABEL}>
                CSV file
              </label>
              <input
                ref={csvInputRef}
                id={ids.csvFile}
                name="csv-file"
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className={FILE_INPUT}
              />
              <p className={HINT}>
                Columns: title, description, price, category, handle, images. Separate multiple
                image URLs with a pipe (|).
              </p>
            </div>

            <button
              type="button"
              onClick={() => downloadFile(SAMPLE_CSV, 'sample-catalog.csv', 'text/csv')}
              className={BTN_GHOST}
            >
              Download sample CSV
            </button>
          </div>
        ) : null}

        {uploadMethod === 'json' ? (
          <div className="space-y-3">
            <div>
              <label htmlFor={ids.jsonFile} className={LABEL}>
                JSON file
              </label>
              <input
                ref={jsonInputRef}
                id={ids.jsonFile}
                name="json-file"
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className={FILE_INPUT}
              />
            </div>

            <div>
              <label htmlFor={ids.jsonText} className={LABEL}>
                Or paste JSON
              </label>
              <textarea
                id={ids.jsonText}
                name="json-text"
                value={jsonData}
                onChange={(event) => setJsonData(event.target.value)}
                placeholder='[{ "title": "…", "price": 999, "handle": "…", "category": "…" }]'
                rows={8}
                className={FIELD}
              />
              <p className={HINT}>An array of product objects. A file, if chosen, wins.</p>
            </div>

            <button
              type="button"
              onClick={() =>
                downloadFile(
                  JSON.stringify(SAMPLE_JSON, null, 2),
                  'sample-catalog.json',
                  'application/json'
                )
              }
              className={BTN_GHOST}
            >
              Download sample JSON
            </button>
          </div>
        ) : null}

        {uploadMethod === 'manual' ? (
          <div className={cn(PLATE_SUNK, 'p-3')}>
            <p className="text-caption text-paper-muted">
              Manual entry is the single-product form, where images can be uploaded rather than
              linked.
            </p>
            <Link href="/admin/products/new" className={cn('mt-3', BTN_GHOST)}>
              Add new product
            </Link>
          </div>
        ) : null}

        {canUpload ? (
          <button type="button" onClick={handleUpload} disabled={isLoading} className={BTN_PRIMARY}>
            {isLoading ? 'Uploading…' : 'Upload catalogue'}
          </button>
        ) : null}
      </div>

      <div className={cn(PLATE, 'p-4')}>
        <h2 className="eyebrow text-paper-muted">What the importer expects</h2>
        <dl className="mt-3 grid grid-cols-1 gap-2 text-caption sm:grid-cols-2">
          <div>
            <dt className="font-medium text-paper">Required fields</dt>
            <dd className="text-paper-muted">title, price, handle, category</dd>
          </div>
          <div>
            <dt className="font-medium text-paper">Handle</dt>
            <dd className="text-paper-muted">
              Unique, lowercase, hyphenated — e.g. premium-white-tshirt
            </dd>
          </div>
          <div>
            <dt className="font-medium text-paper">Price</dt>
            <dd className="num text-paper-muted">In rupees, above zero — e.g. 999</dd>
          </div>
          <div>
            <dt className="font-medium text-paper">Images</dt>
            <dd className="text-paper-muted">Full URLs; in CSV, joined with a pipe (|)</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
