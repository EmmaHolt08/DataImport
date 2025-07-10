import React, { useState, useEffect, createContext } from 'react';

// Define keys for localStorage
const LOCAL_STORAGE_USER_KEY = 'landslide_app_user';
const LOCAL_STORAGE_EXPLICIT_LOGIN_KEY = 'landslide_app_explicit_login';
const LOCAL_STORAGE_REGISTERED_USERS_KEY = 'landslide_app_registered_users';

// Create an AuthContext to provide authentication state to children components
export const AuthContext = createContext(null);

// AuthPage component will handle authentication UI and provide context
const AuthPage = ({ children }) => {
  // Initialize state from localStorage or default to null/empty
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
      return storedLoginStatus === 'true'; // localStorage stores strings
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

  // Effect to handle initial setup and load status
    useEffect(() => {
    console.log('AuthPage: useEffect - Initializing mock authentication...');
    setAuthReady(true);
    console.log('AuthPage: Mock authentication ready.');
  }, []); // This runs only once

  // Effect to set the initial message based on loaded user data
  useEffect(() => {
    if (isExplicitlyLoggedIn && user) {
      setMessage(`Welcome back, ${user.email}!`);
    } else {
      setMessage('Please log in or sign up to access the application.');
    }
  }, [isExplicitlyLoggedIn, user]); 

  // Effect to save user and login status to localStorage whenever they change
  useEffect(() => {
    if (user) {
      localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    }
    localStorage.setItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY, String(isExplicitlyLoggedIn));
  }, [user, isExplicitlyLoggedIn]);

  // Effect to save registeredUsers to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
  }, [registeredUsers]);


  // Handle mock user sign up
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

    // Simulate successful sign-up
    const newUid = `mock-${btoa(email).slice(0, 10)}`; // Simple unique ID from email
    const newUserProfile = { email: email, uid: newUid };

    setRegisteredUsers(prev => ({
      ...prev,
      [email]: { password: password, uid: newUid } // Store password and generated UID
    }));

    setUser(newUserProfile);
    setUserId(newUid);
    setIsExplicitlyLoggedIn(true);
    setMessage('Account created successfully! You are now logged in.');
    console.log('AuthPage: Mock sign up successful. User:', newUserProfile);
  };

  // Handle mock user sign in
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

    // Simulate successful sign-in
    if (storedUser.password === password) {
      const loggedInUser = { email: email, uid: storedUser.uid }; // Use the stored UID
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

  // Handle mock user logout
  const handleSignOut = async () => {
    setAuthError('');
    setMessage('');
    if (!authReady) {
      setAuthError('Authentication not ready. Please wait.');
      return;
    }
    // Simulate sign-out
    setUser(null);
    setUserId(null);
    setIsExplicitlyLoggedIn(false); // User logged out
    setMessage('Logged out successfully.');
    console.log('AuthPage: Mock sign out successful.');

    // Clear user data from localStorage on logout
    localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
    localStorage.removeItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY);
  };

  // Provide authentication state and functions via context
  const authContextValue = {
    user,
    userId,
    authReady,
    isExplicitlyLoggedIn, // Provide this new state via context
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

  // Render loading state while authentication is initializing
  if (!authReady) {
    console.log('AuthPage: Rendering loading state.');
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center">
          <p className="text-lg text-gray-700">Loading authentication...</p>
        </div>
      </div>
    );
  }

  // If auth is ready but user is NOT explicitly logged in, display the login/signup form
  if (!isExplicitlyLoggedIn) {
    console.log('AuthPage: Rendering login/signup form.');
    return (
      <AuthContext.Provider value={authContextValue}>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans">
          <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-xl w-full max-w-md border border-gray-200">
            <h2 className="text-3xl font-extrabold text-center text-gray-800 mb-8">
              Landslide Report Login
            </h2>

            {authError && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Error:</strong>
                <span className="block sm:inline ml-2">{authError}</span>
              </div>
            )}

            {message && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg relative mb-6" role="alert">
                <strong className="font-bold">Info:</strong>
                <span className="block sm:inline ml-2">{message}</span>
              </div>
            )}

            <div>
              <div className="mb-5">
                <label htmlFor="email" className="block text-gray-700 text-sm font-bold mb-2">
                  Email:
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                  placeholder="your.email@example.com"
                />
              </div>
              <div className="mb-6">
                <label htmlFor="password" className="block text-gray-700 text-sm font-bold mb-2">
                  Password:
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="shadow-sm appearance-none border border-gray-300 rounded-lg w-full py-3 px-4 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition duration-200"
                  placeholder="••••••••"
                />
              </div>
              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleSignIn}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-opacity-75"
                >
                  Sign In
                </button>
                <button
                  onClick={handleSignUp}
                  className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-3 px-6 rounded-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-opacity-75"
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

  // If user IS explicitly logged in, render the children (the rest of the app)
  console.log('AuthPage: User explicitly logged in. Rendering children.');
  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthPage;