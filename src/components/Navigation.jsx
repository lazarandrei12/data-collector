import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  Storage,
  ImportExport,
  Settings,
  Close
} from '@mui/icons-material';

const Navigation = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Funcție pentru toggle drawer
  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };
    const menuItems = [
    { text: 'Dashboard', icon: <Dashboard /> },
    { text: 'Data Sources', icon: <Storage /> },
    { text: 'Import/Export', icon: <ImportExport /> },
    { text: 'Settings', icon: <Settings /> }
    ];
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <IconButton
  size="large"
  edge="start"
  color="inherit"
  aria-label="menu"
  sx={{ mr: 2 }}
  onClick={toggleDrawer(true)}  // ← Adaugă asta
>
  <MenuIcon />
</IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Data Collector
          </Typography>
        </Toolbar>
      </AppBar>
       <Drawer
          anchor="left"
          open={drawerOpen}
          onClose={toggleDrawer(false)}
        >
          <Box
            sx={{ width: 250 }}
            role="presentation"
            onClick={toggleDrawer(false)}
            onKeyDown={toggleDrawer(false)}
          >
            {/* Header cu titlu și buton close */}
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              p: 2 
            }}>
              <Typography variant="h6">
                Menu
              </Typography>
              <IconButton onClick={toggleDrawer(false)}>
                <Close />
              </IconButton>
            </Box>
            
            <Divider />
            
            {/* Lista cu opțiuni */}
            <List>
              {menuItems.map((item) => (
                <ListItem key={item.text} disablePadding>
                  <ListItemButton>
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText primary={item.text} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        </Drawer>
    </Box>
  );
};

export default Navigation;