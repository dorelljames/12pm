import type { APIRoute } from "astro";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: import.meta.env.PUBLIC_NOTION_TOKEN,
});

const DATABASE_ID = import.meta.env.PUBLIC_NOTION_DATABASE_ID;

export const post: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

    if (!data.name || !data.email || !data.reason) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400 }
      );
    }

    await notion.pages.create({
      parent: {
        database_id: DATABASE_ID,
      },
      properties: {
        Name: {
          title: [
            {
              text: {
                content: data.name,
              },
            },
          ],
        },
        Email: {
          email: data.email,
        },
        Reason: {
          rich_text: [
            {
              text: {
                content: data.reason,
              },
            },
          ],
        },
        Status: {
          select: {
            name: "New",
          },
        },
        "Sign Up Date": {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        message: "Thanks for joining! I'll be in touch soon. 🎉",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Error:", error);
    const message =
      error instanceof Error ? error.message : "Something went wrong";
    return new Response(JSON.stringify({ error: message }), { status: 500 });
  }
};
