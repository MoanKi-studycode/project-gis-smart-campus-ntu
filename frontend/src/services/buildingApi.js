/**
 * Building API Service
 * Handles all building, classroom, and room status related API calls
 */
import axiosClient from '../api/axiosClient';

const API_BASE = '/reference';

export const buildingApi = {
  /**
   * Get all buildings
   * @returns {Promise<Array>}
   */
  getBuildings: async () => {
    return axiosClient.get(`${API_BASE}/buildings`);
  },

  /**
   * Get building details by MapKey (used by map search)
   * @param {string} mapKey - Building MapKey or MaToaNha
   * @returns {Promise<Object>}
   */
  getBuildingByMapKey: async (mapKey) => {
    return axiosClient.get(`${API_BASE}/buildings/${mapKey}`);
  },

  /**
   * Get floors for a building
   * @param {string} maToaNha - Building code
   * @returns {Promise<Array<number>>}
   */
  getFloors: async (maToaNha) => {
    return axiosClient.get(`${API_BASE}/buildings/${maToaNha}/floors`);
  },

  /**
   * Get classrooms for a building
   * @param {string} maToaNha - Building code
   * @param {number} [floor] - Optional floor number filter
   * @returns {Promise<Array>}
   */
  getClassrooms: async (maToaNha, floor = null) => {
    const params = floor ? `?floor=${floor}` : '';
    return axiosClient.get(`${API_BASE}/buildings/${maToaNha}/classrooms${params}`);
  },

  /**
   * Get real-time room status
   * @param {string} maPhong - Room code
   * @returns {Promise<Object>}
   */
  getRoomStatus: async (maPhong) => {
    return axiosClient.get(`/room-status/${maPhong}`);
  },

  /**
   * Get status of all rooms in a building
   * @param {string} maToaNha - Building code
   * @param {number} [floor] - Optional floor filter
   * @returns {Promise<Array>}
   */
  getBuildingRoomStatuses: async (maToaNha, floor = null) => {
    const params = floor ? `?floor=${floor}` : '';
    return axiosClient.get(`/room-status/building/${maToaNha}${params}`);
  }
};

export default buildingApi;
