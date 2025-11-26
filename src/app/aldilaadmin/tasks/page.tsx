"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle } from "lucide-react";

interface Task {
    id: string;
    title: string;
    description: string;
    reward: number;
    link: string;
    isActive: boolean;
    createdAt: string;
    planLevel?: number;    // Plan level (1, 2, 3, etc.) or undefined for all plans
}

interface Plan {
    id: string;
    name: string;
    price: number;
    level: number;         // VIP level
}

export default function TasksManagement() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        reward: number;
        link: string;
        isActive: boolean;
        planLevel?: number;
    }>({
        title: "",
        description: "",
        reward: 0,
        link: "",
        isActive: true,
        planLevel: undefined,
    });

    useEffect(() => {
        fetchTasks();
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "plans"));
            const plansData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Plan[];
            setPlans(plansData);
        } catch (error) {
            console.error("Error fetching plans:", error);
        }
    };

    const fetchTasks = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "tasks"));
            const tasksData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Task[];
            setTasks(tasksData);
        } catch (error) {
            console.error("Error fetching tasks:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTask) {
                // Update existing task
                await updateDoc(doc(db, "tasks", editingTask.id), formData);
            } else {
                // Add new task
                await addDoc(collection(db, "tasks"), {
                    ...formData,
                    createdAt: new Date().toISOString(),
                });
            }
            setShowModal(false);
            setEditingTask(null);
            setFormData({ title: "", description: "", reward: 0, link: "", isActive: true, planLevel: undefined });
            fetchTasks();
        } catch (error) {
            console.error("Error saving task:", error);
        }
    };

    const handleEdit = (task: Task) => {
        setEditingTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            reward: task.reward,
            link: task.link,
            isActive: task.isActive,
            planLevel: task.planLevel,
        });
        setShowModal(true);
    };

    const handleDelete = async (taskId: string) => {
        if (confirm("Are you sure you want to delete this task?")) {
            try {
                await deleteDoc(doc(db, "tasks", taskId));
                fetchTasks();
            } catch (error) {
                console.error("Error deleting task:", error);
            }
        }
    };

    const toggleStatus = async (task: Task) => {
        try {
            await updateDoc(doc(db, "tasks", task.id), {
                isActive: !task.isActive,
            });
            fetchTasks();
        } catch (error) {
            console.error("Error updating status:", error);
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
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-primary">Task Management</h1>
                    <p className="text-muted-foreground mt-1">Manage daily tasks for users</p>
                </div>
                <button
                    onClick={() => {
                        setEditingTask(null);
                        setFormData({ title: "", description: "", reward: 0, link: "", isActive: true, planLevel: undefined });
                        setShowModal(true);
                    }}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" />
                    Add Task
                </button>
            </div>

            {/* Tasks List */}
            <div className="grid gap-4">
                {tasks.length === 0 ? (
                    <div className="bg-card p-8 rounded-xl border border-border text-center">
                        <p className="text-muted-foreground">No tasks found. Create your first task!</p>
                    </div>
                ) : (
                    tasks.map((task) => (
                        <div
                            key={task.id}
                            className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-xl font-bold">{task.title}</h3>
                                        {task.isActive ? (
                                            <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                <CheckCircle className="w-3 h-3" />
                                                Active
                                            </span>
                                        ) : (
                                            <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                                <XCircle className="w-3 h-3" />
                                                Inactive
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-muted-foreground mb-3">{task.description}</p>
                                    <div className="flex items-center gap-4 text-sm flex-wrap">
                                        <span className="text-primary font-bold">Reward: ৳{task.reward}</span>
                                        <span className="text-muted-foreground">Link: {task.link}</span>
                                        {task.planLevel ? (
                                            <span className="bg-blue-500/20 text-blue-500 text-xs px-2 py-1 rounded-full font-bold">
                                                VIP {task.planLevel}
                                            </span>
                                        ) : (
                                            <span className="bg-purple-500/20 text-purple-500 text-xs px-2 py-1 rounded-full font-bold">
                                                All Plans
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => toggleStatus(task)}
                                        className={`p-2 rounded-lg transition-colors ${task.isActive
                                            ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                            : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                            }`}
                                    >
                                        {task.isActive ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(task)}
                                        className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
                                    >
                                        <Edit2 className="w-5 h-5" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(task.id)}
                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card p-6 rounded-xl border border-border max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">
                                {editingTask ? "Edit Task" : "Add New Task"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2 h-24"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Reward (৳)</label>
                                <input
                                    type="number"
                                    value={formData.reward}
                                    onChange={(e) => setFormData({ ...formData, reward: Number(e.target.value) })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                    required
                                    min="0"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Task Link</label>
                                <input
                                    type="url"
                                    value={formData.link}
                                    onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Plan Selection</label>
                                <select
                                    value={formData.planLevel?.toString() || ""}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        planLevel: e.target.value ? Number(e.target.value) : undefined
                                    })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                >
                                    <option value="">All Plans (Available to Everyone)</option>
                                    {plans.map(plan => (
                                        <option key={plan.id} value={plan.level}>
                                            VIP {plan.level} - ৳{plan.price}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Select "All Plans" to make this task available to all users, or select a specific plan (VIP 1, 2, 3, etc.).
                                </p>
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                    className="w-4 h-4"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium">Active</label>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    className="flex-1 bg-primary text-primary-foreground py-3 rounded-lg font-bold hover:opacity-90 transition-opacity"
                                >
                                    {editingTask ? "Update Task" : "Create Task"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-6 bg-muted text-foreground py-3 rounded-lg font-bold hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
