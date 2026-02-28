"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

const MONTREAL_CENTER: [number, number] = [45.5017, -73.5673];
const DEFAULT_ZOOM = 12;

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// Fix default marker icon in Next.js (otherwise icons can be broken)
const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export interface MapEvent {
  title: string;
  description: string;
  nearestMetro: string;
  lat: number;
  lng: number;
}

interface MapProps {
  events: MapEvent[];
}

export default function Map({ events }: MapProps) {
  return (
    <MapContainer
      center={MONTREAL_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full w-full min-h-[400px]"
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
      {events.map((event, index) => (
        <Marker
          key={index}
          position={[event.lat, event.lng]}
          icon={defaultIcon}
        >
          <Popup>
            <div className="text-sm">
              <h3 className="font-semibold">{event.title}</h3>
              <p className="mt-1 text-zinc-600">{event.description}</p>
              <p className="mt-1 text-zinc-500">
                Métro: {event.nearestMetro}
              </p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
