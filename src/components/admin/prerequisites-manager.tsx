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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Prerequisite {
  prerequisiteId: string;
  prerequisite: {
    id: string;
    code: string;
    name: string;
  };
}

interface Course {
  id: string;
  code: string;
  name: string;
}

interface PrerequisitesManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  courseId: string;
}

export function PrerequisitesManager({
  open,
  onOpenChange,
  courseId,
}: PrerequisitesManagerProps) {
  const [course, setCourse] = useState<Course | null>(null);
  const [prerequisites, setPrerequisites] = useState<Prerequisite[]>([]);
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (open && courseId) {
      fetchCourse();
      fetchAvailableCourses();
    }
  }, [open, courseId]);

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
      setPrerequisites(data.course.coursePrerequisites || []);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar información del curso');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/course', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar cursos disponibles');
      }

      const data = await response.json();
      // Filter out the current course and any courses that are already prerequisites
      const filteredCourses = data.courses.filter(
        (c: Course) => c.id !== courseId
      );
      setAvailableCourses(filteredCourses);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar cursos disponibles');
    }
  };

  const addPrerequisite = async () => {
    if (!selectedCourseId) {
      toast.error('Seleccione un curso para añadir como prerrequisito');
      return;
    }

    setAdding(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/course/${courseId}/prerequisites`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ prerequisiteId: selectedCourseId }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al añadir prerrequisito');
      }

      toast.success('Prerrequisito añadido correctamente');
      setSelectedCourseId('');
      fetchCourse(); // Refresh prerequisites list
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al añadir prerrequisito');
    } finally {
      setAdding(false);
    }
  };

  const removePrerequisite = async (prerequisiteId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `/api/admin/course/${courseId}/prerequisites?prerequisiteId=${prerequisiteId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar prerrequisito');
      }

      toast.success('Prerrequisito eliminado correctamente');
      fetchCourse(); // Refresh prerequisites list
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al eliminar prerrequisito');
    }
  };

  // Filter out courses that are already prerequisites
  const getFilteredAvailableCourses = () => {
    if (!prerequisites || !availableCourses) return availableCourses;

    const prerequisiteIds = prerequisites.map((p) => p.prerequisite.id);
    return availableCourses.filter((c) => !prerequisiteIds.includes(c.id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-[600px]'>
        <DialogHeader>
          <DialogTitle>
            {loading
              ? 'Cargando prerrequisitos...'
              : `Prerrequisitos para ${course?.code} - ${course?.name}`}
          </DialogTitle>
        </DialogHeader>

        <div className='space-y-4'>
          <div className='flex gap-2'>
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
              disabled={adding}
            >
              <SelectTrigger className='w-full'>
                <SelectValue placeholder='Seleccionar curso para añadir como prerrequisito' />
              </SelectTrigger>
              <SelectContent>
                {getFilteredAvailableCourses().map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={addPrerequisite}
              disabled={!selectedCourseId || adding}
            >
              {adding ? 'Añadiendo...' : 'Añadir'}
            </Button>
          </div>

          <div className='border rounded-md'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead className='w-[100px]'>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center'>
                      Cargando prerrequisitos...
                    </TableCell>
                  </TableRow>
                ) : prerequisites.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className='text-center'>
                      Este curso no tiene prerrequisitos
                    </TableCell>
                  </TableRow>
                ) : (
                  prerequisites.map((prereq) => (
                    <TableRow key={prereq.prerequisiteId}>
                      <TableCell>{prereq.prerequisite.code}</TableCell>
                      <TableCell>{prereq.prerequisite.name}</TableCell>
                      <TableCell>
                        <Button
                          variant='destructive'
                          size='sm'
                          onClick={() =>
                            removePrerequisite(prereq.prerequisiteId)
                          }
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
