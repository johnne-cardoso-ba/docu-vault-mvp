import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useTestUsersSetup() {
  const [setupComplete, setSetupComplete] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    const setupTestUsers = async () => {
      // Check if setup was already done
      const setupDone = localStorage.getItem('test_users_setup_done');
      if (setupDone === 'true') {
        setSetupComplete(true);
        return;
      }

      try {
        console.log('Setting up test users...');
        
        const { data, error } = await supabase.functions.invoke('setup-test-users');

        if (error) {
          console.error('Error setting up test users:', error);
          setSetupError(error.message);
          return;
        }

        console.log('Test users setup result:', data);
        
        // Mark setup as done
        localStorage.setItem('test_users_setup_done', 'true');
        setSetupComplete(true);
      } catch (error: any) {
        console.error('Error in test users setup:', error);
        setSetupError(error.message);
      }
    };

    setupTestUsers();
  }, []);

  return { setupComplete, setupError };
}
