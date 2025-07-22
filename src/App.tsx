import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Box, Typography, Paper, CircularProgress, Button } from '@mui/material';
import type { Household, ChurchData } from './types';
import HouseholdPopover from './components/HouseholdPopover';
import AddFamilyModal from './components/AddFamilyModal';
import LoginModal from './components/LoginModal';
import { library } from '@fortawesome/fontawesome-svg-core';
import { faChurch } from '@fortawesome/free-solid-svg-icons';
import { supabase } from './supabaseClient'; // Import Supabase client

library.add(faChurch);

const mapOptions = {
  zoomControl: true,
  styles: [],
  streetViewControl: false,
  fullscreenControl: true,
};

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

function App() {
  const [churchData] = useState<ChurchData | null>({
    churchInfo: {
      name: "Bethany Church",
      address: "605 Pascack Rd, Township of Washington, NJ 07676",
      coordinates: {
        lat: 40.9925866629098,
        lng: -74.06081908529305,
      },
    },
    households: [], // Households will be fetched from backend
  });
  const [households, setHouseholds] = useState<Household[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(
    null,
  );
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false);
  const [isAddFamilyModalOpen, setIsAddFamilyModalOpen] = useState(false);
  const [householdToEdit, setHouseholdToEdit] = useState<Household | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false); // Default to false
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
          mapRef.current.setZoom(12); // Set zoom level to 12
        }
      };
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        recenterButton,
      );
    },
    [churchData],
  );

  // Function to check admin status
  const checkAdminStatus = useCallback(async (userId: string) => {
    console.log('Frontend: Checking admin status for userId:', userId);
    try {
      const response = await fetch(`http://localhost:3001/api/admin-check/${userId}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Frontend: Admin check response:', data);
      return data.isAdmin;
    } catch (error) {
      console.error('Frontend: Failed to check admin status:', error);
      return false;
    }
  }, []);

  const fetchHouseholds = useCallback(async () => {
    try {
      const response = await fetch('http://localhost:3001/api/households');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      const transformedHouseholds = data.map((household: any) => ({
        ...household,
        coordinates: { lat: household.lat, lng: household.lng },
      }));
      setHouseholds(transformedHouseholds);
      setIsLoadingData(false);
    } catch (err) {
      console.error('Failed to fetch household data from backend:', err);
      setIsLoadingData(false);
    }
  }, []); // Add dependencies if any, currently none for this simple fetch

  useEffect(() => {
    fetchHouseholds();

    // Supabase Auth State Listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_, session) => {
        if (session) {
          const user = session.user;
          const admin = await checkAdminStatus(user.id);
          setIsAdminLoggedIn(admin);
        } else {
          setIsAdminLoggedIn(false);
        }
      },
    );

    // Cleanup listener on component unmount
    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [checkAdminStatus]); // Depend on checkAdminStatus

  const { isLoaded: isMapLoaded, loadError: mapLoadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY!,
    libraries,
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

  const handleSaveHousehold = useCallback(async (
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
              const url = `http://localhost:3001/api/households/${householdToEdit.householdId}`;
              console.log('Frontend: Sending PUT request to:', url);
              console.log('Frontend: Household data being sent:', householdWithCoords);
              response = await fetch(
                url,
                {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    // Include Authorization header for authenticated requests
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                  },
                  body: JSON.stringify(householdWithCoords),
                },
              );
            } else {
              const url = 'http://localhost:3001/api/households';
              console.log('Frontend: Sending POST request to:', url);
              console.log('Frontend: Household data being sent:', householdWithCoords);
              response = await fetch(url, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  // Include Authorization header for authenticated requests
                  'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                },
                body: JSON.stringify(householdWithCoords),
              });
            }

            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }

            await response.json();

            // Re-fetch all households to update the map
            fetchHouseholds();

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
  }, [isMapLoaded, householdToEdit, supabase, setHouseholds, handleAddFamilyModalClose, churchData, fetchHouseholds]);

  const handleLogin = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      console.log('User logged in:', data.user);
      setIsLoginModalOpen(false);
      // isAdminLoggedIn will be updated by the auth state listener
    } catch (error: any) {
      alert(`Login failed: ${error.message}`);
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      console.log('User logged out');
      setIsAdminLoggedIn(false); // Explicitly set to false on logout
      setIsLoginModalOpen(true); // Show login modal on logout
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      alert('Logout failed. Please try again.');
    }
  };

  const handleDeleteHousehold = useCallback(async (householdId: string) => {
    if (!window.confirm('Are you sure you want to delete this household?')) {
      return;
    }
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        alert('You must be logged in to delete households.');
        return;
      }

      const response = await fetch(`http://localhost:3001/api/households/${householdId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log(`Household ${householdId} deleted successfully.`);
      fetchHouseholds(); // Re-fetch households to update the map
      handleCloseHouseholdModal(); // Close the popover
    } catch (error) {
      console.error('Error deleting household:', error);
      alert('Failed to delete household. Please try again.');
    }
  }, [fetchHouseholds, handleCloseHouseholdModal, supabase]);

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
        onDeleteHousehold={handleDeleteHousehold} // Pass the new handler
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
