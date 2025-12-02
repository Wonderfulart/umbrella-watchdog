import { supabase } from "@/integrations/supabase/client";

export interface PolicyReminderResult {
  success: boolean;
  testMode?: boolean;
  first_emails_sent: number;
  followup_emails_sent: number;
  policies_checked: number;
  summary: string;
  errors: string[];
}

export interface PolicyReminderOptions {
  testMode?: boolean;
}

export const runPolicyReminder = async (options: PolicyReminderOptions = {}): Promise<PolicyReminderResult> => {
  const { data, error } = await supabase.functions.invoke('run-policy-reminder', {
    body: { testMode: options.testMode || false },
  });

  if (error) {
    throw new Error(error.message || 'Failed to execute policy reminder');
  }

  if (!data.success) {
    throw new Error(data.error || 'Recipe execution failed');
  }

  return data;
};

export const getPolicyReminderHistory = (): PolicyReminderResult[] => {
  const history = localStorage.getItem('policy_reminder_history');
  return history ? JSON.parse(history) : [];
};

export const savePolicyReminderHistory = (result: PolicyReminderResult) => {
  const history = getPolicyReminderHistory();
  const timestampedResult = {
    ...result,
    timestamp: new Date().toISOString(),
  };
  history.unshift(timestampedResult);
  // Keep only last 10 runs
  localStorage.setItem('policy_reminder_history', JSON.stringify(history.slice(0, 10)));
};
