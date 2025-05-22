'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { UserFormDialog } from '@/components/admin/user-form-dialog';
import { Pencil, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'STUDENT' | 'PROFESSOR' | 'ADMIN';
  twoFactorEnabled: boolean;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Debounce para el buscador
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (roleFilter && roleFilter !== 'all') params.append('role', roleFilter);
      if (search) params.append('search', search);
      const response = await fetch(
        `/api/auth/admin-user?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) {
        throw new Error('Error al cargar usuarios');
      }
      const data = await response.json();
      setUsers(data.users);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize, roleFilter, search]);

  const handleCreateUser = () => {
    setCurrentUser(null);
    setIsFormOpen(true);
  };

  const handleEditUser = (user: User) => {
    setCurrentUser(user);
    setIsFormOpen(true);
  };

  const handleDeleteUser = async (userId: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/admin-user/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al eliminar usuario');
      }

      toast.success('Usuario eliminado correctamente');
      fetchUsers();
    } catch (error) {
      console.error(error);
      toast.error('Error al eliminar usuario');
    }
  };

  const handleUserFormSubmit = () => {
    setIsFormOpen(false);
    fetchUsers();
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      case 'PROFESSOR':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'STUDENT':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      search.trim() === '' ||
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className='w-full'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div>
            <CardTitle>Gestión de Usuarios</CardTitle>
            <CardDescription>
              Administra los usuarios del sistema, incluyendo estudiantes,
              profesores y administradores.
            </CardDescription>
          </div>
          <Button onClick={handleCreateUser}>Nuevo Usuario</Button>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 mb-4 items-end'>
            <div>
              <Input
                type='text'
                placeholder='Buscar por nombre o email'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className='min-w-[200px]'
              />
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Rol</label>
              <Select
                value={roleFilter}
                onValueChange={(value) => {
                  setRoleFilter(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[120px]'>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos</SelectItem>
                  <SelectItem value='ADMIN'>Admin</SelectItem>
                  <SelectItem value='PROFESSOR'>Profesor</SelectItem>
                  <SelectItem value='STUDENT'>Estudiante</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>
                Por página
              </label>
              <Select
                value={String(pageSize)}
                onValueChange={(value) => {
                  setPageSize(Number(value));
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[100px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[25, 50, 100, 200].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className='ml-auto flex gap-2 items-center'>
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className='px-2 py-1 border rounded disabled:opacity-50'
              >
                Anterior
              </button>
              <span className='text-xs'>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || loading}
                className='px-2 py-1 border rounded disabled:opacity-50'
              >
                Siguiente
              </button>
            </div>
          </div>
          {loading ? (
            <div className='flex justify-center py-4'>Cargando usuarios...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center'>
                      No hay usuarios registrados
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className='font-medium'>
                        {user.name || '(Sin nombre)'}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.twoFactorEnabled ? 'Activado' : 'Desactivado'}
                      </TableCell>
                      <TableCell className='text-right flex gap-2 justify-end'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEditUser(user)}
                          title='Editar'
                          aria-label='Editar usuario'
                        >
                          <Pencil className='w-4 h-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDeleteUser(user.id)}
                          title='Eliminar'
                          aria-label='Eliminar usuario'
                        >
                          <Trash2 className='w-4 h-4 text-red-500' />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
          <div className='mt-2 text-xs text-gray-500'>
            Mostrando {users.length} de {total} usuarios.
          </div>
        </CardContent>
      </Card>

      <UserFormDialog
        isOpen={isFormOpen}
        user={currentUser}
        onClose={() => setIsFormOpen(false)}
        onSubmit={handleUserFormSubmit}
      />
    </div>
  );
}
