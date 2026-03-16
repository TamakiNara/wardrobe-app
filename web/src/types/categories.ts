export type CategoryRecord = {
  id: string;
  groupId: string;
  name: string;
};

export type CategoryGroupRecord = {
  id: string;
  name: string;
  categories: CategoryRecord[];
};

export type CategoriesResponse = {
  groups: CategoryGroupRecord[];
};

export type CategoryOption = {
  value: string;
  label: string;
};