import { useParams, useSearchParams } from "react-router-dom";
import { InsuranceApplicationForm } from "@/components/forms/InsuranceApplicationForm";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function FormPage() {
  const { templateId } = useParams<{ templateId: string }>();
  const [searchParams] = useSearchParams();
  const policyId = searchParams.get('policy') || undefined;
  const navigate = useNavigate();

  if (!templateId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Form Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested form template does not exist.</p>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Return to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-xl font-semibold">Insurance Application</h1>
              <p className="text-sm text-muted-foreground">Complete all required fields</p>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <InsuranceApplicationForm
          templateId={templateId}
          policyId={policyId}
          onSubmit={() => {
            // Handle successful submission
            navigate('/');
          }}
        />
      </main>
    </div>
  );
}
