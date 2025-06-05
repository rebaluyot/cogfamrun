import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DepartmentManagement } from "@/components/admin/DepartmentManagement";
import { MinistryManagement } from "@/components/admin/MinistryManagement";
import { ClusterManagement } from "@/components/admin/ClusterManagement";
import { CategoryManagement } from "@/components/admin/CategoryManagement";
import { ReportsManagement } from "@/components/admin/ReportsManagement";
import { BulkRegistrationUpload } from "@/components/admin/BulkRegistrationUpload";
import { PaymentMethodManagement } from "@/components/admin/PaymentMethodManagement";
import { PaymentVerification } from "@/components/admin/PaymentVerification";
import { BatchPaymentVerification } from "@/components/admin/BatchPaymentVerification";
import { EmailJSSettings } from "@/components/admin/EmailJSSettings";

const Admin = () => {
  return (
    <div className="container mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Panel</h1>
        <p className="text-muted-foreground">Manage COG FamRun 2025 configuration and generate reports</p>
      </div>

      <Tabs defaultValue="categories" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 w-full flex">
          <TabsTrigger value="payments" className="flex-1 data-[state=active]:bg-background bg-yellow-50 data-[state=active]:bg-yellow-100 font-medium">
            Payments
          </TabsTrigger>
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
          <TabsTrigger value="payment-methods" className="flex-1 data-[state=active]:bg-background">
            Payment Methods
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex-1 data-[state=active]:bg-background">
            Reports
          </TabsTrigger>
          <TabsTrigger value="bulk-upload" className="flex-1 data-[state=active]:bg-background">
            Bulk Upload
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 data-[state=active]:bg-background">
            Settings
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
        
        <TabsContent value="bulk-upload">
          <BulkRegistrationUpload />
        </TabsContent>
        
        <TabsContent value="payment-methods">
          <PaymentMethodManagement />
        </TabsContent>
        
        <TabsContent value="payments">
          <Tabs defaultValue="individual" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="individual">Individual Verification</TabsTrigger>
              <TabsTrigger value="batch">Batch Verification</TabsTrigger>
            </TabsList>
            
            <TabsContent value="individual">
              <PaymentVerification />
            </TabsContent>
            
            <TabsContent value="batch">
              <BatchPaymentVerification />
            </TabsContent>
          </Tabs>
        </TabsContent>
        
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>System Settings</CardTitle>
              <CardDescription>Manage global configuration settings for the application</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <EmailJSSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Admin;
