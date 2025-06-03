import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useRegistrations } from "@/hooks/useRegistrations";
import { formatCurrency, getCategoryColorClass, getStatusColorClass } from "@/lib/format-utils";
import { RegistrationDetails } from "./RegistrationDetails";

export const RecentRegistrations = () => {
  const { data: registrations, isLoading } = useRegistrations();
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Loading registrations...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const recentRegistrations = registrations?.slice(0, 10) || [];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Recent Registrations</CardTitle>
          <CardDescription>Latest participants who registered ({registrations?.length || 0} total)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentRegistrations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No registrations found
              </div>
            ) : (
              recentRegistrations.map((registration) => (
                <div
                  key={registration.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback>
                        {registration.first_name[0]}{registration.last_name[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium">{registration.first_name} {registration.last_name}</h4>
                        <Badge className={getCategoryColorClass(registration.category)}>
                          {registration.category}
                        </Badge>
                        <Badge className={getStatusColorClass(registration.status || 'pending')}>
                          {registration.status || 'pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">ID: {registration.registration_id}</p>
                      {registration.department && (
                        <p className="text-xs text-gray-500">
                          {registration.department} • {registration.ministry} • {registration.cluster}
                        </p>
                      )}
                      {!registration.department && (
                        <p className="text-xs text-gray-500">Non-church attendee</p>
                      )}
                      <p className="text-xs text-gray-400">
                        {new Date(registration.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSelectedRegistration(registration);
                      setDialogOpen(true);
                    }}
                  >
                    View Details
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <RegistrationDetails
        registration={selectedRegistration}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </>
  );
};
