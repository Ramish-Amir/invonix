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
import { FolderOpen, Plus, Edit, Trash2, Calendar } from "lucide-react";
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

interface Project {
  id: string;
  name: string;
  description?: string;
  status: "active" | "completed" | "on-hold";
  createdAt?: string;
  measurementCount?: number;
  fixtureCount?: number;
}

interface ProjectManagementProps {
  companyId: string;
  companyName: string;
  onProjectSelect?: (project: Project) => void;
  showSelectButton?: boolean;
}

export default function ProjectManagement({
  companyId,
  companyName,
  onProjectSelect,
  showSelectButton = false,
}: ProjectManagementProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const { toast } = useToast();

  // Load projects
  useEffect(() => {
    if (companyId) {
      loadProjects();
    }
  }, [companyId]);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const projectsSnapshot = await getDocs(
        collection(db, "companies", companyId, "projects")
      );
      const projectsData = await Promise.all(
        projectsSnapshot.docs.map(async (doc) => {
          const data = doc.data() as Omit<Project, "id">;

          // Get measurement documents for this project
          const measurementsSnapshot = await getDocs(
            collection(
              db,
              "companies",
              companyId,
              "projects",
              doc.id,
              "measurements"
            )
          );

          // Count total measurements across all documents
          const totalMeasurements = measurementsSnapshot.docs.reduce(
            (total, measurementDoc) => {
              const data = measurementDoc.data();
              return total + (data.measurements?.length || 0);
            },
            0
          );

          // Get fixture count for this project (for future implementation)
          const fixturesSnapshot = await getDocs(
            collection(
              db,
              "companies",
              companyId,
              "projects",
              doc.id,
              "fixtures"
            )
          );

          return {
            id: doc.id,
            ...data,
            measurementCount: totalMeasurements,
            fixtureCount: fixturesSnapshot.size,
          };
        })
      );
      setProjects(projectsData);
    } catch (error) {
      console.error("Error loading projects:", error);
      toast({
        title: "Error",
        description: "Failed to load projects",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddProject = async (projectData: Omit<Project, "id">) => {
    try {
      const docRef = await addDoc(
        collection(db, "companies", companyId, "projects"),
        {
          ...projectData,
          createdAt: new Date().toISOString(),
        }
      );

      const newProject = {
        id: docRef.id,
        ...projectData,
        measurementCount: 0,
        fixtureCount: 0,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => [...prev, newProject]);
      setShowAddForm(false);

      toast({
        title: "Success",
        description: "Project created successfully!",
      });
    } catch (error) {
      console.error("Error creating project:", error);
      toast({
        title: "Error",
        description: "Failed to create project",
        variant: "destructive",
      });
    }
  };

  const handleUpdateProject = async (projectData: Project) => {
    try {
      await updateDoc(
        doc(db, "companies", companyId, "projects", projectData.id),
        {
          name: projectData.name,
          description: projectData.description,
          status: projectData.status,
        }
      );

      setProjects((prev) =>
        prev.map((project) =>
          project.id === projectData.id ? projectData : project
        )
      );
      setEditingProject(null);

      toast({
        title: "Success",
        description: "Project updated successfully!",
      });
    } catch (error) {
      console.error("Error updating project:", error);
      toast({
        title: "Error",
        description: "Failed to update project",
        variant: "destructive",
      });
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this project? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      // Get all measurement documents for this project to find file URLs
      const { getProjectMeasurementDocuments } = await import(
        "@/lib/services/measurementService"
      );
      const measurementDocs = await getProjectMeasurementDocuments(
        companyId,
        projectId
      );

      // Delete all associated files from R2
      const deletePromises = measurementDocs
        .filter((doc) => doc.fileUrl)
        .map((doc) =>
          fetch("/api/delete-file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ fileUrl: doc.fileUrl }),
          }).catch((error) => {
            console.error(`Failed to delete file ${doc.fileUrl}:`, error);
            // Continue even if file deletion fails
          })
        );

      await Promise.all(deletePromises);

      // Delete the project document
      await deleteDoc(doc(db, "companies", companyId, "projects", projectId));
      setProjects((prev) => prev.filter((project) => project.id !== projectId));

      toast({
        title: "Success",
        description: "Project deleted successfully!",
      });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
      case "completed":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
      case "on-hold":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading projects...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold flex items-center">
            <FolderOpen className="w-6 h-6 mr-2" />
            Projects - {companyName}
          </h2>
          <p className="text-muted-foreground">
            Manage projects for {companyName}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="flex items-center"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Project
        </Button>
      </div>

      {showAddForm && (
        <AddProjectForm
          onSave={handleAddProject}
          onCancel={() => setShowAddForm(false)}
        />
      )}

      {editingProject && (
        <EditProjectForm
          project={editingProject}
          onSave={handleUpdateProject}
          onCancel={() => setEditingProject(null)}
        />
      )}

      <div className="grid gap-4">
        {projects.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Projects Found</h3>
              <p className="text-muted-foreground mb-4">
                Get started by creating your first project for {companyName}.
              </p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Project
              </Button>
            </CardContent>
          </Card>
        ) : (
          projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center">
                      <FolderOpen className="w-5 h-5 mr-2" />
                      {project.name}
                    </CardTitle>
                    <CardDescription>
                      Created{" "}
                      {project.createdAt
                        ? new Date(project.createdAt).toLocaleDateString()
                        : "Unknown"}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProject(project)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteProject(project.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {showSelectButton && onProjectSelect && (
                      <Button
                        size="sm"
                        onClick={() => onProjectSelect(project)}
                      >
                        Select
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {project.description && (
                    <div className="text-sm text-muted-foreground">
                      <strong>Description:</strong> {project.description}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(project.status)}>
                      {project.status.replace("-", " ").toUpperCase()}
                    </Badge>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {project.measurementCount || 0} measurements
                    </Badge>
                    <Badge
                      variant="outline"
                      className="flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {project.fixtureCount || 0} fixtures
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

// Add Project Form Component
interface AddProjectFormProps {
  onSave: (projectData: Omit<Project, "id">) => void;
  onCancel: () => void;
}

function AddProjectForm({ onSave, onCancel }: AddProjectFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "active" as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name.trim()) {
      onSave(formData);
      setFormData({ name: "", description: "", status: "active" });
    }
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Plus className="w-5 h-5 mr-2" />
          Add New Project
        </CardTitle>
        <CardDescription>Create a new project</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name *</label>
            <Input
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Project description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as any,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Create Project
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

// Edit Project Form Component
interface EditProjectFormProps {
  project: Project;
  onSave: (project: Project) => void;
  onCancel: () => void;
}

function EditProjectForm({ project, onSave, onCancel }: EditProjectFormProps) {
  const [formData, setFormData] = useState({
    name: project.name,
    description: project.description || "",
    status: project.status,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...project, ...formData });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader>
        <CardTitle className="text-lg flex items-center">
          <Edit className="w-5 h-5 mr-2" />
          Edit Project
        </CardTitle>
        <CardDescription>Update project information</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Project Name *</label>
            <Input
              placeholder="Project Name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Input
              placeholder="Project description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
            />
          </div>
          <div>
            <label className="text-sm font-medium">Status</label>
            <select
              value={formData.status}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value as any,
                }))
              }
              className="w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
            </select>
          </div>
          <div className="flex gap-2">
            <Button type="submit" className="flex-1">
              Update Project
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
