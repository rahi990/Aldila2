"use client";

import Link from "next/link";
import { Lock, Phone, UserPlus } from "lucide-react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
            <div className="w-full max-w-md bg-card p-8 rounded-2xl border border-border shadow-lg space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold">Aldila</h1>
                    <p className="text-muted-foreground text-sm">নতুন অ্যাকাউন্ট তৈরি করুন</p>
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
                                placeholder="একটি পাসওয়ার্ড দিন"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">কনফার্ম পাসওয়ার্ড</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="password"
                                placeholder="পুনরায় লিখুন"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">রেফার কোড</label>
                        <div className="relative">
                            <UserPlus className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="যদি থাকে"
                                className="w-full bg-muted border border-border rounded-lg py-2.5 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="terms" className="rounded border-gray-300 text-primary focus:ring-primary" />
                        <label htmlFor="terms" className="text-xs text-muted-foreground">আমি ব্যবহারকারী চুক্তিতে সম্মত আছি।</label>
                    </div>

                    <button className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg hover:opacity-90 transition-opacity">
                        নিবন্ধন করুন
                    </button>
                </form>

                <div className="text-center text-sm text-muted-foreground">
                    আপনার কি অ্যাকাউন্ট আছে? <Link href="/auth/login" className="text-primary font-bold hover:underline">লগইন করুন</Link>
                </div>
            </div>
        </div>
    );
}
