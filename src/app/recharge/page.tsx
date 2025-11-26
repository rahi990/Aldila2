"use client";

import { useState } from "react";
import { ArrowLeft, Wallet } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";

export default function RechargePage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { userData } = useAuth();
    const [amount, setAmount] = useState<string>("");
    const amounts = ["100", "200", "500"];

    const handleRecharge = () => {
        if (!amount || parseInt(amount) < 1) {
            showToast("সঠিক পরিমাণ লিখুন", "error");
            return;
        }
        router.push(`/recharge/payment?amount=${amount}`);
    };

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center gap-4 text-white mb-6">
                <Link href="/profile">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold">রিচার্জ</h1>
            </div>

            {/* Balance Card */}
            <div className="bg-card p-6 rounded-xl border border-border text-center space-y-2 shadow-sm">
                <h3 className="text-muted-foreground text-sm">অ্যাকাউন্ট ব্যালেন্স</h3>
                <div className="text-3xl font-bold text-primary">৳{userData?.balance?.toFixed(2) || "0.00"}</div>
            </div>

            {/* Warning/Info Box */}
            <div className="bg-card p-3 rounded-lg border-l-4 border-primary text-xs text-muted-foreground">
                <span className="text-primary font-bold">রিচার্জ নির্দেশাবলী:</span> সঠিক পেমেন্ট প্রক্রিয়া অনুসরণ করুন। পেমেন্ট সম্পূর্ণ হওয়ার পর, TRX নম্বর জমা দিন এবং তহবিল স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট ব্যালেন্সে জমা হবে।
            </div>

            {/* Amount Selection */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <Wallet className="w-4 h-4" />
                    রিচার্জ অ্যামাউন্ট সিলেক্ট করুন
                </div>

                <div className="grid grid-cols-3 gap-3">
                    {amounts.map((amt) => (
                        <button
                            key={amt}
                            onClick={() => setAmount(amt.replace(/,/g, ""))}
                            className={cn(
                                "py-3 rounded-lg text-sm font-bold border transition-all",
                                amount === amt.replace(/,/g, "")
                                    ? "bg-primary text-primary-foreground border-primary"
                                    : "bg-muted/20 border-border text-muted-foreground hover:border-primary/50"
                            )}
                        >
                            ৳ {amt}
                        </button>
                    ))}
                </div>
            </div>

            {/* Custom Amount Input */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-3">
                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="text-lg">📝</span>
                    অথবা কাস্টম অ্যামাউন্ট দিন
                </div>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="যেকোনো পরিমাণ লিখুন"
                    className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Recharge Button */}
            <button
                onClick={handleRecharge}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
            >
                <span className="text-xl">➔</span> রিচার্জ করুন
            </button>

            {/* Footer Instructions */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-2 text-xs text-muted-foreground">
                <h4 className="text-primary font-bold mb-2">রিচার্জ নির্দেশাবলী</h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li>যেকোনো পরিমাণ জমা করতে পারবেন।</li>
                    <li>এজেন্ট নম্বরে ক্যাশআউট করতে হবে, সেন্ড মানি নয়।</li>
                    <li>সফল পেমেন্টের পরে, তহবিল ৫-১০ মিনিটের মধ্যে ব্যালেন্সে দেখাবে।</li>
                    <li>৩০ মিনিটের মধ্যে ক্রেডিট না হলে, অনুগ্রহ করে কাস্টমার সার্ভিসে যোগাযোগ করুন।</li>
                </ul>
            </div>
        </div>
    );
}
