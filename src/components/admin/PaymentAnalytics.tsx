import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-utils";
import { Loader2 } from "lucide-react";

interface PaymentStats {
  totalRevenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  paymentByMethod: Record<string, { count: number; total: number; name: string }>;
  revenueByCategory: Record<string, { count: number; total: number }>;
}

export const PaymentAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");

  // Get payment analytics data
  const { data: paymentStats, isLoading } = useQuery({
    queryKey: ['payment-analytics'],
    queryFn: async () => {
      // Fetch all registrations with their payment data
      const { data: registrations, error } = await supabase
        .from('registrations')
        .select('*, payment_methods:payment_method_id(name)');

      if (error) {
        console.error('Error fetching payment analytics data:', error);
        throw error;
      }

      // Fetch payment methods to get names
      const { data: paymentMethods } = await supabase
        .from('payment_methods')
        .select('id, name');

      // Create a map for payment methods
      const methodsMap = new Map();
      if (paymentMethods) {
        paymentMethods.forEach(method => {
          methodsMap.set(method.id, method.name);
        });
      }

      // Initialize stats object
      const stats: PaymentStats = {
        totalRevenue: 0,
        confirmedPayments: 0,
        pendingPayments: 0,
        rejectedPayments: 0,
        paymentByMethod: {},
        revenueByCategory: {},
      };

      // Calculate stats from registrations
      registrations.forEach(registration => {
        const price = registration.price || 0;
        const category = registration.category || 'Unknown';
        const paymentStatus = registration.payment_status || 'pending';
        const methodId = registration.payment_method_id;
        const methodName = methodId ? (methodsMap.get(methodId) || 'Unknown') : 'Not specified';

        // Update counts based on payment status
        if (paymentStatus === 'confirmed') {
          stats.confirmedPayments += 1;
          stats.totalRevenue += price;

          // Update category stats
          if (!stats.revenueByCategory[category]) {
            stats.revenueByCategory[category] = { count: 0, total: 0 };
          }
          stats.revenueByCategory[category].count += 1;
          stats.revenueByCategory[category].total += price;
        } else if (paymentStatus === 'pending') {
          stats.pendingPayments += 1;
        } else if (paymentStatus === 'rejected') {
          stats.rejectedPayments += 1;
        }

        // Update payment method stats
        if (methodId) {
          const methodKey = methodId.toString();
          if (!stats.paymentByMethod[methodKey]) {
            stats.paymentByMethod[methodKey] = { count: 0, total: 0, name: methodName };
          }
          stats.paymentByMethod[methodKey].count += 1;
          if (paymentStatus === 'confirmed') {
            stats.paymentByMethod[methodKey].total += price;
          }
        }
      });

      return stats;
    },
  });

  // Sort payment methods by total revenue
  const sortedPaymentMethods = useMemo(() => {
    if (!paymentStats) return [];
    
    return Object.entries(paymentStats.paymentByMethod)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([key, value]) => ({
        id: key,
        name: value.name,
        count: value.count,
        total: value.total,
      }));
  }, [paymentStats]);

  // Sort categories by total revenue
  const sortedCategories = useMemo(() => {
    if (!paymentStats) return [];
    
    return Object.entries(paymentStats.revenueByCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([key, value]) => ({
        name: key,
        count: value.count,
        total: value.total,
      }));
  }, [paymentStats]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Revenue */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Revenue</CardDescription>
                <CardTitle className="text-3xl">
                  {formatCurrency(paymentStats?.totalRevenue || 0)}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  From {paymentStats?.confirmedPayments || 0} confirmed payments
                </p>
              </CardContent>
            </Card>

            {/* Pending Payments */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending Payments</CardDescription>
                <CardTitle className="text-3xl">{paymentStats?.pendingPayments || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Registrations awaiting payment verification
                </p>
              </CardContent>
            </Card>

            {/* Rejected Payments */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Rejected Payments</CardDescription>
                <CardTitle className="text-3xl">{paymentStats?.rejectedPayments || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Payments that were rejected or invalid
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Top Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Payment Method</CardTitle>
              <CardDescription>
                Breakdown of payments by payment method
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedPaymentMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.count} registrations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(method.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((method.total / (paymentStats?.totalRevenue || 1)) * 100)}% of total
                      </p>
                    </div>
                  </div>
                ))}

                {sortedPaymentMethods.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No payment data available</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="breakdown" className="space-y-4">
          {/* Revenue by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Category</CardTitle>
              <CardDescription>
                Breakdown of confirmed payments by race category
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedCategories.map((category) => (
                  <div key={category.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{category.name}</p>
                      <p className="text-sm text-muted-foreground">{category.count} registrations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(category.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((category.total / (paymentStats?.totalRevenue || 1)) * 100)}% of total
                      </p>
                    </div>
                  </div>
                ))}

                {sortedCategories.length === 0 && (
                  <p className="text-center text-muted-foreground py-4">No category data available</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional detailed analytics can be added here */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Summary</CardTitle>
              <CardDescription>
                Overview of payment status distribution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-xl font-bold text-green-700">{paymentStats?.confirmedPayments || 0}</p>
                  <p className="text-sm text-green-600">Confirmed</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-xl font-bold text-yellow-700">{paymentStats?.pendingPayments || 0}</p>
                  <p className="text-sm text-yellow-600">Pending</p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-xl font-bold text-red-700">{paymentStats?.rejectedPayments || 0}</p>
                  <p className="text-sm text-red-600">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
