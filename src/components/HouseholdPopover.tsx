import React, { useState } from 'react';
import {
  Dialog,
  Card,
  CardMedia,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Divider,
  Stack,
  Chip,
  Box,
  Button,
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import type { Household } from '../types';

interface Props {
  household: Household | null;
  open: boolean;
  onClose: () => void;
  isAdminLoggedIn: boolean;
  onEditHousehold: (household: Household) => void;
  onDeleteHousehold: (householdId: string) => void;
}

const HouseholdPopover: React.FC<Props> = ({ household, open, onClose, isAdminLoggedIn, onEditHousehold, onDeleteHousehold }) => {
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  if (!household) return null;

  const handleDeleteClick = () => {
    setShowConfirmDelete(true);
  };

  const handleConfirmDelete = () => {
    onDeleteHousehold(household.householdId);
    setShowConfirmDelete(false);
  };

  const handleCancelDelete = () => {
    setShowConfirmDelete(false);
  };

  return (
    <Dialog open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { maxHeight: '90vh', position: 'relative' },  }}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 8,
          top: 8,
          color: (theme: any) => theme.palette.grey[500],
          backgroundColor: 'white',
          zIndex: 1, // Ensure it's above other content
        }}
      >
        <CloseIcon />
      </IconButton>
      <Card sx={{ display: 'flex', flexDirection: 'column', flex: '1 1 auto', width: '100%', minWidth: 600, maxWidth: 600, borderRadius: 0 }}>
        {household.familyPhotoUrl && (
          <CardMedia
            component="img"
            height="auto"
            image={household.familyPhotoUrl}
            alt={`${household.familyName} photo`}
            sx={{ flexShrink: 0 }}
          />
        )}
        <CardContent sx={{ overflowY: 'auto', flex: '1 1 auto' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography gutterBottom variant="h5" component="div" sx={{ mb: 0 }}>
              {household.familyName}
            </Typography>
            {isAdminLoggedIn && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<EditIcon />}
                  onClick={() => onEditHousehold(household)}
                >
                  Edit
                </Button>
                <Button
                  variant="outlined"
                  color="error"
                  size="small"
                  onClick={handleDeleteClick}
                >
                  Delete
                </Button>
              </Stack>
            )}
          </Box>
          {showConfirmDelete ? (
            <Stack spacing={2} sx={{ mt: 2, p: 2, border: '1px solid red', borderRadius: 1 }}>
              <Typography variant="body1" color="error">Are you sure you want to delete this household?</Typography>
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button variant="outlined" onClick={handleCancelDelete}>Cancel</Button>
                <Button variant="contained" color="error" onClick={handleConfirmDelete}>Confirm Delete</Button>
              </Stack>
            </Stack>
          ) : (
            <Typography variant="body2" color="text.secondary" fontStyle="italic">
              "{household.householdBio}"
            </Typography>
          )}
          
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" component="h3" sx={{ mb: 1, fontSize: '1.1rem' }}>
            Family Members
          </Typography>
          <List dense sx={{ display: 'flex', flexWrap: 'wrap', p: 0 }}>
            {household.members.map((member) => (
              <ListItem key={member.memberId} disablePadding sx={{ width: '50%' }}>
                <ListItemAvatar>
                  <Avatar src={member.photoUrl} alt={member.firstName} sx={{ width: 32, height: 32 }} />
                </ListItemAvatar>
                <ListItemText primary={member.firstName} secondary={member.role} />
              </ListItem>
            ))}
          </List>
          {household.ministryInvolvement?.length > 0 && (
            <>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" component="h3" sx={{ mb: 1, fontSize: '1.1rem' }}>
                Ministries
              </Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {household.ministryInvolvement.map((ministry) => (
                  <Chip key={ministry} label={ministry} color="primary" size="small" />
                ))}
              </Stack>
            </>
          )}
        </CardContent>
      </Card>
    </Dialog>
  );
}

export default HouseholdPopover;