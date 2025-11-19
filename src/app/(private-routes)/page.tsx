"use client";

import { useEffect, useState } from "react";
import { useAtomValue } from "jotai";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FolderOpen,
  Ruler,
  TrendingUp,
  FileText,
  Plus,
  ArrowRight,
  Activity,
  Upload,
  Play,
  Eye,
} from "lucide-react";
import { authAtom } from "@/atoms/authAtom";
import { userCompanyAtom } from "@/atoms/companyAtom";
import { db } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  setDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import PageSpinner from "@/components/general/page-spinner";
import { Skeleton } from "@/components/ui/skeleton";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";
import { FileUploadDialog } from "@/components/takeoff-calculator/file-upload-dialog";
import { useAuth } from "@/hooks/useAuth";
import { createMeasurementDocument } from "@/lib/services/measurementService";
import { useToast } from "@/hooks/use-toast";
import {
  getCompanyStorage,
  formatBytes,
  DEFAULT_STORAGE_LIMIT,
} from "@/lib/services/storageService";
import { Progress } from "@/components/ui/progress";
import { HardDrive } from "lucide-react";

interface Project {
  id: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
  measurementCount: number;
  status: "active" | "completed" | "draft";
}

interface DashboardStats {
  totalProjects: number;
  totalMeasurements: number;
  thisWeekMeasurements: number;
}

interface RecentActivity {
  id: string;
  type: "measurement" | "project" | "upload";
  description: string;
  timestamp: string;
  projectName?: string;
}

