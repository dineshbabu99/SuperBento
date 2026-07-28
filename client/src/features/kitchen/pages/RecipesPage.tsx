import React from 'react';
import { useGetRecipesQuery } from '../api/kitchenApi';
import { Button } from '../../../shared/ui/button';
import { Link } from 'react-router';

export const RecipesPage: React.FC = () => {
  const { data: recipes, isLoading } = useGetRecipesQuery({});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Recipes</h1>
        <Link to="/kitchen/recipes/new">
          <Button>Create Recipe</Button>
        </Link>
      </div>

      <div className="bg-card border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Loading recipes...</div>
        ) : recipes?.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">No recipes found.</div>
        ) : (
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">Category</th>
                <th className="px-6 py-3 font-medium">Prep Time</th>
                <th className="px-6 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {recipes?.map((recipe: any) => (
                <tr key={recipe.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 font-medium">{recipe.name}</td>
                  <td className="px-6 py-4">{recipe.category || 'N/A'}</td>
                  <td className="px-6 py-4">{recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} mins` : 'N/A'}</td>
                  <td className="px-6 py-4 text-right">
                    <Link to={`/kitchen/recipes/${recipe.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};
