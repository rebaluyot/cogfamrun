
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useRegistrationStats } from "@/hooks/useRegistrations";
import { formatCurrency } from "@/lib/format-utils";

export const RegistrationStats = () => {
  const { data: stats, isLoading } = useRegistrationStats();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Registration Progress</CardTitle>
          <CardDescription>Loading registration data...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const categories = [
    { 
      name: "3K", 
      registered: stats?.threek || 0, 
      capacity: 2000, 
      color: "bg-green-500" 
    },
    { 
      name: "6K", 
      registered: stats?.sixk || 0, 
      capacity: 1500, 
      color: "bg-blue-500" 
    },
    { 
      name: "10K", 
      registered: stats?.tenk || 0, 
      capacity: 500, 
      color: "bg-purple-500" 
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registration Progress</CardTitle>
        <CardDescription>Current registrations vs capacity</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {categories.map((category) => {
          const percentage = (category.registered / category.capacity) * 100;
          return (
            <div key={category.name} className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium">{category.name}</span>
                <span className="text-muted-foreground">
                  {category.registered}/{category.capacity}
                </span>
              </div>
              <Progress value={percentage} className="h-2" />
              <div className="text-xs text-muted-foreground">
                {percentage.toFixed(1)}% filled
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
