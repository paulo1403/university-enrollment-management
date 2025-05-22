import { CourseManagement } from '@/components/admin/course-management';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function AdminCoursesPage() {
  return (
    <SidebarProvider
      style={
        {
          '--sidebar-width': 'calc(var(--spacing) * 72)',
          '--header-height': 'calc(var(--spacing) * 12)',
        } as React.CSSProperties
      }
    >
      <AppSidebar variant='inset' />
      <SidebarInset>
        <SiteHeader />
        <div className='flex flex-1 flex-col p-4'>
          <h1 className='text-2xl font-bold mb-4'>Cursos</h1>
          <CourseManagement />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
