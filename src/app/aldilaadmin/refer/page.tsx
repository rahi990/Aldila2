"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, UserCheck, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";

interface ReferredUser {
    uid: string;
    phoneNumber: string;
    userId: string;
    isActive: boolean;
    activePlans?: any[];
    createdAt: string;
}

interface UserData {
    uid: string;
    phoneNumber: string;
    userId: string;
    referralCode: string;
    referredUsers?: string[];
    referCount: number;
}

export default function ReferManagement() {
    const [users, setUsers] = useState<UserData[]>([]);
    const [expandedUser, setExpandedUser] = useState<string | null>(null);
    const [referDetails, setReferDetails] = useState<Record<string, ReferredUser[]>>({});
    const [loading, setLoading] = useState(true);
    const [loadingDetails, setLoadingDetails] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData = querySnapshot.docs.map((doc) => ({
                uid: doc.id,
                ...doc.data(),
            })) as UserData[];

            // Sort by refer count descending
            usersData.sort((a, b) => (b.referCount || 0) - (a.referCount || 0));
            setUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchReferDetails = async (userId: string, referredUserIds: string[]) => {
        if (referDetails[userId]) {
            // Already loaded
            setExpandedUser(expandedUser === userId ? null : userId);
            return;
        }

        setLoadingDetails({ ...loadingDetails, [userId]: true });

        try {
            const referredUsersData: ReferredUser[] = [];
            for (const uid of referredUserIds) {
                const userDoc = await getDoc(doc(db, "users", uid));
                if (userDoc.exists()) {
                    const data = userDoc.data();
                    referredUsersData.push({
                        uid: uid,
                        phoneNumber: data.phoneNumber,
                        userId: data.userId,
                        isActive: data.isActive || false,
                        activePlans: data.activePlans || [],
                        createdAt: data.createdAt
                    });
                }
            }

            setReferDetails({ ...referDetails, [userId]: referredUsersData });
            setExpandedUser(userId);
        } catch (error) {
            console.error("Error fetching refer details:", error);
        } finally {
            setLoadingDetails({ ...loadingDetails, [userId]: false });
        }
    };

    const getTotalPlanPurchase = (user: ReferredUser) => {
        if (!user.activePlans || user.activePlans.length === 0) return 0;

        return user.activePlans
            .filter((p: any) => p.isActive && new Date(p.expiryDate) > new Date())
            .reduce((total: number, plan: any) => total + (plan.price || 0), 0);
    };

    const handleUserClick = (user: UserData) => {
        if (!user.referredUsers || user.referredUsers.length === 0) {
            return;
        }

        if (expandedUser === user.uid) {
            setExpandedUser(null);
        } else {
            fetchReferDetails(user.uid, user.referredUsers);
        }
    };

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
                <h1 className="text-3xl font-bold text-primary">Referral Management</h1>
                <p className="text-muted-foreground mt-1">View all users and their referral details</p>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Users className="w-4 h-4" />
                        <span className="text-xs">Total Users</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{users.length}</div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <UserCheck className="w-4 h-4" />
                        <span className="text-xs">Users with Referrals</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {users.filter(u => (u.referCount || 0) > 0).length}
                    </div>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">Total Referrals</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">
                        {users.reduce((sum, u) => sum + (u.referCount || 0), 0)}
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="space-y-3">
                {users.map((user) => {
                    const isExpanded = expandedUser === user.uid;
                    const hasReferrals = user.referredUsers && user.referredUsers.length > 0;
                    const userReferDetails = referDetails[user.uid] || [];
                    const activeReferrals = userReferDetails.filter(r => r.isActive);

                    return (
                        <div key={user.uid} className="bg-card rounded-xl border border-border overflow-hidden">
                            {/* Main User Card */}
                            <div
                                onClick={() => handleUserClick(user)}
                                className={`p-4 ${hasReferrals ? 'cursor-pointer hover:bg-muted/10' : 'cursor-default'} transition-colors`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center">
                                                <Users className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-white">{user.phoneNumber}</h3>
                                                <p className="text-xs text-muted-foreground">ID: {user.userId}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 text-sm">
                                            <span className="text-muted-foreground">
                                                Referral Code: <span className="text-primary font-bold">{user.referralCode}</span>
                                            </span>
                                            <span className="text-muted-foreground">
                                                Total Referrals: <span className="text-primary font-bold">{user.referCount || 0}</span>
                                            </span>
                                        </div>
                                    </div>
                                    {hasReferrals && (
                                        <div className="flex items-center gap-2">
                                            {loadingDetails[user.uid] ? (
                                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                                            ) : (
                                                <>
                                                    {isExpanded ? (
                                                        <ChevronUp className="w-5 h-5 text-primary" />
                                                    ) : (
                                                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Expanded Referral Details */}
                            {isExpanded && userReferDetails.length > 0 && (
                                <div className="border-t border-border bg-muted/5">
                                    <div className="p-4 space-y-3">
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <div className="bg-card p-3 rounded-lg border border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Active Referrals</p>
                                                <p className="text-xl font-bold text-green-500">{activeReferrals.length}</p>
                                            </div>
                                            <div className="bg-card p-3 rounded-lg border border-border">
                                                <p className="text-xs text-muted-foreground mb-1">Total Plan Cost</p>
                                                <p className="text-xl font-bold text-primary">
                                                    ৳{activeReferrals.reduce((sum, r) => sum + getTotalPlanPurchase(r), 0)}
                                                </p>
                                            </div>
                                        </div>

                                        <h4 className="text-sm font-bold text-white mb-2">Referred Users:</h4>
                                        <div className="space-y-2">
                                            {userReferDetails.map((referredUser) => {
                                                const planCost = getTotalPlanPurchase(referredUser);

                                                return (
                                                    <div
                                                        key={referredUser.uid}
                                                        className={`p-3 rounded-lg border ${referredUser.isActive
                                                            ? 'bg-green-500/10 border-green-500/30'
                                                            : 'bg-muted/10 border-border'
                                                            }`}
                                                    >
                                                        <div className="flex items-center justify-between">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    <span className="font-bold text-sm">{referredUser.phoneNumber}</span>
                                                                    {referredUser.isActive ? (
                                                                        <span className="bg-green-500/20 text-green-500 text-xs px-2 py-0.5 rounded-full font-bold">
                                                                            Active
                                                                        </span>
                                                                    ) : (
                                                                        <span className="bg-muted text-muted-foreground text-xs px-2 py-0.5 rounded-full">
                                                                            Inactive
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                <p className="text-xs text-muted-foreground">ID: {referredUser.userId}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    Joined: {new Date(referredUser.createdAt).toLocaleDateString('en-GB')}
                                                                </p>
                                                            </div>
                                                            {referredUser.isActive && planCost > 0 && (
                                                                <div className="text-right">
                                                                    <p className="text-xs text-muted-foreground mb-1">Plan Cost</p>
                                                                    <p className="text-lg font-bold text-primary">৳{planCost}</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
