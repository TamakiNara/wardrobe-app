export type CategoryRecord = {
  id: string;
  groupId: string;
  name: string;
  sortOrder?: number;
};

export type CategoryGroupRecord = {
  id: string;
  name: string;
  sortOrder?: number;
  categories: CategoryRecord[];
};

export type CategoriesResponse = {
  groups: CategoryGroupRecord[];
};

export type CategoryOption = {
  value: string;
  label: string;
};
