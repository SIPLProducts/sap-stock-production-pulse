import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "RESL MIS Portal — Sign In" },
      {
        name: "description",
        content:
          "Access RESL MIS sales, open orders and financial reporting.",
      },
      { property: "og:title", content: "RESL MIS Portal — Sign In" },
      {
        property: "og:description",
        content: "Access RESL MIS sales, open orders and financial reporting.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RootRedirect,
});

function RootRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/auth", replace: true });
  }, [navigate]);

  return <div className="min-h-screen bg-background" aria-hidden />;
}
