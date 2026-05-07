import { createServerClient, parseCookieHeader } from '@supabase/ssr';
import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
  const supabase = createServerClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return parseCookieHeader(context.request.headers.get('Cookie') ?? '');
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            context.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired — this sets updated cookies in the response
  const { data: { session } } = await supabase.auth.getSession();
  context.locals.session = session;
  context.locals.supabase = supabase;

  return next();
});
