interface AuthLogoProps {
  size?: 'sm' | 'lg';
}

export function AuthLogo({ size = 'lg' }: AuthLogoProps) {
  const isLarge = size === 'lg';
  return (
    <div className="flex items-center gap-3">
      <span
        className={`material-symbols-outlined ${isLarge ? 'text-4xl' : 'text-2xl'} text-primary`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        bolt
      </span>
      <span
        className={`${isLarge ? 'text-4xl' : 'text-2xl'} font-bold bg-gradient-to-r from-primary to-[#818CF8] bg-clip-text text-transparent`}
      >
        StudySolo
      </span>
    </div>
  );
}
