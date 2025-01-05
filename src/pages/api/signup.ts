import type { APIRoute } from "astro";
import { Client } from "@notionhq/client";

const notion = new Client({
  auth: import.meta.env.NOTION_TOKEN,
});

const DATABASE_ID = import.meta.env.NOTION_DATABASE_ID;

export const post: APIRoute = async ({ request }) => {
  try {
    const data = await request.json();

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

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    });
  }
};
