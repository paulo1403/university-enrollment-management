'use client';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarHeader,
} from '@/components/ui/sidebar';
import {
  Users,
  BookOpen,
  Building2,
  CalendarDays,
  Banknote,
  Settings,
  Home,
} from 'lucide-react';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { useRouter } from 'next/navigation';

const items = [
  {
    title: 'Inicio',
    url: '/dashboard/admin',
    icon: Home,
  },
  {
    title: 'Gestión de Usuarios',
    url: '/dashboard/admin/users',
    icon: Users,
  },
  {
    title: 'Gestión de Cursos',
    url: '/dashboard/admin/courses',
    icon: BookOpen,
  },
  {
    title: 'Campus',
    url: '/dashboard/admin/campus',
    icon: Building2,
  },
  {
    title: 'Periodos Académicos',
    url: '/dashboard/admin/periods',
    icon: CalendarDays,
  },
  {
    title: 'Finanzas',
    url: '/dashboard/admin/finance',
    icon: Banknote,
  },
  {
    title: 'Configuración',
    url: '/dashboard/admin/settings',
    icon: Settings,
  },
];

export function AppSidebar() {
  const router = useRouter();
  return (
    <Sidebar>
      <SidebarHeader />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Administración</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <button
                      type='button'
                      className='flex items-center gap-2 w-full text-left'
                      onClick={() => router.push(item.url)}
                    >
                      <item.icon className='w-5 h-5' />
                      <span>{item.title}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <ThemeToggle />
      </SidebarFooter>
    </Sidebar>
  );
}
