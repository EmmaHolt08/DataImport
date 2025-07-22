import React, { useState, useEffect, createContext, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 

const LOCAL_STORAGE_AUTH_TOKEN_KEY = 'landslide_app_auth_token';

export const AuthContext = createContext(null);

const AuthPage = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [user_id, setUser_id] = useState(null);
  const [token, setToken] = useState(null); 

  const [isLoadingAuth, setIsLoadingAuth] = useState(true); 

  const [authError, setAuthError] = useState('');
  const [message, setMessage] = useState('');

  const [inputEmail, setInputEmail] = useState('');
  const [inputPassword, setInputPassword] = useState('');
  const [inputUsername, setInputUsername] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000'; 

  const navigate = useNavigate();

  const applyAuthData = useCallback((authToken, userData = null) => {
      setAuthError(''); 
      setMessage('');   

      if (authToken && userData) {
          localStorage.setItem(LOCAL_STORAGE_AUTH_TOKEN_KEY, authToken);
          setToken(authToken);
          setUser({ email: userData.email, user_id: userData.user_id, username: userData.username });
          setUser_id(userData.user_id);
      } else {
          localStorage.removeItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
          setToken(null);
          setUser(null);
          setUser_id(null); 
      }
  }, []); 

  const fetchUserFromToken = useCallback(async (authToken) => {
      if (!authToken) {
          applyAuthData(null); 
          return;
      }

      try {
          const response = await fetch(`${API_BASE_URL}/users/me`, {
              method: 'GET',
              headers: {
                  'Authorization': `Bearer ${authToken}`, 
                  'Content-Type': 'application/json',
              },
          });

          if (response.ok) {
              const data = await response.json(); 
              if (data && typeof data.user_id === 'string' && typeof data.email === 'string') {
                  applyAuthData(authToken, { user_id: data.user_id, email: data.email, username: data.username }); 
              } else {
                  console.error("DEBUG: /users/me response missing expected 'id' or 'email' or wrong type:", data);
                  applyAuthData(null); 
              }
          } else {
              const errorData = await response.json();
              console.error("DEBUG: /users/me fetch failed. Status:", response.status, "Details:", errorData);
              applyAuthData(null); 
          }
      } catch (error) {
          console.error('DEBUG: Network error during /users/me fetch:', error);
          applyAuthData(null); 
      } finally {
          setIsLoadingAuth(false); 
      }
  }, [API_BASE_URL, applyAuthData]); 

  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
    
    if (storedToken) {
        fetchUserFromToken(storedToken);
    } else {
        setIsLoadingAuth(false);
    }
  }, [fetchUserFromToken]); 


  const handleSignUp = async () => { 
    setAuthError('');
    setMessage('');
    if (!inputEmail || !inputPassword || !inputUsername) {
      setAuthError('Please enter email, username, and password.');
      return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({email: inputEmail, password: inputPassword, username: inputUsername }),
        });

        if (response.ok) {
            const signInSuccess = await handleSignInInternal(inputEmail, inputPassword, inputUsername); 
            if (signInSuccess) {
                setMessage('Account created successfully! You are now logged in.');
                setInputEmail('');
                setInputPassword('');
                setInputUsername('');
                setUser_id('');
                navigate('/'); 
            } else {
                setAuthError('Account created, but automatic login failed. Please sign in manually.');
            }
        } else {
    const errorData = await response.json();
    console.error("DEBUG: Backend error details:", errorData); // Log the full error data

    let errorMessage = 'An unknown error occurred.';
    if (errorData.detail) {
        if (typeof errorData.detail === 'string') {
            errorMessage = errorData.detail; // For simple string errors
        } else if (Array.isArray(errorData.detail) && errorData.detail.length > 0) {
            // 422 errors
            errorMessage = errorData.detail.map(err => `${err.loc.join('.')}: ${err.msg}`).join(', ');
        } else {
            // Fallback 
            errorMessage = JSON.stringify(errorData.detail);
        }
    } else if (errorData.message) { 
        errorMessage = errorData.message;
    }

    setAuthError(errorMessage || 'Sign up failed.'); 
}

    } catch (error) {
        console.error('Sign up network error:', error);
        setAuthError('Network error. Please try again.');
    }
  };

  const handleSignInInternal = async (signInEmail, signInPassword, signInUsername) => { 
    setAuthError('');
    setMessage('');
    if (!signInEmail || !signInPassword || !signInUsername) {
      setAuthError('Please enter email, username, and password.');
      return false; 
    }

    try {
        const details = new URLSearchParams();
        details.append('email', signInEmail); 
        details.append('password', signInPassword);

        const response = await fetch(`${API_BASE_URL}/token`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: details.toString(),
        });

        if (response.ok) {
            const data = await response.json(); 
            applyAuthData(data.access_token, { id: data.user_id, email: data.email, username: data.username });
            setMessage('Logged in successfully!');
            setInputEmail('');
            setInputPassword('');
            setInputUsername('');
            navigate('/'); 
            return true; 
        } else {
            const errorData = await response.json();
            setAuthError(errorData.detail || 'Invalid email, username, or password.');
            return false; 
        }
    } catch (error) {
        console.error('Sign in network error:', error);
        setAuthError('Network error. Please try again.');
        return false; 
    }
  };

  const handleSignIn = async () => {
    await handleSignInInternal(inputEmail, inputPassword, inputUsername);
  };

  const handleSignOut = useCallback(async () => { 
    setAuthError('');
    setMessage('Logged out successfully.');
    applyAuthData(null); 
    navigate('/'); 
  }, [applyAuthData, navigate]); 

  const authContextValue = useMemo(() => ({
    user,
    user_id, 
    token,  
    isLoadingAuth, 
    authError,
    message,
    handleSignIn,
    handleSignUp,
    handleSignOut,
  }), [user, user_id, token, isLoadingAuth, authError, message, handleSignIn, handleSignUp, handleSignOut]);


  if (isLoadingAuth) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-box">
          <p className="auth-loading-text">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!token) { 
    return (
      <AuthContext.Provider value={authContextValue}>
        <div className="auth-page-container">
          <div className="auth-form-card">
            <h2 className="auth-form-title">
              Landslide Report Login
            </h2>

            {authError && (
              <div className="auth-error-message" role="alert">
                <strong className="auth-message-strong">Error:</strong>
                <span className="auth-message-span">{authError}</span>
              </div>
            )}

            {message && (
              <div className="auth-info-message" role="alert">
                <strong className="auth-message-strong">Info:</strong>
                <span className="auth-message-span">{message}</span>
              </div>
            )}
            
            <div>
              <div className="auth-input-group">
                <label htmlFor="email" className="auth-label">
                  Email:
                </label>
                <input
                  type="email" 
                  id="user_email"
                  value={inputEmail} 
                  onChange={(e) => setInputEmail(e.target.value)} 
                  className="auth-input"
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="username" className="auth-label">
                  Username:
                </label>
                <input
                type="username"
                id="username"
                value={inputUsername}
                onChange={(e) => setInputUsername(e.target.value)}
                className="auth-input"
                placeholder="username"
                />
              </div>

              <div className="auth-input-group">
                <label htmlFor="password" className="auth-label">
                  Password:
                </label>
                <input
                  type="user_password"
                  id="password"
                  value={inputPassword} 
                  onChange={(e) => setInputPassword(e.target.value)} 
                  className="auth-input"
                  placeholder="••••••••"
                />
              </div>

              <div className="auth-button-group">
                <button
                  onClick={handleSignIn} 
                  className="auth-button auth-button-primary"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp} 
                  className="auth-button auth-button-secondary"
                >
                  Sign Up
                </button>
              </div>
            </div>
          </div>
        </div>
      </AuthContext.Provider>
    );
  }

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthPage;


