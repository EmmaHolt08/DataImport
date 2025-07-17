// import React, { useState, useEffect, createContext } from 'react';

// //NOTES: change from local storage to db storage
// //report form is accessing userID sucessfully  but is not reporting it to the backend
// // "Error: [object Object]"

// // Define keys for localStorage.
// const LOCAL_STORAGE_USER_KEY = 'landslide_app_user';
// const LOCAL_STORAGE_EXPLICIT_LOGIN_KEY = 'landslide_app_explicit_login';
// const LOCAL_STORAGE_REGISTERED_USERS_KEY = 'landslide_app_registered_users';

// const LOCAL_STORAGE_AUTH_TOKEN_KEY = 'landlside_app_auth_token';
// export const AuthContext = createContext(null);

// const AuthPage = ({ children }) => {
//  // const [user, setUser] = useState(null);
//   const [userID, setUserID] = useState(null);
//  // const [isExplicitlyLoggedIn, setIsExplicitlyLoggedIn] = useState(false);

//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [authError, setAuthError] = useState('');
//   const [authReady, setAuthReady] = useState(false);
//   const [message, setMessage] = useState('');

//   const [user, setUser] = useState(() => {
//     try {
//       const storedUser = localStorage.getItem(LOCAL_STORAGE_USER_KEY);
//       return storedUser ? JSON.parse(storedUser) : null;
//     } catch (error) {
//       return null;
//     }
//   });

//   const [userId, setUserId] = useState(() => user ? user.uid : null);

//   const [isExplicitlyLoggedIn, setIsExplicitlyLoggedIn] = useState(() => {
//     try {
//       const storedLoginStatus = localStorage.getItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY);
//       return storedLoginStatus === 'true';
//     } catch (error) {
//       return false;
//     }
//   });

//   const [registeredUsers, setRegisteredUsers] = useState(() => {
//     try {
//       const storedRegisteredUsers = localStorage.getItem(LOCAL_STORAGE_REGISTERED_USERS_KEY);
//       return storedRegisteredUsers ? JSON.parse(storedRegisteredUsers) : {};
//     } catch (error) {
//       return {};
//     }
//   });

//   // const [email, setEmail] = useState('');
//   // const [password, setPassword] = useState('');
//   // const [authError, setAuthError] = useState('');
//   // const [authReady, setAuthReady] = useState(false);
//   // const [message, setMessage] = useState('');

//   useEffect(() => {
//     setAuthReady(true);
//     if (isExplicitlyLoggedIn && user) {
//       setMessage(`Welcome back, ${user.email}!`);
//     } else {
//       setMessage('Please log in or sign up to access the application.');
//     }
//   }, []);

//   // useEffect(() => {
//   //   if (user) {
//   //     localStorage.setItem(LOCAL_STORAGE_USER_KEY, JSON.stringify(user));
//   //   } else {
//   //     localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
//   //   }
//   //   localStorage.setItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY, String(isExplicitlyLoggedIn));
//   // }, [user, isExplicitlyLoggedIn]);

//   // useEffect(() => {
//   //   localStorage.setItem(LOCAL_STORAGE_REGISTERED_USERS_KEY, JSON.stringify(registeredUsers));
//   // }, [registeredUsers]);


//   const handleSignUp = async () => {
//     setAuthError('');
//     setMessage('');
//     if (!authReady) {
//       setAuthError('Authentication not ready. Please wait.');
//       return;
//     }
//     if (!email || !password) {
//       setAuthError('Please enter both email and password.');
//       return;
//     }

//     if (registeredUsers[email]) {
//       setAuthError('An account with this email already exists. Please sign in.');
//       return;
//     }

//     const newUid = `${btoa(email).slice(0, 10)}`; //random 10 char string
//     const newUserProfile = { email: email, uid: newUid };

//     setRegisteredUsers(prev => ({
//       ...prev,
//       [email]: { password: password, uid: newUid }
//     }));

//     setUser(newUserProfile);
//     setUserId(newUid);
//     setIsExplicitlyLoggedIn(true);
//     setMessage('Account created successfully! You are now logged in.');
//   };

//   const handleSignIn = async () => {
//     setAuthError('');
//     setMessage('');
//     if (!authReady) {
//       setAuthError('Authentication not ready. Please wait.');
//       return;
//     }
//     if (!email || !password) {
//       setAuthError('Please enter both email and password.');
//       return;
//     }

//     const storedUser = registeredUsers[email];

//     if (!storedUser) {
//       setAuthError('No account found with this email/password. Please sign up.');
//       setIsExplicitlyLoggedIn(false);
//       return;
//     }

//     if (storedUser.password === password) {
//       const loggedInUser = { email: email, uid: storedUser.uid };
//       setUser(loggedInUser);
//       setUserID(loggedInUser.uid);
//       setIsExplicitlyLoggedIn(true);
//       setMessage('Logged in successfully!');
//     } else {
//       setAuthError('Invalid email or password.');
//       setIsExplicitlyLoggedIn(false);
//     }
//   };

//   const handleSignOut = async () => {
//     setAuthError('');
//     setMessage('');
//     if (!authReady) {
//       setAuthError('Authentication not ready. Please wait.');
//       return;
//     }
//     setUser(null);
//     setUserId(null);
//     setIsExplicitlyLoggedIn(false);
//     setMessage('Logged out successfully.');

//     localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
//     localStorage.removeItem(LOCAL_STORAGE_EXPLICIT_LOGIN_KEY);
//   };

