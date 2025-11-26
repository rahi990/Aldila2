"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { StatsCard } from "@/components/StatsCard";
import { VipCard } from "@/components/VipCard";
import { QuickActions } from "@/components/QuickActions";
import { PieChart } from "lucide-react";
import { Notice } from "@/components/Notice";
import { CompletedWithdrawals } from "@/components/CompletedWithdrawals";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  link?: string;
  order: number;
  isActive: boolean;
}

interface Plan {
  id: string;
  level: number;
  dailyIncome: number;
  totalRevenue: number;
  price: number;
  validity: number;
  status: "active" | "upcoming" | "disabled";
  maxPurchase?: number;
  isActive: boolean;
}

export default function Home() {
  const { user, userData, loading } = useAuth();
  const router = useRouter();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;

    // Setup real-time listener for active banners
    const bannersQuery = query(
      collection(db, "banners"),
      where("isActive", "==", true)
    );

    const unsubscribeBanners = onSnapshot(bannersQuery, (snapshot) => {
      const bannersData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Banner))
        .sort((a, b) => a.order - b.order);
      setBanners(bannersData);
      setDataLoading(false);
    }, (error) => {
      console.error("Error fetching banners:", error);
      setDataLoading(false);
    });

    // Setup real-time listener for active and upcoming plans (exclude disabled)
    const plansQuery = query(
      collection(db, "plans"),
      where("status", "in", ["active", "upcoming"])
    );

    const unsubscribePlans = onSnapshot(plansQuery, (snapshot) => {
      const plansData = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as Plan))
        .sort((a, b) => a.level - b.level);
      setPlans(plansData);
    }, (error) => {
      console.error("Error fetching plans:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      unsubscribeBanners();
      unsubscribePlans();
    };
  }, [user]);

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">লোড হচ্ছে...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, don't render (will redirect)
  if (!user || !userData) {
    return null;
  }

  return (
    <div className="p-4 space-y-6">
      {/* Banner Slider */}
      {dataLoading ? (
        <div className="w-full h-40 bg-muted rounded-xl flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : banners.length > 0 ? (
        <div className="w-full h-40 bg-muted rounded-xl overflow-hidden relative">
          <img
            src={banners[0].imageUrl}
            alt={banners[0].title || "Banner"}
            className="w-full h-full object-cover"
            onClick={() => {
              if (banners[0].link) {
                window.open(banners[0].link, "_blank");
              }
            }}
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-muted rounded-xl flex items-center justify-center text-muted-foreground border border-border">
          <span className="text-sm">No banners available</span>
        </div>
      )}

      {/* Scrolling Notice */}
      <Notice text="আমাদের প্ল্যাটফর্মে স্বাগতম! নিরাপদ ও লাভজনক ইনভেস্টমেন্ট পার্টনার! 🚀" />

      {/* Quick Actions */}
      <QuickActions />

      {/* Stats Grid - Active Plans Income */}
      <div className="bg-[#2d3b2d] p-4 rounded-xl border border-primary/20 space-y-4">
        <div className="flex items-center gap-2 text-primary">
          <PieChart className="w-5 h-5" />
          <span className="font-bold">ব্যালেন্স ওভারভিউ</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatsCard
            label="মোট ব্যালেন্স"
            value={`৳${userData.balance.toFixed(2)}`}
            className="bg-white/5 border-none text-white"
          />
          <StatsCard
            label="রেফার আয়"
            value={`৳${(userData.totalEarnings || 0).toFixed(2)}`}
            className="bg-white/5 border-none text-white"
          />
          {/* Show active plans with task income */}
          {userData.activePlans?.filter((p: any) => p.isActive && new Date(p.expiryDate) > new Date()).map((plan: any) => {
            // Get plan income from localStorage
            const planIncome = typeof window !== 'undefined'
              ? JSON.parse(localStorage.getItem("plan_income") || "{}")[plan.planId] || 0
              : 0;

            return (
              <StatsCard
                key={plan.planId}
                label={`VIP ${plan.level} আয়`}
                value={`৳${planIncome.toFixed(2)}`}
                className="bg-white/5 border-none text-white"
              />
            );
          })}
        </div>
      </div>

      {/* VIP Cards Section */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">VIP প্ল্যান</h2>
        {dataLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          </div>
        ) : plans.length > 0 ? (
          plans.map((plan) => (
            <VipCard
              key={plan.id}
              level={plan.level}
              dailyIncome={plan.dailyIncome}
              totalRevenue={plan.totalRevenue}
              price={plan.price}
              validity={plan.validity}
              maxPurchase={plan.maxPurchase}
              status={plan.status}
            />
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            No plans available at the moment
          </div>
        )}
      </div>

      {/* Completed Withdrawals Section */}
      <CompletedWithdrawals />
    </div>
  );
}
