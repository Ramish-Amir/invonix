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
} from "firebase/firestore";
import PageSpinner from "@/components/general/page-spinner";

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

  const [stats, setStats] = useState<DashboardStats>({
    totalProjects: 0,
    totalMeasurements: 0,
    thisWeekMeasurements: 0,
  });
  const [recentProjects, setRecentProjects] = useState<Project[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  if (isLoading) {
    return <PageSpinner />;
  }

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
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalProjects > 0 ? "Active projects" : "No projects yet"}
            </p>
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
            <div className="text-2xl font-bold">{stats.totalMeasurements}</div>
            <p className="text-xs text-muted-foreground">Across all projects</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.thisWeekMeasurements}
            </div>
            <p className="text-xs text-muted-foreground">New measurements</p>
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
              {recentProjects.length === 0 ? (
                <div className="text-center py-8">
                  <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No projects yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Get started by uploading a PDF and creating your first
                    project.
                  </p>
                  <Button asChild>
                    <Link href="/takeoff-calculator">
                      <Upload className="w-4 h-4 mr-2" />
                      Start Your First Project
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
                            href={`/takeoff-calculator?project=${project.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                      </div>
                    </div>
                  ))}
                  <div className="pt-4">
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/takeoff-calculator">
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

        {/* Quick Actions & Activity */}
        <div className="space-y-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Play className="w-5 h-5 mr-2" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" asChild>
                <Link href="/takeoff-calculator">
                  <Upload className="w-4 h-4 mr-2" />
                  Upload New PDF
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/takeoff-calculator">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
              <Button
                variant="outline"
                className="w-full justify-start"
                asChild
              >
                <Link href="/takeoff-calculator">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Analytics
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="w-5 h-5 mr-2" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
