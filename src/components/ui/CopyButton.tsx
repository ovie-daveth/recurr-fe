import { Check, Copy, Loader2 } from "lucide-react";
import { type ReactNode, useState } from "react";

type CopyButtonProps = {
  value: string;
  children?: ReactNode;
  copiedLabel?: string;
  className?: string;
  iconOnly?: boolean;
  disabled?: boolean;
};

export function CopyButton({
  value,
  children = "Copy",
  copiedLabel = "Copied",
  className,
  iconOnly = false,
  disabled = false
}: CopyButtonProps) {
  const [state, setState] = useState<"idle" | "copying" | "copied" | "failed">("idle");

  async function handleCopy() {
    if (!value || disabled || state === "copying") {
      return;
    }

    setState("copying");
    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
      window.setTimeout(() => setState("idle"), 1400);
    } catch {
      setState("failed");
      window.setTimeout(() => setState("idle"), 1800);
    }
  }

  const label = state === "copied" ? copiedLabel : state === "failed" ? "Copy failed" : children;
  const Icon = state === "copying" ? Loader2 : state === "copied" ? Check : Copy;

  return (
    <button
      aria-label={typeof label === "string" ? label : "Copy"}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
      }
      disabled={disabled || !value || state === "copying"}
      type="button"
      onClick={handleCopy}
    >
      <Icon className={state === "copying" ? "animate-spin" : ""} size={iconOnly ? 16 : 15} />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
