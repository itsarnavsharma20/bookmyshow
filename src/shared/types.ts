// Types shared by more than one module. Types for one module live in that module's *.types.ts.

export type Id = string;

export type Timestamps = {
  createdAt: string;
  updatedAt: string;
};

export type PageQuery = {
  page?: number;
  limit?: number;
};

export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
