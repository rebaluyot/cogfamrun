import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { getPaymentHistory, PaymentHistory } from "@/lib/payment-utils";
import { formatCurrency } from "@/lib/format-utils";
import { getPaymentStatusColorClass } from "@/lib/payment-styles";
import { ClipboardIcon, ClockIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PaymentHistoryComponentProps {
  registrationId: string;
}

export const PaymentHistoryComponent: React.FC<PaymentHistoryComponentProps> = ({ registrationId }) => {
  const [history, setHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!registrationId) {
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        const { data, error } = await getPaymentHistory(registrationId);
        
        if (error) {
          throw error;
        }
        
        setHistory(data || []);
      } catch (err) {
        console.error("Failed to fetch payment history:", err);
        setError("Failed to load payment history");
        toast({
          title: "Error",
          description: "Failed to load payment history",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchHistory();
  }, [registrationId, toast]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-8 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-4 text-red-500">
        <p>{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">
        <p>No payment history available</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center">
          <ClockIcon className="mr-2 h-5 w-5" />
          Payment History
        </CardTitle>
        <CardDescription>Track all changes to payment status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date & Time</TableHead>
                <TableHead>Status Changed To</TableHead>
                <TableHead>Previous Status</TableHead>
                <TableHead>Changed By</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="whitespace-nowrap">
                    {formatDate(entry.created_at)}
                  </TableCell>
                  <TableCell>
                    <Badge className={getPaymentStatusColorClass(entry.payment_status)}>
                      {entry.payment_status.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {entry.previous_status ? (
                      <Badge variant="outline" className={getPaymentStatusColorClass(entry.previous_status)}>
                        {entry.previous_status.toUpperCase()}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">None</span>
                    )}
                  </TableCell>
                  <TableCell>{entry.changed_by || "System"}</TableCell>
                  <TableCell>
                    {entry.notes ? (
                      <div className="max-w-md truncate" title={entry.notes}>
                        {entry.notes}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">No notes</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
