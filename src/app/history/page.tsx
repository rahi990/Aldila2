"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, ArrowRightLeft, Hash, DollarSign, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

type TransactionType = "all" | "withdraw" | "recharge" | "reward";

interface Transaction {
    id: string;
    type: "recharge" | "reward" | "withdraw";
    amount: number;
    status: "success" | "failed" | "pending";
    date: string;
    orderNo?: string;
    description?: string;
}

export default function HistoryPage() {
    const { user, userData, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<TransactionType>("all");
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || authLoading) return;

        setLoading(true);
        const allTransactions: Transaction[] = [];
        let depositTransactions: Transaction[] = [];
        let withdrawTransactions: Transaction[] = [];
        let rewardTransactions: Transaction[] = [];

        // Setup real-time listener for deposits
        const depositsQuery = query(
            collection(db, "depositRequests"),
            where("userId", "==", user.uid)
        );

        const unsubscribeDeposits = onSnapshot(depositsQuery, (snapshot) => {
            depositTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: "recharge" as const,
                    amount: data.amount || 0,
                    status: data.status || "pending",
                    date: formatDate(data.createdAt),
                    orderNo: doc.id.slice(-6)
                };
            });

            updateTransactions();
        }, (error) => {
            console.error("Error fetching deposits:", error);
            setLoading(false);
        });

        // Setup real-time listener for withdrawals
        const withdrawsQuery = query(
            collection(db, "withdrawRequests"),
            where("userId", "==", user.uid)
        );

        const unsubscribeWithdraws = onSnapshot(withdrawsQuery, (snapshot) => {
            withdrawTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: "withdraw" as const,
                    amount: data.amount || 0,
                    status: data.status || "pending",
                    date: formatDate(data.createdAt),
                    orderNo: doc.id.slice(-6)
                };
            });

            updateTransactions();
        }, (error) => {
            console.error("Error fetching withdrawals:", error);
            setLoading(false);
        });

        // Setup real-time listener for referral bonuses
        const referralBonusesQuery = query(
            collection(db, "referralBonuses"),
            where("userId", "==", user.uid)
        );

        const unsubscribeRewards = onSnapshot(referralBonusesQuery, (snapshot) => {
            rewardTransactions = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    type: "reward" as const,
                    amount: data.amount || 0,
                    status: data.status || "success",
                    date: formatDate(data.createdAt),
                    description: data.description || "রেফারেল বোনাস"
                };
            });

            updateTransactions();
        }, (error) => {
            console.error("Error fetching rewards:", error);
            setLoading(false);
        });

        const updateTransactions = () => {
            const combined = [...depositTransactions, ...withdrawTransactions, ...rewardTransactions];

            // Sort by most recent first
            combined.sort((a, b) => {
                return new Date(b.date).getTime() - new Date(a.date).getTime();
            });

            setTransactions(combined);
            setLoading(false);
        };

        // Cleanup listeners on unmount
        return () => {
            unsubscribeDeposits();
            unsubscribeWithdraws();
            unsubscribeRewards();
        };
    }, [user, authLoading]);

    const formatDate = (dateString: string) => {
        if (!dateString) return "তারিখ নেই";

        const date = new Date(dateString);
        const bengaliMonths = ["জানু", "ফেব", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
        const bengaliNumerals = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];

        const day = date.getDate().toString().split('').map(d => bengaliNumerals[parseInt(d)]).join('');
        const month = bengaliMonths[date.getMonth()];
        const year = date.getFullYear().toString().split('').map(d => bengaliNumerals[parseInt(d)]).join('');
        const hours = date.getHours();
        const minutes = date.getMinutes().toString().padStart(2, '0').split('').map(d => bengaliNumerals[parseInt(d)]).join('');
        const hour12 = (hours % 12 || 12).toString().split('').map(d => bengaliNumerals[parseInt(d)]).join('');
        const ampm = hours >= 12 ? "PM" : "AM";

        return `${day} ${month} ${year}, ${hour12}:${minutes} ${ampm}`;
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case "success":
            case "approved":
                return "bg-green-500/20 text-green-500";
            case "failed":
            case "rejected":
                return "bg-red-500/20 text-red-500";
            default: return "bg-yellow-500/20 text-yellow-500";
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case "success":
            case "approved":
                return "সফল";
            case "failed":
            case "rejected":
                return "ব্যর্থ";
            default: return "পেন্ডিং";
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case "recharge": return "রিচার্জ";
            case "withdraw": return "উত্তোলন";
            case "reward": return "পুরস্কার";
            default: return type;
        }
    };

    // Filter transactions based on active tab
    const filteredTransactions = activeTab === "all"
        ? transactions
        : transactions.filter(tx => tx.type === activeTab);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">লোড হচ্ছে...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 min-h-screen bg-background">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border">
                <div className="p-4 flex items-center gap-4 text-white">
                    <Link href="/profile">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold">লেনদেনের রেকর্ড</h1>
                </div>

                {/* Tabs */}
                <div className="flex items-center justify-between px-4 pb-2 overflow-x-auto gap-2 no-scrollbar">
                    {[
                        { id: "all", label: "সব রেকর্ড" },
                        { id: "withdraw", label: "উত্তোলন" },
                        { id: "recharge", label: "রিচার্জ" },
                        { id: "reward", label: "পুরস্কার" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as TransactionType)}
                            className={cn(
                                "px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-colors",
                                activeTab === tab.id
                                    ? "bg-primary text-primary-foreground"
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <Info className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">কোনো লেনদেন পাওয়া যায়নি</p>
                    </div>
                ) : (
                    filteredTransactions.map((tx) => (
                        <div key={tx.id} className="bg-card rounded-xl border border-border p-4 space-y-3 shadow-sm">
                            {/* Type */}
                            <div className="flex justify-between items-center border-b border-border/50 pb-2">
                                <div className="flex items-center gap-2 text-primary font-bold text-sm">
                                    <ArrowRightLeft className="w-4 h-4" />
                                    লেনদেনের ধরণ
                                </div>
                                <span className="font-bold text-sm">{getTypeLabel(tx.type)}</span>
                            </div>

                            {/* Order No / Description */}
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    {tx.orderNo ? <Hash className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                                    {tx.orderNo ? "অর্ডার নং" : "বিবরণ"}
                                </div>
                                <span className="text-muted-foreground">{tx.orderNo || tx.description}</span>
                            </div>

                            {/* Amount */}
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <DollarSign className="w-4 h-4" />
                                    টাকার পরিমাণ
                                </div>
                                <span className="font-bold text-green-500">৳ {tx.amount.toFixed(2)}</span>
                            </div>

                            {/* Status */}
                            <div className="flex justify-between items-center text-sm">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Info className="w-4 h-4" />
                                    স্ট্যাটাস
                                </div>
                                <span className={cn("px-3 py-1 rounded-full text-xs font-bold", getStatusColor(tx.status))}>
                                    {getStatusText(tx.status)}
                                </span>
                            </div>

                            {/* Date */}
                            <div className="flex justify-between items-center text-sm pt-2 border-t border-border/50">
                                <div className="flex items-center gap-2 text-primary font-bold">
                                    <Calendar className="w-4 h-4" />
                                    তারিখ
                                </div>
                                <span className="text-xs text-muted-foreground">{tx.date}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
