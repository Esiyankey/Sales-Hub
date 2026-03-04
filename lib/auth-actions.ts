"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createUserProfile(
  userId: string,
  email: string,
  businessName: string,
) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Handle error
          }
        },
      },
    },
  );

  const { error } = await supabase.from("user_profiles").insert([
    {
      id: userId,
      username: email.split("@")[0],
      business_name: businessName,
    },
  ]);

  if (error) {
    console.error("Profile creation error:", error.message);
    return { success: false, error: error.message };
  }

  console.log("Profile created successfully");
  return { success: true };
}
