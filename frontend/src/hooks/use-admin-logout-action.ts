import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminLogout } from '@/services/admin.service';
import { useAdminStore } from '@/stores/use-admin-store';

interface UseAdminLogoutActionResult {
  loggingOut: boolean;
  logout: () => Promise<void>;
}

export function useAdminLogoutAction(): UseAdminLogoutActionResult {
  const router = useRouter();
  const clearAdmin = useAdminStore((state) => state.clearAdmin);
  const [loggingOut, setLoggingOut] = useState(false);

  const logout = useCallback(async () => {
    if (loggingOut) {
      return;
    }

    setLoggingOut(true);
    try {
      await adminLogout();
    } catch {
      // Keep logout resilient even when API call fails.
    } finally {
      clearAdmin();
      router.push('/admin-analysis/login');
      setLoggingOut(false);
    }
  }, [clearAdmin, loggingOut, router]);

  return { loggingOut, logout };
}
