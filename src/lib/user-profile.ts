export type UserProfile = {
  user_id: string;
  email: string;
  age?: number;
  job?: string;
  interests?: string;
  zodiac?: string;
  height_cm?: number;
  body_type?: string;
  headshot_url?: string;
  fullshot_url?: string;
  photos?: string[];
  updated_at: string;
};

const localProfiles = new Map<string, UserProfile>();

export function getLocalProfile(userId: string) {
  return localProfiles.get(userId) || null;
}

export function saveLocalProfile(profile: UserProfile) {
  localProfiles.set(profile.user_id, profile);
  return profile;
}
