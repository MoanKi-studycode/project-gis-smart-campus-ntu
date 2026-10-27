// checkin.service.js
// Role: Frontend helpers to call check-in (thamgiahoc) endpoints
import { apiFetch } from './api'

export const checkin = {
  async submit(studentId, lichHocId) {
    return apiFetch('/thamgiahoc', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ studentId, lichHocId })
    })
  }
}
