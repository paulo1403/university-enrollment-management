'use client';

import * as React from 'react';
import { type Icon } from '@tabler/icons-react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

export function NavSecondary({
  items,
  ...props
}: {
  items: (
    | {
        title: string;
        url: string;
        icon: Icon;
        custom?: false;
      }
    | {
        custom: true;
        render: () => React.ReactNode;
      }
  )[];
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item, idx) => {
            if ('custom' in item && item.custom) {
              return (
                <SidebarMenuItem key={idx}>{item.render()}</SidebarMenuItem>
              );
            }
            return (
              <SidebarMenuItem key={(item as any).title}>
                <SidebarMenuButton asChild>
                  <a href={(item as any).url}>
                    {React.createElement((item as any).icon)}
                    <span>{(item as any).title}</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
