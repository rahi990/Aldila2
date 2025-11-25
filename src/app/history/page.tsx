"use client";

import { useState } from "react";
import { ArrowLeft, ArrowRightLeft, Hash, DollarSign, Calendar, Info } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
    const [activeTab, setActiveTab] = useState<TransactionType>("all");

    const transactions: Transaction[] = [
        {
            id: "1",
            type: "recharge",
            amount: 1000.00,
            status: "failed",
            date: "২৪ নভে ২০২৫, ০২:২৫ PM",
            orderNo: "761"
        },
        {
            id: "2",
            type: "reward",
            amount: 200.00,
            status: "success",
            date: "২৪ নভে ২০২৫, ০২:২১ PM",
            description: "রিবেট"
        }
    ];

    const getStatusColor = (status: string) => {
        switch (status) {
            case "success": return "bg-green-500/20 text-green-500";
            case "failed": return "bg-red-500/20 text-red-500";
            default: return "bg-yellow-500/20 text-yellow-500";
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case "success": return "সফল";
            case "failed": return "ব্যর্থ";
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
                                    ? "bg-primary text-primary-foreground" // Active state
                                    : "bg-muted/50 text-muted-foreground hover:bg-muted" // Inactive state
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
                {transactions.map((tx) => (
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
                ))}
            </div>
        </div>
    );
}
