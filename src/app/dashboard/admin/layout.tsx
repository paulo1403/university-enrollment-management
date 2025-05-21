import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/layout/app-sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex'>
      <SidebarProvider>
        <AppSidebar />
        <main className='flex-1 min-h-screen'>
          <SidebarTrigger />
          {children}
        </main>
      </SidebarProvider>
    </div>
  );
}
