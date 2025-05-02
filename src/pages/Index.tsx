
import React, { useState, useEffect } from 'react';
import Header from '@/components/Header';
import Map from '@/components/Map';
import LocationHistory from '@/components/LocationHistory';
import LocationTracker from '@/components/LocationTracker';
import PermissionRequest from '@/components/PermissionRequest';
import { getLocationsByDay, LocationPoint, clearLocationHistory } from '@/utils/locationStorage';
import { useToast } from '@/components/ui/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const Index = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(null);
  const [selectedRange, setSelectedRange] = useState(7); // Default to week view
  const [locationGroups, setLocationGroups] = useState([]);
  const [focusedLocation, setFocusedLocation] = useState<LocationPoint | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<string>("map");
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Load location history when range changes
  useEffect(() => {
    const loadLocations = () => {
      setIsLoading(true);
      setTimeout(() => {
        const groups = getLocationsByDay(selectedRange);
        setLocationGroups(groups);
        setIsLoading(false);
      }, 300); // Small delay for UI feedback
    };
    
    loadLocations();
    
    // Set up interval to refresh data periodically when tracking
    const intervalId = isTracking ? setInterval(loadLocations, 30000) : null;
    
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [selectedRange, isTracking]);

  const handleToggleTracking = () => {
    if (!permissionGranted && !isTracking) {
      // Request permission again if needed
      toast({
        title: "Permission Required",
        description: "Please enable location permissions to start tracking."
      });
      return;
    }
    
    setIsTracking(prev => !prev);
  };

  const handlePermissionRequest = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setPermissionGranted(true);
          setIsTracking(true);
        },
        (error) => {
          console.error('Permission denied or error:', error);
          setPermissionGranted(false);
          toast({
            title: "Permission Denied",
            description: "Location access was denied. Please update your browser settings to use this feature.",
            variant: "destructive"
          });
        }
      );
    } else {
      toast({
        title: "Not Supported",
        description: "Geolocation is not supported by your browser.",
        variant: "destructive"
      });
    }
  };

  const handleClearHistory = () => {
    if (confirm("Are you sure you want to clear all location history? This cannot be undone.")) {
      clearLocationHistory();
      setLocationGroups([]);
      toast({
        title: "History Cleared",
        description: "All location history has been deleted."
      });
    }
  };

  const handleRangeChange = (days: number) => {
    setSelectedRange(days);
  };

  const handleLocationSelect = (location: LocationPoint) => {
    setFocusedLocation(location);
    setActiveTab("map");
  };

  // Flatten location groups into a single array for the map
  const allLocations = locationGroups.flatMap(group => group.points);

  return (
    <LocationTracker 
      isTracking={isTracking} 
      onPermissionChange={setPermissionGranted}
    >
      <div className="min-h-screen p-6 flex flex-col">
        <Header 
          isTracking={isTracking}
          onToggleTracking={handleToggleTracking}
          selectedRange={selectedRange}
          onRangeChange={handleRangeChange}
          onClearHistory={handleClearHistory}
        />
        
        <div className="mt-6 flex-1 flex flex-col space-y-4">
          {permissionGranted === false ? (
            <PermissionRequest onRequestPermission={handlePermissionRequest} />
          ) : (
            <div className="flex-1 flex flex-col">
              {/* Mobile view: Tabs for Map and History */}
              <div className="md:hidden mb-4">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="map" className="flex-1">Map</TabsTrigger>
                    <TabsTrigger value="history" className="flex-1">History</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              
              <div className="flex-1 flex flex-col md:flex-row md:space-x-6">
                {/* Map Section */}
                <div 
                  className={`
                    flex-1 ${activeTab === "map" ? 'block' : 'hidden'} md:block
                    h-[50vh] md:h-auto
                  `}
                >
                  <Map 
                    locationHistory={allLocations} 
                    focusedLocation={focusedLocation}
                    isLoading={isLoading}
                  />
                </div>
                
                {/* History Section */}
                <div 
                  className={`
                    w-full md:w-[350px] ${activeTab === "history" ? 'block' : 'hidden'} md:block
                    h-[50vh] md:h-auto
                  `}
                >
                  <div className="h-full bg-card/50 backdrop-blur-sm rounded-lg shadow-md p-4">
                    <h2 className="font-semibold mb-3">Location History</h2>
                    <LocationHistory 
                      locationGroups={locationGroups} 
                      onLocationSelect={handleLocationSelect} 
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </LocationTracker>
  );
};

export default Index;
