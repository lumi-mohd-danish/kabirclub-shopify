'use client';

import { useAdminAuth } from '@/hooks/useAdminAuth';
import { isSupabaseConfigured } from '@/lib/supabase';
import { deleteCollection } from '@/lib/supabase/admin-api';
import { getCollections } from '@/lib/supabase/api';
import { Collection } from '@/lib/supabase/types';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

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

      setCollections(current => current.filter(c => c.id !== id));
      setMessage({ type: 'success', text: `Collection "${title}" deleted successfully` });
    } catch (error) {
      setMessage({ type: 'error', text: errorMessage(error, 'Failed to delete collection') });
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Collections</h1>
          <p className="text-gray-400">Manage your product collections</p>
        </div>
        <Link
          href="/admin/collections/new"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Add New Collection
        </Link>
      </div>

      {isReadOnly && (
        <div className="bg-yellow-900 text-yellow-100 p-4 rounded-lg">
          No database is connected, so these are the built-in sample collections. Creating and
          deleting collections will not work until Supabase is configured.
        </div>
      )}

      {message && (
        <div
          role="status"
          aria-live="polite"
          className={`p-4 rounded-lg ${
            message.type === 'success' ? 'bg-green-900 text-green-200' : 'bg-red-900 text-red-200'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Collections Grid */}
      <div className="bg-gray-900 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="text-white">Loading collections...</div>
          </div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center">
            <div className="text-gray-400">No collections found</div>
            <Link
              href="/admin/collections/new"
              className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Add Your First Collection
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {collections.map((collection) => {
              const isPending = pendingId === collection.id;

              return (
                <div key={collection.id} className="bg-gray-800 rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <h3 className="text-xl font-bold text-white">{collection.title}</h3>
                    <button
                      type="button"
                      onClick={() => handleDeleteCollection(collection.id, collection.title)}
                      disabled={isPending}
                      className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>

                  <p className="text-gray-400 mb-4">
                    {collection.description || 'No description'}
                  </p>

                  <div className="flex justify-between items-center text-sm gap-4">
                    <span className="text-gray-500 break-all">
                      Handle: {collection.handle}
                    </span>
                    <Link
                      href={`/search/${collection.handle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 whitespace-nowrap"
                    >
                      View →
                    </Link>
                  </div>

                  <div className="text-xs text-gray-500 mt-2">
                    Created: {formatDate(collection.created_at)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <p className="text-gray-400 text-xs">
        Collections cannot be edited after they are created yet — delete and recreate one to change
        its title, description or handle.
      </p>
    </div>
  );
}
