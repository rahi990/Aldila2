"use client";

import { useState, Suspense } from "react";
import { Copy } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/contexts/AuthContext";
import { sendTelegramNotification, formatDepositNotification } from "@/lib/telegram";
import { collection, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

function ConfirmPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const amount = searchParams.get("amount") || "0";
    const phoneNumber = searchParams.get("phone") || "";
    const method = searchParams.get("method") || "bkash";
    const { showToast } = useToast();

    const [transactionId, setTransactionId] = useState("");
    const [senderNumber, setSenderNumber] = useState(phoneNumber);
    const [loading, setLoading] = useState(false);

    // Merchant number (this could be dynamic based on payment method)
    const merchantNumber = "01905206405";

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        showToast("কপি হয়েছে!", "success");
    };

    const { user } = useAuth();

    const handleConfirm = async () => {
        console.log("handleConfirm triggered"); // Debug log start
        if (!transactionId || !senderNumber) {
            showToast("সব তথ্য পূরণ করুন", "error");
            return;
        }

        if (!user) {
            showToast("অনুগ্রহ করে লগইন করুন", "error");
            router.push("/login");
            return;
        }

        setLoading(true);

        try {
            const paymentData = {
                userId: user.uid,
                amount: parseFloat(amount),
                phoneNumber: senderNumber,
                method: method,
                transactionId: transactionId,
                status: "pending",
                createdAt: new Date().toISOString(),
                type: "recharge"
            };

            // Save to Firestore
            await addDoc(collection(db, "depositRequests"), paymentData);

            console.log("Preparing Telegram notification with:", {
                phoneNumber: senderNumber,
                amount: parseFloat(amount),
                method: method,
                trxNumber: transactionId
            });

            // Send Telegram Notification
            const notificationMessage = formatDepositNotification({
                phoneNumber: senderNumber,
                amount: parseFloat(amount),
                method: method,
                trxNumber: transactionId
            });

            console.log("Notification message:", notificationMessage);

            // Send notification and show error if fails
            sendTelegramNotification(notificationMessage)
                .then(success => {
                    console.log("Telegram send result:", success);
                    if (!success) {
                        // showToast("Telegram notification failed to send", "error"); // Optional: don't show to user if just backend issue
                        console.error("Telegram returned false success");
                    }
                })
                .catch((err: any) => {
                    console.error("Failed to send telegram notification:", err);
                    // showToast("Telegram Error: " + (err.message || "Unknown"), "error"); 
                });

            showToast("পেমেন্ট সাবমিট হয়েছে! ৫-১০ মিনিটের মধ্যে ব্যালেন্স আপডেট হবে।", "success");

            // Delay redirect to allow telegram notification to send
            setTimeout(() => {
                router.push("/");
            }, 2000);
        } catch (error) {
            console.error("Error submitting deposit:", error);
            showToast("সাবমিট করতে সমস্যা হয়েছে", "error");
        } finally {
            setLoading(false);
        }
    };

    const getMethodLogo = () => {
        if (method === "bkash") {
            return (
                <div className="w-16 h-16 bg-pink-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-2xl">B</span>
                </div>
            );
        } else if (method === "nagad") {
            return (
                <div className="w-16 h-16 bg-orange-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-2xl">N</span>
                </div>
            );
        } else {
            return (
                <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center mx-auto">
                    <span className="text-white font-bold text-2xl">R</span>
                </div>
            );
        }
    };

    const getMethodName = () => {
        return method.charAt(0).toUpperCase() + method.slice(1);
    };

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {/* Logo and Title */}
            <div className="text-center space-y-3 pt-4">
                {getMethodLogo()}
                <h2 className="text-xl font-bold text-white capitalize">{getMethodName()}</h2>
            </div>

            {/* Step 1 */}
            <div className="space-y-2">
                <h3 className="font-bold text-blue-400">ধাপ-১:</h3>
                <p className="text-sm text-muted-foreground">
                    প্রাপকের নাম্বার এ টাকা পাঠাবেন। নাম্বার নিচে দেয়া আছে। নাম্বার কপি করে টাকা পাঠাবেন।
                </p>

                {/* Merchant Number */}
                <div className="bg-muted/20 border border-border rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">প্রাপকের নম্বর</span>
                    <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{merchantNumber}</span>
                        <button
                            onClick={() => copyToClipboard(merchantNumber)}
                            className="p-1 hover:bg-muted/30 rounded"
                        >
                            <Copy className="w-4 h-4 text-primary" />
                        </button>
                    </div>
                </div>

                {/* Amount */}
                <div className="bg-muted/20 border border-border rounded-lg p-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">পরিমাণ</span>
                    <span className="font-bold text-orange-500 text-lg">{amount} টাকা</span>
                </div>
            </div>

            {/* Step 2 */}
            <div className="space-y-2">
                <h3 className="font-bold text-blue-400">ধাপ-২:</h3>
                <p className="text-sm text-muted-foreground">
                    আপনার {getMethodName()} একাউন্ট থেকে টাকা পাঠানোর পর লেনদেন করার পরে (TrxID) দিতে হবে।
                </p>
            </div>

            {/* Step 3 */}
            <div className="space-y-3">
                <h3 className="font-bold text-blue-400">ধাপ-৩:</h3>
                <p className="text-sm text-muted-foreground">আপনার তথ্য দিন</p>

                {/* Sender Number Input */}
                <input
                    type="tel"
                    value={senderNumber}
                    onChange={(e) => setSenderNumber(e.target.value)}
                    placeholder="আপনার নম্বর দিন"
                    className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />

                {/* Transaction ID Input */}
                <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="লেনদেনের ট্রানিজিশন আইডি"
                    className="w-full bg-muted/20 border border-border rounded-lg p-3 text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
                <button
                    onClick={() => router.back()}
                    className="flex-1 bg-muted/30 text-white font-bold py-3 rounded-xl hover:bg-muted/40 transition-colors"
                >
                    বন্ধ করুন
                </button>
                <button
                    onClick={() => {
                        console.log("Button clicked!");
                        handleConfirm();
                    }}
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {loading ? "সেভ হচ্ছে..." : "নিশ্চিত করুন"}
                </button>
            </div>
        </div>
    );
}

export default function ConfirmPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">লোড হচ্ছে...</p>
                </div>
            </div>
        }>
            <ConfirmPageContent />
        </Suspense>
    );
}
