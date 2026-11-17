"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";

export function SignOutButton() {
  const queryClient = useQueryClient();
  const t = useT();

  return (
    <form
      action={signOutAction}
      onSubmit={() => {
        // The provider outlives the session, so drop every cached library
        // before the next account can read them in this tab.
        queryClient.clear();
      }}
    >
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        aria-label={t("layout.signOut")}
        title={t("layout.signOut")}
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
