export type CloudSpreadRecord = {
  id: string;
  userId: string;
  spreadKey: string;
  name: string;
  category: string | null;
  question: string | null;
  interpretation: string | null;
  cardsCount: number;
  packIndex: number;
  payload: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type CloudSpreadsListResponse = {
  spreads: CloudSpreadRecord[];
};

export type CloudSpreadResponse = {
  spread: CloudSpreadRecord;
};

export type CloudFavoritesResponse = {
  cardIds: string[];
};

export type CloudSettingsResponse = {
  settings: Record<string, unknown>;
  updatedAt: string;
};
