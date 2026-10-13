"use client";
import { useEffect, useRef } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store";

export function AuthSync() {
  const { ready, reloadAccount, clearAccount, markSessionChecked, showToast } = useStore();
  const sessionId = useRef<string | null>(null);
  useEffect(() => {
    if (!ready) return;
    const client = browserSupabase();
    if (!client) { clearAccount(); markSessionChecked(); return; }
    let disposed = false;
    const refresh = async () => {
      try { await reloadAccount(); }
      catch (e) { if (!disposed) { showToast(e instanceof Error ? e.message : "Account could not be loaded."); } }
      finally { if (!disposed) markSessionChecked(); }
    };
    void refresh();
    const { data } = client.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session) { sessionId.current = null; clearAccount(); markSessionChecked(); return; }
      if (sessionId.current && sessionId.current !== session.user.id) clearAccount();
      sessionId.current = session.user.id;
      // Avoid awaiting Supabase operations inside its auth event lock.
      window.setTimeout(() => { if (!disposed) void refresh(); }, 0);
    });
    return () => { disposed = true; data.subscription.unsubscribe(); };
  }, [ready, reloadAccount, clearAccount, markSessionChecked, showToast]);
  return null;
}
