"use client";

import Link from "next/link";
import { Lock, Phone } from "lucide-react";

export default function LoginPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-lg space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Aldila</h1>
                    <p className="text-muted-foreground text-sm">আপনার অ্যাকাউন্টে লগইন করুন</p>
                </div>

                <form className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">ফোন নম্বর</label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="tel"
                                placeholder="আপনার ফোন নম্বর"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">পাসওয়ার্ড</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="আপনার পাসওয়ার্ড"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                        লগইন করুন
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    অ্যাকাউন্ট নেই? <Link href="/auth/register" className="text-primary font-bold hover:underline">নিবন্ধন করুন</Link>
                </div>
            </div>
        </div>
    );
}
