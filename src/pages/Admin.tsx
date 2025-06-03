import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";
import { MinistryManagement } from "@/components/admin/MinistryManagement";
import { ClusterManagement } from "@/components/admin/ClusterManagement";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";

const Admin = () => {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage COG FamRun 2025 configuration and generate reports</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full flex">
          <TabsTrigger value="categories" className="flex-1 data-[state=active]:bg-background">
            Categories
          </TabsTrigger>
          <TabsTrigger value="departments" className="flex-1 data-[state=active]:bg-background">
            Departments
          </TabsTrigger>
          <TabsTrigger value="ministries" className="flex-1 data-[state=active]:bg-background">
            Ministries
          </TabsTrigger>
          <TabsTrigger value="clusters" className="flex-1 data-[state=active]:bg-background">
            Clusters
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-background">
            Reports
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoryManagement />
        </TabsContent>

        <TabsContent value="departments">
          <DepartmentManagement />
        </TabsContent>

        <TabsContent value="ministries">
          <MinistryManagement />
        </TabsContent>

        <TabsContent value="clusters">
          <ClusterManagement />
        </TabsContent>

        <TabsContent value="reports">
          <ReportsManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
