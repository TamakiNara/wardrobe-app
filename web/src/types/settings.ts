export type CategoryVisibilitySettings = {
  visibleCategoryIds: string[];
};

export type UpdateCategoryVisibilitySettingsPayload = {
  visibleCategoryIds: string[];
};

export type UserBrandRecord = {
  id: number;
  name: string;
  kana: string | null;
  is_active: boolean;
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
