// src/App.test.js
import { render, screen } from '@testing-library/react';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AuthContext } from './AuthPage'; 
import App from './App'; 

const mockAuthContextValue = {
  user_id: null, 
  login: jest.fn(),
  logout: jest.fn(),
};

jest.mock('react-leaflet', () => ({
  MapContainer: ({ children }) => <div>{children}</div>,
  TileLayer: () => null,
  Marker: () => null,
  Popup: () => null,
  useMapEvents: () => ({
    click: jest.fn(),
  }),
}));


jest.mock('leaflet/dist/leaflet.css', () => {});


describe('App component (Integration Test)', () => {
  test('renders login page when not authenticated initially', () => {
    render(
      <AuthContext.Provider value={mockAuthContextValue}>
        <MemoryRouter initialEntries={['/']}> 
          <App /> 
        </MemoryRouter>
      </AuthContext.Provider>
    );


    const loginTitle = screen.getByText(/Landslide Report Login/i);
    expect(loginTitle).toBeInTheDocument();

    const reportFormTitle = screen.queryByRole('heading', { name: /Add New Landslide Data/i });
    expect(reportFormTitle).not.toBeInTheDocument();
  });

  test('renders main application content when authenticated', () => {
    const authenticatedAuthContextValue = {
      ...mockAuthContextValue,
      user_id: "authenticatedUser",
    };

    render(
      <AuthContext.Provider value={authenticatedAuthContextValue}>
        <MemoryRouter initialEntries={['/']}>
          <App />
        </MemoryRouter>
      </AuthContext.Provider>
    );

    const reportFormTitle = screen.getByRole('heading', { name: /Add New Landslide Data/i });
    expect(reportFormTitle).toBeInTheDocument();

    const loginTitle = screen.queryByText(/Landslide Report Login/i);
    expect(loginTitle).not.toBeInTheDocument();
  });
});
