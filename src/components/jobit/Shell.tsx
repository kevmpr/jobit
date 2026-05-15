import { useState, useEffect, useRef } from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import type { Page } from './types';
import { supabase } from '../../lib/supabase';

const baseNavItems: Array<{ page: Page; icon: string; label: string }> = [
  { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { page: 'ofertas', icon: 'briefcase', label: 'Ofertas' },
  { page: 'contactos', icon: 'users', label: 'Contactos' },
  { page: 'empresas', icon: 'building', label: 'Empresas' },
  { page: 'plataformas', icon: 'link', label: 'Plataformas' },
  { page: 'cvs', icon: 'file', label: 'CVs' },
  { page: 'comparar', icon: 'compare', label: 'Comparar' },
  { page: 'casos', icon: 'award', label: 'Casos' },
];

interface SidebarProps {
  onNewOferta: () => void;
}

export function Sidebar({ onNewOferta }: SidebarProps) {
  const { page, dark, setPage, toggleDark, sidebarOpen, setSidebarOpen } = useApp();

  return (
    <>
      {/* Overlay for mobile — closes sidebar when tapped */}
      <div
        className={`sidebar-overlay${sidebarOpen ? ' sidebar-open' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <aside className={`sidebar${sidebarOpen ? ' sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark">J</div>
          <span className="brand-name">Jobit</span>
        </div>

        <button
          className="sidebar-new-btn"
          onClick={() => {
            onNewOferta();
            setSidebarOpen(false);
          }}
        >
          <Icon name="plus" size={14} stroke="white" />
          Nueva oferta
        </button>

        <nav className="sidebar-nav">
          <div className="nav-section-label">Trabajo</div>
          {baseNavItems.map((item) => (
            <button
              key={item.page}
              className={`nav-item${page === item.page || (page === 'oferta-detail' && item.page === 'ofertas') ? ' active' : ''}`}
              onClick={() => { setPage(item.page); setSidebarOpen(false); }}
            >
              <Icon name={item.icon} size={16} />
              <span style={{ flex: 1 }}>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer" />
      </aside>
    </>
  );
}

const breadcrumbLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  ofertas: 'Mis Ofertas',
  'oferta-detail': 'Detalle',
  comparar: 'Comparar',
  perfil: 'Mi Perfil',
  cvs: 'CVs',
  contactos: 'Contactos',
  empresas: 'Empresas',
  configuracion: 'Configuración',
  casos: 'Casos',
};

export function Topbar() {
  const { page, refreshAll, refreshing, setPage, currentUser, perfil, dark, toggleDark, toggleSidebar } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function handleLogout() {
    supabase.auth.signOut().then(() => { window.location.href = '/login'; });
  }

  // Derive display name: prefer perfil data, fallback to auth metadata
  const perfilName = [perfil?.nombre, perfil?.apellido].filter(Boolean).join(' ').trim();
  const authName = (currentUser?.user_metadata?.['full_name'] as string | undefined)
    ?? (currentUser?.user_metadata?.['name'] as string | undefined)
    ?? currentUser?.email?.split('@')[0]
    ?? 'Usuario';
  const displayName = perfilName || authName;
  const userEmail = currentUser?.email ?? '';

  const initials = displayName
    .split(' ').slice(0, 2)
    .map((w: string) => w[0] ?? '').join('').toUpperCase() || 'U';

  const avatarUrl = perfil?.avatarUrl;

  return (
    <header className="topbar">
      {/* Hamburger — visible only on mobile via CSS */}
      <button
        className="hamburger-btn"
        onClick={toggleSidebar}
        title="Menú"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="breadcrumb">
        <span>Jobit</span>
        <span className="breadcrumb-sep"><Icon name="chevronRight" size={12} /></span>
        <span className="breadcrumb-current">{breadcrumbLabels[page] ?? page}</span>
      </div>

      <div className="topbar-search">
        <span className="topbar-search-icon"><Icon name="search" size={14} /></span>
        <input type="text" placeholder="Buscar ofertas, contactos…" />
        <span className="search-kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button
          className="icon-btn"
          title="Actualizar datos"
          onClick={() => refreshAll()}
          disabled={refreshing}
          style={{ opacity: refreshing ? 0.6 : 1 }}
        >
          <span style={{ display: 'inline-flex', animation: refreshing ? 'spin 1s linear infinite' : 'none' }}>↻</span>
        </button>
        {/* User avatar + name + dropdown */}
        <div ref={menuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            title="Mi cuenta"
            style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '4px 10px 4px 4px', borderRadius: 20,
              border: menuOpen ? '1.5px solid var(--color-brand)' : '1.5px solid var(--border)',
              background: menuOpen ? 'var(--surface-muted)' : 'transparent',
              cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
              flexShrink: 0,
            }}
          >
            <div style={{
              width: 28, height: 28, borderRadius: '50%',
              overflow: 'hidden', flexShrink: 0,
              background: 'var(--surface-muted)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {avatarUrl
                ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', userSelect: 'none' }}>{initials}</span>
              }
            </div>
            <span className="topbar-user-name" style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', userSelect: 'none', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {displayName}
            </span>
            <Icon name="chevronRight" size={12} />
          </button>

          {menuOpen && (
            <div style={{
              position: 'absolute', top: 'calc(100% + 8px)', right: 0,
              width: 220, background: 'var(--surface-raised)',
              border: '1px solid var(--border)', borderRadius: 12,
              boxShadow: 'var(--shadow-elevated)', zIndex: 200,
              overflow: 'hidden',
            }}>
              {/* User info header */}
              <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', overflow: 'hidden',
                    background: 'var(--surface-muted)', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: '1px solid var(--border)',
                  }}>
                    {avatarUrl
                      ? <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-muted)' }}>{initials}</span>
                    }
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--text-subtle)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              <div style={{ padding: '6px 0' }}>
                {([
                  { page: 'perfil' as const, icon: 'user', label: 'Mi perfil' },
                  { page: 'configuracion' as const, icon: 'settings', label: 'Configuración' },
                ] as Array<{ page: Page; icon: string; label: string }>).map((item) => (
                  <button
                    key={item.page}
                    onClick={() => { setPage(item.page); setMenuOpen(false); }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                      padding: '8px 16px', background: 'none', border: 'none',
                      cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                      textAlign: 'left', transition: 'background 0.1s',
                    }}
                    onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'; }}
                    onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                  >
                    <Icon name={item.icon} size={15} />
                    {item.label}
                  </button>
                ))}

                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

                {/* Notificaciones */}
                <button
                  onClick={() => { setPage('configuracion'); setMenuOpen(false); }}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <Icon name="bell" size={15} />
                  Notificaciones
                </button>

                {/* Modo oscuro / claro */}
                <button
                  onClick={toggleDark}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13, color: 'var(--text)',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--surface-muted)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Icon name={dark ? 'sun' : 'moon'} size={15} />
                    {dark ? 'Modo claro' : 'Modo oscuro'}
                  </span>
                  <div className={`toggle-switch${dark ? ' on' : ''}`} style={{ pointerEvents: 'none' }}>
                    <div className="toggle-thumb" />
                  </div>
                </button>

                <div style={{ borderTop: '1px solid var(--border)', margin: '6px 0' }} />

                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', background: 'none', border: 'none',
                    cursor: 'pointer', fontSize: 13, color: 'var(--color-danger)',
                    textAlign: 'left', transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--color-danger-soft)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'none'; }}
                >
                  <Icon name="logout" size={15} />
                  Cerrar sesión
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
