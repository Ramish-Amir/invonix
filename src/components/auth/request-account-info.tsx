"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Phone, Building, Users, Shield, Clock } from "lucide-react";
import Link from "next/link";

export default function RequestAccountInfo() {
  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <Card className="shadow-lg">
        <CardHeader className="text-center pb-8">
          <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold text-foreground">
            Request Account Access
          </CardTitle>
          <CardDescription className="text-lg text-muted-foreground mt-2">
            Professional construction estimation and takeoff solution
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Main Information */}
          <div className="text-center">
            <p className="text-muted-foreground text-lg leading-relaxed">
              To create an account for our construction estimation platform,
              please contact our support team. We'll help you get set up with
              the right access level for your organization.
            </p>
          </div>

          {/* Contact Information */}
          <Card className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-primary" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-muted-foreground">
                <Mail className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-medium">Email:</span>
                <span className="ml-2 text-primary">
                  support@yourcompany.com
                </span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Phone className="w-4 h-4 mr-3 text-muted-foreground" />
                <span className="font-medium">Phone:</span>
                <span className="ml-2">(555) 123-4567</span>
              </div>
            </div>
          </Card>

          {/* Features Overview */}
          <div>
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-primary" />
              Estimation Features You'll Get Access To
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Interactive PDF takeoff calculator with measurement tools
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Fixtures calculator for counting and categorizing fixtures
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Color-coded tagging system for organizing measurements
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Price management for pipe sizes and materials
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Automated cost calculations from measurements
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-muted-foreground">
                    Export measurement reports and cost summaries
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Process Information */}
          <Card className="bg-muted/50 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-foreground mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Account Setup Process
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  1
                </Badge>
                <span className="text-muted-foreground">
                  Contact our support team with your business information
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  2
                </Badge>
                <span className="text-muted-foreground">
                  We'll verify your organization and set up your account
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  3
                </Badge>
                <span className="text-muted-foreground">
                  Receive login credentials and access instructions
                </span>
              </div>
            </div>
          </Card>
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/auth/login">Back to Login</Link>
          </Button>
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <a href="mailto:support@yourcompany.com?subject=Account Request">
              Contact Support
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
