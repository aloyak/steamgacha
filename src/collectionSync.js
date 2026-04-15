import { STORAGE_KEYS } from './config';
import { supabase } from './supabaseClient';

const COLLECTION_KEY = STORAGE_KEYS.COLLECTION;
let syncQueue = Promise.resolve();

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

export async function saveLocalCollectionToCloud(cards, session) {
  saveLocalCollection(cards);

  if (!session?.user?.id) {
    return { skipped: true, syncedCount: 0 };
  }

  return syncLocalCollectionToCloud(session, { cards });
}

export function toPersistedCard(card) {
  const { _labId, isCloud, instance_id, ...rest } = card;
  return rest;
}

async function syncCollectionSnapshotToCloud(session, cards) {
  if (!session?.user?.id) {
    return { skipped: true, syncedCount: 0 };
  }

  const localCards = Array.isArray(cards) ? cards : [];

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

export function syncLocalCollectionToCloud(session, options = {}) {
  const snapshot = Array.isArray(options.cards) ? options.cards : loadLocalCollection();

  // Serialize snapshot writes so older syncs cannot overwrite newer collection state.
  syncQueue = syncQueue
    .catch(() => {})
    .then(() => syncCollectionSnapshotToCloud(session, snapshot));

  return syncQueue;
}

async function fetchCloudCollection(session) {
  const { data, error } = await supabase
    .from('card_instances')
    .select('catalog_id, rarity')
    .eq('owner_id', session.user.id);

  if (error) {
    throw error;
  }

  return (data || [])
    .map((row) => ({
      id: Number(row.catalog_id),
      rarity: row.rarity
    }))
    .filter((card) => Number.isFinite(card.id));
}

export async function reconcileCollectionWithCloud(session) {
  if (!session?.user?.id) {
    return { skipped: true, localCount: 0, cloudCount: 0, action: 'none' };
  }

  const localCards = loadLocalCollection();
  const cloudCards = await fetchCloudCollection(session);

  if (localCards.length === 0) {
    saveLocalCollection(cloudCards);
    return {
      skipped: false,
      localCount: 0,
      cloudCount: cloudCards.length,
      action: 'hydrated-from-cloud'
    };
  }

  if (localCards.length > cloudCards.length) {
    await syncLocalCollectionToCloud(session, { cards: localCards });
    return {
      skipped: false,
      localCount: localCards.length,
      cloudCount: cloudCards.length,
      action: 'uploaded-local-to-cloud'
    };
  }

  saveLocalCollection(cloudCards);
  return {
    skipped: false,
    localCount: localCards.length,
    cloudCount: cloudCards.length,
    action: 'hydrated-from-cloud'
  };
}

export async function hydrateLocalCollectionFromCloud(session, options = {}) {
  if (!session?.user?.id) {
    return { skipped: true, hydratedCount: 0 };
  }

  const { onlyIfLocalEmpty = true } = options;
  const localCards = loadLocalCollection();

  if (onlyIfLocalEmpty && localCards.length > 0) {
    return { skipped: true, hydratedCount: 0 };
  }

  const hydrated = await fetchCloudCollection(session);

  saveLocalCollection(hydrated);
  return { skipped: false, hydratedCount: hydrated.length };
}
