import { isSupabaseConfigured, supabase } from '../supabase';
import { Collection, Product } from './types';

// Admin-only functions for catalog management

export async function createProduct(productData: {
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  handle: string;
  sizes: string[];
  is_active?: boolean;
}): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase!
    .from('products')
    .insert({
      ...productData,
      is_active: productData.is_active ?? true // Default to true if not provided
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating product:', error);
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data;
}

export async function updateProduct(
  id: string, 
  updates: Partial<{
    title: string;
    description: string;
    price: number;
    images: string[];
    category: string;
    handle: string;
    sizes: string[];
    is_active: boolean;
  }>
): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase!
    .from('products')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating product:', error);
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data;
}

export async function deleteProduct(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase!
    .from('products')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting product:', error);
    throw new Error(`Failed to delete product: ${error.message}`);
  }

  return true;
}

export async function toggleProductStatus(id: string, isActive: boolean): Promise<Product | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase!
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error toggling product status:', error);
    throw new Error(`Failed to toggle product status: ${error.message}`);
  }

  return data;
}

export async function createCollection(collectionData: {
  title: string;
  description: string;
  handle: string;
  image?: string;
}): Promise<Collection | null> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase!
    .from('collections')
    .insert(collectionData)
    .select()
    .single();

  if (error) {
    console.error('Error creating collection:', error);
    throw new Error(`Failed to create collection: ${error.message}`);
  }

  return data;
}


export async function deleteCollection(id: string): Promise<boolean> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { error } = await supabase!
    .from('collections')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting collection:', error);
    throw new Error(`Failed to delete collection: ${error.message}`);
  }

  return true;
}

// Bulk operations for catalog management
export async function bulkCreateProducts(products: Array<{
  title: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  handle: string;
}>): Promise<Product[]> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase not configured');
  }

  const { data, error } = await supabase!
    .from('products')
    .insert(products)
    .select();

  if (error) {
    console.error('Error bulk creating products:', error);
    throw new Error(`Failed to bulk create products: ${error.message}`);
  }

  return data || [];
}

