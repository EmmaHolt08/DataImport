import './App.css';
import QueryForm from './QueryForm.js';
import MapCoords from './MapCoords.js';

export default function App() {
  return (
    <div className="App">
      <header className="App-header">
        <QueryForm />
        <MapCoords />
      </header>
    </div>
  );
}