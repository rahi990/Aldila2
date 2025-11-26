"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Plus, Edit2, Trash2, X, CheckCircle, XCircle } from "lucide-react";

interface Plan {
    id: string;
    level: number;
    dailyIncome: number;
    totalRevenue: number;
    price: number;
    validity: number;
    isActive: boolean;
    status: "active" | "upcoming" | "disabled";
    createdAt: string;
}

export default function PlansManagement() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        level: 1,
        dailyIncome: 0,
        totalRevenue: 0,
        price: 0,
        validity: 300,
        isActive: true,
        status: "active" as "active" | "upcoming" | "disabled",
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "plans"));
            const plansData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Plan[];
            setPlans(plansData.sort((a, b) => a.level - b.level));
        } catch (error) {
            console.error("Error fetching plans:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await updateDoc(doc(db, "plans", editingPlan.id), formData);
            } else {
                await addDoc(collection(db, "plans"), {
                    ...formData,
                    createdAt: new Date().toISOString(),
                });
            }
            setShowModal(false);
            setEditingPlan(null);
            setFormData({ level: 1, dailyIncome: 0, totalRevenue: 0, price: 0, validity: 300, isActive: true, status: "active" });
            fetchPlans();
        } catch (error) {
            console.error("Error saving plan:", error);
        }
    };

    const handleEdit = (plan: Plan) => {
        setEditingPlan(plan);
        setFormData({
            level: plan.level,
            dailyIncome: plan.dailyIncome,
            totalRevenue: plan.totalRevenue,
            price: plan.price,
            validity: plan.validity,
            isActive: plan.isActive,
            status: plan.status || "active",
        });
        setShowModal(true);
    };

    const handleDelete = async (planId: string) => {
        if (confirm("Are you sure you want to delete this plan?")) {
            try {
                await deleteDoc(doc(db, "plans", planId));
                fetchPlans();
            } catch (error) {
                console.error("Error deleting plan:", error);
            }
        }
    };

    const toggleStatus = async (plan: Plan) => {
        try {
            await updateDoc(doc(db, "plans", plan.id), {
                isActive: !plan.isActive,
            });
            fetchPlans();
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
                    <h1 className="text-3xl font-bold text-primary">Plan Management</h1>
                    <p className="text-muted-foreground mt-1">Manage VIP plans</p>
                </div>
                <button
                    onClick={() => {
                        setEditingPlan(null);
                        setFormData({ level: 1, dailyIncome: 0, totalRevenue: 0, price: 0, validity: 300, isActive: true, status: "active" });
                        setShowModal(true);
                    }}
                    className="bg-primary text-primary-foreground px-4 py-2 rounded-lg flex items-center gap-2 hover:opacity-90 transition-opacity"
                >
                    <Plus className="w-5 h-5" />
                    Add Plan
                </button>
            </div>

            {/* Plans Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {plans.length === 0 ? (
                    <div className="col-span-full bg-card p-8 rounded-xl border border-border text-center">
                        <p className="text-muted-foreground">No plans found. Create your first plan!</p>
                    </div>
                ) : (
                    plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-card p-6 rounded-xl border border-border hover:shadow-lg transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="text-2xl font-bold text-primary">VIP {plan.level}</h3>
                                {plan.isActive ? (
                                    <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold">
                                        Active
                                    </span>
                                ) : (
                                    <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-bold">
                                        Inactive
                                    </span>
                                )}
                            </div>

                            <div className="space-y-2 mb-4">
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Price:</span>
                                    <span className="font-bold">৳{plan.price}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Daily Income:</span>
                                    <span className="font-bold">৳{plan.dailyIncome}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Total Revenue:</span>
                                    <span className="font-bold">৳{plan.totalRevenue}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Validity:</span>
                                    <span className="font-bold">{plan.validity} days</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-border">
                                <button
                                    onClick={() => toggleStatus(plan)}
                                    className={`flex-1 p-2 rounded-lg transition-colors ${plan.isActive
                                        ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                        : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                        }`}
                                >
                                    {plan.isActive ? <CheckCircle className="w-5 h-5 mx-auto" /> : <XCircle className="w-5 h-5 mx-auto" />}
                                </button>
                                <button
                                    onClick={() => handleEdit(plan)}
                                    className="flex-1 p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
                                >
                                    <Edit2 className="w-5 h-5 mx-auto" />
                                </button>
                                <button
                                    onClick={() => handleDelete(plan.id)}
                                    className="flex-1 p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                >
                                    <Trash2 className="w-5 h-5 mx-auto" />
                                </button>
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
                                {editingPlan ? "Edit Plan" : "Add New Plan"}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-muted rounded-lg">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Level</label>
                                    <input
                                        type="number"
                                        value={formData.level}
                                        onChange={(e) => setFormData({ ...formData, level: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                        required
                                        min="1"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Price (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Daily Income (৳)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.dailyIncome}
                                        onChange={(e) => setFormData({ ...formData, dailyIncome: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Total Revenue (৳)</label>
                                    <input
                                        type="number"
                                        value={formData.totalRevenue}
                                        onChange={(e) => setFormData({ ...formData, totalRevenue: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                        required
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2">Validity (Days)</label>
                                    <input
                                        type="number"
                                        value={formData.validity}
                                        onChange={(e) => setFormData({ ...formData, validity: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                        required
                                        min="1"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value as "active" | "upcoming" | "disabled" })}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                    required
                                >
                                    <option value="active">Active (Visible & Purchasable)</option>
                                    <option value="upcoming">Upcoming (Visible but Not Purchasable)</option>
                                    <option value="disabled">Disabled (Hidden)</option>
                                </select>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Active: Users can see and buy | Upcoming: Users can only see | Disabled: Completely hidden
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
                                    {editingPlan ? "Update Plan" : "Create Plan"}
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
