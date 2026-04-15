import { STORAGE_KEYS } from './config';
import { supabase } from './supabaseClient';

const COLLECTION_KEY = STORAGE_KEYS.COLLECTION;

export function loadLocalCollection() {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    const parsed = JSON.parse(raw || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Failed to parse local collection:', error);
    return [];
  }
}

export function saveLocalCollection(cards) {
  localStorage.setItem(COLLECTION_KEY, JSON.stringify(cards));
}

export function toPersistedCard(card) {
  const { _labId, isCloud, instance_id, ...rest } = card;
  return rest;
}

export async function syncLocalCollectionToCloud(session) {
  if (!session?.user?.id) {
    return { skipped: true, syncedCount: 0 };
  }

  const localCards = loadLocalCollection();

  const { error: deleteError } = await supabase
    .from('card_instances')
    .delete()
    .eq('owner_id', session.user.id);

  if (deleteError) {
    throw deleteError;
  }

  if (localCards.length === 0) {
    return { skipped: false, syncedCount: 0 };
  }

  const rows = localCards.map((card) => ({
    owner_id: session.user.id,
    catalog_id: String(card.id),
    rarity: card.rarity
  }));

  const { error: insertError } = await supabase
    .from('card_instances')
    .insert(rows);

  if (insertError) {
    throw insertError;
  }

  return { skipped: false, syncedCount: rows.length };
}
