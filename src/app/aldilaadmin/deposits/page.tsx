"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Clock, CheckCircle, XCircle, DollarSign } from "lucide-react";

interface DepositRequest {
    id: string;
    userId: string;
    userName?: string;
    userPhone?: string;
    amount: number;
    paymentMethod: string;
    transactionId: string;
    phoneNumber: string;
    status: "pending" | "approved" | "rejected";
    createdAt: string;
    processedAt?: string;
}

export default function DepositsManagement() {
    const [deposits, setDeposits] = useState<DepositRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");

    useEffect(() => {
        fetchDeposits();
    }, []);

    const fetchDeposits = async () => {
        try {
            const depositsSnapshot = await getDocs(collection(db, "depositRequests"));
            const depositsData = await Promise.all(
                depositsSnapshot.docs.map(async (depositDoc) => {
                    const data = depositDoc.data();
                    // Fetch user data
                    const userDoc = await getDocs(collection(db, "users"));
                    const user = userDoc.docs.find((u) => u.id === data.userId);
                    const userData = user?.data();

                    return {
                        id: depositDoc.id,
                        ...data,
                        userName: userData?.userId || "Unknown",
                        userPhone: userData?.phoneNumber || "Unknown",
                    } as DepositRequest;
                })
            );
            setDeposits(depositsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
        } catch (error) {
            console.error("Error fetching deposits:", error);
        } finally {
            setLoading(false);
        }
    };

    const approveDeposit = async (deposit: DepositRequest) => {
        if (!confirm(`Approve deposit of ৳${deposit.amount} for ${deposit.userPhone}?`)) return;

        try {
            // Update deposit status
            await updateDoc(doc(db, "depositRequests", deposit.id), {
                status: "approved",
                processedAt: new Date().toISOString(),
            });

            // Update user balance
            await updateDoc(doc(db, "users", deposit.userId), {
                balance: increment(deposit.amount),
            });

            fetchDeposits();
            alert("Deposit approved successfully!");
        } catch (error) {
            console.error("Error approving deposit:", error);
            alert("Failed to approve deposit");
        }
    };

    const rejectDeposit = async (deposit: DepositRequest) => {
        const reason = prompt("Enter rejection reason:");
        if (!reason) return;

        try {
            await updateDoc(doc(db, "depositRequests", deposit.id), {
                status: "rejected",
                processedAt: new Date().toISOString(),
                rejectionReason: reason,
            });

            fetchDeposits();
            alert("Deposit rejected");
        } catch (error) {
            console.error("Error rejecting deposit:", error);
            alert("Failed to reject deposit");
        }
    };

    const filteredDeposits =
        filter === "all"
            ? deposits
            : deposits.filter((d) => d.status === filter);

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
                <h1 className="text-3xl font-bold text-primary">Deposit Management</h1>
                <p className="text-muted-foreground mt-1">Approve or reject deposit requests</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <DollarSign className="w-4 h-4" />
                        <span className="text-sm">All Deposits</span>
                    </div>
                    <p className="text-2xl font-bold">{deposits.length}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-500">
                        {deposits.filter((d) => d.status === "pending").length}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Approved</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">
                        {deposits.filter((d) => d.status === "approved").length}
                    </p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Rejected</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">
                        {deposits.filter((d) => d.status === "rejected").length}
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

            {/* Deposits Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-4 font-medium">User</th>
                                <th className="text-left p-4 font-medium">Amount</th>
                                <th className="text-left p-4 font-medium">Method</th>
                                <th className="text-left p-4 font-medium">Transaction ID</th>
                                <th className="text-left p-4 font-medium">Date</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDeposits.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No deposits found
                                    </td>
                                </tr>
                            ) : (
                                filteredDeposits.map((deposit) => (
                                    <tr key={deposit.id} className="border-t border-border hover:bg-muted/50">
                                        <td className="p-4">
                                            <div>
                                                <p className="font-medium">{deposit.userPhone}</p>
                                                <p className="text-xs text-muted-foreground">ID: {deposit.userName}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold">৳{deposit.amount}</td>
                                        <td className="p-4">{deposit.paymentMethod}</td>
                                        <td className="p-4">{deposit.transactionId}</td>
                                        <td className="p-4 text-sm">
                                            {new Date(deposit.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="p-4">
                                            {deposit.status === "pending" && (
                                                <span className="bg-yellow-500/20 text-yellow-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Pending
                                                </span>
                                            )}
                                            {deposit.status === "approved" && (
                                                <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Approved
                                                </span>
                                            )}
                                            {deposit.status === "rejected" && (
                                                <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Rejected
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            {deposit.status === "pending" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => approveDeposit(deposit)}
                                                        className="p-2 bg-green-500/20 text-green-500 rounded-lg hover:bg-green-500/30 transition-colors"
                                                        title="Approve"
                                                    >
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectDeposit(deposit)}
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
