// apps/mobileapp/app/camera-screen.tsx
import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { CameraCapture } from '../components/CameraCapture';

export default function CameraScreen() {
  const params = useLocalSearchParams();
  
  const mode = (params.mode as 'PHOTO' | 'VIDEO') || 'PHOTO';
  const label = params.label as string;
  const photoType = params.photoType as 'front' | 'back' | 'left' | 'right' | 'general';

  return (
    <CameraCapture 
      mode={mode} 
      label={label}
      photoType={photoType}
    />
  );
}
