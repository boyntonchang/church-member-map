import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
} from '@mui/material';

interface Props {
  open: boolean;
  onLogin: (username: string) => void;
  onClose: () => void;
}

const LoginModal: React.FC<Props> = ({ open, onLogin, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = () => {
    // In a real application, you would send these credentials to a backend for authentication.
    // For this example, we'll use a simple hardcoded check.
    onLogin(username);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth disableEscapeKeyDown>
      <DialogTitle>Admin Login</DialogTitle>
      <DialogContent>
        <TextField
          autoFocus
          margin="dense"
          label="Username"
          type="text"
          fullWidth
          variant="outlined"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
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
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" color="primary">
          Login
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LoginModal;