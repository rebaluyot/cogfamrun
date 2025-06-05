import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { setupStorage } from "@/lib/setup-storage";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { QRCodeGenerator } from "@/components/QRCodeGenerator";
import { ShirtSizeChart } from "@/components/ShirtSizeChart";
import { PaymentMethod } from "@/components/PaymentMethod";
import { ErrorSummary } from "@/components/ErrorSummary";
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";
import { formatCurrency } from "@/lib/format-utils";
// import emailjs from '@emailjs/browser';
import { useSearchParams } from "react-router-dom";

// Input validation helpers
const isValidEmail = (email: string): boolean => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const isValidPhoneNumber = (phone: string): boolean => {
  // Allow Philippine phone formats: +639XXXXXXXXX, 09XXXXXXXXX, 9XXXXXXXXX
  // Also allow formats with spaces, dashes: +63 9XX XXX XXXX, 0919-123-4567
  const cleanedNumber = phone.replace(/[\s-]/g, '');
  const regex = /^(?:\+?63|0)?9\d{9}$/;
  return regex.test(cleanedNumber);
};

const isValidName = (name: string): boolean => {
  // Check if name contains at least 2 characters, allows letters, spaces, hyphens, and apostrophes
  return name.trim().length >= 2 && /^[a-zA-ZñÑ\s'-]+$/.test(name.trim());
};

// Format phone number as user types for better UX
const formatPhoneNumber = (phone: string): string => {
  // Clean the input - remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  // Handle different phone number formats
  if (cleaned.startsWith('63') && cleaned.length > 2) {
    // Format as +63 XXX XXX XXXX
    const countryCode = '+63';
    let remaining = cleaned.substring(2);
    
    if (remaining.length > 3) {
      remaining = remaining.substring(0, 3) + ' ' + remaining.substring(3);
    }
    
    if (remaining.length > 7) {
      remaining = remaining.substring(0, 7) + ' ' + remaining.substring(7);
    }
    
    return `${countryCode} ${remaining}`;
  } else if (cleaned.startsWith('0') && cleaned.length > 1) {
    // Format as 0915 123 4567
    let remaining = cleaned.substring(1);
    
    if (remaining.length > 3) {
      remaining = remaining.substring(0, 3) + ' ' + remaining.substring(3);
    }
    
    if (remaining.length > 7) {
      remaining = remaining.substring(0, 7) + ' ' + remaining.substring(7);
    }
    
    return `0${remaining}`;
  }
  
  // Default case - just return the cleaned input
  return cleaned;
};


interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

// Initialize EmailJS with your public key
// emailjs.init("vc8LzDacZcreqI6fN"); // Replace with your actual EmailJS public key

interface ValidationErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
}

