import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom'; 

import AuthPage from './AuthPage'; // Make sure this path is correct relative to App.js

const MockApp = () => {
  return (
    <BrowserRouter>
      <AuthPage>
        {/* This content will be rendered if the user is authenticated */}
        <div data-testid="app-content">Welcome to the Landslide App!</div>
      </AuthPage>
    </BrowserRouter>
  );
};


describe('AuthPage component', () => {
  test('renders Landslide Report Login when not authenticated', () => {
    render(<MockApp />);

    const loginTitle = screen.getByText(/Landslide Report Login/i);
    expect(loginTitle).toBeInTheDocument();

    const appContent = screen.queryByTestId('app-content');
    expect(appContent).not.toBeInTheDocument();
  });
});
