"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { User, Share2, Download, Settings, LogOut, Users, UserPlus, Gift, FileText, CreditCard, Star, Award } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

export default function ProfilePage() {
    const { user, userData, loading, logout } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    // Use Firestore data for active status
    const hasActivePlan = userData?.isActive || false;

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Listen for PWA install prompt
    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
            setIsInstallable(true);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            showToast("অ্যাপ ইতিমধ্যে ইনস্টল করা আছে", "info");
            return;
        }

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            showToast("অ্যাপ ইনস্টল হচ্ছে...", "success");
            setIsInstallable(false);
        }

        setDeferredPrompt(null);
    };

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const confirmLogout = async () => {
        try {
            await logout();
            showToast("সফলভাবে লগআউট হয়েছে", "success");
            router.push("/login");
        } catch (error) {
            showToast("লগআউট ব্যর্থ হয়েছে", "error");
        }
    };

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    // If not authenticated, don't render (will redirect)
    if (!user || !userData) {
        return null;
    }

    return (
        <div className="pb-20">
            {/* Header Profile Info */}
            <div className="bg-card p-6 rounded-b-3xl shadow-lg border-b border-border">
                <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center border-4 border-background">
                            <User className="w-10 h-10 text-primary-foreground" />
                        </div>
                        {/* Active User Badge */}
                        {hasActivePlan && (
                            <div className="absolute -bottom-2 -right-2 bg-primary rounded-full p-1.5 border-2 border-background">
                                <Award className="w-4 h-4 text-primary-foreground" />
                            </div>
                        )}
                    </div>
                    <div className="text-center">
                        <div className="flex items-center gap-2 justify-center">
                            <h2 className="text-xl font-bold">ফোন : {userData.phoneNumber}</h2>
                            {hasActivePlan && (
                                <span className="bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded-full font-bold">
                                    Active
                                </span>
                            )}
                        </div>
                        <p className="text-muted-foreground text-sm">আইডি: {userData.userId}</p>
                    </div>
                </div>
            </div>

            <div className="p-4 space-y-6 -mt-4">
                {/* Balance Card */}
                <div className="bg-card p-6 rounded-xl border border-border shadow-sm text-center space-y-2">
                    <h3 className="text-muted-foreground">অ্যাকাউন্ট ব্যালেন্স</h3>
                    <div className="text-3xl font-bold text-primary">৳{userData.balance.toFixed(2)}</div>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-4">
                    <Link href="/recharge" className="bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm transition-all duration-300 hover:opacity-90 hover:scale-105 hover:shadow-[0_0_15px_rgba(132,204,22,0.5)] flex items-center justify-center">
                        রিচার্জ
                    </Link>
                    <Link href="/withdraw" className="bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm transition-all duration-300 hover:opacity-90 hover:scale-105 hover:shadow-[0_0_15px_rgba(132,204,22,0.5)] flex items-center justify-center">
                        উত্তোলন
                    </Link>
                    <Link href="/history" className="bg-primary text-primary-foreground font-bold py-3 rounded-lg text-sm transition-all duration-300 hover:opacity-90 hover:scale-105 hover:shadow-[0_0_15px_rgba(132,204,22,0.5)] flex items-center justify-center">
                        হিস্ট্রি
                    </Link>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-3 gap-3">
                    <button
                        onClick={handleInstallClick}
                        className="flex flex-col items-center justify-center p-4 gap-2 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-[0_0_15px_rgba(132,204,22,0.2)] transition-all duration-300 group"
                    >
                        <Download className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-medium group-hover:text-primary transition-colors">অ্যাপ</span>
                    </button>
                    {[
                        { name: "রেফার", icon: Users, href: "/refer" },
                        { name: "আমন্ত্রণ", icon: UserPlus, href: "/refer" },
                        { name: "বোনাস", icon: Gift, href: "/products" },
                        { name: "বিবরণী", icon: FileText, href: "/history" },
                        { name: "প্ল্যান লেভেল", icon: Star, href: "/plan" },
                    ].map((item, i) => (
                        <Link key={i} href={item.href} className="flex flex-col items-center justify-center p-4 gap-2 bg-card rounded-xl border border-border hover:border-primary/50 hover:shadow-[0_0_15px_rgba(132,204,22,0.2)] transition-all duration-300 group">
                            <item.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-medium group-hover:text-primary transition-colors">{item.name}</span>
                        </Link>
                    ))}
                </div>

                {/* Admin Panel Button (if user is admin) */}
                {userData?.isAdmin && (
                    <Link
                        href="/aldilaadmin"
                        className="w-full bg-primary/20 text-primary border border-primary/30 font-bold py-3 rounded-xl hover:bg-primary/30 transition-colors flex items-center justify-center gap-2"
                    >
                        <Settings className="w-5 h-5" />
                        অ্যাডমিন প্যানেল
                    </Link>
                )}

                {/* Logout Button */}
                <button
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 text-red-500 border border-red-500/20 font-bold py-3 rounded-xl hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2"
                >
                    <LogOut className="w-5 h-5" />
                    লগআউট
                </button>
            </div>


            {/* Logout Confirmation Modal */}
            {
                showLogoutConfirm && (
                    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 space-y-6 animate-in fade-in zoom-in duration-200">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <LogOut className="w-8 h-8 text-red-500" />
                                </div>
                                <h3 className="text-xl font-bold">লগআউট করতে চান?</h3>
                                <p className="text-muted-foreground">আপনি কি নিশ্চিত যে আপনি আপনার অ্যাকাউন্ট থেকে লগআউট করতে চান?</p>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <button
                                    onClick={() => setShowLogoutConfirm(false)}
                                    className="px-4 py-3 rounded-xl font-bold border border-border hover:bg-muted transition-colors"
                                >
                                    বাতিল
                                </button>
                                <button
                                    onClick={confirmLogout}
                                    className="px-4 py-3 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 transition-colors"
                                >
                                    লগআউট
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
