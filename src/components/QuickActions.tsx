"use client";

import { Coins, Wallet, UserPlus, Send } from "lucide-react";
import Link from "next/link";

export function QuickActions() {
    const actions = [
        { name: "রিচার্জ", icon: Coins, href: "/recharge" },
        { name: "উইথড্র", icon: Wallet, href: "/withdraw" },
        { name: "আমন্ত্রণ", icon: UserPlus, href: "/refer" },
        { name: "টেলিগ্রাম", icon: Send, href: "https://t.me/aldilaplatform" },
    ];

    return (
        <div className="grid grid-cols-4 gap-3">
            {actions.map((action) => (
                <Link
                    key={action.name}
                    href={action.href}
                    className="flex flex-col items-center justify-center gap-2 bg-card p-3 rounded-xl border border-border shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(132,204,22,0.3)] hover:border-primary/50 group"
                >
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                        <action.icon className="w-5 h-5 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[10px] font-bold text-muted-foreground group-hover:text-primary transition-colors">
                        {action.name}
                    </span>
                </Link>
            ))}
        </div>
    );
}
