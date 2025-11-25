"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, PlusCircle, AlertTriangle, Wallet, Trash2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WalletData {
    id: string;
    name: string;
    method: string;
    accountNumber: string;
    status: string;
}

export default function WithdrawPage() {
    const { user, userData } = useAuth();
    const { showToast } = useToast();
    const [wallets, setWallets] = useState<WalletData[]>([]);

    useEffect(() => {
        if (userData?.wallets) {
            setWallets(userData.wallets);
        }
    }, [userData]);

    const handleDelete = async (id: string) => {
        if (!user) return;

        const updatedWallets = wallets.filter(w => w.id !== id);

        try {
            await updateDoc(doc(db, "users", user.uid), {
                wallets: updatedWallets
            });
            setWallets(updatedWallets);
            showToast("ওয়ালেট মুছে ফেলা হয়েছে", "success");
        } catch (error) {
            console.error("Error deleting wallet:", error);
            showToast("মুছতে ব্যর্থ", "error");
        }
    };

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 text-white mb-6">
                <Link href="/profile">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-primary">ওয়ালেট ম্যানেজমেন্ট</h1>
            </div>

            {/* Connected Wallets Count */}
            <div className="bg-card p-8 rounded-xl border border-border text-center space-y-2 shadow-sm">
                <div className="text-4xl font-bold text-primary">{wallets.length}</div>
                <div className="text-muted-foreground font-medium">সংযুক্ত ওয়ালেট</div>
            </div>

            {/* Wallet List or Empty State */}
            {wallets.length > 0 ? (
                <div className="space-y-4">
                    <h3 className="text-primary font-bold flex items-center gap-2">
                        <Wallet className="w-5 h-5" />
                        আপনার ওয়ালেট সমূহ
                    </h3>
                    {wallets.map((wallet) => (
                        <div key={wallet.id} className="bg-card rounded-xl border border-border p-4 flex justify-between items-center shadow-sm">
                            <div>
                                <div className="font-bold text-lg capitalize">{wallet.method}</div>
                                <div className="text-muted-foreground text-sm">{wallet.accountNumber}</div>
                                <div className="text-xs text-primary mt-1">{wallet.name}</div>
                            </div>
                            <button
                                onClick={() => handleDelete(wallet.id)}
                                className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                            >
                                <Trash2 className="w-5 h-5" />
                            </button>
                        </div>
                    ))}
                </div>
            ) : (
                /* Info Card (Empty State) */
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                    <div className="p-3 border-b border-border flex items-center gap-2 text-primary font-bold">
                        <AlertTriangle className="w-5 h-5" />
                        তথ্য
                    </div>
                    <div className="p-4 space-y-4 text-sm">
                        <div className="flex justify-between items-center border-b border-border/50 pb-2">
                            <span className="text-muted-foreground">স্ট্যাটাস:</span>
                            <span className="text-red-500 font-bold">কোনো ওয়ালেট সংযুক্ত নেই</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground">নির্দেশনা:</span>
                            <span className="text-right text-muted-foreground">ওয়ালেট সংযুক্ত করতে নিচের বাটনে ক্লিক করুন</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Withdraw Request Button */}
            {wallets.length > 0 && (
                <Link
                    href="/withdraw/request"
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                >
                    <span className="text-xl">⚡</span>
                    উইথড্র করুন
                </Link>
            )}

            {/* Add Wallet Button */}
            <Link href="/withdraw/add" className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2">
                <PlusCircle className="w-5 h-5" />
                ওয়ালেট সংযুক্ত করুন
            </Link>
        </div>
    );
}
