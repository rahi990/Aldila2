"use client";

import { useState, useEffect, Suspense } from "react";
import { ArrowLeft, Copy, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { collection, doc, getDoc, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { sendTelegramNotification, formatDepositNotification } from "@/lib/telegram";
import Image from "next/image";

interface PaymentMethod {
    id: string;
    type: string;
    name: string;
    accountNumber: string;
    accountName: string;
    instructions?: string;
    isActive: boolean;
}

function MethodPaymentPageContent() {
    const router = useRouter();
    const params = useParams();
    const searchParams = useSearchParams();
    const methodId = params.methodId as string;
    const amount = searchParams.get("amount") || "0";
    const { showToast } = useToast();
    const { user, userData } = useAuth();

    const [method, setMethod] = useState<PaymentMethod | null>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [senderNumber, setSenderNumber] = useState("");
    const [transactionId, setTransactionId] = useState("");

    useEffect(() => {
        fetchMethodDetails();
    }, [methodId]);

    const fetchMethodDetails = async () => {
        try {
            const methodDoc = await getDoc(doc(db, "paymentMethods", methodId));
            if (methodDoc.exists()) {
                setMethod({
                    id: methodDoc.id,
                    ...methodDoc.data()
                } as PaymentMethod);
            } else {
                showToast("পেমেন্ট মেথড পাওয়া যায়নি", "error");
                router.push("/recharge");
            }
        } catch (error) {
            console.error("Error fetching method:", error);
            showToast("পেমেন্ট মেথড লোড করতে ব্যর্থ", "error");
        } finally {
            setLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("কপি হয়েছে!", "success");
    };

    const handleSubmit = async () => {
        if (!transactionId || !senderNumber) {
            showToast("সব তথ্য পূরণ করুন", "error");
            return;
        }

        if (!user || !userData) {
            showToast("লগইন করুন", "error");
            router.push("/login");
            return;
        }

        setSubmitting(true);

        try {
            await addDoc(collection(db, "depositRequests"), {
                userId: user.uid,
                phoneNumber: userData.phoneNumber,
                amount: parseFloat(amount),
                method: method?.type,
                methodName: method?.name,
                accountNumber: method?.accountNumber,
                senderNumber,
                transactionId,
                status: "pending",
                createdAt: new Date().toISOString(),
            });

            // Send Telegram Notification
            const notificationMessage = formatDepositNotification({
                phoneNumber: senderNumber,
                amount: parseFloat(amount),
                method: method?.type || "Unknown",
                trxNumber: transactionId
            });

            console.log("Sending Telegram notification from [methodId] page:", notificationMessage);

            // Send notification without blocking
            sendTelegramNotification(notificationMessage).catch((err: any) =>
                console.error("Failed to send telegram notification:", err)
            );

            showToast("রিকোয়েস্ট সফলভাবে জমা হয়েছে!", "success");

            // Delay redirect to allow telegram notification to send
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (error) {
            console.error("Error submitting deposit:", error);
            showToast("রিকোয়েস্ট জমা দিতে ব্যর্থ", "error");
        } finally {
            setSubmitting(false);
        }
    };

    const getMethodColor = (type: string) => {
        switch (type.toLowerCase()) {
            case "bkash":
                return {
                    bg: "bg-gradient-to-br from-pink-600 to-pink-700",
                    bgLight: "bg-pink-500/10",
                    border: "border-pink-500",
                    text: "text-pink-500",
                };
            case "nagad":
                return {
                    bg: "bg-gradient-to-br from-orange-600 to-orange-700",
                    bgLight: "bg-orange-500/10",
                    border: "border-orange-500",
                    text: "text-orange-500",
                };
            case "rocket":
                return {
                    bg: "bg-gradient-to-br from-purple-600 to-purple-700",
                    bgLight: "bg-purple-500/10",
                    border: "border-purple-500",
                    text: "text-purple-500",
                };
            default:
                return {
                    bg: "bg-gradient-to-br from-blue-600 to-blue-700",
                    bgLight: "bg-blue-500/10",
                    border: "border-blue-500",
                    text: "text-blue-500",
                };
        }
    };

    const getMethodLogo = (type: string) => {
        const lowerType = type.toLowerCase();
        if (lowerType === "bkash" || lowerType === "nagad") {
            return `/assets/${lowerType}.png`;
        }
        return null;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!method) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-muted-foreground">পেমেন্ট মেথড পাওয়া যায়নি</p>
                    <Link
                        href="/recharge"
                        className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 mt-4"
                    >
                        ফিরে যান
                    </Link>
                </div>
            </div>
        );
    }

    const colors = getMethodColor(method.type);
    const logo = getMethodLogo(method.type);

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Header */}
            <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <Link href={`/recharge/payment?amount=${amount}`}>
                        <ArrowLeft className="w-6 h-6 text-white" />
                    </Link>
                    <h1 className="text-xl font-bold text-white">পেমেন্ট সম্পন্ন করুন</h1>
                </div>
            </div>

            {/* Method Header Card */}
            <div className="p-4">
                <div className={`${colors.bg} rounded-xl p-6 shadow-lg`}>
                    <div className="flex items-center justify-between mb-4">
                        {logo ? (
                            <div className="bg-white rounded-lg p-3">
                                <Image
                                    src={logo}
                                    alt={method.name}
                                    width={80}
                                    height={40}
                                    className="h-10 w-auto object-contain"
                                />
                            </div>
                        ) : (
                            <div className="bg-white/20 rounded-lg p-3">
                                <span className="text-white font-bold text-2xl">
                                    {method.name.charAt(0)}
                                </span>
                            </div>
                        )}

                        <div className="text-right">
                            <p className="text-white/80 text-sm mb-1">পরিমাণ</p>
                            <p className="text-3xl font-bold text-white">৳ {amount}</p>
                        </div>
                    </div>

                    <div className="text-center">
                        <h2 className="text-white font-bold text-lg">{method.name}</h2>
                    </div>
                </div>
            </div>

            {/* Instructions */}
            <div className="px-4 mb-4">
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 space-y-3">
                    <h3 className="font-bold text-blue-400 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" />
                        নির্দেশাবলী
                    </h3>
                    <ol className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-400">১.</span>
                            <span>নিচের নম্বরে {method.name} থেকে ৳{amount} টাকা "Cash Out" করুন</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-400">২.</span>
                            <span>পাঠানোর পর আপনার নম্বর এবং ট্রানজেকশন আইডি নিচে দিন</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-400">৩.</span>
                            <span>"রিকোয়েস্ট জমা দিন" বাটনে ক্লিক করুন</span>
                        </li>
                        <li className="flex gap-2">
                            <span className="font-bold text-blue-400">৪.</span>
                            <span>৫-১০ মিনিটের মধ্যে ব্যালেন্স আপডেট হবে</span>
                        </li>
                    </ol>
                </div>
            </div>

            {/* Payment Details */}
            <div className="px-4 space-y-4">
                {/* Receiver Number */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        প্রাপকের নম্বর (টাকা পাঠান এই নম্বরে)
                    </label>
                    <div className="flex items-center gap-2">
                        <div className={`flex-1 ${colors.bgLight} border ${colors.border} rounded-lg px-4 py-3`}>
                            <p className={`font-mono font-bold text-lg ${colors.text}`}>
                                {method.accountNumber}
                            </p>
                        </div>
                        <button
                            onClick={() => copyToClipboard(method.accountNumber)}
                            className={`${colors.bg} p-3 rounded-lg hover:opacity-90 transition-opacity`}
                        >
                            <Copy className="w-5 h-5 text-white" />
                        </button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                        অ্যাকাউন্ট নাম: {method.accountName}
                    </p>
                </div>

                {/* Amount Display */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        পাঠানোর পরিমাণ
                    </label>
                    <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3">
                        <p className="font-bold text-2xl text-primary">৳ {amount}</p>
                    </div>
                </div>

                {/* Sender Number Input */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        প্রেরক নম্বর *
                    </label>
                    <input
                        type="tel"
                        value={senderNumber}
                        onChange={(e) => setSenderNumber(e.target.value)}
                        placeholder="যে নম্বর থেকে টাকা পাঠিয়েছেন (01XXXXXXXXX)"
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        আপনার {method.name} নম্বর যেখান থেকে টাকা পাঠিয়েছেন
                    </p>
                </div>

                {/* Transaction ID Input */}
                <div className="bg-card border border-border rounded-xl p-4">
                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                        ট্রানজেকশন আইডি (TrxID) *
                    </label>
                    <input
                        type="text"
                        value={transactionId}
                        onChange={(e) => setTransactionId(e.target.value)}
                        placeholder="উদাহরণ: BGD123456789"
                        className="w-full bg-background border border-border rounded-lg px-4 py-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                        {method.name} মেসেজে পাওয়া ট্রানজেকশন আইডি দিন
                    </p>
                </div>

                {/* Submit Button */}
                <button
                    onClick={handleSubmit}
                    disabled={submitting || !senderNumber || !transactionId}
                    className={`w-full ${colors.bg} text-white font-bold py-4 rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg flex items-center justify-center gap-2`}
                >
                    {submitting ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                            অপেক্ষা করুন...
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-5 h-5" />
                            রিকোয়েস্ট জমা দিন
                        </>
                    )}
                </button>
            </div>

            {/* Warning */}
            <div className="px-4 mt-4">
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <p className="text-xs text-yellow-400 font-bold mb-2">⚠️ সতর্কতা</p>
                    <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                        <li>সঠিক নম্বর এবং ট্রানজেকশন আইডি নিশ্চিত করুন</li>
                        <li>ভুল তথ্য দিলে রিকোয়েস্ট বাতিল হবে</li>
                        <li>একই ট্রানজেকশন আইডি দুইবার ব্যবহার করবেন না</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default function MethodPaymentPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        }>
            <MethodPaymentPageContent />
        </Suspense>
    );
}
