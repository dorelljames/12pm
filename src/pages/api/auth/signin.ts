import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";
import type { Provider } from "@supabase/supabase-js";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const formData = await request.formData();
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const provider = formData.get("provider")?.toString();

  if (provider) {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider as Provider,
      options: {
        redirectTo: import.meta.env.DEV
          ? "http://localhost:1234/api/auth/callback"
          : "https://12in12.pro/api/auth/callback",
      },
    });

    if (error) {
      return new Response(error.message, { status: 500 });
    }

    return redirect(data.url);
  }

  if (!email) {
    return new Response("Email is required!", { status: 400 });
  }

  // const { data, error } = await supabase.auth.signInWithPassword({
  //   email,
  //   password,
  // });

  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
  console.log("🚀 ~ constPOST:APIRoute= ~ data:", data);

  if (error) {
    return new Response(error.message, { status: 500 });
  }

  return new Response("Sign in successful!", { status: 200 });
};
