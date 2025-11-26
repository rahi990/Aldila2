"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CreditCard, Plus, Trash2, Edit2, Save, X, Smartphone, Building } from "lucide-react";

interface PaymentMethod {
    id: string;
    name: string;
    type: "bkash" | "nagad" | "rocket" | "bank";
    accountNumber: string;
    accountName: string;
    instructions?: string;
    isActive: boolean;
    createdAt: string;
}

const paymentTypes = [
    { value: "bkash", label: "Bkash", icon: Smartphone },
    { value: "nagad", label: "Nagad", icon: Smartphone },
    { value: "rocket", label: "Rocket", icon: Smartphone },
    { value: "bank", label: "Bank Transfer", icon: Building },
] as const;

export default function PaymentMethodsManagement() {
    const [methods, setMethods] = useState<PaymentMethod[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: "",
        type: "bkash" as PaymentMethod["type"],
        accountNumber: "",
        accountName: "",
        instructions: "",
        isActive: true,
    });

    useEffect(() => {
        fetchPaymentMethods();
    }, []);

    const fetchPaymentMethods = async () => {
        try {
            const methodsSnapshot = await getDocs(collection(db, "paymentMethods"));
            const methodsData = methodsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as PaymentMethod[];
            setMethods(methodsData);
        } catch (error) {
            console.error("Error fetching payment methods:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            type: "bkash",
            accountNumber: "",
            accountName: "",
            instructions: "",
            isActive: true,
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!formData.name || !formData.accountNumber || !formData.accountName) {
            alert("Name, account number, and account name are required!");
            return;
        }

        try {
            await addDoc(collection(db, "paymentMethods"), {
                ...formData,
                createdAt: new Date().toISOString(),
            });
            fetchPaymentMethods();
            resetForm();
            alert("Payment method added successfully!");
        } catch (error) {
            console.error("Error adding payment method:", error);
            alert("Failed to add payment method");
        }
    };

    const handleEdit = (method: PaymentMethod) => {
        setFormData({
            name: method.name,
            type: method.type,
            accountNumber: method.accountNumber,
            accountName: method.accountName,
            instructions: method.instructions || "",
            isActive: method.isActive,
        });
        setEditingId(method.id);
    };

    const handleUpdate = async () => {
        if (!editingId || !formData.name || !formData.accountNumber || !formData.accountName) return;

        try {
            await updateDoc(doc(db, "paymentMethods", editingId), formData);
            fetchPaymentMethods();
            resetForm();
            alert("Payment method updated successfully!");
        } catch (error) {
            console.error("Error updating payment method:", error);
            alert("Failed to update payment method");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this payment method?")) return;

        try {
            await deleteDoc(doc(db, "paymentMethods", id));
            fetchPaymentMethods();
            alert("Payment method deleted successfully!");
        } catch (error) {
            console.error("Error deleting payment method:", error);
            alert("Failed to delete payment method");
        }
    };

    const toggleActive = async (method: PaymentMethod) => {
        try {
            await updateDoc(doc(db, "paymentMethods", method.id), {
                isActive: !method.isActive,
            });
            fetchPaymentMethods();
        } catch (error) {
            console.error("Error toggling payment method:", error);
            alert("Failed to toggle payment method status");
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
                    <h1 className="text-3xl font-bold text-primary">Payment Methods</h1>
                    <p className="text-muted-foreground mt-1">Manage payment methods for deposits</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? "Cancel" : "Add Method"}
                </button>
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                    <h3 className="text-lg font-bold">{editingId ? "Edit Payment Method" : "Add New Payment Method"}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Method Name *</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                placeholder="e.g., Personal Bkash"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Type *</label>
                            <select
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod["type"] })}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            >
                                {paymentTypes.map((type) => (
                                    <option key={type.value} value={type.value}>
                                        {type.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Account Number *</label>
                            <input
                                type="text"
                                value={formData.accountNumber}
                                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                                placeholder="01XXXXXXXXX"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Account Name *</label>
                            <input
                                type="text"
                                value={formData.accountName}
                                onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                                placeholder="Account holder name"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Instructions (optional)</label>
                        <textarea
                            value={formData.instructions}
                            onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                            placeholder="Special instructions for users..."
                            rows={3}
                            className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="isActive"
                            checked={formData.isActive}
                            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            className="w-4 h-4"
                        />
                        <label htmlFor="isActive" className="text-sm font-medium">Active (visible to users)</label>
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={editingId ? handleUpdate : handleAdd}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingId ? "Update" : "Add Method"}
                        </button>
                        <button
                            onClick={resetForm}
                            className="px-6 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            {/* Payment Methods List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {methods.length === 0 ? (
                    <div className="col-span-full text-center p-8 text-muted-foreground bg-card rounded-xl border border-border">
                        No payment methods found. Add your first payment method!
                    </div>
                ) : (
                    methods.map((method) => {
                        const typeInfo = paymentTypes.find((t) => t.value === method.type);
                        const Icon = typeInfo?.icon || CreditCard;

                        return (
                            <div
                                key={method.id}
                                className={`bg-card rounded-xl border p-6 space-y-4 ${method.isActive ? "border-primary/50" : "border-border opacity-60"
                                    }`}
                            >
                                {/* Header */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-3 bg-primary/10 rounded-lg">
                                            <Icon className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white">{method.name}</h3>
                                            <p className="text-xs text-muted-foreground">{typeInfo?.label}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded ${method.isActive ? "bg-green-500/20 text-green-500" : "bg-gray-500/20 text-gray-500"
                                        }`}>
                                        {method.isActive ? "Active" : "Inactive"}
                                    </span>
                                </div>

                                {/* Details */}
                                <div className="space-y-2">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Number</p>
                                        <p className="font-mono font-medium">{method.accountNumber}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Name</p>
                                        <p className="font-medium">{method.accountName}</p>
                                    </div>
                                    {method.instructions && (
                                        <div>
                                            <p className="text-xs text-muted-foreground">Instructions</p>
                                            <p className="text-sm">{method.instructions}</p>
                                        </div>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-2 pt-2 border-t border-border">
                                    <button
                                        onClick={() => toggleActive(method)}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${method.isActive
                                                ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                                                : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                            }`}
                                    >
                                        {method.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(method)}
                                        className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(method.id)}
                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
