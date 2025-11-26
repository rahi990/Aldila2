"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Users, Award, DollarSign, TrendingUp, Clock, CheckCircle, CheckSquare } from "lucide-react";

interface DashboardStats {
    totalUsers: number;
    activeUsers: number;
    totalPlans: number;
    pendingDeposits: number;
    pendingWithdraws: number;
    todayEarnings: number;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats>({
        totalUsers: 0,
        activeUsers: 0,
        totalPlans: 0,
        pendingDeposits: 0,
        pendingWithdraws: 0,
        todayEarnings: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch total users
            const usersSnapshot = await getDocs(collection(db, "users"));
            const totalUsers = usersSnapshot.size;
            const activeUsers = usersSnapshot.docs.filter((doc) => doc.data().isActive).length;

            // Fetch pending deposits
            const depositsQuery = query(
                collection(db, "depositRequests"),
                where("status", "==", "pending")
            );
            const depositsSnapshot = await getDocs(depositsQuery);
            const pendingDeposits = depositsSnapshot.size;

            // Fetch pending withdraws
            const withdrawsQuery = query(
                collection(db, "withdrawRequests"),
                where("status", "==", "pending")
            );
            const withdrawsSnapshot = await getDocs(withdrawsQuery);
            const pendingWithdraws = withdrawsSnapshot.size;

            setStats({
                totalUsers,
                activeUsers,
                totalPlans: 0, // Will update when we add plan management
                pendingDeposits,
                pendingWithdraws,
                todayEarnings: 0, // Calculate based on approved deposits
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({
        title,
        value,
        icon: Icon,
        color
    }: {
        title: string;
        value: number | string;
        icon: any;
        color: string;
    }) => (
        <div className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${color}`}>
                    <Icon className="w-6 h-6" />
                </div>
            </div>
            <div className="space-y-1">
                <p className="text-sm text-muted-foreground">{title}</p>
                <p className="text-3xl font-bold">{value}</p>
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-primary">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Welcome to Aldila Admin Panel</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                    title="Total Users"
                    value={stats.totalUsers}
                    icon={Users}
                    color="bg-blue-500/20 text-blue-500"
                />
                <StatCard
                    title="Active Users"
                    value={stats.activeUsers}
                    icon={CheckCircle}
                    color="bg-green-500/20 text-green-500"
                />
                <StatCard
                    title="Total Plans Sold"
                    value={stats.totalPlans}
                    icon={Award}
                    color="bg-purple-500/20 text-purple-500"
                />
                <StatCard
                    title="Pending Deposits"
                    value={stats.pendingDeposits}
                    icon={Clock}
                    color="bg-yellow-500/20 text-yellow-500"
                />
                <StatCard
                    title="Pending Withdraws"
                    value={stats.pendingWithdraws}
                    icon={DollarSign}
                    color="bg-orange-500/20 text-orange-500"
                />
                <StatCard
                    title="Today's Earnings"
                    value={`৳${stats.todayEarnings}`}
                    icon={TrendingUp}
                    color="bg-primary/20 text-primary"
                />
            </div>

            {/* Quick Actions */}
            <div className="bg-card p-6 rounded-xl border border-border">
                <h2 className="text-xl font-bold mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <a
                        href="/aldilaadmin/tasks"
                        className="p-4 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors text-center"
                    >
                        <CheckSquare className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">Manage Tasks</p>
                    </a>
                    <a
                        href="/aldilaadmin/plans"
                        className="p-4 bg-primary/10 border border-primary/30 rounded-lg hover:bg-primary/20 transition-colors text-center"
                    >
                        <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
                        <p className="font-medium">Manage Plans</p>
                    </a>
                    <a
                        href="/aldilaadmin/deposits"
                        className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors text-center"
                    >
                        <DollarSign className="w-8 h-8 mx-auto mb-2 text-yellow-500" />
                        <p className="font-medium">Approve Deposits</p>
                    </a>
                    <a
                        href="/aldilaadmin/withdraws"
                        className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg hover:bg-orange-500/20 transition-colors text-center"
                    >
                        <Clock className="w-8 h-8 mx-auto mb-2 text-orange-500" />
                        <p className="font-medium">Approve Withdraws</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
