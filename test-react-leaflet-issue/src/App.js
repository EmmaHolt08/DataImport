import './App.css';
import React, {useContext} from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QueryForm from './QueryForm.js';
import MapCoords from './MapCoords.js';
import ReportForm from './ReportForm.js';
import AuthPage, { AuthContext } from './AuthPage.js';

export default function App() {
  return (
    <Router> {/* First Router */}
      <AuthPage>
        <AppContent/>
      </AuthPage>
    </Router>
  )
}

const AppContent = () => {
  const { user, userId, handleSignOut, isExplicitlyLoggedIn } = useContext(AuthContext);

  return (
    // Problematic Router:
    // This Router was present in your previous AppContent.
    // It has been removed in the correct version.
    // <Router>
    <div className="App">
      <h1 className="header"> Landslides </h1>
      <nav className="navbar">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-list">Home</Link>
          </li>
          {isExplicitlyLoggedIn && (
            <>
              <li className="nav-item">
                <Link to="/query" className="nav-list">Query</Link>
              </li>
              <li className="nav-item">
                <Link to="/report" className="nav-list">Report</Link>
              </li>
            </>
          )}
          {user ? (
            <>
              <li className="nav-item nav-text">
                Logged in as: {user.email || 'Anonymous'} (ID: {userId ? userId.substring(0, 8) + '...' : 'N/A'})
              </li>
              <li className="nav-item">
                <button onClick={handleSignOut} className="nav-button">Logout</button>
              </li>
            </>
          ) : (
            <li className="nav-item"></li>
          )}
        </ul>
      </nav>

      <div className="content-area">
        <Routes>
          <Route path="/" element={<MapCoords/>} />
          {isExplicitlyLoggedIn && (
            <>
              <Route path="/query" element={<QueryForm/>} />
              <Route path="/report" element={<ReportForm/>} />
            </>
          )}
          {!isExplicitlyLoggedIn && (
            <Route path="/query" element={<NoAccessMessage />} />
          )}
          {!isExplicitlyLoggedIn && (
            <Route path="/report" element={<NoAccessMessage />} />
          )}
        </Routes>
      </div>
    </div>
    // </Router> // This closing tag was also present.
  );
};

const NoAccessMessage = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
    <div className="bg-white p-8 rounded-xl shadow-lg text-center">
      <p className="text-lg text-red-700">Please log in to access this page.</p>
    </div>
  </div>
);

// no mock id displayed
// fix formatting of sign in page