const Registration = () => {
  const { toast } = useToast();
  const { data: categories } = useCategories();
  const { data: departments } = useDepartments();
  const { data: ministries } = useMinistries();
  const { data: clusters } = useClusters();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    category: "",
    isChurchAttendee: false,
    department: "",
    ministry: "",
    cluster: "",
    emergencyContact: "",
    emergencyPhone: "",
    medicalConditions: "",
    shirtSize: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [showQR, setShowQR] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedPaymentMethodId, setSelectedPaymentMethodId] = useState<number | null>(null);
  const [paymentReferenceNumber, setPaymentReferenceNumber] = useState("");
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [showErrorSummary, setShowErrorSummary] = useState(false);

  // URL search parameter handling
  const [searchParams] = useSearchParams();
  
  // Reset form when new=true is in the URL (from Register Another Participant button)
  useEffect(() => {
    const isNewRegistration = searchParams.get('new') === 'true';
    
    if (isNewRegistration) {
      // Reset all form fields
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        age: "",
        gender: "",
        category: "",
        isChurchAttendee: false,
        department: "",
        ministry: "",
        cluster: "",
        emergencyContact: "",
        emergencyPhone: "",
        medicalConditions: "",
        shirtSize: "",
      });
      
      // Reset other states
      setErrors({});
      setShowQR(false);
      setRegistrationId("");
      setPaymentProof(null);
      setSelectedPaymentMethodId(null);
      setPaymentReferenceNumber("");
      setTouchedFields({});
      setShowErrorSummary(false);
      
      // Remove query parameter to prevent repeated resets
      if (window.history.replaceState) {
        const newUrl = window.location.pathname;
        window.history.replaceState({path: newUrl}, '', newUrl);
      }
    }
  }, [searchParams]);

  // Debounced validation for fields that are being actively typed in
  useEffect(() => {
    // Only validate fields that have been touched (interacted with)
    const fieldsToValidate = Object.keys(touchedFields).filter(field => touchedFields[field]);
    
    if (fieldsToValidate.length === 0) return;
    
    const debounceTimeout = setTimeout(() => {
      const newErrors: ValidationErrors = { ...errors };
      
      fieldsToValidate.forEach(field => {
        if (['firstName', 'lastName', 'email', 'phone', 'emergencyContact', 'emergencyPhone'].includes(field)) {
          newErrors[field as keyof ValidationErrors] = validateField(
            field, 
            formData[field as keyof typeof formData] as string
          );
        }
      });
      
      setErrors(newErrors);
    }, 400); // 400ms debounce time
    
    return () => clearTimeout(debounceTimeout);
  }, [formData, touchedFields]);

  // Function to check if there are any form errors
  const hasErrors = (): boolean => {
    return Object.values(errors).some(error => error !== undefined);
  };

  // Get a summary of all form errors
  const getErrorSummary = (): string[] => {
    const errorMessages: string[] = [];
    
    if (errors.firstName) errorMessages.push(`First Name: ${errors.firstName}`);
    if (errors.lastName) errorMessages.push(`Last Name: ${errors.lastName}`);
    if (errors.email) errorMessages.push(`Email: ${errors.email}`);
    if (errors.phone) errorMessages.push(`Phone: ${errors.phone}`);
    if (errors.emergencyContact) errorMessages.push(`Emergency Contact: ${errors.emergencyContact}`);
    if (errors.emergencyPhone) errorMessages.push(`Emergency Phone: ${errors.emergencyPhone}`);
    
    // Check for other required fields
    if (!formData.category) errorMessages.push("Race Category is required");
    if (!formData.shirtSize) errorMessages.push("Shirt Size is required");
    if (formData.isChurchAttendee && !formData.department) errorMessages.push("Department is required");
    if (formData.isChurchAttendee && !formData.ministry) errorMessages.push("Ministry is required");
    // Cluster is now optional, so we don't check for it
    
    return errorMessages;
  };

  // Function to navigate to a field with an error
  const navigateToErrorField = (index: number): void => {
    const errorMessages = getErrorSummary();
    const errorMessage = errorMessages[index];
    
    if (!errorMessage) return;
    
    // Determine which field to focus based on the error message
    let fieldId: string | null = null;
    
    if (errorMessage.startsWith('First Name:')) fieldId = 'firstName';
    else if (errorMessage.startsWith('Last Name:')) fieldId = 'lastName';
    else if (errorMessage.startsWith('Email:')) fieldId = 'email';
    else if (errorMessage.startsWith('Phone:')) fieldId = 'phone';
    else if (errorMessage.startsWith('Emergency Contact:')) fieldId = 'emergencyContact';
    else if (errorMessage.startsWith('Emergency Phone:')) fieldId = 'emergencyPhone';
    else if (errorMessage.includes('Category')) fieldId = formData.category || null;
    else if (errorMessage.includes('Shirt Size')) fieldId = 'shirtSize';
    else if (errorMessage.includes('Department')) fieldId = 'department';
    else if (errorMessage.includes('Ministry')) fieldId = 'ministry';
    // Cluster navigation removed since it's now optional
    
    if (fieldId) {
      const element = document.getElementById(fieldId);
      if (element) {
        element.focus();
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Validate individual field
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case "firstName":
      case "lastName":
        if (!value.trim()) return "This field is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (!isValidName(value)) return "Please use only letters, spaces, hyphens, and apostrophes";
        break;
      case "email":
        if (!value.trim()) return "Email is required";
        if (!isValidEmail(value)) return "Please enter a valid email address (example@domain.com)";
        break;
      case "phone":
        if (value.trim() && !isValidPhoneNumber(value)) 
          return "Please enter a valid Philippine phone number (e.g., 09XXXXXXXXX)";
        break;
      case "emergencyContact":
        if (!value.trim()) return "Emergency contact name is required";
        if (value.trim().length < 2) return "Name must be at least 2 characters";
        if (!isValidName(value)) return "Please use only letters, spaces, hyphens, and apostrophes";
        break;
      case "emergencyPhone":
        if (!value.trim()) return "Emergency contact phone is required";
        if (!isValidPhoneNumber(value)) 
          return "Please enter a valid Philippine phone number (e.g., 09XXXXXXXXX)";
        break;
    }
    return undefined;
  };

  // Validate all required fields
  const validateForm = (): boolean => {
    const newErrors: ValidationErrors = {};

    // Validate contact info fields with specific validation rules
    newErrors.firstName = validateField("firstName", formData.firstName);
    newErrors.lastName = validateField("lastName", formData.lastName);
    newErrors.email = validateField("email", formData.email);
    
    // Phone is optional but validate format if provided
    if (formData.phone) {
      newErrors.phone = validateField("phone", formData.phone);
    }
    
    // Emergency contact info is required
    newErrors.emergencyContact = validateField("emergencyContact", formData.emergencyContact);
    newErrors.emergencyPhone = validateField("emergencyPhone", formData.emergencyPhone);
    
    // Update error state
    setErrors(newErrors);      // Check other required fields (not in errors state but required for form completion)
    const otherRequiredFieldsValid = (
      !!formData.category &&
      !!formData.shirtSize &&
      (!formData.isChurchAttendee || (
        !!formData.department &&
        !!formData.ministry
        // NOTE: Cluster is now optional and not included in required field validation
      ))
    );
    
    // Form is valid if there are no error messages and other required fields are filled
    return !Object.values(newErrors).some(error => error !== undefined) && otherRequiredFieldsValid;
  };

  const uploadPaymentProof = async (file: File, registrationId: string): Promise<string | null> => {
    try {
      // Setup storage bucket first
      // await setupStorage();

      const fileExt = file.name.split('.').pop();
      const fileName = `${registrationId}_payment.${fileExt}`;
      const filePath = `${fileName}`; // Remove payment_proofs/ subfolder

      console.log('Attempting to upload file:', {
        fileName,
        filePath,
        fileType: file.type,
        fileSize: file.size
      });      // Check file size and type before upload
      if (file.size > 5 * 1024 * 1024) {
        throw new Error('File size must be less than 5MB');
      }

      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error('File must be a JPG, PNG, or WebP image');
      }

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('registration-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });

      if (uploadError) {
        console.error('Error uploading file:', {
          error: uploadError,
          message: uploadError.message,
          name: uploadError.name
        });
        
        // Provide more specific error messages
        if (uploadError.message.includes('row-level security')) {
          throw new Error('Storage permission denied. Please try again or contact support.');
        } else if (uploadError.message.includes('Bucket not found')) {
          throw new Error('Storage not properly configured. Please contact support.');
        } else {
          throw new Error(`Upload failed: ${uploadError.message}`);
        }
      }      // Get the public URL of the uploaded file
      const { data: signUrlData, error: signError } = await supabase.storage
        .from('registration-files')
        .createSignedUrl(filePath, 31536000); // 1 year expiry

      if (signError) {
        console.error('Error creating signed URL:', signError);
        throw signError;
      }

      console.log('File uploaded successfully, signed URL:', signUrlData.signedUrl);
      return signUrlData.signedUrl;
    } catch (error) {
      console.error('Error uploading payment proof:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        name: error instanceof Error ? error.name : 'Unknown error type'
      });
      return null;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // First validate all fields
    if (!validateForm()) {
      // Show the error summary
      setShowErrorSummary(true);
      
      // Find the first field with an error and scroll it into view
      const fieldWithError = Object.keys(errors).find(field => errors[field as keyof ValidationErrors]);
      
      if (fieldWithError) {
        const element = document.getElementById(fieldWithError);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      
      // Show a toast for validation errors
      toast({
        title: "Validation Error",
        description: "Please correct the highlighted fields before submitting.",
        variant: "destructive",
      });
      return;
    }
    
    // Hide error summary if form is valid
    setShowErrorSummary(false);
    
    setIsSubmitting(true);
    setIsUploading(true);

    try {
      // Remove basic missing check as validateForm already does this more thoroughly
      if (!formData.category || !formData.shirtSize) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (formData.isChurchAttendee && (!formData.department || !formData.ministry)) {
        toast({
          title: "Church Information Required",
          description: "Please select your department and ministry.",
          variant: "destructive",
        });
        return;
      }

      if (!paymentProof) {
        toast({
          title: "Payment Proof Required",
          description: "Please upload your payment proof screenshot.",
          variant: "destructive",
        });
        return;
      }

      // Validate form fields
      const isValid = validateForm();
      if (!isValid) {
        toast({
          title: "Invalid Input",
          description: "Please correct the highlighted errors and try again.",
          variant: "destructive",
        });
        return;
      }

      // Generate registration ID
      const id = `FR2025${Date.now().toString().slice(-6)}`;
        // Upload payment proof
      let paymentProofUrl;
      try {
        paymentProofUrl = await uploadPaymentProof(paymentProof, id);
        if (!paymentProofUrl) {
          throw new Error("Failed to get uploaded file URL");
        }
      } catch (error) {
        toast({
          title: "Upload Failed",
          description: error instanceof Error ? error.message : "Failed to upload payment proof. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Get selected category price
      const selectedCategory = categories?.find(c => c.name === formData.category);
      const price = selectedCategory?.price || 0;

      // Get the names of the selected department, ministry, and cluster
      const selectedDepartment = departments?.find(d => d.id.toString() === formData.department);
      const selectedMinistry = ministries?.find(m => m.id.toString() === formData.ministry);
      const selectedCluster = clusters?.find(c => c.id.toString() === formData.cluster);

      // Prepare registration data
      const registrationData = {
        registration_id: id,
        first_name: formData.firstName,
        last_name: formData.lastName,
        email: formData.email,
        phone: formData.phone || null,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender || null,
        category: formData.category,
        price: price,
        is_church_attendee: formData.isChurchAttendee,
        department: formData.isChurchAttendee ? selectedDepartment?.name : null,
        ministry: formData.isChurchAttendee ? selectedMinistry?.name : null,
        // Cluster is optional
        cluster: formData.isChurchAttendee && formData.cluster ? selectedCluster?.name : null,
        department_id: formData.isChurchAttendee ? formData.department : null,
        ministry_id: formData.isChurchAttendee ? formData.ministry : null, 
        // Cluster ID is optional
        cluster_id: formData.isChurchAttendee && formData.cluster ? formData.cluster : null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        medical_conditions: formData.medicalConditions || null,
        shirt_size: formData.shirtSize,
        status: 'pending',
        payment_proof_url: paymentProofUrl,
        // Payment tracking fields
        payment_method_id: selectedPaymentMethodId,
        payment_reference_number: paymentReferenceNumber || null,
        payment_status: 'pending',
        payment_date: new Date().toISOString(),
      };

      // Insert into database
      const { error } = await supabase
        .from('registrations')
        .insert([registrationData]);

      if (error) {
        console.error('Registration error:', error);
        toast({
          title: "Registration Failed",
          description: "There was an error submitting your registration. Please try again.",
          variant: "destructive",
        });
        return;
      }      // Send confirmation email
      
      setRegistrationId(id);
      setShowQR(true);

      toast({
        title: "Registration Successful!",
        description: `Your registration ID is ${id}.`,
      });

    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Failed",
        description: "There was an error submitting your registration. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  // Function to check form without submitting
  const checkForm = () => {
    // Validate all fields
    validateForm();
    
    // Show the error summary regardless of validation result
    setShowErrorSummary(true);
    
    // If there are no errors, show success message
    if (!hasErrors() && !!formData.category && !!formData.shirtSize) {
      toast({
        title: "Form Looks Good!",
        description: "All required fields are properly filled out. You can submit the form.",
        variant: "default", // Using default variant for success
      });
    } else {
      // Show toast with validation error count
      const errorCount = getErrorSummary().length;
      toast({
        title: `${errorCount} ${errorCount === 1 ? 'Error' : 'Errors'} Found`,
        description: "Please check and correct the highlighted fields.",
        variant: "destructive",
      });
      
      // Scroll to error summary
      const errorSummaryElement = document.getElementById("error-summary-title");
      if (errorSummaryElement) {
        errorSummaryElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields when parent changes
      ...(field === "department" && { ministry: "", cluster: "" }),
      ...(field === "ministry" && { cluster: "" }),
    }));

    // Mark this field as touched when user interacts with it
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));

    // Clear error for this field when it's changed
    if (typeof value === 'string' && errors[field as keyof ValidationErrors]) {
      // For critical fields (email, phone, names) we'll let the debounced validation handle it
      // For other fields, just clear the error
      if (!['firstName', 'lastName', 'email', 'phone', 'emergencyContact', 'emergencyPhone'].includes(field)) {
        setErrors(prev => ({ ...prev, [field]: undefined }));
      }
    }
  };

  // Clear errors on unmount
  useEffect(() => {
    return () => {
      setErrors({});
    };
  }, []);

  // Handle blur event to validate fields when users leave them
  const handleBlur = (field: string, value: string) => {
    // Mark this field as touched when user leaves it
    setTouchedFields(prev => ({
      ...prev,
      [field]: true
    }));
    
    // Only validate fields that have validation rules
    if (['firstName', 'lastName', 'email', 'phone', 'emergencyContact', 'emergencyPhone'].includes(field)) {
      const fieldError = validateField(field, value);
      setErrors(prev => ({
        ...prev,
        [field]: fieldError
      }));
    }
  };

  const getPrice = (categoryName: string) => {
    const category = categories?.find(c => c.name === categoryName);
    return category?.price || 0;
  };

  const getDepartmentMinistries = (departmentId: string) => {
    return ministries?.filter(m => m.department_id === parseInt(departmentId)) || [];
  };

  const getMinistryClusters = (ministryId: string) => {
    return clusters?.filter(c => c.ministry_id === parseInt(ministryId)) || [];
  };
  if (showQR) {
    return (      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <QRCodeGenerator 
          registrationId={registrationId}
          participantName={`${formData.firstName} ${formData.lastName}`}
          category={formData.category}
          shirtSize={formData.shirtSize}
          price={getPrice(formData.category)}
          email={formData.email}
        />
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6 sm:mb-8 text-center">
            <div className="flex flex-col items-center gap-4 sm:gap-6">
              {/* 
              <div className="w-full max-w-[200px] aspect-square relative">
                <img 
                  src="/assets/solid-fam-run-logo.png" 
                  alt="SOLID FAM RUN 2025" 
                  className="w-full h-full object-contain mix-blend-multiply"
                />
              </div>
              */}
              <div className="relative">
                <h2 className="text-3xl sm:text-4xl font-black text-red-600 mb-2 sm:mb-3 tracking-wide" style={{
                  textShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                }}>REGISTER NOW!</h2>
                <p className="text-base sm:text-lg text-gray-700 font-medium">August 22, 2025 | New Dasmariñas Grandstand and Oval</p>
              </div>
            </div>
            <div className="flex justify-center gap-3 sm:gap-4 mt-4 sm:mt-6">
              <span className="bg-blue-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold">10KM</span>
              <span className="bg-red-600 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold">6KM</span>
              <span className="bg-yellow-500 text-white px-3 sm:px-4 py-1 rounded-full text-xs sm:text-sm font-bold">3KM</span>
            </div>
          </div>
          <Card className="border-2 border-blue-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-red-500 text-white p-4 sm:p-6">
              <CardTitle className="text-xl sm:text-2xl font-bold">Registration Form</CardTitle>
              <CardDescription className="text-white/90 text-sm sm:text-base">Please provide your information accurately</CardDescription>
            </CardHeader>
            <CardContent className="pt-4 sm:pt-6 px-3 sm:px-6">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
                <div className="text-sm text-gray-600 border-l-4 border-blue-400 pl-3 py-1 bg-blue-50">
                  <p>Fields marked with <span className="text-red-500">*</span> are required</p>
                </div>
                
                {/* Error Summary */}
                {showErrorSummary && (
                  <ErrorSummary 
                    errors={getErrorSummary()} 
                    title="Please fix the following errors:"
                    onErrorClick={navigateToErrorField}
                  />
                )}
                
                {/* Personal Information */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="firstName" className="text-sm sm:text-base">
                        First Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        onBlur={(e) => handleBlur("firstName", e.target.value)}
                        required
                        aria-invalid={errors.firstName ? "true" : "false"}
                        aria-describedby={errors.firstName ? "firstName-error" : undefined}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.firstName ? "border-red-500" : ""}`}
                      />
                      {errors.firstName && (
                        <p 
                          id="firstName-error" 
                          className="text-red-500 text-xs mt-1"
                          role="alert"
                        >
                          {errors.firstName}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="lastName" className="text-sm sm:text-base">
                        Last Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        onBlur={(e) => handleBlur("lastName", e.target.value)}
                        required
                        aria-invalid={errors.lastName ? "true" : "false"}
                        aria-describedby={errors.lastName ? "lastName-error" : undefined}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.lastName ? "border-red-500" : ""}`}
                      />
                      {errors.lastName && (
                        <p 
                          id="lastName-error" 
                          className="text-red-500 text-xs mt-1"
                          role="alert"
                        >
                          {errors.lastName}
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-sm sm:text-base">
                      Email Address <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                        onChange={(e) => handleInputChange("email", e.target.value)}
                        onBlur={(e) => handleBlur("email", e.target.value)}
                        required
                        placeholder="you@example.com"
                        aria-invalid={errors.email ? "true" : "false"}
                        aria-describedby={errors.email ? "email-error" : "email-hint"}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.email ? "border-red-500" : ""}`}
                    />
                    {errors.email ? (
                      <p 
                        id="email-error" 
                        className="text-red-500 text-xs mt-1"
                        role="alert"
                      >
                        {errors.email}
                      </p>
                    ) : (
                      <p id="email-hint" className="text-xs text-gray-500 mt-1">
                        Your confirmation email will be sent to this address
                      </p>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="phone" className="text-sm sm:text-base">
                        Phone Number
                      </Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => {
                          const formattedPhone = formatPhoneNumber(e.target.value);
                          handleInputChange("phone", formattedPhone);
                        }}
                        onBlur={(e) => handleBlur("phone", e.target.value)}
                        placeholder="e.g., 09151234567"
                        aria-invalid={errors.phone ? "true" : "false"}
                        aria-describedby={errors.phone ? "phone-error" : "phone-hint"}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.phone ? "border-red-500" : ""}`}
                      />
                      {errors.phone ? (
                        <p 
                          id="phone-error" 
                          className="text-red-500 text-xs mt-1"
                          role="alert"
                        >
                          {errors.phone}
                        </p>
                      ) : (
                        <p id="phone-hint" className="text-xs text-gray-500 mt-1">
                          Format: 09XXXXXXXXX, +639XXXXXXXXX, or with spaces/dashes
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="age" className="text-sm sm:text-base">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                        className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base"
                      />
                    </div>
                  </div>                <div>
                    <Label className="text-sm sm:text-base">Gender</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      className="flex space-x-4 mt-1 sm:mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="text-sm sm:text-base">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="text-sm sm:text-base">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Shirt Size */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shirtSize" className="text-sm sm:text-base">
                        Shirt Size <span className="text-red-500">*</span>
                      </Label>
                      <ShirtSizeChart />
                    </div>
                    <Select 
                      value={formData.shirtSize} 
                      onValueChange={(value) => handleInputChange("shirtSize", value)}
                      required
                    >
                      <SelectTrigger 
                        id="shirtSize"
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${!formData.shirtSize && showErrorSummary ? "border-red-500" : ""}`}
                      >
                        <SelectValue placeholder="Select shirt size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3XS">3XS (Width: 15" | Length: 23")</SelectItem>
                        <SelectItem value="2XS">2XS (Width: 16" | Length: 24")</SelectItem>
                        <SelectItem value="XS">XS (Width: 17" | Length: 25")</SelectItem>
                        <SelectItem value="S">S (Width: 18" | Length: 26")</SelectItem>
                        <SelectItem value="M">M (Width: 19" | Length: 27")</SelectItem>
                        <SelectItem value="L">L (Width: 20" | Length: 28")</SelectItem>
                        <SelectItem value="XL">XL (Width: 21" | Length: 29")</SelectItem>
                        <SelectItem value="2XL">2XL (Width: 22" | Length: 30")</SelectItem>
                        <SelectItem value="3XL">3XL (Width: 23" | Length: 31")</SelectItem>
                        <SelectItem value="4XL">4XL (Width: 25" | Length: 33")</SelectItem>
                        <SelectItem value="5XL">5XL (Width: 26" | Length: 34")</SelectItem>
                      </SelectContent>
                    </Select>
                    {!formData.shirtSize && showErrorSummary && (
                      <p className="text-red-500 text-xs mt-1">Please select a shirt size</p>
                    )}
                    <div className="mt-1 sm:mt-2 text-xs text-gray-500">
                      You'll receive a finisher shirt in this size. Click "View Size Chart" for detailed measurements.
                    </div>
                  </div>
                </div>

                {/* Race Category */}              
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Race Category</h3>
                  <div>
                    <Label className="text-sm sm:text-base">Select Category *</Label>
                    <RadioGroup
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                      className="mt-1 sm:mt-2 space-y-2 sm:space-y-3"
                    >
                      {categories?.map((category) => {
                        let bgColor = "";
                        let description = "";
                        
                        if (category.name === "10K") {
                          bgColor = "bg-blue-100 border-blue-300";
                          description = "2 laps - Advanced runners";
                        } else if (category.name === "6K") {
                          bgColor = "bg-red-100 border-red-300";
                          description = "2 laps - Intermediate runners";
                        } else if (category.name === "3K") {
                          bgColor = "bg-yellow-100 border-yellow-300";
                          description = "1 lap - Beginners & casual runners";
                        }
                        
                        return (
                          <div key={category.id} className={`flex items-center justify-between p-2 sm:p-3 border rounded-lg ${bgColor}`}>
                            <div className="flex items-center gap-2 sm:gap-3">
                              <RadioGroupItem value={category.name} id={category.name} />
                              <div>
                                <Label htmlFor={category.name} className="text-base sm:text-lg font-medium">{category.name} Run</Label>
                                <p className="text-xs sm:text-sm text-gray-600">{description}</p>
                              </div>
                            </div>
                            <span className="font-bold text-green-700 text-base sm:text-lg">₱{category.price}</span>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>

                {/* Church Information */}
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="churchAttendee"
                      checked={formData.isChurchAttendee}
                      onCheckedChange={(checked) => handleInputChange("isChurchAttendee", checked)}
                    />
                    <Label htmlFor="churchAttendee" className="text-sm sm:text-base">I am a COG Dasma church attendee</Label>
                  </div>

                  {formData.isChurchAttendee && (
                    <div className="space-y-3 sm:space-y-4 pl-4 sm:pl-6 border-l-2 border-blue-200">
                      <h3 className="text-base sm:text-lg font-semibold">Church Information</h3>
                      <div>
                        <Label htmlFor="department" className="text-sm sm:text-base">
                          Department <span className="text-red-500">*</span>
                        </Label>
                        <Select 
                          value={formData.department} 
                          onValueChange={(value) => handleInputChange("department", value)}
                          required={formData.isChurchAttendee}
                        >
                          <SelectTrigger 
                            id="department"
                            className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${formData.isChurchAttendee && !formData.department && showErrorSummary ? "border-red-500" : ""}`}
                          >
                            <SelectValue placeholder="Select department" />
                          </SelectTrigger>
                          <SelectContent>
                            {departments?.map((dept) => (
                              <SelectItem key={dept.id} value={dept.id.toString()}>
                                {dept.name}
                            </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {formData.isChurchAttendee && !formData.department && showErrorSummary && (
                          <p className="text-red-500 text-xs mt-1">Department is required</p>
                        )}
                      </div>

                      {formData.department && (
                        <div>
                          <Label htmlFor="ministry" className="text-sm sm:text-base">
                            Ministry <span className="text-red-500">*</span>
                          </Label>
                          <Select 
                            value={formData.ministry} 
                            onValueChange={(value) => handleInputChange("ministry", value)}
                            required={formData.isChurchAttendee && !!formData.department}
                          >
                            <SelectTrigger 
                              id="ministry"
                              className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${formData.isChurchAttendee && formData.department && !formData.ministry && showErrorSummary ? "border-red-500" : ""}`}
                            >
                              <SelectValue placeholder="Select ministry" />
                            </SelectTrigger>
                            <SelectContent>
                              {getDepartmentMinistries(formData.department).map((ministry) => (
                                <SelectItem key={ministry.id} value={ministry.id.toString()}>
                                  {ministry.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {formData.isChurchAttendee && formData.department && !formData.ministry && showErrorSummary && (
                            <p className="text-red-500 text-xs mt-1">Ministry is required</p>
                          )}
                        </div>
                      )}

                      {formData.ministry && (
                        <div>
                          <Label htmlFor="cluster" className="text-sm sm:text-base">
                            Cluster <span className="text-gray-400">(optional)</span>
                          </Label>
                          <Select 
                            value={formData.cluster} 
                            onValueChange={(value) => handleInputChange("cluster", value)}
                          >
                            <SelectTrigger 
                              id="cluster"
                              className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base"
                            >
                              <SelectValue placeholder="Select cluster" />
                            </SelectTrigger>
                            <SelectContent>
                              {getMinistryClusters(formData.ministry).map((cluster) => (
                                <SelectItem key={cluster.id} value={cluster.id.toString()}>
                                  {cluster.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <p className="text-xs text-gray-500 mt-1">You can leave this empty if you don't belong to a specific cluster</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-3 sm:space-y-4">
                  <h3 className="text-base sm:text-lg font-semibold">Emergency Contact</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <Label htmlFor="emergencyContact" className="text-sm sm:text-base">
                        Emergency Contact Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                        onBlur={(e) => handleBlur("emergencyContact", e.target.value)}
                        required
                        placeholder="Enter full name"
                        aria-invalid={errors.emergencyContact ? "true" : "false"}
                        aria-describedby={errors.emergencyContact ? "emergencyContact-error" : undefined}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.emergencyContact ? "border-red-500" : ""}`}
                      />
                      {errors.emergencyContact && (
                        <p 
                          id="emergencyContact-error" 
                          className="text-red-500 text-xs mt-1"
                          role="alert"
                        >
                          {errors.emergencyContact}
                        </p>
                      )}
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone" className="text-sm sm:text-base">
                        Emergency Contact Phone <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => {
                          const formattedPhone = formatPhoneNumber(e.target.value);
                          handleInputChange("emergencyPhone", formattedPhone);
                        }}
                        onBlur={(e) => handleBlur("emergencyPhone", e.target.value)}
                        required
                        placeholder="e.g., 09151234567"
                        aria-invalid={errors.emergencyPhone ? "true" : "false"}
                        aria-describedby={errors.emergencyPhone ? "emergencyPhone-error" : "emergencyPhone-hint"}
                        className={`mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base ${errors.emergencyPhone ? "border-red-500" : ""}`}
                      />
                      {errors.emergencyPhone ? (
                        <p 
                          id="emergencyPhone-error" 
                          className="text-red-500 text-xs mt-1"
                          role="alert"
                        >
                          {errors.emergencyPhone}
                        </p>
                      ) : (
                        <p id="emergencyPhone-hint" className="text-xs text-gray-500 mt-1">
                          Must be a reachable number for emergencies
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="medicalConditions" className="text-sm sm:text-base">Medical Conditions (if any)</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                      placeholder="e.g., Asthma, Heart condition, etc."
                      className="mt-1 sm:mt-2 h-9 sm:h-10 text-sm sm:text-base"
                    />
                  </div>
                </div>

                {/* Freebies Information */}
                <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                  <h3 className="text-base sm:text-lg font-semibold text-blue-700 mb-3 sm:mb-4 flex items-center gap-2">
                    <span className="bg-blue-700 text-white w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-xs sm:text-sm">✓</span>
                    Race Kit Inclusions
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-4 text-sm sm:text-base">
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Finisher Medal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Event Singlet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Finisher Shirt</span>
                      </div>
                    </div>
                    <div className="space-y-1 sm:space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Runner Bag</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Water</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-blue-600 rounded-full"></div>
                        <span>Bib with RFID</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="space-y-3 sm:space-y-4 mt-4 sm:mt-6">
                  <h3 className="text-base sm:text-lg font-semibold">Payment Method</h3>
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border">
                    <div className="mb-3 sm:mb-4">
                      <div className="text-base sm:text-lg font-semibold">Total Amount:</div>
                      <div className="text-2xl sm:text-3xl font-bold text-green-600">₱{getPrice(formData.category)}</div>
                    </div>
                    
                    <div className="space-y-3 sm:space-y-4">
                      <PaymentMethod 
                        amount={getPrice(formData.category)}
                        onMethodSelect={setSelectedPaymentMethodId}
                        onReferenceInput={setPaymentReferenceNumber}
                        defaultMethodId={selectedPaymentMethodId}
                      />
                      
                      <div className="mt-3 sm:mt-4">
                        <Label htmlFor="paymentProof" className="text-sm sm:text-base">Upload Payment Screenshot</Label>
                        <Input
                          id="paymentProof"
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.size > 5 * 1024 * 1024) { // 5MB limit
                              toast({
                                title: "File too large",
                                description: "Please upload an image smaller than 5MB",
                                variant: "destructive",
                              });
                              return;
                            }
                            setPaymentProof(file || null);
                          }}
                          className="mt-1 sm:mt-2 text-sm sm:text-base"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Please upload a screenshot of your GCash payment confirmation (maximum 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-4 sm:mt-6">
                  <Button 
                    type="button" 
                    variant="outline"
                    className="sm:flex-1"
                    onClick={checkForm}
                  >
                    Check Form
                  </Button>
                  
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 hover:from-blue-700 hover:via-red-600 hover:to-yellow-600 text-white py-4 sm:py-6 text-lg sm:text-xl font-bold tracking-wide"
                    disabled={isSubmitting || isUploading || !paymentProof}
                  >
                    {isSubmitting || isUploading ? (
                      <span className="flex items-center gap-2 justify-center">
                        <span className="animate-spin h-4 w-4 sm:h-5 sm:w-5 border-t-2 border-white rounded-full"></span>
                        {isUploading ? 'Uploading...' : 'Processing...'}
                      </span>
                    ) : 'Complete Registration'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Registration;
