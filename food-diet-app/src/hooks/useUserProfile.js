import { useEffect, useState } from 'react';
import {
  fetchRemoteProfile,
  getClientId,
  resetRemoteProfile,
  saveRemoteProfile,
} from '../utils/profileApi';

const STORAGE_KEY = 'food_diet_user_profile';

const defaultProfile = {
  hasCompletedTest: false,
  constitution: null,
  conditions: [],
  createdAt: null,
  updatedAt: null,
};

function loadStoredProfile() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return defaultProfile;

  try {
    return { ...defaultProfile, ...JSON.parse(stored) };
  } catch (e) {
    console.error('Failed to parse user profile:', e);
    return defaultProfile;
  }
}

function saveLocalProfile(profile) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

export function useUserProfile() {
  const [profile, setProfile] = useState(() => loadStoredProfile());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const clientId = getClientId();

    const syncFromRemote = async () => {
      try {
        const remote = await fetchRemoteProfile(clientId);
        if (remote && !cancelled) {
          setProfile(remote);
          saveLocalProfile(remote);
        }
      } catch (error) {
        console.warn('Failed to fetch remote profile, using local cache.', error);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    syncFromRemote();

    return () => {
      cancelled = true;
    };
  }, []);

  const saveProfile = (updater) => {
    const clientId = getClientId();
    setProfile((currentProfile) => {
      const nextPartial =
        typeof updater === 'function' ? updater(currentProfile) : updater;
      const now = new Date().toISOString();
      const updated = {
        ...currentProfile,
        ...nextPartial,
        createdAt: currentProfile.createdAt || now,
        updatedAt: now,
      };
      saveLocalProfile(updated);
      saveRemoteProfile(clientId, updated).catch((error) => {
        console.warn('Failed to sync profile to backend.', error);
      });
      return updated;
    });
  };

  const updateProfile = (nextData) => {
    saveProfile({
      ...nextData,
      hasCompletedTest: true,
    });
  };

  const updateConstitution = (constitution) => {
    saveProfile({
      constitution,
      hasCompletedTest: true,
    });
  };

  const updateConditions = (conditions) => {
    saveProfile({
      conditions,
      hasCompletedTest: true,
    });
  };

  const resetProfile = () => {
    const clientId = getClientId();
    localStorage.removeItem(STORAGE_KEY);
    resetRemoteProfile(clientId).catch((error) => {
      console.warn('Failed to clear profile from backend.', error);
    });
    setProfile(defaultProfile);
  };

  return {
    profile,
    isLoading,
    hasCompletedTest: profile.hasCompletedTest,
    constitution: profile.constitution,
    conditions: profile.conditions,
    updateProfile,
    updateConstitution,
    updateConditions,
    resetProfile,
  };
}
