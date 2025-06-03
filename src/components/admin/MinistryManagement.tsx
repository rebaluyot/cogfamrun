import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { useMinistries, useAddMinistry, useDeleteMinistry, useUpdateMinistry } from "@/hooks/useMinistries";
import { useDepartments } from "@/hooks/useDepartments";

type Ministry = {
  id: number;
  name: string;
  department_id: number;
  department?: {
    id: number;
    name: string;
  };
};

type Department = {
  id: number;
  name: string;
};

export const MinistryManagement = () => {
  const { toast } = useToast();
  const { data: ministriesData, isLoading: isLoadingMinistries, error: ministriesError } = useMinistries();
  const { data: departmentsData, isLoading: isLoadingDepartments, error: departmentsError } = useDepartments();
  const addMinistryMutation = useAddMinistry();
  const deleteMinistryMutation = useDeleteMinistry();
  const updateMinistryMutation = useUpdateMinistry();

  const [newMinistry, setNewMinistry] = useState({
    name: "",
    department_id: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentMinistry, setCurrentMinistry] = useState<Ministry | null>(null);
  const [editMinistry, setEditMinistry] = useState({
    name: "",
    department_id: "",
  });

  useEffect(() => {
    if (ministriesError) {
      toast({
        title: "Error Loading Ministries",
        description: "There was a problem loading ministries data.",
        variant: "destructive",
      });
    }

    if (departmentsError) {
      toast({
        title: "Error Loading Departments",
        description: "There was a problem loading departments data.",
        variant: "destructive",
      });
    }
  }, [ministriesError, departmentsError, toast]);

  const handleAddMinistry = async () => {
    if (!newMinistry.name || !newMinistry.department_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addMinistryMutation.mutateAsync({
        name: newMinistry.name,
        department_id: parseInt(newMinistry.department_id),
      });

      setNewMinistry({ name: "", department_id: "" });

      toast({
        title: "Ministry Added",
        description: `${newMinistry.name} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add ministry. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding ministry:", error);
    }
  };

  const handleDeleteMinistry = async (id: number) => {
    setCurrentMinistry(ministriesData?.find(ministry => ministry.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentMinistry) {
      try {
        await deleteMinistryMutation.mutateAsync(currentMinistry.id);
        toast({
          title: "Ministry Deleted",
          description: `${currentMinistry.name} has been removed successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete ministry. Please try again.",
          variant: "destructive",
        });
        console.error("Error deleting ministry:", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setCurrentMinistry(null);
      }
    }
  };

  const handleEditMinistry = (ministry: Ministry) => {
    setCurrentMinistry(ministry);
    setEditMinistry({
      name: ministry.name,
      department_id: ministry.department_id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const saveEditedMinistry = async () => {
    if (!currentMinistry) return;
    
    if (!editMinistry.name || !editMinistry.department_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateMinistryMutation.mutateAsync({
        id: currentMinistry.id,
        ministry: {
          name: editMinistry.name,
          department_id: parseInt(editMinistry.department_id),
        }
      });
      
      toast({
        title: "Ministry Updated",
        description: `${editMinistry.name} has been updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      setCurrentMinistry(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update ministry. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating ministry:", error);
    }
  };

  // Group ministries by department for display
  const departmentMinistries = departmentsData?.reduce((acc: Record<number, { department: Department, ministries: Ministry[] }>, department) => {
    acc[department.id] = {
      department,
      ministries: []
    };
    return acc;
  }, {}) || {};
  
  // Add ministries to their departments
  ministriesData?.forEach(ministry => {
    if (ministry.department && departmentMinistries[ministry.department.id]) {
      departmentMinistries[ministry.department.id].ministries.push(ministry);
    }
  });

  const isLoading = isLoadingDepartments || isLoadingMinistries;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Ministry</CardTitle>
          <CardDescription>Create a new ministry under a department</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="ministryName">Ministry Name</Label>
            <Input
              id="ministryName"
              value={newMinistry.name}
              onChange={(e) => setNewMinistry(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Praise & Worship"
            />
          </div>
          <div>
            <Label htmlFor="ministryDepartment">Department</Label>
            <Select 
              value={newMinistry.department_id} 
              onValueChange={(value) => setNewMinistry(prev => ({ ...prev, department_id: value }))}
              disabled={isLoadingDepartments || !departmentsData?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingDepartments ? "Loading..." : "Select department"} />
              </SelectTrigger>
              <SelectContent>
                {departmentsData && departmentsData.map((dept) => (
                  <SelectItem key={dept.id} value={dept.id.toString()}>
                    {dept.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddMinistry} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={addMinistryMutation.isPending || isLoadingDepartments || !departmentsData?.length}
          >
            {addMinistryMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Ministry"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Ministries</CardTitle>
          <CardDescription>Manage ministries by department</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading ministries...</span>
            </div>
          ) : departmentsData && departmentsData.length > 0 ? (
            <div className="space-y-6">
              {departmentsData.map((department) => {
                const departmentMinistryGroup = departmentMinistries[department.id];
                const ministries = departmentMinistryGroup?.ministries || [];
                
                if (ministries.length === 0) {
                  return (
                    <div key={department.id} className="space-y-2">
                      <h3 className="text-lg font-semibold text-blue-600">{department.name}</h3>
                      <p className="text-sm text-gray-500 pl-4">No ministries found for this department.</p>
                    </div>
                  );
                }

                return (
                  <div key={department.id} className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-600">{department.name}</h3>
                    <div className="space-y-2 pl-4">
                      {ministries.map((ministry) => (
                        <div key={ministry.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{ministry.name}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditMinistry(ministry)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              onClick={() => handleDeleteMinistry(ministry.id)}
                              disabled={deleteMinistryMutation.isPending}
                            >
                              {deleteMinistryMutation.isPending && deleteMinistryMutation.variables === ministry.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : "Delete"}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No departments found. Add departments first, then add ministries.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Ministry</DialogTitle>
            <DialogDescription>
              Make changes to the ministry details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editName">Ministry Name</Label>
              <Input
                id="editName"
                value={editMinistry.name}
                onChange={(e) => setEditMinistry(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editDepartment">Department</Label>
              <Select 
                value={editMinistry.department_id} 
                onValueChange={(value) => setEditMinistry(prev => ({ ...prev, department_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {departmentsData && departmentsData.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveEditedMinistry} 
              disabled={updateMinistryMutation.isPending}
            >
              {updateMinistryMutation.isPending ? (
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
              This action cannot be undone. This will permanently delete the {currentMinistry?.name} ministry.
              This may affect clusters associated with this ministry.
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
