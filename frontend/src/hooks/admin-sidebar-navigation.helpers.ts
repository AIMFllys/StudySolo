export function isAdminNavItemActive(pathname: string, href: string): boolean {
  if (href === '/admin-analysis') {
    return pathname === '/admin-analysis';
  }

  return pathname.startsWith(href);
}

export function shouldCloseSidebarOnNavigate(
  innerWidth: number,
  sidebarOpen: boolean,
  mobileWidth = 768
): boolean {
  return sidebarOpen && innerWidth < mobileWidth;
}
