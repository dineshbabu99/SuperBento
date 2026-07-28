import { apiSlice } from '../../../app/api/apiSlice';

export const kitchenApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // Ingredients
    getIngredients: builder.query({
      query: (params) => ({
        url: '/kitchen/ingredients',
        params,
      }),
      providesTags: ['Ingredient'],
    }),
    createIngredient: builder.mutation({
      query: (body) => ({
        url: '/kitchen/ingredients',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Ingredient'],
    }),
    updateIngredient: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/kitchen/ingredients/${id}`,
        method: 'PATCH',
        data: body,
      }),
      invalidatesTags: ['Ingredient'],
    }),
    deleteIngredient: builder.mutation({
      query: (id) => ({
        url: `/kitchen/ingredients/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Ingredient'],
    }),

    // Recipes
    getRecipes: builder.query({
      query: (params) => ({
        url: '/kitchen/recipes',
        params,
      }),
      providesTags: ['Recipe'],
    }),
    getRecipeById: builder.query({
      query: (id) => ({ url: `/kitchen/recipes/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Recipe', id }],
    }),
    createRecipe: builder.mutation({
      query: (body) => ({
        url: '/kitchen/recipes',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Recipe'],
    }),

    // Menus
    getDailyMenus: builder.query({
      query: (params) => ({
        url: '/kitchen/menus',
        params,
      }),
      providesTags: ['Menu'],
    }),
    getMenuById: builder.query({
      query: (id) => ({ url: `/kitchen/menus/${id}` }),
      providesTags: (result, error, id) => [{ type: 'Menu', id }],
    }),
    createDailyMenu: builder.mutation({
      query: (body) => ({
        url: '/kitchen/menus',
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Menu'],
    }),
    updateMenuStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/kitchen/menus/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: ['Menu'],
    }),
    addMenuItem: builder.mutation({
      query: ({ menuId, ...body }) => ({
        url: `/kitchen/menus/${menuId}/items`,
        method: 'POST',
        data: body,
      }),
      invalidatesTags: ['Menu'],
    }),
    removeMenuItem: builder.mutation({
      query: ({ menuId, itemId }) => ({
        url: `/kitchen/menus/${menuId}/items/${itemId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Menu'],
    }),

    // Tasks
    getPrepTasks: builder.query({
      query: (params) => ({
        url: '/kitchen/tasks',
        params,
      }),
      providesTags: ['Task'],
    }),
    updatePrepTaskStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/kitchen/tasks/${id}/status`,
        method: 'PATCH',
        data: { status },
      }),
      invalidatesTags: ['Task'],
    }),
  }),
});

export const {
  useGetIngredientsQuery,
  useCreateIngredientMutation,
  useUpdateIngredientMutation,
  useDeleteIngredientMutation,
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useCreateRecipeMutation,
  useGetDailyMenusQuery,
  useGetMenuByIdQuery,
  useCreateDailyMenuMutation,
  useUpdateMenuStatusMutation,
  useAddMenuItemMutation,
  useRemoveMenuItemMutation,
  useGetPrepTasksQuery,
  useUpdatePrepTaskStatusMutation,
} = kitchenApi;
