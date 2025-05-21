import { SidebarProvider } from '@/components/ui/sidebar';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className='flex'>
      <SidebarProvider>
        {/* Sidebar debe ir aquí para que esté presente en todo el dashboard */}
        {/* El layout debe aplicar bg-background y text-foreground para respetar el tema */}
        <div className='flex w-full min-h-screen bg-background text-foreground'>
          {/* Aquí puedes importar y usar el nuevo AppSidebar si es necesario */}
          {children}
        </div>
      </SidebarProvider>
    </div>
  );
}
