export interface AuthBannerState {
  justRegistered: boolean;
  resetSuccess: boolean;
}

export interface VerificationFlowState {
  codeSent: boolean;
  countdown: number;
  sendingCode: boolean;
  loading: boolean;
  error: string | null;
}

export interface CaptchaState {
  token: string;
  verified: boolean;
  error: string | null;
}
