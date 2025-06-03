import { useState } from "react";
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
import { supabase } from "@/integrations/supabase/client";
import { useCategories } from "@/hooks/useCategories";
import { useDepartments } from "@/hooks/useDepartments";
import { useMinistries } from "@/hooks/useMinistries";
import { useClusters } from "@/hooks/useClusters";
import { formatCurrency } from "@/lib/format-utils";
import emailjs from '@emailjs/browser';

// Initialize EmailJS with your public key
emailjs.init("vc8LzDacZcreqI6fN"); // Replace with your actual EmailJS public key

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
  const [showQR, setShowQR] = useState(false);
  const [registrationId, setRegistrationId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
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
    setIsSubmitting(true);
    setIsUploading(true);

    try {
      if (!formData.firstName || !formData.lastName || !formData.email || !formData.category || !formData.shirtSize) {
        toast({
          title: "Missing Information",
          description: "Please fill in all required fields.",
          variant: "destructive",
        });
        return;
      }

      if (formData.isChurchAttendee && (!formData.department || !formData.ministry || !formData.cluster)) {
        toast({
          title: "Church Information Required",
          description: "Please select your department, ministry, and cluster.",
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
        cluster: formData.isChurchAttendee ? selectedCluster?.name : null,
        department_id: formData.isChurchAttendee ? formData.department : null,
        ministry_id: formData.isChurchAttendee ? formData.ministry : null, 
        cluster_id: formData.isChurchAttendee ? formData.cluster : null,
        emergency_contact: formData.emergencyContact || null,
        emergency_phone: formData.emergencyPhone || null,
        medical_conditions: formData.medicalConditions || null,
        shirt_size: formData.shirtSize,
        status: 'pending',
        payment_proof_url: paymentProofUrl
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
      /*
      try {
        await emailjs.send(
          "service_i6px4qb", // Replace with your EmailJS service ID
          "template_1zf9bgr", // Replace with your EmailJS template ID
          {
            to_email: formData.email,
            to_name: `${formData.firstName} ${formData.lastName}`,
            registration_id: id,
            category: formData.category,
            shirt_size: formData.shirtSize,
            amount: formatCurrency(price),
          }
        );
      } catch (emailError) {
        console.error('Error sending confirmation email:', emailError);
        // Don't block registration if email fails
      }
      */
      setRegistrationId(id);
      setShowQR(true);

      toast({
        title: "Registration Successful!",
        description: `Your registration ID is ${id}. A confirmation email has been sent to ${formData.email}`,
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

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      // Reset dependent fields when parent changes
      ...(field === "department" && { ministry: "", cluster: "" }),
      ...(field === "ministry" && { cluster: "" }),
    }));
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
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8 text-center">
            <div className="flex flex-col items-center gap-6">
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
                <h2 className="text-4xl font-black text-red-600 mb-3 tracking-wide" style={{
                  textShadow: '2px 2px 0 rgba(0,0,0,0.1)'
                }}>REGISTER NOW!</h2>
                <p className="text-lg text-gray-700 font-medium">August 22, 2025 | New Dasmariñas Grandstand and Oval</p>
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">10KM</span>
              <span className="bg-red-600 text-white px-4 py-1 rounded-full text-sm font-bold">6KM</span>
              <span className="bg-yellow-500 text-white px-4 py-1 rounded-full text-sm font-bold">3KM</span>
            </div>
          </div>
          <Card className="border-2 border-blue-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-blue-600 to-red-500 text-white">
              <CardTitle className="text-2xl font-bold">Registration Form</CardTitle>
              <CardDescription className="text-white/90">Please provide your information accurately</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name *</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => handleInputChange("firstName", e.target.value)}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name *</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => handleInputChange("lastName", e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => handleInputChange("phone", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="age">Age</Label>
                      <Input
                        id="age"
                        type="number"
                        value={formData.age}
                        onChange={(e) => handleInputChange("age", e.target.value)}
                      />
                    </div>
                  </div>                <div>
                    <Label>Gender</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(value) => handleInputChange("gender", value)}
                      className="flex space-x-4 mt-2"
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male">Male</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female">Female</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  {/* Shirt Size */}
                  <div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="shirtSize">Shirt Size *</Label>
                      <ShirtSizeChart />
                    </div>
                    <Select 
                      value={formData.shirtSize} 
                      onValueChange={(value) => handleInputChange("shirtSize", value)}
                      required
                    >
                      <SelectTrigger>
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
                    <div className="mt-2 text-xs text-gray-500">
                      You'll receive a finisher shirt in this size. Click "View Size Chart" for detailed measurements.
                    </div>
                  </div>
                </div>

                {/* Race Category */}              <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Race Category</h3>
                  <div>
                    <Label>Select Category *</Label>
                    <RadioGroup
                      value={formData.category}
                      onValueChange={(value) => handleInputChange("category", value)}
                      className="mt-2 space-y-3"
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
                          <div key={category.id} className={`flex items-center justify-between p-3 border rounded-lg ${bgColor}`}>
                            <div className="flex items-center gap-3">
                              <RadioGroupItem value={category.name} id={category.name} />
                              <div>
                                <Label htmlFor={category.name} className="text-lg font-medium">{category.name} Run</Label>
                                <p className="text-sm text-gray-600">{description}</p>
                              </div>
                            </div>
                            <span className="font-bold text-green-700 text-lg">₱{category.price}</span>
                          </div>
                        );
                      })}
                    </RadioGroup>
                  </div>
                </div>

                {/* Church Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="churchAttendee"
                      checked={formData.isChurchAttendee}
                      onCheckedChange={(checked) => handleInputChange("isChurchAttendee", checked)}
                    />
                    <Label htmlFor="churchAttendee">I am a church attendee</Label>
                  </div>

                  {formData.isChurchAttendee && (
                    <div className="space-y-4 pl-6 border-l-2 border-blue-200">
                      <h3 className="text-lg font-semibold">Church Information</h3>
                      <div>
                        <Label htmlFor="department">Department *</Label>
                        <Select value={formData.department} onValueChange={(value) => handleInputChange("department", value)}>
                          <SelectTrigger>
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
                      </div>

                      {formData.department && (
                        <div>
                          <Label htmlFor="ministry">Ministry *</Label>
                          <Select value={formData.ministry} onValueChange={(value) => handleInputChange("ministry", value)}>
                            <SelectTrigger>
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
                        </div>
                      )}

                      {formData.ministry && (
                        <div>
                          <Label htmlFor="cluster">Cluster *</Label>
                          <Select value={formData.cluster} onValueChange={(value) => handleInputChange("cluster", value)}>
                            <SelectTrigger>
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
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Emergency Contact</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact Name</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => handleInputChange("emergencyContact", e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone</Label>
                      <Input
                        id="emergencyPhone"
                        value={formData.emergencyPhone}
                        onChange={(e) => handleInputChange("emergencyPhone", e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="medicalConditions">Medical Conditions (if any)</Label>
                    <Input
                      id="medicalConditions"
                      value={formData.medicalConditions}
                      onChange={(e) => handleInputChange("medicalConditions", e.target.value)}
                      placeholder="e.g., Asthma, Heart condition, etc."
                    />
                  </div>
                </div>

                {/* Freebies Information */}
                <div className="p-4 bg-gradient-to-br from-blue-50 to-white rounded-lg border border-blue-200">
                  <h3 className="text-lg font-semibold text-blue-700 mb-4 flex items-center gap-2">
                    <span className="bg-blue-700 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">✓</span>
                    Race Kit Inclusions
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Finisher Medal</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Event Singlet</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Finisher Shirt</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Runner Bag</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Water</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <span>Bib with RFID</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Section */}
                <div className="space-y-4 mt-6">
                  <h3 className="text-lg font-semibold">Payment Method</h3>
                  <div className="p-4 bg-gray-50 rounded-lg border">
                    <div className="mb-4">
                      <div className="text-lg font-semibold">Total Amount:</div>
                      <div className="text-3xl font-bold text-green-600">₱{getPrice(formData.category)}</div>
                    </div>
                    
                    <div className="space-y-4">
                      <PaymentMethod amount={getPrice(formData.category)} />
                      
                      <div className="mt-4">
                        <Label htmlFor="paymentProof">Upload Payment Screenshot</Label>
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
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Please upload a screenshot of your GCash payment confirmation (maximum 5MB)
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 via-red-500 to-yellow-500 hover:from-blue-700 hover:via-red-600 hover:to-yellow-600 text-white py-6 text-xl font-bold tracking-wide mt-6"
                  disabled={isSubmitting || isUploading || !paymentProof}
                >
                  {isSubmitting || isUploading ? (
                    <span className="flex items-center gap-2 justify-center">
                      <span className="animate-spin h-5 w-5 border-t-2 border-white rounded-full"></span>
                      {isUploading ? 'Uploading...' : 'Processing...'}
                    </span>
                  ) : 'Complete Registration'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Registration;
