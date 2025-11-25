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
    const { user, loading: authLoading } = useAuth();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [referrerCode, setReferrerCode] = useState("");
    const [captchaInput, setCaptchaInput] = useState("");
    const [captchaCode, setCaptchaCode] = useState("");
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

    // Generate random captcha
    const generateCaptcha = () => {
        const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        let captcha = "";
        for (let i = 0; i < 6; i++) {
            captcha += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptchaCode(captcha);
        setCaptchaInput("");
    };

    useEffect(() => {
        generateCaptcha();
    }, []);

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

        if (captchaInput !== captchaCode) {
            showToast("ক্যাপচা ভুল আছে", "error");
            generateCaptcha();
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
                balance: referrerUid ? 5 : 0, // ৫ টাকা bonus if referred
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
                totalEarnings: referrerUid ? 5 : 0
            });

            // If referred, update referrer's data and give bonus
            if (referrerUid) {
                await updateDoc(doc(db, "users", referrerUid), {
                    referredUsers: arrayUnion(newUser.uid),
                    referCount: increment(1),
                    balance: increment(5), // ৫ টাকা bonus to referrer
                    totalEarnings: increment(5)
                });
            }

            showToast("রেজিস্ট্রেশন সফল হয়েছে!" + (referrerUid ? " উভয়ে ৫ টাকা বোনাস পেয়েছেন!" : ""), "success");
            router.push("/");
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4">
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

                    {/* Captcha */}
                    <div className="space-y-2">
                        <label className="text-sm text-gray-300">ক্যাপচা কোড</label>
                        <div className="flex gap-2">
                            {/* Captcha Display */}
                            <div className="bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-4 py-3 text-white font-mono text-lg tracking-wider flex-shrink-0 select-none">
                                {captchaCode}
                            </div>
                            {/* Refresh Button */}
                            <button
                                type="button"
                                onClick={generateCaptcha}
                                className="bg-[#1a2f2f] border border-[#3a5555] rounded-lg px-3 text-primary hover:bg-[#2a4444] transition-colors"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>
                        {/* Captcha Input */}
                        <input
                            type="text"
                            value={captchaInput}
                            onChange={(e) => setCaptchaInput(e.target.value)}
                            placeholder="ক্যাপচা টাইপ"
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
