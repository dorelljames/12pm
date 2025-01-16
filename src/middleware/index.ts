import { defineMiddleware } from "astro:middleware";
import { supabase } from "../lib/supabase";

const protectedRoutes = ["/dashboard"];
const redirectRoutes = ["/signin", "/register"];
const protectedAPIRoutes = ["/api/guestbook"];

function isMatch(path: string, patterns: string[]): boolean {
  // Convert glob patterns to regular expressions
  const regexPatterns = patterns.map((pattern) => {
    // Escape special regex characters except * and ?
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, "\\$&")
      // Convert glob * to regex .*
      .replace(/\*/g, ".*")
      // Convert glob ? to regex .
      .replace(/\?/g, ".");
    // Wrap in ^ and $ to match full string
    return new RegExp(`^${escaped}$`);
  });

  // Test path against all patterns
  return regexPatterns.some((regex) => regex.test(path));
}

export const onRequest = defineMiddleware(
  async ({ locals, url, cookies, redirect }, next) => {
    if (isMatch(url.pathname, protectedRoutes)) {
      console.log("ehree");

      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      if (!accessToken || !refreshToken) {
        return redirect("/signin");
      }

      const { data, error } = await supabase.auth.setSession({
        refresh_token: refreshToken.value,
        access_token: accessToken.value,
      });

      if (error) {
        cookies.delete("sb-access-token", {
          path: "/",
        });
        cookies.delete("sb-refresh-token", {
          path: "/",
        });
        return redirect("/signin");
      }

      locals.email = data.user?.email!;
      cookies.set("sb-access-token", data?.session?.access_token!, {
        sameSite: "strict",
        path: "/",
        secure: true,
      });
      cookies.set("sb-refresh-token", data?.session?.refresh_token!, {
        sameSite: "strict",
        path: "/",
        secure: true,
      });
    }

    if (isMatch(url.pathname, redirectRoutes)) {
      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      if (accessToken && refreshToken) {
        // Verify the session is valid before redirecting
        const { data, error } = await supabase.auth.setSession({
          refresh_token: refreshToken.value,
          access_token: accessToken.value,
        });

        if (!error && data.session) {
          return redirect("/dashboard");
        }

        // If session is invalid, clear the cookies
        cookies.delete("sb-access-token", { path: "/" });
        cookies.delete("sb-refresh-token", { path: "/" });
      }
    }

    if (isMatch(url.pathname, protectedAPIRoutes)) {
      const accessToken = cookies.get("sb-access-token");
      const refreshToken = cookies.get("sb-refresh-token");

      // Check for tokens
      if (!accessToken || !refreshToken) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
          }),
          { status: 401 }
        );
      }

      // Verify the tokens
      const { error } = await supabase.auth.setSession({
        access_token: accessToken.value,
        refresh_token: refreshToken.value,
      });

      if (error) {
        return new Response(
          JSON.stringify({
            error: "Unauthorized",
          }),
          { status: 401 }
        );
      }
    }

    return next();
  }
);
