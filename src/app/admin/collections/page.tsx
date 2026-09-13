'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import AdminPageHeader from '@/components/admin/AdminPageHeader';
import ConfirmDialog, { useConfirm } from '@/components/admin/ConfirmDialog';
import {
  BTN_GHOST,
  BTN_PRIMARY,
  CHIP_DANGER,
  PLATE,
  PLATE_SUNK,
  bannerClass,
  errorMessage,
  type AdminMessage
} from '@/components/admin/admin-ui';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteCollection } from '@/lib/supabase/admin-api';
import { getCollections } from '@/lib/supabase/api';
import { Collection } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

const formatDate = (value: string): string => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Unknown' : date.toLocaleDateString('en-IN');
};

export default function AdminCollectionsPage() {
  const { requireAdmin } = useAdminAuth();
  const { confirm, dialogProps } = useConfirm();

  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [message, setMessage] = useState<AdminMessage | null>(null);

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

  const handleDeleteCollection = async (collection: Collection) => {
    const confirmed = await confirm({
      title: `Delete the collection “${collection.title}”?`,
      body: 'This cannot be undone. The products in it are not deleted, but its collection page and every link to it stop working.',
      confirmLabel: 'Delete collection'
    });

    if (!confirmed) return;

    try {
      requireAdmin();
      setPendingId(collection.id);
      setMessage(null);

      await deleteCollection(collection.id);

      setCollections((current) => current.filter((entry) => entry.id !== collection.id));
      setMessage({ type: 'success', text: `“${collection.title}” was deleted.` });
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to delete collection') });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Catalogue"
        title="Collections"
        description="Collections cannot be edited yet — delete and recreate one to change it."
        actions={
          <Link href="/admin/collections/new" className={BTN_PRIMARY}>
            Add new collection
          </Link>
        }
      />

      {isReadOnly ? (
        <p className="banner banner-warning">
          No database is connected, so these are the built-in sample collections. Creating and
          deleting collections will not work until Supabase is configured.
        </p>
      ) : null}

      {message ? (
        <p role="status" aria-live="polite" className={bannerClass(message.type)}>
          {message.text}
        </p>
      ) : null}

      <div className={PLATE}>
        {isLoading ? (
          <p className="p-6 text-center text-body-sm text-paper-muted">Loading collections…</p>
        ) : collections.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-body-sm text-paper-muted">No collections yet.</p>
            <Link href="/admin/collections/new" className={cn('mt-3', BTN_GHOST)}>
              Add your first collection
            </Link>
          </div>
        ) : (
          <ul className="grid grid-cols-1 gap-3 p-3 md:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const isPending = pendingId === collection.id;

              return (
                <li key={collection.id} className={cn(PLATE_SUNK, 'p-3')}>
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-body-sm font-medium text-paper">{collection.title}</h2>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(collection)}
                      disabled={isPending}
                      className={CHIP_DANGER}
                    >
                      {isPending ? 'Deleting…' : 'Delete'}
                    </button>
                  </div>

                  <p className="mt-2 text-caption text-paper-muted">
                    {collection.description || 'No description'}
                  </p>

                  <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="break-all text-caption text-paper-muted">
                      /{collection.handle}
                    </span>
                    <Link
                      href={`/search/${collection.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="thread-link-ink whitespace-nowrap text-caption text-zari-500"
                    >
                      View
                    </Link>
                  </div>

                  <p className="num mt-1 text-caption text-paper-muted">
                    Created {formatDate(collection.created_at)}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog {...dialogProps} />
    </div>
  );
}
