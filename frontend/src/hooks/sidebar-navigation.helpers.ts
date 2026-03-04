export function isWorkflowRouteActive(pathname: string, workflowId: string): boolean {
  return pathname === `/workspace/${workflowId}`;
}

export function isSettingsRouteActive(pathname: string): boolean {
  return pathname === '/settings';
}
