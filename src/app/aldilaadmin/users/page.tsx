"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Search, Edit2, CheckCircle, XCircle, Users as UsersIcon, Ban, UserCheck } from "lucide-react";

interface User {
    id: string;
    phoneNumber: string;
    userId: string;
    balance: number;
    isActive: boolean;
    isBanned?: boolean;
    referCount: number;
    planLevel: number;
    createdAt: string;
}

export default function UsersManagement() {
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [newBalance, setNewBalance] = useState(0);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        const filtered = users.filter(
            (user) =>
                user.phoneNumber.includes(searchTerm) ||
                user.userId.includes(searchTerm)
        );
        setFilteredUsers(filtered);
    }, [searchTerm, users]);

    const fetchUsers = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, "users"));
            const usersData = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            })) as User[];
            setUsers(usersData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            setFilteredUsers(usersData);
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleUserStatus = async (user: User) => {
        try {
            await updateDoc(doc(db, "users", user.id), {
                isActive: !user.isActive,
            });
            fetchUsers();
        } catch (error) {
            console.error("Error updating user status:", error);
        }
    };

    const updateUserBalance = async () => {
        if (!editingUser) return;
        try {
            await updateDoc(doc(db, "users", editingUser.id), {
                balance: newBalance,
            });
            setEditingUser(null);
            fetchUsers();
        } catch (error) {
            console.error("Error updating balance:", error);
        }
    };

    const toggleUserBan = async (user: User) => {
        if (!confirm(`Are you sure you want to ${user.isBanned ? "unban" : "ban"} this user?`)) return;

        try {
            await updateDoc(doc(db, "users", user.id), {
                isBanned: !user.isBanned,
            });
            fetchUsers();
            alert(`User ${user.isBanned ? "unbanned" : "banned"} successfully!`);
        } catch (error) {
            console.error("Error toggling user ban:", error);
            alert("Failed to update user ban status");
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
            <div>
                <h1 className="text-3xl font-bold text-primary">User Management</h1>
                <p className="text-muted-foreground mt-1">Manage all users</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <UsersIcon className="w-4 h-4" />
                        <span className="text-sm">Total Users</span>
                    </div>
                    <p className="text-2xl font-bold">{users.length}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Active Users</span>
                    </div>
                    <p className="text-2xl font-bold text-green-500">{users.filter((u) => u.isActive).length}</p>
                </div>
                <div className="bg-card p-4 rounded-xl border border-border">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <XCircle className="w-4 h-4" />
                        <span className="text-sm">Inactive Users</span>
                    </div>
                    <p className="text-2xl font-bold text-red-500">{users.filter((u) => !u.isActive).length}</p>
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Search by phone or user ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-card border border-border rounded-lg pl-10 pr-4 py-3"
                />
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted">
                            <tr>
                                <th className="text-left p-4 font-medium">Phone Number</th>
                                <th className="text-left p-4 font-medium">User ID</th>
                                <th className="text-left p-4 font-medium">Balance</th>
                                <th className="text-left p-4 font-medium">Refer Count</th>
                                <th className="text-left p-4 font-medium">Plan Level</th>
                                <th className="text-left p-4 font-medium">Status</th>
                                <th className="text-left p-4 font-medium">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center p-8 text-muted-foreground">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="border-t border-border hover:bg-muted/50">
                                        <td className="p-4">{user.phoneNumber}</td>
                                        <td className="p-4">{user.userId}</td>
                                        <td className="p-4 font-bold">৳{user.balance.toFixed(2)}</td>
                                        <td className="p-4">{user.referCount || 0}</td>
                                        <td className="p-4">{user.planLevel || 0}</td>
                                        <td className="p-4">
                                            {user.isActive ? (
                                                <span className="bg-green-500/20 text-green-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Active
                                                </span>
                                            ) : (
                                                <span className="bg-red-500/20 text-red-500 text-xs px-2 py-1 rounded-full font-bold">
                                                    Inactive
                                                </span>
                                            )}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingUser(user);
                                                        setNewBalance(user.balance);
                                                    }}
                                                    className="p-2 bg-blue-500/20 text-blue-500 rounded-lg hover:bg-blue-500/30 transition-colors"
                                                    title="Edit Balance"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => toggleUserStatus(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.isActive
                                                        ? "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                        : "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                        }`}
                                                    title={user.isActive ? "Deactivate" : "Activate"}
                                                >
                                                    {user.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => toggleUserBan(user)}
                                                    className={`p-2 rounded-lg transition-colors ${user.isBanned
                                                        ? "bg-green-500/20 text-green-500 hover:bg-green-500/30"
                                                        : "bg-red-500/20 text-red-500 hover:bg-red-500/30"
                                                        }`}
                                                    title={user.isBanned ? "Unban User" : "Ban User"}
                                                >
                                                    {user.isBanned ? <UserCheck className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Balance Modal */}
            {editingUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-card p-6 rounded-xl border border-border max-w-md w-full">
                        <h2 className="text-2xl font-bold mb-4">Edit User Balance</h2>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-muted-foreground">User: {editingUser.phoneNumber}</p>
                                <p className="text-sm text-muted-foreground">Current Balance: ৳{editingUser.balance}</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2">New Balance (৳)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={newBalance}
                                    onChange={(e) => setNewBalance(Number(e.target.value))}
                                    className="w-full bg-background border border-border rounded-lg px-4 py-2"
                                    min="0"
                                />
                            </div>
                            <div className="flex gap-3">
                                <button
                                    onClick={updateUserBalance}
                                    className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg font-bold hover:opacity-90 transition-opacity"
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => setEditingUser(null)}
                                    className="px-6 bg-muted text-foreground py-2 rounded-lg font-bold hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
