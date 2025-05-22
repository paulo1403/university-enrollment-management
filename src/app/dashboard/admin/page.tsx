'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UserManagement } from '@/components/admin/user-management';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/login');
    } else {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.role !== 'ADMIN') {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    }
  }, [router]);

  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />{' '}
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col p-4'>
          <h1 className='text-2xl font-bold mb-4'>Usuarios</h1>
          <UserManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
