
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/format-utils";

export const RegistrationChart = () => {
  const [dailyData, setDailyData] = useState<Array<{date: string, registrations: number}>>([]);
  const [categoryData, setCategoryData] = useState<Array<{category: string, count: number, revenue: number}>>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch daily registration data
        const today = new Date();
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        // Format date to ISO string and trim to date only (YYYY-MM-DD)
        const fromDate = sevenDaysAgo.toISOString().split('T')[0];
        
        const { data: dailyRegistrations, error: dailyError } = await supabase
          .from('registrations')
          .select('created_at')
          .gte('created_at', fromDate);
          
        if (dailyError) {
          console.error('Error fetching daily data:', dailyError);
        } else {
          // Process and group the data by date
          const dailyCounts = dailyRegistrations.reduce((acc: Record<string, number>, reg) => {
            const date = new Date(reg.created_at).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric' 
            });
            acc[date] = (acc[date] || 0) + 1;
            return acc;
          }, {});
          
          // Convert to array format for the chart
          const formattedDailyData = Object.keys(dailyCounts)
            .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
            .map(date => ({
              date,
              registrations: dailyCounts[date]
            }));
          
          setDailyData(formattedDailyData.length > 0 ? formattedDailyData : [
            { date: "No Data", registrations: 0 }
          ]);
        }
        
        // Fetch category data
        const { data: categoryRegistrations, error: categoryError } = await supabase
          .from('registrations')
          .select('category, price');
          
        if (categoryError) {
          console.error('Error fetching category data:', categoryError);
        } else {
          // Process and group by category
          const categoryCounts = categoryRegistrations.reduce((acc: Record<string, {count: number, revenue: number}>, reg) => {
            const { category, price } = reg;
            if (!acc[category]) {
              acc[category] = { count: 0, revenue: 0 };
            }
            acc[category].count += 1;
            acc[category].revenue += price || 0;
            return acc;
          }, {});
          
          // Convert to array format for the chart
          const formattedCategoryData = Object.keys(categoryCounts).map(category => ({
            category,
            count: categoryCounts[category].count,
            revenue: categoryCounts[category].revenue
          }));
          
          setCategoryData(formattedCategoryData.length > 0 ? formattedCategoryData : [
            { category: "No Data", count: 0, revenue: 0 }
          ]);
        }
      } catch (error) {
        console.error('Error fetching chart data:', error);
        setDailyData([{ date: "Error", registrations: 0 }]);
        setCategoryData([{ category: "Error", count: 0, revenue: 0 }]);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchChartData();
  }, []);

  // Custom tooltip formatter for the revenue chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border rounded shadow-sm">
          <p className="font-medium">{`${label}`}</p>
          <p className="text-sm">{`Registrations: ${payload[0].value}`}</p>
          {payload[1] && <p className="text-sm text-green-600">{`Revenue: ${formatCurrency(payload[1].value)}`}</p>}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Daily Registrations</CardTitle>
          <CardDescription>Registration trend over the past week</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="registrations"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Category Distribution</CardTitle>
          <CardDescription>Registrations by race category</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="h-[300px] flex items-center justify-center">
              <p className="text-gray-500">Loading chart data...</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Registrations" />
                <Bar yAxisId="right" dataKey="revenue" fill="#10b981" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
