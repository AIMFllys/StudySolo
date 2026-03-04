import { useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { useAdminStore } from '@/stores/use-admin-store';
import {
  isAdminNavItemActive,
  shouldCloseSidebarOnNavigate,
} from '@/hooks/admin-sidebar-navigation.helpers';

const MOBILE_WIDTH = 768;

interface UseAdminSidebarNavigationResult {
  pathname: string;
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  isActive: (href: string) => boolean;
  closeSidebarOnMobileNavigate: () => void;
}

export function useAdminSidebarNavigation(): UseAdminSidebarNavigationResult {
  const pathname = usePathname();
  const sidebarOpen = useAdminStore((state) => state.sidebarOpen);
  const toggleSidebar = useAdminStore((state) => state.toggleSidebar);

  const isActive = useCallback(
    (href: string) => isAdminNavItemActive(pathname, href),
    [pathname]
  );

  const closeSidebarOnMobileNavigate = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (shouldCloseSidebarOnNavigate(window.innerWidth, sidebarOpen, MOBILE_WIDTH)) {
      toggleSidebar();
    }
  }, [sidebarOpen, toggleSidebar]);

  return {
    pathname,
    sidebarOpen,
    toggleSidebar,
    isActive,
    closeSidebarOnMobileNavigate,
  };
}
