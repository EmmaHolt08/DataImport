import React, { useState, useEffect, useCallback, useMemo, useRef} from 'react'
import { MapContainer, TileLayer, Marker, Popup, LayersControl, LayerGroup, useMap, useMapEvents, Tooltip} from 'react-leaflet'
import 'leaflet/dist/leaflet.css';


const center = [38.6263, -90.1751]
const zoom = 10

export default function NewMap() {

  
  return ( <p> "hello" </p>
    // <p>     
    //   latitude: {position.lat.toFixed(4)}, longitude: {position.lng.toFixed(4)}{' '}
    // </p>
    // <MapContainer center={[center]} zoom={zoom} scrollWheelZoom={false}>
    //     <TileLayer
    //         attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    //         url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
    //     />
    // </MapContainer>
  )
}

// function MapApp() {
//   return (
//      <div className="MapContainerWrapper">
//        <MapContainer center={[center]} zoom={zoom} scrollWheelZoom={false}>
//         <TileLayer
//             attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
//             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//         />
//         </MapContainer>
//     </div>
//   );
// }

//export default MapApp;