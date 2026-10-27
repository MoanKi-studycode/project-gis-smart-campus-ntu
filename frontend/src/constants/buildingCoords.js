/**
 * Building Coordinates - Calculated from GeoJSON centroids
 * 
 * These coordinates are the centroids of each building polygon
 * from building.json, used for camera fly-to functionality.
 * 
 * Updated: 2026-01-06
 */

export const BUILDING_COORDS = {
  // Main Teaching Buildings
  'G7': { lat: 12.267504, lng: 109.200004 },
  'G6': { lat: 12.267144, lng: 109.200477 },
  'G5': { lat: 12.267134, lng: 109.201077 },
  'G4': { lat: 12.266837, lng: 109.201223 },
  'G3': { lat: 12.267232, lng: 109.203683 },
  'G2': { lat: 12.268128, lng: 109.204166 },
  'G1': { lat: 12.268891, lng: 109.203878 },
  'G8': { lat: 12.268482, lng: 109.20148 },
  
  // Multipurpose Buildings
  'NDN': { lat: 12.2672, lng: 109.199939 },
  'NTD': { lat: 12.268207, lng: 109.202339 },
  'NTT': { lat: 12.267165, lng: 109.202737 },
  
  // Administrative Buildings  
  'KHC': { lat: 12.267437, lng: 109.20201 },
  
  // Laboratory Buildings
  'KTN': { lat: 12.266744, lng: 109.202273 },
  'KTN-TH': { lat: 12.266941, lng: 109.202669 },
  
  // K Buildings
  'K1': { lat: 12.269614, lng: 109.202549 },
  'K2': { lat: 12.269358, lng: 109.202175 },
  'K3': { lat: 12.269066, lng: 109.202074 },
  'K4': { lat: 12.268825, lng: 109.202076 },
  'K5': { lat: 12.269008, lng: 109.201447 },
  'K6': { lat: 12.26764, lng: 109.204269 },
  'K7': { lat: 12.267722, lng: 109.199172 },
  'K8': { lat: 12.269634, lng: 109.202176 },
  
  // A Buildings
  'A3': { lat: 12.268848, lng: 109.201056 },
  'A4': { lat: 12.268771, lng: 109.200857 },
  'A7': { lat: 12.268164, lng: 109.203671 },
  'A8': { lat: 12.267871, lng: 109.201695 },
  'A10': { lat: 12.26821, lng: 109.199599 },
  
  // B Buildings
  'B1': { lat: 12.268116, lng: 109.201581 },
  'B3': { lat: 12.267283, lng: 109.203233 },
  
  // Hall Buildings
  'HT1': { lat: 12.26672, lng: 109.201846 },
  'HT2': { lat: 12.267202, lng: 109.202407 },
  'HT3': { lat: 12.269043, lng: 109.199446 },
  
  // Library Buildings
  'TV1': { lat: 12.269493, lng: 109.203904 },
  'TV2': { lat: 12.269452, lng: 109.203392 },
  'TV3': { lat: 12.269663, lng: 109.203233 },
  
  // Special Buildings
  'KKTGT': { lat: 12.269128, lng: 109.203283 },
  'BT': { lat: 12.268294, lng: 109.201992 },
  'CLB': { lat: 12.26809, lng: 109.20202 },
  'CT': { lat: 12.269338, lng: 109.201792 },
  
  // Parking & Other
  'BN': { lat: 12.267901, lng: 109.200581 },
  'P1': { lat: 12.267783, lng: 109.19943 },
  'P2': { lat: 12.268732, lng: 109.201126 },
  'P3': { lat: 12.268645, lng: 109.202712 },
  'SB': { lat: 12.268561, lng: 109.203053 },
  
  // Default - Campus Center
  'default': { lat: 12.268143, lng: 109.201800 }
};

/**
 * Get building coordinates by code
 * Extracts building code from various formats including "Tòa nhà G6", "G6-201", etc.
 * @param {string} buildingName - Building name or code (e.g., "Tòa nhà G6", "G6", "G7.101", "G6-201", "Hội Trường 1")
 * @returns {{ lat: number, lng: number }}
 */
export function getBuildingCoords(buildingName) {
  if (!buildingName) return BUILDING_COORDS['default'];
  
  const input = buildingName.toUpperCase().trim();
  
  // Direct match first
  if (BUILDING_COORDS[input]) {
    return BUILDING_COORDS[input];
  }
  
  // Handle "Tòa nhà G6" or "TOA NHA G6" -> "G6"
  // Match both Vietnamese and ASCII versions
  const toaNhaMatch = input.match(/(?:TÒA\s*NHÀ|TOA\s*NHA)\s*([A-Z]+\d*)/i);
  if (toaNhaMatch) {
    const code = toaNhaMatch[1].toUpperCase();
    if (BUILDING_COORDS[code]) return BUILDING_COORDS[code];
  }
  
  // Handle "Hội Trường 1" or "HOI TRUONG 1" -> "HT1"
  const hoiTruongMatch = input.match(/(?:HỘI\s*TRƯỜNG|HOI\s*TRUONG)\s*(\d+)/i);
  if (hoiTruongMatch) {
    const code = `HT${hoiTruongMatch[1]}`;
    if (BUILDING_COORDS[code]) return BUILDING_COORDS[code];
  }
  
  // Handle "Nhà Đa Năng" -> "NDN"
  if (input.includes('NHÀ ĐA NĂNG') || input.includes('NHA DA NANG') || input.includes('DA NANG')) {
    return BUILDING_COORDS['NDN'] || BUILDING_COORDS['default'];
  }
  
  // Handle "Nhà Thi Đấu" -> "NTD"
  if (input.includes('NHÀ THI ĐẤU') || input.includes('NHA THI DAU') || input.includes('THI DAU')) {
    return BUILDING_COORDS['NTD'] || BUILDING_COORDS['default'];
  }
  
  // Extract building code from the end of the string
  // Handles: "Tòa nhà G6" -> G6, "G6-201" -> G6, "Phòng G7.101" -> G7
  const buildingCodeMatch = input.match(/([A-Z]+\d*)/g);
  if (buildingCodeMatch) {
    // Try each match from last to first (building code usually at end)
    for (let i = buildingCodeMatch.length - 1; i >= 0; i--) {
      const code = buildingCodeMatch[i];
      if (BUILDING_COORDS[code]) return BUILDING_COORDS[code];
    }
  }
  
  return BUILDING_COORDS['default'];
}

/**
 * Get coordinates from room code (e.g., "G6-201", "G7.101")
 * @param {string} roomCode - Full room code
 * @returns {{ lat: number, lng: number }}
 */
export function getCoordsFromRoom(roomCode) {
  if (!roomCode) return BUILDING_COORDS['default'];
  
  // Extract building code from room
  // Patterns: G6-201, G7.101, A10-301, KTN-101
  const match = roomCode.match(/^([A-Z]+\d*)/i);
  const buildingCode = match ? match[1].toUpperCase() : null;
  
  return buildingCode && BUILDING_COORDS[buildingCode] 
    ? BUILDING_COORDS[buildingCode] 
    : BUILDING_COORDS['default'];
}

export default BUILDING_COORDS;
