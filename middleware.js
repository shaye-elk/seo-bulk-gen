// Vercel Edge Middleware — password-protects the entire app
// Set ACCESS_PASSWORD in your Vercel environment variables

export const config = {
  matcher: ['/', '/index.html', '/api/:path*'],
};

export default function middleware(request) {
  const password = process.env.ACCESS_PASSWORD;
  // If no password configured, allow all access (dev mode)
  if (!password) return;

  const url = new URL(request.url);

  // Allow the auth endpoint through
  if (url.pathname === '/api/auth') return;

  // Check for auth cookie
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/seo_access=([^;]+)/);
  if (match && match[1] === password) return;

  // For API calls, return 401
  if (url.pathname.startsWith('/api/')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // For page requests, show login form
  return new Response(loginPage(), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function loginPage() {
  return `<!DOCTYPE html>
<html lang="en"><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Access Required</title>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#0e0f14; color:#e2e4ed; font-family:'Inter',sans-serif; display:flex; align-items:center; justify-content:center; min-height:100vh; }
  .gate { text-align:center; max-width:360px; padding:20px; }
  .gate h1 { font-size:22px; font-weight:700; margin-bottom:6px; }
  .gate p { font-size:13px; color:#6b7084; margin-bottom:24px; }
  .gate input { width:100%; padding:12px 16px; background:#16181f; border:1px solid #2a2d3a; border-radius:8px; color:#e2e4ed; font-size:14px; outline:none; margin-bottom:12px; }
  .gate input:focus { border-color:#7c6bf5; }
  .gate button { width:100%; padding:12px; background:#7c6bf5; color:#fff; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; }
  .gate button:hover { background:#6b5ae0; }
  .gate .err { color:#f87171; font-size:12px; margin-top:8px; display:none; }
</style></head><body>
<div class="gate">
  <h1>🔒 Access Required</h1>
  <p>This tool is private. Enter the access code to continue.</p>
  <form onsubmit="return tryAuth(event)">
    <input type="password" id="pw" placeholder="Access code" autofocus>
    <button type="submit">Enter</button>
  </form>
  <div class="err" id="err">Incorrect access code.</div>
</div>
<script>
async function tryAuth(e) {
  e.preventDefault();
  const pw = document.getElementById('pw').value;
  const res = await fetch('/api/auth', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({password:pw}) });
  if (res.ok) {
    document.cookie = 'seo_access=' + pw + ';path=/;max-age=86400;SameSite=Strict';
    location.reload();
  } else {
    document.getElementById('err').style.display = 'block';
  }
  return false;
}
</script></body></html>`;
}
