import React from 'react';
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
  Chip
} from '@mui/material';
import type { Household } from '../types'; // Import our custom type
 // Import our custom type

interface Props {
  household: Household | null;
  open: boolean;
  onClose: () => void;
}

const HouseholdPopover: React.FC<Props> = ({ household, open, onClose }) => {
  if (!household) return null;

  return (
    <Dialog open={open} onClose={onClose} sx={{ '& .MuiDialog-paper': { maxHeight: '90vh' },  }}>
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
          <Typography gutterBottom variant="h5" component="div">
            {household.familyName}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontStyle="italic">
            "{household.householdBio}"
          </Typography>
          
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" component="h3" sx={{ mb: 1, fontSize: '1.1rem' }}>
            Family Members
          </Typography>
          <List dense>
            {household.members.map((member) => (
              <ListItem key={member.memberId} disablePadding>
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