"use client";

import { useState, useEffect } from "react";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle } from "lucide-react";

interface CompletedWithdraw {
    id: string;
    phoneNumber: string;
    amount: number;
    createdAt: string;
}

export function CompletedWithdrawals() {
    const [withdrawals, setWithdrawals] = useState<CompletedWithdraw[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Setup real-time listener for completed withdrawals
        const withdrawsQuery = query(
            collection(db, "withdrawRequests"),
            where("status", "in", ["success", "approved"]),
            orderBy("createdAt", "desc"),
            limit(5)
        );

        // Real-time listener - will automatically update when withdrawals are approved
        const unsubscribe = onSnapshot(withdrawsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as CompletedWithdraw[];

            setWithdrawals(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching completed withdrawals:", error);
            setLoading(false);
        });

        // Cleanup listener on unmount
        return () => unsubscribe();
    }, []);

    const maskPhoneNumber = (phone: string) => {
        if (!phone || phone.length < 11) return phone;
        const first5 = phone.substring(0, 5);
        const last2 = phone.substring(phone.length - 2);
        return `${first5}xxxx${last2}`;
    };

    if (loading) {
        return (
            <div className="bg-card p-6 rounded-xl border border-border">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-green-900/20 to-green-800/10 p-6 rounded-xl border border-green-500/30 space-y-4">
            <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-white">সম্পন্ন উত্তোলন</h2>
            </div>

            <div className="space-y-3">
                {withdrawals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">কোনো সম্পন্ন উত্তোলন নেই</p>
                ) : (
                    withdrawals.map((withdraw) => (
                        <div
                            key={withdraw.id}
                            className="bg-card/50 backdrop-blur-sm p-4 rounded-lg border border-border/50 flex items-center justify-between"
                        >
                            <div className="flex-1">
                                <p className="text-white font-mono text-sm">{maskPhoneNumber(withdraw.phoneNumber)}</p>
                                <p className="text-primary font-bold text-lg">৳{withdraw.amount.toFixed(2)}</p>
                            </div>
                            <div className="bg-green-500/20 text-green-500 px-4 py-2 rounded-full text-sm font-bold">
                                সম্পন্ন
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
