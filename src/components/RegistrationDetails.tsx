import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, getCategoryColorClass, getStatusColorClass } from "@/lib/format-utils";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

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
  payment_reference_number: string | null;
  payment_method_id: number | null;
  payment_status: string | null;
  payment_date: string | null;
  payment_confirmed_by: string | null;
  payment_notes: string | null;
  payment_method_name?: string;
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
      <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto p-3 md:p-4">
        <DialogHeader className="pb-1">
          <div className="flex justify-between items-center">
            <DialogTitle className="text-base">Registration Details</DialogTitle>
            <Button variant="ghost" size="icon" onClick={() => onOpenChange(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription className="text-xs">
            Information for {registration.first_name} {registration.last_name}
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="grid gap-3">
          {/* Registration ID and Status */}
          <div className="flex items-center justify-between py-1">
            <div className="overflow-hidden">
              <h3 className="text-xs font-medium text-muted-foreground">Registration ID</h3>
              <p className="text-lg font-bold text-primary truncate">{registration.registration_id}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(registration.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </p>
            </div>
            <Badge className={`${getStatusColorClass(registration.status)} text-sm px-2 py-0.5`}>
              {registration.status.charAt(0).toUpperCase() + registration.status.slice(1)}
            </Badge>
          </div>

          <Separator />

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Personal Information */}
            <div>
              <h3 className="text-xs font-semibold mb-1">Personal Information</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-16 flex-shrink-0">Name:</dt>
                  <dd className="font-medium flex-1 min-w-0 truncate">{registration.first_name} {registration.last_name}</dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-16 flex-shrink-0">Email:</dt>
                  <dd className="font-medium flex-1 min-w-0 text-xs break-all line-clamp-2">{registration.email}</dd>
                </div>
                {registration.phone && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-16 flex-shrink-0">Phone:</dt>
                    <dd className="font-medium flex-1 min-w-0">{registration.phone}</dd>
                  </div>
                )}
                {registration.age && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-16 flex-shrink-0">Age:</dt>
                    <dd className="font-medium flex-1 min-w-0">{registration.age}</dd>
                  </div>
                )}
                {registration.gender && (
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-16 flex-shrink-0">Gender:</dt>
                    <dd className="font-medium flex-1 min-w-0">{registration.gender}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Race Information */}
            <div>
              <h3 className="text-xs font-semibold mb-1">Race Information</h3>
              <dl className="space-y-1 text-sm">
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-16 flex-shrink-0">Category:</dt>
                  <dd className="flex-1 min-w-0">
                    <Badge className={getCategoryColorClass(registration.category)}>
                      {registration.category}
                    </Badge>
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-16 flex-shrink-0">Fee:</dt>
                  <dd className="font-medium text-green-600 flex-1 min-w-0">
                    {formatCurrency(registration.price)}
                  </dd>
                </div>
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-16 flex-shrink-0">Shirt Size:</dt>
                  <dd className="font-medium flex-1 min-w-0">{registration.shirt_size}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Church Information */}
          {registration.is_church_attendee && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-1">Church Information</h3>
                <dl className="text-sm space-y-1">
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-20 flex-shrink-0">Department:</dt>
                    <dd className="font-medium flex-1 min-w-0 truncate">{registration.department}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-20 flex-shrink-0">Ministry:</dt>
                    <dd className="font-medium flex-1 min-w-0 truncate">{registration.ministry}</dd>
                  </div>
                  <div className="flex gap-1">
                    <dt className="text-muted-foreground w-20 flex-shrink-0">Cluster:</dt>
                    <dd className="font-medium flex-1 min-w-0 truncate">{registration.cluster}</dd>
                  </div>
                </dl>
              </div>
            </>
          )}

          {/* Emergency Contact */}
          {(registration.emergency_contact || registration.emergency_phone || registration.medical_conditions) && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-1">Emergency Information</h3>
                <dl className="space-y-1 text-sm">
                  {registration.emergency_contact && (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground w-16 flex-shrink-0">Contact:</dt>
                      <dd className="font-medium flex-1 min-w-0 truncate">{registration.emergency_contact}</dd>
                    </div>
                  )}
                  {registration.emergency_phone && (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground w-16 flex-shrink-0">Phone:</dt>
                      <dd className="font-medium flex-1 min-w-0">{registration.emergency_phone}</dd>
                    </div>
                  )}
                  {registration.medical_conditions && (
                    <div className="flex gap-1">
                      <dt className="text-muted-foreground w-16 flex-shrink-0">Medical:</dt>
                      <dd className="font-medium flex-1 min-w-0 truncate">{registration.medical_conditions}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </>
          )}

          {/* Payment Proof */}
          {registration.payment_proof_url && (
            <>
              <Separator />
              <div>
                <h3 className="text-xs font-semibold mb-1">Payment Proof</h3>
                <div className="aspect-[4/3] rounded-md overflow-hidden border bg-muted">
                  <img 
                    src={registration.payment_proof_url} 
                    alt="Payment Proof"
                    className="object-contain w-full h-full"
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      const img = e.target as HTMLImageElement;
                      img.onerror = null; // Prevent infinite loop
                      img.src = '/placeholder.svg'; // Fallback image
                    }}
                    loading="lazy"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1 break-all line-clamp-1">
                  {registration.payment_proof_url}
                </p>
              </div>
            </>
          )}

          {/* Payment Information */}
          <Separator />
          <div>
            <h3 className="text-xs font-semibold mb-1">Payment Information</h3>
            <dl className="space-y-1 text-sm">
              <div className="flex gap-1">
                <dt className="text-muted-foreground w-20 flex-shrink-0">Status:</dt>
                <dd className="flex-1 min-w-0">
                  <Badge className={`${
                    registration.payment_status === 'confirmed' ? 'bg-green-100 text-green-800' :
                    registration.payment_status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {(registration.payment_status || 'pending').toUpperCase()}
                  </Badge>
                </dd>
              </div>
              
              <div className="flex gap-1">
                <dt className="text-muted-foreground w-20 flex-shrink-0">Method:</dt>
                <dd className="font-medium flex-1 min-w-0 truncate">
                  {registration.payment_method_name || 'Not specified'}
                </dd>
              </div>
              
              {registration.payment_reference_number && (
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-20 flex-shrink-0">Reference #:</dt>
                  <dd className="font-medium flex-1 min-w-0 truncate">
                    {registration.payment_reference_number}
                  </dd>
                </div>
              )}
              
              {registration.payment_date && (
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-20 flex-shrink-0">Date:</dt>
                  <dd className="font-medium flex-1 min-w-0">
                    {new Date(registration.payment_date).toLocaleString()}
                  </dd>
                </div>
              )}
              
              {registration.payment_confirmed_by && (
                <div className="flex gap-1">
                  <dt className="text-muted-foreground w-20 flex-shrink-0">Verified by:</dt>
                  <dd className="font-medium flex-1 min-w-0 truncate">
                    {registration.payment_confirmed_by}
                  </dd>
                </div>
              )}
              
              {registration.payment_notes && (
                <div className="mt-1 pt-1 border-t">
                  <dt className="text-muted-foreground text-xs mb-0.5">Notes:</dt>
                  <dd className="text-xs bg-slate-50 p-1.5 rounded border">
                    {registration.payment_notes}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
