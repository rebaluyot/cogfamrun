import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, CheckCircle, Filter } from 'lucide-react';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useKitDistribution } from '@/hooks/useKitDistribution';
import { useClaimLocations } from '@/hooks/useClaimLocations';
import { useDepartments } from '@/hooks/useDepartments';
import { useMinistries } from '@/hooks/useMinistries';
import { useClusters } from '@/hooks/useClusters';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export const BulkKitDistribution: React.FC = () => {
  // State for filters
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [ministryFilter, setMinistryFilter] = useState<string>('all');
  const [clusterFilter, setClusterFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isConfirmedOnly, setIsConfirmedOnly] = useState<boolean>(true);
  const [locationId, setLocationId] = useState<number | null>(null);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [processingIds, setProcessingIds] = useState<string[]>([]);
  const [processorName, setProcessorName] = useState<string>('');
  const [claimNotes, setClaimNotes] = useState<string>('');

  // Fetch data
  const { data: registrations, isLoading: isLoadingRegistrations } = useRegistrations();
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();
  const { locations, isLoading: isLoadingLocations } = useClaimLocations();
  const { updateKitClaimStatus } = useKitDistribution();
  const { username } = useAuth();
  const { toast } = useToast();

  // Set processor name from username when available
  useEffect(() => {
    if (username) {
      setProcessorName(username);
    }
  }, [username]);

  // Filter registrations based on selected criteria
  const filteredRegistrations = registrations?.filter(reg => {
    // Skip if already claimed
    if (reg.kit_claimed) return false;
    
    // Filter by confirmation status if needed
    if (isConfirmedOnly && reg.status !== 'confirmed') return false;
    
    // Apply department filter
    if (departmentFilter !== 'all' && reg.department !== departmentFilter) return false;
    
    // Apply ministry filter
    if (ministryFilter !== 'all' && reg.ministry !== ministryFilter) return false;
    
    // Apply cluster filter
    if (clusterFilter !== 'all' && reg.cluster !== clusterFilter) return false;
    
    // Apply category filter
    if (categoryFilter !== 'all' && reg.category !== categoryFilter) return false;
    
    return true;
  }) || [];

  const selectAllVisible = () => {
    setSelectedParticipants(filteredRegistrations.map(reg => reg.id.toString()));
  };

  const clearSelection = () => {
    setSelectedParticipants([]);
  };

  const handleCheckboxChange = (id: string) => {
    setSelectedParticipants(prev => {
      if (prev.includes(id)) {
        return prev.filter(p => p !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const resetFilters = () => {
    setDepartmentFilter('all');
    setMinistryFilter('all');
    setClusterFilter('all');
    setCategoryFilter('all');
    setIsConfirmedOnly(true);
  };

  const handleBulkClaim = async () => {
    if (!locationId) {
      toast({
        title: "Error",
        description: "Please select a claim location",
        variant: "destructive",
      });
      return;
    }

    if (!processorName) {
      toast({
        title: "Error", 
        description: "Please enter the name of the person processing these kits",
        variant: "destructive",
      });
      return;
    }

    if (selectedParticipants.length === 0) {
      toast({
        title: "Error",
        description: "Please select at least one participant",
        variant: "destructive",
      });
      return;
    }

    // Set processing state
    setProcessingIds([...selectedParticipants]);

    try {
      // Process each participant in sequence
      for (const id of selectedParticipants) {
        await updateKitClaimStatus.mutateAsync({
          id,
          kit_claimed: true,
          claimed_at: new Date().toISOString(),
          processed_by: processorName,
          actual_claimer: 'Bulk Distribution', // Mark as bulk distributed
          claim_location_id: locationId,
          claim_notes: claimNotes ? `Bulk distribution: ${claimNotes}` : 'Bulk distribution'
        });

        // Remove from processing list when done
        setProcessingIds(prev => prev.filter(pId => pId !== id));
      }

      // Clear selection after successful bulk claim
      setSelectedParticipants([]);
      
      toast({
        title: "Success",
        description: `Successfully claimed ${selectedParticipants.length} kits`,
      });
    } catch (error) {
      console.error('Error during bulk kit claim:', error);
      toast({
        title: "Error",
        description: "Failed to complete bulk claim operation",
        variant: "destructive",
      });
    } finally {
      setProcessingIds([]);
    }
  };

  // Get unique values for filters
  const uniqueDepartments = [...new Set(registrations?.filter(r => r.department).map(r => r.department))];
  const uniqueMinistries = [...new Set(registrations?.filter(r => r.ministry).map(r => r.ministry))];
  const uniqueClusters = [...new Set(registrations?.filter(r => r.cluster).map(r => r.cluster))];
  const uniqueCategories = [...new Set(registrations?.filter(r => r.category).map(r => r.category))];

  if (isLoadingRegistrations || isLoadingLocations) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bulk Kit Distribution</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Bulk Kit Distribution</CardTitle>
        <CardDescription>
          Distribute multiple kits at once by filtering and selecting participants
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filter section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
              <SelectTrigger id="department">
                <SelectValue placeholder="All Departments" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Departments</SelectItem>
                {uniqueDepartments.map((dept) => (
                  <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="ministry">Ministry</Label>
            <Select value={ministryFilter} onValueChange={setMinistryFilter}>
              <SelectTrigger id="ministry">
                <SelectValue placeholder="All Ministries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Ministries</SelectItem>
                {uniqueMinistries.map((ministry) => (
                  <SelectItem key={ministry} value={ministry}>{ministry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="cluster">Cluster</Label>
            <Select value={clusterFilter} onValueChange={setClusterFilter}>
              <SelectTrigger id="cluster">
                <SelectValue placeholder="All Clusters" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Clusters</SelectItem>
                {uniqueClusters.map((cluster) => (
                  <SelectItem key={cluster} value={cluster}>{cluster}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger id="category">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {uniqueCategories.map((category) => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Checkbox 
            id="confirmed-only" 
            checked={isConfirmedOnly} 
            onCheckedChange={(checked) => setIsConfirmedOnly(checked as boolean)} 
          />
          <Label htmlFor="confirmed-only">Show only confirmed registrations</Label>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={resetFilters} className="gap-2">
            <Filter className="h-4 w-4" />
            Reset Filters
          </Button>
          <Badge variant="secondary">
            {filteredRegistrations.length} participants match filters
          </Badge>
        </div>

        {/* Bulk action section */}
        <div className="border rounded-md p-4 space-y-4">
          <h3 className="font-medium">Bulk Claim Settings</h3>

          <div className="space-y-2">
            <Label htmlFor="claim-location">Claim Location</Label>
            <Select 
              value={locationId?.toString()} 
              onValueChange={(value) => setLocationId(parseInt(value))}
            >
              <SelectTrigger id="claim-location">
                <SelectValue placeholder="Select a claim location" />
              </SelectTrigger>
              <SelectContent>
                {locations.map((location) => (
                  <SelectItem key={location.id} value={location.id.toString()}>
                    {location.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="processor-name">Processed By</Label>
            <Input 
              id="processor-name" 
              value={processorName} 
              onChange={(e) => setProcessorName(e.target.value)}
              placeholder="Your name (who is processing these kits)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="claim-notes">Claim Notes</Label>
            <Input 
              id="claim-notes" 
              value={claimNotes} 
              onChange={(e) => setClaimNotes(e.target.value)}
              placeholder="Optional notes about this bulk distribution"
            />
          </div>
        </div>

        {/* Selection table */}
        <div>
          <div className="flex justify-between mb-4">
            <h3 className="font-medium">Select Participants ({selectedParticipants.length} selected)</h3>
            <div className="space-x-2">
              <Button variant="outline" size="sm" onClick={selectAllVisible}>
                Select All Visible
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
          </div>

          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">Select</TableHead>
                  <TableHead>Participant</TableHead>
                  <TableHead>Registration ID</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Ministry</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRegistrations.length > 0 ? (
                  filteredRegistrations.map((reg) => (
                    <TableRow key={reg.id}>
                      <TableCell className="text-center">
                        <Checkbox
                          checked={selectedParticipants.includes(reg.id.toString())}
                          disabled={processingIds.includes(reg.id.toString())}
                          onCheckedChange={() => handleCheckboxChange(reg.id.toString())}
                        />
                      </TableCell>
                      <TableCell>
                        {reg.first_name} {reg.last_name}
                        {processingIds.includes(reg.id.toString()) && (
                          <Loader2 className="ml-2 h-4 w-4 inline animate-spin text-primary" />
                        )}
                      </TableCell>
                      <TableCell>{reg.registration_id}</TableCell>
                      <TableCell>{reg.category}</TableCell>
                      <TableCell>{reg.department || '-'}</TableCell>
                      <TableCell>{reg.ministry || '-'}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
                      No matching participants found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          onClick={handleBulkClaim} 
          disabled={selectedParticipants.length === 0 || processingIds.length > 0 || !locationId}
          className="gap-2"
        >
          {processingIds.length > 0 ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Processing {processingIds.length} kits...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              Process {selectedParticipants.length} Kits
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
