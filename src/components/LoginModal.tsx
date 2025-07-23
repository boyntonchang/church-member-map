import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface Props {
  open: boolean;
  onLogin: (email: string, password: string) => void; // Changed to accept email and password
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ open, onLogin, onClose }) => {
  const [email, setEmail] = useState(''); // Changed from username to email
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    onLogin(email, password); // Pass email and password
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>
        Admin Login
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
        <TextField
          autoFocus
          margin="dense"
          label="Email"
          type="email"
          fullWidth
          variant="outlined"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          margin="dense"
          label="Password"
          type="password"
          fullWidth
          variant="outlined"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, backgroundColor: 'currentColor' }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;