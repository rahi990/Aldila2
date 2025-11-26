"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ExternalLink, CheckCircle, TrendingUp, Award, ShoppingBag, ChevronRight } from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import Link from "next/link";
import { collection, getDocs, query, where, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    link: string;
    isActive: boolean;
    planLevel?: number;
}

interface TaskCompletion {
    taskId: string;
    planId: string;
    startTime: number;
    completed: boolean;
    completedAt?: number;
}

interface ActivePlan {
    planId: string;
    level: number;
    price: number;
    dailyIncome: number;
    totalRevenue: number;
    purchaseDate: string;
    expiryDate: string;
    isActive: boolean;
}

export default function TasksPage() {
    const router = useRouter();
    const { user, userData, loading, refreshUserData } = useAuth();
    const [selectedPlan, setSelectedPlan] = useState<ActivePlan | null>(null);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [tasksLoading, setTasksLoading] = useState(true);
    const [completions, setCompletions] = useState<TaskCompletion[]>([]);
    const [todayCompleted, setTodayCompleted] = useState(0);
    const [todayEarnings, setTodayEarnings] = useState(0);
    const [planIncome, setPlanIncome] = useState<Record<string, number>>({});
    const { showToast } = useToast();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    useEffect(() => {
        if (userData?.activePlans) {
            const activePlans = userData.activePlans.filter(
                (p: any) => p.isActive && new Date(p.expiryDate) > new Date()
            );

            if (activePlans.length === 1 && !selectedPlan) {
                setSelectedPlan(activePlans[0]);
            }
        }
    }, [userData, selectedPlan]);

    useEffect(() => {
        if (!selectedPlan) return;

        setTasksLoading(true);

        // Setup real-time listener for tasks
        const tasksQuery = query(
            collection(db, "tasks"),
            where("isActive", "==", true),
            where("planLevel", "==", selectedPlan.level)
        );

        const unsubscribe = onSnapshot(tasksQuery, (snapshot) => {
            const tasksData = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];

            setTasks(tasksData);
            setTasksLoading(false);
        }, (error) => {
            console.error("Error fetching tasks:", error);
            setTasksLoading(false);
        });

        // Cleanup listener on unmount or when selectedPlan changes
        return () => unsubscribe();
    }, [selectedPlan]);

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("task_completions") || "[]");
        setCompletions(saved);
        calculateTodayStats(saved);
        checkCompletions(saved);

        const savedIncome = JSON.parse(localStorage.getItem("plan_income") || "{}");
        setPlanIncome(savedIncome);
    }, []);

    const calculateTodayStats = (savedCompletions: TaskCompletion[]) => {
        const today = new Date().toDateString();
        const todayTasks = savedCompletions.filter(c => {
            if (!c.completedAt) return false;
            // Filter by selected plan if available
            if (selectedPlan && c.planId !== selectedPlan.planId) return false;
            return new Date(c.completedAt).toDateString() === today;
        });

        setTodayCompleted(todayTasks.length);

        const earnings = todayTasks.reduce((sum, completion) => {
            // Find task details to get reward amount
            // If tasks array is empty (not loaded yet), we might miss this. 
            // But the useEffect below ensures we recalculate when tasks load.
            const task = tasks.find(t => t.id === completion.taskId);
            return sum + (task?.reward || 0);
        }, 0);

        setTodayEarnings(earnings);
    };

    // Recalculate stats when tasks or selectedPlan changes
    useEffect(() => {
        if (completions.length > 0) {
            calculateTodayStats(completions);
        }
    }, [tasks, selectedPlan]);

    const checkCompletions = async (savedCompletions: TaskCompletion[]) => {
        const now = Date.now();
        let updated = false;
        const newlyCompletedTasks: TaskCompletion[] = [];

        const updatedCompletions = savedCompletions.map(completion => {
            if (!completion.completed && now - completion.startTime >= 120000) { // 2 minutes
                updated = true;
                const completedTask = { ...completion, completed: true, completedAt: now };
                newlyCompletedTasks.push(completedTask);
                return completedTask;
            }
            return completion;
        });

        if (updated) {
            setCompletions(updatedCompletions);
            localStorage.setItem("task_completions", JSON.stringify(updatedCompletions));
            calculateTodayStats(updatedCompletions);

            // Update balance in Firebase for newly completed tasks
            if (user && newlyCompletedTasks.length > 0) {
                try {
                    let totalReward = 0;
                    let newPlanIncome = { ...planIncome }; // Create a mutable copy

                    // Fetch task details from Firestore for each completed task
                    const { doc: firestoreDoc, getDoc } = await import("firebase/firestore");

                    for (const completion of newlyCompletedTasks) {
                        // Fetch task from Firestore instead of using local tasks array
                        const taskDoc = await getDoc(firestoreDoc(db, "tasks", completion.taskId));

                        if (taskDoc.exists()) {
                            const taskData = taskDoc.data() as Task;
                            totalReward += taskData.reward;

                            // Update local plan income state
                            const planId = completion.planId;
                            const currentIncome = newPlanIncome[planId] || 0;
                            newPlanIncome = { ...newPlanIncome, [planId]: currentIncome + taskData.reward };
                        }
                    }

                    setPlanIncome(newPlanIncome);
                    localStorage.setItem("plan_income", JSON.stringify(newPlanIncome));

                    if (totalReward > 0) {
                        const { doc, updateDoc, increment } = await import("firebase/firestore");
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                            balance: increment(totalReward)
                        });
                        showToast(`টাস্ক সম্পন্ন হয়েছে! ৳${totalReward} যোগ করা হয়েছে`, "success");

                        // Refresh user data to show updated balance - it will update in real-time
                        if (refreshUserData) {
                            await refreshUserData();
                        }
                    }
                } catch (error) {
                    console.error("Error updating balance:", error);
                    showToast("ব্যালেন্স আপডেট করতে সমস্যা হয়েছে", "error");
                }
            }
        }
    };

    useEffect(() => {
        const interval = setInterval(() => {
            checkCompletions(completions);
        }, 10000);

        return () => clearInterval(interval);
    }, [completions]);

    const handleGoClick = (task: Task) => {
        if (!selectedPlan) return;

        const existing = completions.find(
            c => c.taskId === task.id && c.planId === selectedPlan.planId
        );

        if (existing && existing.completed) {
            showToast("এই টাস্ক ইতিমধ্যে সম্পন্ন হয়েছে", "info");
            return;
        }

        if (!existing) {
            const newCompletion: TaskCompletion = {
                taskId: task.id,
                planId: selectedPlan.planId,
                startTime: Date.now(),
                completed: false
            };

            const updated = [...completions, newCompletion];
            setCompletions(updated);
            localStorage.setItem("task_completions", JSON.stringify(updated));

            showToast("টাস্ক শুরু হয়েছে! লিংক ওপেন হচ্ছে...", "success");
        }

        window.open(task.link, '_blank');
    };

    const isTaskCompleted = (taskId: string) => {
        if (!selectedPlan) return false;
        const completion = completions.find(
            c => c.taskId === taskId && c.planId === selectedPlan.planId
        );
        return completion?.completed || false;
    };

    const getDaysRemaining = (expiryDateString: string) => {
        const expiryDate = new Date(expiryDateString);
        const today = new Date();
        const diffTime = expiryDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays > 0 ? diffDays : 0;
    };

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

    const activePlans = userData?.activePlans?.filter(
        (p: any) => p.isActive && new Date(p.expiryDate) > new Date()
    ) || [];

    if (activePlans.length === 0) {
        return (
            <div className="pb-20 min-h-screen bg-background p-4 flex items-center justify-center">
                <div className="max-w-md w-full space-y-6">
                    <div className="bg-card p-8 rounded-xl border border-border text-center space-y-4">
                        <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                            <ShoppingBag className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-2xl font-bold text-white">Plan প্রয়োজন!</h2>
                        <p className="text-muted-foreground">
                            টাস্ক দেখতে এবং সম্পন্ন করতে আপনাকে প্রথমে একটি VIP Plan কিনতে হবে।
                        </p>
                        <Link
                            href="/"
                            className="inline-block w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl hover:opacity-90 transition-opacity"
                        >
                            Plan কিনুন
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    if (activePlans.length > 1 && !selectedPlan) {
        return (
            <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-primary">প্ল্যান নির্বাচন করুন</h1>
                    <p className="text-sm text-muted-foreground">যে প্ল্যানের টাস্ক দেখতে চান সেটি নির্বাচন করুন</p>
                </div>

                <div className="space-y-4">
                    {activePlans.map((plan: ActivePlan) => {
                        const daysRemaining = getDaysRemaining(plan.expiryDate);
                        const income = planIncome[plan.planId] || 0;

                        return (
                            <div
                                key={plan.planId}
                                onClick={() => setSelectedPlan(plan)}
                                className="bg-card p-5 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <h3 className="text-lg font-bold text-white">VIP {plan.level}</h3>
                                            <span className="bg-primary/20 text-primary text-xs px-2 py-1 rounded-full">
                                                সক্রিয়
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
                                            <span className="text-muted-foreground">মোট আয়:</span>
                                            <span className="text-primary font-bold">৳{income.toFixed(2)}</span>

                                            <span className="text-muted-foreground">অবশিষ্ট:</span>
                                            <span className={`font-medium ${daysRemaining > 7 ? 'text-green-500' : 'text-yellow-500'}`}>
                                                {daysRemaining} দিন
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-muted-foreground" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <div className="pb-20 min-h-screen bg-background p-4 space-y-6">
            {selectedPlan && (
                <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-4 rounded-xl border border-primary/30">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            {activePlans.length > 1 && (
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="p-2 hover:bg-primary/20 rounded-lg transition-colors"
                                    title="Go back to plan selection"
                                >
                                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>
                            )}
                            <h2 className="text-xl font-bold text-white">VIP {selectedPlan.level} টাস্ক</h2>
                        </div>
                        {activePlans.length > 1 && (
                            <button
                                onClick={() => setSelectedPlan(null)}
                                className="text-sm text-primary hover:underline"
                            >
                                পরিবর্তন করুন
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                        <div className="bg-card/50 p-2 rounded-lg text-center">
                            <p className="text-muted-foreground text-xs">মোট আয়</p>
                            <p className="text-primary font-bold">৳{(planIncome[selectedPlan.planId] || 0).toFixed(2)}</p>
                        </div>
                        <div className="bg-card/50 p-2 rounded-lg text-center">
                            <p className="text-muted-foreground text-xs">মোট রিটার্ন</p>
                            <p className="text-white font-bold">৳{selectedPlan.totalRevenue}</p>
                        </div>
                        <div className="bg-card/50 p-2 rounded-lg text-center">
                            <p className="text-muted-foreground text-xs">মেয়াদ</p>
                            <p className="text-white font-bold">{getDaysRemaining(selectedPlan.expiryDate)} দিন</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs">আজকের সম্পন্ন</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">{todayCompleted}</div>
                    <p className="text-xs text-muted-foreground">টাস্ক</p>
                </div>

                <div className="bg-card p-4 rounded-xl border border-border text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-xs">আজকের আয়</span>
                    </div>
                    <div className="text-2xl font-bold text-primary">৳{todayEarnings}</div>
                    <p className="text-xs text-muted-foreground">টাকা</p>
                </div>
            </div>

            <div className="space-y-3">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-primary" />
                    উপলব্ধ টাস্ক
                </h2>

                {tasksLoading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                        <p className="text-muted-foreground">Loading tasks...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="bg-card p-8 rounded-xl border border-border text-center">
                        <p className="text-muted-foreground">এই প্ল্যানের জন্য কোনো টাস্ক নেই</p>
                    </div>
                ) : (
                    tasks.map((task) => {
                        const completed = isTaskCompleted(task.id);

                        return (
                            <div
                                key={task.id}
                                className={`bg-card p-4 rounded-xl border transition-all ${completed
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-border hover:border-primary/30'
                                    }`}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-bold text-white">{task.title}</h3>
                                            {completed && (
                                                <CheckCircle className="w-5 h-5 text-primary" />
                                            )}
                                        </div>
                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1 text-primary font-bold">
                                                <span>৳{task.reward}</span>
                                            </div>
                                            {completed && (
                                                <span className="text-xs text-primary">✓ সম্পন্ন</span>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => handleGoClick(task)}
                                        disabled={completed}
                                        className={`px-6 py-3 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${completed
                                            ? 'bg-muted/20 text-muted-foreground cursor-not-allowed'
                                            : 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-105'
                                            }`}
                                    >
                                        {completed ? (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Done
                                            </>
                                        ) : (
                                            <>
                                                <ExternalLink className="w-4 h-4" />
                                                Go
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <div className="bg-primary/10 border border-primary/30 p-4 rounded-xl">
                <h4 className="text-primary font-bold mb-2 text-sm">নির্দেশাবলী:</h4>
                <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• "Go" বাটনে ক্লিক করে টাস্ক সম্পন্ন করুন</li>
                    <li>• প্রতিটি টাস্ক সঠিকভাবে সম্পন্ন না করলে আপনার অ্যাকাউন্ট বাতিল হয়ে যেতে পারে</li>
                    <li>• সম্পন্ন হলে স্বয়ংক্রিয়ভাবে টাকা যুক্ত হবে</li>
                    <li>• প্রতিদিন নতুন টাস্ক পাবেন</li>
                </ul>
            </div>
        </div>
    );
}
