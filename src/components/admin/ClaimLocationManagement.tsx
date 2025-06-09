import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Settings, MapPin } from "lucide-react";
import { useClaimLocations, ClaimLocation } from "@/hooks/useClaimLocations";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const ClaimLocationManagement = () => {
  const { locations, isLoading, addLocation, updateLocation, deactivateLocation } = useClaimLocations();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newLocation, setNewLocation] = useState({ name: '', address: '', active: true });
  const [editLocation, setEditLocation] = useState<ClaimLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Handle adding a new location
  const handleAddLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await addLocation({
        name: newLocation.name.trim(),
        address: newLocation.address.trim() || null,
        active: newLocation.active
      });
      toast({
        title: "Success",
        description: "Location added successfully",
      });
      setNewLocation({ name: '', address: '', active: true });
      setIsAddDialogOpen(false);
    } catch (error) {
      console.error("Error adding location:", error);
      toast({
        title: "Error",
        description: "Failed to add location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle updating a location
  const handleUpdateLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editLocation || !editLocation.name.trim()) {
      toast({
        title: "Error",
        description: "Location name is required",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateLocation(editLocation.id, {
        name: editLocation.name.trim(),
        address: editLocation.address?.trim() || null,
        active: editLocation.active
      });
      toast({
        title: "Success",
        description: "Location updated successfully",
      });
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error("Error updating location:", error);
      toast({
        title: "Error",
        description: "Failed to update location",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deactivating a location
  const handleDeactivateLocation = async (id: number) => {
    try {
      await deactivateLocation(id);
      toast({
        title: "Success",
        description: "Location deactivated successfully",
      });
    } catch (error) {
      console.error("Error deactivating location:", error);
      toast({
        title: "Error",
        description: "Failed to deactivate location",
        variant: "destructive",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Claim Locations</CardTitle>
            <CardDescription>Manage locations where kits can be claimed</CardDescription>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Location
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddLocation}>
                <DialogHeader>
                  <DialogTitle>Add New Claim Location</DialogTitle>
                  <DialogDescription>
                    Create a new location where kits can be claimed.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Location Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="name"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                      placeholder="e.g., Main Event Venue"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Address (Optional)</Label>
                    <Input
                      id="address"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({ ...newLocation, address: e.target.value })}
                      placeholder="e.g., 123 Main St."
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="active"
                      checked={newLocation.active}
                      onCheckedChange={(checked) => 
                        setNewLocation({ ...newLocation, active: checked === true })
                      }
                    />
                    <Label htmlFor="active">Active</Label>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      'Add Location'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : locations.length > 0 ? (
          <Table>
            <TableCaption>List of all kit claim locations</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                      {location.name}
                    </div>
                  </TableCell>
                  <TableCell>{location.address || "—"}</TableCell>
                  <TableCell>
                    {location.active ? (
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">
                        Inactive
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setEditLocation(location);
                        setIsEditDialogOpen(true);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                      <span className="sr-only">Edit {location.name}</span>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No claim locations found. Click "Add Location" to create one.
          </div>
        )}

        {/* Edit location dialog */}
        {editLocation && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <form onSubmit={handleUpdateLocation}>
                <DialogHeader>
                  <DialogTitle>Edit Claim Location</DialogTitle>
                  <DialogDescription>
                    Update the details for this claim location.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit-name">Location Name <span className="text-red-500">*</span></Label>
                    <Input
                      id="edit-name"
                      value={editLocation.name}
                      onChange={(e) => setEditLocation({ ...editLocation, name: e.target.value })}
                      placeholder="e.g., Main Event Venue"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="edit-address">Address (Optional)</Label>
                    <Input
                      id="edit-address"
                      value={editLocation.address || ''}
                      onChange={(e) => setEditLocation({ ...editLocation, address: e.target.value })}
                      placeholder="e.g., 123 Main St."
                    />
                  </div>
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="edit-active"
                      checked={editLocation.active}
                      onCheckedChange={(checked) => 
                        setEditLocation({ ...editLocation, active: checked === true })
                      }
                    />
                    <Label htmlFor="edit-active">Active</Label>
                  </div>
                  
                  {editLocation.active && (
                    <div className="pt-2">
                      <Separator className="my-4" />
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={() => {
                          if (window.confirm("Are you sure you want to deactivate this location?")) {
                            handleDeactivateLocation(editLocation.id);
                            setIsEditDialogOpen(false);
                          }
                        }}
                        className="w-full"
                      >
                        Deactivate Location
                      </Button>
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} type="button">
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default ClaimLocationManagement;
