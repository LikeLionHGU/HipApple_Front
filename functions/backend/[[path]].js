// Cloudflare Pages Function: /backend/* 요청을 HTTP 백엔드로 중계하는 프록시.
// 배포 사이트(HTTPS)에서 브라우저가 HTTP 백엔드를 직접 못 부르는(혼합 콘텐츠 차단)
// 문제를 우회한다. 브라우저 → (HTTPS) 우리 도메인/backend/... → (서버에서) HTTP 백엔드.
const BACKEND = 'http://3.34.194.82:8080'

export async function onRequest({ request, params }) {
  const url = new URL(request.url)
  const segments = params.path ? [].concat(params.path) : []
  const target = `${BACKEND}/${segments.join('/')}${url.search}`

  const headers = new Headers(request.headers)
  headers.delete('host')

  const response = await fetch(target, {
    method: request.method,
    headers,
    body: ['GET', 'HEAD'].includes(request.method) ? undefined : request.body,
  })

  return new Response(response.body, response)
}
