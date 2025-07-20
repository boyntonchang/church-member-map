import React, { useState } from 'react';
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
} from '@mui/material';
import { Add, Delete } from '@mui/icons-material';
import type { Household, Member } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (newHousehold: Omit<Household, 'householdId' | 'coordinates'>) => void;
}

const AddFamilyModal: React.FC<Props> = ({ open, onClose, onSave }) => {
  const [familyName, setFamilyName] = useState('');
  const [householdBio, setHouseholdBio] = useState('');
  const [address, setAddress] = useState('');
  const [members, setMembers] = useState<Omit<Member, 'memberId'>[]>([
    { firstName: '', role: 'Head of Household' },
  ]);
  const [ministries, setMinistries] = useState('');
  const [familyPhoto, setFamilyPhoto] = useState<File | null>(null);

  const handleAddMember = () => {
    setMembers([...members, { firstName: '', role: '' }]);
  };

  const handleRemoveMember = (index: number) => {
    const newMembers = members.filter((_, i) => i !== index);
    setMembers(newMembers);
  };

  const handleMemberChange = (index: number, field: keyof Omit<Member, 'memberId'>, value: string) => {
    const newMembers = [...members];
    newMembers[index][field] = value;
    setMembers(newMembers);
  };

  const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFamilyPhoto(event.target.files[0]);
    }
  };

  const handleSubmit = () => {
    const membersWithIds = members.map(member => ({
      ...member,
      memberId: `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, // Simple unique ID generation
    }));

    const newHouseholdData = {
      familyName,
      householdBio,
      address,
      members: membersWithIds,
      ministryInvolvement: ministries.split(',').map(m => m.trim()).filter(m => m),
      // In a real app, the photo would be uploaded and the URL would be set here.
      // For now, we'll use a placeholder or the local file path for demonstration.
      familyPhotoUrl: familyPhoto ? URL.createObjectURL(familyPhoto) : '',
    };
    onSave(newHouseholdData);
    onClose(); // Close modal after save
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add New Family</DialogTitle>
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
          {members.map((member, index) => (
            <Stack direction="row" spacing={1} key={index} alignItems="center">
              <TextField
                label="First Name"
                value={member.firstName}
                onChange={(e) => handleMemberChange(index, 'firstName', e.target.value)}
              />
              <TextField
                label="Role"
                value={member.role}
                onChange={(e) => handleMemberChange(index, 'role', e.target.value)}
              />
              <IconButton onClick={() => handleRemoveMember(index)} disabled={members.length === 1}>
                <Delete />
              </IconButton>
            </Stack>
          ))}
          <Button startIcon={<Add />} onClick={handleAddMember}>
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