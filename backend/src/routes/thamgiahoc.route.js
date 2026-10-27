// thamgiahoc.route.js
// Role: Routes for attendance (ThamGiaHoc / check-in)
const express = require('express')
const router = express.Router()

// POST /thamgiahoc - record a student's attendance for a given LichHoc
router.post('/', (req, res) => {
  res.json({ message: 'Implement check-in storage in thamgiahoc.controller' })
})

module.exports = router
