export type CategoryVisibilitySettings = {
  visibleCategoryIds: string[];
};

export type UpdateCategoryVisibilitySettingsPayload = {
  visibleCategoryIds: string[];
};

export type UserPreferences = {
  currentSeason: "spring" | "summer" | "autumn" | "winter" | null;
  defaultWearLogStatus: "planned" | "worn" | null;
};

export type UserPreferencesResponse = {
  preferences: UserPreferences;
};

export type UpdateUserPreferencesPayload = {
  currentSeason: "spring" | "summer" | "autumn" | "winter" | null;
  defaultWearLogStatus: "planned" | "worn" | null;
};

export type UserBrandRecord = {
  id: number;
  name: string;
  kana: string | null;
  is_active: boolean;
  updated_at: string;
};

export type UserBrandsResponse = {
  brands: UserBrandRecord[];
};

export type CreateUserBrandPayload = {
  name: string;
  kana?: string | null;
  is_active?: boolean;
};

export type UpdateUserBrandPayload = {
  name?: string;
  kana?: string | null;
  is_active?: boolean;
};
