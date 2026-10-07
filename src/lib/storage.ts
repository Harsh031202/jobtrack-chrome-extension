import { JobApplication, TimelineEvent } from '../types/application';
import { UserSettings, DEFAULT_USER_SETTINGS } from '../types/settings';

const STORAGE_KEYS = {
  APPLICATIONS: 'jobtrack_applications',
  SETTINGS: 'jobtrack_settings',
} as const;

// Safe wrapper around chrome.storage.local with localStorage fallback
const isChromeStorageAvailable = (): boolean => {
  return typeof chrome !== 'undefined' && !!chrome.storage && !!chrome.storage.local;
};

export async function getStoredApplications(): Promise<JobApplication[]> {
  try {
    if (isChromeStorageAvailable()) {
      const res = await chrome.storage.local.get(STORAGE_KEYS.APPLICATIONS);
      return (res[STORAGE_KEYS.APPLICATIONS] as JobApplication[]) || [];
    } else {
      const item = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
      return item ? JSON.parse(item) : [];
    }
  } catch (err) {
    console.error('Failed to read applications from storage:', err);
    return [];
  }
}

export async function saveApplication(application: JobApplication): Promise<void> {
  const list = await getStoredApplications();
  const existingIdx = list.findIndex((a) => a.id === application.id);

  if (existingIdx >= 0) {
    list[existingIdx] = {
      ...application,
      updatedAt: new Date().toISOString(),
    };
  } else {
    list.unshift({
      ...application,
      createdAt: application.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: list });
  } else {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
  }
}

export async function updateApplication(
  id: string,
  updates: Partial<JobApplication>
): Promise<JobApplication | null> {
  const list = await getStoredApplications();
  const index = list.findIndex((a) => a.id === id);
  if (index === -1) return null;

  const updated: JobApplication = {
    ...list[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  list[index] = updated;

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: list });
  } else {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(list));
  }

  return updated;
}

export async function deleteApplication(id: string): Promise<boolean> {
  const list = await getStoredApplications();
  const filtered = list.filter((a) => a.id !== id);
  if (filtered.length === list.length) return false;

  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: filtered });
  } else {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(filtered));
  }
  return true;
}

export async function addTimelineEvent(
  applicationId: string,
  event: Omit<TimelineEvent, 'id'>
): Promise<JobApplication | null> {
  const list = await getStoredApplications();
  const app = list.find((a) => a.id === applicationId);
  if (!app) return null;

  const newEvent: TimelineEvent = {
    id: 'evt_' + Math.random().toString(36).substring(2, 9),
    ...event,
  };

  const updatedTimeline = [...(app.timeline || []), newEvent];
  return updateApplication(applicationId, {
    timeline: updatedTimeline,
    ...(event.status ? { status: event.status } : {}),
  });
}

export async function getSettings(): Promise<UserSettings> {
  try {
    if (isChromeStorageAvailable()) {
      const res = await chrome.storage.local.get(STORAGE_KEYS.SETTINGS);
      return { ...DEFAULT_USER_SETTINGS, ...(res[STORAGE_KEYS.SETTINGS] || {}) };
    } else {
      const item = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return item ? { ...DEFAULT_USER_SETTINGS, ...JSON.parse(item) } : DEFAULT_USER_SETTINGS;
    }
  } catch (err) {
    console.error('Failed to read settings from storage:', err);
    return DEFAULT_USER_SETTINGS;
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
  } else {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }
}

export async function clearAllApplications(): Promise<void> {
  if (isChromeStorageAvailable()) {
    await chrome.storage.local.set({ [STORAGE_KEYS.APPLICATIONS]: [] });
  } else {
    localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify([]));
  }
}
