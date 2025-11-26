"use client";

import { useState, useEffect } from "react";
import { ArrowLeft, Wallet as WalletIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, doc, updateDoc, increment, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendTelegramNotification, formatWithdrawNotification } from "@/lib/telegram";

interface WalletData {
    id: string;
    name: string;
    method: string;
    accountNumber: string;
    status: string;
}

export default function WithdrawRequestPage() {
    const router = useRouter();
    const { showToast } = useToast();
    const { user, userData, refreshUserData } = useAuth();
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [selectedWallet, setSelectedWallet] = useState<string>("");
    const [amount, setAmount] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [totalPlanCost, setTotalPlanCost] = useState(0);
    const [availablePoints, setAvailablePoints] = useState(0);

    useEffect(() => {
        if (userData?.wallets) {
            setWallets(userData.wallets);
            if (userData.wallets.length > 0) {
                setSelectedWallet(userData.wallets[0].id);
            }
        }
    }, [userData]);

    // Fetch referred users and calculate total plan cost
    useEffect(() => {
        const fetchReferredUsersData = async () => {
            if (!userData?.referredUsers || userData.referredUsers.length === 0) {
                setTotalPlanCost(0);
                setAvailablePoints(0);
                return;
            }

            try {
                let totalCost = 0;

                for (const uid of userData.referredUsers) {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        const activePlans = data.activePlans || [];

                        // Sum up active plan costs
                        const userPlanCost = activePlans
                            .filter((p: any) => p.isActive && new Date(p.expiryDate) > new Date())
                            .reduce((sum: number, plan: any) => sum + (plan.price || 0), 0);

                        totalCost += userPlanCost;
                    }
                }

                setTotalPlanCost(totalCost);

                // Calculate available points
                const usedPoints = userData.planCostPointsUsed || 0;
                const available = totalCost - usedPoints;
                setAvailablePoints(available);
            } catch (error) {
                console.error("Error fetching referred users:", error);
            }
        };

        if (userData) {
            fetchReferredUsersData();
        }
    }, [userData]);

    const calculatePointsRequired = (withdrawAmount: number): number => {
        // Formula: 100 taka = 100 points (1:1 ratio)
        return withdrawAmount;
    };

    const handleWithdraw = async () => {
        if (!selectedWallet) {
            showToast("একটি ওয়ালেট সিলেক্ট করুন", "error");
            return;
        }

        const amountNum = parseInt(amount);
        if (!amount || amountNum < 300) {
            showToast("ন্যূনতম উইথড্র ৳৩০০", "error");
            return;
        }

        // Check if user is logged in
        if (!user || !userData) {
            showToast("লগইন করুন", "error");
            router.push("/login");
            return;
        }

        // Check if user has sufficient balance
        if (userData.balance < amountNum) {
            showToast("অপর্যাপ্ত ব্যালেন্স", "error");
            return;
        }

        // Calculate required points
        const pointsRequired = calculatePointsRequired(amountNum);

        // Check if user has sufficient points
        if (availablePoints < pointsRequired) {
            showToast(`প্রয়োজনীয় পয়েন্ট: ${pointsRequired}, আপনার কাছে: ${availablePoints}`, "error");
            return;
        }

        setLoading(true);

        // Get the selected wallet details
        const wallet = wallets.find(w => w.id === selectedWallet);

        try {
            // Deduct balance and points
            await updateDoc(doc(db, "users", user.uid), {
                balance: increment(-parseFloat(amount)),
                planCostPointsUsed: increment(pointsRequired)
            });

            // Create withdraw request in Firebase
            await addDoc(collection(db, "withdrawRequests"), {
                userId: user.uid,
                phoneNumber: userData.phoneNumber,
                amount: parseFloat(amount),
                withdrawMethod: wallet?.method || "Unknown",
                accountNumber: wallet?.accountNumber || "",
                accountName: wallet?.name || "",
                pointsDeducted: pointsRequired,
                status: "pending",
                createdAt: new Date().toISOString(),
            });

            // Send Telegram Notification
            const notificationMessage = formatWithdrawNotification({
                phoneNumber: userData.phoneNumber,
                amount: parseFloat(amount),
                method: wallet?.method || "Unknown",
                accountNumber: wallet?.accountNumber || ""
            });

            // Don't await this to avoid blocking UI if telegram fails
            sendTelegramNotification(notificationMessage).catch((err: any) =>
                console.error("Failed to send telegram notification:", err)
            );

            // Update local state immediately
            const newUsedPoints = (userData.planCostPointsUsed || 0) + pointsRequired;
            const newAvailablePoints = totalPlanCost - newUsedPoints;
            setAvailablePoints(newAvailablePoints);

            showToast(`উইথড্র রিকোয়েস্ট সাবমিট হয়েছে! ${pointsRequired} পয়েন্ট কেটে নেওয়া হয়েছে`, "success");

            // Refresh user data to show updated balance immediately
            await refreshUserData();

            // Redirect after a short delay
            setTimeout(() => {
                router.push("/withdraw");
            }, 1000);
        } catch (error) {
            console.error("Error submitting withdraw:", error);
            showToast("রিকোয়েস্ট সাবমিট করতে ব্যর্থ", "error");
        } finally {
            setLoading(false);
        }
    };

    if (wallets.length === 0) {
        return (
            <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
                <div className="flex items-center gap-4 text-white mb-6">
                    <Link href="/withdraw">
                        <ArrowLeft className="w-6 h-6" />
                    </Link>
                    <h1 className="text-xl font-bold text-primary">উইথড্র</h1>
                </div>
                <div className="bg-card p-6 rounded-xl border border-border text-center space-y-4">
                    <p className="text-muted-foreground">প্রথমে একটি ওয়ালেট যুক্ত করুন</p>
                    <Link
                        href="/withdraw/add"
                        className="inline-block bg-primary text-primary-foreground font-bold py-3 px-6 rounded-xl hover:opacity-90 transition-opacity"
                    >
                        ওয়ালেট যুক্ত করুন
                    </Link>
                </div>
            </div>
        );
    }

    const selectedWalletData = wallets.find(w => w.id === selectedWallet);
    const amountNum = parseInt(amount) || 0;
    const pointsRequired = amountNum > 0 ? calculatePointsRequired(amountNum) : 0;
    const hasEnoughPoints = availablePoints >= pointsRequired;

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 text-white mb-6">
                <Link href="/withdraw">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-primary">উইথড্র</h1>
            </div>

            {/* Points Info Card */}
            <div className="bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 rounded-xl p-4">
                <h3 className="text-sm font-bold text-primary mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    উইথড্র পয়েন্ট সিস্টেম
                </h3>
                <div className="text-center bg-card/50 p-4 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">উপলব্ধ পয়েন্ট</p>
                    <p className="text-4xl font-bold text-green-500">{availablePoints}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                    ১০০ টাকা উইথড্র করতে ১০০ পয়েন্ট প্রয়োজন • ৫% চার্জ কাটা হবে
                </p>
            </div>

            {/* Wallet Selection */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-primary font-bold text-sm">
                    <WalletIcon className="w-4 h-4" />
                    ওয়ালেট তথ্য
                </label>
                <select
                    value={selectedWallet}
                    onChange={(e) => setSelectedWallet(e.target.value)}
                    className="w-full bg-primary/20 border-2 border-primary/50 rounded-lg p-4 text-white font-bold capitalize focus:outline-none focus:border-primary transition-colors appearance-none"
                >
                    {wallets.map((wallet) => (
                        <option key={wallet.id} value={wallet.id} className="bg-card capitalize">
                            {wallet.method} - {wallet.accountNumber}
                        </option>
                    ))}
                </select>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
                <label className="flex items-center gap-2 text-primary font-bold text-sm">
                    <span className="text-lg">💰</span>
                    উইথড্রানের পরিমান
                </label>
                <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="অ্যামাউন্ট লিখুন (ন্যূনতম ৳৩০০)"
                    className="w-full bg-muted/20 border border-border rounded-lg p-4 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />

                {/* Points calculation preview */}
                {amountNum > 0 && (
                    <div className={`p-3 rounded-lg border ${hasEnoughPoints ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                        <p className="text-sm">
                            <span className="text-muted-foreground">প্রয়োজনীয় পয়েন্ট: </span>
                            <span className={`font-bold ${hasEnoughPoints ? 'text-green-500' : 'text-red-500'}`}>
                                {pointsRequired}
                            </span>
                        </p>
                        {!hasEnoughPoints && (
                            <p className="text-xs text-red-500 mt-1">
                                ⚠️ অপর্যাপ্ত পয়েন্ট! আরও {pointsRequired - availablePoints} পয়েন্ট প্রয়োজন
                            </p>
                        )}
                    </div>
                )}
            </div>

            {/* Balance Info */}
            <div className="bg-card p-4 rounded-xl border border-border">
                <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">বর্তমান ব্যালেন্স:</span>
                    <span className="font-bold text-primary text-lg">৳{userData?.balance?.toFixed(2) || "0.00"}</span>
                </div>
            </div>

            {/* Withdraw Button */}
            <button
                onClick={handleWithdraw}
                disabled={loading || !hasEnoughPoints}
                className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? "প্রসেস হচ্ছে..." : (
                    <>
                        <span className="text-xl">⚡</span> উইথড্রান করুন
                    </>
                )}
            </button>

            {/* Instructions */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-2 text-xs text-muted-foreground">
                <h4 className="text-primary font-bold mb-2">উইথড্র নির্দেশাবলী</h4>
                <ul className="list-disc pl-4 space-y-1">
                    <li>ন্যূনতম উইথড্র ৳৩০০।</li>
                    <li>প্রতি ১০০ টাকা উইথড্রের জন্য ১০০ পয়েন্ট প্রয়োজন।</li>
                    <li>প্রতি উইথড্রে ৫% চার্জ কেটে নেওয়া হবে।</li>
                    <li>পয়েন্ট পেতে রেফার করুন এবং তারা প্ল্যান কিনুক।</li>
                    <li>উইথড্র রিকোয়েস্ট ২৪ ঘন্টার মধ্যে প্রসেস হবে।</li>
                    <li>সঠিক ওয়ালেট তথ্য নিশ্চিত করুন।</li>
                </ul>
            </div>
        </div>
    );
}
