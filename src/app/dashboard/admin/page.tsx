'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { ChartAreaInteractive } from '@/components/chart-area-interactive';
import { DataTable } from '@/components/data-table';
import { SectionCards } from '@/components/section-cards';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { UserManagement } from '@/components/admin/user-management';
import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import data from '../data.json';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
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
        <div className='flex flex-1 flex-col'>
          <div className='@container/main flex flex-1 flex-col gap-2'>
            <div className='flex flex-col gap-4 py-4 md:gap-6 md:py-6'>
              {' '}
              <div className='px-4 lg:px-6'>
                <Tabs defaultValue='dashboard' className='w-full'>
                  <TabsList className='grid w-full grid-cols-3'>
                    <TabsTrigger value='dashboard'>Dashboard</TabsTrigger>
                    <TabsTrigger value='users'>Usuarios</TabsTrigger>
                    <TabsTrigger value='audit'>Auditoría</TabsTrigger>
                  </TabsList>
                  <TabsContent value='dashboard' className='pt-4'>
                    <SectionCards />
                    <div className='px-4 lg:px-6 mt-6'>
                      <ChartAreaInteractive />
                    </div>
                    <div className='mt-6'>
                      <DataTable data={data} />
                    </div>
                  </TabsContent>
                  <TabsContent value='users' className='pt-4'>
                    <UserManagement />
                  </TabsContent>
                  <TabsContent value='audit' className='pt-4'>
                    <AuditLogViewer />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
