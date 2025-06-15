import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-utils";
import { Loader2, FileDown } from "lucide-react";
import * as XLSX from 'xlsx';
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, LineChart, Line 
} from 'recharts';

interface PaymentStats {
  totalRevenue: number;
  confirmedPayments: number;
  pendingPayments: number;
  rejectedPayments: number;
  unpaidRegistrations: number;
  potentialRevenue: number; // Total if all unpaid registered
  paymentByMethod: Record<string, { count: number; total: number; name: string }>;
  revenueByCategory: Record<string, { count: number; total: number }>;
  revenueByMinistry: Record<string, { count: number; total: number }>;
  registrationsByDate: Record<string, { confirmed: number; pending: number; rejected: number; unpaid: number; total: number }>;
}

export const PaymentAnalytics = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [exportLoading, setExportLoading] = useState(false);

  // Get payment analytics data
  const { data: paymentStats, isLoading, error: queryError, refetch } = useQuery({
    queryKey: ['payment-analytics'],
    queryFn: async () => {
      try {
        // Fetch all registrations
        const { data: registrations, error } = await supabase
          .from('registrations')
          .select('*');

        if (error) {
          throw error;
        }

        // Fetch payment methods separately
        const { data: paymentMethods, error: methodsError } = await supabase
          .from('payment_methods')
          .select('id, name');

        if (methodsError) {
          throw methodsError;
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
        unpaidRegistrations: 0,
        potentialRevenue: 0,
        paymentByMethod: {},
        revenueByCategory: {},
        revenueByMinistry: {},
        registrationsByDate: {},
      };

      // Calculate stats from registrations
      
      // Make sure registrations is an array before proceeding
      if (!registrations || !Array.isArray(registrations) || registrations.length === 0) {
        return stats; // Return empty stats object
      }
      
      registrations.forEach(registration => {
        const price = registration.price || 0;
        const category = registration.category || 'Unknown';
        const paymentStatus = registration.payment_status || 'pending';
        const methodId = registration.payment_method_id;
        const methodName = methodId ? (methodsMap.get(methodId) || 'Unknown') : 'Not specified';
        
        // Get registration date for timeline analytics
        const registrationDate = registration.created_at ? 
          new Date(registration.created_at).toISOString().split('T')[0] : 
          'Unknown Date';
        
        // Initialize the date entry if it doesn't exist
        if (!stats.registrationsByDate[registrationDate]) {
          stats.registrationsByDate[registrationDate] = {
            confirmed: 0,
            pending: 0,
            rejected: 0,
            unpaid: 0,
            total: 0
          };
        }
        
        // Increment the total for this date
        stats.registrationsByDate[registrationDate].total += 1;
        
        // Process each registration

        // Update counts based on payment status
        if (paymentStatus === 'confirmed') {
          stats.confirmedPayments += 1;
          stats.totalRevenue += price;
          stats.registrationsByDate[registrationDate].confirmed += 1;

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
          stats.registrationsByDate[registrationDate].pending += 1;
        } else if (paymentStatus === 'rejected') {
          stats.rejectedPayments += 1;
          stats.registrationsByDate[registrationDate].rejected += 1;
        } else if (paymentStatus === 'unpaid' || !paymentStatus) {
          // Track unpaid registrations
          stats.unpaidRegistrations += 1;
          stats.potentialRevenue += price;
          stats.registrationsByDate[registrationDate].unpaid += 1;
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
      
      // Analytics processing complete

      return stats;
      } catch (err) {
        console.error("Error processing payment analytics:", err);
        // Return empty stats object as fallback
        return {
          totalRevenue: 0,
          confirmedPayments: 0,
          pendingPayments: 0,
          rejectedPayments: 0,
          unpaidRegistrations: 0,
          potentialRevenue: 0,
          paymentByMethod: {},
          revenueByCategory: {},
          revenueByMinistry: {},
          registrationsByDate: {}
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
  
  // Process data for charts
  const chartColors = ['#4CAF50', '#FFC107', '#F44336', '#2196F3', '#9C27B0', '#00BCD4'];
  
  // Payment status chart data
  const paymentStatusData = useMemo(() => {
    if (!paymentStats) return [];
    
    return [
      { name: 'Confirmed', value: paymentStats.confirmedPayments, color: '#4CAF50' },
      { name: 'Pending', value: paymentStats.pendingPayments, color: '#FFC107' },
      { name: 'Rejected', value: paymentStats.rejectedPayments, color: '#F44336' },
      { name: 'Unpaid', value: paymentStats.unpaidRegistrations, color: '#2196F3' }
    ].filter(item => item.value > 0); // Only include non-zero values
  }, [paymentStats]);
  
  // Timeline data for registrations
  const timelineData = useMemo(() => {
    if (!paymentStats || !paymentStats.registrationsByDate) return [];
    
    return Object.entries(paymentStats.registrationsByDate)
      .sort((a, b) => a[0].localeCompare(b[0])) // Sort by date
      .map(([date, counts]) => ({
        date,
        confirmed: counts.confirmed,
        pending: counts.pending,
        rejected: counts.rejected,
        unpaid: counts.unpaid,
        total: counts.total
      }));
  }, [paymentStats]);
  
  // Custom tooltip for timeline chart
  const CustomTimelineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
          <p className="text-sm font-medium mb-2">{`Date: ${label}`}</p>
          <div className="space-y-1">
            <p className="text-xs text-gray-700">
              <span className="inline-block w-3 h-3 bg-[#8884d8] mr-2 rounded-full"></span>
              Total: {payload.find((p: any) => p.name === 'Total')?.value || 0}
            </p>
            <p className="text-xs text-green-700">
              <span className="inline-block w-3 h-3 bg-[#4CAF50] mr-2 rounded-full"></span>
              Confirmed: {payload.find((p: any) => p.name === 'Confirmed')?.value || 0}
            </p>
            <p className="text-xs text-yellow-700">
              <span className="inline-block w-3 h-3 bg-[#FFC107] mr-2 rounded-full"></span>
              Pending: {payload.find((p: any) => p.name === 'Pending')?.value || 0}
            </p>
            <p className="text-xs text-red-700">
              <span className="inline-block w-3 h-3 bg-[#F44336] mr-2 rounded-full"></span>
              Rejected: {payload.find((p: any) => p.name === 'Rejected')?.value || 0}
            </p>
            <p className="text-xs text-blue-700">
              <span className="inline-block w-3 h-3 bg-[#2196F3] mr-2 rounded-full"></span>
              Unpaid: {payload.find((p: any) => p.name === 'Unpaid')?.value || 0}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };
  
  // Payment method chart data
  const paymentMethodChartData = useMemo(() => {
    if (!paymentStats || !paymentStats.paymentByMethod) return [];
    
    // Calculate pending amounts per payment method
    const pendingByMethod = new Map();
    
    if (paymentStats.registrationsByDate) {
      Object.values(paymentStats.registrationsByDate).forEach(dateStats => {
        if (dateStats.pending > 0) {
          // Estimate an average price per registration based on confirmed payments
          const avgPrice = paymentStats.totalRevenue / Math.max(1, paymentStats.confirmedPayments);
          // Distribute pending payments proportionally among payment methods
          Object.entries(paymentStats.paymentByMethod).forEach(([key, value]) => {
            const methodShare = value.count / Math.max(1, Object.values(paymentStats.paymentByMethod).reduce((sum, m) => sum + m.count, 0));
            const pendingForMethod = (dateStats.pending * methodShare * avgPrice);
            pendingByMethod.set(key, (pendingByMethod.get(key) || 0) + pendingForMethod);
          });
        }
      });
    }
    
    return sortedPaymentMethods.slice(0, 5).map((method, index) => ({
      name: method.name,
      value: method.total,
      pendingValue: pendingByMethod.get(method.id) || 0,
      color: chartColors[index % chartColors.length]
    }));
  }, [paymentStats, sortedPaymentMethods]);
  
  // Ministry chart data
  const ministryChartData = useMemo(() => {
    if (!paymentStats || !paymentStats.revenueByMinistry) return [];
    
    // Calculate pending amounts per ministry
    const pendingByMinistry = new Map();
    
    if (paymentStats.registrationsByDate) {
      Object.values(paymentStats.registrationsByDate).forEach(dateStats => {
        if (dateStats.pending > 0) {
          // Estimate an average price per registration based on confirmed payments
          const avgPrice = paymentStats.totalRevenue / Math.max(1, paymentStats.confirmedPayments);
          // Distribute pending payments proportionally among ministries
          Object.entries(paymentStats.revenueByMinistry).forEach(([key, value]) => {
            const ministryShare = value.count / Math.max(1, Object.values(paymentStats.revenueByMinistry).reduce((sum, m) => sum + m.count, 0));
            const pendingForMinistry = (dateStats.pending * ministryShare * avgPrice);
            pendingByMinistry.set(key, (pendingByMinistry.get(key) || 0) + pendingForMinistry);
          });
        }
      });
    }
    
    return sortedMinistries.slice(0, 5).map((ministry, index) => ({
      name: ministry.name,
      value: ministry.total,
      pendingValue: pendingByMinistry.get(ministry.name) || 0,
      color: chartColors[index % chartColors.length]
    }));
  }, [paymentStats, sortedMinistries]);
  
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
          Metric: 'Potential Additional Revenue (Unpaid)',
          Value: paymentStats.potentialRevenue
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
        },
        {
          Metric: 'Unpaid Registrations',
          Value: paymentStats.unpaidRegistrations
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
      
      // Daily registrations data
      const timelineData = Object.entries(paymentStats.registrationsByDate).map(([date, counts]) => ({
        'Date': date,
        'Total Registrations': counts.total,
        'Confirmed': counts.confirmed,
        'Pending': counts.pending,
        'Rejected': counts.rejected,
        'Unpaid': counts.unpaid
      }));
      
      const timelineSheet = XLSX.utils.json_to_sheet(timelineData);
      XLSX.utils.book_append_sheet(workbook, timelineSheet, "Daily Registrations");
      
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
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="breakdown">Breakdown</TabsTrigger>
          <TabsTrigger value="ministry">Ministry</TabsTrigger>
          <TabsTrigger value="charts">Charts</TabsTrigger>
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

            {/* Unpaid Registrations */}
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Unpaid Registrations</CardDescription>
                <CardTitle className="text-3xl">{paymentStats?.unpaidRegistrations || 0}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Potential revenue: {formatCurrency(paymentStats?.potentialRevenue || 0)}
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
              <div className="grid grid-cols-4 gap-4 text-center">
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
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-xl font-bold text-blue-700">{paymentStats?.unpaidRegistrations || 0}</p>
                  <p className="text-sm text-blue-600">Unpaid</p>
                </div>
                
                {/* Payment completion rate */}
                <div className="col-span-4 mt-2 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center mb-2">
                    <div className="text-sm font-medium">Payment Completion Rate</div>
                    <div className="ml-auto text-sm font-bold">
                      {Math.round(
                        (paymentStats?.confirmedPayments || 0) / 
                        Math.max(1, (paymentStats?.confirmedPayments || 0) + 
                                  (paymentStats?.pendingPayments || 0) + 
                                  (paymentStats?.unpaidRegistrations || 0)) * 100
                      )}%
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                    <div 
                      className="bg-green-500 h-full" 
                      style={{ 
                        width: `${Math.round(
                          (paymentStats?.confirmedPayments || 0) / 
                          Math.max(1, (paymentStats?.confirmedPayments || 0) + 
                                    (paymentStats?.pendingPayments || 0) + 
                                    (paymentStats?.unpaidRegistrations || 0)) * 100
                        )}%` 
                      }}
                    ></div>
                  </div>
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
        
        <TabsContent value="charts" className="space-y-4">
          {/* Revenue Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
              <CardDescription>
                Current and potential revenue from registrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { 
                        name: 'Confirmed Revenue', 
                        value: paymentStats?.totalRevenue || 0,
                        color: '#4CAF50' 
                      },
                      {
                        name: 'Pending Revenue',
                        value: (paymentStats?.pendingPayments || 0) * 
                               ((paymentStats?.totalRevenue || 0) / Math.max(1, paymentStats?.confirmedPayments || 1)),
                        color: '#FFC107'
                      },
                      { 
                        name: 'Unpaid Potential Revenue', 
                        value: paymentStats?.potentialRevenue || 0,
                        color: '#2196F3'
                      },
                      { 
                        name: 'Total Potential Revenue', 
                        value: (paymentStats?.totalRevenue || 0) + 
                               (paymentStats?.potentialRevenue || 0) + 
                               ((paymentStats?.pendingPayments || 0) * 
                               ((paymentStats?.totalRevenue || 0) / Math.max(1, paymentStats?.confirmedPayments || 1))),
                        color: '#9C27B0'
                      }
                    ]}
                    margin={{
                      top: 20,
                      right: 30,
                      left: 30,
                      bottom: 5,
                    }}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(value) => formatCurrency(value)} />
                    <YAxis type="category" dataKey="name" width={150} />
                    <Tooltip
                      formatter={(value) => [formatCurrency(Number(value)), 'Amount']}
                      contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                    />
                    <Legend />
                    <Bar dataKey="value" name="Revenue">
                      {[
                        { name: 'Confirmed Revenue', value: paymentStats?.totalRevenue || 0, color: '#4CAF50' },
                        { 
                          name: 'Pending Revenue',
                          value: (paymentStats?.pendingPayments || 0) * ((paymentStats?.totalRevenue || 0) / Math.max(1, paymentStats?.confirmedPayments || 1)),
                          color: '#FFC107'
                        },
                        { name: 'Unpaid Potential Revenue', value: paymentStats?.potentialRevenue || 0, color: '#2196F3' },
                        { 
                          name: 'Total Potential Revenue', 
                          value: (paymentStats?.totalRevenue || 0) + 
                                 (paymentStats?.potentialRevenue || 0) + 
                                 ((paymentStats?.pendingPayments || 0) * ((paymentStats?.totalRevenue || 0) / Math.max(1, paymentStats?.confirmedPayments || 1))),
                          color: '#9C27B0'
                        }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Status Distribution Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Status Distribution</CardTitle>
              <CardDescription>
                Breakdown of registrations by payment status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {paymentStatusData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={paymentStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {paymentStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        formatter={(value) => [`${value} registrations`, 'Count']} 
                        contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No payment data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Registration Timeline Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Registration Timeline</CardTitle>
              <CardDescription>
                Daily registration counts by status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {timelineData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={timelineData}
                      margin={{
                        top: 5,
                        right: 30,
                        left: 20,
                        bottom: 5,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip content={<CustomTimelineTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="total" name="Total" stroke="#8884d8" activeDot={{ r: 8 }} />
                      <Line type="monotone" dataKey="confirmed" name="Confirmed" stroke="#4CAF50" />
                      <Line type="monotone" dataKey="pending" name="Pending" stroke="#FFC107" />
                      <Line type="monotone" dataKey="rejected" name="Rejected" stroke="#F44336" />
                      <Line type="monotone" dataKey="unpaid" name="Unpaid" stroke="#2196F3" />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No timeline data available</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          
          {/* Payment Methods Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Payment Methods</CardTitle>
                <CardDescription>Revenue by payment method</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {paymentMethodChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={paymentMethodChartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            return [formatCurrency(Number(value)), name === 'Revenue' ? 'Confirmed Revenue' : 'Estimated Pending Revenue'];
                          }} 
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Revenue" stackId="a">
                          {paymentMethodChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                        <Bar dataKey="pendingValue" name="Pending" stackId="a" fill="#FFC107" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No payment method data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            {/* Ministry Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Top Ministries</CardTitle>
                <CardDescription>Revenue by ministry</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  {ministryChartData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={ministryChartData}
                        margin={{
                          top: 5,
                          right: 30,
                          left: 20,
                          bottom: 5,
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => {
                            return [formatCurrency(Number(value)), name === 'Revenue' ? 'Confirmed Revenue' : 'Estimated Pending Revenue'];
                          }}
                          contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }}
                        />
                        <Legend />
                        <Bar dataKey="value" name="Revenue" stackId="a">
                          {ministryChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                        <Bar dataKey="pendingValue" name="Pending" stackId="a" fill="#FFC107" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <p className="text-muted-foreground">No ministry data available</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