export default function DashboardPage() {
  const user = useAtomValue(authAtom);
  const userCompany = useAtomValue(userCompanyAtom);
  const router = useRouter();
  const { user: authUser } = useAuth();
  const { toast } = useToast();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalMeasurements: 0,
    thisWeekMeasurements: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [storageInfo, setStorageInfo] = useState<{
    used: number;
    limit: number;
    available: number;
  } | null>(null);

  const getTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return date.toLocaleDateString();
  };

  useEffect(() => {
    if (user && userCompany) {
      loadDashboardData();
    }
  }, [user, userCompany]);

  const loadDashboardData = async () => {
    if (!user || !userCompany) return;

    try {
      setIsLoading(true);

      // Load storage information
      try {
        const storage = await getCompanyStorage(userCompany.id);
        setStorageInfo({
          used: storage.storageUsed,
          limit: storage.storageLimit,
          available: storage.storageAvailable,
        });
      } catch (error) {
        console.error("Error loading storage info:", error);
        // Initialize with default if company doesn't have storage fields
        const companyDoc = await getDoc(doc(db, "companies", userCompany.id));
        if (companyDoc.exists()) {
          const companyData = companyDoc.data();
          const limit = companyData.storageLimit || DEFAULT_STORAGE_LIMIT;
          const used = companyData.storageUsed || 0;
          setStorageInfo({
            used,
            limit,
            available: limit - used,
          });
        }
      }

      // Load projects for the user's company
      const projectsSnapshot = await getDocs(
        collection(db, "companies", userCompany.id, "projects")
      );

      const projects: Project[] = [];
      let totalMeasurements = 0;
      let thisWeekMeasurements = 0;

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

        // Count measurements and calculate values
        const projectMeasurements = measurementsSnapshot.docs.reduce(
          (total, measurementDoc) => {
            const data = measurementDoc.data();
            const measurements = data.measurements || [];
            return total + measurements.length;
          },
          0
        );

        totalMeasurements += projectMeasurements;

        // Check if project was updated this week
        const projectDate = new Date(
          projectData.updatedAt || projectData.createdAt
        );
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        if (projectDate > weekAgo) {
          thisWeekMeasurements += projectMeasurements;
        }

        projects.push({
          id: projectDoc.id,
          name: projectData.name,
          createdAt: projectData.createdAt,
          updatedAt: projectData.updatedAt,
          measurementCount: projectMeasurements,
          status: projectMeasurements > 0 ? "active" : "draft",
        });
      }

      // Sort projects by most recent
      projects.sort((a, b) => {
        const dateA = new Date(a.updatedAt || a.createdAt);
        const dateB = new Date(b.updatedAt || b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      setRecentProjects(projects.slice(0, 5));
      setStats({
        totalProjects: projects.length,
        totalMeasurements,
        thisWeekMeasurements,
      });

      // Generate real activity data from projects
      const activities: RecentActivity[] = [];

      // Add project creation activities
      projects.slice(0, 3).forEach((project) => {
        const date = new Date(project.createdAt);
        const timeAgo = getTimeAgo(date);

        activities.push({
          id: `project-${project.id}`,
          type: "project",
          description: `Created project: ${project.name}`,
          timestamp: timeAgo,
          projectName: project.name,
        });
      });

      // Add measurement activities for projects with measurements
      projects
        .filter((p) => p.measurementCount > 0)
        .slice(0, 2)
        .forEach((project) => {
          const date = new Date(project.updatedAt || project.createdAt);
          const timeAgo = getTimeAgo(date);

          activities.push({
            id: `measurement-${project.id}`,
            type: "measurement",
            description: `Added ${project.measurementCount} measurements to ${project.name}`,
            timestamp: timeAgo,
            projectName: project.name,
          });
        });

      // Sort by most recent
      activities.sort((a, b) => {
        const dateA = new Date(a.timestamp);
        const dateB = new Date(b.timestamp);
        return dateB.getTime() - dateA.getTime();
      });

      setRecentActivity(activities.slice(0, 5));
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your projects.
          </p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Projects
            </CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-8 mb-2" />
            ) : (
              <div className="text-2xl font-bold">{stats.totalProjects}</div>
            )}
            {isLoading ? (
              <Skeleton className="h-3 w-24" />
            ) : (
              <p className="text-xs text-muted-foreground">
                {stats.totalProjects > 0
                  ? "Active projects"
                  : "No projects yet"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Measurements
            </CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-12 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.totalMeasurements}
              </div>
            )}
            {isLoading ? (
              <Skeleton className="h-3 w-20" />
            ) : (
              <p className="text-xs text-muted-foreground">
                Across all projects
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-8 w-6 mb-2" />
            ) : (
              <div className="text-2xl font-bold">
                {stats.thisWeekMeasurements}
              </div>
            )}
            {isLoading ? (
              <Skeleton className="h-3 w-28" />
            ) : (
              <p className="text-xs text-muted-foreground">New measurements</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Projects */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FolderOpen className="w-5 h-5 mr-2" />
                Recent Projects
              </CardTitle>
              <CardDescription>
                Your most recently worked on projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div>
                          <Skeleton className="h-4 w-32 mb-2" />
                          <div className="flex items-center space-x-2">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-3 w-1" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Skeleton className="h-6 w-16 rounded-full" />
                        <Skeleton className="h-8 w-8 rounded" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by creating your first project.
                  </p>
                  <Button asChild>
                    <Link href="/projects">
                      Go to Projects
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentProjects.map((project) => (
                    <div
                      key={project.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{project.name}</h4>
                          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                            <span>{project.measurementCount} measurements</span>
                            <span>•</span>
                            <span>
                              {new Date(
                                project.updatedAt || project.createdAt
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            project.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {project.status}
                        </Badge>
                        <Button variant="ghost" size="sm" asChild>
                          <Link
                            href={`/takeoff-calculator?projectId=${project.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/projects">
                        View All Projects
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Storage Usage & Activity */}
        <div className="space-y-6">
          {/* Storage Usage */}
          <Card className="border-primary/20 bg-gradient-to-br from-background to-muted/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <HardDrive className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-semibold">
                      Storage Usage
                    </CardTitle>
                    <CardDescription className="text-xs mt-0.5">
                      Company storage overview
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {isLoading || !storageInfo ? (
                <div className="space-y-3">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              ) : (
                <>
                  {/* Main Storage Display */}
                  <div className="space-y-3">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold tracking-tight">
                            {formatBytes(storageInfo.used)}
                          </span>
                          <span className="text-lg text-muted-foreground font-medium">
                            / {formatBytes(storageInfo.limit)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Total storage used
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-primary">
                          {(
                            (storageInfo.used / storageInfo.limit) *
                            100
                          ).toFixed(1)}
                          %
                        </div>
                        <p className="text-xs text-muted-foreground">
                          capacity
                        </p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <Progress
                        value={(storageInfo.used / storageInfo.limit) * 100}
                        className={`h-3 ${
                          (storageInfo.used / storageInfo.limit) * 100 > 90
                            ? "[&>div]:bg-red-500"
                            : (storageInfo.used / storageInfo.limit) * 100 > 75
                            ? "[&>div]:bg-yellow-500"
                            : "[&>div]:bg-primary"
                        }`}
                      />
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">
                          {formatBytes(storageInfo.available)} available
                        </span>
                        <span className="font-medium text-muted-foreground">
                          {(
                            ((storageInfo.limit - storageInfo.used) /
                              storageInfo.limit) *
                            100
                          ).toFixed(1)}
                          % remaining
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Storage Breakdown */}
                  <div className="pt-3 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        Storage Limit
                      </span>
                      <span className="font-semibold">
                        {formatBytes(storageInfo.limit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Used</span>
                      <span className="font-semibold">
                        {formatBytes(storageInfo.used)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Available</span>
                      <span
                        className={`font-semibold ${
                          storageInfo.available < 100 * 1024 * 1024
                            ? "text-red-600 dark:text-red-400"
                            : "text-green-600 dark:text-green-400"
                        }`}
                      >
                        {formatBytes(storageInfo.available)}
                      </span>
                    </div>
                  </div>

                  {/* Warning Alert */}
                  {storageInfo.available < 100 * 1024 * 1024 && (
                    <div className="rounded-lg bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 dark:border-yellow-500/20 p-3 mt-3">
                      <div className="flex items-start gap-2">
                        <div className="p-1 rounded-full bg-yellow-500/20 shrink-0 mt-0.5">
                          <HardDrive className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-300 mb-1">
                            Low Storage Warning
                          </p>
                          <p className="text-xs text-yellow-600/80 dark:text-yellow-400/80">
                            Less than 100MB remaining. Consider upgrading your
                            storage plan or removing unused files.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          {/* File Upload Dialog */}
          {userCompany && authUser && (
            <FileUploadDialog
              open={uploadDialogOpen}
              onOpenChange={setUploadDialogOpen}
              onFileSelect={() => {}}
              onProjectSelect={async (project) => {
                setUploadDialogOpen(false);
                router.push(
                  `/takeoff-calculator?companyId=${userCompany.id}&projectId=${project.id}`
                );
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

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="w-5 h-5 mr-2" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <Skeleton className="w-2 h-2 rounded-full mt-2" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div
                      key={activity.id}
                      className="flex items-start space-x-3"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-foreground">
                          {activity.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {activity.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No recent activity
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
