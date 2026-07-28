import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useGetRecipeByIdQuery } from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';
import { PageLoader } from '../../../shared/ui/page-loader';

export const RecipeDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { data: recipe, isLoading, error } = useGetRecipeByIdQuery(id!);

  if (isLoading) return <PageLoader />;
  if (error || !recipe) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Recipe not found or an error occurred.
        <br />
        <Link to="/kitchen/recipes">
          <Button variant="outline" className="mt-4">Back to Recipes</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{recipe.name}</h1>
          <p className="text-muted-foreground mt-1">{recipe.category || 'Uncategorized'}</p>
        </div>
        <Link to="/kitchen/recipes">
          <Button variant="outline">Back to Recipes</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">Instructions</h2>
            <div className="whitespace-pre-wrap text-muted-foreground">
              {recipe.instructions || 'No instructions provided.'}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-card border rounded-lg p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Details</h2>
            <dl className="space-y-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prep Time</dt>
                <dd className="font-medium">{recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} mins` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cook Time</dt>
                <dd className="font-medium">{recipe.cookTimeMinutes ? `${recipe.cookTimeMinutes} mins` : 'N/A'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Created</dt>
                <dd className="font-medium">{new Date(recipe.createdAt).toLocaleDateString()}</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};
