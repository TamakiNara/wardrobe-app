export type SkinTonePreset =
  | "pink_light"
  | "pink_medium"
  | "pink_deep"
  | "neutral_light"
  | "neutral_medium"
  | "neutral_deep"
  | "yellow_light"
  | "yellow_medium"
  | "yellow_deep";

export type CategoryVisibilitySettings = {
  visibleCategoryIds: string[];
};

export type UpdateCategoryVisibilitySettingsPayload = {
  visibleCategoryIds: string[];
};

export type UserPreferences = {
  currentSeason: "spring" | "summer" | "autumn" | "winter" | null;
  defaultWearLogStatus: "planned" | "worn" | null;
  calendarWeekStart: "monday" | "sunday" | null;
  skinTonePreset: SkinTonePreset;
};

export type UserPreferencesResponse = {
  preferences: UserPreferences;
};

export type UpdateUserPreferencesPayload = {
  currentSeason: "spring" | "summer" | "autumn" | "winter" | null;
  defaultWearLogStatus: "planned" | "worn" | null;
  calendarWeekStart: "monday" | "sunday" | null;
  skinTonePreset: SkinTonePreset;
};

export type UserTpoRecord = {
  id: number;
  name: string;
  sortOrder: number;
  isActive: boolean;
  isPreset: boolean;
};

export type UserTposResponse = {
  tpos: UserTpoRecord[];
};

export type CreateUserTpoPayload = {
  name: string;
};

export type UpdateUserTpoPayload = {
  name?: string;
  isActive?: boolean;
  sortOrder?: number;
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
