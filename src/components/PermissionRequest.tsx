
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation } from 'lucide-react';

interface PermissionRequestProps {
  onRequestPermission: () => void;
}

const PermissionRequest: React.FC<PermissionRequestProps> = ({ onRequestPermission }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] p-6 animate-fade-in">
      <Card className="max-w-md w-full bg-card/80 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-3 rounded-full mb-4">
            <Navigation size={32} className="text-primary" />
          </div>
          <CardTitle className="text-center text-2xl">Location Permission Required</CardTitle>
          <CardDescription className="text-center">
            To track your journeys, we need permission to access your location.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Wander needs your location to show where you've been. Your data stays on your device and is never shared.
            You can delete your location history at any time.
          </p>
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button onClick={onRequestPermission} className="w-full">
            Enable Location Tracking
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PermissionRequest;
