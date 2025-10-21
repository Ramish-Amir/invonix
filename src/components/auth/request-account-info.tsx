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
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
            <Building className="w-8 h-8 text-blue-600 dark:text-blue-400" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white">
            Request Account Access
          </CardTitle>
          <CardDescription className="text-lg text-gray-600 dark:text-gray-300 mt-2">
            Professional invoice management solution for your business
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Main Information */}
          <div className="text-center">
            <p className="text-gray-700 dark:text-gray-300 text-lg leading-relaxed">
              To create an account for our invoice management platform, please
              contact our support team. We'll help you get set up with the right
              access level for your organization.
            </p>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-blue-600" />
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Mail className="w-4 h-4 mr-3 text-gray-500" />
                <span className="font-medium">Email:</span>
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  support@yourcompany.com
                </span>
              </div>
              <div className="flex items-center text-gray-700 dark:text-gray-300">
                <Phone className="w-4 h-4 mr-3 text-gray-500" />
                <span className="font-medium">Phone:</span>
                <span className="ml-2">(555) 123-4567</span>
              </div>
            </div>
          </div>

          {/* Features Overview */}
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-green-600" />
              What You'll Get Access To
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Advanced invoice generation and management
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Professional PDF export capabilities
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Takeoff calculator for construction projects
                  </span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Multi-user collaboration features
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Secure cloud-based storage
                  </span>
                </div>
                <div className="flex items-start">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                  <span className="text-gray-700 dark:text-gray-300">
                    Customizable invoice templates
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Process Information */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2 text-blue-600" />
              Account Setup Process
            </h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  1
                </Badge>
                <span className="text-gray-700 dark:text-gray-300">
                  Contact our support team with your business information
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  2
                </Badge>
                <span className="text-gray-700 dark:text-gray-300">
                  We'll verify your organization and set up your account
                </span>
              </div>
              <div className="flex items-center">
                <Badge variant="outline" className="mr-3">
                  3
                </Badge>
                <span className="text-gray-700 dark:text-gray-300">
                  Receive login credentials and access instructions
                </span>
              </div>
            </div>
          </div>
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
