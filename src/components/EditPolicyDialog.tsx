import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const formSchema = z.object({
  customerNumber: z.string().min(1, "Customer number is required"),
  policyNumber: z.string().min(1, "Policy number is required"),
  clientName: z.string().min(2, "Client name is required"),
  companyName: z.string().min(1, "Company name is required"),
  clientEmail: z.string().email("Invalid email address"),
  agentEmail: z.string().email("Invalid email address"),
  expirationDate: z.date({ required_error: "Expiration date is required" }),
});

interface Policy {
  id: string;
  customer_number: string;
  policy_number: string;
  client_first_name: string;
  company_name: string;
  client_email: string;
  agent_email: string;
  expiration_date: string;
  submission_link: string;
  jotform_submitted: boolean;
  email1_sent: boolean;
  email2_sent: boolean;
}

interface EditPolicyDialogProps {
  policy: Policy;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPolicyUpdated: () => void;
}

export const EditPolicyDialog = ({ policy, open, onOpenChange, onPolicyUpdated }: EditPolicyDialogProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerNumber: policy.customer_number,
      policyNumber: policy.policy_number,
      clientName: policy.client_first_name,
      companyName: policy.company_name,
      clientEmail: policy.client_email,
      agentEmail: policy.agent_email,
      expirationDate: parseISO(policy.expiration_date),
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        customerNumber: policy.customer_number,
        policyNumber: policy.policy_number,
        clientName: policy.client_first_name,
        companyName: policy.company_name,
        clientEmail: policy.client_email,
        agentEmail: policy.agent_email,
        expirationDate: parseISO(policy.expiration_date),
      });
    }
  }, [open, policy, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    try {
      const baseUrl = "https://form.jotform.com/250873904844061";
      const submissionLink = `${baseUrl}?policyNumber=${encodeURIComponent(values.policyNumber)}&typeA=${encodeURIComponent(values.customerNumber)}`;
      
      const { error } = await supabase
        .from("policies")
        .update({
          customer_number: values.customerNumber,
          policy_number: values.policyNumber,
          client_first_name: values.clientName,
          company_name: values.companyName,
          client_email: values.clientEmail,
          agent_email: values.agentEmail,
          expiration_date: format(values.expirationDate, "yyyy-MM-dd"),
          submission_link: submissionLink,
        })
        .eq("id", policy.id);

      if (error) throw error;

      toast.success("Policy updated successfully");
      onOpenChange(false);
      onPolicyUpdated();
    } catch (error: any) {
      console.error("Error updating policy:", error);
      toast.error(error.message || "Failed to update policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Policy</DialogTitle>
          <DialogDescription>Update the policy details below.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="customerNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Number</FormLabel>
                  <FormControl>
                    <Input placeholder="10001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="policyNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Policy Number</FormLabel>
                  <FormControl>
                    <Input placeholder="UMB-2025-001" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Name</FormLabel>
                  <FormControl>
                    <Input placeholder="John Smith" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="companyName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Company Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Acme Insurance Co." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="clientEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Client Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="client@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="agentEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Agent Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="agent@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="expirationDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Expiration Date</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full pl-3 text-left font-normal",
                            !field.value && "text-muted-foreground"
                          )}
                        >
                          {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
