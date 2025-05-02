
import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationPoint } from '@/utils/locationStorage';

interface MapProps {
  locationHistory: LocationPoint[];
  focusedLocation?: LocationPoint;
  isLoading?: boolean;
}

const Map: React.FC<MapProps> = ({ locationHistory, focusedLocation, isLoading = false }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // This would be from an environment variable in production
  // For demo purposes, user will need to input their Mapbox token
  const [mapboxToken, setMapboxToken] = useState<string>("");
  
  useEffect(() => {
    if (!mapContainer.current || !mapboxToken) return;

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

    return () => {
      map.current?.remove();
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
  }, [locationHistory, mapLoaded]);

  // Focus on specific location
  useEffect(() => {
    if (!map.current || !mapLoaded || !focusedLocation) return;
    
    map.current.flyTo({
      center: [focusedLocation.longitude, focusedLocation.latitude],
      zoom: 15,
      duration: 1000
    });
  }, [focusedLocation, mapLoaded]);

  return (
    <div className="relative w-full h-full rounded-lg overflow-hidden shadow-md">
      {!mapboxToken ? (
        <div className="absolute inset-0 bg-card/50 backdrop-blur-sm flex flex-col items-center justify-center p-4 z-10">
          <h3 className="font-semibold mb-2">Mapbox API Key Required</h3>
          <p className="text-sm text-center mb-4">
            Enter your Mapbox public token to display the map. 
            Get one for free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
          </p>
          <input
            type="text"
            placeholder="pk.eyJ1IjoieW91ci11c2VybmFtZSI..."
            className="w-full max-w-sm p-2 border rounded mb-2"
            onChange={(e) => setMapboxToken(e.target.value.trim())}
          />
          <p className="text-xs text-muted-foreground">This is only stored in your browser for this session.</p>
        </div>
      ) : null}
      
      <div ref={mapContainer} className="map-container" />
      
      {isLoading && (
        <div className="absolute inset-0 bg-background/50 backdrop-blur-sm flex items-center justify-center">
          <div className="animate-pulse-slow text-primary">Loading map data...</div>
        </div>
      )}
      
      {locationHistory.length === 0 && mapLoaded && mapboxToken && !isLoading && (
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
