'use client';
/**
 * Saved stories — client-only, stored on this device (localStorage).
 * Accounts sync is a later milestone; the account page says so honestly.
 */
import type { NewsCategory } from '@/types/news';

export interface SavedStory {
  id: string;
  title: string;
  titleKiny: string;
  excerpt: string;
  excerptKiny: string;
  category: NewsCategory;
  publishedAt: string;
  imageUrl?: string;
  sourceName: string;
  savedAt: string;
}

const KEY = 'ibihe-saved-v1';

export function loadSaved(): SavedStory[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw) as SavedStory[];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function persist(list: SavedStory[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list.slice(0, 200)));
  } catch {
    /* storage full/unavailable */
  }
}

export function isSaved(id: string): boolean {
  return loadSaved().some((s) => s.id === id);
}

export function toggleSaved(story: SavedStory): boolean {
  const list = loadSaved();
  const i = list.findIndex((s) => s.id === story.id);
  if (i >= 0) {
    list.splice(i, 1);
    persist(list);
    return false;
  }
  persist([{ ...story, savedAt: new Date().toISOString() }, ...list]);
  return true;
}
