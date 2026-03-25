'use client'


import { usePathname } from 'next/navigation'
import { AdminSidebar, AdminTopbar } from '@/features/admin/shared'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin-analysis/login'

  return (
    <>
      {/* Material Symbols for admin scholarly design */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link
        href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
        rel="stylesheet"
      />
      <link
        href="https://fonts.googleapis.com/css2?family=Work+Sans:wght@300;400;600&family=Space+Grotesk:wght@300;400;700&display=swap"
        rel="stylesheet"
      />

      {isLoginPage ? (
        children
      ) : (
        <div className="flex h-screen overflow-hidden bg-[#FAF9F5] font-[Work_Sans,sans-serif] text-[#1b1c1a]">
          {/* Sidebar */}
          <AdminSidebar />

          {/* Main content area */}
          <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
            <AdminTopbar />
            <main className="flex-1 overflow-auto">
              {children}
            </main>
          </div>
        </div>
      )}
    </>
  )
}
