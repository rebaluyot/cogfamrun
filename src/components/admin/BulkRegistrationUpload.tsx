import { useState, useRef } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";
import { AlertCircle, CheckCircle, Download, FileSpreadsheet, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import { useQueryClient } from "@tanstack/react-query";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

// Define the expected structure for an Excel registration
interface ExcelRegistration {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  category: string;
  is_church_attendee?: boolean;
  department?: string;
  ministry?: string;
  cluster?: string;
  emergency_contact?: string;
  emergency_phone?: string;
  medical_conditions?: string;
  shirt_size: string;
  status?: string;
}

// Define allowed values for validation
const ALLOWED_VALUES = {
  gender: ['male', 'female', ''],
  category: ['3K', '6K', '10K'],
  shirt_size: ['3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'],
  status: ['pending', 'paid', 'completed', 'cancelled', '']
};

export const BulkRegistrationUpload = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [parsedData, setParsedData] = useState<ExcelRegistration[]>([]);
  const [validationErrors, setValidationErrors] = useState<{rowIndex: number, field: string, message: string}[]>([]);
  const [uploadResults, setUploadResults] = useState<{success: number, failed: number, total: number}>({
    success: 0,
    failed: 0,
    total: 0
  });
  const [showResults, setShowResults] = useState(false);
  
  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();
  
  // Function to generate a random Registration ID
  const generateRegistrationId = () => {
    return `FR2025${Date.now().toString().slice(-6)}`;
  };

  // Download template function
  const downloadTemplate = () => {
    // Create a workbook with a template sheet
    const wb = XLSX.utils.book_new();
    const templateData = [
      {
        first_name: "John",
        last_name: "Doe",
        email: "john.doe@example.com",
        phone: "09123456789",
        age: 30,
        gender: "male",
        category: "3K",
        is_church_attendee: true,
        department: "Worship",
        ministry: "Media Team",
        cluster: "Team A",
        emergency_contact: "Jane Doe",
        emergency_phone: "09876543210",
        medical_conditions: "None",
        shirt_size: "L",
        status: "pending"
      },
      {
        first_name: "Jane",
        last_name: "Smith",
        email: "jane.smith@example.com",
        phone: "09123456788",
        age: 25,
        gender: "female",
        category: "6K",
        is_church_attendee: false,
        department: "",
        ministry: "",
        cluster: "",
        emergency_contact: "John Smith",
        emergency_phone: "09876543211",
        medical_conditions: "Asthma",
        shirt_size: "M",
        status: "pending"
      }
    ];
    
    // Add a README sheet with instructions
    const instructionsData = [
      ["COG FAMRUN 2025 - BULK REGISTRATION TEMPLATE"],
      [""],
      ["INSTRUCTIONS:"],
      ["1. Fill out all required fields (first_name, last_name, email, category, shirt_size)"],
      ["2. Follow the format shown in the TEMPLATE sheet"],
      ["3. For is_church_attendee, use TRUE or FALSE (required if department is specified)"],
      [""],
      ["FIELD REQUIREMENTS:"],
      ["- first_name: Required, text"],
      ["- last_name: Required, text"],
      ["- email: Required, valid email format"],
      ["- phone: Optional, format: 09XXXXXXXXX or +63XXXXXXXXXX"],
      ["- age: Optional, number"],
      ["- gender: Optional, 'male' or 'female'"],
      ["- category: Required, one of: '3K', '6K', '10K'"],
      ["- is_church_attendee: Optional, TRUE or FALSE"],
      ["- department: Required if is_church_attendee is TRUE, must match existing department name"],
      ["- ministry: Required if department is specified, must match existing ministry name in that department"],
      ["- cluster: Optional, must match existing cluster name in that ministry"],
      ["- emergency_contact: Required, text"],
      ["- emergency_phone: Required, format: 09XXXXXXXXX or +63XXXXXXXXXX"],
      ["- medical_conditions: Optional, text"],
      ["- shirt_size: Required, one of: '3XS', '2XS', 'XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL', '5XL'"],
      ["- status: Optional, one of: 'pending', 'paid', 'completed', 'cancelled' (defaults to 'pending')"],
      [""],
      ["Note: Categories and prices:"],
      ["- 3K: ₱800"],
      ["- 6K: ₱1,200"],
      ["- 10K: ₱1,500"]
    ];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const instructionsWs = XLSX.utils.aoa_to_sheet(instructionsData);
    
    XLSX.utils.book_append_sheet(wb, instructionsWs, "README");
    XLSX.utils.book_append_sheet(wb, ws, "TEMPLATE");
    
    // Apply some formatting
    ws["!cols"] = [
      { width: 15 }, // first_name
      { width: 15 }, // last_name
      { width: 25 }, // email
      { width: 15 }, // phone
      { width: 5 },  // age
      { width: 10 }, // gender
      { width: 10 }, // category
      { width: 15 }, // is_church_attendee
      { width: 15 }, // department
      { width: 15 }, // ministry
      { width: 15 }, // cluster
      { width: 20 }, // emergency_contact
      { width: 15 }, // emergency_phone
      { width: 20 }, // medical_conditions
      { width: 10 }, // shirt_size
      { width: 10 }  // status
    ];
    
    // Write to file
    XLSX.writeFile(wb, "COG_FamRun_Registration_Template.xlsx");
    
    toast({
      title: "Template Downloaded",
      description: "Registration template has been downloaded. Please follow the instructions in the README sheet.",
    });
  };
  
  // Process Excel file
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setIsProcessing(true);
    setValidationErrors([]);
    setParsedData([]);
    setShowResults(false);
    
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Get the first sheet
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      
      // Convert to JSON
      const jsonData: ExcelRegistration[] = XLSX.utils.sheet_to_json(worksheet);
      
      if (jsonData.length === 0) {
        throw new Error("The Excel file contains no data");
      }
      
      // Basic validation
      const errors: {rowIndex: number, field: string, message: string}[] = [];
      
      jsonData.forEach((row, index) => {
        // Check required fields
        const requiredFields = ['first_name', 'last_name', 'email', 'category', 'shirt_size', 'emergency_contact', 'emergency_phone'];
        requiredFields.forEach(field => {
          if (!row[field as keyof ExcelRegistration]) {
            errors.push({
              rowIndex: index + 2, // +2 because Excel rows are 1-indexed and we have a header
              field,
              message: `Required field "${field}" is missing`
            });
          }
        });
        
        // Email validation
        if (row.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(row.email)) {
          errors.push({
            rowIndex: index + 2,
            field: 'email',
            message: `Invalid email format: "${row.email}"`
          });
        }
        
        // Category validation
        const allowedCategories = ALLOWED_VALUES.category;
        if (row.category && !allowedCategories.includes(row.category)) {
          errors.push({
            rowIndex: index + 2,
            field: 'category',
            message: `Invalid category "${row.category}". Must be one of: ${allowedCategories.join(', ')}`
          });
        }
        
        // Shirt size validation
        const allowedShirtSizes = ALLOWED_VALUES.shirt_size;
        if (row.shirt_size && !allowedShirtSizes.includes(row.shirt_size)) {
          errors.push({
            rowIndex: index + 2,
            field: 'shirt_size',
            message: `Invalid shirt size "${row.shirt_size}". Must be one of: ${allowedShirtSizes.join(', ')}`
          });
        }
        
        // Gender validation
        const allowedGenders = ALLOWED_VALUES.gender;
        if (row.gender && !allowedGenders.includes(row.gender.toLowerCase())) {
          errors.push({
            rowIndex: index + 2,
            field: 'gender',
            message: `Invalid gender "${row.gender}". Must be one of: ${allowedGenders.filter(g => g !== '').join(', ')} or empty`
          });
        }
        
        // Status validation
        const allowedStatuses = ALLOWED_VALUES.status;
        if (row.status && !allowedStatuses.includes(row.status.toLowerCase())) {
          errors.push({
            rowIndex: index + 2,
            field: 'status',
            message: `Invalid status "${row.status}". Must be one of: ${allowedStatuses.filter(s => s !== '').join(', ')} or empty`
          });
        }
        
        // Church attendee validation
        if (row.is_church_attendee === true) {
          if (!row.department) {
            errors.push({
              rowIndex: index + 2,
              field: 'department',
              message: 'Department is required when is_church_attendee is true'
            });
          }
          
          if (!row.ministry) {
            errors.push({
              rowIndex: index + 2,
              field: 'ministry',
              message: 'Ministry is required when is_church_attendee is true'
            });
          }
          
          // Department validation
          if (row.department) {
            const departmentExists = departments?.some(
              dept => dept.name.toLowerCase() === row.department?.toLowerCase()
            );
            
            if (!departmentExists) {
              errors.push({
                rowIndex: index + 2,
                field: 'department',
                message: `Department "${row.department}" does not exist`
              });
            }
          }
          
          // Ministry validation
          if (row.ministry && row.department) {
            const departmentObj = departments?.find(
              dept => dept.name.toLowerCase() === row.department?.toLowerCase()
            );
            
            if (departmentObj) {
              const ministryExists = ministries?.some(
                min => 
                  min.name.toLowerCase() === row.ministry?.toLowerCase() && 
                  min.department_id === departmentObj.id
              );
              
              if (!ministryExists) {
                errors.push({
                  rowIndex: index + 2,
                  field: 'ministry',
                  message: `Ministry "${row.ministry}" does not exist in department "${row.department}"`
                });
              }
            }
          }
          
          // Cluster validation
          if (row.cluster && row.ministry && row.department) {
            const departmentObj = departments?.find(
              dept => dept.name.toLowerCase() === row.department?.toLowerCase()
            );
            
            if (departmentObj) {
              const ministryObj = ministries?.find(
                min => 
                  min.name.toLowerCase() === row.ministry?.toLowerCase() && 
                  min.department_id === departmentObj.id
              );
              
              if (ministryObj) {
                const clusterExists = clusters?.some(
                  clus => 
                    clus.name.toLowerCase() === row.cluster?.toLowerCase() && 
                    clus.ministry_id === ministryObj.id
                );
                
                if (!clusterExists) {
                  errors.push({
                    rowIndex: index + 2,
                    field: 'cluster',
                    message: `Cluster "${row.cluster}" does not exist in ministry "${row.ministry}"`
                  });
                }
              }
            }
          }
        }
      });
      
      setValidationErrors(errors);
      setParsedData(jsonData);
      
      if (errors.length > 0) {
        toast({
          title: `${errors.length} Validation Error${errors.length > 1 ? 's' : ''}`,
          description: "Please fix the errors before uploading. See the error list for details.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "File Processed Successfully",
          description: `${jsonData.length} registration${jsonData.length > 1 ? 's' : ''} ready to import. Click "Upload Registrations" to proceed.`,
        });
      }
    } catch (error) {
      console.error('Error processing Excel file:', error);
      toast({
        title: "File Processing Error",
        description: error instanceof Error ? error.message : "Could not process the Excel file. Please check the format.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  // Upload registrations to the database
  const uploadRegistrations = async () => {
    if (parsedData.length === 0 || validationErrors.length > 0) {
      toast({
        title: "Cannot Upload",
        description: validationErrors.length > 0 
          ? "Please fix validation errors before uploading." 
          : "No data to upload. Please select a file.",
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    setShowResults(false);
    
    let successCount = 0;
    let failCount = 0;
    
    try {
      // Process registrations
      for (const row of parsedData) {
        try {
          // Generate registration ID and find the price based on category
          const registrationId = generateRegistrationId();
          const categoryObj = categories?.find(cat => cat.name === row.category);
          const price = categoryObj?.price || 0;
          
          // Prepare registration data
          const registrationData = {
            registration_id: registrationId,
            first_name: row.first_name,
            last_name: row.last_name,
            email: row.email,
            phone: row.phone || null,
            age: row.age || null,
            gender: row.gender?.toLowerCase() || null,
            category: row.category,
            price: price,
            is_church_attendee: row.is_church_attendee || false,
            department: row.department || null,
            ministry: row.ministry || null,
            cluster: row.cluster || null,
            emergency_contact: row.emergency_contact || null,
            emergency_phone: row.emergency_phone || null,
            medical_conditions: row.medical_conditions || null,
            shirt_size: row.shirt_size,
            status: row.status?.toLowerCase() || 'pending',
          };
          
          // Insert into database
          const { error } = await supabase
            .from('registrations')
            .insert([registrationData]);
            
          if (error) {
            console.error('Registration error:', error);
            failCount++;
          } else {
            successCount++;
          }
        } catch (error) {
          console.error('Error processing registration:', error);
          failCount++;
        }
      }
      
      // Show results
      setUploadResults({
        success: successCount,
        failed: failCount,
        total: parsedData.length
      });
      setShowResults(true);
      
      // Refresh registrations data
      queryClient.invalidateQueries({ queryKey: ['registrations'] });
      
      toast({
        title: "Upload Complete",
        description: `Successfully uploaded ${successCount} out of ${parsedData.length} registrations.`,
        variant: successCount === parsedData.length ? "default" : "destructive",
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload Failed",
        description: "There was an error uploading the registrations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setParsedData([]);
      setValidationErrors([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Bulk Registration Upload</CardTitle>
        <CardDescription>Upload multiple registrations via Excel spreadsheet</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col md:flex-row gap-2">
          <Button 
            onClick={downloadTemplate} 
            variant="outline" 
            className="flex items-center gap-2"
          >
            <Download size={16} />
            Download Template
          </Button>
          <div className="flex-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              disabled={isProcessing || isUploading}
              className="w-full"
            />
          </div>
        </div>
        
        {/* Display Processing Status */}
        {isProcessing && (
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin h-5 w-5 border-t-2 border-blue-500 rounded-full mr-2" />
            <p>Processing file...</p>
          </div>
        )}
        
        {/* Display Upload Results */}
        {showResults && (
          <Alert className={uploadResults.failed > 0 ? "bg-amber-50" : "bg-green-50"}>
            <CheckCircle className="h-4 w-4" color={uploadResults.failed > 0 ? "orange" : "green"} />
            <AlertTitle>Upload Results</AlertTitle>
            <AlertDescription>
              <p><strong>Total registrations:</strong> {uploadResults.total}</p>
              <p><strong>Successfully uploaded:</strong> {uploadResults.success}</p>
              {uploadResults.failed > 0 && (
                <p><strong>Failed:</strong> {uploadResults.failed}</p>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Validation Errors Display */}
        {validationErrors.length > 0 && (
          <Collapsible className="border rounded-md">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium text-left bg-red-50 hover:bg-red-100 rounded-t-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" color="red" />
                <span>{validationErrors.length} Validation Error{validationErrors.length !== 1 ? 's' : ''}</span>
              </div>
              <span>Show/Hide</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white">
              <div className="max-h-60 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Error</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationErrors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell>{error.rowIndex}</TableCell>
                        <TableCell>{error.field}</TableCell>
                        <TableCell>{error.message}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
        
        {/* Display Data Preview */}
        {parsedData.length > 0 && validationErrors.length === 0 && (
          <Collapsible className="border rounded-md">
            <CollapsibleTrigger className="flex w-full items-center justify-between p-4 font-medium text-left bg-blue-50 hover:bg-blue-100 rounded-t-md">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-4 w-4" />
                <span>Preview Data ({parsedData.length} registrations)</span>
              </div>
              <span>Show/Hide</span>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 bg-white">
              <div className="max-h-60 overflow-x-auto overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Shirt Size</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, index) => (
                      <TableRow key={index}>
                        <TableCell>{row.first_name}</TableCell>
                        <TableCell>{row.last_name}</TableCell>
                        <TableCell>{row.email}</TableCell>
                        <TableCell>{row.category}</TableCell>
                        <TableCell>{row.shirt_size}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button
          onClick={uploadRegistrations}
          disabled={parsedData.length === 0 || validationErrors.length > 0 || isUploading}
          className="flex items-center gap-2"
        >
          {isUploading ? (
            <>
              <div className="animate-spin h-4 w-4 border-t-2 border-white rounded-full" />
              Uploading...
            </>
          ) : (
            <>
              <Upload size={16} />
              Upload Registrations
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  );
};
