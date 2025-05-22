import { AuditLogViewer } from '@/components/admin/audit-log-viewer';
import { SiteHeader } from '@/components/site-header';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/app-sidebar';

export default function AdminAuditPage() {
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
          <h1 className='text-2xl font-bold mb-4'>Auditoría</h1>
          <AuditLogViewer />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
