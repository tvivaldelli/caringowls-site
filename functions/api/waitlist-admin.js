export async function onRequestGet(context) {
  const { env } = context;
  const url = new URL(context.request.url);
  const key = url.searchParams.get("key");

  if (!key || key !== env.ADMIN_SECRET) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const { results } = await env.DB.prepare(
      "SELECT * FROM waitlist ORDER BY created_at DESC"
    ).all();

    return Response.json({
      count: results.length,
      submissions: results,
    });
  } catch (err) {
    console.error("Admin query error:", err);
    return Response.json(
      { error: "Failed to fetch submissions" },
      { status: 500 }
    );
  }
}
