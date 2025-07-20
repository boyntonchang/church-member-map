import { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import type { Household, ChurchData, Coordinates } from './types';
import HouseholdPopover from './components/HouseholdPopover';
import AddFamilyModal from './components/AddFamilyModal';
import LoginModal from './components/LoginModal';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChurch } from '@fortawesome/free-solid-svg-icons';
import MapView from './components/map-view';

library.add(faChurch);

const mapOptions = {
  disableDefaultUI: true,
  zoomControl: true,
  styles: [],
};

function App() {
  const [churchData, setChurchData] = useState<ChurchData | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);

  useEffect(() => {
    fetch('/members-location.json')
      .then((res) => res.json())
      .then((data: ChurchData) => {
        setChurchData(data);
        setHouseholds(data.households);
        setIsLoadingData(false);
      })
      .catch(err => {
        console.error("Failed to fetch member data:", err);
        setIsLoadingData(false);
      });
  }, []);

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ["places"],
  });

  const handleMarkerClick = (household: Household) => {
    setSelectedHousehold(household);
    setIsHouseholdModalOpen(true);
  };

  const handleCloseHouseholdModal = () => {
    setIsHouseholdModalOpen(false);
  };

  const handleAddFamilyModalOpen = () => {
    setIsAddFamilyModalOpen(true);
  };

  const handleAddFamilyModalClose = () => {
    setIsAddFamilyModalOpen(false);
  };

  const handleSaveNewHousehold = (newHousehold: Omit<Household, 'householdId' | 'coordinates'>) => {
    if (!isMapLoaded) {
      console.error("Google Maps API not loaded.");
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: newHousehold.address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const { lat, lng } = results[0].geometry.location;
        const newHouseholdWithCoords: Household = {
          ...newHousehold,
          householdId: `hh_${Date.now()}`, // Simple unique ID
          coordinates: { lat: lat(), lng: lng() },
        };
        setHouseholds(prevHouseholds => [...prevHouseholds, newHouseholdWithCoords]);
        handleAddFamilyModalClose();
      } else {
        console.error('Geocode was not successful for the following reason:', status);
        alert('Could not find coordinates for the address. Please try again.');
      }
    });
  };

  const handleLogin = (username: string) => {
    // Simple admin check for now. In a real app, this would involve API calls.
    if (username === 'admin') {
      setIsAdminLoggedIn(true);
      setIsLoginModalOpen(false);
    } else {
      alert('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setIsLoginModalOpen(true); // Show login modal on logout
  };

  // Generate SVG for Font Awesome church icon
  const [churchWidth, churchHeight, , , churchSvgPathData] = faChurch.icon;
  const churchIconSvg = `<svg viewBox="0 0 ${churchWidth} ${churchHeight}" xmlns="http://www.w3.org/2000/svg"><path d="${Array.isArray(churchSvgPathData) ? churchSvgPathData.join(' ') : churchSvgPathData}" fill="currentColor"></path></svg>`;
  const encodedChurchIconSvg = encodeURIComponent(churchIconSvg);
  const churchIconDataUrl = `data:image/svg+xml;charset=UTF-8,${encodedChurchIconSvg}`;

  if (isLoadingData || !isMapLoaded) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (mapLoadError || !churchData) {
    return <Box p={5}><Typography>Error loading maps or member data.</Typography></Box>;
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', width: '100vw', padding: '1rem', paddingTop:'0',}}>
      <Typography variant="h4" component="h1" align="center" sx={{ my: 2 }}>
       Church Member Location
      </Typography>
      <Box sx={{ flexGrow: 1, position: 'relative', border: 'solid lightgray 0.2rem', borderRadius: '0.8rem', overflow: 'hidden', }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={churchData.churchInfo.coordinates}
          zoom={12}
          options={mapOptions}
        >
          {households.map((household) => (
            <MarkerF
              key={household.householdId}
              position={household.coordinates}
              title={household.familyName}
              onClick={() => handleMarkerClick(household)}
            />
          ))}
           <MarkerF
              position={churchData.churchInfo.coordinates}
              title={churchData.churchInfo.name}
              icon={{ url: churchIconDataUrl, scaledSize: new window.google.maps.Size(40, 40) }}
            />
        </GoogleMap>
        
        <Paper elevation={4} sx={{ position: 'absolute', top: 16, left: 16, p: 2, display: 'none' }}>
          <Typography variant="h5">{churchData.churchInfo.name}</Typography>
          <Typography variant="subtitle1">Member Location</Typography>
        </Paper>

        </Box>

      {isAdminLoggedIn && (
        <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
          <Button variant="contained" onClick={handleAddFamilyModalOpen}>
            Add New Family
          </Button>
          <Button variant="outlined" onClick={handleLogout}>
            Logout
          </Button>
        </Box>
      )}
      {!isAdminLoggedIn && (
        <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
          <Button variant="contained" onClick={() => setIsLoginModalOpen(true)}>
            Login
          </Button>
        </Box>
      )}

      <HouseholdPopover
        household={selectedHousehold}
        open={isHouseholdModalOpen}
        onClose={handleCloseHouseholdModal}
      />

      <AddFamilyModal
        open={isAddFamilyModalOpen}
        onClose={handleAddFamilyModalClose}
        onSave={handleSaveNewHousehold}
      />

      <LoginModal
        open={isLoginModalOpen}
        onLogin={handleLogin}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </Box>
  );
}

export default App;