import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, getCategoryColorClass, getStatusColorClass } from "@/lib/format-utils";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";

interface Registration {
  id: number;
  registration_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  age: number | null;
  gender: string | null;
  category: string;
  price: number;
  is_church_attendee: boolean;
  department: string | null;
  ministry: string | null;
  cluster: string | null;
  emergency_contact: string | null;
  emergency_phone: string | null;
  medical_conditions: string | null;
  shirt_size: string;
  status: string;
  created_at: string;
  payment_proof_url: string | null;
}

interface RegistrationDetailsProps {
  registration: Registration | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistrationDetails = ({ registration, open, onOpenChange }: RegistrationDetailsProps) => {
  if (!registration) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registration Details</DialogTitle>
          <DialogDescription>
            Complete registration information for {registration.first_name} {registration.last_name}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Registration ID and Status */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Registration ID</h3>
                  <p className="text-2xl font-bold text-primary">{registration.registration_id}</p>
                </div>
                <Badge className={getStatusColorClass(registration.status)}>
                  {registration.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Registered on {new Date(registration.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Personal Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Name:</span>
                    <p className="font-medium">{registration.first_name} {registration.last_name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Email:</span>
                    <p className="font-medium">{registration.email}</p>
                  </div>
                  {registration.phone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Phone:</span>
                      <p className="font-medium">{registration.phone}</p>
                    </div>
                  )}
                  {registration.age && (
                    <div>
                      <span className="text-sm text-muted-foreground">Age:</span>
                      <p className="font-medium">{registration.age}</p>
                    </div>
                  )}
                  {registration.gender && (
                    <div>
                      <span className="text-sm text-muted-foreground">Gender:</span>
                      <p className="font-medium">{registration.gender}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Race Information */}
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Race Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Category:</span>
                    <div className="mt-1">
                      <Badge className={getCategoryColorClass(registration.category)}>
                        {registration.category}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Registration Fee:</span>
                    <p className="font-medium text-green-600">{formatCurrency(registration.price)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Shirt Size:</span>
                    <p className="font-medium">{registration.shirt_size}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Church Information */}
          {registration.is_church_attendee && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Church Information</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-muted-foreground">Department:</span>
                    <p className="font-medium">{registration.department}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Ministry:</span>
                    <p className="font-medium">{registration.ministry}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Cluster:</span>
                    <p className="font-medium">{registration.cluster}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {(registration.emergency_contact || registration.emergency_phone || registration.medical_conditions) && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Emergency Information</h3>
                <div className="space-y-2">
                  {registration.emergency_contact && (
                    <div>
                      <span className="text-sm text-muted-foreground">Emergency Contact:</span>
                      <p className="font-medium">{registration.emergency_contact}</p>
                    </div>
                  )}
                  {registration.emergency_phone && (
                    <div>
                      <span className="text-sm text-muted-foreground">Emergency Phone:</span>
                      <p className="font-medium">{registration.emergency_phone}</p>
                    </div>
                  )}
                  {registration.medical_conditions && (
                    <div>
                      <span className="text-sm text-muted-foreground">Medical Conditions:</span>
                      <p className="font-medium">{registration.medical_conditions}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}          {/* Payment Proof */}
          {registration.payment_proof_url && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-4">Payment Proof</h3>
                <div className="aspect-[4/3] relative rounded-lg overflow-hidden border">                  <img 
                    src={registration.payment_proof_url} 
                    alt="Payment Proof"
                    className="object-contain w-full h-full max-h-[500px]"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      const img = e.target as HTMLImageElement;
                      img.onerror = null; // Prevent infinite loop
                      img.src = '/placeholder.svg'; // Fallback image
                    }}
                    loading="lazy"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Image URL: {registration.payment_proof_url}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
