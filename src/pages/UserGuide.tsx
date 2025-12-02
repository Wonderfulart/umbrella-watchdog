import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  UserPlus, 
  FileText, 
  Mail, 
  BarChart3, 
  Users, 
  Settings,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

const UserGuide = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/")} 
          className="mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Policy Renewal System - User Guide</h1>
            <p className="text-muted-foreground text-lg">
              Everything you need to know to manage policy renewals effectively
            </p>
          </div>

          <Separator />

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-primary" />
                Getting Started
              </CardTitle>
              <CardDescription>First time using the system? Start here.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  1. Sign In
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  Use your company email and password to access the dashboard. Contact your administrator if you don't have credentials.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  2. Understand Your Role
                </h4>
                <p className="text-sm text-muted-foreground ml-6">
                  <Badge variant="default" className="mr-2">Admin</Badge> Full access to all features, templates, and settings
                  <br />
                  <Badge variant="secondary" className="mr-2 mt-2">Agent</Badge> View policies, send emails, track renewals
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Dashboard Overview
              </CardTitle>
              <CardDescription>Understanding the main dashboard</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Summary Cards</h4>
                <p className="text-sm text-muted-foreground">
                  The top of your dashboard shows 4 key metrics:
                </p>
                <ul className="text-sm text-muted-foreground ml-6 mt-2 space-y-1 list-disc">
                  <li><strong>Upcoming (37 days)</strong> - Policies expiring in the next 37 days</li>
                  <li><strong>Pending Renewals</strong> - All policies awaiting JotForm submission</li>
                  <li><strong>Completed</strong> - Policies with submitted JotForms</li>
                  <li><strong>Overdue</strong> - Expired policies without submission</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Managing Policies */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Managing Policies
              </CardTitle>
              <CardDescription>Add, import, and manage policy records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Adding Single Policies</h4>
                <p className="text-sm text-muted-foreground">
                  Click the <Badge variant="default">+ Add Policy</Badge> button in the top-right corner. Fill in all required fields including customer number, policy number, client details, agent information, and expiration date.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Bulk Import</h4>
                <p className="text-sm text-muted-foreground">
                  Click <Badge variant="outline">Import CSV/Excel</Badge> to upload multiple policies at once. The system will guide you through mapping your columns to the correct fields.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Editing Policies</h4>
                <p className="text-sm text-muted-foreground">
                  Click the <strong>Edit</strong> button on any policy row to update information. Changes save automatically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Deleting Policies <Badge variant="destructive">Admin Only</Badge></h4>
                <p className="text-sm text-muted-foreground">
                  Select policies using checkboxes and click <strong>Delete Selected</strong>. This action cannot be undone.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Email Automation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-primary" />
                Email Automation
              </CardTitle>
              <CardDescription>Sending reminders and tracking emails</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Scheduled Automation</h4>
                <p className="text-sm text-muted-foreground">
                  Toggle the <Badge variant="default">Enable Scheduled Emails</Badge> switch to automatically send:
                </p>
                <ul className="text-sm text-muted-foreground ml-6 mt-2 space-y-1 list-disc">
                  <li><strong>Email 1</strong> - Sent 37 days before expiration</li>
                  <li><strong>Email 2</strong> - Follow-up sent 7 days after Email 1 (if no JotForm submission)</li>
                </ul>
                <div className="mt-2 p-3 bg-muted rounded-md">
                  <AlertCircle className="h-4 w-4 inline mr-2 text-orange-500" />
                  <span className="text-sm">Emails run daily at 9:00 AM automatically when enabled</span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Manual Email Sending</h4>
                <p className="text-sm text-muted-foreground">
                  Click <Badge variant="outline">Send Emails Now</Badge> to immediately process and send emails based on current policy dates.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Test Mode</h4>
                <p className="text-sm text-muted-foreground">
                  Enable <strong>Test Mode</strong> to send sample emails without affecting real customer data. Perfect for testing templates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Analytics & Reporting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Analytics & Email Activity
              </CardTitle>
              <CardDescription>Track performance and email delivery</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Analytics Tab</h4>
                <p className="text-sm text-muted-foreground">
                  View charts showing:
                </p>
                <ul className="text-sm text-muted-foreground ml-6 mt-2 space-y-1 list-disc">
                  <li>Email success rates over time</li>
                  <li>Policy status distribution</li>
                  <li>Agent performance metrics</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Email Activity Tab</h4>
                <p className="text-sm text-muted-foreground">
                  See detailed logs of all sent emails including status (sent/failed), timestamps, and error messages. Filter by date, email type, or policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Admin Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Admin Features <Badge variant="default">Admin Only</Badge>
              </CardTitle>
              <CardDescription>Advanced settings and customization</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Email Templates</h4>
                <p className="text-sm text-muted-foreground">
                  Customize email content sent to clients. Use placeholders like {"{client_name}"}, {"{policy_number}"}, and {"{expiration_date}"} to personalize emails automatically.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Agent Management</h4>
                <p className="text-sm text-muted-foreground">
                  Add, edit, or deactivate agent accounts. Upload company logos for professional email branding.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">User Roles</h4>
                <p className="text-sm text-muted-foreground">
                  Assign admin or agent roles to control access levels. Admins have full system access; agents have read-only policy access.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Troubleshooting */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-orange-500" />
                Troubleshooting & Support
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold mb-2">Common Issues</h4>
                <ul className="text-sm text-muted-foreground ml-6 space-y-2 list-disc">
                  <li><strong>Can't log in?</strong> Use "Forgot password?" link to reset your password</li>
                  <li><strong>Emails not sending?</strong> Check that automation is enabled and configuration is correct</li>
                  <li><strong>Missing features?</strong> You may need admin access - contact your administrator</li>
                  <li><strong>Import failing?</strong> Ensure CSV/Excel columns match required format</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Getting Help</h4>
                <p className="text-sm text-muted-foreground">
                  Contact your system administrator or IT support team for assistance with:
                </p>
                <ul className="text-sm text-muted-foreground ml-6 mt-2 space-y-1 list-disc">
                  <li>Account access issues</li>
                  <li>Role and permission changes</li>
                  <li>System configuration</li>
                  <li>Technical problems</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Quick Reference */}
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
              <CardTitle>Quick Reference</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div>
                  <h4 className="font-semibold mb-2">Key Timings</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Email 1: 37 days before expiration</li>
                    <li>• Email 2: 7 days after Email 1</li>
                    <li>• Daily automation: 9:00 AM</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Status Indicators</h4>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>• Green: Completed (JotForm submitted)</li>
                    <li>• Yellow: Pending renewal</li>
                    <li>• Red: Overdue (past expiration)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-center pt-6">
            <Button onClick={() => navigate("/")} size="lg">
              Go to Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserGuide;
