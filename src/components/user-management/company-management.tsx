"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Building, Users, Plus, Edit, Trash2, FolderOpen } from "lucide-react";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { formatBytes } from "@/lib/services/storageService";

interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  createdAt?: string;
  userCount?: number;
  storageLimit?: number;
  storageUsed?: number;
}

interface CompanyManagementProps {
  onCompanySelect?: (company: Company) => void;
  showSelectButton?: boolean;
}

export default function CompanyManagement({
  onCompanySelect,
  showSelectButton = false,
}: CompanyManagementProps) {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const { toast } = useToast();

  // Load companies
  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      const companiesSnapshot = await getDocs(collection(db, "companies"));
      const companiesData = await Promise.all(
        companiesSnapshot.docs.map(async (doc) => {
          const data = doc.data() as Omit<Company, "id">;

          // Get user count for this company
          const usersSnapshot = await getDocs(
            collection(db, "companies", doc.id, "users")
          );

          return {
            id: doc.id,
            ...data,
            userCount: usersSnapshot.size,
          };
        })
      );
      setCompanies(companiesData);
    } catch (error) {
      console.error("Error loading companies:", error);
      toast({
        title: "Error",
        description: "Failed to load companies",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCompany = async (companyData: Omit<Company, "id">) => {
    try {
      const { DEFAULT_STORAGE_LIMIT } = await import(
        "@/lib/services/storageService"
      );
      const docRef = await addDoc(collection(db, "companies"), {
        ...companyData,
        storageLimit: companyData.storageLimit || DEFAULT_STORAGE_LIMIT,
        storageUsed: 0,
        createdAt: new Date().toISOString(),
      });

      const newCompany = {
        id: docRef.id,
        ...companyData,
        userCount: 0,
        storageLimit: companyData.storageLimit || DEFAULT_STORAGE_LIMIT,
        storageUsed: 0,
      };
      setCompanies((prev) => [...prev, newCompany]);
      setShowAddForm(false);

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

  const handleUpdateCompany = async (companyData: Company) => {
    try {
      await updateDoc(doc(db, "companies", companyData.id), {
        name: companyData.name,
        address: companyData.address,
        phone: companyData.phone,
        email: companyData.email,
        storageLimit: companyData.storageLimit,
      });

      setCompanies((prev) =>
        prev.map((company) =>
          company.id === companyData.id ? companyData : company
        )
      );
      setEditingCompany(null);

      toast({
        title: "Success",
        description: "Company updated successfully!",
      });
    } catch (error) {
      console.error("Error updating company:", error);
      toast({
        title: "Error",
        description: "Failed to update company",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this company? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await deleteDoc(doc(db, "companies", companyId));
      setCompanies((prev) =>
        prev.filter((company) => company.id !== companyId)
      );

      toast({
        title: "Success",
        description: "Company deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting company:", error);
      toast({
        title: "Error",
        description: "Failed to delete company",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading companies...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <Building className="w-6 h-6 mr-2" />
            Company Management
          </h2>
          <p className="text-muted-foreground">
            Manage companies and their users
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Company
        </Button>
      </div>

      {showAddForm && (
        <AddCompanyForm
          onSave={handleAddCompany}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingCompany && (
        <EditCompanyForm
          company={editingCompany}
          onSave={handleUpdateCompany}
          onCancel={() => setEditingCompany(null)}
        />
      )}

      <div className="grid gap-4">
        {companies.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Companies Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first company.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Company
              </Button>
            </CardContent>
          </Card>
        ) : (
          companies.map((company) => (
            <Card key={company.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <Building className="w-5 h-5 mr-2" />
                      {company.name}
                    </CardTitle>
                    <CardDescription>
                      Created{" "}
                      {company.createdAt
                        ? new Date(company.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingCompany(company)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteCompany(company.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(
                          `/project-management?companyId=${company.id}`,
                          "_blank"
                        )
                      }
                    >
                      <FolderOpen className="w-4 h-4 mr-1" />
                      Projects
                    </Button>
                    {showSelectButton && onCompanySelect && (
                      <Button
                        size="sm"
                        onClick={() => onCompanySelect(company)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {company.address && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Address:</strong> {company.address}
                    </div>
                  )}
                  {company.phone && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Phone:</strong> {company.phone}
                    </div>
                  )}
                  {company.email && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Email:</strong> {company.email}
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-3">
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Users className="w-3 h-3" />
                      {company.userCount || 0} users
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}

// Add Company Form Component
interface AddCompanyFormProps {
  onSave: (companyData: Omit<Company, "id">) => void;
  onCancel: () => void;
}

function AddCompanyForm({ onSave, onCancel }: AddCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
      setFormData({ name: "", address: "", phone: "", email: "" });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add New Company
        </CardTitle>
        <CardDescription>Create a new company in the system</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Name *</label>
            <Input
              placeholder="Company Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Main St, City, State 12345"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Create Company
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

// Edit Company Form Component
interface EditCompanyFormProps {
  company: Company;
  onSave: (company: Company) => void;
  onCancel: () => void;
}

function EditCompanyForm({ company, onSave, onCancel }: EditCompanyFormProps) {
  const [formData, setFormData] = useState({
    name: company.name,
    address: company.address || "",
    phone: company.phone || "",
    email: company.email || "",
    storageLimit: company.storageLimit || 0,
  });
  const [storageLimitInput, setStorageLimitInput] = useState("");
  const [storageLimitError, setStorageLimitError] = useState("");

  useEffect(() => {
    const loadStorageFormat = async () => {
      const { formatBytes, DEFAULT_STORAGE_LIMIT } = await import(
        "@/lib/services/storageService"
      );
      const limit = company.storageLimit || DEFAULT_STORAGE_LIMIT;
      setStorageLimitInput(formatBytes(limit));
      setFormData((prev) => ({ ...prev, storageLimit: limit }));
    };
    loadStorageFormat();
  }, [company.storageLimit]);

  const handleStorageLimitChange = async (value: string) => {
    setStorageLimitInput(value);
    setStorageLimitError("");
    try {
      const { parseBytes } = await import("@/lib/services/storageService");
      const bytes = parseBytes(value);
      setFormData((prev) => ({ ...prev, storageLimit: bytes }));
    } catch (error: any) {
      setStorageLimitError(error.message || "Invalid format");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (storageLimitError) return;
    onSave({ ...company, ...formData });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Edit className="w-5 h-5 mr-2" />
          Edit Company
        </CardTitle>
        <CardDescription>Update company information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Company Name *</label>
            <Input
              placeholder="Company Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Address</label>
            <Input
              placeholder="123 Main St, City, State 12345"
              value={formData.address}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, address: e.target.value }))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Phone</label>
              <Input
                placeholder="+1 (555) 123-4567"
                value={formData.phone}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, phone: e.target.value }))
                }
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                placeholder="contact@company.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
              />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Storage Limit
            </label>
            <Input
              placeholder="1GB"
              value={storageLimitInput}
              onChange={(e) => handleStorageLimitChange(e.target.value)}
            />
            {storageLimitError && (
              <p className="text-xs text-red-500 mt-1">{storageLimitError}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              Format: e.g., 1GB, 500MB, 2TB
            </p>
            {company.storageUsed !== undefined && company.storageLimit && (
              <p className="text-xs text-muted-foreground">
                Current usage: {formatBytes(company.storageUsed || 0)} of{" "}
                {formatBytes(company.storageLimit || 0)}
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              type="submit"
              className="flex-1"
              disabled={!!storageLimitError}
            >
              Update Company
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
