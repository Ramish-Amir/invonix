"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { auth, db } from "@/lib/firebase";
import { collection, getDocs, addDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Building, UserPlus, ArrowLeft } from "lucide-react";

const addUserSchema = z.object({
  firstName: z.string().min(2, {
    message: "First name must be at least 2 characters.",
  }),
  lastName: z.string().min(2, {
    message: "Last name must be at least 2 characters.",
  }),
  email: z.string().email({
    message: "Invalid email address.",
  }),
  password: z
    .string()
    .min(8, {
      message: "Password must be at least 8 characters.",
    })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message:
        "Password must contain at least one uppercase letter, one lowercase letter, and one number.",
    }),
  phoneNumber: z.string().optional(),
  companyId: z.string().min(1, {
    message: "Please select a company.",
  }),
  role: z.string().min(1, {
    message: "Please select a role.",
  }),
});

type AddUserFormData = z.infer<typeof addUserSchema>;

const roles = [
  { value: "admin", label: "Administrator" },
  { value: "manager", label: "Manager" },
  { value: "user", label: "Standard User" },
];

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
}

export default function AddUserForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState(true);
  const [showNewCompanyForm, setShowNewCompanyForm] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<AddUserFormData>({
    resolver: zodResolver(addUserSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
      phoneNumber: "",
      companyId: "",
      role: "",
    },
  });

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const companiesSnapshot = await getDocs(collection(db, "companies"));
        const companiesData = companiesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as Company[];
        setCompanies(companiesData);
      } catch (error) {
        console.error("Error loading companies:", error);
        toast({
          title: "Error",
          description: "Failed to load companies",
          variant: "destructive",
        });
      } finally {
        setIsLoadingCompanies(false);
      }
    };

    loadCompanies();
  }, [toast]);

  const createNewCompany = async (companyData: Omit<Company, "id">) => {
    try {
      const docRef = await addDoc(collection(db, "companies"), {
        ...companyData,
        createdAt: new Date().toISOString(),
        createdBy: auth.currentUser?.uid,
      });

      const newCompany = { id: docRef.id, ...companyData };
      setCompanies((prev) => [...prev, newCompany]);
      form.setValue("companyId", docRef.id);
      setShowNewCompanyForm(false);

      toast({
        title: "Success",
        description: "Company created successfully!",
      });
    } catch (error) {
      console.error("Error creating company:", error);
      toast({
        title: "Error",
        description: "Failed to create company",
        variant: "destructive",
      });
    }
  };

  const onSubmit = async (data: AddUserFormData) => {
    setIsLoading(true);
    try {
      // Get the current user's ID token for authentication
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("No user logged in");
      }

      const idToken = await currentUser.getIdToken();

      // Create user using API route (Admin SDK)
      const response = await fetch("/api/create-user", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password,
          phoneNumber: data.phoneNumber,
          role: data.role,
          companyId: data.companyId,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create user");
      }

      toast({
        title: "Success",
        description: "User created successfully!",
      });

      form.reset();
      router.push("/");
    } catch (error: any) {
      console.error("Error creating user:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold text-foreground">Add New User</h1>
        <p className="text-muted-foreground mt-2">
          Create a new user account for the system
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <UserPlus className="w-5 h-5 mr-2" />
            User Information
          </CardTitle>
          <CardDescription>
            Fill in the details for the new user account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address *</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john.doe@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password *</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="Enter secure password"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone Number (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="companyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {isLoadingCompanies ? (
                            <SelectItem value="loading" disabled>
                              Loading companies...
                            </SelectItem>
                          ) : companies.length === 0 ? (
                            <SelectItem value="no-companies" disabled>
                              No companies found
                            </SelectItem>
                          ) : (
                            companies.map((company) => (
                              <SelectItem key={company.id} value={company.id}>
                                {company.name}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {roles.map((role) => (
                            <SelectItem key={role.value} value={role.value}>
                              {role.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowNewCompanyForm(!showNewCompanyForm)}
                  className="flex items-center"
                >
                  <Building className="w-4 h-4 mr-2" />
                  {showNewCompanyForm
                    ? "Cancel New Company"
                    : "Create New Company"}
                </Button>
              </div>

              {showNewCompanyForm && (
                <NewCompanyForm onCreateCompany={createNewCompany} />
              )}

              <div className="flex gap-4 pt-4">
                <Button type="submit" className="flex-1" disabled={isLoading}>
                  {isLoading ? "Creating User..." : "Create User"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push("/")}
                  className="flex items-center"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// New Company Form Component
interface NewCompanyFormProps {
  onCreateCompany: (companyData: Omit<Company, "id">) => void;
}

function NewCompanyForm({ onCreateCompany }: NewCompanyFormProps) {
  const [companyData, setCompanyData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyData.name.trim()) {
      onCreateCompany(companyData);
      setCompanyData({ name: "", address: "", phone: "", email: "" });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Building className="w-5 h-5 mr-2" />
          Create New Company
        </CardTitle>
        <CardDescription>Add a new company to the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Company Name *</label>
              <Input
                placeholder="Company Name"
                value={companyData.name}
                onChange={(e) =>
                  setCompanyData((prev) => ({ ...prev, name: e.target.value }))
                }
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={companyData.phone}
                onChange={(e) =>
                  setCompanyData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Main St, City, State 12345"
              value={companyData.address}
              onChange={(e) =>
                setCompanyData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              placeholder="contact@company.com"
              value={companyData.email}
              onChange={(e) =>
                setCompanyData((prev) => ({ ...prev, email: e.target.value }))
              }
            />
          </div>
          <Button type="submit" className="w-full">
            Create Company
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
