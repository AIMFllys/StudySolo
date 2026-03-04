import type { ReactNode } from 'react';
import { authAnimationStyles } from '@/features/auth/constants';
import { AuthBrandPanel } from './AuthBrandPanel';
import { AuthLogo } from './AuthLogo';
import { AuthSocialButtons } from './AuthSocialButtons';

interface AuthShellProps {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
  showSocial?: boolean;
}

export function AuthShell({
  title,
  description,
  children,
  footer,
  showSocial = true,
}: AuthShellProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: authAnimationStyles }} />
      <div className="min-h-screen flex bg-[#020617]">
        <AuthBrandPanel />
        <div className="w-full md:w-1/2 flex items-center justify-center p-6 md:p-12 bg-[#020617]">
          <div className="w-full max-w-sm">
            <div className="flex items-center mb-8 md:hidden">
              <AuthLogo size="sm" />
            </div>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-white">{title}</h2>
              <p className="text-sm text-[#94A3B8] mt-1">{description}</p>
            </div>

            {showSocial ? (
              <>
                <AuthSocialButtons />
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex-1 h-px bg-white/[0.08]" />
                  <span className="text-xs text-[#94A3B8]">或使用邮箱继续</span>
                  <div className="flex-1 h-px bg-white/[0.08]" />
                </div>
              </>
            ) : null}

            {children}
            <div className="mt-6 text-center text-sm text-[#94A3B8]">{footer}</div>
          </div>
        </div>
      </div>
    </>
  );
}
