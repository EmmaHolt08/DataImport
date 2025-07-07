import './App.css';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import QueryForm from './QueryForm.js';
import MapCoords from './MapCoords.js';
import ReportForm from './ReportForm.js';


// figure out the report data/why its not showing up o the backend all the time ?
// fix sizing
export default function App() {
  return (
    <Router>
    <div className="App">
      <nav className="navbar">
        <ul className="nav-list">
          <li className="nav-item">
            <Link to= "/" className="nav-list">Home</Link>
          </li>
          <li className="nav-item">
            <Link to="/query" className="nav-list">Query</Link>
          </li>
          <li>
            <Link to="/report" className="nav-list">Report</Link>
          </li>
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
    </Router>
  );
}