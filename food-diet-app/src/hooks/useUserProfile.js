import { useEffect, useState } from 'react';

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
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setIsLoading(false);
  }, []);

  const saveProfile = (updater) => {
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
    localStorage.removeItem(STORAGE_KEY);
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
