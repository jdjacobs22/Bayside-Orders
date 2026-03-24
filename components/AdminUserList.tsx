"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import Link from "next/link";
import { getUsers, deleteUser, changeUserPassword } from "@/app/actions/createUser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Trash2, Loader2, User, Key, Eye, EyeOff } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

/**
 * AdminUserList Component
 * 
 * Renders a comprehensive list of all system users (Admins and Captains).
 * 
 * Features:
 * - Fetches user data asynchronously on mount.
 * - Displays users in a responsive table with their details:
 *   - Name (First and Last)
 *   - Email address
 *   - System Role (Admin/Captain)
 *   - Contact Phone (Cell)
 *   - Join Date (CreatedAt)
 * - Provides administrative actions:
 *   - Navigation to the "Add New User" form.
 *   - Dynamic deletion of users with confirmation prompts.
 *   - Loading state indicators for both initialization and deletion.
 * 
 * @returns A structured Card component containing the user table.
 */
export default function AdminUserList() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    async function fetchUsers() {
      const res = await getUsers();
      if (res.success && res.data) {
        setUsers(res.data);
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleDelete = async (userId: string, userName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar al usuario ${userName}? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }

    setDeletingId(userId);
    const res = await deleteUser(userId);

    if (res.success) {
      setUsers(users.filter((user) => user.id !== userId));
      alert("Usuario eliminado exitosamente");
    } else {
      alert("Error al eliminar el usuario: " + res.error);
    }
    setDeletingId(null);
  };

  const handleChangePassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("Las contraseñas no coinciden");
      return;
    }

    setUpdatingPassword(true);
    const res = await changeUserPassword(selectedUser.id, newPassword);
    setUpdatingPassword(false);

    if (res.success) {
      toast.success("Contraseña actualizada exitosamente");
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } else {
      toast.error("Error al actualizar contraseña: " + res.error);
    }
  };

  const openPasswordDialog = (user: any) => {
    setSelectedUser(user);
    setIsPasswordDialogOpen(true);
    setNewPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-0 shadow-xl mt-8">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-2xl font-bold">System Users</CardTitle>
        <Button asChild>
          <Link href="/admin/add-user" className="gap-2">
            <Plus className="h-4 w-4" />
            Add New User
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            No users found.
          </div>
        ) : (
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Cell</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        {user.nombre} {user.apellido}
                      </div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>{user.cell || "-"}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {user.createdAt
                        ? format(new Date(user.createdAt), "MMM d, yyyy", { locale: es })
                        : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openPasswordDialog(user)}
                          className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(user.id, `${user.nombre} ${user.apellido}`)}
                          disabled={deletingId === user.id}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          {deletingId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
            <DialogHeader>
              <DialogTitle>Cambiar Contraseña</DialogTitle>
              <DialogDescription>
                Actualiza la contraseña para {selectedUser?.nombre} {selectedUser?.apellido}.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="password">Nueva Contraseña</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPasswordDialogOpen(false)}
                disabled={updatingPassword}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={updatingPassword}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {updatingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  "Guardar Cambios"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
