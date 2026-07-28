import { createApi } from '@reduxjs/toolkit/query/react';
import { axiosBaseQuery } from '@shared/lib/rtkBaseQuery';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: axiosBaseQuery({ baseUrl: '' }),
  tagTypes: ['Ingredient', 'Recipe', 'Menu', 'Task', 'Supplier', 'Inventory', 'Purchase', 'Delivery', 'Transaction', 'Employee', 'Payroll', 'User', 'Role', 'Notification', 'Setting', 'Branch'],
  endpoints: () => ({}),
});
