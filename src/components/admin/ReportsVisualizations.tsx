import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download } from "lucide-react";
import { 
  BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer 
} from 'recharts';
import { useRegistrations } from "@/hooks/useRegistrations";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";
import { formatCurrency } from "@/lib/format-utils";
import * as XLSX from 'xlsx';

export const ReportsVisualizations: React.FC = () => {
  const { toast } = useToast();
  const { data: registrations, isLoading } = useRegistrations();
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();

  // State for chart data
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [ministryData, setMinistryData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [churchAttendanceData, setChurchAttendanceData] = useState<any[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [activeTab, setActiveTab] = useState("departments");

  // COLORS for charts
  const CHART_COLORS = [
    "#3b82f6", // blue
    "#10b981", // green
    "#f59e0b", // amber
    "#8b5cf6", // purple
    "#ef4444", // red
    "#14b8a6", // teal
    "#ec4899", // pink
    "#6366f1", // indigo
    "#f97316", // orange
    "#06b6d4", // cyan
  ];

  // Process data when registrations are loaded
  useEffect(() => {
    if (!registrations || isLoading) return;

    // Process Department Data
    processDepartmentData();
    
    // Process Ministry Data
    processMinistryData();
    
    // Process Category Data
    processCategoryData();
    
    // Process Church Attendance Data
    processChurchAttendanceData();

  }, [registrations, departments, ministries, clusters, isLoading]);

  const processDepartmentData = () => {
    if (!registrations || !departments) return;

    // Create a map to store department counts and revenue
    const deptMap: Record<string, { count: number, revenue: number }> = {};
    
    // Initialize with all departments (even those with 0 registrations)
    departments.forEach(dept => {
      deptMap[dept.name] = { count: 0, revenue: 0 };
    });
    
    // Add special categories
    deptMap["Non-church attendee"] = { count: 0, revenue: 0 };
    deptMap["Church member - No department"] = { count: 0, revenue: 0 };
    
    // Count registrations by department
    console.warn(registrations);
    registrations.forEach(reg => {
      if (reg.is_church_attendee) {
        if (reg.department) {
          // Church attendee with department
          if (!deptMap[reg.department]) {
            deptMap[reg.department] = { count: 0, revenue: 0 };
          }
          deptMap[reg.department].count += 1;
          deptMap[reg.department].revenue += reg.price || 0;
        } else {
          // Church attendee without department
          deptMap["Church member - No department"].count += 1;
          deptMap["Church member - No department"].revenue += reg.price || 0;
        }
      } else {
        // Non-church attendee
        deptMap["Non-church attendee"].count += 1;
        deptMap["Non-church attendee"].revenue += reg.price || 0;
      }
    });
    
    // Convert to array format for charts
    const chartData = Object.keys(deptMap)
      .filter(dept => deptMap[dept].count > 0) // Only show departments with registrations
      .map((dept, index) => ({
        name: dept,
        registrations: deptMap[dept].count,
        revenue: deptMap[dept].revenue,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.registrations - a.registrations); // Sort by count desc
    
    setDepartmentData(chartData);
  };

  const processMinistryData = () => {
    if (!registrations || !ministries) return;

    // Create a map to store ministry counts and revenue
    const ministryMap: Record<string, { count: number, revenue: number, department: string }> = {};
    
    // Initialize with all ministries (even those with 0 registrations)
    ministries.forEach(ministry => {
      const deptName = ministry.department?.name || "Unknown";
      ministryMap[ministry.name] = { count: 0, revenue: 0, department: deptName };
    });
    
    // Count registrations by ministry
    registrations.forEach(reg => {
      if (reg.is_church_attendee && reg.ministry) {
        if (!ministryMap[reg.ministry]) {
          ministryMap[reg.ministry] = { count: 0, revenue: 0, department: reg.department || "Unknown" };
        }
        ministryMap[reg.ministry].count += 1;
        ministryMap[reg.ministry].revenue += reg.price || 0;
      }
    });
    
    // Convert to array format for charts
    const chartData = Object.keys(ministryMap)
      .filter(ministry => ministryMap[ministry].count > 0) // Only show ministries with registrations
      .map((ministry, index) => ({
        name: ministry,
        registrations: ministryMap[ministry].count,
        revenue: ministryMap[ministry].revenue,
        department: ministryMap[ministry].department,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
      .sort((a, b) => b.registrations - a.registrations); // Sort by count desc
    
    setMinistryData(chartData);
  };

  const processCategoryData = () => {
    if (!registrations) return;

    // Create a map to store category counts and revenue
    const categoryMap: Record<string, { count: number, revenue: number }> = {};
    
    // Count registrations by category
    registrations.forEach(reg => {
      if (!categoryMap[reg.category]) {
        categoryMap[reg.category] = { count: 0, revenue: 0 };
      }
      categoryMap[reg.category].count += 1;
      categoryMap[reg.category].revenue += reg.price || 0;
    });
    
    // Convert to array format for charts
    const chartData = Object.keys(categoryMap).map((category, index) => ({
      name: category,
      registrations: categoryMap[category].count,
      revenue: categoryMap[category].revenue,
      color: CHART_COLORS[index % CHART_COLORS.length]
    }));
    
    setCategoryData(chartData);
  };

  const processChurchAttendanceData = () => {
    if (!registrations) return;

    const churchCount = registrations.filter(r => r.is_church_attendee).length;
    const nonChurchCount = registrations.filter(r => !r.is_church_attendee).length;
    
    const chartData = [
      { 
        name: "Church Members", 
        value: churchCount,
        color: CHART_COLORS[0]
      },
      { 
        name: "Non-Church Attendees", 
        value: nonChurchCount,
        color: CHART_COLORS[1]
      }
    ];
    
    setChurchAttendanceData(chartData);
  };

  // Custom tooltip for all charts
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-md rounded-md border border-gray-100">
          <p className="text-sm font-medium mb-1">{`${label}`}</p>
          <p className="text-xs text-gray-700">
            <span className="font-medium">Registrations:</span> {payload[0].value}
          </p>
          {payload[1] && (
            <p className="text-xs text-green-700">
              <span className="font-medium">Revenue:</span> {formatCurrency(payload[1].value)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Export chart data to Excel
  const exportChartData = () => {
    setIsExporting(true);
    
    try {
      let exportData;
      let fileName;
      
      // Create worksheets based on active tab
      switch (activeTab) {
        case "departments":
          exportData = departmentData.map(item => ({
            "Department": item.name,
            "Registrations": item.registrations,
            "Revenue": item.revenue
          }));
          fileName = "department-report.xlsx";
          break;
          
        case "ministries":
          exportData = ministryData.map(item => ({
            "Ministry": item.name,
            "Department": item.department,
            "Registrations": item.registrations,
            "Revenue": item.revenue
          }));
          fileName = "ministry-report.xlsx";
          break;
          
        case "categories":
          exportData = categoryData.map(item => ({
            "Race Category": item.name,
            "Registrations": item.registrations,
            "Revenue": item.revenue
          }));
          fileName = "category-report.xlsx";
          break;
          
        case "churchAttendance":
          exportData = churchAttendanceData.map(item => ({
            "Type": item.name,
            "Registrations": item.value
          }));
          fileName = "church-attendance-report.xlsx";
          break;
          
        default:
          throw new Error("Unknown tab selected");
      }
      
      // Create workbook and worksheet
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
      
      // Generate the file
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Report Exported",
        description: `The ${activeTab} report has been downloaded successfully.`
      });
    } catch (error) {
      console.error("Error exporting report:", error);
      toast({
        title: "Export Failed",
        description: "There was a problem exporting the report.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chart Reports</CardTitle>
          <CardDescription>Loading data...</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Visual Reports</CardTitle>
          <CardDescription>Graphical presentation of registration data</CardDescription>
        </div>
        <Button
          onClick={exportChartData}
          variant="outline"
          disabled={isExporting}
        >
          {isExporting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Exporting...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Export Chart Data
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="departments">By Department</TabsTrigger>
            <TabsTrigger value="ministries">By Ministry</TabsTrigger>
            <TabsTrigger value="categories">By Category</TabsTrigger>
            <TabsTrigger value="churchAttendance">Church Attendance</TabsTrigger>
          </TabsList>
          
          {/* Department Tab */}
          <TabsContent value="departments">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Registration Count by Department</h3>
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={props => (
                          <g transform={`translate(${props.x},${props.y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={16}
                              textAnchor="end"
                              fill="#666"
                              transform="rotate(-45)"
                              fontSize={11}
                            >
                              {props.payload.value}
                            </text>
                          </g>
                        )}
                        height={80}
                        interval={0}
                      />
                      <YAxis yAxisId="left" />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        yAxisId="left" 
                        dataKey="registrations" 
                        name="Registrations" 
                        fill="#3b82f6" 
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No department data available</p>
                  </div>
                )}
              </div>
              
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Revenue by Department</h3>
                {departmentData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={departmentData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={props => (
                          <g transform={`translate(${props.x},${props.y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={16}
                              textAnchor="end"
                              fill="#666"
                              transform="rotate(-45)"
                              fontSize={11}
                            >
                              {props.payload.value}
                            </text>
                          </g>
                        )}
                        height={80}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), "Revenue"]}
                         contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }} />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue"
                        fill="#10b981"
                      >
                        {departmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No department revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Ministry Tab */}
          <TabsContent value="ministries">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Registration Count by Ministry</h3>
                {ministryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ministryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={props => (
                          <g transform={`translate(${props.x},${props.y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={16}
                              textAnchor="end"
                              fill="#666"
                              transform="rotate(-45)"
                              fontSize={11}
                            >
                              {props.payload.value}
                            </text>
                          </g>
                        )}
                        height={80}
                        interval={0}
                      />
                      <YAxis />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Bar 
                        dataKey="registrations" 
                        name="Registrations" 
                        fill="#3b82f6" 
                      >
                        {ministryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No ministry data available</p>
                  </div>
                )}
              </div>
              
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Revenue by Ministry</h3>
                {ministryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ministryData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="name"
                        tick={props => (
                          <g transform={`translate(${props.x},${props.y})`}>
                            <text
                              x={0}
                              y={0}
                              dy={16}
                              textAnchor="end"
                              fill="#666"
                              transform="rotate(-45)"
                              fontSize={11}
                            >
                              {props.payload.value}
                            </text>
                          </g>
                        )}
                        height={80}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => formatCurrency(value)} />
                      <Tooltip formatter={(value, name) => [formatCurrency(Number(value)), "Revenue"]}
                         contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', borderRadius: '4px', border: 'none', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)' }} />
                      <Legend />
                      <Bar 
                        dataKey="revenue" 
                        name="Revenue"
                        fill="#10b981"
                      >
                        {ministryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No ministry revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Category Tab */}
          <TabsContent value="categories">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Registration Count by Category</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="registrations"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} registrations`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No category data available</p>
                  </div>
                )}
              </div>
              
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Revenue by Category</h3>
                {categoryData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="revenue"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [formatCurrency(Number(value)), 'Revenue']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No category revenue data available</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Church Attendance Tab */}
          <TabsContent value="churchAttendance">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Church vs Non-Church Attendees</h3>
                {churchAttendanceData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={churchAttendanceData}
                        cx="50%"
                        cy="50%"
                        labelLine={true}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {churchAttendanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} registrations`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-muted-foreground">No attendance data available</p>
                  </div>
                )}
              </div>
              
              <div className="h-96">
                <h3 className="text-lg font-medium mb-4">Registration Distribution</h3>
                <div className="flex flex-col justify-center h-full p-6 bg-gray-50 rounded-lg">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Total Registrations:</span>
                      <span className="font-bold text-2xl">
                        {registrations ? registrations.length : 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Church Members:</span>
                      <span className="font-bold text-xl text-blue-600">
                        {churchAttendanceData.find(d => d.name === "Church Members")?.value || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Non-Church Attendees:</span>
                      <span className="font-bold text-xl text-green-600">
                        {churchAttendanceData.find(d => d.name === "Non-Church Attendees")?.value || 0}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="font-medium">Church Member Percentage:</span>
                      <span className="font-bold text-xl text-purple-600">
                        {registrations && registrations.length > 0
                          ? `${((churchAttendanceData.find(d => d.name === "Church Members")?.value || 0) / registrations.length * 100).toFixed(1)}%`
                          : "0%"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
