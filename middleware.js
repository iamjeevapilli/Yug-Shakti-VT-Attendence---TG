export const config = {
  matcher: '/(.*)',
};

export default function middleware(req) {
  const userAgent = req.headers.get('user-agent') || '';
  const isBot = /WhatsApp|TelegramBot|facebookexternalhit|Twitterbot|LinkedInBot|Discordbot/i.test(userAgent);

  if (isBot) {
    return new Response(null, {
      status: 200,
      headers: { 'x-middleware-next': '1' }
    });
  }

  const basicAuth = req.headers.get('authorization');

  if (basicAuth) {
    const authValue = basicAuth.split(' ')[1];
    const [user, pwd] = atob(authValue).split(':');

    if (user === 'admin' && pwd === 'ystgvc') {
      return new Response(null, {
        status: 200,
        headers: { 'x-middleware-next': '1' }
      });
    }
  }

  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}
