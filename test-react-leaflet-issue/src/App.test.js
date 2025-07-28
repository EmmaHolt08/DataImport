// src/App.test.js
import { render, screen } from '@testing-library/react';
import React from 'react'; 
// Import helpers from setupTests.js
import { setMockAuthContextValue, setMockRouterInitialEntries } from './setupTests';

// We no longer import MemoryRouter here directly, as we control it via setMockRouterInitialEntries.
// import { MemoryRouter } from 'react-router-dom'; // Remove this line if it's there

import App from './App'; // Import the original App.js


describe('App component (Integration Test)', () => {

  beforeEach(() => {
    // Reset AuthContext to default unauthenticated state
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
    // Reset router to default initial entry for each test
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

    // Render App directly. The mocked BrowserRouter/Router in App.js will handle routing.
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

    // For this test, set the router's initial entry to /report
    setMockRouterInitialEntries(['/report']); 

    // Render App directly. It will use the mocked BrowserRouter starting at /report.
    render(<App />); 

    const reportFormTitle = screen.getByRole('heading', { name: /Add New Landslide Data/i });
    expect(reportFormTitle).toBeInTheDocument();

    const loginTitle = screen.queryByText(/Landslide Report Login/i);
    expect(loginTitle).not.toBeInTheDocument();

    const mainAppHeading = screen.getByRole('heading', { name: /Landslides/i });
    expect(mainAppHeading).toBeInTheDocument();
  });
});