//   const authContextValue = {
//     user,
//     userId,
//     authReady,
//     isExplicitlyLoggedIn,
//     authError,
//     message,
//     handleSignIn,
//     handleSignUp,
//     handleSignOut,
//     setEmail,
//     setPassword,
//     email,
//     password,
//   };

//   if (!authReady) {
//     return (
//       <div className="auth-loading-container">
//         <div className="auth-loading-box">
//           <p className="auth-loading-text">Loading authentication...</p>
//         </div>
//       </div>
//     );
//   }

//   if (!isExplicitlyLoggedIn) {
//     return (
//       <AuthContext.Provider value={authContextValue}>
//         <div className="auth-page-container">
//           <div className="auth-form-card">
//             <h2 className="auth-form-title">
//               Landslide Report Login
//             </h2>

//             {authError && (
//               <div className="auth-error-message" role="alert">
//                 <strong className="auth-message-strong">Error:</strong>
//                 <span className="auth-message-span">{authError}</span>
//               </div>
//             )}

//             {message && (
//               <div className="auth-info-message" role="alert">
//                 <strong className="auth-message-strong">Info:</strong>
//                 <span className="auth-message-span">{message}</span>
//               </div>
//             )}

//             <div>
//               <div className="auth-input-group">
//                 <label htmlFor="email" className="auth-label">
//                   Email:
//                 </label>
//                 <input
//                   type="email"
//                   id="email"
//                   value={email}
//                   onChange={(e) => setEmail(e.target.value)}
//                   className="auth-input"
//                   placeholder="your.email@example.com"
//                 />
//               </div>
//               <div className="auth-input-group">
//                 <label htmlFor="password" className="auth-label">
//                   Password:
//                 </label>
//                 <input
//                   type="password"
//                   id="password"
//                   value={password}
//                   onChange={(e) => setPassword(e.target.value)}
//                   className="auth-input"
//                   placeholder="••••••••"
//                 />
//               </div>
//               <div className="auth-button-group">
//                 <button
//                   onClick={handleSignIn}
//                   className="auth-button auth-button-primary"
//                 >
//                   Sign In
//                 </button>
//                 <button
//                   onClick={handleSignUp}
//                   className="auth-button auth-button-secondary"
//                 >
//                   Sign Up
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       </AuthContext.Provider>
//     );
//   }

//   return (
//     <AuthContext.Provider value={authContextValue}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export default AuthPage;

import React, { useState, useEffect, createContext, useCallback } from 'react';

const LOCAL_STORAGE_AUTH_TOKEN_KEY = 'landslide_app_auth_token';

export const AuthContext = createContext(null);

const AuthPage = ({ children }) => {
  const [user, setUser] = useState(null); 
  const [userId, setUserId] = useState(null);
  const [token, setToken] = useState(null); 
  const [isExplicitlyLoggedIn, setIsExplicitlyLoggedIn] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authReady, setAuthReady] = useState(false);
  const [message, setMessage] = useState('');

  const API_BASE_URL = 'http://127.0.0.1:8000'; 
  useEffect(() => {
    const storedToken = localStorage.getItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
    if (storedToken) {
      
      setIsExplicitlyLoggedIn(true);
      setToken(storedToken);
      fetchUserFromToken(storedToken);

    }
    setAuthReady(true); 
  }, []);

  const fetchUserFromToken = useCallback(async (authToken) => {
  }, []);



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

    try {
      const response = await fetch(`${API_BASE_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(LOCAL_STORAGE_AUTH_TOKEN_KEY, data.access_token);
        setToken(data.access_token);
        setUser({ email: data.email, uid: data.user_id });
        setUserId(data.user_id);
        setIsExplicitlyLoggedIn(true);
        setMessage('Account created successfully! You are now logged in.');
      } else {
        const errorData = await response.json();
        setAuthError(errorData.detail || 'Sign up failed.');
        setIsExplicitlyLoggedIn(false);
      }
    } catch (error) {
      console.error('Sign up network error:', error);
      setAuthError('Network error. Please try again.');
    }
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

    try {
      const details = new URLSearchParams();
      details.append('username', email); 
      details.append('password', password);

      const response = await fetch(`${API_BASE_URL}/token`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: details.toString(),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem(LOCAL_STORAGE_AUTH_TOKEN_KEY, data.access_token);
        setToken(data.access_token);
        setUser({ email: data.email, uid: data.user_id });
        setUserId(data.user_id);
        setIsExplicitlyLoggedIn(true);
        setMessage('Logged in successfully!');
      } else {
        const errorData = await response.json();
        setAuthError(errorData.detail || 'Invalid email or password.');
        setIsExplicitlyLoggedIn(false);
      }
    } catch (error) {
      console.error('Sign in network error:', error);
      setAuthError('Network error. Please try again.');
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
    setToken(null);
    setIsExplicitlyLoggedIn(false);
    setMessage('Logged out successfully.');

    localStorage.removeItem(LOCAL_STORAGE_AUTH_TOKEN_KEY);
  };

  const authContextValue = React.useMemo(() => ({
    user,
    userId,
    token, 
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
  }), [user, userId, token, authReady, isExplicitlyLoggedIn, authError, message, email, password]); // Add all dependencies

  if (!authReady) {
    return (
      <div className="auth-loading-container">
        <div className="auth-loading-box">
          <p className="auth-loading-text">Loading authentication...</p>
        </div>
      </div>
    );
  }

  if (!isExplicitlyLoggedIn) {
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

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthPage;