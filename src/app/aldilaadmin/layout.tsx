"use client";

import { ReactNode, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    CheckSquare,
    Award,
    Users,
    DollarSign,
    CreditCard,
    Image as ImageIcon,
    Settings,
    LogOut,
    Menu,
    X,
    ShieldAlert
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface AdminLayoutProps {
    children: ReactNode;
}

const menuItems = [
    { name: "Dashboard", href: "/aldilaadmin", icon: LayoutDashboard },
    { name: "Tasks", href: "/aldilaadmin/tasks", icon: CheckSquare },
    { name: "Plans", href: "/aldilaadmin/plans", icon: Award },
    { name: "Users", href: "/aldilaadmin/users", icon: Users },
    { name: "Refer", href: "/aldilaadmin/refer", icon: Users },
    { name: "Deposits", href: "/aldilaadmin/deposits", icon: DollarSign },
    { name: "Withdraws", href: "/aldilaadmin/withdraws", icon: CreditCard },
    { name: "Banners", href: "/aldilaadmin/banners", icon: ImageIcon },
    { name: "Payment Methods", href: "/aldilaadmin/payment-methods", icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, userData, loading } = useAuth();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    // Check if user is admin
    useEffect(() => {
        if (!loading) {
            if (!user) {
                // Not logged in, redirect to login
                router.push("/login");
            } else if (userData && !userData.isAdmin) {
                // Logged in but not admin, redirect to homepage
                router.push("/");
            }
        }
    }, [user, userData, loading, router]);

    // Show loading state while checking authentication
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Verifying admin access...</p>
                </div>
            </div>
        );
    }

    // Don't render if not admin (will redirect)
    if (!user || !userData?.isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="text-center space-y-4">
                    <ShieldAlert className="w-16 h-16 text-red-500 mx-auto" />
                    <h2 className="text-2xl font-bold text-white">Access Denied</h2>
                    <p className="text-muted-foreground">You don't have permission to access this area.</p>
                    <p className="text-sm text-muted-foreground">Redirecting to homepage...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex">
            {/* Sidebar */}
            <aside
                className={`fixed lg:sticky top-0 left-0 h-screen w-64 bg-card border-r border-border transition-transform duration-300 z-40 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                    }`}
            >
                <div className="p-6 border-b border-border">
                    <h1 className="text-2xl font-bold text-primary">Admin Panel</h1>
                    <p className="text-sm text-muted-foreground mt-1">Aldila Control Center</p>
                </div>

                <nav className="p-4 space-y-2 overflow-y-auto h-full">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-primary text-primary-foreground shadow-sm"
                                    : "hover:bg-muted text-foreground"
                                    }`}
                            >
                                <item.icon className="w-5 h-5" />
                                <span className="font-medium">{item.name}</span>
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            {/* Mobile Overlay */}
            {sidebarOpen && (
                <div
                    onClick={() => setSidebarOpen(false)}
                    className="lg:hidden fixed inset-0 bg-black/50 z-30"
                />
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Admin Header */}
                <header className="sticky top-0 z-20 bg-card border-b border-border">
                    <div className="flex items-center justify-between px-6 py-4">
                        {/* Left: Sidebar Toggle */}
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <Menu className="w-6 h-6" />
                        </button>

                        {/* Center: Page Title */}
                        <h2 className="text-lg font-bold text-primary">Admin Dashboard</h2>

                        {/* Right: User Info & Actions */}
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-muted-foreground hidden sm:block">
                                {userData?.phoneNumber}
                            </span>
                            <button
                                onClick={() => {
                                    const confirmed = window.confirm("Are you sure you want to leave admin panel?");
                                    if (confirmed) router.push("/");
                                }}
                                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted text-foreground transition-all text-sm"
                            >
                                <LogOut className="w-4 h-4" />
                                <span className="hidden md:inline">Back to Site</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 overflow-auto">
                    <div className="p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
