"use client";

import { ArrowLeft, Calendar, Clock, CheckCircle, Star } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function PlanPage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    // Check authentication
    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // If loading or not authenticated
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

    if (!user || !userData) {
        return null;
    }

    // Get active plans from userData
    const activePlans = userData?.activePlans?.filter((plan: any) => plan.isActive) || [];
    const hasActivePlan = activePlans.length > 0;

    // Helper function to format date
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('bn-BD', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    // Helper function to calculate days remaining
    const getDaysRemaining = (expiryDateString: string) => {
        const expiryDate = new Date(expiryDateString);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4 text-white mb-6">
                <Link href="/profile">
                    <ArrowLeft className="w-6 h-6" />
                </Link>
                <h1 className="text-xl font-bold text-primary">প্ল্যান বিবরণ</h1>
            </div>

            {hasActivePlan ? (
                <>
                    {/* Active Plans */}
                    {activePlans.map((plan: any, index: number) => {
                        const daysRemaining = getDaysRemaining(plan.expiryDate);

                        return (
                            <div key={plan.planId || index} className="bg-gradient-to-br from-primary/20 to-primary/5 p-6 rounded-xl border-2 border-primary/50 shadow-lg space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Star className="w-6 h-6 text-primary fill-primary" />
                                        <h2 className="text-2xl font-bold text-white">VIP {plan.level}</h2>
                                    </div>
                                    <div className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-bold">
                                        সক্রিয়
                                    </div>
                                </div>

                                <div className="bg-card/50 p-4 rounded-lg space-y-3">
                                    {/* Purchase Date */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">ক্রয়ের তারিখ:</span>
                                        </div>
                                        <span className="font-bold text-white">{formatDate(plan.purchaseDate)}</span>
                                    </div>

                                    {/* Expiry Date */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Calendar className="w-4 h-4" />
                                            <span className="text-sm">মেয়াদ শেষ:</span>
                                        </div>
                                        <span className="font-bold text-white">{formatDate(plan.expiryDate)}</span>
                                    </div>

                                    {/* Days Remaining */}
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm">অবশিষ্ট দিন:</span>
                                        </div>
                                        <span className={`font-bold text-lg ${daysRemaining > 10 ? 'text-primary' :
                                            daysRemaining > 3 ? 'text-yellow-500' : 'text-red-500'
                                            }`}>
                                            {daysRemaining} দিন
                                        </span>
                                    </div>

                                    {/* Price */}
                                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                                        <span className="text-muted-foreground text-sm">প্ল্যান মূল্য:</span>
                                        <span className="font-bold text-primary text-lg">৳{plan.price.toLocaleString()}</span>
                                    </div>
                                </div>

                                {/* Renewal Info */}
                                {daysRemaining < 7 && (
                                    <div className="bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl">
                                        <p className="text-yellow-500 text-sm text-center">
                                            ⚠️ আপনার প্ল্যান শীঘ্রই মেয়াদ শেষ হবে। প্রোডাক্ট পেজ থেকে নতুন প্ল্যান ক্রয় করুন।
                                        </p>
                                    </div>
                                )}
                            </div>
                        );
                    })}

                    {/* Plan Benefits */}
                    <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                        <h3 className="text-lg font-bold text-primary flex items-center gap-2">
                            <CheckCircle className="w-5 h-5" />
                            প্ল্যান সুবিধা
                        </h3>
                        <ul className="space-y-3">
                            {[
                                "দৈনিক বোনাস পান",
                                "বিশেষ টাস্ক এক্সেস",
                                "দ্রুত উইথড্র প্রসেসিং",
                                "অগ্রাধিকার সাপোর্ট",
                                "এক্সট্রা রেফার বোনাস"
                            ].map((benefit, i) => (
                                <li key={i} className="flex items-center gap-3 text-sm">
                                    <div className="w-2 h-2 bg-primary rounded-full"></div>
                                    <span className="text-muted-foreground">{benefit}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Buy New Plan Button */}
                    <Link
                        href="/"
                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                    >
                        <Star className="w-5 h-5" />
                        নতুন প্ল্যান কিনুন
                    </Link>
                </>
            ) : (
                <>
                    {/* No Active Plan */}
                    <div className="bg-card p-8 rounded-xl border border-border text-center space-y-4">
                        <div className="w-20 h-20 bg-muted/20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Star className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <h2 className="text-xl font-bold text-white">কোনো সক্রিয় প্ল্যান নেই</h2>
                        <p className="text-muted-foreground text-sm">
                            একটি VIP প্ল্যান ক্রয় করে বিশেষ সুবিধা উপভোগ করুন
                        </p>
                    </div>

                    {/* Buy Plan Button */}
                    <Link
                        href="/"
                        className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl hover:opacity-90 transition-opacity shadow-[0_0_20px_rgba(132,204,22,0.3)] flex items-center justify-center gap-2"
                    >
                        <Star className="w-5 h-5" />
                        প্ল্যান ক্রয় করুন
                    </Link>
                </>
            )}
        </div>
    );
}
