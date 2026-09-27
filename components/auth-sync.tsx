"use client";

import { useEffect, useRef } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store";

export function AuthSync() {
  const { signIn, markIntro, markSessionChecked, ready, user } = useStore();
  const started = useRef(false);

  useEffect(() => {
    if (!ready || started.current) return;
    started.current = true;
    const supabase = browserSupabase();
    if (!supabase) {
      markSessionChecked();
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      const account = data.session?.user;
      if (!account) return;
      // Only auto-sign in from remote session if not explicitly logged out
      const meta = account.user_metadata ?? {};
      signIn({
        name: meta.full_name || meta.name || account.email?.split("@")[0] || "Explorer",
        email: account.email || "",
        phone: account.phone || user?.phone || "",
        city: user?.city || "Chennai",
        avatarUrl: meta.avatar_url || meta.picture,
      });
      markIntro();
    }).catch(() => {
      /* ignore */
    }).finally(() => markSessionChecked());

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT" || !session?.user) {
        markSessionChecked();
      } else if (event === "SIGNED_IN" && session.user) {
        const meta = session.user.user_metadata ?? {};
        signIn({
          name: meta.full_name || meta.name || session.user.email?.split("@")[0] || "Explorer",
          email: session.user.email || "",
          phone: session.user.phone || user?.phone || "",
          city: user?.city || "Chennai",
          avatarUrl: meta.avatar_url || meta.picture,
        });
        markIntro();
        markSessionChecked();
      }
    });

    return () => {
      sub.subscription.unsubscribe();
    };
  }, [markIntro, markSessionChecked, ready, signIn]);

  return null;
}
