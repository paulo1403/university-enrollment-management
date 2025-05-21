'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { toast } from 'sonner';

interface ClassTime {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  roomId: string | null;
  room?: {
    id: string;
    name: string;
    capacity: number | null;
  } | null;
}

interface Room {
  id: string;
  name: string;
  capacity: number | null;
  campusId: string;
}

interface ClassScheduleManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
  campusId: string;
}

const dayOptions = [
  { value: 'MONDAY', label: 'Lunes' },
  { value: 'TUESDAY', label: 'Martes' },
  { value: 'WEDNESDAY', label: 'Miércoles' },
  { value: 'THURSDAY', label: 'Jueves' },
  { value: 'FRIDAY', label: 'Viernes' },
  { value: 'SATURDAY', label: 'Sábado' },
];

const classTimeFormSchema = z
  .object({
    day: z.string({ required_error: 'Seleccione un día' }),
    startTime: z.string({ required_error: 'Seleccione una hora de inicio' }),
    endTime: z.string({
      required_error: 'Seleccione una hora de finalización',
    }),
    roomId: z
      .string({ required_error: 'Seleccione un aula' })
      .optional()
      .nullable(),
  })
  .refine(
    (data) => {
      if (!data.startTime || !data.endTime) return true;
      return data.startTime < data.endTime;
    },
    {
      message: 'La hora de finalización debe ser posterior a la hora de inicio',
      path: ['endTime'],
    }
  );

type ClassTimeFormValues = z.infer<typeof classTimeFormSchema>;

export function ClassScheduleManager({
  open,
  onOpenChange,
  courseId,
  campusId,
}: ClassScheduleManagerProps) {
  const [course, setCourse] = useState<any | null>(null);
  const [classTimes, setClassTimes] = useState<ClassTime[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingClass, setIsAddingClass] = useState(false);

  const form = useForm<ClassTimeFormValues>({
    resolver: zodResolver(classTimeFormSchema),
    defaultValues: {
      day: '',
      startTime: '',
      endTime: '',
      roomId: null,
    },
  });

  useEffect(() => {
    if (open && courseId) {
      fetchCourse();
      fetchRooms();
    }
  }, [open, courseId, campusId]);
  const fetchCourse = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/course/${courseId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar información del curso');
      }

      const data = await response.json();
      setCourse(data.course);
      setClassTimes(data.course.classTimes || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar información del curso');
    } finally {
      setLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/room?campusId=${campusId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar aulas disponibles');
      }

      const data = await response.json();
      setRooms(data.rooms || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar aulas disponibles');
    }
  };

  const onSubmit = async (values: ClassTimeFormValues) => {
    setIsAddingClass(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/course/${courseId}/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al añadir horario de clase');
      }

      toast.success('Horario de clase añadido correctamente');
      form.reset();
      fetchCourse(); // Refresh class times list
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al añadir horario de clase');
    } finally {
      setIsAddingClass(false);
    }
  };

  const deleteClassTime = async (classTimeId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/course/${courseId}/schedule/${classTimeId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || 'Error al eliminar horario de clase'
        );
      }

      toast.success('Horario de clase eliminado correctamente');
      fetchCourse(); // Refresh class times list
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al eliminar horario de clase');
    }
  };

  const formatTime = (dateTimeString: string) => {
    try {
      const time = new Date(dateTimeString);
      return time.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return dateTimeString;
    }
  };

  const translateDay = (day: string) => {
    const dayMap: { [key: string]: string } = {
      MONDAY: 'Lunes',
      TUESDAY: 'Martes',
      WEDNESDAY: 'Miércoles',
      THURSDAY: 'Jueves',
      FRIDAY: 'Viernes',
      SATURDAY: 'Sábado',
      SUNDAY: 'Domingo',
    };
    return dayMap[day] || day;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[700px]'>
        <DialogHeader>
          <DialogTitle>
            {loading
              ? 'Cargando horarios...'
              : `Horarios para ${course?.code} - ${course?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-6'>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='day'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Día</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleccionar día' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {dayOptions.map((day) => (
                            <SelectItem key={day.value} value={day.value}>
                              {day.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='roomId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Aula</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value || ''}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Seleccionar aula' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value=''>Sin aula asignada</SelectItem>
                          {rooms.map((room) => (
                            <SelectItem key={room.id} value={room.id}>
                              {room.name} (Cap: {room.capacity || 'N/A'})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='startTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de inicio</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='endTime'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hora de finalización</FormLabel>
                      <FormControl>
                        <Input type='time' {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button type='submit' disabled={isAddingClass}>
                {isAddingClass ? 'Añadiendo...' : 'Añadir Horario'}
              </Button>
            </form>
          </Form>

          <div className='border rounded-md'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Día</TableHead>
                  <TableHead>Hora Inicio</TableHead>
                  <TableHead>Hora Fin</TableHead>
                  <TableHead>Aula</TableHead>
                  <TableHead className='w-[100px]'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center'>
                      Cargando horarios...
                    </TableCell>
                  </TableRow>
                ) : classTimes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className='text-center'>
                      Este curso no tiene horarios asignados
                    </TableCell>
                  </TableRow>
                ) : (
                  classTimes.map((classTime) => (
                    <TableRow key={classTime.id}>
                      <TableCell>{translateDay(classTime.day)}</TableCell>
                      <TableCell>{formatTime(classTime.startTime)}</TableCell>
                      <TableCell>{formatTime(classTime.endTime)}</TableCell>
                      <TableCell>
                        {classTime.room?.name || 'Sin aula asignada'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() => deleteClassTime(classTime.id)}
                        >
                          Eliminar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
