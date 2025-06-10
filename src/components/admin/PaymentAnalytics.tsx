import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-utils";
import { Loader2, FileDown } from "lucide-react";
import * as XLSX from 'xlsx';

interface PaymentStats {
  totalRevenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  paymentByMethod: Record<string, { count: number; total: number; name: string }>;
  revenueByCategory: Record<string, { count: number; total: number }>;
  revenueByMinistry: Record<string, { count: number; total: number }>;
}

export const PaymentAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [exportLoading, setExportLoading] = useState(false);

  // Get payment analytics data
  const { data: paymentStats, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['payment-analytics'],
    queryFn: async () => {
      console.log("Fetching payment analytics data...");
      
      try {
        // Fetch all registrations
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select('*');

        if (error) {
          console.error('Error fetching payment analytics data:', error);
          throw error;
        }

      console.log(`Fetched ${registrations?.length || 0} registrations`);

      // Fetch payment methods separately
      const { data: paymentMethods, error: methodsError } = await supabase
        .from('payment_methods')
        .select('id, name');

      if (methodsError) {
        console.error('Error fetching payment methods:', methodsError);
      } else {
        console.log(`Fetched ${paymentMethods?.length || 0} payment methods`);
      }

      // Create a map for payment methods
      const methodsMap = new Map();
      if (paymentMethods && paymentMethods.length > 0) {
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
        revenueByMinistry: {},
      };

      // Calculate stats from registrations
      console.log("Processing registration data for analytics...");
      
      // Make sure registrations is an array before proceeding
      if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
        console.log("No registrations found for analytics, or data is not in expected format");
        return stats; // Return empty stats object
      }
      
      registrations.forEach(registration => {
        const price = registration.price || 0;
        const category = registration.category || 'Unknown';
        const paymentStatus = registration.payment_status || 'pending';
        const methodId = registration.payment_method_id;
        const methodName = methodId ? (methodsMap.get(methodId) || 'Unknown') : 'Not specified';
        
        // Debug payment method info for first few registrations
        if (registrations.indexOf(registration) < 3) {
          console.log(`Registration ${registration.registration_id}: method_id=${methodId}, status=${paymentStatus}, price=${price}`);
        }

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
          
          // Update ministry stats
          const ministry = registration.ministry || 'Not specified';
          if (!stats.revenueByMinistry[ministry]) {
            stats.revenueByMinistry[ministry] = { count: 0, total: 0 };
          }
          stats.revenueByMinistry[ministry].count += 1;
          stats.revenueByMinistry[ministry].total += price;
        } else if (paymentStatus === 'pending') {
          stats.pendingPayments += 1;
        } else if (paymentStatus === 'rejected') {
          stats.rejectedPayments += 1;
        }

        // Update payment method stats
        const methodKey = methodId ? methodId.toString() : 'unknown';
        const methodDisplayName = methodId ? methodName : 'Not specified';
        
        if (!stats.paymentByMethod[methodKey]) {
          stats.paymentByMethod[methodKey] = { count: 0, total: 0, name: methodDisplayName };
        }
        
        stats.paymentByMethod[methodKey].count += 1;
        if (paymentStatus === 'confirmed') {
          stats.paymentByMethod[methodKey].total += price;
        }
      });
      
      // Make sure we have at least one method entry if we have registrations but no methods
      if (Object.keys(stats.paymentByMethod).length === 0 && registrations.length > 0) {
        stats.paymentByMethod['unknown'] = { count: registrations.length, total: stats.totalRevenue, name: 'Not specified' };
      }
      
      console.log("Analytics summary:", {
        totalRevenue: stats.totalRevenue,
        confirmedPayments: stats.confirmedPayments,
        pendingPayments: stats.pendingPayments,
        rejectedPayments: stats.rejectedPayments,
        paymentMethodCount: Object.keys(stats.paymentByMethod).length,
        categoryCount: Object.keys(stats.revenueByCategory).length
      });

      return stats;
      } catch (err) {
        console.error("Error processing payment analytics:", err);
        // Return empty stats object as fallback
        return {
          totalRevenue: 0,
          confirmedPayments: 0,
          pendingPayments: 0,
          rejectedPayments: 0,
          paymentByMethod: {},
          revenueByCategory: {},
          revenueByMinistry: {}
        };
      }
    },
  });

  // Sort payment methods by total revenue
  const sortedPaymentMethods = useMemo(() => {
    if (!paymentStats || !paymentStats.paymentByMethod) return [];
    
    return Object.entries(paymentStats.paymentByMethod)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([key, value]) => ({
        id: key,
        name: value.name || 'Unnamed Method',
        count: value.count,
        total: value.total,
      }));
  }, [paymentStats]);

  // Sort categories by total revenue
  const sortedCategories = useMemo(() => {
    if (!paymentStats || !paymentStats.revenueByCategory) return [];
    
    return Object.entries(paymentStats.revenueByCategory)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([key, value]) => ({
        name: key || 'Unknown Category',
        count: value.count,
        total: value.total,
      }));
  }, [paymentStats]);
  
  // Sort ministries by total revenue
  const sortedMinistries = useMemo(() => {
    if (!paymentStats || !paymentStats.revenueByMinistry) return [];
    
    return Object.entries(paymentStats.revenueByMinistry)
      .sort((a, b) => b[1].total - a[1].total)
      .map(([key, value]) => ({
        name: key || 'Unknown Ministry',
        count: value.count,
        total: value.total,
      }));
  }, [paymentStats]);
  
  // Export analytics data to Excel
  const exportToExcel = async () => {
    if (!paymentStats) return;
    
    try {
      setExportLoading(true);
      
      // Create workbook and add worksheets
      const workbook = XLSX.utils.book_new();
      
      // Overview worksheet
      const overviewData = [
        { 
          Metric: 'Total Revenue', 
          Value: paymentStats.totalRevenue 
        },
        { 
          Metric: 'Confirmed Payments', 
          Value: paymentStats.confirmedPayments 
        },
        { 
          Metric: 'Pending Payments', 
          Value: paymentStats.pendingPayments 
        },
        { 
          Metric: 'Rejected Payments', 
          Value: paymentStats.rejectedPayments 
        }
      ];
      
      const overviewSheet = XLSX.utils.json_to_sheet(overviewData);
      XLSX.utils.book_append_sheet(workbook, overviewSheet, "Overview");
      
      // Payment Methods worksheet
      const paymentMethodsData = Object.entries(paymentStats.paymentByMethod).map(([key, value]) => ({
        'Method': value.name || 'Unknown',
        'Registrations': value.count,
        'Revenue': value.total,
        'Percentage': (value.total / (paymentStats.totalRevenue || 1)) * 100
      }));
      
      const methodsSheet = XLSX.utils.json_to_sheet(paymentMethodsData);
      XLSX.utils.book_append_sheet(workbook, methodsSheet, "Payment Methods");
      
      // Categories worksheet
      const categoriesData = Object.entries(paymentStats.revenueByCategory).map(([key, value]) => ({
        'Category': key || 'Unknown',
        'Registrations': value.count,
        'Revenue': value.total,
        'Percentage': (value.total / (paymentStats.totalRevenue || 1)) * 100
      }));
      
      const categoriesSheet = XLSX.utils.json_to_sheet(categoriesData);
      XLSX.utils.book_append_sheet(workbook, categoriesSheet, "Categories");
      
      // Ministries worksheet
      const ministriesData = Object.entries(paymentStats.revenueByMinistry).map(([key, value]) => ({
        'Ministry': key || 'Unknown',
        'Registrations': value.count,
        'Revenue': value.total,
        'Percentage': (value.total / (paymentStats.totalRevenue || 1)) * 100
      }));
      
      const ministriesSheet = XLSX.utils.json_to_sheet(ministriesData);
      XLSX.utils.book_append_sheet(workbook, ministriesSheet, "Ministries");
      
      // Generate file name with current date
      const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const fileName = `payment-analytics-${date}.xlsx`;
      
      // Write and download the file
      XLSX.writeFile(workbook, fileName);
      
    } catch (error) {
      console.error("Error exporting data to Excel:", error);
    } finally {
      setExportLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  
  // Show error state if query failed
  if (queryError) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-6">
            <h3 className="text-xl font-medium text-red-600 mb-2">Error Loading Payment Analytics</h3>
            <p className="text-gray-600 mb-4">
              There was a problem loading the payment analytics data.
            </p>
            <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4 mx-auto max-w-md text-left">
              <p className="text-sm font-mono text-red-800 break-all overflow-auto max-h-32">
                {queryError.message || "Unknown error occurred"}
              </p>
            </div>
            <p className="text-sm text-gray-500">
              Try refreshing the page or contact the system administrator if this problem persists.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Check if we have any data
  const hasData = paymentStats && (
    paymentStats.confirmedPayments > 0 || 
    paymentStats.pendingPayments > 0 ||
    paymentStats.rejectedPayments > 0
  );

  return (
    <div className="space-y-6">
      {!hasData && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No Payment Data Available</h3>
              <p className="text-gray-500 mb-4">
                There are no payment records to analyze. This could be because:
              </p>
              <ul className="text-sm text-gray-600 list-disc list-inside space-y-1 max-w-md mx-auto text-left">
                <li>No registrations have been processed yet</li>
                <li>No payment methods have been set up</li>
                <li>No payments have been confirmed</li>
              </ul>
              <p className="text-sm text-gray-500 mt-4">
                Check the payment verification section to manage and confirm pending payments.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Payment Analytics</h2>
        <div className="flex gap-2">
          <button
            onClick={exportToExcel}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-green-100 hover:bg-green-200 rounded-md transition-colors"
            disabled={exportLoading || isLoading || !hasData}
          >
            {exportLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FileDown className="h-4 w-4" />
            )}
            Export to Excel
          </button>
          <button
            onClick={() => refetch()}
            className="flex items-center gap-2 px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"></path>
                <path d="M21 3v5h-5"></path>
                <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"></path>
                <path d="M8 16H3v5"></path>
              </svg>
            )}
            Refresh Data
          </button>
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="ministry">Ministry</TabsTrigger>
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
                      <p className="font-medium">
                        {method.name}
                        {method.id === 'unknown' && (
                          <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">Missing method ID</span>
                        )}
                      </p>
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

                {(!sortedPaymentMethods || sortedPaymentMethods.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="mb-2">No payment method data available</p>
                    <p className="text-xs">Set up payment methods and process registrations to see analytics</p>
                  </div>
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

                {(!sortedCategories || sortedCategories.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="mb-2">No category revenue data available</p>
                    <p className="text-xs">Confirm payments to see category revenue breakdown</p>
                  </div>
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

        <TabsContent value="ministry" className="space-y-4">
          {/* Revenue by Ministry */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by Ministry</CardTitle>
              <CardDescription>
                Breakdown of confirmed payments by ministry
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sortedMinistries.map((ministry) => (
                  <div key={ministry.name} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{ministry.name}</p>
                      <p className="text-sm text-muted-foreground">{ministry.count} registrations</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{formatCurrency(ministry.total)}</p>
                      <p className="text-sm text-muted-foreground">
                        {Math.round((ministry.total / (paymentStats?.totalRevenue || 1)) * 100)}% of total
                      </p>
                    </div>
                  </div>
                ))}

                {(!sortedMinistries || sortedMinistries.length === 0) && (
                  <div className="text-center text-muted-foreground py-8">
                    <p className="mb-2">No ministry revenue data available</p>
                    <p className="text-xs">Confirm payments with ministry information to see breakdown</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
