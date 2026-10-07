import { useEffect, useRef, useState } from "react";
import { ArrowUp, Square } from "lucide-react";

export function Composer({
  initial,
  busy,
  onSend,
  onStop,
}: {
  initial?: string;
  busy: boolean;
  onSend: (text: string) => void;
  onStop?: () => void;
}) {
  const [text, setText] = useState(initial ?? "");
  const ref = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (!busy) ref.current?.focus();
  }, [busy]);

  function send() {
    const t = text.trim();
    if (!t || busy) return;
    onSend(t.slice(0, 4000));
    setText("");
  }

  return (
    <div className="flex items-end gap-2 rounded-xl border bg-card p-2 shadow-seal focus-within:border-gold">
      <textarea
        ref={ref}
        rows={1}
        value={text}
        maxLength={4000}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            send();
          }
        }}
        placeholder="Describe your situation or ask a legal question…"
        className="max-h-48 min-h-11 flex-1 resize-none bg-transparent px-3 py-2.5 text-sm outline-none placeholder:text-muted-foreground"
      />
      {busy && onStop ? (
        <button onClick={onStop} aria-label="Stop" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Square className="h-4 w-4" />
        </button>
      ) : (
        <button onClick={send} disabled={!text.trim() || busy} aria-label="Send" className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gold text-gold-foreground disabled:opacity-40">
          <ArrowUp className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
