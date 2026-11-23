import { Link, useRouterState } from "@tanstack/react-router";
import { Boxes, ChevronRight, Home, Landmark, Settings2, Table2 } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarMenuSub, SidebarMenuSubButton, SidebarMenuSubItem, useSidebar,
} from "@/components/ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { PERMISSION_MODULES } from "@/lib/screens";
import { adminNavForScreens } from "@/lib/nav";
import { useLaunchpad } from "@/lib/use-launchpad";

const SCREEN_PATHS = {
  "fi.vendor-ageing": "/reports/fi/vendor-ageing",
  "fi.zfbl1n": "/reports/fi/zfbl1n",
  "inv.current-stock": "/reports/inv/current-stock",
  "inv.inventory-aging": "/reports/inv/inventory-aging",
  "tables.sap-master": "/reports/tables/sap-master",
  "tables.zrmmat": "/reports/tables/zrmmat",
  "tables.zpc-group": "/reports/tables/zpc-group",
  "tables.valuation-subgroup": "/reports/tables/valuation-subgroup",
} as const;
type ScreenPath = (typeof SCREEN_PATHS)[keyof typeof SCREEN_PATHS];
const pathFor = (k: string): ScreenPath | undefined => (SCREEN_PATHS as Record<string, ScreenPath>)[k];

const ICONS: Record<string, typeof Home> = { "financial-accounting": Landmark, inventory: Boxes, "tables-master": Table2 };

export function AppSidebar() {
  const { data } = useLaunchpad();
  const { setOpenMobile, isMobile } = useSidebar();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const screens = data?.screens ?? [];
  const allowed = (k: string) => screens.includes(k);
  const close = () => { if (isMobile) setOpenMobile(false); };
  const modules = PERMISSION_MODULES.map((m) => ({ ...m, items: m.children.filter((c) => allowed(c.key)).flatMap((c) => { const to = pathFor(c.key); return to ? [{ ...c, to }] : []; }) })).filter((m) => m.items.length);
  const admin = adminNavForScreens(screens);

  return (
    <Sidebar collapsible="icon" data-pdf-exclude>
      <SidebarContent className="pt-2">
        <SidebarGroup><SidebarGroupContent><SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild isActive={path === "/launchpad"} tooltip="Home" className="nav-item">
              <Link to="/launchpad" onClick={close}><Home /><span>Home</span></Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          {modules.map((m) => {
            const Icon = ICONS[m.groupKey] ?? Boxes;
            const active = m.items.some((i) => path.startsWith(i.to));
            return (
              <Collapsible key={m.key} defaultOpen={active} className="group/c" asChild>
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton tooltip={m.label} isActive={active} className="nav-item">
                      <Icon /><span>{m.label}</span><ChevronRight className="ml-auto transition-transform group-data-[state=open]/c:rotate-90" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  <CollapsibleContent><SidebarMenuSub>
                    {m.items.map((i) => (
                      <SidebarMenuSubItem key={i.key}>
                        <SidebarMenuSubButton asChild isActive={path.startsWith(i.to)} className="nav-item">
                          <Link to={i.to} onClick={close}>{i.label}</Link>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub></CollapsibleContent>
                </SidebarMenuItem>
              </Collapsible>
            );
          })}
          {admin.length ? (
            <Collapsible defaultOpen={path.startsWith("/admin")} className="group/c" asChild>
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip="Administration" isActive={path.startsWith("/admin")} className="nav-item">
                    <Settings2 /><span>Administration</span><ChevronRight className="ml-auto transition-transform group-data-[state=open]/c:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent><SidebarMenuSub>
                  {admin.map((i) => (
                    <SidebarMenuSubItem key={i.to}>
                      <SidebarMenuSubButton asChild isActive={path === i.to} className="nav-item"><Link to={i.to} onClick={close}>{i.label}</Link></SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub></CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          ) : null}
        </SidebarMenu></SidebarGroupContent></SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
