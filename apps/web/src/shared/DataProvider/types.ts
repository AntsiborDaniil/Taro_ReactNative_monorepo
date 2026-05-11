/** Avoid `{ [key: string]: unknown }` — it widens context values and breaks `useData` inference. */
export type TProviderData = object;
