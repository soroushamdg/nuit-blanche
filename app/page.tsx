"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import type { MapEvent } from "@/components/Map";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const dummyEvents: MapEvent[] = [
  {
    title: "Luminothérapie – Place des Festivals",
    description:
      "Interactive light installation transforming the square into a luminous landscape.",
    nearestMetro: "Place-des-Arts",
    lat: 45.5088,
    lng: -73.5612,
  },
];

export default function Home() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<MapEvent[]>(dummyEvents);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-zinc-100 dark:bg-zinc-900">
      {/* Sidebar */}
      <aside className="flex w-80 shrink-0 flex-col border-r border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h1 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            Nuit Blanche Planner
          </h1>
          <label htmlFor="event-url" className="sr-only">
            Event URL
          </label>
          <input
            id="event-url"
            type="url"
            placeholder="Paste event URL..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
          />
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="mb-2 text-sm font-medium text-zinc-500 dark:text-zinc-400">
            Saved events
          </h2>
          <ul className="space-y-2">
            {events.map((event, index) => (
              <li
                key={index}
                className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                  {event.title}
                </h3>
                <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  Métro: {event.nearestMetro}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* Map area */}
      <main className="relative min-w-0 flex-1">
        <Map events={events} />
      </main>
    </div>
  );
}
