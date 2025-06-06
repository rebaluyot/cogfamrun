import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { KitDistributionScanner } from '@/components/admin/KitDistributionScanner';
import { useRegistrations } from '@/hooks/useRegistrations';
import { useKitDistribution, KitClaimData } from '@/hooks/useKitDistribution';
import { Loader2, Search, CheckCircle2, QrCode, FileTextIcon, XCircle, Edit, MoreHorizontal, AlertTriangle } from 'lucide-react';

export const KitDistributionManagement: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState<any | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('scan');
  
  const { data: registrations, isLoading } = useRegistrations();
  const { updateKitClaimStatus } = useKitDistribution();
  const { toast } = useToast();

  // Filter registrations by search term
  const filteredRegistrations = registrations?.filter(reg => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      `${reg.first_name} ${reg.last_name}`.toLowerCase().includes(searchLower) ||
      reg.email.toLowerCase().includes(searchLower) ||
      reg.registration_id.toLowerCase().includes(searchLower) ||
      reg.category.toLowerCase().includes(searchLower) ||
      reg.shirt_size.toLowerCase().includes(searchLower)
    );
  }) || [];

  const handleViewDetails = (participant: any) => {
    setSelectedParticipant(participant);
    setDialogOpen(true);
  };

  const handleSubmitClaim = async (claimData: KitClaimData) => {
    try {
      await updateKitClaimStatus.mutateAsync(claimData);
      setDialogOpen(false);
      toast({
        title: "Success",
        description: claimData.kit_claimed 
          ? "Kit marked as claimed successfully" 
          : "Kit marked as unclaimed successfully",
      });
    } catch (error) {
      console.error('Error updating kit claim status:', error);
      toast({
        title: "Error",
        description: "Failed to update kit claim status",
        variant: "destructive",
      });
    }
  };

  // Get statistics for dashboard
  const totalRegistrations = registrations?.length || 0;
  const claimedKits = registrations?.filter(r => r.kit_claimed).length || 0;
  const unclaimedKits = totalRegistrations - claimedKits;
  const claimPercentage = totalRegistrations > 0 
    ? Math.round((claimedKits / totalRegistrations) * 100) 
    : 0;

  // Check if we're in a secure context (HTTPS)
  const [isSecureContext, setIsSecureContext] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecureContext(
        window.location.protocol === 'https:' || 
        window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1'
      );
    }
  }, []);

  return (
    <div className="space-y-6">
      {!isSecureContext && (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader className="pb-2">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
              <div>
                <CardTitle className="text-amber-800">HTTPS Required for Camera Scanner</CardTitle>
                <CardDescription className="text-amber-700">
                  For security reasons, browsers require HTTPS for camera access. The scanner may not work in this environment.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-amber-700">
              <p className="mb-2">The QR code scanner requires a secure context (HTTPS) to access your device's camera. You have these options:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li>Use the manual entry mode instead (recommended in HTTP environments)</li>
                <li>If testing locally, use <code className="bg-amber-100 px-1 rounded">localhost</code> which is considered secure</li>
                <li>For production, deploy this application with HTTPS enabled</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="flex-1">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">Kit Distribution Dashboard</CardTitle>
            <CardDescription>Manage and track kit distribution status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="font-semibold text-blue-700 mb-1">Total Registrations</div>
                <div className="text-2xl font-bold">{totalRegistrations}</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4">
                <div className="font-semibold text-green-700 mb-1">Kits Claimed</div>
                <div className="text-2xl font-bold">{claimedKits}</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4">
                <div className="font-semibold text-orange-700 mb-1">Kits Unclaimed</div>
                <div className="text-2xl font-bold">{unclaimedKits}</div>
              </div>
            </div>
            
            <div className="mt-6">
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium">Distribution Progress</div>
                <div className="text-sm font-medium">{claimPercentage}%</div>
              </div>
              <div className="h-2 bg-gray-200 rounded-full">
                <div 
                  className="h-2 bg-green-500 rounded-full" 
                  style={{ width: `${claimPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="scan" className="flex items-center gap-2">
            <QrCode className="h-4 w-4" />
            QR Scanner
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <FileTextIcon className="h-4 w-4" />
            Participants List
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scan" className="mt-6">
          <KitDistributionScanner />
        </TabsContent>
        
        <TabsContent value="list" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Participants List</CardTitle>
              <CardDescription>View and manage kit claim status for all participants</CardDescription>
              
              <div className="pt-4 w-full flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name, email, registration ID..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Participant</TableHead>
                        <TableHead>Registration ID</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Kit Status</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRegistrations.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No participants found.
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredRegistrations.map((participant) => (
                          <TableRow key={participant.id} className="group">
                            <TableCell>
                              <div>
                                <div className="font-medium">{participant.first_name} {participant.last_name}</div>
                                <div className="text-sm text-muted-foreground">{participant.email}</div>
                              </div>
                            </TableCell>
                            <TableCell>{participant.registration_id}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{participant.category}</Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={participant.status === "confirmed" ? "default" : "outline"}>
                                {participant.status || "pending"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {participant.kit_claimed ? (
                                <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Claimed
                                </Badge>
                              ) : (
                                <Badge variant="outline">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Unclaimed
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="opacity-0 group-hover:opacity-100 transition-opacity"
                                onClick={() => handleViewDetails(participant)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                Details
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Participant Detail Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Participant Details</DialogTitle>
            <DialogDescription>
              View and update kit claim status for this participant
            </DialogDescription>
          </DialogHeader>
          
          {selectedParticipant && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">
                  {selectedParticipant.first_name} {selectedParticipant.last_name}
                </h3>
                <p className="text-sm text-muted-foreground">{selectedParticipant.email}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">Registration ID</p>
                  <p className="text-sm">{selectedParticipant.registration_id}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Category</p>
                  <p className="text-sm">{selectedParticipant.category}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Shirt Size</p>
                  <p className="text-sm">{selectedParticipant.shirt_size}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Payment Status</p>
                  <Badge variant={selectedParticipant.status === "confirmed" ? "default" : "outline"}>
                    {selectedParticipant.status || "pending"}
                  </Badge>
                </div>
              </div>
              
              <div className="border p-4 rounded-md bg-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <p className="font-medium">Kit Status</p>
                  <Badge className={
                    selectedParticipant.kit_claimed
                      ? "bg-green-100 text-green-800 hover:bg-green-200"
                      : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                  }>
                    {selectedParticipant.kit_claimed ? "Claimed" : "Unclaimed"}
                  </Badge>
                </div>
                
                {selectedParticipant.kit_claimed && (
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="font-medium w-24">Claimed By:</span>
                      <span>{selectedParticipant.claimed_by || "Not specified"}</span>
                    </div>
                    <div className="flex">
                      <span className="font-medium w-24">Claimed At:</span>
                      <span>
                        {selectedParticipant.claimed_at ? 
                          new Date(selectedParticipant.claimed_at).toLocaleString() : 
                          "Not recorded"}
                      </span>
                    </div>
                    {selectedParticipant.claim_notes && (
                      <div className="flex">
                        <span className="font-medium w-24">Notes:</span>
                        <span>{selectedParticipant.claim_notes}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
          
          <DialogFooter className="flex gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
            {selectedParticipant && (
              <Button
                onClick={() => handleSubmitClaim({
                  id: selectedParticipant.id,
                  kit_claimed: !selectedParticipant.kit_claimed,
                  claimed_by: selectedParticipant.kit_claimed ? null : "Manual Update",
                  claimed_at: selectedParticipant.kit_claimed ? null : new Date().toISOString(),
                  claim_notes: selectedParticipant.kit_claimed 
                    ? `Manually unclaimed on ${new Date().toLocaleString()}` 
                    : `Manually claimed on ${new Date().toLocaleString()}`
                })}
                variant={selectedParticipant.kit_claimed ? "destructive" : "default"}
                disabled={updateKitClaimStatus.isPending}
              >
                {updateKitClaimStatus.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : selectedParticipant.kit_claimed ? (
                  <>
                    <XCircle className="mr-2 h-4 w-4" />
                    Mark as Unclaimed
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Claimed
                  </>
                )}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
