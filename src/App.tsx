import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';
import { Box, Typography, Popover, CircularProgress, Button, IconButton, useMediaQuery, useTheme } from '@mui/material';
import { Add as AddIcon, Logout as LogoutIcon, FilterList as FilterListIcon, Login as LoginIcon } from '@mui/icons-material';
import type { Household, ChurchData } from './types';
import HouseholdPopover from './components/HouseholdPopover';
import AddFamilyModal from './components/AddFamilyModal';
import LoginModal from './components/LoginModal';
import CareGroupFilter from './components/CareGroupFilter'; // New import
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
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
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
  const [isChurchInfoOpen, setIsChurchInfoOpen] = useState(false);
  const [churchAnchorEl, setChurchAnchorEl] = useState<HTMLElement | null>(null); // New state for Popover anchor
  const [showCareGroupFilter, setShowCareGroupFilter] = useState(false); // New state for care group filter
  const [selectedCareGroup, setSelectedCareGroup] = useState<string | null>(null); // New state for selected care group
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

      recenterButton.style.backgroundImage = 'url("/images/gps-RE.png")';
      recenterButton.style.backgroundRepeat = 'no-repeat';
      recenterButton.style.backgroundPosition = 'center';
      recenterButton.style.backgroundSize = '70%';

      recenterButton.onclick = () => {
        console.log('Recenter button clicked: mapRef.current', mapRef.current);
        console.log('Recenter button clicked: households.length', households.length);
        if (mapRef.current && households.length > 0) {
          const bounds = new window.google.maps.LatLngBounds();
          households.forEach(household => {
            bounds.extend(household.coordinates);
          });
          mapRef.current.fitBounds(bounds);
        } else if (mapRef.current && churchData) {
          // Fallback to church location if no households
          mapRef.current.setZoom(12);
          mapRef.current.panTo(churchData.churchInfo.coordinates);
        }
      };
      map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(
        recenterButton,
      );
    },
    [churchData, households], // Add households to dependencies
  );

  // Function to check admin status
  const checkAdminStatus = useCallback(async (userId: string) => {
    console.log('Frontend: Checking admin status for userId:', userId);
    try {
      const response = await fetch(`/.netlify/functions/admin-check/${userId}`);
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
      const response = await fetch('/.netlify/functions/get-households');
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

      console.log('fetchHouseholds: mapRef.current', mapRef.current);
      console.log('fetchHouseholds: transformedHouseholds.length', transformedHouseholds.length);

      // Fit map to bounds of all households
      if (mapRef.current && transformedHouseholds.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        transformedHouseholds.forEach((household: Household) => {
          bounds.extend(household.coordinates);
        });
        mapRef.current.fitBounds(bounds);
      }
    } catch (err) {
      console.error('Failed to fetch household data from backend:', err);
      setIsLoadingData(false);
    }
  }, [mapRef]); // Add mapRef as a dependency

  useEffect(() => {
    const initializeSession = async () => {
      try {
        const response = await fetch('/.netlify/functions/get-session');
        const { session } = await response.json();

        if (session) {
          await supabase.auth.setSession(session);
          const admin = await checkAdminStatus(session.user.id);
          setIsAdminLoggedIn(admin);
        } else {
          setIsAdminLoggedIn(false);
        }
      } catch (error) {
        console.error('Error initializing session from Netlify Function:', error);
        setIsAdminLoggedIn(false);
      }
    };

    initializeSession();
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
    setShowCareGroupFilter(false); // Close care group filter
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
              const url = `/.netlify/functions/update-household/${householdToEdit.householdId}`;
              console.log('Frontend: Sending PUT request to:', url);
              console.log('Frontend: Household data being sent (object):', householdWithCoords);
              console.log('Frontend: Household data being sent (JSON):', JSON.stringify(householdWithCoords));
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
              const url = '/.netlify/functions/add-household';
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
      setShowCareGroupFilter(false); // Close care group filter
    } catch (error: any) {
      console.error('Logout failed:', error.message);
      alert('Logout failed. Please try again.');
    }
  };

  const handleDeleteHousehold = useCallback(async (householdId: string) => {
    try {
      const session = await supabase.auth.getSession();
      const accessToken = session.data.session?.access_token;

      if (!accessToken) {
        alert('You must be logged in to delete households.');
        return;
      }

      const response = await fetch(`/.netlify/functions/delete-household/${householdId}`, {
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
          py: 1.6,
          px: 2,
          backgroundColor: 'rgb(39 39 36)',
          color: 'rgb(228, 153, 50)',
        }}
      >
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
          <Box
            component="img"
            src="/images/on_degree_icon.avif"
            alt="Church Icon"
            sx={{ height: 40, mr: 2 }}
          />
        </Box>
        <Typography
          variant="h4"
          component="h1"
          align="center"
          sx={{
            fontSize: { xs: '1.2rem', sm: '1.5rem', md: '2.125rem' },
            flexShrink: 0,
          }}
        >
          Church Member Location
        </Typography>
        <Box sx={{ flex: 1, display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1 }}>
          {isSmallScreen ? (
            <IconButton color="primary" onClick={() => setShowCareGroupFilter(!showCareGroupFilter)}>
              <FilterListIcon />
            </IconButton>
          ) : (
            <Button variant="contained" onClick={() => setShowCareGroupFilter(!showCareGroupFilter)}>
              Care Groups
            </Button>
          )}
          {isAdminLoggedIn ? (
            <>
              {isSmallScreen ? (
                <IconButton color="primary" onClick={handleAddFamilyModalOpen}>
                  <AddIcon />
                </IconButton>
              ) : (
                <Button variant="contained" onClick={handleAddFamilyModalOpen}>
                  Add New Family
                </Button>
              )}
              {isSmallScreen ? (
                <IconButton color="primary" onClick={handleLogout}>
                  <LogoutIcon />
                </IconButton>
              ) : (
                <Button variant="outlined" onClick={handleLogout}>
                  Logout
                </Button>
              )}
            </>
          ) : (
            <Box>
              {isSmallScreen ? (
                <IconButton color="primary" onClick={() => setIsLoginModalOpen(true)}>
                  <LoginIcon />
                </IconButton>
              ) : (
                <Button
                  variant="contained"
                  onClick={() => setIsLoginModalOpen(true)}
                >
                  Login
                </Button>
              )}
            </Box>
          )}
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'hidden' }}>
        <GoogleMap
          mapContainerStyle={{ width: '100%', height: '100%' }}
          center={churchData.churchInfo.coordinates}
          zoom={12}
          options={mapOptions}
          onLoad={onLoad}
        >
          {households
            .filter(household =>
              selectedCareGroup
                ? household.careGroupName.trim().toLowerCase() === selectedCareGroup
                : true,
            )
            .map((household: Household) => (
              <MarkerF
                key={household.householdId}
                position={household.coordinates}
                title={household.familyName}
                onClick={() => handleMarkerClick(household)}
              />
            ))}
          <MarkerF
            position={churchData.churchInfo.coordinates}
            title="ONDO church!"
            icon={{
              url: churchIconDataUrl,
              scaledSize: new window.google.maps.Size(40, 40),
            }}
            onClick={(e) => {
              setIsChurchInfoOpen(!isChurchInfoOpen);
              setChurchAnchorEl(e.domEvent.currentTarget as HTMLElement);
              console.log('isChurchInfoOpen toggled to:', !isChurchInfoOpen);
            }}
          />

        </GoogleMap>

        {showCareGroupFilter && (
          <CareGroupFilter
            households={households}
            onSelectCareGroup={setSelectedCareGroup}
            selectedCareGroup={selectedCareGroup}
            onClose={() => setShowCareGroupFilter(false)}
          />
        )}

        {isChurchInfoOpen && churchAnchorEl && (
          <Popover
            open={isChurchInfoOpen}
            anchorEl={churchAnchorEl}
            onClose={() => setIsChurchInfoOpen(false)}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'center',
            }}
            transformOrigin={{
              vertical: 'bottom',
              horizontal: 'center',
            }}
          >
            <Typography sx={{ p: 1 }}>ONDO church!</Typography>
          </Popover>
        )}
      </Box>

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
