import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ClaimLocationManagement } from "@/components/admin/ClaimLocationManagement";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router-dom";

export const ClaimLocationsAdmin = () => {
  return (
    <ProtectedRoute requiredPermission="isAdmin">
      <div className="container max-w-5xl mx-auto py-6 space-y-6">
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold tracking-tight">Claim Locations</h1>
            <Button asChild variant="outline" size="sm">
              <Link to="/admin">
                <ChevronLeft className="mr-1 h-4 w-4" />
                Back to Admin
              </Link>
            </Button>
          </div>
          <p className="text-muted-foreground">
            Manage locations where participants can claim their race kits. These locations will be available in the kit distribution interface.
          </p>
        </div>

        <ClaimLocationManagement />
      </div>
    </ProtectedRoute>
  );
};

export default ClaimLocationsAdmin;
