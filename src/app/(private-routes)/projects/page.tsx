"use client";

import { useEffect, useState, useRef } from "react";
import { useAtomValue } from "jotai";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FolderOpen,
  Search,
  MoreHorizontal,
  Eye,
  Trash2,
  Plus,
  Calendar,
  User,
  Ruler,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { authAtom } from "@/atoms/authAtom";
import { userCompanyAtom } from "@/atoms/companyAtom";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  getDoc,
  deleteDoc,
  doc,
  setDoc,
  query,
  orderBy,
  where,
} from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import PageSpinner from "@/components/general/page-spinner";
import { ProjectsTableSkeleton } from "@/components/projects/projects-table-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { FileUploadDialog } from "@/components/takeoff-calculator/file-upload-dialog";
import { useAuth } from "@/hooks/useAuth";
import { createMeasurementDocument } from "@/lib/services/measurementService";
import { formatBytes } from "@/lib/services/storageService";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  createdBy: string;
  createdByName: string;
  measurementCount: number;
  status: "active" | "completed" | "draft";
}

interface ProjectsPageProps {}

const ITEMS_PER_PAGE = 10;

export default function ProjectsPage({}: ProjectsPageProps) {
  const user = useAtomValue(authAtom);
  const userCompany = useAtomValue(userCompanyAtom);
  const router = useRouter();
  const { toast } = useToast();
  const { user: authUser } = useAuth();

  const [projects, setProjects] = useState<Project[]>([]);
  const [filteredProjects, setFilteredProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  useEffect(() => {
    if (user && userCompany) {
      loadProjects();
    }
  }, [user, userCompany]);

  // Close dropdown when dialog opens
  useEffect(() => {
    if (deleteProjectId) {
      setOpenDropdownId(null); // Close any open dropdown when dialog opens
    }
  }, [deleteProjectId]);

  useEffect(() => {
    // Filter projects based on search query
    if (searchQuery.trim() === "") {
      setFilteredProjects(projects);
    } else {
      const filtered = projects.filter((project) =>
        project.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredProjects(filtered);
    }
    setCurrentPage(1); // Reset to first page when searching
  }, [searchQuery, projects]);

  const loadProjects = async () => {
    if (!user || !userCompany) return;

    try {
      setIsLoading(true);

      // Load projects for the user's company
      const projectsSnapshot = await getDocs(
        collection(db, "companies", userCompany.id, "projects")
      );

      const projectsData: Project[] = [];

      // Process each project
      for (const projectDoc of projectsSnapshot.docs) {
        const projectData = projectDoc.data();

        // Get measurement documents for this project
        const measurementsSnapshot = await getDocs(
          collection(
            db,
            "companies",
            userCompany.id,
            "projects",
            projectDoc.id,
            "measurements"
          )
        );

        // Count measurements
        const measurementCount = measurementsSnapshot.docs.reduce(
          (total, measurementDoc) => {
            const data = measurementDoc.data();
            const measurements = data.measurements || [];
            return total + measurements.length;
          },
          0
        );

        // Get creator name
        let createdByName = "Unknown User";
        try {
          const creatorDoc = await getDoc(
            doc(db, "companies", userCompany.id, "users", projectData.createdBy)
          );
          if (creatorDoc.exists()) {
            const creatorData = creatorDoc.data();
            createdByName = `${creatorData.firstName} ${creatorData.lastName}`;
          }
        } catch (error) {
          console.error("Error loading creator name:", error);
        }

        projectsData.push({
          id: projectDoc.id,
          name: projectData.name,
          createdAt: projectData.createdAt,
          updatedAt: projectData.updatedAt,
          createdBy: projectData.createdBy,
          createdByName,
          measurementCount,
          status: measurementCount > 0 ? "active" : "draft",
        });
      }

      // Sort by most recent
      projectsData.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setProjects(projectsData);
      setFilteredProjects(projectsData);
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

  const handleDeleteProject = async (projectId: string) => {
    if (!user || !userCompany) return;

    try {
      setIsDeleting(true);

      // Get all measurement documents for this project to find file URLs
      const { getProjectMeasurementDocuments } = await import(
        "@/lib/services/measurementService"
      );
      const measurementDocs = await getProjectMeasurementDocuments(
        userCompany.id,
        projectId
      );

      // Delete all associated files from R2 and track storage to decrease
      let totalStorageToDecrease = 0;
      const deletePromises = measurementDocs
        .filter((doc) => doc.fileUrl)
        .map((doc) => {
          // Track file size for storage update
          if (doc.fileSize) {
            totalStorageToDecrease += doc.fileSize;
          }

          return fetch("/api/delete-file", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              fileUrl: doc.fileUrl,
            }),
          }).catch((error) => {
            console.error(`Failed to delete file ${doc.fileUrl}:`, error);
            // Continue even if file deletion fails
          });
        });

      await Promise.all(deletePromises);

      // Decrease company storage usage after successful file deletions
      if (totalStorageToDecrease > 0) {
        const { decreaseStorageUsage } = await import(
          "@/lib/services/storageService"
        );
        await decreaseStorageUsage(userCompany.id, totalStorageToDecrease);
      }

      // Delete the project document
      await deleteDoc(
        doc(db, "companies", userCompany.id, "projects", projectId)
      );

      // Update local state
      setProjects(projects.filter((p) => p.id !== projectId));
      setFilteredProjects(filteredProjects.filter((p) => p.id !== projectId));

      toast({
        title: "Success",
        description: "Project deleted successfully",
      });

      setDeleteProjectId(null);
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({
        title: "Error",
        description: "Failed to delete project",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "default";
      case "completed":
        return "secondary";
      case "draft":
        return "outline";
      default:
        return "outline";
    }
  };

  // Pagination
  const totalPages = Math.ceil(filteredProjects.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentProjects = filteredProjects.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Projects</h1>
          <p className="text-muted-foreground">
            Manage and view all your construction projects
          </p>
        </div>
        <Button onClick={() => setUploadDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {/* Search and Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-64"
            />
          </div>
          <div className="text-sm text-muted-foreground">
            {isLoading ? (
              <Skeleton className="h-4 w-16" />
            ) : (
              `${filteredProjects.length} project${
                filteredProjects.length !== 1 ? "s" : ""
              }`
            )}
          </div>
        </div>
      </div>

      {/* File Upload Dialog */}
      {userCompany && authUser && (
        <FileUploadDialog
          open={uploadDialogOpen}
          onOpenChange={setUploadDialogOpen}
          onFileSelect={() => {}}
          onProjectSelect={async (project) => {
            // When project is selected from existing, navigate to takeoff calculator
            setUploadDialogOpen(false);
            router.push(
              `/takeoff-calculator?companyId=${userCompany.id}&projectId=${project.id}`
            );
            // Reload projects after creating new one
            loadProjects();
          }}
          onNewProject={async (
            projectName: string,
            fileName: string,
            file: File,
            onProgress?: (
              step:
                | "creating-project"
                | "uploading-file"
                | "creating-document"
                | "complete"
                | "error",
              progress: number
            ) => void
          ) => {
            if (!user || !userCompany || !authUser) return;

            try {
              // Step 1: Create project in Firestore
              onProgress?.("creating-project", 20);
              const currentProjectId = "project-" + Date.now();
              await setDoc(
                doc(
                  db,
                  "companies",
                  userCompany.id,
                  "projects",
                  currentProjectId
                ),
                {
                  name: projectName,
                  description: `Project for ${fileName}`,
                  status: "active",
                  createdAt: new Date().toISOString(),
                  createdBy: authUser.uid,
                }
              );

              // Step 2: Check storage availability before uploading
              onProgress?.("uploading-file", 40);
              const { checkStorageAvailability, increaseStorageUsage } =
                await import("@/lib/services/storageService");
              const storageCheck = await checkStorageAvailability(
                userCompany.id,
                file.size
              );

              if (!storageCheck.available) {
                throw new Error(
                  `Storage limit exceeded. Available: ${formatBytes(
                    storageCheck.availableBytes
                  )}, Required: ${formatBytes(file.size)}`
                );
              }

              // Step 3: Upload file to Cloudflare R2
              onProgress?.("uploading-file", 50);
              const formData = new FormData();
              formData.append("file", file);
              formData.append("companyId", userCompany.id);
              formData.append("projectId", currentProjectId);

              const uploadResponse = await fetch("/api/upload-file", {
                method: "POST",
                body: formData,
              });

              if (!uploadResponse.ok) {
                let errorData: any = {};
                try {
                  errorData = await uploadResponse.json();
                } catch (e) {
                  // If response is not JSON, try to get text
                  const text = await uploadResponse.text().catch(() => "");
                  errorData = { error: text || "Unknown error" };
                }

                throw new Error(
                  errorData.error ||
                    errorData.message ||
                    "Failed to upload file to cloud storage"
                );
              }

              const { fileUrl, fileSize } = await uploadResponse.json();

              // Step 4: Update storage usage after successful upload
              await increaseStorageUsage(userCompany.id, file.size);

              // Step 5: Create measurement document
              onProgress?.("creating-document", 80);
              await createMeasurementDocument(
                userCompany.id,
                currentProjectId,
                {
                  name: fileName.replace(/\.pdf$/i, ""),
                  fileName,
                  fileUrl,
                  fileSize,
                  userId: authUser.uid,
                }
              );

              // Step 6: Complete
              onProgress?.("complete", 100);

              // Navigate to takeoff calculator with the new project
              router.push(
                `/takeoff-calculator?companyId=${userCompany.id}&projectId=${currentProjectId}`
              );

              // Reload projects after creating new one
              loadProjects();
            } catch (error: any) {
              console.error("Error creating project:", error);
              onProgress?.("error", 0);
              toast({
                title: "Error",
                description: error?.message || "Failed to create project",
                variant: "destructive",
              });
              throw error; // Re-throw so dialog can handle it
            }
          }}
          companyId={userCompany.id}
        />
      )}

      {/* Projects Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FolderOpen className="w-5 h-5 mr-2" />
            All Projects
          </CardTitle>
          <CardDescription>
            View and manage your construction projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <ProjectsTableSkeleton />
          ) : currentProjects.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {searchQuery ? "No projects found" : "No projects yet"}
              </h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery
                  ? "Try adjusting your search terms"
                  : "Get started by creating your first project"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setUploadDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Project
                </Button>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Measurements</TableHead>
                    <TableHead>Created By</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProjects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell className="font-medium">
                        {project.name}
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(project.status)}>
                          {project.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Ruler className="w-4 h-4 mr-1 text-muted-foreground" />
                          {project.measurementCount}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-1 text-muted-foreground" />
                          {project.createdByName}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1 text-muted-foreground" />
                          {formatDate(project.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-1 text-muted-foreground" />
                          {formatDateTime(
                            project.updatedAt || project.createdAt
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu
                          open={openDropdownId === project.id}
                          onOpenChange={(open) => {
                            setOpenDropdownId(open ? project.id : null);
                          }}
                        >
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/takeoff-calculator?projectId=${project.id}`}
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Project
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                setOpenDropdownId(null); // Close dropdown first
                                setDeleteProjectId(project.id);
                              }}
                              className="text-destructive"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1} to{" "}
                    {Math.min(endIndex, filteredProjects.length)} of{" "}
                    {filteredProjects.length} projects
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Previous
                    </Button>
                    <div className="flex items-center space-x-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (page) => (
                          <Button
                            key={page}
                            variant={
                              currentPage === page ? "default" : "outline"
                            }
                            size="sm"
                            onClick={() => setCurrentPage(page)}
                            className="w-8 h-8 p-0"
                          >
                            {page}
                          </Button>
                        )
                      )}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteProjectId}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteProjectId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Project</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this project? This action cannot
              be undone. All measurements and data associated with this project
              will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteProjectId(null)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (deleteProjectId) {
                  handleDeleteProject(deleteProjectId);
                }
              }}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
