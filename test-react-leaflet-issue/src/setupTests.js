// src/setupTests.js
import '@testing-library/jest-dom'; 
import React from 'react';

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


let mockRouterInitialEntries = ['/']; 

jest.mock('react-router-dom', () => {
  const actualRouterDom = jest.requireActual('react-router-dom');
  return {
    ...actualRouterDom,
    BrowserRouter: ({ children }) => {
      return (
        <actualRouterDom.MemoryRouter initialEntries={mockRouterInitialEntries}>
          {children}
        </actualRouterDom.MemoryRouter>
      );
    },
    Router: ({ children }) => { 
      return (
        <actualRouterDom.MemoryRouter initialEntries={mockRouterInitialEntries}>
          {children}
        </actualRouterDom.MemoryRouter>
      );
    },
    MemoryRouter: actualRouterDom.MemoryRouter,
    useNavigate: jest.fn(),
    useLocation: jest.fn(() => actualRouterDom.useLocation()), 
    useParams: jest.fn(() => actualRouterDom.useParams()), 
    useMatch: jest.fn(() => actualRouterDom.useMatch()), 
  };
});

export const setMockRouterInitialEntries = (entries) => {
  mockRouterInitialEntries = entries;
};


jest.mock('./QueryForm.js', () => ({ __esModule: true, default: () => <div>Mock Query Form</div> }));
jest.mock('./MapCoords.js', () => ({ __esModule: true, default: () => <div>Mock Map Coords</div> }));
jest.mock('./ReportForm.js', () => ({ __esModule: true, default: () => <h1>Add New Landslide Data</h1> }));