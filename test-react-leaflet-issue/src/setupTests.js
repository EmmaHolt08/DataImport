// src/setupTests.js
import '@testing-library/jest-dom'; // Keep this at the top for Jest DOM matchers
import React from 'react';

// --- Global Mock AuthContext Value ---
const mockAuthContextValue = {
  user: null,
  user_id: null,
  token: null,
  isLoadingAuth: false,
  login: jest.fn(),
  logout: jest.fn(),
  handleSignIn: jest.fn(),
  handleSignUp: jest.fn(),
  handleSignOut: jest.fn(),
};

export const setMockAuthContextValue = (newValue) => {
  Object.assign(mockAuthContextValue, newValue);
};

// --- Mock AuthPage Module ---
jest.mock('./AuthPage', () => {
  const actualAuthPageModule = jest.requireActual('./AuthPage');
  return {
    AuthContext: actualAuthPageModule.AuthContext, 
    __esModule: true,
    default: ({ children }) => {
      const { user, token, isLoadingAuth } = mockAuthContextValue;

      if (isLoadingAuth) {
        return <div>Mock Auth Loading...</div>;
      }
      if (!token) {
        return (
          <actualAuthPageModule.AuthContext.Provider value={mockAuthContextValue}>
            <div className="auth-page-container">
              <div className="auth-form-card">
                <h2 className="auth-form-title">Landslide Report Login</h2>
                <input id="user_email" placeholder="email" />
                <input id="password" type="password" placeholder="password" />
                <button>Sign In</button>
                <button>Sign Up</button>
              </div>
            </div>
          </actualAuthPageModule.AuthContext.Provider>
        );
      }
      return (
        <actualAuthPageModule.AuthContext.Provider value={mockAuthContextValue}>
          {children}
        </actualAuthPageModule.AuthContext.Provider>
      );
    },
  };
});

// --- Mock React Router DOM (Final Version for Test Control) ---
// This variable will hold the initial entries for the MemoryRouter
// This MUST be a variable that can be set by the test runner.
let mockRouterInitialEntries = ['/']; // Default to root path

jest.mock('react-router-dom', () => {
  const actualRouterDom = jest.requireActual('react-router-dom');
  return {
    ...actualRouterDom,
    // When BrowserRouter is used in App.js, it will now be a MemoryRouter
    // AND it will receive the initialEntries from `mockRouterInitialEntries`.
    BrowserRouter: ({ children }) => {
      return (
        <actualRouterDom.MemoryRouter initialEntries={mockRouterInitialEntries}>
          {children}
        </actualRouterDom.MemoryRouter>
      );
    },
    // Also explicitly mock the Router export if used directly
    Router: ({ children }) => { // Mock Router if App uses <Router> directly too
      return (
        <actualRouterDom.MemoryRouter initialEntries={mockRouterInitialEntries}>
          {children}
        </actualRouterDom.MemoryRouter>
      );
    },
    // We explicitly export MemoryRouter so App.test.js can import it and use it if needed.
    MemoryRouter: actualRouterDom.MemoryRouter,
    // Mock the hooks for components that use them.
    useNavigate: jest.fn(),
    // useLocation will now implicitly follow the MemoryRouter's path
    // We don't need to mock it with a static return value here anymore.
    useLocation: jest.fn(() => actualRouterDom.useLocation()), // Use the actual hook, which gets state from MemoryRouter
    useParams: jest.fn(() => actualRouterDom.useParams()), // Use actual hook
    useMatch: jest.fn(() => actualRouterDom.useMatch()), // Use actual hook
  };
});

// Export a helper to set initial entries for the mocked router.
export const setMockRouterInitialEntries = (entries) => {
  mockRouterInitialEntries = entries;
};


// --- Mock Child Components of Routes ---
jest.mock('./QueryForm.js', () => ({ __esModule: true, default: () => <div>Mock Query Form</div> }));
jest.mock('./MapCoords.js', () => ({ __esModule: true, default: () => <div>Mock Map Coords</div> }));
jest.mock('./ReportForm.js', () => ({ __esModule: true, default: () => <h1>Add New Landslide Data</h1> }));