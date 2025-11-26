"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc, arrayUnion, increment, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface PlanPurchase {
    planId: string;
    level: number;
    price: number;
    dailyIncome: number;
    totalRevenue: number;
    purchaseDate: string;
    expiryDate: string;
    isActive: boolean;
}

interface UserData {
    phoneNumber: string;
    balance: number;
    userId: string;
    createdAt: string;

    // Referral fields
    referralCode: string;
    referredBy?: string;
    referredUsers: string[];
    referCount: number;
    activeReferCount: number;

    // Plan fields
    activePlans: PlanPurchase[];
    planHistory: PlanPurchase[];
    planLevel: number;
    isActive: boolean;

    // Earnings
    totalEarnings: number;

    // Admin field
    isAdmin?: boolean;

    // Ban field
    isBanned?: boolean;

    // Points
    planCostPointsUsed?: number;

    // First plan bonus tracking
    firstPlanBonusGiven?: boolean;

    // Wallets
    wallets?: Array<{
        id: string;
        name: string;
        method: string;
        accountNumber: string;
        status: string;
    }>;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
    logout: () => Promise<void>;
    refreshUserData: () => Promise<void>;
    updateBalance: (amount: number) => Promise<void>;
    purchasePlan: (plan: PlanPurchase) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);

    // Fetch user data from Firestore
    const fetchUserData = async (uid: string) => {
        try {
            const userDoc = await getDoc(doc(db, "users", uid));
            if (userDoc.exists()) {
                setUserData(userDoc.data() as UserData);
            }
        } catch (error) {
            console.error("Error fetching user data:", error);
        }
    };

    // Refresh user data
    const refreshUserData = async () => {
        if (user) {
            await fetchUserData(user.uid);
        }
    };

    // Update balance
    const updateBalance = async (amount: number) => {
        if (!user) return;

        try {
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                balance: increment(amount),
                totalEarnings: increment(amount > 0 ? amount : 0)
            });
            await refreshUserData();
        } catch (error) {
            console.error("Error updating balance:", error);
            throw error;
        }
    };

    // Purchase plan
    const purchasePlan = async (plan: PlanPurchase) => {
        if (!user || !userData) return;

        try {
            const userRef = doc(db, "users", user.uid);

            // Update user document
            await updateDoc(userRef, {
                balance: increment(-plan.price),
                activePlans: arrayUnion(plan),
                planHistory: arrayUnion(plan),
                isActive: true
            });

            await refreshUserData();
        } catch (error) {
            console.error("Error purchasing plan:", error);
            throw error;
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUser(currentUser);

            if (currentUser) {
                // Setup real-time listener for user data
                const userRef = doc(db, "users", currentUser.uid);

                // Real-time listener - will automatically update when data changes
                const unsubscribeSnapshot = onSnapshot(userRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        setUserData(docSnapshot.data() as UserData);
                    } else {
                        setUserData(null);
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user data:", error);
                    setLoading(false);
                });

                // Return cleanup function for snapshot listener
                return () => unsubscribeSnapshot();
            } else {
                setUserData(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
            setUserData(null);
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    return (
        <AuthContext.Provider value={{
            user,
            userData,
            loading,
            logout,
            refreshUserData,
            updateBalance,
            purchasePlan
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
