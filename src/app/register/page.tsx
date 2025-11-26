"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, getDoc, updateDoc, arrayUnion, increment, collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, RefreshCw } from "lucide-react";

function RegisterPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { showToast } = useToast();
    const { user, loading: authLoading, refreshUserData } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [referrerCode, setReferrerCode] = useState("");

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    // Redirect if already logged in
    useEffect(() => {
        if (!authLoading && user) {
            router.push("/");
        }
    }, [user, authLoading, router]);

    // Check for referral code in URL
    useEffect(() => {
        const refCode = searchParams.get("ref");
        if (refCode) {
            setReferrerCode(refCode);
        }
    }, [searchParams]);



    // Generate unique referral code
    const generateReferralCode = () => {
        return "USER" + Math.random().toString(36).substring(2, 10).toUpperCase();
    };

    // Find user by referral code
    const findUserByReferralCode = async (code: string) => {
        try {
            const usersRef = collection(db, "users");
            const q = query(usersRef, where("referralCode", "==", code));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                return {
                    uid: querySnapshot.docs[0].id,
                    data: querySnapshot.docs[0].data()
                };
            }
            return null;
        } catch (error) {
            console.error("Error finding user:", error);
            return null;
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (!phoneNumber || !password || !confirmPassword) {
            showToast("সব তথ্য পূরণ করুন", "error");
            return;
        }

        if (phoneNumber.length < 11) {
            showToast("সঠিক ফোন নম্বর দিন", "error");
            return;
        }

        if (password.length < 6) {
            showToast("পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে", "error");
            return;
        }

        if (password !== confirmPassword) {
            showToast("পাসওয়ার্ড মিলছে না", "error");
            return;
        }



        if (!agreedToTerms) {
            showToast("শর্তাবলী স্বীকার করুন", "error");
            return;
        }

        setLoading(true);

        try {
            // Convert phone to email format for Firebase
            const email = `${phoneNumber}@aldila.com`;

            // Create user
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const newUser = userCredential.user;

            // Generate referral code for new user
            const myReferralCode = generateReferralCode();

            // Check if referrer exists
            let referrerUid = null;
            if (referrerCode) {
                const referrer = await findUserByReferralCode(referrerCode);
                if (referrer) {
                    referrerUid = referrer.uid;
                }
            }

            // Save new user data to Firestore
            await setDoc(doc(db, "users", newUser.uid), {
                phoneNumber: phoneNumber,
                userId: Math.floor(1000 + Math.random() * 9000).toString(),
                balance: 0, // No instant bonus - will get bonus when plan is purchased
                createdAt: new Date().toISOString(),

                // Referral fields
                referralCode: myReferralCode,
                referredBy: referrerUid || null,
                referredUsers: [],
                referCount: 0,
                activeReferCount: 0,

                // Plan fields
                activePlans: [],
                planHistory: [],
                planLevel: 0,
                isActive: false,

                // Earnings
                totalEarnings: 0,

                // Track if first plan bonus given
                firstPlanBonusGiven: false
            });

            // If referred, update referrer's referred users list (no bonus yet)
            if (referrerUid) {
                await updateDoc(doc(db, "users", referrerUid), {
                    referredUsers: arrayUnion(newUser.uid),
                    referCount: increment(1)
                });
            }

            showToast("রেজিস্ট্রেশন সফল হয়েছে!", "success");

            // Wait for auth state to sync before redirecting
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Force router reload to ensure fresh data
            window.location.href = "/";
        } catch (error: any) {
            console.error("Registration error:", error);
            if (error.code === "auth/email-already-in-use") {
                showToast("এই নম্বর ইতিমধ্যে ব্যবহৃত হয়েছে", "error");
            } else if (error.code === "auth/weak-password") {
                showToast("দুর্বল পাসওয়ার্ড", "error");
            } else {
                showToast("রেজিস্ট্রেশন ব্যর্থ হয়েছে", "error");
            }
        } finally {
            setLoading(false);
        }
    };

    // Show loading while checking authentication
    if (authLoading) {
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
                    <p className="text-sm text-gray-400">নতুন ব্যবহারকারীর রেজিস্ট্রেশন</p>
                </div>

                {/* Register Form */}
                <form onSubmit={handleRegister} className="bg-[#2a4444]/50 backdrop-blur-sm p-6 rounded-xl border border-[#3a5555] space-y-4">
                    {/* Phone Number */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">ফোন নাম্বার</label>
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="আপনার ফোন নাম্বার"
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
                                placeholder="এখানে পাসওয়ার্ড দিন"
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

                    {/* Confirm Password */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">কনফার্ম পাসওয়ার্ড</label>
                        <div className="relative">
                            <input
                                type={showConfirmPassword ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="পুনরায় টাইপ"
                                className="w-full bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors pr-12"
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    {/* Referrer Code */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">রেফারারের কোড</label>
                        <input
                            type="text"
                            value={referrerCode}
                            onChange={(e) => setReferrerCode(e.target.value)}
                            placeholder="যদি আছে"
                            className="w-full bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none focus:border-primary transition-colors"
                        />
                    </div>

                    {/* Register Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-primary hover:opacity-90 text-black font-bold py-3 rounded-lg transition-opacity disabled:opacity-50"
                    >
                        {loading ? "রেজিস্ট্রার হচ্ছে..." : "রিবন্ধন করুন"}
                    </button>

                    {/* Terms Checkbox */}
                    <div className="flex items-start gap-2">
                        <input
                            type="checkbox"
                            id="terms"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="mt-1 w-4 h-4 rounded border-[#3a5555] bg-[#1a2f2f] text-primary focus:ring-primary focus:ring-offset-0"
                        />
                        <label htmlFor="terms" className="text-xs text-gray-400">
                            আমি সম্পূর্ণভাবে ব্যবহারকারীর শর্তাবলী মেনে চলবো
                        </label>
                    </div>

                    {/* Login Link */}
                    <div className="text-center pt-4">
                        <Link href="/login" className="text-sm text-primary hover:underline">
                            আপনার কি ইতিমধ্যে অ্যাকাউন্ট আছে দয়া করুন
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

export default function RegisterPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <RegisterPageContent />
        </Suspense>
    );
}
