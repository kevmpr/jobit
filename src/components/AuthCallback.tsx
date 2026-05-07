import { supabase } from '../lib/supabase';
import { useEffect } from 'react';

export default function AuthCallback() {
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (error) {
          console.error('Auth error:', error.message);
          window.location.href = '/login';
        } else {
          window.location.href = '/';
        }
      });
    } else {
      window.location.href = '/login';
    }
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0a0f1e',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontFamily: 'Geist, system-ui, sans-serif',
      fontSize: 16,
    }}>
      Iniciando sesión...
    </div>
  );
}
