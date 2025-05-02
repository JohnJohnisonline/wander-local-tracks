
import React from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDateRangeLabel } from '@/utils/dateUtils';
import { Navigation } from 'lucide-react';

interface HeaderProps {
  isTracking: boolean;
  onToggleTracking: () => void;
  selectedRange: number;
  onRangeChange: (range: number) => void;
  onClearHistory: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  isTracking, 
  onToggleTracking, 
  selectedRange, 
  onRangeChange,
  onClearHistory
}) => {
  const ranges = [1, 7, 30];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="bg-primary/10 p-2 rounded-full mr-3">
            <Navigation size={24} className="text-primary" />
          </div>
          <h1 className="text-2xl font-semibold">Wander</h1>
          <p className="text-xs bg-forest-light/20 text-forest ml-2 px-2 py-0.5 rounded">Local Tracks</p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            onClick={onToggleTracking}
            variant={isTracking ? "destructive" : "default"}
            size="sm"
          >
            {isTracking ? "Pause Tracking" : "Start Tracking"}
          </Button>
          
          <Button
            onClick={onClearHistory}
            variant="outline"
            size="sm"
          >
            Clear History
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <Tabs 
          defaultValue={selectedRange.toString()} 
          onValueChange={(value) => onRangeChange(parseInt(value))}
          className="w-[400px]"
        >
          <TabsList>
            {ranges.map(range => (
              <TabsTrigger key={range} value={range.toString()}>
                {getDateRangeLabel(range)}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
};

export default Header;
