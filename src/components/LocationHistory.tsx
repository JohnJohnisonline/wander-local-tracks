
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { LocationPoint, DailyLocationGroup } from '@/utils/locationStorage';
import { formatDate, formatTime } from '@/utils/dateUtils';
import { MapPin, Clock, Navigation } from 'lucide-react';

interface LocationHistoryProps {
  locationGroups: DailyLocationGroup[];
  onLocationSelect: (location: LocationPoint) => void;
}

const LocationHistory: React.FC<LocationHistoryProps> = ({ locationGroups, onLocationSelect }) => {
  if (locationGroups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-muted-foreground">
        <Navigation className="mb-2" size={24} />
        <p>No location history found.</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full pr-2">
      {locationGroups.map((group) => (
        <div key={group.date.toISOString()} className="mb-6">
          <div className="flex items-center mb-2">
            <div className="bg-primary/10 p-1 rounded-full mr-2">
              <Clock size={16} className="text-primary" />
            </div>
            <h3 className="font-semibold">{formatDate(group.date)}</h3>
            <div className="text-xs text-muted-foreground ml-2">
              {group.points.length} locations
            </div>
          </div>
          
          {group.points.map((location) => (
            <Card 
              key={location.id}
              className="mb-2 hover:bg-accent/20 transition-colors cursor-pointer"
              onClick={() => onLocationSelect(location)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-start">
                    <div className="mr-3 mt-1">
                      <MapPin size={16} className="text-primary" />
                    </div>
                    <div>
                      <div className="font-medium">
                        {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        {location.accuracy ? `Accuracy: ±${location.accuracy.toFixed(0)}m` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatTime(new Date(location.timestamp))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ))}
    </ScrollArea>
  );
};

export default LocationHistory;
