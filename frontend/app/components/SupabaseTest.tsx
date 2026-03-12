"use client";

import { useEffect } from "react";
// import { supabase } from "@/lib/supabaseClient";
import { supabase } from "../../lib/supabaseClient";

export default function SupabaseTest() {
  useEffect(() => {
    const test = async () => {
      const { data, error } = await supabase.auth.getSession();
      console.log("Supabase session:", data, error);
    };

    test();
  }, []);

  return null;
}
