import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { useCategories, useAddCategory, useDeleteCategory, useUpdateCategory } from "@/hooks/useCategories";
import { formatCurrency, getCategoryColorClass } from "@/lib/format-utils";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

type Category = {
  id: number;
  name: string;
  price: number;
  inclusions: string[] | null;
};

export const CategoryManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useCategories();
  const addCategoryMutation = useAddCategory();
  const deleteCategoryMutation = useDeleteCategory();
  const updateCategoryMutation = useUpdateCategory();

  const [newCategory, setNewCategory] = useState({
    name: "",
    price: "",
    inclusions: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCategory, setCurrentCategory] = useState<Category | null>(null);
  const [editCategory, setEditCategory] = useState({
    name: "",
    price: "",
    inclusions: "",
  });

  useEffect(() => {
    if (categoriesError) {
      toast({
        title: "Error Loading Categories",
        description: "There was a problem loading categories data.",
        variant: "destructive",
      });
    }
  }, [categoriesError, toast]);

  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCategoryMutation.mutateAsync({
        name: newCategory.name,
        price: parseInt(newCategory.price),
        inclusions: newCategory.inclusions.split(",").map(item => item.trim()).filter(item => item),
      });

      setNewCategory({ name: "", price: "", inclusions: "" });

      toast({
        title: "Category Added",
        description: `${newCategory.name} category has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add category. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding category:", error);
    }
  };

  const handleDeleteCategory = async (id: number) => {
    setCurrentCategory(categoriesData?.find(cat => cat.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentCategory) {
      try {
        await deleteCategoryMutation.mutateAsync(currentCategory.id);
        toast({
          title: "Category Deleted",
          description: `${currentCategory.name} category has been removed successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete category. Please try again.",
          variant: "destructive",
        });
        console.error("Error deleting category:", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setCurrentCategory(null);
      }
    }
  };

  const handleEditCategory = (category: Category) => {
    setCurrentCategory(category);
    setEditCategory({
      name: category.name,
      price: category.price.toString(),
      inclusions: category.inclusions ? category.inclusions.join(", ") : "",
    });
    setIsEditDialogOpen(true);
  };

  const saveEditedCategory = async () => {
    if (!currentCategory) return;
    
    if (!editCategory.name || !editCategory.price) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateCategoryMutation.mutateAsync({
        id: currentCategory.id,
        category: {
          name: editCategory.name,
          price: parseInt(editCategory.price),
          inclusions: editCategory.inclusions.split(",").map(item => item.trim()).filter(item => item),
        }
      });
      
      toast({
        title: "Category Updated",
        description: `${editCategory.name} category has been updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      setCurrentCategory(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating category:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Category</CardTitle>
          <CardDescription>Create a new race category with pricing and inclusions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={newCategory.name}
                onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., 5K, 15K"
              />
            </div>
            <div>
              <Label htmlFor="categoryPrice">Price (₱)</Label>
              <Input
                id="categoryPrice"
                type="number"
                value={newCategory.price}
                onChange={(e) => setNewCategory(prev => ({ ...prev, price: e.target.value }))}
                placeholder="500"
              />
            </div>
          </div>
          <div>
            <Label htmlFor="categoryInclusions">Inclusions (comma-separated)</Label>
            <Input
              id="categoryInclusions"
              value={newCategory.inclusions}
              onChange={(e) => setNewCategory(prev => ({ ...prev, inclusions: e.target.value }))}
              placeholder="Race Kit, Medal, Refreshments"
            />
          </div>
          <Button 
            onClick={handleAddCategory} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={addCategoryMutation.isPending}
          >
            {addCategoryMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Category"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Categories</CardTitle>
          <CardDescription>Manage race categories and their details</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingCategories ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading categories...</span>
            </div>
          ) : categoriesData && categoriesData.length > 0 ? (
            <div className="space-y-4">
              {categoriesData.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{category.name}</h3>
                      <Badge className={getCategoryColorClass(category.name)}>
                        {formatCurrency(category.price)}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.inclusions && category.inclusions.map((inclusion, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {inclusion}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditCategory(category)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteCategory(category.id)}
                      disabled={deleteCategoryMutation.isPending}
                    >
                      {deleteCategoryMutation.isPending && deleteCategoryMutation.variables === category.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No categories found. Add a new category to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Category</DialogTitle>
            <DialogDescription>
              Make changes to the category details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editName">Category Name</Label>
              <Input
                id="editName"
                value={editCategory.name}
                onChange={(e) => setEditCategory(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editPrice">Price (₱)</Label>
              <Input
                id="editPrice"
                type="number"
                value={editCategory.price}
                onChange={(e) => setEditCategory(prev => ({ ...prev, price: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editInclusions">Inclusions (comma-separated)</Label>
              <Input
                id="editInclusions"
                value={editCategory.inclusions}
                onChange={(e) => setEditCategory(prev => ({ ...prev, inclusions: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveEditedCategory} 
              disabled={updateCategoryMutation.isPending}
            >
              {updateCategoryMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the {currentCategory?.name} category.
              This may affect existing registrations using this category.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
