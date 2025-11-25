"use client";

import { useState } from "react";
import { ArrowLeft, Save, User, CreditCard, Building2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AddBankPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, userData } = useAuth();
    const [name, setName] = useState("");
    const [method, setMethod] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [loading, setLoading] = useState(false);

    const handleSave = async () => {
        if (!name || !method || !accountNumber) {
            showToast("অনুগ্রহ করে সব তথ্য পূরণ করুন", "error");
            return;
        }

        if (!user || !userData) {
            showToast("লগইন করুন", "error");
            return;
        }

        setLoading(true);

        try {
            const newWallet = {
                id: Date.now().toString(),
                name,
                method,
                accountNumber,
                status: "active"
            };

            // Get existing wallets from user data
            const existingWallets = userData.wallets || [];
            const updatedWallets = [...existingWallets, newWallet];

            // Save to Firestore
            await updateDoc(doc(db, "users", user.uid), {
                wallets: updatedWallets
            });

            showToast("ওয়ালেট সফলভাবে যুক্ত হয়েছে!", "success");
            router.push("/withdraw");
        } catch (error) {
            console.error("Error saving wallet:", error);
            showToast("ওয়ালেট যুক্ত করতে ব্যর্থ", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 text-white mb-6">
                <Link href="/withdraw">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-primary">ফিন্যান্স ওয়ালেট</h1>
            </div>

            {/* Form Container */}
            <div className="bg-card p-6 rounded-xl border border-border space-y-6 shadow-lg">
                <h2 className="text-center text-muted-foreground text-sm border-b border-border/50 pb-4">
                    একটি ওয়ালেট পরিবর্তন করুন বা তৈরি করুন
                </h2>

                {/* Real Name Input */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-primary font-bold text-sm">
                        <User className="w-4 h-4" />
                        আপনার আসল নাম
                    </label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="আপনার আসল নাম লিখুন"
                        className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* Payment Method Select */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-primary font-bold text-sm">
                        <CreditCard className="w-4 h-4" />
                        পেমেন্ট মেথড
                    </label>
                    <select
                        value={method}
                        onChange={(e) => setMethod(e.target.value)}
                        className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white focus:outline-none focus:border-primary transition-colors appearance-none"
                    >
                        <option value="" disabled>পেমেন্ট মেথড সিলেক্ট করুন</option>
                        <option value="bkash" className="bg-card">Bkash</option>
                        <option value="nagad" className="bg-card">Nagad</option>
                        <option value="rocket" className="bg-card">Rocket</option>
                    </select>
                </div>

                {/* Bank Account Number Input */}
                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-primary font-bold text-sm">
                        <Building2 className="w-4 h-4" />
                        ব্যাংক অ্যাকাউন্ট নম্বর
                    </label>
                    <input
                        type="text"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        placeholder="আপনার ব্যাংক অ্যাকাউন্ট নম্বর নিশ্চিত করুন"
                        className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                </div>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2 mt-4 disabled:opacity-50"
                >
                    {loading ? (
                        <span>সংরক্ষণ করা হচ্ছে...</span>
                    ) : (
                        <>
                            <Save className="w-5 h-5" />
                            পরিবর্তন সংরক্ষণ করুন
                        </>
                    )}
                </button>
            </div>

            {/* Instructions */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-2 text-xs text-muted-foreground">
                <h4 className="text-primary font-bold mb-2">নির্দেশাবলী:</h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li>আপনার আসল নাম প্রদান করুন যা আপনার ব্যাংক অ্যাকাউন্টের সাথে মেলে</li>
                    <li>সঠিক পেমেন্ট মেথড সিলেক্ট করুন</li>
                    <li>ভুল তথ্য দিলে উইথড্র বাতিল হতে পারে</li>
                </ul>
            </div>
        </div>
    );
}
