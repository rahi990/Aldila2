"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Users, UserCheck } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ReferredUser {
    uid: string;
    phoneNumber: string;
    userId: string;
    createdAt: string;
    isActive: boolean;
    totalPlanCost: number;
}

export default function TeamPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const { showToast } = useToast();
    const [referredUsersList, setReferredUsersList] = useState<ReferredUser[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(false);
    const [totalPlanCost, setTotalPlanCost] = useState(0);
    const [availablePoints, setAvailablePoints] = useState(0);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Fetch referred users data
    useEffect(() => {
        const fetchReferredUsers = async () => {
            if (!userData?.referredUsers || userData.referredUsers.length === 0) {
                setTotalPlanCost(0);
                setAvailablePoints(0);
                return;
            }

            setIsLoadingList(true);
            try {
                const usersData: ReferredUser[] = [];
                let totalCost = 0;

                for (const uid of userData.referredUsers) {
                    const userDoc = await getDoc(doc(db, "users", uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();

                        // Calculate active plan costs for this user
                        const activePlans = data.activePlans || [];
                        const userPlanCost = activePlans
                            .filter((p: any) => p.isActive && new Date(p.expiryDate) > new Date())
                            .reduce((sum: number, plan: any) => sum + (plan.price || 0), 0);

                        usersData.push({
                            uid: uid,
                            phoneNumber: data.phoneNumber,
                            userId: data.userId,
                            createdAt: data.createdAt,
                            isActive: data.isActive || false,
                            totalPlanCost: userPlanCost
                        });

                        totalCost += userPlanCost;
                    }
                }
                setReferredUsersList(usersData);
                setTotalPlanCost(totalCost);

                // Calculate available points
                const usedPoints = userData.planCostPointsUsed || 0;
                const available = totalCost - usedPoints;
                setAvailablePoints(available);
            } catch (error) {
                console.error("Error fetching referred users:", error);
            } finally {
                setIsLoadingList(false);
            }
        };

        if (userData) {
            fetchReferredUsers();
        }
    }, [userData]);

    const copyReferralLink = () => {
        if (!userData?.referralCode) return;

        const link = `${window.location.origin}/register?ref=${userData.referralCode}`;
        navigator.clipboard.writeText(link);
        showToast("লিংক কপি করা হয়েছে!", "success");
    };

    const activeUsers = referredUsersList.filter(u => u.isActive);
    const inactiveUsers = referredUsersList.filter(u => !u.isActive);

    if (loading || !userData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="pb-20 p-4 space-y-6">
            <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold">রেফার</h1>
                <p className="text-muted-foreground text-sm">বন্ধুদের আমন্ত্রণ জানান এবং পুরস্কার অর্জন করুন</p>
            </div>

            {/* Top Stats */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center h-24">
                    <span className="text-primary text-2xl font-bold">{userData.referCount || 0}</span>
                    <span className="text-muted-foreground text-xs">মোট সদস্য</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center h-24">
                    <span className="text-primary text-2xl font-bold">৳{userData.totalEarnings || 0}</span>
                    <span className="text-muted-foreground text-xs">মোট বোনাস</span>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border flex flex-col items-center justify-center h-24">
                    <span className="text-primary text-2xl font-bold">{availablePoints}</span>
                    <span className="text-muted-foreground text-xs text-center">Your Total Earned Plan Cost</span>
                </div>
            </div>

            {/* Referral Link */}
            <div className="bg-card p-4 rounded-xl border border-border space-y-4">
                <h3 className="text-center font-bold">আপনার রেফারেল লিংক</h3>
                <div className="bg-muted p-3 rounded-lg break-all text-xs text-center text-muted-foreground">
                    {`${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${userData.referralCode || '...'}`}
                </div>
                <button
                    onClick={copyReferralLink}
                    className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-lg flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Copy className="w-4 h-4" />
                    লিংক কপি করুন
                </button>
            </div>

            {/* Users Lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Inactive Users - Left Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <Users className="w-5 h-5 text-muted-foreground" />
                        <h2 className="font-bold text-lg">Inactive Users</h2>
                        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                            {inactiveUsers.length}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {isLoadingList ? (
                            <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
                        ) : inactiveUsers.length > 0 ? (
                            inactiveUsers.map((user) => (
                                <div key={user.uid} className="bg-card p-3 rounded-xl border border-border flex items-center justify-between opacity-80">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-muted text-muted-foreground flex items-center justify-center">
                                            <Users className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{user.phoneNumber}</div>
                                            <div className="text-xs text-muted-foreground">ID: {user.userId}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-[10px] text-muted-foreground">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground bg-card/50 rounded-xl border border-border border-dashed text-sm">
                                কোনো Inactive সদস্য নেই
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Users - Right Side */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-border">
                        <UserCheck className="w-5 h-5 text-primary" />
                        <h2 className="font-bold text-lg">Active Users</h2>
                        <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                            {activeUsers.length}
                        </span>
                    </div>

                    <div className="space-y-3">
                        {isLoadingList ? (
                            <div className="text-center py-8 text-muted-foreground">লোড হচ্ছে...</div>
                        ) : activeUsers.length > 0 ? (
                            activeUsers.map((user) => (
                                <div key={user.uid} className="bg-card p-3 rounded-xl border border-primary/20 shadow-sm flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                            <UserCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm">{user.phoneNumber}</div>
                                            <div className="text-xs text-muted-foreground">ID: {user.userId}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-bold text-primary">
                                            ৳{user.totalPlanCost}
                                        </div>
                                        <div className="text-[10px] text-muted-foreground">
                                            Plan Cost
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-muted-foreground bg-card/50 rounded-xl border border-border border-dashed text-sm">
                                কোনো Active সদস্য নেই
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
