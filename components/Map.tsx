"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, Polyline } from "react-leaflet";
import L from "leaflet";

// Fix for default marker icons in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const MONTREAL_CENTER: [number, number] = [45.5017, -73.5673];
const DEFAULT_ZOOM = 12;

const OSM_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

function createMarkerIcon() {
  return L.divIcon({
    html: `<div style="background-color: #3B82F6; width: 20px; height: 20px; border-radius: 50% 50% 50% 0; transform: rotate(-45deg); border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 20],
    className: "custom-marker"
  });
}

export interface MapEvent {
  title: string;
  description: string;
  nearestMetro: string;
  address?: string;
  lat: number;
  lng: number;
  imageUrl?: string;
  timeDetails?: string;
  locationName?: string;
  sourceUrl?: string;
}

interface MapProps {
  events: MapEvent[];
}

export default function Map({ events }: MapProps) {
  console.log("Map component received events:", events.length, events);
  const positions = events.length > 1
    ? events.map((event) => [event.lat, event.lng] as [number, number])
    : [];

  return (
    <MapContainer
      center={MONTREAL_CENTER}
      zoom={DEFAULT_ZOOM}
      scrollWheelZoom={true}
      className="h-full min-h-[280px] w-full sm:min-h-[400px]"
    >
      <TileLayer attribution={OSM_ATTRIBUTION} url={OSM_URL} />
      {positions.length > 0 && (
        <Polyline
          positions={positions}
          pathOptions={{ color: "blue", dashArray: "10, 10" }}
        />
      )}
      {events.map((event, index) => {
        console.log(`Rendering marker for ${event.title} at [${event.lat}, ${event.lng}]`);
        return (
          <Marker
            key={`${event.lat}-${event.lng}-${event.title}-${index}`}
            position={[event.lat, event.lng]}
            icon={createMarkerIcon()}
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
        );
      })}
    </MapContainer>
  );
}
