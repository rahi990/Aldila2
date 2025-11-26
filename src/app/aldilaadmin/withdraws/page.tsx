"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, CheckCircle, XCircle, DollarSign, Wallet } from "lucide-react";

interface WithdrawRequest {
    id: string;
    userId: string;
    userName?: string;
    userPhone?: string;
    userBalance?: number;
    amount: number;
    withdrawMethod: string;
    accountNumber: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    processedAt?: string;
    rejectionReason?: string;
}

export default function WithdrawsManagement() {
    const [withdraws, setWithdraws] = useState<WithdrawRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

    useEffect(() => {
        fetchWithdraws();
    }, []);

    const fetchWithdraws = async () => {
        try {
            const withdrawsSnapshot = await getDocs(collection(db, "withdrawRequests"));
            const withdrawsData = await Promise.all(
                withdrawsSnapshot.docs.map(async (withdrawDoc) => {
                    const data = withdrawDoc.data();
                    // Fetch user data
                    try {
                        const userDocRef = doc(db, "users", data.userId);
                        const userDoc = await getDoc(userDocRef);
                        const userData = userDoc.data();

                        return {
                            id: withdrawDoc.id,
                            ...data,
                            userName: userData?.userId || "Unknown",
                            userPhone: userData?.phoneNumber || "Unknown",
                            userBalance: userData?.balance || 0,
                        } as WithdrawRequest;
                    } catch (error) {
                        console.error("Error fetching user:", error);
                        return {
                            id: withdrawDoc.id,
                            ...data,
                            userName: "Unknown",
                            userPhone: "Unknown",
                            userBalance: 0,
                        } as WithdrawRequest;
                    }
                })
            );
            setWithdraws(withdrawsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Error fetching withdraws:", error);
        } finally {
            setLoading(false);
        }
    };

    const approveWithdraw = async (withdraw: WithdrawRequest) => {
        // Balance already deducted when user submitted request
        if (!confirm(`Approve withdraw of ৳${withdraw.amount} for ${withdraw.userPhone}?`)) return;

        try {
            // Update withdraw status (balance already deducted)
            await updateDoc(doc(db, "withdrawRequests", withdraw.id), {
                status: "approved",
                processedAt: new Date().toISOString(),
            });

            fetchWithdraws();
            alert("Withdraw approved successfully!");
        } catch (error) {
            console.error("Error approving withdraw:", error);
            alert("Failed to approve withdraw");
        }
    };

    const rejectWithdraw = async (withdraw: WithdrawRequest) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            // Refund the balance back to user
            await updateDoc(doc(db, "users", withdraw.userId), {
                balance: increment(withdraw.amount), // Add back the deducted amount
            });

            await updateDoc(doc(db, "withdrawRequests", withdraw.id), {
                status: "rejected",
                processedAt: new Date().toISOString(),
                rejectionReason: reason,
            });

            fetchWithdraws();
            alert("Withdraw rejected and balance refunded to user");
        } catch (error) {
            console.error("Error rejecting withdraw:", error);
            alert("Failed to reject withdraw");
        }
    };

    const filteredWithdraws =
        filter === "all"
            ? withdraws
            : withdraws.filter((w) => w.status === filter);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary">Withdraw Management</h1>
                <p className="text-muted-foreground mt-1">Approve or reject withdraw requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">All Withdraws</span>
                    </div>
                    <p className="text-2xl font-bold">{withdraws.length}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">
                        {withdraws.filter((w) => w.status === "pending").length}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                        {withdraws.filter((w) => w.status === "approved").length}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">
                        {withdraws.filter((w) => w.status === "rejected").length}
                    </p>
                </div>
            </div>

            {/* Filter */}
            <div className="flex gap-2">
                {(["all", "pending", "approved", "rejected"] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${filter === status
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-foreground hover:bg-muted/80"
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                    </button>
                ))}
            </div>

            {/* Withdraws Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-4 font-medium">User</th>
                                <th className="text-left p-4 font-medium">Amount</th>
                                <th className="text-left p-4 font-medium">Balance</th>
                                <th className="text-left p-4 font-medium">Method</th>
                                <th className="text-left p-4 font-medium">Account</th>
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredWithdraws.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center p-8 text-muted-foreground">
                                        No withdraw requests found
                                    </td>
                                </tr>
                            ) : (
                                filteredWithdraws.map((withdraw) => (
                                    <tr key={withdraw.id} className="border-t border-border hover:bg-muted/50">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{withdraw.userPhone}</p>
                                                <p className="text-xs text-muted-foreground">ID: {withdraw.userName}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-red-500">-৳{withdraw.amount}</td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1">
                                                <Wallet className="w-4 h-4 text-muted-foreground" />
                                                <span className="font-medium">৳{withdraw.userBalance}</span>
                                            </div>
                                        </td>
                                        <td className="p-4">{withdraw.withdrawMethod}</td>
                                        <td className="p-4 font-mono text-sm">{withdraw.accountNumber}</td>
                                        <td className="p-4 text-sm">
                                            {new Date(withdraw.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {withdraw.status === "pending" && (
                                                <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Pending
                                                </span>
                                            )}
                                            {withdraw.status === "approved" && (
                                                <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Approved
                                                </span>
                                            )}
                                            {withdraw.status === "rejected" && (
                                                <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {withdraw.status === "pending" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => approveWithdraw(withdraw)}
                                                        className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectWithdraw(withdraw)}
                                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                                        title="Reject"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
