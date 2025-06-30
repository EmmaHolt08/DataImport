import React, {useState, useEffect, useCallback, useMemo} from 'react'
//import 'react'
import { MapContainer, TileLayer} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';


const center = [38.6263, -90.1751]
const zoom = 10


function DisplayPosition ({map})
{
    const [position, setPosition] = useState(() => map.getCenter()) 

    const [lat, setLat] = useState(() => map.getCenter())
    const [lon, setLon] = useState(() => map.getCenter())

    const onMove = useCallback(() => {
        setPosition(map.getCenter())
    }, [map])

    useEffect(() => {
        map.on('move', onMove)
        return () => {
            map.off('move', onMove)
            setLat(position.lat.toFixed(4))
            setLon(position.lng.toFixed(4))
        }
    }, [map, onMove])

    return(
     <p>
      latitude: {position.lat.toFixed(4)}, longitude: {position.lng.toFixed(4)}{' '}
     </p>
    )
}

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

export default MapCoords;