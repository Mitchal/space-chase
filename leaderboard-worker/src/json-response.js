// Every answer is JSON. Boards change by the minute, so nothing is cached unless a route says it may be.
export const json = (body, status, cors, cache = 'no-store') => new Response(JSON.stringify(body), {
  status, headers: { 'content-type': 'application/json', 'cache-control': cache, ...cors },
});
