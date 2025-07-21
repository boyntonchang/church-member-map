import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import type { Household, ChurchData } from './types';
import HouseholdPopover from './components/HouseholdPopover';
import AddFamilyModal from './components/AddFamilyModal';
import LoginModal from './components/LoginModal';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChurch } from '@fortawesome/free-solid-svg-icons';

library.add(faChurch);

const mapOptions = {
  zoomControl: true,
  styles: [],
  streetViewControl: false,
  fullscreenControl: true,
};

function App() {
  const [churchData, setChurchData] = useState<ChurchData | null>(null);
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null,
  );
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);
  const [householdToEdit, setHouseholdToEdit] = useState<Household | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    localStorage.getItem('isAdminLoggedIn') === 'true',
  );
  const mapRef = useRef<google.maps.Map | null>(null);

  const onLoad = useCallback(
    (map: google.maps.Map) => {
      mapRef.current = map;

      // Check if the control already exists to prevent duplicates on re-renders
      const controls = map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].getArray();
      const existingRecenterButton = controls.find(control => control.id === 'recenter-button');

      if (existingRecenterButton) {
        return;
      }

      const recenterButton = document.createElement('div');
      recenterButton.id = 'recenter-button'; // Assign an ID for easier identification

      recenterButton.style.backgroundColor = '#fff';
      recenterButton.style.border = '2px solid transparent';
      recenterButton.style.borderRadius = '2px';
      recenterButton.style.boxShadow = 'rgba(0, 0, 0, 0.3) 0px 1px 4px -1px';
      recenterButton.style.cursor = 'pointer';
      recenterButton.style.margin = '10px';
      recenterButton.style.width = '40px';
      recenterButton.style.height = '40px';
      recenterButton.style.display = 'flex';
      recenterButton.style.justifyContent = 'center';
      recenterButton.style.alignItems = 'center';

      recenterButton.style.backgroundImage = 'url("/images/gps.png")';
      recenterButton.style.backgroundRepeat = 'no-repeat';
      recenterButton.style.backgroundPosition = 'center';
      recenterButton.style.backgroundSize = 'contain';

      recenterButton.onclick = () => {
        if (mapRef.current && churchData) {
          mapRef.current.panTo(churchData.churchInfo.coordinates);
        }
      };
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        recenterButton,
      );
    },
    [churchData],
  );

  useEffect(() => {
    const fetchHouseholds = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/households');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setHouseholds(data);
        setIsLoadingData(false);
      } catch (err) {
        console.error('Failed to fetch household data from backend:', err);
        setIsLoadingData(false);
      }
    };

    fetch('/members-location.json')
      .then(res => res.json())
      .then((data: ChurchData) => {
        setChurchData(data);
      })
      .catch(err => {
        console.error('Failed to fetch church info from local JSON:', err);
      });

    fetchHouseholds();
  }, []);

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries: ['places'],
  });

  const handleMarkerClick = (household: Household) => {
    setSelectedHousehold(household);
    setIsHouseholdModalOpen(true);
  };

  const handleCloseHouseholdModal = () => {
    setIsHouseholdModalOpen(false);
  };

  const handleAddFamilyModalOpen = () => {
    setHouseholdToEdit(null);
    setIsAddFamilyModalOpen(true);
  };

  const handleAddFamilyModalClose = () => {
    setIsAddFamilyModalOpen(false);
    setHouseholdToEdit(null);
  };

  const handleEditHousehold = (household: Household) => {
    setSelectedHousehold(null);
    setIsHouseholdModalOpen(false);
    setHouseholdToEdit(household);
    setIsAddFamilyModalOpen(true);
  };

  const handleSaveHousehold = async (
    householdData: Omit<Household, 'householdId' | 'coordinates'>,
  ) => {
    if (!isMapLoaded) {
      console.error('Google Maps API not loaded.');
      return;
    }

    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode(
      { address: householdData.address },
      async (results, status) => {
        if (status === 'OK' && results && results[0]) {
          const { lat, lng } = results[0].geometry.location;
          const householdWithCoords: Household = {
            ...householdData,
            householdId: householdToEdit
              ? householdToEdit.householdId
              : `hh_${Date.now()}`,
            coordinates: { lat: lat(), lng: lng() },
          };

          try {
            let response;
            if (householdToEdit) {
              response = await fetch(
                `http://localhost:3001/api/households/${householdToEdit.householdId}`,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify(householdWithCoords),
                },
              );
            } else {
              response = await fetch('http://localhost:3001/api/households', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(householdWithCoords),
              });
            }

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            const savedHousehold = await response.json();

            if (householdToEdit) {
              setHouseholds(prevHouseholds =>
                prevHouseholds.map(hh =>
                  hh.householdId === savedHousehold.householdId
                    ? savedHousehold
                    : hh,
                ),
              );
            } else {
              setHouseholds(prevHouseholds => [
                ...prevHouseholds,
                savedHousehold,
              ]);
            }
            handleAddFamilyModalClose();
          } catch (error) {
            console.error('Error saving household:', error);
            alert('Failed to save household. Please try again.');
          }
        } else {
          console.error(
            'Geocode was not successful for the following reason:',
            status,
          );
          alert('Could not find coordinates for the address. Please try again.');
        }
      },
    );
  };

  const handleLogin = (username: string) => {
    if (username === 'admin') {
      setIsAdminLoggedIn(true);
      setIsLoginModalOpen(false);
      localStorage.setItem('isAdminLoggedIn', 'true');
    } else {
      alert('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setIsAdminLoggedIn(false);
    setIsLoginModalOpen(true);
    localStorage.removeItem('isAdminLoggedIn');
  };

  const [churchWidth, churchHeight, , , churchSvgPathData] = faChurch.icon;
  const churchIconSvg = `<svg viewBox="0 0 ${churchWidth} ${churchHeight}" xmlns="http://www.w3.org/2000/svg"><path d="${
    Array.isArray(churchSvgPathData) ? churchSvgPathData.join(' ') : churchSvgPathData
  }" fill="currentColor"></path></svg>`;
  const encodedChurchIconSvg = encodeURIComponent(churchIconSvg);
  const churchIconDataUrl = `data:image/svg+xml;charset=UTF-8,${encodedChurchIconSvg}`;

  if (isLoadingData || !isMapLoaded) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (mapLoadError || !churchData) {
    return (
      <Box p={5}>
        <Typography>Error loading maps or member data.</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        width: '100vw',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1.6,
          backgroundColor: 'rgb(39 39 36)',
          color: 'rgb(228, 153, 50)',
          position: 'relative',
        }}
      >
        <Box
          component="img"
          src="/images/on_degree_icon.avif"
          alt="Church Icon"
          sx={{ height: 40, position: 'absolute', left: 16 }}
        />
        <Typography variant="h4" component="h1" align="center">
          Church Member Location
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={churchData.churchInfo.coordinates}
          zoom={12}
          options={mapOptions}
          onLoad={onLoad}
        >
          {households.map(household => (
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
            icon={{
              url: churchIconDataUrl,
              scaledSize: new window.google.maps.Size(40, 40),
            }}
          />
        </GoogleMap>

        <Paper
          elevation={4}
          sx={{
            position: 'absolute',
            top: 16,
            left: 16,
            p: 2,
            display: 'none',
          }}
        >
          <Typography variant="h5">{churchData.churchInfo.name}</Typography>
          <Typography variant="subtitle1">Member Location</Typography>
        </Paper>
      </Box>

      {isAdminLoggedIn && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            right: 16,
            display: 'flex',
            gap: 1,
          }}
        >
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
          <Button
            variant="contained"
            onClick={() => setIsLoginModalOpen(true)}
          >
            Login
          </Button>
        </Box>
      )}

      <HouseholdPopover
        household={selectedHousehold}
        open={isHouseholdModalOpen}
        onClose={handleCloseHouseholdModal}
        isAdminLoggedIn={isAdminLoggedIn}
        onEditHousehold={handleEditHousehold}
      />

      <AddFamilyModal
        open={isAddFamilyModalOpen}
        onClose={handleAddFamilyModalClose}
        onSave={handleSaveHousehold}
        initialData={householdToEdit}
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
