// Telegram Bot API utility for sending notifications

const TELEGRAM_BOT_TOKEN = process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || "8477146146:AAHS2gClw7jPlMP2NThj7vDNlItJo-Z5k-M";
const TELEGRAM_CHAT_ID = process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || "-1003215471829";

export async function sendTelegramNotification(message: string): Promise<boolean> {
    try {
        console.log("Sending Telegram notification...");
        console.log("Using Token:", TELEGRAM_BOT_TOKEN ? "Yes (Length: " + TELEGRAM_BOT_TOKEN.length + ")" : "No");
        console.log("Using Chat ID:", TELEGRAM_CHAT_ID);

        if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
            console.error("Missing Telegram credentials");
            return false;
        }

        const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;

        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                chat_id: TELEGRAM_CHAT_ID,
                text: message,
                parse_mode: "HTML", // Support HTML formatting
            }),
            keepalive: true, // Ensure request survives page navigation
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Telegram API error:", response.status, errorText);
            return false;
        }

        console.log("Telegram notification sent successfully");
        return true;
    } catch (error) {
        console.error("Error sending Telegram notification:", error);
        return false;
    }
}

// Format deposit notification message
export function formatDepositNotification(data: {
    phoneNumber: string;
    amount: number;
    method: string;
    trxNumber: string;
    time?: string;
}): string {
    const time = data.time || new Date().toLocaleString('bn-BD');

    return `🔔 <b>নতুন ডিপোজিট রিকোয়েস্ট</b>

👤 ইউজার: ${data.phoneNumber}
💰 পরিমাণ: ৳${data.amount}
💳 মেথড: ${data.method}
🔢 TRX: ${data.trxNumber}
⏰ সময়: ${time}`;
}

// Format withdrawal notification message
export function formatWithdrawNotification(data: {
    phoneNumber: string;
    amount: number;
    method: string;
    accountNumber: string;
    time?: string;
}): string {
    const time = data.time || new Date().toLocaleString('bn-BD');

    return `💸 <b>নতুন উইথড্র রিকোয়েস্ট</b>

👤 ইউজার: ${data.phoneNumber}
💰 পরিমাণ: ৳${data.amount}
🏦 মেথড: ${data.method}
📱 অ্যাকাউন্ট: ${data.accountNumber}
⏰ সময়: ${time}`;
}
