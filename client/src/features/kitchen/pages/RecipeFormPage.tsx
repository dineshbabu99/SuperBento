import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { Button } from '../../../shared/ui/button';
import { Input } from '../../../shared/ui/input';
import { useCreateRecipeMutation } from '../api/kitchenApi';

export const RecipeFormPage: React.FC = () => {
  const navigate = useNavigate();
  const [createRecipe, { isLoading }] = useCreateRecipeMutation();
  
  const [name, setName] = useState('');
  const [prepTimeMinutes, setPrepTimeMinutes] = useState('');
  const [cookTimeMinutes, setCookTimeMinutes] = useState('');
  const [instructions, setInstructions] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createRecipe({ 
        name,
        prepTimeMinutes: prepTimeMinutes ? parseInt(prepTimeMinutes, 10) : undefined,
        cookTimeMinutes: cookTimeMinutes ? parseInt(cookTimeMinutes, 10) : undefined,
        instructions: instructions || undefined,
      }).unwrap();
      navigate('/kitchen/recipes');
    } catch (err) {
      console.error('Failed to create recipe:', err);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Recipe</h1>
        <p className="text-muted-foreground">Define a new recipe and its ingredients.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 bg-card p-6 border rounded-lg shadow-sm">
        <div className="space-y-2">
          <label className="text-sm font-medium">Recipe Name</label>
          <Input 
            placeholder="e.g., Grilled Chicken Salad" 
            required 
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Prep Time (mins)</label>
            <Input 
              type="number" 
              placeholder="15"
              value={prepTimeMinutes}
              onChange={(e) => setPrepTimeMinutes(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Cook Time (mins)</label>
            <Input 
              type="number" 
              placeholder="30" 
              value={cookTimeMinutes}
              onChange={(e) => setCookTimeMinutes(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Instructions</label>
          <textarea 
            className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[120px]" 
            placeholder="Step 1..."
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
          />
        </div>

        <div className="pt-4 flex justify-end gap-2 border-t">
          <Button type="button" variant="outline" onClick={() => navigate('/kitchen/recipes')}>Cancel</Button>
          <Button type="submit" disabled={isLoading}>Save Recipe</Button>
        </div>
      </form>
    </div>
  );
};
