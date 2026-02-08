import { useState, useEffect, createContext, useContext } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  city: string;
  state: string;
  country: string;
  accuracy: number | null;
  error: string | null;
  isTracking: boolean;
  lastUpdated: Date | null;
}

interface LocationContextType {
  location: LocationState;
  startTracking: () => void;
  stopTracking: () => void;
  refreshLocation: () => void;
}

const initialState: LocationState = {
  latitude: null,
  longitude: null,
  city: "",
  state: "",
  country: "",
  accuracy: null,
  error: null,
  isTracking: false,
  lastUpdated: null,
};

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [location, setLocation] = useState<LocationState>(initialState);
  const [watchId, setWatchId] = useState<number | null>(null);

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      // Using free Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`
      );
      const data = await response.json();
      
      return {
        city: data.address?.city || data.address?.town || data.address?.village || "Unknown",
        state: data.address?.state || data.address?.region || "",
        country: data.address?.country || "",
      };
    } catch (error) {
      console.error("Geocoding error:", error);
      return { city: "Unknown", state: "", country: "" };
    }
  };

  const updatePosition = async (position: GeolocationPosition) => {
    const { latitude, longitude, accuracy } = position.coords;
    const geoData = await reverseGeocode(latitude, longitude);
    
    setLocation({
      latitude,
      longitude,
      accuracy,
      city: geoData.city,
      state: geoData.state,
      country: geoData.country,
      error: null,
      isTracking: true,
      lastUpdated: new Date(),
    });
  };

  const handleError = (error: GeolocationPositionError) => {
    let errorMessage = "Location access denied";
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = "Location permission denied. Please enable location access in your browser settings.";
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = "Location information unavailable.";
        break;
      case error.TIMEOUT:
        errorMessage = "Location request timed out.";
        break;
    }
    setLocation(prev => ({ ...prev, error: errorMessage, isTracking: false }));
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: "Geolocation is not supported by your browser",
        isTracking: false,
      }));
      return;
    }

    // Get initial position
    navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });

    // Start continuous tracking
    const id = navigator.geolocation.watchPosition(updatePosition, handleError, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 5000,
    });
    
    setWatchId(id);
    setLocation(prev => ({ ...prev, isTracking: true }));
  };

  const stopTracking = () => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
      setWatchId(null);
    }
    setLocation(prev => ({ ...prev, isTracking: false }));
  };

  const refreshLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(updatePosition, handleError, {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      });
    }
  };

  useEffect(() => {
    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [watchId]);

  return (
    <LocationContext.Provider value={{ location, startTracking, stopTracking, refreshLocation }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
