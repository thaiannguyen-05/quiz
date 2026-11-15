"use client";

import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";

export function SignOutButton() {
  const queryClient = useQueryClient();

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
        aria-label="Sign out"
        title="Sign out"
      >
        <LogOut className="size-4" />
      </Button>
    </form>
  );
}
