/** Keep old booking links working while the full section lives on /podcast. */
export function GET(request: Request) {
  const destination = new URL('/podcast', request.url)
  destination.hash = 'on-your-show'
  return new Response(null, {
    status: 301,
    headers: { Location: destination.toString() },
  })
}
