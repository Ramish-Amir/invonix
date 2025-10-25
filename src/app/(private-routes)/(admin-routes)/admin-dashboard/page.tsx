"use client";

import { useEffect, useState } from "react";
import PageSpinner from "@/components/general/page-spinner";
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
  Users,
  Building,
  FolderOpen,
  UserPlus,
  Settings,
  BarChart3,
  ArrowRight,
  Plus,
} from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import Link from "next/link";

interface DashboardStats {
  totalCompanies: number;
  totalUsers: number;
  totalProjects: number;
  totalMeasurements: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCompanies: 0,
    totalUsers: 0,
    totalProjects: 0,
    totalMeasurements: 0,
  });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    loadDashboardStats();
  }, []);

  const loadDashboardStats = async () => {
    try {
      setIsLoadingStats(true);

      // Get companies count
      const companiesSnapshot = await getDocs(collection(db, "companies"));
      const totalCompanies = companiesSnapshot.size;

      // Get users count
      const usersSnapshot = await getDocs(collection(db, "adminUsers"));
      const totalUsers = usersSnapshot.size;

      // Get projects count across all companies
      let totalProjects = 0;
      let totalMeasurements = 0;

      for (const companyDoc of companiesSnapshot.docs) {
        const projectsSnapshot = await getDocs(
          collection(db, "companies", companyDoc.id, "projects")
        );
        totalProjects += projectsSnapshot.size;

        // Get measurements count for each project
        for (const projectDoc of projectsSnapshot.docs) {
          const measurementsSnapshot = await getDocs(
            collection(
              db,
              "companies",
              companyDoc.id,
              "projects",
              projectDoc.id,
              "measurements"
            )
          );

          // Count total measurements across all documents in this project
          const projectMeasurements = measurementsSnapshot.docs.reduce(
            (total, measurementDoc) => {
              const data = measurementDoc.data();
              return total + (data.measurements?.length || 0);
            },
            0
          );
          totalMeasurements += projectMeasurements;
        }
      }

      setStats({
        totalCompanies,
        totalUsers,
        totalProjects,
        totalMeasurements,
      });
    } catch (error) {
      console.error("Error loading dashboard stats:", error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  if (isLoadingStats) {
    return <PageSpinner />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage your invoice management system
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/add-user">
              <UserPlus className="w-4 h-4 mr-2" />
              Add User
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/company-management">
              <Building className="w-4 h-4 mr-2" />
              Manage Companies
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Companies</CardTitle>
            <Building className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCompanies}</div>
            <p className="text-xs text-muted-foreground">
              Total companies in system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              Total users across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground">
              Total projects across all companies
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Measurements</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMeasurements}</div>
            <p className="text-xs text-muted-foreground">
              Total measurements across all projects
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <UserPlus className="w-5 h-5 mr-2" />
              User Management
            </CardTitle>
            <CardDescription>
              Add new users and manage existing user accounts
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/add-user">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New User
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/company-management">
                  <Users className="w-4 h-4 mr-2" />
                  View All Users
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Company Management
            </CardTitle>
            <CardDescription>
              Manage companies and their settings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/company-management">
                  <Building className="w-4 h-4 mr-2" />
                  Manage Companies
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/company-management">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Company
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FolderOpen className="w-5 h-5 mr-2" />
              Project Management
            </CardTitle>
            <CardDescription>
              View and manage projects across companies
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button asChild className="w-full">
                <Link href="/create-project">
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Project
                </Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link href="/company-management">
                  <FolderOpen className="w-4 h-4 mr-2" />
                  View All Projects
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            System Overview
          </CardTitle>
          <CardDescription>
            Quick overview of your invoice management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold">Companies</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.totalCompanies} Total</Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/company-management">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Users</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.totalUsers} Total</Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/add-user">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold">Projects</h4>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{stats.totalProjects} Total</Badge>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/company-management">
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
