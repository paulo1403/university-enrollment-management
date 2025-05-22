'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar as CalendarIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  timestamp: string;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  useEffect(() => {
    async function fetchAuditLogs() {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        const params = new URLSearchParams({
          page: String(page),
          pageSize: String(pageSize),
        });
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const response = await fetch(
          `/api/auth/admin-audit?${params.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error('Error al cargar los registros de auditoría');
        }
        const data = await response.json();
        setLogs(data.logs);
        setTotalPages(data.totalPages);
        setTotal(data.total);
      } catch (error) {
        console.error(error);
        toast.error('Error al cargar los registros de auditoría');
      } finally {
        setLoading(false);
      }
    }
    fetchAuditLogs();
  }, [page, pageSize, startDate, endDate]);

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'CREATE':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'DELETE':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handlePrevPage = () => setPage((p) => Math.max(1, p - 1));
  const handleNextPage = () => setPage((p) => Math.min(totalPages, p + 1));
  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setPageSize(Number(e.target.value));
    setPage(1);
  };
  const handleDateChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setter(e.target.value);
      setPage(1);
    };

  return (
    <div className='w-full'>
      <Card>
        <CardHeader>
          <CardTitle>Registro de Auditoría</CardTitle>
          <CardDescription>
            Historial de cambios realizados en el sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 mb-4 items-end'>
            <div>
              <label className='block text-xs font-medium mb-1'>Desde</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[140px] justify-start text-left font-normal',
                      !startDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {startDate ? (
                      format(new Date(startDate), 'PPP')
                    ) : (
                      <span>Desde</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={startDate ? new Date(startDate) : undefined}
                    onSelect={(date) => {
                      setStartDate(date ? date.toISOString().slice(0, 10) : '');
                      setPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Hasta</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={'outline'}
                    className={cn(
                      'w-[140px] justify-start text-left font-normal',
                      !endDate && 'text-muted-foreground'
                    )}
                  >
                    <CalendarIcon className='mr-2 h-4 w-4' />
                    {endDate ? (
                      format(new Date(endDate), 'PPP')
                    ) : (
                      <span>Hasta</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0'>
                  <Calendar
                    mode='single'
                    selected={endDate ? new Date(endDate) : undefined}
                    onSelect={(date) => {
                      setEndDate(date ? date.toISOString().slice(0, 10) : '');
                      setPage(1);
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
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
                <SelectTrigger className='border rounded px-2 py-1 text-sm w-24'>
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
                onClick={handlePrevPage}
                disabled={page === 1 || loading}
                className='px-2 py-1 border rounded disabled:opacity-50'
              >
                Anterior
              </button>
              <span className='text-xs'>
                Página {page} de {totalPages}
              </span>
              <button
                onClick={handleNextPage}
                disabled={page === totalPages || loading}
                className='px-2 py-1 border rounded disabled:opacity-50'
              >
                Siguiente
              </button>
            </div>
          </div>
          <div className='flex flex-wrap gap-4 mb-4 items-end'>
            {(startDate || endDate) && (
              <Button
                variant='ghost'
                size='sm'
                className='h-8 px-2 text-xs flex gap-1 items-center'
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                <X className='w-4 h-4' /> Limpiar filtros
              </Button>
            )}
          </div>
          {loading ? (
            <div className='flex justify-center py-4'>
              Cargando registros...
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Usuario</TableHead>
                    <TableHead>Acción</TableHead>
                    <TableHead>Entidad</TableHead>
                    <TableHead>ID Entidad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className='text-center'>
                        No hay registros de auditoría
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>{formatDate(log.timestamp)}</TableCell>
                        <TableCell>{log.userId}</TableCell>
                        <TableCell>
                          <Badge className={getActionBadgeColor(log.action)}>
                            {log.action}
                          </Badge>
                        </TableCell>
                        <TableCell>{log.entityType}</TableCell>
                        <TableCell className='font-mono text-xs'>
                          {log.entityId}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
              <div className='mt-2 text-xs text-gray-500'>
                Mostrando {logs.length} de {total} registros.
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
