import React, { useState, useEffect, useCallback, useMemo, useRef} from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, useMap, useMapEvents, Tooltip} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';
import DisplayPosition from './DisplayPosition.js'

const center = [38.6263, -90.1751]
const zoom = 10

function MapContent({ setMapInstance }) {
  const map = useMap(); 
  useEffect(() => {
    setMapInstance(map); 
  }, [map, setMapInstance]);

  return null;
}

export default function MapCoords(){ 
       //const [map, setMap] = useState('initial')
    const [map, setMap] = useState(new Map());
      const displayMap = useMemo(
      () => (
          <MapContainer
          center={center}
          zoom={zoom}
          scrollWheelZoom={false}
          //ref={setMap}
          style={{ height: '500px', width: '100%' }}
          >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
           <MapContent setMapInstance={setMap} />
          </MapContainer>
        ),
      [],
    )

    return (
      <div className = "MapContainerWrapper">
        {map ? <DisplayPosition map={map} /> : null}
        {/* so if you get the error with getCenter, comment out line 42, save, then uncomment and save again */}
        {displayMap}
      </div>
    )
  }

  //take lon & lat as variables and store it in the form
  // want in form: 
  // type (drop down)
  // source (drop down)
  // impact (drop down)
  // wea13 type (drop down)
  // lon and lat from point on map (user clicks point, returns as WKT string in lon and lat, then
  // converted to geometry coords)
  // is assigned an id/wea13id in numerical order (starting at 100090, last in db is 10089)