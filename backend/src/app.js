/**
 * Express Application Setup
 * Configure middleware and mount all API routes
 * 
 * NOTE: NO settings routes - settings are UI-only (per architecture requirements)
 */
import express from 'express';
import cors from 'cors';

// Import routes
import authRoutes from './routes/auth.routes.js';
import usersRoutes from './routes/users.routes.js';
import subjectsRoutes from './routes/subjects.routes.js';
import coursesRoutes from './routes/courses.routes.js';
import eventsRoutes from './routes/events.routes.js';
import attendanceRoutes from './routes/attendance.routes.js';
import referenceRoutes from './routes/reference.routes.js';
import roomStatusRoutes from './routes/room-status.routes.js';

const app = express();

// ============ Middleware ============
app.use(cors());
// Increase body size limit for avatar uploads (base64 images)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Request logging (development)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============ API Routes ============

// Health check
app.get('/', (req, res) => {
  res.json({ 
    message: 'NTU Smart Campus Backend',
    version: '2.0.0',
    status: 'running'
  });
});

app.get('/api', (req, res) => {
  res.json({
    message: 'NTU Smart Campus API',
    version: '2.0.0',
    endpoints: [
      '/api/auth - Authentication',
      '/api/users - User management',
      '/api/subjects - Subject management',
      '/api/courses - Course management',
      '/api/events - Event management',
      '/api/attendance - Attendance management',
      '/api/reference - Reference data'
    ]
  });
});

// Mount route modules
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/subjects', subjectsRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reference', referenceRoutes);
app.use('/api/room-status', roomStatusRoutes);

// ============ Error Handling ============

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({ 
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} không tồn tại`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Lỗi hệ thống'
  });
});

export default app;
