import { useState, useEffect } from 'react';
import { Dimensions, Platform } from 'react-native';

export const useNavigationHeight = () => {
  const [appHeight, setAppHeight] = useState(Dimensions.get('window').height);

  useEffect(() => {
    const detectNavigationBar = () => {
      if (Platform.OS === 'android') {
        const screenData = Dimensions.get('screen');
        const windowData = Dimensions.get('window');
        
        // If screen height is significantly larger than window height, navigation buttons are present
        const hasNavButtons = (screenData.height - windowData.height) > 50;
        
        if (hasNavButtons) {
          // Use window height when navigation buttons are present
          setAppHeight(windowData.height);
        } else {
          // Use full screen height when no navigation buttons
          setAppHeight(screenData.height);
        }
      } else if (Platform.OS === 'ios') {
        const screenHeight = Dimensions.get('window').height;
        // For iOS, always use window height as it handles safe areas automatically
        setAppHeight(screenHeight);
      } else {
        // Fallback for other platforms
        setAppHeight(Dimensions.get('window').height);
      }
    };

    detectNavigationBar();
    
    // Listen for orientation changes
    const subscription = Dimensions.addEventListener('change', ({ window, screen }) => {
      if (Platform.OS === 'android') {
        const hasNavButtons = (screen.height - window.height) > 50;
        setAppHeight(hasNavButtons ? window.height : screen.height);
      } else {
        setAppHeight(window.height);
      }
    });
    
    return () => subscription?.remove();
  }, []);

  return appHeight;
};