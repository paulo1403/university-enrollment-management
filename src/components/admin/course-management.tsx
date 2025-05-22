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
import {
  IconEdit,
  IconTrash,
  IconListDetails,
  IconClock,
  IconUser,
  IconBook,
  IconSchool,
  IconChevronDown,
  IconDotsVertical,
} from '@tabler/icons-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

  // Filters and pagination
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [modality, setModality] = useState('all');
  const [campusId, setCampusId] = useState('all');
  const [academicPeriodId, setAcademicPeriodId] = useState('all');
  const [professorId, setProfessorId] = useState('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Filter options
  const [campuses, setCampuses] = useState<{ id: string; name: string }[]>([]);
  const [periods, setPeriods] = useState<{ id: string; name: string }[]>([]);
  const [professors, setProfessors] = useState<{ id: string; name: string }[]>(
    []
  );

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  // Fetch filter options on mount
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        const [campusRes, periodRes, profRes] = await Promise.all([
          fetch('/api/admin/campus', { headers }),
          fetch('/api/admin/academic-period', { headers }),
          fetch('/api/auth/admin-user?role=PROFESSOR', { headers }),
        ]);
        if (campusRes.ok) {
          const data = await campusRes.json();
          setCampuses(data.campuses || []);
        }
        if (periodRes.ok) {
          const data = await periodRes.json();
          setPeriods(data.academicPeriods || []);
        }
        if (profRes.ok) {
          const data = await profRes.json();
          setProfessors(
            (data.professors || []).map((p: any) => ({
              id: p.id,
              name: p.name,
            }))
          );
        }
      } catch (e) {
        // ignore
      }
    };
    fetchOptions();
  }, []);

  // Fetch courses with filters and pagination
  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: String(page),
        pageSize: String(pageSize),
      });
      if (search) params.append('search', search);
      if (modality !== 'all') params.append('modality', modality);
      if (campusId !== 'all') params.append('campusId', campusId);
      if (academicPeriodId !== 'all')
        params.append('academicPeriodId', academicPeriodId);
      if (professorId !== 'all') params.append('professorId', professorId);
      const response = await fetch(`/api/admin/course?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Error al cargar cursos');
      const data = await response.json();
      setCourses(data.courses);
      setTotalPages(data.totalPages || 1);
      setTotal(data.total || 0);
    } catch (error) {
      console.error(error);
      toast.error('Error al cargar cursos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    page,
    pageSize,
    search,
    modality,
    campusId,
    academicPeriodId,
    professorId,
  ]);

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
    <div className='w-full'>
      <Card>
        <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
          <div>
            <CardTitle>Gestión de Cursos</CardTitle>
            <CardDescription>
              Administra los cursos universitarios disponibles
            </CardDescription>
          </div>
          <Button onClick={handleCreateCourse}>
            <IconBook className='mr-2 size-4' /> Nuevo Curso
          </Button>
        </CardHeader>
        <CardContent>
          <div className='flex flex-wrap gap-4 mb-4 items-end'>
            <div>
              <Input
                type='text'
                placeholder='Buscar por código o nombre'
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className='min-w-[200px]'
              />
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>
                Modalidad
              </label>
              <Select
                value={modality}
                onValueChange={(value) => {
                  setModality(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[120px]'>
                  <SelectValue placeholder='Todas' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todas</SelectItem>
                  <SelectItem value='PRESENCIAL'>Presencial</SelectItem>
                  <SelectItem value='VIRTUAL'>Virtual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Campus</label>
              <Select
                value={campusId}
                onValueChange={(value) => {
                  setCampusId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[120px]'>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos</SelectItem>
                  {campuses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Periodo</label>
              <Select
                value={academicPeriodId}
                onValueChange={(value) => {
                  setAcademicPeriodId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[120px]'>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos</SelectItem>
                  {periods.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className='block text-xs font-medium mb-1'>Profesor</label>
              <Select
                value={professorId}
                onValueChange={(value) => {
                  setProfessorId(value);
                  setPage(1);
                }}
              >
                <SelectTrigger className='min-w-[120px]'>
                  <SelectValue placeholder='Todos' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Todos</SelectItem>
                  {professors.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
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
                aria-label='Página anterior'
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
                aria-label='Página siguiente'
              >
                Siguiente
              </button>
            </div>
          </div>
          {loading ? (
            <div className='flex justify-center py-4'>Cargando cursos...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <IconListDetails className='inline size-4 mr-1' /> Código
                  </TableHead>
                  <TableHead>
                    <IconBook className='inline size-4 mr-1' /> Nombre
                  </TableHead>
                  <TableHead>Créditos</TableHead>
                  <TableHead>
                    <IconClock className='inline size-4 mr-1' /> Modalidad
                  </TableHead>
                  <TableHead>
                    <IconUser className='inline size-4 mr-1' /> Profesor
                  </TableHead>
                  <TableHead>
                    <IconSchool className='inline size-4 mr-1' /> Campus
                  </TableHead>
                  <TableHead>Periodo</TableHead>
                  <TableHead className='text-right'>Acciones</TableHead>
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
                      <TableCell className='font-mono'>{course.code}</TableCell>
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
                      <TableCell className='text-right space-x-1'>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Editar'
                          onClick={() => handleEditCourse(course)}
                        >
                          <IconEdit className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Prerrequisitos'
                          onClick={() => handleManagePrerequisites(course.id)}
                        >
                          <IconListDetails className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Horarios'
                          onClick={() =>
                            handleManageSchedule(course.id, course.campus.id)
                          }
                        >
                          <IconClock className='size-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          aria-label='Eliminar'
                          onClick={() => handleDeleteCourse(course.id)}
                        >
                          <IconTrash className='size-4 text-red-500' />
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
        )}
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
    </div>
  );
}
