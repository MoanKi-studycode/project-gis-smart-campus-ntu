const express = require('express');
const router = express.Router();
const db = require('../db');

// Start Attendance (Teacher)
router.post('/start', async (req, res) => {
  const { classId, teacherId, location } = req.body;
  // Logic to start attendance session (maybe store in Redis or DB)
  // For now, just return success
  res.json({ success: true, message: 'Attendance session started' });
});

// Check-in (Student)
router.post('/checkin', async (req, res) => {
  const { studentId, classId, location } = req.body; // location: { lat, lon }

  try {
    // 1. Verify student is in class (optional)
    
    // 2. Verify location (Geofencing)
    // Check if student is within the building polygon of the class room
    // This requires joining lophoc -> phonghoc -> toanha
    
    // Note: This assumes the database is populated and PostGIS is enabled.
    
    const checkLocationQuery = `
      SELECT ST_Contains(
        (SELECT vitri FROM toanha WHERE matoanha = (
            SELECT matoanha FROM phonghoc WHERE maphong = (
                SELECT maphong FROM lophoc WHERE malop = $1
            )
        )),
        ST_SetSRID(ST_MakePoint($2, $3), 4326)
      ) as is_inside
    `;

    // Mocking DB call for now if DB is not set up, but code assumes DB connection
    // const locationResult = await db.query(checkLocationQuery, [classId, location.lon, location.lat]);
    // const isInside = locationResult.rows[0].is_inside;

    // For demonstration without running DB:
    const isInside = true; 

    if (!isInside) {
      return res.status(400).json({ success: false, message: 'You are not in the classroom!' });
    }

    // 3. Record attendance
    const insertQuery = `
      INSERT INTO diemdanh (malop, masosv, vitri, hople)
      VALUES ($1, $2, ST_SetSRID(ST_MakePoint($3, $4), 4326), $5)
      RETURNING *
    `;
    
    // await db.query(insertQuery, [classId, studentId, location.lon, location.lat, true]);

    res.json({ success: true, message: 'Check-in successful' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
