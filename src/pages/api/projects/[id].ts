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
    const {
      title,
      description,
      status,
      month,
      profileId,
      github_url,
      demo_url,
      tech_stack,
      lessons_learned,
      thumbnail_url,
    } = body;

    // Get the project to verify ownership
    const { data: project, error: projectError } = await supabase
      .from("products")
      .select("profile_id")
      .eq("id", id)
      .single();

    if (projectError || !project) {
      return new Response(JSON.stringify({ error: "Project not found" }), {
        status: 404,
      });
    }

    // Get the profile to verify ownership
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("user_id")
      .eq("id", profileId)
      .single();

    if (profileError || !profile) {
      return new Response(JSON.stringify({ error: "Profile not found" }), {
        status: 404,
      });
    }

    // Verify user owns the profile
    if (user.id !== profile.user_id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    // Check if a project already exists for this month (excluding current project)
    const { data: existingProject } = await supabase
      .from("products")
      .select("id")
      .eq("profile_id", profileId)
      .eq("month", month)
      .neq("id", id)
      .single();

    if (existingProject) {
      return new Response(
        JSON.stringify({
          error: "Another project already exists for this month",
        }),
        { status: 400 }
      );
    }

    // Update the project
    const { data, error } = await supabase
      .from("products")
      .update({
        title,
        description,
        status,
        month,
        github_url: github_url || null,
        demo_url: demo_url || null,
        tech_stack: Array.isArray(tech_stack) ? tech_stack : [],
        lessons_learned: lessons_learned || null,
        thumbnail_url: thumbnail_url || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating project:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update project" }),
        {
          status: 500,
        }
      );
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
