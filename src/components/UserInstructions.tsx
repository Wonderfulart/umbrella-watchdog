import { BookOpen, Mail, CheckSquare, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export const UserInstructions = () => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <Card>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-primary" />
                  How to Use This System
                </CardTitle>
                <CardDescription>
                  Simple step-by-step guide for managing policy renewals
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm">
                {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="space-y-6">
            {/* Step 1 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Step 1: Add Policy Information</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                    <li>Click the <strong>"Import from Spreadsheet"</strong> button at the top of the page</li>
                    <li>Choose your Excel file that has the policy information</li>
                    <li>The system will show you what it found - check if it looks right</li>
                    <li>Click <strong>"Next"</strong>, then click <strong>"Import"</strong></li>
                    <li>Done! Your policies are now in the system</li>
                  </ol>
                  <Alert className="mt-3 bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800 text-sm">
                      <strong>Tip:</strong> Your Excel file should have columns like Customer Name, Policy Number, Email, etc.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Step 2: Send Reminder Emails</h3>
                  <ol className="space-y-2 text-sm text-muted-foreground ml-4 list-decimal">
                    <li>Look at the <strong>"Email Automation"</strong> box on the page</li>
                    <li>It shows how many people need reminders today</li>
                    <li>Click the <strong>blue "Send 37-Day Reminders"</strong> button for policies expiring soon</li>
                    <li>Click the <strong>red "Send Overdue Reminders"</strong> button for policies that already expired</li>
                    <li>Wait a few seconds - the system will send all the emails automatically!</li>
                  </ol>
                  <Alert className="mt-3 bg-amber-50 border-amber-200">
                    <AlertDescription className="text-amber-800 text-sm">
                      <strong>What's a 37-day reminder?</strong> This is an email sent to customers 37 days before their policy expires, giving them time to renew.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <CheckSquare className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Step 3: Check Your Progress</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4 list-disc">
                    <li><strong>Colored boxes at the top:</strong> Show how many policies are upcoming, pending, completed, or overdue</li>
                    <li><strong>Green numbers:</strong> Good! These policies are submitted and complete</li>
                    <li><strong>Red numbers:</strong> Need attention! These are overdue</li>
                    <li><strong>Policies tab:</strong> Click to see a full list with all details</li>
                    <li><strong>Email Activity tab:</strong> See which emails were sent and when</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Step 4 */}
            <div className="space-y-2">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-2">Step 4: Find Specific Policies</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground ml-4 list-disc">
                    <li>Go to the <strong>"Policies"</strong> tab</li>
                    <li>Use the search box at the top</li>
                    <li>Type a customer name, policy number, or company name</li>
                    <li>The list will filter automatically to show only what you're looking for</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Daily Routine */}
            <Alert className="bg-green-50 border-green-200">
              <CheckSquare className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                <strong>Suggested Daily Routine:</strong>
                <ol className="mt-2 ml-4 space-y-1 list-decimal text-sm">
                  <li>Check the colored boxes to see today's status</li>
                  <li>Send reminder emails if the numbers show any pending</li>
                  <li>Review the Email Activity tab to confirm emails were sent</li>
                  <li>Check the Policies tab for any red "overdue" items that need follow-up</li>
                </ol>
              </AlertDescription>
            </Alert>

            {/* Help Section */}
            <div className="pt-4 border-t">
              <h4 className="font-semibold mb-2">Common Questions</h4>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Q: What if I make a mistake?</strong><br />
                A: Don't worry! You can always import your spreadsheet again. The system will update the information.</p>
                
                <p><strong>Q: When should I send emails?</strong><br />
                A: Check the system daily. Send reminders whenever you see numbers in the Email Automation box.</p>
                
                <p><strong>Q: How do I know if emails were sent successfully?</strong><br />
                A: Go to the "Email Activity" tab to see a log of all sent emails with dates and times.</p>
              </div>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};
