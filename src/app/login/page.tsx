"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, loading } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [rememberMe, setRememberMe] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!loading && user) {
            router.push("/");
        }
    }, [user, loading, router]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!phoneNumber || !password) {
            showToast("সব তথ্য পূরণ করুন", "error");
            return;
        }

        if (phoneNumber.length < 11) {
            showToast("সঠিক ফোন নম্বর দিন", "error");
            return;
        }

        setLoginLoading(true);

        try {
            // Convert phone to email format for Firebase
            const email = `${phoneNumber}@aldila.com`;
            const userCredential = await signInWithEmailAndPassword(auth, email, password);

            // Check if user is banned
            const { getDoc, doc } = await import("firebase/firestore");
            const { db } = await import("@/lib/firebase");
            const userDoc = await getDoc(doc(db, "users", userCredential.user.uid));

            if (userDoc.exists() && userDoc.data().isBanned) {
                // User is banned, sign them out immediately
                await auth.signOut();
                showToast("আপনার অ্যাকাউন্ট ব্যান করা হয়েছে। সাপোর্টে যোগাযোগ করুন।", "error");
                setLoginLoading(false);
                return;
            }

            showToast("সফলভাবে লগইন হয়েছে!", "success");
            router.push("/");
        } catch (error: any) {
            console.error("Login error:", error);
            if (error.code === "auth/user-not-found") {
                showToast("ব্যবহারকারী খুঁজে পাওয়া যায়নি", "error");
            } else if (error.code === "auth/wrong-password") {
                showToast("ভুল পাসওয়ার্ড", "error");
            } else {
                showToast("লগইন ব্যর্থ হয়েছে", "error");
            }
        } finally {
            setLoginLoading(false);
        }
    };

    // Show loading while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }


    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <div className="flex justify-center mb-4">
                        <Image
                            src="/logo-white.png"
                            alt="Aldila Logo"
                            width={250}
                            height={250}
                            className="object-contain"
                        />
                    </div>
                    <p className="text-sm text-gray-400">লগইন সিস্টেম - সাইন-ইন নির্বাচন</p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleLogin} className="bg-[#2a4444]/50 backdrop-blur-sm p-6 rounded-xl border border-[#3a5555] space-y-4">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">মোবাইল নাম্বার</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="আপনার মোবাইল নাম্বার দিন"
                            className="w-full bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">পাসওয়ার্ড</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="আপনার পাসওয়ার্ড দিন"
                                className="w-full bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="remember"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-[#3a5555] bg-[#1a2f2f] text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <label htmlFor="remember" className="text-sm text-gray-300">
                            আমাকে মনে রাখো
                        </label>
                    </div>

                    {/* Login Button */}
                    <button
                        type="submit"
                        disabled={loginLoading}
                        className="w-full bg-primary hover:opacity-90 text-black font-bold py-3 rounded-lg transition-opacity disabled:opacity-50"
                    >
                        {loginLoading ? "লগইন হচ্ছে..." : "লগইন করুন"}
                    </button>

                    {/* Terms */}
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="terms"
                            className="mt-1 w-4 h-4 rounded border-[#3a5555] bg-[#1a2f2f] text-primary focus:ring-primary focus:ring-offset-0"
                            defaultChecked
                        />
                        <label htmlFor="terms" className="text-xs text-gray-400">
                            আমি সম্পূর্ণভাবে ব্যবহারকারীর শর্তাবলী মেনে চলবো
                        </label>
                    </div>

                    {/* Register Link */}
                    <div className="text-center pt-4">
                        <Link href="/register" className="text-sm text-primary hover:underline">
                            অ্যাকাউন্ট তৈরি করুন আমাদের নিবন্ধন করুন
                        </Link>
                    </div>

                    {/* Telegram Support */}
                    <div className="text-center pt-2">
                        <a
                            href="https://t.me/aldilaplatform"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition-colors"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
                            </svg>
                            <span>সাপোর্ট - Telegram</span>
                        </a>
                    </div>
                </form>
            </div>
        </div>
    );
}
