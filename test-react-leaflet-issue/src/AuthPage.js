import React, { useState, useEffect, createContext } from 'react';

// Define keys for localStorage.
const LOCAL_STORAGE_USER_KEY = 'landslide_app_user';
const LOCAL_STORAGE_EXPLICIT_LOGIN_KEY = 'landslide_app_explicit_login';
const LOCAL_STORAGE_REGISTERED_USERS_KEY = 'landslide_app_registered_users';

export const AuthContext = createContext(null);

const AuthPage = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (error) {
      console.error("Failed to parse user from localStorage:", error);
      return null;
    }
  });

  const [userId, setUserId] = useState(() => user ? user.uid : null);

  const [isExplicitlyLoggedIn, setIsExplicitlyLoggedIn] = useState(() => {
    try {
      const storedLoginStatus = localStorage.getItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY);
      return storedLoginStatus === 'true';
    } catch (error) {
      console.error("Failed to parse explicit login status from localStorage:", error);
      return false;
    }
  });

  const [registeredUsers, setRegisteredUsers] = useState(() => {
    try {
      const storedRegisteredUsers = localStorage.getItem(LOCAL_STORAGE_REGISTERED_USERS_KEY);
      return storedRegisteredUsers ? JSON.parse(storedRegisteredUsers) : {};
    } catch (error) {
      console.error("Failed to parse registered users from localStorage:", error);
      return {};
    }
  });

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    console.log('AuthPage: useEffect - Initializing mock authentication...');
    setAuthReady(true);
    console.log('AuthPage: Mock authentication ready.');
    if (isExplicitlyLoggedIn && user) {
      setMessage(`Welcome back, ${user.email}!`);
    } else {
      setMessage('Please log in or sign up to access the application.');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
    localStorage.setItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY, String(isExplicitlyLoggedIn));
  }, [user, isExplicitlyLoggedIn]);

  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
  }, [registeredUsers]);


  const handleSignUp = async () => {
    setAuthError('');
    setMessage('');
    if (!authReady) {
      setAuthError('Authentication not ready. Please wait.');
      return;
    }
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    if (registeredUsers[email]) {
      setAuthError('An account with this email already exists. Please sign in.');
      return;
    }

    const newUid = `mock-${btoa(email).slice(0, 10)}`;
    const newUserProfile = { email: email, uid: newUid };

    setRegisteredUsers(prev => ({
      ...prev,
      [email]: { password: password, uid: newUid }
    }));

    setUser(newUserProfile);
    setUserId(newUid);
    setIsExplicitlyLoggedIn(true);
    setMessage('Account created successfully! You are now logged in.');
    console.log('AuthPage: Sign up successful. User:', newUserProfile);
  };

  const handleSignIn = async () => {
    setAuthError('');
    setMessage('');
    if (!authReady) {
      setAuthError('Authentication not ready. Please wait.');
      return;
    }
    if (!email || !password) {
      setAuthError('Please enter both email and password.');
      return;
    }

    const storedUser = registeredUsers[email];

    if (!storedUser) {
      setAuthError('No account found with this email. Please sign up.');
      setIsExplicitlyLoggedIn(false);
      return;
    }

    if (storedUser.password === password) {
      const loggedInUser = { email: email, uid: storedUser.uid };
      setUser(loggedInUser);
      setUserId(loggedInUser.uid);
      setIsExplicitlyLoggedIn(true);
      setMessage('Logged in successfully!');
      console.log('AuthPage: Mock sign in successful. User:', loggedInUser);
    } else {
      setAuthError('Invalid email or password.');
      setIsExplicitlyLoggedIn(false);
    }
  };

  const handleSignOut = async () => {
    setAuthError('');
    setMessage('');
    if (!authReady) {
      setAuthError('Authentication not ready. Please wait.');
      return;
    }
    setUser(null);
    setUserId(null);
    setIsExplicitlyLoggedIn(false);
    setMessage('Logged out successfully.');
    console.log('AuthPage: Mock sign out successful.');

    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY);
  };

  const authContextValue = {
    user,
    userId,
    authReady,
    isExplicitlyLoggedIn,
    authError,
    message,
    handleSignIn,
    handleSignUp,
    handleSignOut,
    setEmail,
    setPassword,
    email,
    password,
  };

  if (!authReady) {
    console.log('AuthPage: Rendering loading state.');
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-box">
          <p className="auth-loading-text">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isExplicitlyLoggedIn) {
    console.log('AuthPage: Rendering login/signup form.');
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
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="auth-input"
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="auth-input-group">
                <label htmlFor="password" className="auth-label">
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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

  console.log('AuthPage: User explicitly logged in. Rendering children.');
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthPage;