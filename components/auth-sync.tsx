"use client";

import { useEffect, useRef } from "react";
import { browserSupabase } from "@/lib/supabase/browser";
import { useStore } from "@/lib/store";

export function AuthSync() {
  const { signIn, markIntro, user } = useStore();
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    const supabase = browserSupabase();
    if (!supabase) return;
    started.current = true;
    supabase.auth.getUser().then(({ data }) => {
      const account = data.user;
      if (!account) return;
      const meta = account.user_metadata ?? {};
      signIn({
        name: meta.full_name || meta.name || account.email?.split("@")[0] || "Guest",
        email: account.email || "",
        phone: user?.phone || account.phone || "",
        city: user?.city || "Chennai",
        avatarUrl: meta.avatar_url || meta.picture,
        upiId: user?.upiId,
      });
      markIntro();
    });
  }, [markIntro, signIn, user?.city, user?.phone, user?.upiId]);

  return null;
}
