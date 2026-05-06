import React from 'react';
import { Icon } from './icons';
import { useApp } from './store';
import type { Page } from './types';
import { supabase } from '../../lib/supabase';

const navItems: Array<{ page: Page; icon: string; label: string; badge?: string }> = [
  { page: 'dashboard', icon: 'dashboard', label: 'Dashboard' },
  { page: 'ofertas', icon: 'briefcase', label: 'Ofertas', badge: '12' },
  { page: 'contactos', icon: 'users', label: 'Contactos' },
  { page: 'empresas', icon: 'building', label: 'Empresas' },
  { page: 'cvs', icon: 'file', label: 'CVs' },
  { page: 'comparar', icon: 'compare', label: 'Comparar' },
  { page: 'notas', icon: 'note', label: 'Notas' },
];

const accountItems: Array<{ page: Page; icon: string; label: string }> = [
  { page: 'perfil', icon: 'user', label: 'Mi perfil' },
  { page: 'configuracion', icon: 'settings', label: 'Configuración' },
];

interface SidebarProps {
  onNewOferta: () => void;
}

export function Sidebar({ onNewOferta }: SidebarProps) {
  const { page, dark, setPage, toggleDark, currentUser } = useApp();

  function handleLogout() {
    supabase.auth.signOut().then(() => {
      window.location.href = '/login';
    });
  }

  const userDisplayName = currentUser?.user_metadata?.['full_name'] as string | undefined
    ?? currentUser?.user_metadata?.['name'] as string | undefined
    ?? currentUser?.email?.split('@')[0]
    ?? 'Usuario';

  const userInitials = userDisplayName
    .split(' ')
    .slice(0, 2)
    .map((w: string) => w[0] ?? '')
    .join('')
    .toUpperCase() || 'U';

  const userEmail = currentUser?.email ?? '';

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">J</div>
        <span className="brand-name">Jobit</span>
      </div>

      <button className="sidebar-new-btn" onClick={onNewOferta}>
        <Icon name="plus" size={14} stroke="white" />
        Nueva oferta
      </button>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Trabajo</div>
        {navItems.map((item) => (
          <button
            key={item.page}
            className={`nav-item${page === item.page || (page === 'oferta-detail' && item.page === 'ofertas') ? ' active' : ''}`}
            onClick={() => setPage(item.page)}
          >
            <Icon name={item.icon} size={16} />
            <span style={{ flex: 1 }}>{item.label}</span>
            {item.badge && <span className="nav-badge">{item.badge}</span>}
          </button>
        ))}

        <div className="nav-section-label" style={{ marginTop: 12 }}>Cuenta</div>
        {accountItems.map((item) => (
          <button
            key={item.page}
            className={`nav-item${page === item.page ? ' active' : ''}`}
            onClick={() => setPage(item.page)}
          >
            <Icon name={item.icon} size={16} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button className="dark-toggle" onClick={toggleDark}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name={dark ? 'sun' : 'moon'} size={15} />
            <span>{dark ? 'Modo claro' : 'Modo oscuro'}</span>
          </span>
          <div className={`toggle-switch${dark ? ' on' : ''}`}>
            <div className="toggle-thumb" />
          </div>
        </button>
        <div className="user-card" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="user-avatar">{userInitials}</div>
          <div className="user-info" style={{ flex: 1, minWidth: 0 }}>
            <div className="user-name" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userDisplayName}</div>
            <div className="user-role" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
          </div>
          <button
            onClick={handleLogout}
            title="Cerrar sesión"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-subtle)',
              display: 'flex',
              alignItems: 'center',
              padding: '4px',
              borderRadius: 6,
              flexShrink: 0,
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--color-danger)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-subtle)'; }}
          >
            <Icon name="logout" size={15} />
          </button>
        </div>
      </div>
    </aside>
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
  notas: 'Notas',
  configuracion: 'Configuración',
};

export function Topbar() {
  const { page } = useApp();

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Jobit</span>
        <span className="breadcrumb-sep">
          <Icon name="chevronRight" size={12} />
        </span>
        <span className="breadcrumb-current">{breadcrumbLabels[page] ?? page}</span>
      </div>

      <div className="topbar-search">
        <span className="topbar-search-icon">
          <Icon name="search" size={14} />
        </span>
        <input type="text" placeholder="Buscar ofertas, contactos…" />
        <span className="search-kbd">⌘K</span>
      </div>

      <div className="topbar-actions">
        <button className="icon-btn">
          <Icon name="bell" size={16} />
        </button>
      </div>
    </header>
  );
}
