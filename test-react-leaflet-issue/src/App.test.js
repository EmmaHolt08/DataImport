// src/App.test.js
import { render, screen } from '@testing-library/react';
import React from 'react'; 
import { setMockAuthContextValue, setMockRouterInitialEntries } from './setupTests';

import App from './App'; 


describe('App component (Integration Test)', () => {

  beforeEach(() => {
    setMockAuthContextValue({
      user: null,
      user_id: null,
      token: null,
      isLoadingAuth: false,
      login: jest.fn(),
      logout: jest.fn(),
      handleSignIn: jest.fn(),
      handleSignUp: jest.fn(),
      handleSignOut: jest.fn(),
    });
    setMockRouterInitialEntries(['/']); 
    jest.clearAllMocks(); 
  });


  test('renders login page when not authenticated initially', () => {
    setMockAuthContextValue({
      user: null,
      user_id: null,
      token: null,
      isLoadingAuth: false, 
    });

    render(<App />);

    const loginTitle = screen.getByText(/Landslide Report Login/i);
    expect(loginTitle).toBeInTheDocument();

    const reportFormTitle = screen.queryByRole('heading', { name: /Add New Landslide Data/i });
    expect(reportFormTitle).not.toBeInTheDocument();
  });


  test('renders main application content when authenticated', () => {
    setMockAuthContextValue({
      user: { username: "testuser", email: "test@example.com", user_id: "authenticatedUser123" },
      user_id: "authenticatedUser123",
      token: "mock-auth-token",
      isLoadingAuth: false,
    });

    setMockRouterInitialEntries(['/report']); 

    render(<App />); 

    const reportFormTitle = screen.getByRole('heading', { name: /Add New Landslide Data/i });
    expect(reportFormTitle).toBeInTheDocument();

    const loginTitle = screen.queryByText(/Landslide Report Login/i);
    expect(loginTitle).not.toBeInTheDocument();

    const mainAppHeading = screen.getByRole('heading', { name: /Landslides/i });
    expect(mainAppHeading).toBeInTheDocument();
  });
});