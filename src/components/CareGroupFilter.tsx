import React from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
interface Coordinates {
  lat: number;
  lng: number;
}

interface Member {
  memberId: string;
  firstName: string;
  role: string;
  photoUrl: string;
}

interface Household {
  householdId: string;
  familyName: string;
  address: string;
  coordinates: Coordinates;
  familyPhotoUrl: string;
  householdBio: string;
  ministryInvolvement: string[];
  members: Member[];
  careGroupName: string;
}

interface CareGroupFilterProps {
  households: Household[];
  onSelectCareGroup: (careGroupName: string | null) => void;
  selectedCareGroup: string | null;
  onClose: () => void;
}

const CareGroupFilter: React.FC<CareGroupFilterProps> = ({
  households,
  onSelectCareGroup,
  selectedCareGroup,
  onClose,
}) => {
  const careGroups = Array.from(new Set(households.map(h => {
    const normalizedName = h.careGroupName.trim().toLowerCase();
    // console.log('Normalized Care Group Name:', normalizedName);
    return normalizedName;
  }))).sort();

  console.log('Final Care Groups Array:', careGroups);

  return (
    <Paper
      elevation={4}
      sx={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        left: 'auto',
        transform: 'none',
        p: 2,
        zIndex: 1000,
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        maxHeight: '80vh',
        overflowY: 'auto',
        minWidth: '200px',
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ fontSize: '1.15rem' }}>Filter by Care Group</Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Button
          variant={selectedCareGroup === null ? 'contained' : 'outlined'}
          onClick={() => onSelectCareGroup(null)}
          fullWidth
        >
          Show All
        </Button>
        {careGroups.map(groupName => (
          <Button
            key={groupName}
            variant={selectedCareGroup === groupName ? 'contained' : 'outlined'}
            onClick={() => onSelectCareGroup(groupName)}
            fullWidth
          >
            {groupName}
          </Button>
        ))}
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          onClick={onClose}
          variant="text"
        >
          Close
        </Button>
      </Box>
    </Paper>
  );
};

export default CareGroupFilter;
