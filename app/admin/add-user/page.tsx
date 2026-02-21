
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUser } from "@/app/actions/createUser";
import AdminHeader from "@/components/AdminHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, UserPlus, Eye, EyeOff } from "lucide-react";

export default function AdminCreateUser() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        nombre: "",
        apellido: "",
        email: "",
        cell: "",
        password: "",
        role: "captain" as "admin" | "captain",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await createUser(formData);

        if (res.success && res.data) {
            alert(`User created successfully!\nVerified in DB: ${res.verifiedInDb ? 'YES' : 'NO'}`);
            router.push("/admin");
        } else {
            alert("Error creating user: " + res.error);
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
            <AdminHeader title="Add New User" />
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 flex justify-center">
                <Card className="w-full max-w-md shadow-xl border-0">
                    <CardHeader className="space-y-1">
                        <CardTitle className="text-2xl font-bold text-center">Create New User</CardTitle>
                        <CardDescription className="text-center">
                            Add a new user to the system with the appropriate role
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="create-user-nombre">Nombre</Label>
                                <Input
                                    id="create-user-nombre"
                                    type="text"
                                    required
                                    value={formData.nombre}
                                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                                    placeholder="Nombre"
                                    className="h-11"
                                    autoComplete="new-user-nombre"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-user-apellido">Apellido</Label>
                                <Input
                                    id="create-user-apellido"
                                    type="text"
                                    required
                                    value={formData.apellido}
                                    onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                                    placeholder="Apellido"
                                    className="h-11"
                                    autoComplete="new-user-apellido"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-user-email">Email</Label>
                                <Input
                                    id="create-user-email"
                                    type="email"
                                    required
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="name@example.com"
                                    className="h-11"
                                    autoComplete="new-user-email"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-user-cell">Celular</Label>
                                <Input
                                    id="create-user-cell"
                                    type="tel"
                                    required
                                    value={formData.cell}
                                    onChange={(e) => setFormData({ ...formData, cell: e.target.value })}
                                    placeholder="Número de celular"
                                    className="h-11"
                                    autoComplete="new-user-cell"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="create-user-password">Contraseña</Label>
                                <div className="relative">
                                    <Input
                                        id="create-user-password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Contraseña"
                                        className="h-11 pr-10"
                                        autoComplete="new-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="create-user-role">Role</Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) => setFormData({ ...formData, role: value as "admin" | "captain" })}
                                >
                                    <SelectTrigger id="create-user-role" className="h-11">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="captain">Captain</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => router.push("/admin")}
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="mr-2 h-4 w-4" />
                                            Create User
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
