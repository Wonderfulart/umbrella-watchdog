import { useState } from 'react';
import { runPolicyReminder, savePolicyReminderHistory, PolicyReminderResult, PolicyReminderOptions } from '@/services/policyReminderService';

export const usePolicyReminder = () => {
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const [result, setResult] = useState<PolicyReminderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async (options?: PolicyReminderOptions) => {
    const isTestMode = options?.testMode === true;
    
    if (isTestMode) {
      setTestLoading(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await runPolicyReminder(options);
      setResult(data);
      // Only save to history if not test mode
      if (!isTestMode) {
        savePolicyReminderHistory(data);
      }
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      if (isTestMode) {
        setTestLoading(false);
      } else {
        setLoading(false);
      }
    }
  };

  return { execute, loading, testLoading, result, error };
};
