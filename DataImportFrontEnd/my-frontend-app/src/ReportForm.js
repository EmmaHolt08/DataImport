import React, { useState, useEffect, useCallback, useMemo, useRef} from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, useMap, useMapEvents, Tooltip} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';


const center = [38.6263, -90.1751]
const zoom = 10

function Profile() {
  return (
    <img
      src="https://i.imgur.com/MK3eW3As.jpg"
      alt="Katherine Johnson"
    />
  );
}

function NewMap() {
  function MapCoords(){ 
    const [map, setMap] = useState('initial')
    const displayMap = useMemo(
    () => (
      <MapContainer
        center={center}
        zoom={zoom}
        scrollWheelZoom={false}
        ref={setMap}
        >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        </MapContainer>
    ),
    [],
  )

  return (
    <div className = "MapContainerWrapper">
      {map ? <DisplayPosition map={map} /> : null} 
      {displayMap}
    </div>
  )
}

function DisplayPosition ({map})
{
    const [position, setPosition] = useState(() => map.target.getCenter()) 

    // const [lat, setLat] = useState(() => map.target.getCenter())
    // const [lon, setLon] = useState(()  => map.target.getCenter())
    const onClick = useCallback(() => {
        map.setView(center, zoom)
    }, [map])

    const onMove = useCallback(() => {
        setPosition(map.target.getCenter())
    }, [map])

    useEffect(() => {
        map.on('move', onMove)
        return () => {
            map.off('move', onMove)
            // setLat(position.lat.toFixed(4))
            // setLon(position.lng.toFixed(4))
        }
    }, [map, onMove])

    return(
     <p>
      latitude: {position.lat.toFixed(4)}, longitude: {position.lng.toFixed(4)}{' '}
     </p>
    )
}
MapCoords()
}

export default NewMap;