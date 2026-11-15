"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Modal } from "@/components/ui/modal";
import { Spinner } from "@/components/ui/spinner";

type NameDialogProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  label: string;
  initialValue?: string;
  placeholder?: string;
  submitLabel: string;
  onSubmit: (
    name: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
};

export function NameDialog(props: NameDialogProps) {
  if (!props.open) return null;
  return <NameDialogContent {...props} />;
}

function NameDialogContent({
  onClose,
  title,
  description,
  label,
  initialValue = "",
  placeholder,
  submitLabel,
  onSubmit,
}: NameDialogProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = value.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await onSubmit(name);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onClose();
    } catch {
      setError("Something went wrong. Please try again.");
      toast.error("Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => undefined : onClose}
      title={title}
      description={description}
      size="sm"
      dismissible={!busy}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name-dialog-input">{label}</Label>
          <Input
            id="name-dialog-input"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder={placeholder}
            maxLength={80}
            disabled={busy}
          />
          {error ? (
            <p className="text-xs font-medium text-coral" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy ? <Spinner /> : null}
            {submitLabel}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
