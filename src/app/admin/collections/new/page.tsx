'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { createCollection } from '@/lib/supabase/admin-api';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

// See src/app/admin/products/page.tsx for the shared admin control vocabulary.
// The one filled gold element here is the "Create Collection" submit.
const BTN_GOLD =
  'btn px-4 py-3 text-body-sm disabled:border-transparent disabled:bg-ink-600 disabled:text-paper disabled:cursor-not-allowed';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px';
const LABEL = 'eyebrow mb-2 block text-paper-muted';
const HINT = 'mt-2 text-caption text-paper-muted';

export default function NewCollectionPage() {
  const { requireAdmin } = useAdminAuth();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    handle: '',
    image: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'title' && !formData.handle) {
      // Auto-generate handle from title
      const autoHandle = value.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      
      setFormData(prev => ({
        ...prev,
        [name]: value,
        handle: autoHandle
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      requireAdmin();
      setIsLoading(true);
      setMessage(null);

      // Validation
      if (!formData.title || !formData.handle) {
        throw new Error('Please fill in all required fields');
      }

      const collectionData = {
        title: formData.title,
        description: formData.description,
        handle: formData.handle,
        image: formData.image || undefined
      };

      await createCollection(collectionData);
      
      setMessage({
        type: 'success',
        text: 'Collection created successfully!'
      });

      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/admin/collections');
      }, 1500);

    } catch (error: any) {
      console.error('Error creating collection:', error);
      setMessage({
        type: 'error',
        text: error.message || 'Failed to create collection'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zari-500">Collections</p>
          <h1 className="mt-2 font-display text-h2 text-paper">Add New Collection</h1>
          <div className="rule-zari mt-3 w-12" />
          <p className="mt-3 text-body-sm text-paper-muted">Create a new product collection</p>
        </div>
        <Link href="/admin/collections" className={BTN_GHOST}>
          Back to Collections
        </Link>
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

      <form onSubmit={handleSubmit} className="space-y-5 border border-ink-700 bg-ink-800 p-4 md:p-6">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label htmlFor="title" className={LABEL}>
              Collection Title *
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
              className="field-ink py-2"
              placeholder="Enter collection title"
            />
          </div>

          <div>
            <label htmlFor="handle" className={LABEL}>
              Handle (URL) *
            </label>
            <input
              type="text"
              id="handle"
              name="handle"
              value={formData.handle}
              onChange={handleInputChange}
              required
              className="field-ink py-2"
              placeholder="collection-url-handle"
            />
            <p className={HINT}>
              URL-friendly identifier (auto-generated from title)
            </p>
          </div>
        </div>

        <div>
          <label htmlFor="description" className={LABEL}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={4}
            className="field-ink py-2"
            placeholder="Enter collection description"
          />
        </div>

        <div>
          <label htmlFor="image" className={LABEL}>
            Collection Image (Optional)
          </label>
          <input
            type="url"
            id="image"
            name="image"
            value={formData.image}
            onChange={handleInputChange}
            className="field-ink py-2"
            placeholder="https://example.com/collection-image.jpg"
          />
        </div>

        {/* Submit Button */}
        <div className="flex flex-wrap gap-3 border-t border-ink-700 pt-5">
          <button
            type="submit"
            disabled={isLoading}
            className={BTN_GOLD}
          >
            {isLoading ? 'Creating...' : 'Create Collection'}
          </button>
          
          <Link href="/admin/collections" className={BTN_GHOST}>
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
