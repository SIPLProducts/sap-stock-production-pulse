import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Bell, Home, LogOut, Maximize, Minimize, Moon, Settings, Sparkles, Sun, User } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useTheme } from "@/components/theme-provider";
import { adminNavForScreens } from "@/lib/nav";
import { supabase } from "@/integrations/supabase/client";
import reslLogo from "@/assets/resl-logo.png.asset.json";


import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function ShellBar({
  title,
  displayName,
  screens,
  launchpad = false,
}: {
  title: string;
  displayName?: string | null | undefined;
  screens?: string[] | undefined;
  launchpad?: boolean;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { theme, toggleTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fsSupported, setFsSupported] = useState(false);
  useEffect(() => {
    setFsSupported(Boolean(document.fullscreenEnabled));
    const sync = () => setIsFullscreen(Boolean(document.fullscreenElement));
    sync();
    document.addEventListener("fullscreenchange", sync);
    // Report screens open in full mode when reached through a click (e.g. a
    // launchpad tile). Hard page loads have no user activation, so full screen
    // is silently skipped there — browsers require a gesture for it.
    if (
      !launchpad &&
      document.fullscreenEnabled &&
      !document.fullscreenElement &&
      navigator.userActivation?.isActive
    ) {
      void document.documentElement.requestFullscreen().catch(() => {});
    }
    return () => document.removeEventListener("fullscreenchange", sync);
  }, [launchpad]);
  function toggleFullscreen() {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => {});
    else void document.documentElement.requestFullscreen().catch(() => {});
  }

  const adminItems = adminNavForScreens(screens);


  async function handleSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header data-pdf-exclude className="shell-bar sticky top-0 z-40 flex h-14 items-center gap-3 px-3 text-foreground">
      <Link to="/launchpad" className="flex min-w-0 items-center gap-2">
        <span className={`grid shrink-0 place-items-center overflow-hidden  h-8 rounded-lg px-1`}>
          <span className="inline-flex items-center"><img src={reslLogo.url} alt="RESL" className={`h-7 w-auto object-contain`} /></span>
        </span>
        <span className="flex min-w-0 items-center gap-2">
          <span className={`truncate font-semibold tracking-wide ${launchpad ? "text-xs" : "text-sm"}`}>MIS PORTAL</span>
        </span>
      </Link>
      <span className="hidden flex-1 truncate text-center text-sm font-semibold tracking-wide md:block">{launchpad ? "" : title}</span>
      <span className="flex-1 md:hidden" aria-hidden="true" />


      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "glassy" : "light"} mode`}
          title={`Switch to ${theme === "light" ? "dark" : theme === "dark" ? "glassy" : "light"} mode`}
          onClick={toggleTheme}
          className="shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
        >
          {theme === "light" ? <Moon /> : theme === "dark" ? <Sparkles /> : <Sun />}
        </Button>
        {fsSupported ? (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={isFullscreen ? "Exit full screen" : "Full screen"}
            title={isFullscreen ? "Exit full screen" : "Full screen"}
            onClick={toggleFullscreen}
            className="shrink-0 rounded-full text-muted-foreground hover:bg-primary/10 hover:text-primary"
          >
            {isFullscreen ? <Minimize /> : <Maximize />}
          </Button>
        ) : null}
        <Link
          to="/launchpad"
          aria-label="Home"
          title="Home"
          className={`${launchpad ? "hidden" : ""} rounded-full p-2 transition-colors hover:bg-primary/10 hover:text-primary`}
        >
          <Home className="size-[18px]" />
        </Link>
        <button
          type="button"
          aria-label="Notifications"
          className={`rounded-full transition-colors hover:bg-primary/10 hover:text-primary ${launchpad ? "inline-flex items-center gap-1 px-2 py-1 text-[10px]" : "hidden p-2 sm:inline-flex"}`}
        >
          <Bell className={launchpad ? "size-3.5" : "size-[18px]"} />
          {launchpad ? <span className="hidden sm:inline">Alerts</span> : null}
        </button>
        <SidebarTrigger aria-label="Toggle menu" className="shrink-0 rounded-lg text-muted-foreground hover:bg-primary/10 hover:text-primary" />
        {launchpad ? (
          <button type="button" aria-label="Settings" className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] transition-colors hover:bg-primary/10 hover:text-primary">
            <Settings className="size-3.5" />
            <span className="hidden sm:inline">Settings</span>
          </button>
        ) : null}
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="Account"
            className="ml-1 flex min-w-0 items-center gap-2 rounded-full p-1 transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <span className={`grid shrink-0 place-items-center rounded-full bg-primary/10 text-primary ${launchpad ? "size-6 text-[10px] font-semibold" : "size-8"}`}>
              {launchpad ? "SA" : <User className="size-4" />}
            </span>
            {launchpad ? <span className="hidden max-w-28 truncate pr-1 text-[10px] sm:block">{displayName ?? "Signed in"}</span> : null}
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel className="truncate">{displayName ?? "Signed in"}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {adminItems.length ? (
              <>
                <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                  Administration
                </DropdownMenuLabel>
                {adminItems.map((item) => (
                  <DropdownMenuItem key={item.to} asChild>
                    <Link to={item.to}>{item.label}</Link>
                  </DropdownMenuItem>
                ))}
                <DropdownMenuSeparator />
              </>
            ) : null}

            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="mr-2 size-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
