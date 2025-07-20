import React from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import type { Household, ChurchInfo } from '../types';

interface MapViewProps {
  households: Household[];
  churchInfo: ChurchInfo;
  handleMarkerClick: (household: Household) => void;
  isMapLoaded: boolean;
}

const containerStyle = {
  width: '100%',
  height: '100%'
};

const MapView: React.FC<MapViewProps> = ({ households, churchInfo, handleMarkerClick, isMapLoaded }) => {
  if (!isMapLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={churchInfo.coordinates}
      zoom={12}
    >
      <Marker position={churchInfo.coordinates} />
      {households.map(household => (
        <Marker
          key={household.householdId}
          position={household.coordinates}
          title={household.familyName}
          onClick={() => handleMarkerClick(household)}
        />
      ))}
    </GoogleMap>
  );
};

export default MapView;