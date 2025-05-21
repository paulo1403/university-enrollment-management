import { SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex'>
      <SidebarProvider>
        <main className='flex-1 min-h-screen'>{children}</main>
      </SidebarProvider>
    </div>
  );
}
