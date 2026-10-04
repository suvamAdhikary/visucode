'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signIn, signOut } from 'next-auth/react';
import { useSafeSession } from '../../../lib/hooks/useSafeSession';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/learn', label: 'Learn', icon: '📚' },
    { href: '/problems', label: 'Problems', icon: '💡' },
    { href: '/patterns', label: 'Patterns', icon: '🧩' },
    { href: '/playground', label: 'Playground', icon: '🎮' },
    { href: '/profile', label: 'Profile', icon: '👤' },
];

export function Navbar() {
    const pathname = usePathname();
    const { data: session, status } = useSafeSession();

    return (
        <nav className="navbar" role="navigation" aria-label="Main navigation">
            <Link href="/" className="navbar-logo">
                <span className="navbar-logo-icon" aria-hidden="true">
                    ▶
                </span>
                <span>
                    Visu<strong>Code</strong>
                </span>
            </Link>

            <ul className="navbar-links">
                {navLinks.map((link) => (
                    <li key={link.href}>
                        <Link
                            href={link.href}
                            className={`navbar-link ${pathname?.startsWith(link.href) ? 'active' : ''
                                }`}
                        >
                            <span className={styles.navIcon} aria-hidden="true">
                                {link.icon}
                            </span>
                            {link.label}
                        </Link>
                    </li>
                ))}
            </ul>

            <div className="navbar-actions">
                {status === 'authenticated' && session?.user ? (
                    <div className={styles.authContainer} data-testid="navbar-user-session">
                        <Link
                            href="/profile"
                            className={styles.userProfileLink}
                            title={`Signed in as ${session.user.name || session.user.email || 'User'}`}
                            id="nav-user-profile"
                        >
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt={session.user.name || 'User avatar'}
                                    className={styles.userAvatar}
                                />
                            ) : (
                                <span className={styles.avatarPlaceholder} aria-hidden="true">
                                    {(session.user.name?.[0] || session.user.email?.[0] || 'U').toUpperCase()}
                                </span>
                            )}
                            <span className={styles.userName}>
                                {session.user.name?.split(' ')[0] || session.user.email?.split('@')[0] || 'User'}
                            </span>
                        </Link>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => signOut({ callbackUrl: '/' })}
                            id="nav-auth-signout"
                            aria-label="Sign out"
                        >
                            Sign Out
                        </button>
                    </div>
                ) : (
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => signIn()}
                        id="nav-auth-signin"
                        aria-label="Sign in"
                    >
                        Sign In
                    </button>
                )}

                <Link href="/learn" className="btn btn-primary" id="nav-cta-start">
                    Start Learning
                </Link>
            </div>
        </nav>
    );
}
