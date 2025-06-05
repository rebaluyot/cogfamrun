import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Search, Mail, ExternalLink, Loader2, RefreshCw } from "lucide-react";

// Define the interface for email notifications matching the database schema
interface EmailNotification {
  id: number;
  email: string;
  recipient_name: string | null;
  registration_id: string | null;
  email_type: string;
  subject: string;
  body: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export const EmailNotifications = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Fetch email notifications
  const { data: notifications, isLoading, refetch } = useQuery({
    queryKey: ['email-notifications'],
    queryFn: async () => {
      // Use SQL query to bypass type checking
      const { data, error } = await supabase
        .from('email_notifications' as any)
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) {
        console.error('Error fetching email notifications:', error);
        throw error;
      }

      // Use a type assertion for the returned data
      return data as unknown as EmailNotification[];
    },
  });

  // Filter notifications based on search term
  const filteredNotifications = notifications?.filter(notification => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      notification.email.toLowerCase().includes(searchLower) ||
      notification.recipient_name?.toLowerCase().includes(searchLower) ||
      notification.registration_id?.toLowerCase().includes(searchLower) ||
      notification.subject.toLowerCase().includes(searchLower) ||
      notification.email_type.toLowerCase().includes(searchLower)
    );
  });

  // Get email type display name
  const getEmailTypeDisplay = (emailType: string) => {
    switch (emailType) {
      case 'payment_confirmed':
        return 'Payment Confirmed';
      case 'payment_rejected':
        return 'Payment Rejected';
      case 'payment_pending':
        return 'Payment Pending';
      default:
        return emailType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // View email details
  const handleViewDetails = (notification: EmailNotification) => {
    setSelectedEmail(notification);
    setIsDialogOpen(true);
  };

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Email Notifications</CardTitle>
          <CardDescription>Track and manage email communications with participants</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="relative max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email, name, registration ID..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                <RefreshCw className="h-4 w-4 mr-1" />
                Refresh
              </Button>
            </div>
            
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date Sent</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Email Type</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredNotifications && filteredNotifications.length > 0 ? (
                    filteredNotifications.map((notification) => (
                      <TableRow key={notification.id}>
                        <TableCell className="font-medium whitespace-nowrap">
                          {formatDate(notification.sent_at)}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{notification.recipient_name || 'Unnamed'}</div>
                          <div className="text-sm text-muted-foreground">{notification.email}</div>
                        </TableCell>
                        <TableCell>{getEmailTypeDisplay(notification.email_type)}</TableCell>
                        <TableCell className="max-w-[200px] truncate">{notification.subject}</TableCell>
                        <TableCell>
                          <Badge className={getStatusBadgeColor(notification.status)}>
                            {notification.status.toUpperCase()}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleViewDetails(notification)}>
                            <Mail className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center">
                        {notifications && notifications.length > 0 ? (
                          <div className="text-muted-foreground">No matching notifications found</div>
                        ) : (
                          <div className="text-muted-foreground">No email notifications have been sent yet</div>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Email Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Email Details</DialogTitle>
            <DialogDescription>
              Sent on {selectedEmail && formatDate(selectedEmail.sent_at)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedEmail && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium mb-2">Recipient</h3>
                  <div className="text-sm space-y-1">
                    <p><span className="font-medium">Name:</span> {selectedEmail.recipient_name || 'Not specified'}</p>
                    <p><span className="font-medium">Email:</span> {selectedEmail.email}</p>
                    <p><span className="font-medium">Registration ID:</span> {selectedEmail.registration_id || 'Not linked'}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium mb-2">Email Information</h3>
                  <div className="text-sm space-y-1">
                    <p>
                      <span className="font-medium">Status:</span>{" "}
                      <Badge className={getStatusBadgeColor(selectedEmail.status)}>
                        {selectedEmail.status.toUpperCase()}
                      </Badge>
                    </p>
                    <p><span className="font-medium">Type:</span> {getEmailTypeDisplay(selectedEmail.email_type)}</p>
                    <p><span className="font-medium">Sent:</span> {formatDate(selectedEmail.sent_at)}</p>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Subject</h3>
                <div className="text-sm bg-muted p-3 rounded-md">
                  {selectedEmail.subject}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Email Content</h3>
                <div className="bg-white border rounded-md p-4 whitespace-pre-wrap font-mono text-xs">
                  {selectedEmail.body || 'No content available'}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
