import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RegistrationStats } from "@/components/RegistrationStats";
import { RecentRegistrations } from "@/components/RecentRegistrations";
import { RegistrationChart } from "@/components/RegistrationChart";
import { useRegistrationStats } from "@/hooks/useRegistrations";
import { formatCurrency } from "@/lib/format-utils";

const Dashboard = () => {
  const { data: stats, isLoading } = useRegistrationStats();

  if (isLoading) {
    return (
      <div className="container mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Loading registration data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground">Overview of COG FamRun 2025 registrations</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="overview" className="data-[state=active]:bg-background">Overview</TabsTrigger>
          <TabsTrigger value="registrations" className="data-[state=active]:bg-background">Registrations</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-background">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:bg-muted/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.total || 0}</div>
                <p className="text-xs text-muted-foreground">Overall registrations</p>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">3K Runners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.threek || 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {stats?.total ? Math.round((stats.threek / stats.total) * 100) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">6K Runners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.sixk || 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {stats?.total ? Math.round((stats.sixk / stats.total) * 100) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:bg-muted/5 transition-colors">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">10K Runners</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.tenk || 0}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20">
                    {stats?.total ? Math.round((stats.tenk / stats.total) * 100) : 0}%
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <RegistrationStats />
            <Card className="hover:bg-muted/5 transition-colors">
              <CardHeader>
                <CardTitle>Total Revenue</CardTitle>
                <CardDescription>Registration fees collected</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary">
                  {formatCurrency(stats?.revenue || 0)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  Average per registration: {formatCurrency(stats?.total ? Math.round((stats.revenue || 0) / stats.total) : 0)}
                </p>
                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Registrations</span>
                    <Badge variant="outline">{stats?.total || 0}</Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Most popular category</span>
                    <Badge className="bg-primary/10 text-primary">
                      {(stats?.threek || 0) >= (stats?.sixk || 0) && (stats?.threek || 0) >= (stats?.tenk || 0) ? '3K' :
                       (stats?.sixk || 0) >= (stats?.tenk || 0) ? '6K' : '10K'}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Registration Status</span>
                    <div className="flex gap-2">
                      <Badge variant="outline" className="bg-primary/5">Confirmed: {stats?.confirmed || 0}</Badge>
                      <Badge variant="outline" className="bg-muted">Pending: {stats?.pending || 0}</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="registrations">
          <RecentRegistrations />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6">
            <RegistrationChart />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Dashboard;
