'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { type Icon } from '@tabler/icons-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: Icon;
  }[];
}) {
  const pathname = usePathname();
  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items.map((item) => {
            const isActive =
              pathname === item.url ||
              (item.url !== '/dashboard/admin' &&
                pathname.startsWith(item.url + '/'));
            return (
              <SidebarMenuItem key={item.title} data-active={isActive}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActive}
                  className={
                    isActive ? 'bg-muted text-primary font-semibold' : ''
                  }
                >
                  <Link
                    href={item.url}
                    className='flex items-center gap-2 w-full'
                  >
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
