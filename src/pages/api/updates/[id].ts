import type { APIRoute } from "astro";
import { supabase } from "../../../lib/supabase";

export const PUT: APIRoute = async ({ request, cookies, params }) => {
  try {
    const { id } = params;

    // Get auth tokens from cookies
    const accessToken = cookies.get("sb-access-token")?.value;
    const refreshToken = cookies.get("sb-refresh-token")?.value;

    if (!accessToken || !refreshToken) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Set the session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Get request body
    const body = await request.json();
    const { type, content, profileId, productId } = body;

    // Get the update to verify ownership
    const { data: update, error: updateError } = await supabase
      .from("product_updates")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (updateError || !update) {
      return new Response(JSON.stringify({ error: "Update not found" }), {
        status: 404,
      });
    }

    // Get the single profile based from profileId
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", profileId)
      .single();

    // Verify user owns the update
    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    // If productId is provided, verify it belongs to the user
    if (productId) {
      const { data: product, error: productError } = await supabase
        .from("products")
        .select("profile_id")
        .eq("id", productId)
        .single();

      if (productError || !product || product.profile_id !== profileId) {
        return new Response(
          JSON.stringify({ error: "Invalid product selected" }),
          { status: 400 }
        );
      }
    }

    // Update the update
    const { data, error } = await supabase
      .from("product_updates")
      .update({
        type,
        content,
        product_id: productId || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating update:", error);
      return new Response(JSON.stringify({ error: "Failed to update" }), {
        status: 500,
      });
    }

    return new Response(JSON.stringify(data), {
      status: 200,
    });
  } catch (error) {
    console.error("Error processing request:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
    });
  }
};
