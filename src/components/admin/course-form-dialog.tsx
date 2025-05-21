'use client';

import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CourseModality } from '@prisma/client';

interface Professor {
  userId: string;
  user: {
    name: string;
    email: string;
  };
}

interface Campus {
  id: string;
  name: string;
}

interface AcademicPeriod {
  id: string;
  name: string;
}

interface Course {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credits: number;
  capacity: number;
  modality: CourseModality;
  professorId: string | null;
  campusId: string;
  academicPeriodId: string;
  professor?: {
    user: {
      name: string;
      email: string;
    };
  } | null;
}

interface CourseFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: Course | null;
  onSave: () => void;
}

const courseFormSchema = z.object({
  code: z.string().min(3, 'El código debe tener al menos 3 caracteres'),
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional().nullable(),
  credits: z.coerce.number().int().min(1, 'Debe tener al menos 1 crédito'),
  capacity: z.coerce.number().int().min(1, 'La capacidad debe ser al menos 1'),
  professorId: z.string().optional().nullable(),
  campusId: z.string().min(1, 'Seleccione un campus'),
  modality: z.nativeEnum(CourseModality),
  academicPeriodId: z.string().min(1, 'Seleccione un periodo académico'),
});

type CourseFormValues = z.infer<typeof courseFormSchema>;

export function CourseFormDialog({
  open,
  onOpenChange,
  course,
  onSave,
}: CourseFormDialogProps) {
  const [professors, setProfessors] = useState<Professor[]>([]);
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [academicPeriods, setAcademicPeriods] = useState<AcademicPeriod[]>([]);
  const [loading, setLoading] = useState(false);
  const form = useForm<CourseFormValues>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      code: course?.code || '',
      name: course?.name || '',
      description: course?.description || '',
      credits: course?.credits || 3,
      capacity: course?.capacity || 30,
      professorId: course?.professorId || '',
      campusId: course?.campusId || '',
      modality: course?.modality || CourseModality.PRESENCIAL,
      academicPeriodId: course?.academicPeriodId || '',
    },
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        // Fetch professors
        const professorResponse = await fetch(
          '/api/auth/admin-user?role=PROFESSOR',
          {
            headers,
          }
        );
        if (professorResponse.ok) {
          const data = await professorResponse.json();
          setProfessors(data.professors || []);
        }

        // Fetch campuses
        const campusResponse = await fetch('/api/admin/campus', {
          headers,
        });
        if (campusResponse.ok) {
          const data = await campusResponse.json();
          setCampuses(data.campuses || []);
        }

        // Fetch academic periods
        const periodsResponse = await fetch('/api/admin/academic-period', {
          headers,
        });
        if (periodsResponse.ok) {
          const data = await periodsResponse.json();
          setAcademicPeriods(data.academicPeriods || []);
        }
      } catch (error) {
        console.error('Error fetching form data:', error);
        toast.error('Error al cargar datos del formulario');
      }
    };

    fetchData();
  }, []);
  const onSubmit = async (values: CourseFormValues) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const url = course
        ? `/api/admin/course/${course.id}`
        : '/api/admin/course';
      const method = course ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al guardar el curso');
      }

      toast.success(
        course
          ? 'Curso actualizado correctamente'
          : 'Curso creado correctamente'
      );
      onSave();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Error saving course:', error);
      toast.error(error.message || 'Error al guardar el curso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>
            {course ? 'Editar Curso' : 'Crear Nuevo Curso'}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='code'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código del Curso</FormLabel>
                    <FormControl>
                      <Input placeholder='EJ: MAT101' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='name'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder='Nombre del curso' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descripción</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Descripción del curso'
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='grid grid-cols-2 gap-4'>
              <FormField
                control={form.control}
                name='credits'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Créditos</FormLabel>
                    <FormControl>
                      <Input type='number' min='1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='capacity'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidad</FormLabel>
                    <FormControl>
                      <Input type='number' min='1' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='grid grid-cols-2 gap-4'>
              {' '}
              <FormField
                control={form.control}
                name='modality'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidad</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || 'PRESENCIAL'}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleccionar modalidad' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value='PRESENCIAL'>Presencial</SelectItem>
                        <SelectItem value='VIRTUAL'>Virtual</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name='professorId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profesor</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleccionar profesor' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value=''>Sin asignar</SelectItem>
                        {professors.map((professor) => (
                          <SelectItem
                            key={professor.userId}
                            value={professor.userId}
                          >
                            {professor.user.name}
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
              {' '}
              <FormField
                control={form.control}
                name='campusId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Campus</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleccionar campus' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {campuses.map((campus) => (
                          <SelectItem key={campus.id} value={campus.id}>
                            {campus.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />{' '}
              <FormField
                control={form.control}
                name='academicPeriodId'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodo Académico</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value || ''}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder='Seleccionar periodo' />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicPeriods.map((period) => (
                          <SelectItem key={period.id} value={period.id}>
                            {period.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
