/**
 * Event Routes (SuKien)
 * CRUD operations for events
 */
import { Router } from 'express';
import EventModel from '../models/Event.model.js';

const router = Router();

/**
 * GET /api/events
 * Get all events with pagination and filtering
 */
router.get('/', async (req, res) => {
  try {
    const { search, doiTuong, trangThai, fromDate, toDate, page, limit } = req.query;
    
    const result = await EventModel.findAll({
      search,
      doiTuong,
      trangThai,
      fromDate,
      toDate,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20
    });
    
    res.json(result);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/events/upcoming
 * Get upcoming events
 */
router.get('/upcoming', async (req, res) => {
  try {
    const { limit } = req.query;
    const events = await EventModel.findUpcoming(limit ? parseInt(limit) : 10);
    res.json(events);
  } catch (error) {
    console.error('Get upcoming events error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/events/user
 * Get events for current user based on role
 */
router.get('/user', async (req, res) => {
  try {
    // Get user from header (in production, get from JWT)
    const maSo = req.headers['x-user-id'];
    const maVaiTro = req.headers['x-user-role'];
    const nienKhoa = req.headers['x-user-nienkhoa'];
    
    if (!maSo) {
      return res.status(401).json({ error: 'Chưa đăng nhập' });
    }
    
    const user = {
      maso: maSo,
      mavaitro: parseInt(maVaiTro || '3'),
      nienkhoa: nienKhoa
    };
    
    const events = await EventModel.findForUser(user);
    res.json(events);
  } catch (error) {
    console.error('Get user events error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * GET /api/events/:id
 * Get event by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const event = await EventModel.findById(parseInt(req.params.id));
    
    if (!event) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * POST /api/events
 * Create new event
 */
router.post('/', async (req, res) => {
  try {
    const eventData = req.body;
    
    // Validate required fields
    if (!eventData.tieuDe || !eventData.thoiGianBatDau || !eventData.thoiGianKetThuc) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }
    
    // Get creator from header
    eventData.nguoiTao = req.headers['x-user-id'] || 'admin';
    
    const newEvent = await EventModel.create(eventData);
    res.status(201).json({ success: true, event: newEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/events/:id
 * Update event
 */
router.put('/:id', async (req, res) => {
  try {
    const eventData = req.body;
    
    const updatedEvent = await EventModel.update(parseInt(req.params.id), eventData);
    
    if (!updatedEvent) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }
    
    res.json({ success: true, event: updatedEvent });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/events/:id/cancel
 * Cancel event (soft delete - keeps record but marks as cancelled)
 */
router.put('/:id/cancel', async (req, res) => {
  try {
    const result = await EventModel.cancel(parseInt(req.params.id));
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }
    
    res.json({ success: true, event: result, message: 'Hủy sự kiện thành công' });
  } catch (error) {
    console.error('Cancel event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * PUT /api/events/:id/restore
 * Restore cancelled event
 */
router.put('/:id/restore', async (req, res) => {
  try {
    const result = await EventModel.restore(parseInt(req.params.id));
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện hoặc sự kiện không ở trạng thái đã hủy' });
    }
    
    res.json({ success: true, event: result, message: 'Khôi phục sự kiện thành công' });
  } catch (error) {
    console.error('Restore event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete event permanently
 */
router.delete('/:id', async (req, res) => {
  try {
    const result = await EventModel.remove(parseInt(req.params.id));
    
    if (!result) {
      return res.status(404).json({ error: 'Không tìm thấy sự kiện' });
    }
    
    res.json({ success: true, message: 'Xóa sự kiện thành công' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Lỗi hệ thống' });
  }
});

export default router;
