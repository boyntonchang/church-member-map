
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '400px'
};

const churchCoordinates = {
  lat: 40.983990,
  lng: -74.041600
};

const MapView = () => {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: ["places"],
  });

  return isLoaded ? (
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={churchCoordinates}
        zoom={15}
      >
        <Marker position={churchCoordinates} />
      </GoogleMap>
  ) : <div>Loading Map...</div>;
};

export default MapView;
