"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Image from "next/image";

interface PaymentMethod {
    id: string;
    type: string;
    name: string;
    accountNumber: string;
    accountName: string;
    instructions?: string;
    isActive: boolean;
}

function PaymentMethodSelectionContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const { showToast } = useToast();

    const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const methodsQuery = query(
                collection(db, "paymentMethods"),
                where("isActive", "==", true)
            );
            const snapshot = await getDocs(methodsQuery);
            const methods = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as PaymentMethod[];

            setPaymentMethods(methods);
        } catch (error) {
            console.error("Error fetching payment methods:", error);
            showToast("পেমেন্ট মেথড লোড করতে ব্যর্থ", "error");
        } finally {
            setLoading(false);
        }
    };

    const getMethodColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "bkash":
                return {
                    bg: "bg-gradient-to-br from-pink-600 to-pink-700",
                    border: "border-pink-500",
                    shadow: "shadow-pink-500/30",
                };
            case "nagad":
                return {
                    bg: "bg-gradient-to-br from-orange-600 to-orange-700",
                    border: "border-orange-500",
                    shadow: "shadow-orange-500/30",
                };
            case "rocket":
                return {
                    bg: "bg-gradient-to-br from-purple-600 to-purple-700",
                    border: "border-purple-500",
                    shadow: "shadow-purple-500/30",
                };
            default:
                return {
                    bg: "bg-gradient-to-br from-blue-600 to-blue-700",
                    border: "border-blue-500",
                    shadow: "shadow-blue-500/30",
                };
        }
    };

    const getMethodLogo = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType === "bkash" || lowerType === "nagad") {
            return `/assets/${lowerType}.png`;
        }
        return null;
    };

    const handleMethodClick = (methodId: string) => {
        router.push(`/recharge/payment/${methodId}?amount=${amount}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (paymentMethods.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <p className="text-muted-foreground">কোনো পেমেন্ট মেথড উপলব্ধ নেই</p>
                    <Link
                        href="/recharge"
                        className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
                    >
                        ফিরে যান
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href="/recharge">
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">পেমেন্ট মেথড নির্বাচন করুন</h1>
                </div>
            </div>

            {/* Amount Display */}
            <div className="p-4">
                <div className="bg-gradient-to-r from-primary/20 to-primary/10 border border-primary/30 rounded-xl p-6 text-center">
                    <p className="text-sm text-muted-foreground mb-2">রিচার্জ পরিমাণ</p>
                    <p className="text-4xl font-bold text-primary">৳ {amount}</p>
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 mb-4">
                <div className="bg-blue-500/10 border-l-4 border-blue-500 rounded-r-lg p-4">
                    <p className="text-sm text-blue-400 font-medium">📱 নির্দেশাবলী</p>
                    <p className="text-xs text-muted-foreground mt-2">
                        আপনার পছন্দের পেমেন্ট মেথড সিলেক্ট করুন এবং পরবর্তী পেজে যান
                    </p>
                </div>
            </div>

            {/* Payment Methods Grid */}
            <div className="px-4 space-y-3">
                <h2 className="text-sm font-bold text-muted-foreground mb-3">উপলব্ধ পেমেন্ট মেথড</h2>

                <div className="grid grid-cols-1 gap-4">
                    {paymentMethods.map((method) => {
                        const colors = getMethodColor(method.type);
                        const logo = getMethodLogo(method.type);

                        return (
                            <button
                                key={method.id}
                                onClick={() => handleMethodClick(method.id)}
                                className={`${colors.bg} rounded-xl p-5 shadow-lg ${colors.shadow} border ${colors.border} transition-all hover:scale-[1.02] active:scale-[0.98]`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        {logo ? (
                                            <div className="bg-white rounded-lg p-3 w-20 h-20 flex items-center justify-center">
                                                <Image
                                                    src={logo}
                                                    alt={method.name}
                                                    width={70}
                                                    height={70}
                                                    className="w-full h-auto object-contain"
                                                />
                                            </div>
                                        ) : (
                                            <div className="bg-white/20 rounded-lg p-3 w-20 h-20 flex items-center justify-center">
                                                <span className="text-white font-bold text-2xl">
                                                    {method.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}

                                        <div className="text-left">
                                            <h3 className="font-bold text-white text-lg">{method.name}</h3>
                                            <p className="text-white/80 text-sm">
                                                {method.type.charAt(0).toUpperCase() + method.type.slice(1)} পেমেন্ট
                                            </p>
                                        </div>
                                    </div>

                                    <ChevronRight className="w-6 h-6 text-white" />
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Bottom Info */}
            <div className="px-4 mt-6">
                <div className="bg-card border border-border rounded-lg p-4 text-xs text-muted-foreground space-y-1">
                    <p className="font-bold text-primary">⚠️ গুরুত্বপূর্ণ তথ্য:</p>
                    <ul className="list-disc pl-4 space-y-1">
                        <li>সঠিক পেমেন্ট মেথড সিলেক্ট করুন</li>
                        <li>পেমেন্ট সম্পূর্ণ হওয়ার পর ট্রানজেকশন আইডি জমা দিন</li>
                        <li>৫-১০ মিনিটের মধ্যে ব্যালেন্স আপডেট হবে</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function PaymentMethodSelectionPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <PaymentMethodSelectionContent />
        </Suspense>
    );
}
