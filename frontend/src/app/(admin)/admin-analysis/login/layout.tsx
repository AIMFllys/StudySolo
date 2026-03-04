// Standalone layout for the login page — no sidebar or topbar
export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0A0E1A]">
      {children}
    </div>
  )
}
