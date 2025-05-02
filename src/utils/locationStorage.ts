
export interface LocationPoint {
  id: string;
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

export interface DailyLocationGroup {
  date: Date;
  points: LocationPoint[];
}

const STORAGE_KEY = 'wander-location-history';

export const storeLocation = (location: LocationPoint): void => {
  const history = getLocationHistory();
  history.push(location);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
};

export const getLocationHistory = (): LocationPoint[] => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  if (!storedData) return [];
  
  try {
    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error parsing location history:', error);
    return [];
  }
};

export const clearLocationHistory = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const getLocationsByDay = (days: number): DailyLocationGroup[] => {
  const history = getLocationHistory();
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;
  
  const filtered = history.filter(location => location.timestamp >= cutoff);
  
  // Group by day
  const groups: Record<string, LocationPoint[]> = {};
  
  filtered.forEach(point => {
    const date = new Date(point.timestamp);
    const dateKey = new Date(
      date.getFullYear(), 
      date.getMonth(), 
      date.getDate()
    ).toISOString();
    
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    
    groups[dateKey].push(point);
  });
  
  return Object.entries(groups)
    .map(([dateString, points]) => ({
      date: new Date(dateString),
      points
    }))
    .sort((a, b) => b.date.getTime() - a.date.getTime()); // Sort newest first
};

export const generateMockLocationHistory = (): void => {
  const mockLocations: LocationPoint[] = [];
  const now = Date.now();
  
  // Generate 30 days of mock data
  for (let day = 0; day < 30; day++) {
    // 3-10 points per day
    const pointsPerDay = Math.floor(Math.random() * 8) + 3;
    const dayOffset = day * 24 * 60 * 60 * 1000;
    
    for (let p = 0; p < pointsPerDay; p++) {
      const hourOffset = Math.floor(Math.random() * 12) * 60 * 60 * 1000;
      const timestamp = now - dayOffset - hourOffset;
      
      // Generate points around a center coordinate
      // These would typically be within a few miles of home location
      const centerLat = 40.7128; // Example: NYC
      const centerLng = -74.0060;
      
      // Random offset within ~5km
      const latOffset = (Math.random() - 0.5) * 0.05;
      const lngOffset = (Math.random() - 0.5) * 0.05;
      
      mockLocations.push({
        id: `mock-${timestamp}`,
        latitude: centerLat + latOffset,
        longitude: centerLng + lngOffset,
        timestamp,
        accuracy: Math.floor(Math.random() * 20) + 5
      });
    }
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(mockLocations));
};
