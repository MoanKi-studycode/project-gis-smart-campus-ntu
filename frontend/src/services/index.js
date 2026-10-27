/**
 * Services Index
 * Export all API services from a single entry point
 */

export { default as authService } from './authService';
export { default as userService } from './userService';
export { default as academicService } from './academicService';
export { default as eventService } from './eventService';

// Re-export axios client for direct usage if needed
export { default as axiosClient } from '../api/axiosClient';
