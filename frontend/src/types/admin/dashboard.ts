export interface TierDistribution {
  free: number;
  pro: number;
  pro_plus: number;
  ultra: number;
}

export interface DashboardOverview {
  total_users: number;
  active_users: number;
  tier_distribution: TierDistribution;
  today_signups: number;
  today_edu_signups: number;
  total_workflow_runs: number;
  today_workflow_runs: number;
  active_subscriptions: number;
}

export interface SignupDataPoint {
  date: string;
  signups: number;
  edu_signups: number;
}

export interface WorkflowDataPoint {
  date: string;
  total_runs: number;
  success: number;
  failed: number;
  total_tokens: number;
}

export interface DashboardCharts {
  time_range: string;
  signups_chart: SignupDataPoint[];
  workflow_chart: WorkflowDataPoint[];
}

export type DashboardTimeRange = '7d' | '30d' | '90d';
