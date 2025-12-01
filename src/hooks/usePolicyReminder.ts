import { useState } from 'react';
import { runPolicyReminder, savePolicyReminderHistory, PolicyReminderResult } from '@/services/policyReminderService';

export const usePolicyReminder = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PolicyReminderResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const execute = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await runPolicyReminder();
      setResult(data);
      savePolicyReminderHistory(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { execute, loading, result, error };
};
