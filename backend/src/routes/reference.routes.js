/**
 * Reference Data Routes
 * Lookup tables and dropdown data
 */
import { Router } from 'express';
import ReferenceModel from '../models/Reference.model.js';

const router = Router();

/**
 * GET /api/reference/roles
 * Get all roles
 */
router.get('/roles', async (req, res) => {
  try {
    const roles = await ReferenceModel.getRoles();
    res.json(roles);
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/periods
 * Get all class periods
 */
router.get('/periods', async (req, res) => {
  try {
    const periods = await ReferenceModel.getPeriods();
    res.json(periods);
  } catch (error) {
    console.error('Get periods error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/faculties
 * Get all faculties
 */
router.get('/faculties', async (req, res) => {
  try {
    const faculties = await ReferenceModel.getFaculties();
    res.json(faculties);
  } catch (error) {
    console.error('Get faculties error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/majors
 * Get all majors, optionally filtered by faculty
 */
router.get('/majors', async (req, res) => {
  try {
    const { faculty } = req.query;
    const majors = await ReferenceModel.getMajors(faculty);
    res.json(majors);
  } catch (error) {
    console.error('Get majors error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/buildings
 * Get all buildings
 */
router.get('/buildings', async (req, res) => {
  try {
    const buildings = await ReferenceModel.getBuildings();
    res.json(buildings);
  } catch (error) {
    console.error('Get buildings error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/classrooms
 * Get all classrooms, optionally filtered by building
 */
router.get('/classrooms', async (req, res) => {
  try {
    const { building } = req.query;
    const classrooms = await ReferenceModel.getClassrooms(building);
    res.json(classrooms);
  } catch (error) {
    console.error('Get classrooms error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/semesters
 * Get all semesters
 */
router.get('/semesters', async (req, res) => {
  try {
    const semesters = await ReferenceModel.getSemesters();
    res.json(semesters);
  } catch (error) {
    console.error('Get semesters error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/academic-years
 * Get distinct academic years
 */
router.get('/academic-years', async (req, res) => {
  try {
    const years = await ReferenceModel.getAcademicYears();
    res.json(years);
  } catch (error) {
    console.error('Get academic years error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/student-years
 * Get distinct student years (niên khóa)
 */
router.get('/student-years', async (req, res) => {
  try {
    const years = await ReferenceModel.getStudentYears();
    res.json(years);
  } catch (error) {
    console.error('Get student years error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/weekdays
 * Get weekdays in Vietnamese
 */
router.get('/weekdays', (req, res) => {
  const weekdays = [
    { value: 2, label: 'Thứ 2' },
    { value: 3, label: 'Thứ 3' },
    { value: 4, label: 'Thứ 4' },
    { value: 5, label: 'Thứ 5' },
    { value: 6, label: 'Thứ 6' },
    { value: 7, label: 'Thứ 7' },
    { value: 8, label: 'Chủ nhật' }
  ];
  res.json(weekdays);
});

/**
 * GET /api/reference/dropdown/lecturers
 * Get lecturers for dropdown
 */
router.get('/dropdown/lecturers', async (req, res) => {
  try {
    const lecturers = await ReferenceModel.getLecturersForDropdown();
    res.json(lecturers);
  } catch (error) {
    console.error('Get lecturers dropdown error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/dropdown/subjects
 * Get subjects for dropdown
 */
router.get('/dropdown/subjects', async (req, res) => {
  try {
    const subjects = await ReferenceModel.getSubjectsForDropdown();
    res.json(subjects);
  } catch (error) {
    console.error('Get subjects dropdown error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/buildings/:mapKey
 * Get building details by MapKey (used by map search)
 */
router.get('/buildings/:mapKey', async (req, res) => {
  try {
    const { mapKey } = req.params;
    const building = await ReferenceModel.getBuildingByMapKey(mapKey);
    if (!building) {
      return res.status(404).json({ error: 'Không tìm thấy tòa nhà' });
    }
    res.json(building);
  } catch (error) {
    console.error('Get building by mapKey error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/buildings/:maToaNha/floors
 * Get distinct floors for a building
 */
router.get('/buildings/:maToaNha/floors', async (req, res) => {
  try {
    const { maToaNha } = req.params;
    const classrooms = await ReferenceModel.getClassrooms(maToaNha);
    const floors = [...new Set(classrooms.map(c => c.sotang))].sort((a, b) => a - b);
    res.json(floors);
  } catch (error) {
    console.error('Get building floors error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/reference/buildings/:maToaNha/classrooms
 * Get classrooms for a building, optionally filtered by floor
 */
router.get('/buildings/:maToaNha/classrooms', async (req, res) => {
  try {
    const { maToaNha } = req.params;
    const { floor } = req.query;
    const classrooms = await ReferenceModel.getClassrooms(maToaNha, floor ? parseInt(floor) : null);
    res.json(classrooms);
  } catch (error) {
    console.error('Get building classrooms error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;
