'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteCollection } from '@/lib/supabase/admin-api';
import { getCollections } from '@/lib/supabase/api';
import { Collection } from '@/lib/supabase/types';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

// See src/app/admin/products/page.tsx for the shared admin control vocabulary.
// The one filled gold element here is "Add New Collection".
const BTN_GOLD = 'btn px-4 py-3 text-body-sm';
const BTN_GHOST =
  'inline-flex items-center justify-center gap-2 rounded-control border border-ink-faint px-4 py-3 text-body-sm font-medium leading-none text-paper transition-colors duration-fast ease-cloth hover:bg-ink-700 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';
const CHIP_DANGER =
  'rounded-control border border-ink-faint px-2 py-1 text-caption font-medium text-paper transition-colors duration-fast ease-cloth hover:border-madder hover:bg-madder active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50';

const errorMessage = (error: unknown, fallback: string): string =>
  error instanceof Error && error.message ? error.message : fallback;

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-IN');
};

export default function AdminCollectionsPage() {
  const { requireAdmin } = useAdminAuth();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Without Supabase the list is built-in sample data: it renders, but nothing
  // here can be created, edited or deleted for real.
  const [isReadOnly, setIsReadOnly] = useState(false);

  const fetchCollections = useCallback(async (signal: { cancelled: boolean }) => {
    setIsLoading(true);

    try {
      const data = await getCollections();

      if (signal.cancelled) return;

      setCollections(data);
    } catch (error) {
      if (signal.cancelled) return;

      setCollections([]);
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to fetch collections') });
    } finally {
      if (!signal.cancelled) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // `isSupabaseConfigured()` is read after mount so the server-rendered and
    // first client render agree.
    setIsReadOnly(!isSupabaseConfigured());

    const signal = { cancelled: false };
    fetchCollections(signal);

    return () => {
      signal.cancelled = true;
    };
  }, [fetchCollections]);

  const handleDeleteCollection = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Delete the collection "${title}" permanently?\n\nThis cannot be undone. Products in it are not deleted, but the collection page and any link to it will stop working.`
      )
    ) {
      return;
    }

    try {
      requireAdmin();
      setPendingId(id);
      setMessage(null);

      await deleteCollection(id);

      setCollections((current) => current.filter((c) => c.id !== id));
      setMessage({ type: 'success', text: `Collection "${title}" deleted successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to delete collection') });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow text-zari-500">Catalogue</p>
          <h1 className="mt-2 font-display text-h2 text-paper">Collections</h1>
          <div className="rule-zari mt-3 w-12" />
          <p className="mt-3 text-body-sm text-paper-muted">Manage your product collections</p>
        </div>
        <Link href="/admin/collections/new" className={BTN_GOLD}>
          Add New Collection
        </Link>
      </div>

      {isReadOnly && (
        <div className="bg-haldi px-4 py-3 text-body-sm text-ink">
          No database is connected, so these are the built-in sample collections. Creating and
          deleting collections will not work until Supabase is configured.
        </div>
      )}

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

      {/* Collections Grid */}
      <div className="border border-ink-700 bg-ink-800">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-body text-paper-muted">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-body text-paper-muted">No collections found</div>
            <Link href="/admin/collections/new" className={`mt-4 ${BTN_GHOST}`}>
              Add Your First Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 p-4 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const isPending = pendingId === collection.id;

              return (
                <div key={collection.id} className="border border-ink-700 bg-ink-900 p-4">
                  <div className="mb-3 flex items-start justify-between gap-4">
                    <h2 className="text-h3 text-paper">{collection.title}</h2>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(collection.id, collection.title)}
                      disabled={isPending}
                      className={CHIP_DANGER}
                    >
                      {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  <p className="mb-4 text-body-sm text-paper-muted">
                    {collection.description || 'No description'}
                  </p>

                  <div className="flex items-center justify-between gap-4">
                    <span className="break-all text-caption text-paper-muted">
                      Handle: {collection.handle}
                    </span>
                    <Link
                      href={`/search/${collection.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="thread-link-ink whitespace-nowrap text-body-sm text-zari-500"
                    >
                      View →
                    </Link>
                  </div>

                  <div className="num mt-2 text-caption text-paper-muted">
                    Created: {formatDate(collection.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-caption text-paper-muted">
        Collections cannot be edited after they are created yet — delete and recreate one to change
        its title, description or handle.
      </p>
    </div>
  );
}
