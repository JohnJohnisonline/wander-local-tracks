
import React, { useState, useEffect } from 'react';
import { storeLocation, LocationPoint, generateMockLocationHistory } from '@/utils/locationStorage';
import { useToast } from '@/components/ui/use-toast';

interface LocationTrackerProps {
  isTracking: boolean;
  children: React.ReactNode;
  onPermissionChange: (granted: boolean) => void;
}

const LocationTracker: React.FC<LocationTrackerProps> = ({ 
  isTracking, 
  children, 
  onPermissionChange 
}) => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionState | null>(null);
  const [watchId, setWatchId] = useState<number | null>(null);
  const { toast } = useToast();
  
  // Check permission status on mount
  useEffect(() => {
    const checkPermission = async () => {
      if (!navigator.geolocation) {
        toast({
          title: "Geolocation not supported",
          description: "Your browser doesn't support location tracking.",
          variant: "destructive"
        });
        return;
      }

      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        setPermissionStatus(permission.state);
        onPermissionChange(permission.state === 'granted');
        
        permission.addEventListener('change', () => {
          setPermissionStatus(permission.state);
          onPermissionChange(permission.state === 'granted');
        });
      } catch (error) {
        console.error('Error checking permission:', error);
        // Fall back to checking on demand when tracking starts
      }
    };
    
    checkPermission();
    
    // For demonstration purposes only - generate mock data
    if (process.env.NODE_ENV === 'development') {
      if (!localStorage.getItem('wander-location-history')) {
        generateMockLocationHistory();
      }
    }
    
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, []);

  // Start or stop tracking when isTracking changes
  useEffect(() => {
    if (isTracking) {
      startTracking();
    } else {
      stopTracking();
    }
  }, [isTracking]);

  const startTracking = () => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation not supported",
        description: "Your browser doesn't support location tracking.",
        variant: "destructive"
      });
      return;
    }

    const id = navigator.geolocation.watchPosition(
      position => {
        const { latitude, longitude, accuracy } = position.coords;
        const timestamp = position.timestamp;
        
        const locationPoint: LocationPoint = {
          id: `loc-${Date.now()}`,
          latitude,
          longitude,
          timestamp,
          accuracy
        };
        
        storeLocation(locationPoint);
      },
      error => {
        console.error('Geolocation error:', error);
        
        toast({
          title: "Location Error",
          description: getErrorMessage(error),
          variant: "destructive"
        });
        
        if (error.code === 1) { // Permission denied
          setPermissionStatus('denied');
          onPermissionChange(false);
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30 seconds
        timeout: 27000 // 27 seconds
      }
    );
    
    setWatchId(id);
    
    toast({
      title: "Location Tracking Active",
      description: "Your movements are now being recorded.",
    });
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
      
      toast({
        title: "Location Tracking Paused",
        description: "Your movements are no longer being recorded."
      });
    }
  };

  const getErrorMessage = (error: GeolocationPositionError): string => {
    switch (error.code) {
      case 1:
        return "Location permission denied. Please enable location in your browser settings.";
      case 2:
        return "Location unavailable. Please check your device's GPS.";
      case 3:
        return "Location request timed out. Please try again.";
      default:
        return "Unknown location error.";
    }
  };

  return <>{children}</>;
};

export default LocationTracker;
