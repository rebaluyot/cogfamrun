import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useDepartments, useAddDepartment, useDeleteDepartment, useUpdateDepartment } from "@/hooks/useDepartments";

type Department = {
  id: number;
  name: string;
  description: string | null;
};

export const DepartmentManagement = () => {
  const { toast } = useToast();
  const { data: departmentsData, isLoading: isLoadingDepartments, error: departmentsError } = useDepartments();
  const addDepartmentMutation = useAddDepartment();
  const deleteDepartmentMutation = useDeleteDepartment();
  const updateDepartmentMutation = useUpdateDepartment();

  const [newDepartment, setNewDepartment] = useState({
    name: "",
    description: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentDepartment, setCurrentDepartment] = useState<Department | null>(null);
  const [editDepartment, setEditDepartment] = useState({
    name: "",
    description: "",
  });

  useEffect(() => {
    if (departmentsError) {
      toast({
        title: "Error Loading Departments",
        description: "There was a problem loading departments data.",
        variant: "destructive",
      });
    }
  }, [departmentsError, toast]);

  const handleAddDepartment = async () => {
    if (!newDepartment.name) {
      toast({
        title: "Missing Information",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addDepartmentMutation.mutateAsync({
        name: newDepartment.name,
        description: newDepartment.description || undefined,
      });

      setNewDepartment({ name: "", description: "" });

      toast({
        title: "Department Added",
        description: `${newDepartment.name} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add department. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding department:", error);
    }
  };

  const handleDeleteDepartment = async (id: number) => {
    setCurrentDepartment(departmentsData?.find(dept => dept.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentDepartment) {
      try {
        await deleteDepartmentMutation.mutateAsync(currentDepartment.id);
        toast({
          title: "Department Deleted",
          description: `${currentDepartment.name} has been removed successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete department. Please try again.",
          variant: "destructive",
        });
        console.error("Error deleting department:", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setCurrentDepartment(null);
      }
    }
  };

  const handleEditDepartment = (department: Department) => {
    setCurrentDepartment(department);
    setEditDepartment({
      name: department.name,
      description: department.description || "",
    });
    setIsEditDialogOpen(true);
  };

  const saveEditedDepartment = async () => {
    if (!currentDepartment) return;
    
    if (!editDepartment.name) {
      toast({
        title: "Missing Information",
        description: "Please enter a department name.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateDepartmentMutation.mutateAsync({
        id: currentDepartment.id,
        department: {
          name: editDepartment.name,
          description: editDepartment.description || undefined,
        }
      });
      
      toast({
        title: "Department Updated",
        description: `${editDepartment.name} has been updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      setCurrentDepartment(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update department. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating department:", error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Department</CardTitle>
          <CardDescription>Create a new church department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="deptName">Department Name</Label>
            <Input
              id="deptName"
              value={newDepartment.name}
              onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Youth Ministry"
            />
          </div>
          <div>
            <Label htmlFor="deptDescription">Description</Label>
            <Input
              id="deptDescription"
              value={newDepartment.description}
              onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
              placeholder="e.g., Ages 13-25"
            />
          </div>
          <Button 
            onClick={handleAddDepartment} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={addDepartmentMutation.isPending}
          >
            {addDepartmentMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Department"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Departments</CardTitle>
          <CardDescription>Manage church departments</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingDepartments ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading departments...</span>
            </div>
          ) : departmentsData && departmentsData.length > 0 ? (
            <div className="space-y-4">
              {departmentsData.map((department) => (
                <div key={department.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-lg font-semibold">{department.name}</h3>
                    </div>
                    {department.description && (
                      <p className="text-sm text-gray-600">{department.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditDepartment(department)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => handleDeleteDepartment(department.id)}
                      disabled={deleteDepartmentMutation.isPending}
                    >
                      {deleteDepartmentMutation.isPending && deleteDepartmentMutation.variables === department.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : "Delete"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No departments found. Add a new department to get started.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Department</DialogTitle>
            <DialogDescription>
              Make changes to the department details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editName">Department Name</Label>
              <Input
                id="editName"
                value={editDepartment.name}
                onChange={(e) => setEditDepartment(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editDescription">Description</Label>
              <Input
                id="editDescription"
                value={editDepartment.description}
                onChange={(e) => setEditDepartment(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveEditedDepartment} 
              disabled={updateDepartmentMutation.isPending}
            >
              {updateDepartmentMutation.isPending ? (
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
              This action cannot be undone. This will permanently delete the {currentDepartment?.name} department.
              This may affect ministries and clusters associated with this department.
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
