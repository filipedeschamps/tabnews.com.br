export async function GET(request) {
  return new Response(JSON.stringify({ timestamp: Date.now() }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
