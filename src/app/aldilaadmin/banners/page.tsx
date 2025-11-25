"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Image as ImageIcon, Plus, Trash2, Edit2, Save, X, Link as LinkIcon } from "lucide-react";

interface Banner {
    id: string;
    imageUrl: string;
    title?: string;
    link?: string;
    order: number;
    isActive: boolean;
    createdAt: string;
}

export default function BannersManagement() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        imageUrl: "",
        title: "",
        link: "",
        order: 0,
        isActive: true,
    });

    useEffect(() => {
        fetchBanners();
    }, []);

    const fetchBanners = async () => {
        try {
            const bannersSnapshot = await getDocs(collection(db, "banners"));
            const bannersData = bannersSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as Banner[];
            setBanners(bannersData.sort((a, b) => a.order - b.order));
        } catch (error) {
            console.error("Error fetching banners:", error);
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            imageUrl: "",
            title: "",
            link: "",
            order: banners.length,
            isActive: true,
        });
        setIsAdding(false);
        setEditingId(null);
    };

    const handleAdd = async () => {
        if (!formData.imageUrl) {
            alert("Image URL is required!");
            return;
        }

        try {
            await addDoc(collection(db, "banners"), {
                ...formData,
                createdAt: new Date().toISOString(),
            });
            fetchBanners();
            resetForm();
            alert("Banner added successfully!");
        } catch (error) {
            console.error("Error adding banner:", error);
            alert("Failed to add banner");
        }
    };

    const handleEdit = (banner: Banner) => {
        setFormData({
            imageUrl: banner.imageUrl,
            title: banner.title || "",
            link: banner.link || "",
            order: banner.order,
            isActive: banner.isActive,
        });
        setEditingId(banner.id);
    };

    const handleUpdate = async () => {
        if (!editingId || !formData.imageUrl) return;

        try {
            await updateDoc(doc(db, "banners", editingId), formData);
            fetchBanners();
            resetForm();
            alert("Banner updated successfully!");
        } catch (error) {
            console.error("Error updating banner:", error);
            alert("Failed to update banner");
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this banner?")) return;

        try {
            await deleteDoc(doc(db, "banners", id));
            fetchBanners();
            alert("Banner deleted successfully!");
        } catch (error) {
            console.error("Error deleting banner:", error);
            alert("Failed to delete banner");
        }
    };

    const toggleActive = async (banner: Banner) => {
        try {
            await updateDoc(doc(db, "banners", banner.id), {
                isActive: !banner.isActive,
            });
            fetchBanners();
        } catch (error) {
            console.error("Error toggling banner:", error);
            alert("Failed to toggle banner status");
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
                    <h1 className="text-3xl font-bold text-primary">Banner Management</h1>
                    <p className="text-muted-foreground mt-1">Manage homepage slider banners</p>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                >
                    {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    {isAdding ? "Cancel" : "Add Banner"}
                </button>
            </div>

            {/* Add/Edit Form */}
            {(isAdding || editingId) && (
                <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                    <h3 className="text-lg font-bold">{editingId ? "Edit Banner" : "Add New Banner"}</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-2">Image URL *</label>
                            <input
                                type="text"
                                value={formData.imageUrl}
                                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                                placeholder="https://example.com/banner.jpg"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Title (optional)</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Banner title"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Link (optional)</label>
                            <input
                                type="text"
                                value={formData.link}
                                onChange={(e) => setFormData({ ...formData, link: e.target.value })}
                                placeholder="https://example.com"
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium mb-2">Order</label>
                            <input
                                type="number"
                                value={formData.order}
                                onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                                className="w-full px-4 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                        </div>
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

                    {/* Preview */}
                    {formData.imageUrl && (
                        <div>
                            <label className="block text-sm font-medium mb-2">Preview</label>
                            <div className="w-full h-48 rounded-lg overflow-hidden bg-muted">
                                <img
                                    src={formData.imageUrl}
                                    alt="Banner preview"
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/800x200?text=Invalid+Image+URL";
                                    }}
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={editingId ? handleUpdate : handleAdd}
                            className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2"
                        >
                            <Save className="w-4 h-4" />
                            {editingId ? "Update" : "Add Banner"}
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

            {/* Banners Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {banners.length === 0 ? (
                    <div className="col-span-full text-center p-8 text-muted-foreground bg-card rounded-xl border border-border">
                        No banners found. Add your first banner!
                    </div>
                ) : (
                    banners.map((banner) => (
                        <div
                            key={banner.id}
                            className={`bg-card rounded-xl border overflow-hidden ${banner.isActive ? "border-primary/50" : "border-border opacity-60"
                                }`}
                        >
                            {/* Banner Image */}
                            <div className="relative h-40 bg-muted">
                                <img
                                    src={banner.imageUrl}
                                    alt={banner.title || "Banner"}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.src = "https://via.placeholder.com/400x200?text=Image+Error";
                                    }}
                                />
                                <div className="absolute top-2 right-2 flex gap-2">
                                    <span className={`px-2 py-1 text-xs rounded ${banner.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"
                                        }`}>
                                        {banner.isActive ? "Active" : "Inactive"}
                                    </span>
                                    <span className="px-2 py-1 text-xs bg-black/50 text-white rounded">
                                        Order: {banner.order}
                                    </span>
                                </div>
                            </div>

                            {/* Banner Info */}
                            <div className="p-4 space-y-3">
                                {banner.title && (
                                    <h3 className="font-bold text-white truncate">{banner.title}</h3>
                                )}
                                {banner.link && (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <LinkIcon className="w-3 h-3" />
                                        <span className="truncate">{banner.link}</span>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex gap-2 pt-2">
                                    <button
                                        onClick={() => toggleActive(banner)}
                                        className={`flex-1 px-3 py-2 text-sm rounded-lg transition-colors ${banner.isActive
                                                ? "bg-yellow-500/20 text-yellow-500 hover:bg-yellow-500/30"
                                                : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                            }`}
                                    >
                                        {banner.isActive ? "Deactivate" : "Activate"}
                                    </button>
                                    <button
                                        onClick={() => handleEdit(banner)}
                                        className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
                                        title="Edit"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(banner.id)}
                                        className="p-2 bg-red-500/20 text-red-500 rounded-lg hover:bg-red-500/30 transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
