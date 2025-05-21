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
import { CourseFormDialog } from './course-form-dialog';
import { PrerequisitesManager } from './prerequisites-manager';
import { ClassScheduleManager } from './class-schedule-manager';
import { CourseModality } from '@prisma/client';

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
  professor: {
    user: {
      name: string;
      email: string;
    };
  } | null;
  campus: {
    id: string;
    name: string;
  };
  academicPeriod: {
    id: string;
    name: string;
  };
}

export function CourseManagement() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [prerequisitesCourseId, setPrerequisitesCourseId] = useState<
    string | null
  >(null);
  const [isPrerequisitesOpen, setIsPrerequisitesOpen] = useState(false);
  const [scheduleCourseId, setScheduleCourseId] = useState<string | null>(null);
  const [scheduleCampusId, setScheduleCampusId] = useState<string | null>(null);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/course', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Error al cargar cursos');
      }

      const data = await response.json();
      setCourses(data.courses);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleCreateCourse = () => {
    setCurrentCourse(null);
    setIsFormOpen(true);
  };

  const handleEditCourse = (course: Course) => {
    setCurrentCourse(course);
    setIsFormOpen(true);
  };
  const handleManagePrerequisites = (courseId: string) => {
    setPrerequisitesCourseId(courseId);
    setIsPrerequisitesOpen(true);
  };

  const handleManageSchedule = (courseId: string, campusId: string) => {
    setScheduleCourseId(courseId);
    setScheduleCampusId(campusId);
    setIsScheduleOpen(true);
  };
  const handleDeleteCourse = async (courseId: string) => {
    if (
      !confirm(
        '¿Estás seguro de eliminar este curso? Esta acción no se puede deshacer.'
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/course/${courseId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al eliminar curso');
      }

      toast.success('Curso eliminado correctamente');
      fetchCourses();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Error al eliminar curso');
    }
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle>Gestión de Cursos</CardTitle>
        <CardDescription>
          Administra los cursos universitarios disponibles
        </CardDescription>
        <Button onClick={handleCreateCourse}>Crear Nuevo Curso</Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p>Cargando cursos...</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nombre</TableHead>
                <TableHead>Créditos</TableHead>
                <TableHead>Modalidad</TableHead>
                <TableHead>Profesor</TableHead>
                <TableHead>Campus</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {courses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className='text-center'>
                    No hay cursos disponibles
                  </TableCell>
                </TableRow>
              ) : (
                courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>{course.code}</TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>{course.credits}</TableCell>
                    <TableCell>
                      <Badge variant='outline'>
                        {course.modality === 'PRESENCIAL'
                          ? 'Presencial'
                          : 'Virtual'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {course.professor?.user.name || 'Sin asignar'}
                    </TableCell>
                    <TableCell>{course.campus.name}</TableCell>
                    <TableCell>{course.academicPeriod.name}</TableCell>
                    <TableCell className='space-x-2'>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleEditCourse(course)}
                      >
                        Editar
                      </Button>{' '}
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => handleManagePrerequisites(course.id)}
                      >
                        Prerrequisitos
                      </Button>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          handleManageSchedule(course.id, course.campus.id)
                        }
                      >
                        Horarios
                      </Button>
                      <Button
                        variant='destructive'
                        size='sm'
                        onClick={() => handleDeleteCourse(course.id)}
                      >
                        Eliminar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {isFormOpen && (
        <CourseFormDialog
          open={isFormOpen}
          onOpenChange={setIsFormOpen}
          course={currentCourse}
          onSave={fetchCourses}
        />
      )}{' '}
      {isPrerequisitesOpen && prerequisitesCourseId && (
        <PrerequisitesManager
          open={isPrerequisitesOpen}
          onOpenChange={setIsPrerequisitesOpen}
          courseId={prerequisitesCourseId}
        />
      )}
      {isScheduleOpen && scheduleCourseId && scheduleCampusId && (
        <ClassScheduleManager
          open={isScheduleOpen}
          onOpenChange={setIsScheduleOpen}
          courseId={scheduleCourseId}
          campusId={scheduleCampusId}
        />
      )}
    </Card>
  );
}
