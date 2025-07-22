import './App.css';
import React, { useContext } from 'react' 
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QueryForm from './QueryForm.js';
import MapCoords from './MapCoords.js';
import ReportForm from './ReportForm.js';
import AuthPage, { AuthContext } from './AuthPage.js'; 

//PROBLEMS (not crashing/no errors though, just logic/execution)
// when sign up or sign in, userid isnt being displayed in report form
// when reload, the page logs you out? (i had this issue before and i cannot remember how i fixed it)
// there is a front end warning but i dont think i care about it

//COMPLETED MONDAY (because i forgot where i left off friday)
// linked sing up to user db
// fixed a ton of errors with that (mostly i can't name correctly)
// remembered to push it up

//TO DO
// fix problems
// test the lower() functionality
// hash password (probably includes removing the test123 user)


export default function App() {
  return (
    <Router>
      <AuthPage>
        <AppContent/>
      </AuthPage>
    </Router>
  )
}

const AppContent = () => {
  const { user, handleSignOut, isLoadingAuth } = useContext(AuthContext); 

  const isAuthenticated = !!user; 

  if (isLoadingAuth) {
    return (
      <div className="app-loading">
        <p>Initializing application...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="App">
      <h1 className="header"> Landslides </h1>
      <nav className="navbar">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to="/" className="nav-list">Home</Link>
          </li>
          {isAuthenticated && (
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
                Logged in as: {user.username} 
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
          <Route path="/query" element={<QueryForm/>} />
          <Route path="/report" element={<ReportForm/>} />
        </Routes>
      </div>
    </div>
  );
};