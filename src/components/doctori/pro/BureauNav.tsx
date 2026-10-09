'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeftRight,
  Banknote,
  Bell,
  CalendarDays,
  ChevronDown,
  FileText,
  Home,
  LayoutDashboard,
  ListOrdered,
  LogOut,
  Settings2,
  Stethoscope,
  UserRound,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import './bureau-nav.scss';

export interface NavItem {
  id: string;
  label: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

const ITEM_ICON: Record<string, LucideIcon> = {
  board: LayoutDashboard,
  agenda: CalendarDays,
  patients: Users,
  billing: Wallet,
  facturation: Wallet,
  documents: FileText,
  salle: Home,
  rappels: Bell,
  attente: ListOrdered,
  caisse: Banknote,
  profil: UserRound,
};

const GROUP_ICON: Record<string, LucideIcon> = {
  Cabinet: Home,
  Accueil: Home,
  Planning: CalendarDays,
  Gestion: Settings2,
};

function desktop() {
  return typeof window !== 'undefined' && window.matchMedia('(min-width: 992px)').matches;
}

export function BureauNav({
  who,
  groups,
  active,
  onSelect,
  switchLabel,
  onSwitch,
  onLogout,
  onProfile,
}: {
  who: string;
  groups: NavGroup[];
  active: string;
  onSelect: (id: string) => void;
  switchLabel: string;
  onSwitch: () => void;
  onLogout: () => void;
  onProfile?: () => void;
}) {
  const [open, setOpen] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const bar = useRef<HTMLElement>(null);
  const closer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function onDoc(event: MouseEvent) {
      if (!bar.current?.contains(event.target as Node)) setOpen(null);
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  function cancelClose() {
    if (closer.current) clearTimeout(closer.current);
    closer.current = null;
  }

  function enter(id: string) {
    if (!desktop()) return;
    cancelClose();
    setOpen(id);
  }

  function leave() {
    if (!desktop()) return;
    cancelClose();
    closer.current = setTimeout(() => setOpen(null), 140);
  }

  function choose(id: string) {
    onSelect(id);
    setOpen(null);
    setExpanded(false);
  }

  return (
    <nav ref={bar} className="navbar navbar-expand-lg navbar-dark sticky-top doctori-nav">
      <div className="container-xxl">
        <Link href="/" className="navbar-brand">
          <Stethoscope size={20} />
          Doctori
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          aria-expanded={expanded}
          aria-label="Ouvrir le menu"
          onClick={() => setExpanded((current) => !current)}
        >
          <span className="navbar-toggler-icon" />
        </button>
        <div className={`collapse navbar-collapse ${expanded ? 'show' : ''}`}>
          <ul className="navbar-nav">
            {groups.map((group) => {
              const current = group.items.some((item) => item.id === active);
              const GroupIcon = GROUP_ICON[group.label] ?? LayoutDashboard;
              const shown = open === group.label;
              return (
                <li
                  key={group.label}
                  className={`nav-item dropdown ${shown ? 'show' : ''}`}
                  onMouseEnter={() => enter(group.label)}
                  onMouseLeave={leave}
                >
                  <button
                    type="button"
                    className={`nav-link dropdown-toggle ${current ? 'active' : ''} ${shown ? 'show' : ''}`}
                    aria-expanded={shown}
                    onClick={() => setOpen((value) => (desktop() ? group.label : value === group.label ? null : group.label))}
                  >
                    <GroupIcon size={16} />
                    {group.label}
                    <ChevronDown className="caret" size={14} />
                  </button>
                  <ul className={`dropdown-menu ${shown ? 'show' : ''}`}>
                    {group.items.map((item) => {
                      const Icon = ITEM_ICON[item.id] ?? FileText;
                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className={`dropdown-item ${active === item.id ? 'active' : ''}`}
                            onClick={() => choose(item.id)}
                          >
                            <span className="glyph">
                              <Icon size={15} />
                            </span>
                            {item.label}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
          <div className="doctori-nav-end">
            <button type="button" className="btn-switch" onClick={onSwitch}>
              <ArrowLeftRight size={16} />
              {switchLabel}
            </button>
            <div
              className={`nav-item dropdown ${open === 'compte' ? 'show' : ''}`}
              onMouseEnter={() => enter('compte')}
              onMouseLeave={leave}
            >
              <button
                type="button"
                className={`nav-link dropdown-toggle who-link ${open === 'compte' ? 'show' : ''}`}
                aria-expanded={open === 'compte'}
                onClick={() => setOpen((value) => (desktop() ? 'compte' : value === 'compte' ? null : 'compte'))}
              >
                <UserRound size={16} />
                {who}
                <ChevronDown className="caret" size={14} />
              </button>
              <ul className={`dropdown-menu dropdown-menu-end ${open === 'compte' ? 'show' : ''}`}>
                {onProfile ? (
                  <li>
                    <button
                      type="button"
                      className="dropdown-item"
                      onClick={() => {
                        onProfile();
                        setOpen(null);
                      }}
                    >
                      <span className="glyph">
                        <UserRound size={15} />
                      </span>
                      Mon profil
                    </button>
                  </li>
                ) : null}
                <li>
                  <button type="button" className="dropdown-item dropdown-item-danger" onClick={onLogout}>
                    <span className="glyph">
                      <LogOut size={15} />
                    </span>
                    Sortir
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
