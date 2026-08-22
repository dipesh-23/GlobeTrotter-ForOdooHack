/**
 * AppShell — top nav + page wrapper for every protected route
 * Contract: COMPONENT_CONTRACTS.md §AppShell
 * Export: named only (never default)
 *
 * Usage (in App.jsx — wrap each Protected route):
 *   import { AppShell } from '../components/AppShell'
 *   <AppShell><Dashboard /></AppShell>
 *
 * Contract guarantees:
 *   - Fixed top nav: logo (left) + nav links (right) + user area
 *   - Reads useAuth() internally — pages never pass user as prop
 *   - "Log out" calls supabase.auth.signOut() then redirects to /login
 *   - main content: max-width 1120px, centered, padding, 64px nav offset
 *   - Mobile: hamburger collapses nav links
 */

import { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Globe } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabaseClient';

const NAV_LINKS = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/trips',     label: 'My Trips'  },
];

export function AppShell({ children }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const navRef = useRef(null);

  // ── Close mobile menu on route change ───────────────────────
  useEffect(() => {
    setMobileOpen(false);
  }, []);

  // ── Close mobile menu when clicking outside ──────────────────
  useEffect(() => {
    if (!mobileOpen) return;
    function handleClickOutside(e) {
      if (navRef.current && !navRef.current.contains(e.target)) {
        setMobileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileOpen]);

  // ── Log out ──────────────────────────────────────────────────
  async function handleLogOut() {
    await supabase.auth.signOut();
    navigate('/login', { replace: true });
  }

  // ── Display name: prefer display_name, fall back to email prefix ──
  const displayName = user?.user_metadata?.display_name
    ?? user?.email?.split('@')[0]
    ?? 'Traveller';

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      {/* ── Top nav ── */}
      <header
        ref={navRef}
        className="
          fixed top-0 left-0 right-0 z-40
          h-16
          bg-[var(--color-surface)]
          border-b border-[var(--color-border)]
        "
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="
            h-full mx-auto flex items-center justify-between
            px-4 md:px-6
          "
          style={{ maxWidth: 1120 }}
        >
          {/* Logo */}
          <NavLink
            to="/dashboard"
            className="flex items-center gap-2 text-[var(--color-route)] no-underline"
            style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 600 }}
            aria-label="GlobeTrotter — go to dashboard"
          >
            <Globe size={22} strokeWidth={2} aria-hidden="true" />
            GlobeTrotter
          </NavLink>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Main navigation">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    'text-body font-medium no-underline transition-colors duration-150',
                    isActive
                      ? 'text-[var(--color-route)]'
                      : 'text-[var(--color-muted)] hover:text-[var(--color-ink)]',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Desktop user area */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-2 text-small text-[var(--color-muted)]">
              <User size={15} aria-hidden="true" />
              <span>{displayName}</span>
            </div>
            <button
              type="button"
              onClick={handleLogOut}
              aria-label="Log out"
              className="
                flex items-center gap-1.5
                text-small font-medium
                text-[var(--color-muted)]
                hover:text-[var(--color-danger)]
                transition-colors duration-150
                cursor-pointer
                px-3 py-1.5
                rounded-[var(--radius-sm)]
                border border-[var(--color-border)]
                hover:border-[var(--color-danger)]
              "
            >
              <LogOut size={14} aria-hidden="true" />
              Log out
            </button>
          </div>

          {/* Mobile hamburger */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            className="
              md:hidden
              p-2 rounded-[var(--radius-sm)]
              text-[var(--color-ink)]
              hover:bg-[var(--color-border)] hover:bg-opacity-50
              transition-colors duration-150
              cursor-pointer
            "
          >
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileOpen && (
          <nav
            id="mobile-nav"
            aria-label="Mobile navigation"
            className="
              md:hidden
              bg-[var(--color-surface)]
              border-t border-[var(--color-border)]
              px-4 py-3
              flex flex-col gap-2
            "
            style={{ animation: 'gt-nav-in 0.15s ease both' }}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  [
                    'text-body font-medium no-underline px-3 py-2 rounded-[var(--radius-sm)] transition-colors duration-150',
                    isActive
                      ? 'text-[var(--color-route)] bg-[rgba(196,98,45,0.08)]'
                      : 'text-[var(--color-ink)] hover:bg-[var(--color-border)] hover:bg-opacity-40',
                  ].join(' ')
                }
              >
                {label}
              </NavLink>
            ))}

            {/* User + log out in mobile menu */}
            <div className="mt-2 pt-2 border-t border-[var(--color-border)] flex flex-col gap-2">
              <div className="flex items-center gap-2 px-3 text-small text-[var(--color-muted)]">
                <User size={14} />
                <span>{displayName}</span>
              </div>
              <button
                type="button"
                onClick={handleLogOut}
                className="
                  flex items-center gap-2
                  px-3 py-2
                  text-body font-medium
                  text-[var(--color-danger)]
                  hover:bg-[rgba(179,69,46,0.08)]
                  rounded-[var(--radius-sm)]
                  transition-colors duration-150
                  cursor-pointer
                  text-left
                "
              >
                <LogOut size={15} />
                Log out
              </button>
            </div>
          </nav>
        )}
      </header>

      {/* ── Page content ── */}
      <main
        className="mx-auto px-4 md:px-6 py-8"
        style={{
          maxWidth: 1120,
          paddingTop: `calc(64px + var(--spacing-xl))`,   /* 64px nav + 40px top breathing room */
        }}
      >
        {children}
      </main>

      {/* Mobile nav animation */}
      <style>{`
        @keyframes gt-nav-in {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
