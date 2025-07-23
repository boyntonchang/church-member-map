import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Stack,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import { Add, Delete, Close as CloseIcon } from '@mui/icons-material';
import type { Household, Member } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (newHousehold: Omit<Household, 'householdId' | 'coordinates'>) => void;
  initialData?: Household | null;
}

const AddFamilyModal: React.FC<Props> = ({ open, onClose, onSave, initialData }) => {
  const [familyName, setFamilyName] = useState('');
  const [householdBio, setHouseholdBio] = useState('');
  const [address, setAddress] = useState('');
  const [members, setMembers] = useState<Omit<Member, 'memberId'>[]>([
    { firstName: '', role: 'Head of Household', photoUrl: '' },
  ]);
  const [ministries, setMinistries] = useState('');
  const [familyPhoto, setFamilyPhoto] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      if (initialData) {
        setFamilyName(initialData.familyName);
        setHouseholdBio(initialData.householdBio);
        setAddress(initialData.address);
        setMembers(initialData.members.map(member => ({ firstName: member.firstName, role: member.role, photoUrl: member.photoUrl || '' })));
        setMinistries(initialData.ministryInvolvement.join(', '));
        setFamilyPhoto(null);
      } else {
        setFamilyName('');
        setHouseholdBio('');
        setAddress('');
        setMembers([{ firstName: '', role: 'Head of Household', photoUrl: '' }]);
        setMinistries('');
        setFamilyPhoto(null);
      }
    }
  }, [open, initialData]);

  const handleAddMember = () => {
    setMembers([...members, { firstName: '', role: '', photoUrl: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: keyof Omit<Member, 'memberId'>, value: string) => {
    const newMembers = [...members] as (Omit<Member, 'memberId'> & { [key: string]: any })[];
    newMembers[index][field] = value;
    setMembers(newMembers as Omit<Member, 'memberId'>[]);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFamilyPhoto(event.target.files[0]);
    }
  };

  const handleSubmit = () => {
    const membersWithIds = members.map((member, index) => ({
      ...member,
      memberId: initialData?.members[index]?.memberId || `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }));

    const householdToSave = {
      familyName,
      householdBio,
      address,
      members: membersWithIds,
      ministryInvolvement: ministries.split(',').map(m => m.trim()).filter(m => m),
      familyPhotoUrl: familyPhoto ? URL.createObjectURL(familyPhoto) : (initialData?.familyPhotoUrl || ''),
    };
    onSave(householdToSave);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {initialData ? 'Edit Family' : 'Add New Family'}
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
            backgroundColor: 'white',
          }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 2 }}>
          <TextField
            label="Family Name"
            value={familyName}
            onChange={(e) => setFamilyName(e.target.value)}
            fullWidth
          />
          <TextField
            label="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
          />
          <TextField
            label="Household Bio"
            value={householdBio}
            onChange={(e) => setHouseholdBio(e.target.value)}
            multiline
            rows={3}
            fullWidth
          />
          <TextField
            label="Ministries (comma-separated)"
            value={ministries}
            onChange={(e) => setMinistries(e.target.value)}
            fullWidth
          />
          <Button variant="contained" component="label">
            Upload Family Photo
            <input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
          </Button>
          {familyPhoto && <Typography variant="body2">{familyPhoto.name}</Typography>}

          <Typography variant="h6">Family Members</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
            {members.map((member, index) => (
              <Box key={index} sx={{ flex: '1 1 calc(50% - 8px)', minWidth: '250px', border: '1px solid #ddd', p: 1.5, borderRadius: 1, position: 'relative' }}>
                <Stack spacing={1}>
                  <TextField
                    label="First Name"
                    value={member.firstName}
                    onChange={(e) => handleMemberChange(index, 'firstName', e.target.value)}
                    fullWidth
                    size="small"
                  />
                  <TextField
                    label="Role"
                    value={member.role}
                    onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
                    fullWidth
                    size="small"
                  />
                  {members.length > 1 && (
                    <IconButton
                      onClick={() => handleRemoveMember(index)}
                      size="small"
                      sx={{ position: 'absolute', top: 4, right: 4 }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  )}
                </Stack>
              </Box>
            ))}
          </Box>
          <Button startIcon={<Add />} onClick={handleAddMember} sx={{ mt: 2 }}>
            Add Member
          </Button>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">Save</Button>
      </DialogActions>
    </Dialog>
  );
};

export default AddFamilyModal;