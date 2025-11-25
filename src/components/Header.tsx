"use client";

import { UserCircle } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export function Header() {
    return (
        <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-sm border-b border-border px-4 py-3 flex items-center justify-between">
            {/* Left: Logo */}
            <Link href="/" className="flex items-center">
                <Image
                    src="/logo-white.png"
                    alt="Aldila Logo"
                    width={160}
                    height={160}
                    className="object-contain"
                />
            </Link>

            {/* Right: Profile Icon */}
            <Link href="/profile" className="text-muted-foreground hover:text-primary transition-colors">
                <UserCircle className="w-8 h-8" />
            </Link>
        </header>
    );
}
