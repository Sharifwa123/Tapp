// mobile/src/navigation/types.ts
export type RootStackParamList = {
  Home: undefined;
  Record: undefined;
  Import: undefined;
  Library: undefined;
  ProjectDetail: { projectId: string };
  Analysis: { mediaItemId: string };
};
