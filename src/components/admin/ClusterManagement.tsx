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
import { useClusters, useAddCluster, useDeleteCluster, useUpdateCluster } from "@/hooks/useClusters";
import { useMinistries } from "@/hooks/useMinistries";

type Cluster = {
  id: number;
  name: string;
  ministry_id: number;
  ministry?: {
    id: number;
    name: string;
    department?: {
      id: number;
      name: string;
    };
  };
};

type Ministry = {
  id: number;
  name: string;
  department?: {
    id: number;
    name: string;
  };
};

export const ClusterManagement = () => {
  const { toast } = useToast();
  const { data: clustersData, isLoading: isLoadingClusters, error: clustersError } = useClusters();
  const { data: ministriesData, isLoading: isLoadingMinistries, error: ministriesError } = useMinistries();
  const addClusterMutation = useAddCluster();
  const deleteClusterMutation = useDeleteCluster();
  const updateClusterMutation = useUpdateCluster();

  const [newCluster, setNewCluster] = useState({
    name: "",
    ministry_id: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [currentCluster, setCurrentCluster] = useState<Cluster | null>(null);
  const [editCluster, setEditCluster] = useState({
    name: "",
    ministry_id: "",
  });

  useEffect(() => {
    if (clustersError) {
      toast({
        title: "Error Loading Clusters",
        description: "There was a problem loading clusters data.",
        variant: "destructive",
      });
    }

    if (ministriesError) {
      toast({
        title: "Error Loading Ministries",
        description: "There was a problem loading ministries data.",
        variant: "destructive",
      });
    }
  }, [clustersError, ministriesError, toast]);

  const handleAddCluster = async () => {
    if (!newCluster.name || !newCluster.ministry_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    try {
      await addClusterMutation.mutateAsync({
        name: newCluster.name,
        ministry_id: parseInt(newCluster.ministry_id),
      });

      setNewCluster({ name: "", ministry_id: "" });

      toast({
        title: "Cluster Added",
        description: `${newCluster.name} has been added successfully.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add cluster. Please try again.",
        variant: "destructive",
      });
      console.error("Error adding cluster:", error);
    }
  };

  const handleDeleteCluster = async (id: number) => {
    setCurrentCluster(clustersData?.find(cluster => cluster.id === id) || null);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (currentCluster) {
      try {
        await deleteClusterMutation.mutateAsync(currentCluster.id);
        toast({
          title: "Cluster Deleted",
          description: `${currentCluster.name} has been removed successfully.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete cluster. Please try again.",
          variant: "destructive",
        });
        console.error("Error deleting cluster:", error);
      } finally {
        setIsDeleteDialogOpen(false);
        setCurrentCluster(null);
      }
    }
  };

  const handleEditCluster = (cluster: Cluster) => {
    setCurrentCluster(cluster);
    setEditCluster({
      name: cluster.name,
      ministry_id: cluster.ministry_id.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const saveEditedCluster = async () => {
    if (!currentCluster) return;
    
    if (!editCluster.name || !editCluster.ministry_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      await updateClusterMutation.mutateAsync({
        id: currentCluster.id,
        cluster: {
          name: editCluster.name,
          ministry_id: parseInt(editCluster.ministry_id),
        }
      });
      
      toast({
        title: "Cluster Updated",
        description: `${editCluster.name} has been updated successfully.`,
      });
      
      setIsEditDialogOpen(false);
      setCurrentCluster(null);
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update cluster. Please try again.",
        variant: "destructive",
      });
      console.error("Error updating cluster:", error);
    }
  };

  // Group clusters by ministry for display
  const ministryGroups: Record<number, {ministry: Ministry, clusters: Cluster[]}> = {};
  
  ministriesData?.forEach(ministry => {
    ministryGroups[ministry.id] = {
      ministry,
      clusters: []
    };
  });
  
  clustersData?.forEach(cluster => {
    if (cluster.ministry_id && ministryGroups[cluster.ministry_id]) {
      ministryGroups[cluster.ministry_id].clusters.push(cluster);
    }
  });

  const isLoading = isLoadingMinistries || isLoadingClusters;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add New Cluster</CardTitle>
          <CardDescription>Create a new cluster under a ministry</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="clusterName">Cluster Name</Label>
            <Input
              id="clusterName"
              value={newCluster.name}
              onChange={(e) => setNewCluster(prev => ({ ...prev, name: e.target.value }))}
              placeholder="e.g., Alpha, Team A"
            />
          </div>
          <div>
            <Label htmlFor="clusterMinistry">Ministry</Label>
            <Select 
              value={newCluster.ministry_id} 
              onValueChange={(value) => setNewCluster(prev => ({ ...prev, ministry_id: value }))}
              disabled={isLoadingMinistries || !ministriesData?.length}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoadingMinistries ? "Loading..." : "Select ministry"} />
              </SelectTrigger>
              <SelectContent>
                {ministriesData && ministriesData.map((ministry) => (
                  <SelectItem key={ministry.id} value={ministry.id.toString()}>
                    {ministry.name} {ministry.department && `(${ministry.department.name})`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            onClick={handleAddCluster} 
            className="bg-blue-600 hover:bg-blue-700"
            disabled={addClusterMutation.isPending || isLoadingMinistries || !ministriesData?.length}
          >
            {addClusterMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : "Add Cluster"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Existing Clusters</CardTitle>
          <CardDescription>Manage clusters by ministry</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              <span className="ml-2">Loading clusters...</span>
            </div>
          ) : ministriesData && ministriesData.length > 0 ? (
            <div className="space-y-6">
              {ministriesData.map((ministry) => {
                const ministryClusters = ministryGroups[ministry.id]?.clusters || [];
                
                if (ministryClusters.length === 0) {
                  return (
                    <div key={ministry.id} className="space-y-2">
                      <h3 className="text-lg font-semibold text-blue-600">
                        {ministry.name} {ministry.department && <span className="text-sm text-gray-500">({ministry.department.name})</span>}
                      </h3>
                      <p className="text-sm text-gray-500 pl-4">No clusters found for this ministry.</p>
                    </div>
                  );
                }

                return (
                  <div key={ministry.id} className="space-y-2">
                    <h3 className="text-lg font-semibold text-blue-600">
                      {ministry.name} {ministry.department && <span className="text-sm text-gray-500">({ministry.department.name})</span>}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-4">
                      {ministryClusters.map((cluster) => (
                        <div key={cluster.id} className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{cluster.name}</span>
                          </div>
                          <div className="flex space-x-1">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 text-xs"
                              onClick={() => handleEditCluster(cluster)}
                            >
                              Edit
                            </Button>
                            <Button 
                              variant="destructive" 
                              size="sm"
                              className="h-7 px-2 text-xs"
                              onClick={() => handleDeleteCluster(cluster.id)}
                              disabled={deleteClusterMutation.isPending}
                            >
                              {deleteClusterMutation.isPending && deleteClusterMutation.variables === cluster.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
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
              No ministries found. Add ministries first, then add clusters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Cluster</DialogTitle>
            <DialogDescription>
              Make changes to the cluster details below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="editName">Cluster Name</Label>
              <Input
                id="editName"
                value={editCluster.name}
                onChange={(e) => setEditCluster(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="editMinistry">Ministry</Label>
              <Select 
                value={editCluster.ministry_id} 
                onValueChange={(value) => setEditCluster(prev => ({ ...prev, ministry_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select ministry" />
                </SelectTrigger>
                <SelectContent>
                  {ministriesData && ministriesData.map((ministry) => (
                    <SelectItem key={ministry.id} value={ministry.id.toString()}>
                      {ministry.name} {ministry.department && `(${ministry.department.name})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={saveEditedCluster} 
              disabled={updateClusterMutation.isPending}
            >
              {updateClusterMutation.isPending ? (
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
              This action cannot be undone. This will permanently delete the {currentCluster?.name} cluster.
              This may affect registrations associated with this cluster.
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
