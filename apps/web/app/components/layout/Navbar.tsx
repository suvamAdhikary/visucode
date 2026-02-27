'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Navbar.module.css';

const navLinks = [
    { href: '/learn', label: 'Learn', icon: '📚' },
    { href: '/problems', label: 'Problems', icon: '💡' },
    { href: '/patterns', label: 'Patterns', icon: '🧩' },
    { href: '/playground', label: 'Playground', icon: '🎮' },
];

export function Navbar() {
    const pathname = usePathname();

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
                <Link href="/learn" className="btn btn-primary" id="nav-cta-start">
                    Start Learning
                </Link>
            </div>
        </nav>
    );
}
