import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) throw redirect({ to: "/auth" });
      return { user: data.user };
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/auth" });
    }
  },
  component: () => (
    <SidebarProvider defaultOpen={false} className="min-h-svh w-full">
      <AppSidebar />
      <SidebarInset className="min-w-0">
        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  ),
});
