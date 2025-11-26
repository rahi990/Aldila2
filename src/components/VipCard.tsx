"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { CheckCircle2, X } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { collection, addDoc, doc, getDoc, updateDoc, increment } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface VipCardProps {
    level: number;
    dailyIncome: number;
    totalRevenue: number;
    price: number;
    validity: number;
    maxPurchase?: number; // Optional now, will be ignored
    status: "active" | "upcoming" | "disabled";
}

export function VipCard({ level, dailyIncome, totalRevenue, price, validity, maxPurchase, status }: VipCardProps) {
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const { showToast } = useToast();
    const { user, userData, purchasePlan, refreshUserData } = useAuth();

    const handlePurchase = async () => {
        if (!userData || userData.balance < price) {
            showToast("আপনার পর্যাপ্ত ব্যালেন্স নেই!", "error");
            setShowConfirm(false);
            return;
        }

        // VALIDATION 1: Check if same level plan is already active
        const existingActivePlan = userData.activePlans?.find(
            (p: any) => p.level === level && p.isActive && new Date(p.expiryDate) > new Date()
        );

        if (existingActivePlan) {
            const expiryDate = new Date(existingActivePlan.expiryDate).toLocaleDateString('bn-BD');
            showToast(`আপনার VIP ${level} প্ল্যান ইতিমধ্যে সক্রিয় আছে! মেয়াদ শেষ: ${expiryDate}`, "error");
            setShowConfirm(false);
            return;
        }

        // Maximum purchase validation removed - users can purchase unlimited times

        setLoading(true);

        try {
            const purchaseDate = new Date();
            const expiryDate = new Date(purchaseDate);
            expiryDate.setDate(expiryDate.getDate() + validity);

            const planPurchase = {
                planId: `VIP${level}-${Date.now()}`,
                level: level,
                price: price,
                dailyIncome: dailyIncome,
                totalRevenue: totalRevenue,
                purchaseDate: purchaseDate.toISOString(),
                expiryDate: expiryDate.toISOString(),
                isActive: true
            };

            // Add new plan to active plans (don't deactivate other plans)
            if (!user || !userData) return;

            const userRef = doc(db, "users", user.uid);

            // Add to both activePlans and planHistory
            const updatedActivePlans = [...(userData.activePlans || []), planPurchase];

            // Check if this is first plan purchase and user was referred
            const isFirstPlan = !userData.firstPlanBonusGiven;
            const hasReferrer = userData.referredBy;

            // Update Firestore
            const updateData: any = {
                activePlans: updatedActivePlans,
                planHistory: [...(userData.planHistory || []), planPurchase],
                isActive: true,
                balance: increment(-price),
            };

            // If first plan and has referrer, give bonuses
            if (isFirstPlan && hasReferrer) {
                updateData.balance = increment(-price + 5); // Deduct price but add 5 taka bonus
                updateData.totalEarnings = increment(5);
                updateData.firstPlanBonusGiven = true;

                // Update current user
                await updateDoc(userRef, updateData);

                // Give bonus to referrer and create transaction record
                const referrerRef = doc(db, "users", hasReferrer);
                await updateDoc(referrerRef, {
                    balance: increment(5),
                    totalEarnings: increment(5)
                });

                // Create referral bonus transaction for current user
                await addDoc(collection(db, "referralBonuses"), {
                    userId: user.uid,
                    phoneNumber: userData.phoneNumber,
                    amount: 5,
                    type: "referred_user_bonus",
                    description: "প্রথম প্ল্যান কেনায় রেফারেল বোনাস",
                    status: "success",
                    createdAt: purchaseDate.toISOString()
                });

                // Create referral bonus transaction for referrer
                const referrerDoc = await getDoc(referrerRef);
                if (referrerDoc.exists()) {
                    const referrerData = referrerDoc.data();
                    await addDoc(collection(db, "referralBonuses"), {
                        userId: hasReferrer,
                        phoneNumber: referrerData.phoneNumber,
                        amount: 5,
                        type: "referrer_bonus",
                        description: `${userData.phoneNumber} প্রথম প্ল্যান কিনেছে`,
                        status: "success",
                        createdAt: purchaseDate.toISOString()
                    });
                }
            } else {
                // No bonus, just update normally
                await updateDoc(userRef, updateData);
            }

            // Save to planPurchases collection for history tracking
            await addDoc(collection(db, "planPurchases"), {
                userId: user?.uid,
                ...planPurchase,
                createdAt: purchaseDate.toISOString(),
            });

            const bonusMessage = (isFirstPlan && hasReferrer) ? " উভয়ে ৫ টাকা বোনাস পেয়েছেন!" : "";
            showToast(`VIP ${level} সফলভাবে ক্রয় হয়েছে!${bonusMessage}`, "success");

            // Refresh user data
            await refreshUserData();

            setLoading(false);
            setShowConfirm(false);
        } catch (error) {
            console.error("Purchase error:", error);
            setLoading(false);
            setShowConfirm(false);
            showToast("ক্রয় ব্যর্থ হয়েছে!", "error");
        }
    };

    // Check if this plan is already active for the current user
    const isAlreadyActive = userData?.activePlans?.some(
        (p: any) => p.level === level && p.isActive && new Date(p.expiryDate) > new Date()
    );

    return (
        <>
            <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm transition-all duration-300 hover:shadow-[0_0_20px_rgba(132,204,22,0.2)] hover:border-primary/50 hover:-translate-y-1 relative">
                {/* Status Badge for Upcoming Plans */}
                {status === "upcoming" && (
                    <div className="absolute top-2 right-2 z-10">
                        <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-500/30">
                            আসছে শীঘ্রই
                        </span>
                    </div>
                )}

                <div className="p-4 flex items-center gap-4 border-b border-border/50">
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center p-1">
                        <Image
                            src="/applogo.png"
                            alt="Aldila Logo"
                            width={48}
                            height={48}
                            className="w-full h-full object-contain"
                        />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">Aldila Vip {level}</h3>
                </div>

                <div className="p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-y-2 text-sm">
                        <div className="text-muted-foreground">দৈনিক ইনকাম</div>
                        <div className="text-primary font-bold text-right">৳{dailyIncome.toFixed(2)}</div>

                        <div className="text-muted-foreground">মোট রিটার্ন</div>
                        <div className="text-right font-medium">৳{totalRevenue.toLocaleString()}</div>

                        <div className="text-muted-foreground">মেয়াদ</div>
                        <div className="text-right font-medium">{validity} দিন</div>
                    </div>
                </div>

                <div className="p-4 bg-muted/20 flex items-center justify-between">
                    <div className="text-primary font-bold text-lg">৳{price.toLocaleString()}</div>
                    {status === "upcoming" ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-yellow-400 mb-1">শীঘ্রই আসছে</span>
                            <button
                                disabled
                                className="bg-muted/30 text-muted-foreground px-6 py-2 rounded-full font-bold text-sm cursor-not-allowed"
                                title="এই প্ল্যানটি এখনও উপলব্ধ নয়"
                            >
                                আসছে শীঘ্রই
                            </button>
                        </div>
                    ) : isAlreadyActive ? (
                        <div className="flex flex-col items-end">
                            <span className="text-xs text-muted-foreground mb-1">ইতিমধ্যে সক্রিয়</span>
                            <button
                                disabled
                                className="bg-muted/30 text-muted-foreground px-6 py-2 rounded-full font-bold text-sm cursor-not-allowed"
                            >
                                ক্রয় করা হয়েছে
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={() => setShowConfirm(true)}
                            className="bg-primary text-primary-foreground px-6 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-opacity"
                        >
                            কিনুন ৳{price.toLocaleString()}
                        </button>
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl border border-border p-6 max-w-sm w-full space-y-4 animate-in fade-in zoom-in duration-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-bold text-primary">ক্রয় নিশ্চিত করুন</h3>
                            <button
                                onClick={() => setShowConfirm(false)}
                                className="text-muted-foreground hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            <div className="bg-muted/20 p-4 rounded-lg space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">প্যাকেজ:</span>
                                    <span className="font-bold">Aldila VIP {level}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">মূল্য:</span>
                                    <span className="font-bold text-primary text-lg">৳{price.toLocaleString()}</span>
                                </div>
                            </div>

                            <p className="text-sm text-muted-foreground text-center">
                                আপনার ওয়ালেট থেকে <span className="text-primary font-bold">৳{price.toLocaleString()}</span> টাকা কেটে নেওয়া হবে।
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                                className="flex-1 bg-muted/30 text-white font-bold py-3 rounded-xl hover:bg-muted/40 transition-colors disabled:opacity-50"
                            >
                                বাতিল
                            </button>
                            <button
                                onClick={handlePurchase}
                                disabled={loading}
                                className="flex-1 bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
                            >
                                {loading ? "প্রসেস হচ্ছে..." : "নিশ্চিত করুন"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
