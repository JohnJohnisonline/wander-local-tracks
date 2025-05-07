
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationPoint } from '@/utils/locationStorage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle } from 'lucide-react';

interface MapProps {
  locationHistory: LocationPoint[];
  focusedLocation?: LocationPoint;
  isLoading?: boolean;
}

const Map: React.FC<MapProps> = ({ locationHistory, focusedLocation, isLoading = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  
  // Get token from localStorage if available
  const storedToken = localStorage.getItem('mapbox-token');
  const [mapboxToken, setMapboxToken] = useState<string>(storedToken || "");
  const [tokenInput, setTokenInput] = useState<string>(storedToken || "");
  
  // Initialize or update map when token changes
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;
    
    // Clean up previous map instance if it exists
    if (map.current) {
      map.current.remove();
      map.current = null;
      setMapLoaded(false);
    }
    
    setMapError(null);
    
    try {
      // Initialize map
      mapboxgl.accessToken = mapboxToken;
      
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/outdoors-v12',
        zoom: 12,
        center: [locationHistory[0]?.longitude || -74.0060, locationHistory[0]?.latitude || 40.7128],
      });

      // Add navigation controls
      map.current.addControl(
        new mapboxgl.NavigationControl(),
        'top-right'
      );

      map.current.on('load', () => {
        setMapLoaded(true);
      });
      
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setMapError('Error loading map. Please check your Mapbox token.');
        // Don't remove the map here, just show error overlay
      });
      
    } catch (error) {
      console.error('Map initialization error:', error);
      setMapError('Failed to initialize map. Please check your Mapbox token.');
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxToken]);

  // Update map when location history changes
  useEffect(() => {
    if (!map.current || !mapLoaded || locationHistory.length === 0) return;

    // Remove existing sources and layers
    if (map.current.getSource('route')) {
      map.current.removeLayer('route-line');
      map.current.removeSource('route');
    }
    
    if (map.current.getSource('points')) {
      map.current.removeLayer('point-markers');
      map.current.removeSource('points');
    }

    try {
      // Create GeoJSON data for lines (tracks)
      const routeData = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: locationHistory.map(point => [point.longitude, point.latitude])
        }
      };

      // Create GeoJSON data for points (visited locations)
      const pointData = {
        type: 'FeatureCollection',
        features: locationHistory.map(point => ({
          type: 'Feature',
          properties: {
            id: point.id,
            timestamp: point.timestamp
          },
          geometry: {
            type: 'Point',
            coordinates: [point.longitude, point.latitude]
          }
        }))
      };

      // Add route line to map
      map.current.addSource('route', {
        type: 'geojson',
        data: routeData as any
      });
      
      map.current.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#40916C',
          'line-width': 3,
          'line-opacity': 0.8
        }
      });

      // Add points to map
      map.current.addSource('points', {
        type: 'geojson',
        data: pointData as any
      });
      
      map.current.addLayer({
        id: 'point-markers',
        type: 'circle',
        source: 'points',
        paint: {
          'circle-radius': 5,
          'circle-color': '#1B4332',
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff'
        }
      });

      // Fit map to show all points
      if (locationHistory.length > 0) {
        const bounds = new mapboxgl.LngLatBounds();
        
        locationHistory.forEach(point => {
          bounds.extend([point.longitude, point.latitude]);
        });
        
        map.current.fitBounds(bounds, {
          padding: 50,
          maxZoom: 15
        });
      }
    } catch (error) {
      console.error('Error updating map with location data:', error);
      setMapError('Error displaying location data on map.');
    }
  }, [locationHistory, mapLoaded]);

  // Focus on specific location
  useEffect(() => {
    if (!map.current || !mapLoaded || !focusedLocation) return;
    
    try {
      map.current.flyTo({
        center: [focusedLocation.longitude, focusedLocation.latitude],
        zoom: 15,
        duration: 1000
      });
    } catch (error) {
      console.error('Error focusing on location:', error);
    }
  }, [focusedLocation, mapLoaded]);

  const handleSaveToken = () => {
    if (tokenInput && tokenInput.trim() !== "") {
      localStorage.setItem('mapbox-token', tokenInput.trim());
      setMapboxToken(tokenInput.trim());
    }
  };

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
      {!mapboxToken ? (
        <div className="absolute inset-0 bg-card/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-10">
          <h3 className="font-semibold mb-3 text-lg">Mapbox Access Token Required</h3>
          <p className="text-sm text-center mb-5 max-w-md">
            Enter your Mapbox public token to display the map. 
            Get a free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <div className="w-full max-w-sm space-y-2">
            <Input
              type="text"
              placeholder="pk.eyJ1Ijoi..."
              className="w-full mb-2"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value.trim())}
            />
            <Button onClick={handleSaveToken} className="w-full">
              Save Token & Show Map
            </Button>
            <p className="text-xs text-muted-foreground text-center mt-2">
              This is only stored in your browser's local storage.
            </p>
          </div>
        </div>
      ) : null}
      
      {mapError && (
        <div className="absolute inset-0 bg-destructive/10 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-20">
          <div className="bg-card p-6 rounded-lg shadow-lg max-w-md w-full">
            <div className="flex items-center space-x-2 mb-4">
              <AlertCircle className="h-5 w-5 text-destructive" />
              <h3 className="font-semibold text-destructive">Map Error</h3>
            </div>
            <p className="mb-4 text-sm">{mapError}</p>
            <p className="mb-4 text-sm">Please ensure your Mapbox token is valid and has the correct permissions.</p>
            <div className="space-y-2">
              <Input
                type="text"
                placeholder="pk.eyJ1Ijoi..."
                className="w-full"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value.trim())}
              />
              <div className="flex space-x-2">
                <Button onClick={handleSaveToken} className="flex-1">
                  Try with New Token
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    localStorage.removeItem('mapbox-token');
                    setMapboxToken("");
                    setTokenInput("");
                    setMapError(null);
                  }}
                  className="flex-1"
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
      
      <div ref={mapContainer} className="map-container h-full" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-pulse-slow text-primary">Loading map data...</div>
        </div>
      )}
      
      {locationHistory.length === 0 && mapLoaded && mapboxToken && !isLoading && !mapError && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center p-4">
            <p className="text-muted-foreground">No location history found for this period.</p>
            <p className="text-sm">Move around with your device to start tracking.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Map;
