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

export function clearLocalCollection() {
  localStorage.removeItem(COLLECTION_KEY);
}

export function toPersistedCard(card) {
  const { _labId, isCloud, instance_id, ...rest } = card;
  return rest;
}

function toCardKey(catalogId, rarity) {
  return `${String(catalogId)}::${String(rarity)}`;
}

async function fetchCloudInstances(session) {
  const { data, error } = await supabase
    .from('card_instances')
    .select('instance_id, catalog_id, rarity')
    .eq('owner_id', session.user.id);

  if (error) {
    throw error;
  }

  return data || [];
}

async function deleteInstancesById(ownerId, instanceIds) {
  if (instanceIds.length === 0) {
    return;
  }

  const chunkSize = 500;
  for (let i = 0; i < instanceIds.length; i += chunkSize) {
    const chunk = instanceIds.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('card_instances')
      .delete()
      .eq('owner_id', ownerId)
      .in('instance_id', chunk);

    if (error) {
      throw error;
    }
  }
}

async function insertInstances(rows) {
  if (rows.length === 0) {
    return;
  }

  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const { error } = await supabase
      .from('card_instances')
      .insert(chunk);

    if (error) {
      throw error;
    }
  }
}

async function replaceAllInstances(ownerId, localCards) {
  const { error: deleteError } = await supabase
    .from('card_instances')
    .delete()
    .eq('owner_id', ownerId);

  if (deleteError) {
    throw deleteError;
  }

  if (localCards.length === 0) {
    return;
  }

  const rows = localCards.map((card) => ({
    owner_id: ownerId,
    catalog_id: String(card.id),
    rarity: card.rarity
  }));

  await insertInstances(rows);
}

async function syncCollectionSnapshotToCloud(session, cards) {
  if (!session?.user?.id) {
    return { skipped: true, syncedCount: 0 };
  }

  const localCards = (Array.isArray(cards) ? cards : []).filter(
    (card) => Number.isFinite(Number(card?.id)) && typeof card?.rarity === 'string' && card.rarity.length > 0
  );

  const cloudRows = await fetchCloudInstances(session);

  const desiredCounts = new Map();
  for (const card of localCards) {
    const key = toCardKey(card.id, card.rarity);
    desiredCounts.set(key, (desiredCounts.get(key) || 0) + 1);
  }

  const cloudBuckets = new Map();
  for (const row of cloudRows) {
    const key = toCardKey(row.catalog_id, row.rarity);
    if (!cloudBuckets.has(key)) {
      cloudBuckets.set(key, []);
    }
    cloudBuckets.get(key).push(row.instance_id);
  }

  const rowsToInsert = [];
  const instanceIdsToDelete = [];

  for (const [key, desiredCount] of desiredCounts.entries()) {
    const [catalog_id, rarity] = key.split('::');
    const currentIds = cloudBuckets.get(key) || [];
    const currentCount = currentIds.length;

    if (desiredCount > currentCount) {
      for (let i = 0; i < desiredCount - currentCount; i += 1) {
        rowsToInsert.push({
          owner_id: session.user.id,
          catalog_id,
          rarity
        });
      }
    }

    if (currentCount > desiredCount) {
      instanceIdsToDelete.push(...currentIds.slice(0, currentCount - desiredCount));
    }
  }

  for (const [key, currentIds] of cloudBuckets.entries()) {
    if (!desiredCounts.has(key)) {
      instanceIdsToDelete.push(...currentIds);
    }
  }

  await deleteInstancesById(session.user.id, instanceIdsToDelete);
  await insertInstances(rowsToInsert);

  const { count, error: countError } = await supabase
    .from('card_instances')
    .select('instance_id', { count: 'exact', head: true })
    .eq('owner_id', session.user.id);

  if (countError) {
    throw countError;
  }

  if ((count ?? 0) !== localCards.length) {
    // Self-heal edge cases by forcing a full owner snapshot rewrite.
    await replaceAllInstances(session.user.id, localCards);

    const { count: fallbackCount, error: fallbackCountError } = await supabase
      .from('card_instances')
      .select('instance_id', { count: 'exact', head: true })
      .eq('owner_id', session.user.id);

    if (fallbackCountError) {
      throw fallbackCountError;
    }

    if ((fallbackCount ?? 0) !== localCards.length) {
      throw new Error(
        `Cloud sync verification mismatch after fallback: expected ${localCards.length}, got ${fallbackCount ?? 0}`
      );
    }

    return {
      skipped: false,
      syncedCount: localCards.length,
      insertedCount: rowsToInsert.length,
      deletedCount: instanceIdsToDelete.length,
      verifiedCount: fallbackCount ?? 0,
      usedFallbackReplace: true
    };
  }

  return {
    skipped: false,
    syncedCount: localCards.length,
    insertedCount: rowsToInsert.length,
    deletedCount: instanceIdsToDelete.length,
    verifiedCount: count ?? 0
  };
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
  const data = await fetchCloudInstances(session);

  return (data || [])
    .map((row) => ({
      id: Number(row.catalog_id),
      rarity: row.rarity
    }))
    .filter((card) => Number.isFinite(card.id));
}

export async function hydrateLocalCollectionFromCloud(session) {
  if (!session?.user?.id) {
    return { skipped: true, localCount: 0, cloudCount: 0, action: 'none' };
  }

  const cloudCards = await fetchCloudCollection(session);
  saveLocalCollection(cloudCards);

  return {
    skipped: false,
    localCount: cloudCards.length,
    cloudCount: cloudCards.length,
    action: 'hydrated-from-cloud'
  };
}

