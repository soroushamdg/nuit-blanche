"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";
import type { MapEvent } from "@/components/Map";

const Map = dynamic(() => import("@/components/Map"), { ssr: false });

const ITINERARY_KEY = "itinerary";
const SHEET_MIN_PCT = 25;
const SHEET_MAX_PCT = 88;
const SHEET_DEFAULT_PCT = 40;

function eventKey(event: MapEvent, index: number): string {
  return `${event.title}-${event.lat}-${event.lng}-${index}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<MapEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
  const [deleteConfirmIndex, setDeleteConfirmIndex] = useState<number | null>(
    null,
  );
  const [sheetHeightPct, setSheetHeightPct] = useState(SHEET_DEFAULT_PCT);
  const dragStartY = useRef(0);
  const dragStartPct = useRef(0);

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      el.setPointerCapture(e.pointerId);
      dragStartY.current = e.clientY;
      dragStartPct.current = sheetHeightPct;

      const onMove = (moveEvent: PointerEvent) => {
        const deltaY = dragStartY.current - moveEvent.clientY;
        const pctPerPx = 0.2;
        const next = dragStartPct.current + deltaY * pctPerPx;
        setSheetHeightPct(
          Math.min(SHEET_MAX_PCT, Math.max(SHEET_MIN_PCT, Math.round(next))),
        );
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        el.releasePointerCapture(e.pointerId);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [sheetHeightPct],
  );

  // Load itinerary from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ITINERARY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as unknown;
        if (Array.isArray(parsed)) {
          setEvents(parsed);
        }
      } else {
        // Add sample events for testing if no data exists
        const sampleEvents: MapEvent[] = [
          {
            title: "Art Installation at Place des Arts",
            description:
              "Interactive light display showcasing Montreal's cultural heritage",
            nearestMetro: "Place-des-Arts",
            address: "175 Saint-Catherine St W, Montreal, QC H2X 1Y9",
            lat: 45.5085,
            lng: -73.5673,
            locationName: "Place des Arts",
          },
          {
            title: "Digital Art Exhibition",
            description: "Contemporary digital artworks from local artists",
            nearestMetro: "Berri-UQAM",
            address: "300 Saint-Catherine St E, Montreal, QC H2W 1A2",
            lat: 45.5152,
            lng: -73.558,
            locationName: "UQAM Art Gallery",
          },
          {
            title: "Night Market Experience",
            description: "Food vendors and artisan crafts under the stars",
            nearestMetro: "Jean-Drapeau",
            address: "1 Circuit Gilles Villeneuve, Montreal, QC H3C 1T9",
            lat: 45.5087,
            lng: -73.522,
            locationName: "Parc Jean-Drapeau",
          },
        ];
        setEvents(sampleEvents);
      }
    } catch {
      // ignore invalid or missing data
    }
  }, []);

  // Persist events to localStorage whenever the array changes
  useEffect(() => {
    localStorage.setItem(ITINERARY_KEY, JSON.stringify(events));
  }, [events]);

  function clearItinerary() {
    localStorage.removeItem(ITINERARY_KEY);
    setEvents([]);
    setExpandedKeys(new Set());
    setDeleteConfirmIndex(null);
  }

  function toggleExpanded(key: string) {
    setExpandedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function openDeleteConfirm(index: number) {
    setDeleteConfirmIndex(index);
  }

  function closeDeleteConfirm() {
    setDeleteConfirmIndex(null);
  }

  function confirmDelete() {
    if (deleteConfirmIndex === null) return;
    setEvents((prev) => prev.filter((_, i) => i !== deleteConfirmIndex));
    setDeleteConfirmIndex(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to extract event");
        return;
      }

      const eventData = data as MapEvent;
      setEvents((prev) => [...prev, eventData]);
      setUrl("");
      console.log("[Itinerary] Item added:", eventData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="relative h-dvh w-full overflow-hidden">
      {/* Full-screen map background */}
      <div className="fixed inset-0 z-0">
        <Map
          key={events.map((e) => `${e.lat},${e.lng}`).join("|")}
          events={events}
        />
      </div>

      {/* Bottom sheet: resizable itinerary */}
      <aside
        className="fixed bottom-0 left-0 right-0 z-30 flex flex-col rounded-t-2xl border-t border-zinc-200 bg-white shadow-[0_-4px_24px_rgba(0,0,0,0.12)] dark:border-zinc-800 dark:bg-zinc-950 dark:shadow-[0_-4px_24px_rgba(0,0,0,0.4)]"
        style={{ height: `${sheetHeightPct}vh` }}
      >
        {/* Resize handle */}
        <div
          role="presentation"
          onPointerDown={handleResizePointerDown}
          className="flex shrink-0 cursor-grab select-none flex-col items-center justify-center py-2 active:cursor-grabbing touch-none"
          aria-label="Drag to resize"
        >
          <span className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-600" />
        </div>
        <div className="flex shrink-0 flex-col border-b border-zinc-200 p-4 dark:border-zinc-800">
          <h1 className="mb-3 text-base font-semibold text-zinc-900 dark:text-zinc-50">
            Nuit Blanche Planner
          </h1>
          <form onSubmit={handleSubmit} className="space-y-2">
            <label htmlFor="event-url" className="sr-only">
              Event URL
            </label>
            <input
              id="event-url"
              type="url"
              placeholder="Paste event URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoading}
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm placeholder-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500"
            />
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="w-full rounded-lg bg-zinc-900 px-3 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {isLoading ? "Extracting…" : "Add event"}
            </button>
          </form>
          {error && (
            <p
              className="mt-2 text-sm text-red-600 dark:text-red-400"
              role="alert"
            >
              {error}
            </p>
          )}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
              Saved events
            </h2>
            <button
              type="button"
              onClick={clearItinerary}
              className="rounded px-2 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-zinc-700 min-[480px]:py-1 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              Clear Itinerary
            </button>
          </div>
          <ul className="space-y-2">
            {events.map((event, index) => {
              const key = eventKey(event, index);
              const isExpanded = expandedKeys.has(key);
              return (
                <li
                  key={key}
                  className="rounded-lg border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="flex items-start gap-2 p-3">
                    <button
                      type="button"
                      onClick={() => toggleExpanded(key)}
                      className="min-w-0 flex-1 text-left"
                      aria-expanded={isExpanded}
                    >
                      <h3 className="font-medium text-zinc-900 dark:text-zinc-100">
                        {event.title}
                      </h3>
                      <span
                        className="mt-1 inline-block text-xs text-zinc-500 dark:text-zinc-400"
                        aria-hidden
                      >
                        {isExpanded ? "▼ Collapse" : "▶ Expand"}
                      </span>
                    </button>
                    <a
                      href={
                        event.address
                          ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                              event.address,
                            )}`
                          : `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="shrink-0 rounded p-2 text-zinc-500 transition-colors hover:bg-zinc-200 hover:text-blue-600 dark:hover:bg-zinc-700 dark:hover:text-blue-400"
                      aria-label="Open in Google Maps"
                      title="Open in Google Maps"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="h-5 w-5"
                        aria-hidden
                      >
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteConfirm(index);
                      }}
                      className="shrink-0 rounded p-2 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-red-600 min-[480px]:p-1 dark:hover:bg-zinc-700 dark:hover:text-red-400"
                      aria-label="Remove event"
                    >
                      ✕
                    </button>
                  </div>
                  {isExpanded && (
                    <div className="border-t border-zinc-200 px-3 pb-3 pt-1 dark:border-zinc-700">
                      {event.imageUrl && (
                        <a
                          href={event.sourceUrl || event.imageUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block overflow-hidden rounded-md"
                        >
                          <img
                            src={event.imageUrl}
                            alt=""
                            className="h-32 w-full object-cover"
                          />
                        </a>
                      )}
                      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {event.description}
                      </p>
                      {event.timeDetails && (
                        <p className="mt-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                          When: {event.timeDetails}
                        </p>
                      )}
                      {event.locationName && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Where: {event.locationName}
                        </p>
                      )}
                      {event.address && (
                        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                          Address: {event.address}
                        </p>
                      )}
                      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                        Métro: {event.nearestMetro}
                      </p>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {deleteConfirmIndex !== null && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-dialog-title"
            >
              <div className="w-full max-w-sm rounded-lg bg-white p-4 shadow-lg sm:p-5 dark:bg-zinc-900">
                <h2
                  id="delete-dialog-title"
                  className="text-lg font-semibold text-zinc-900 dark:text-zinc-100"
                >
                  Remove event?
                </h2>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Are you sure you want to remove this event from your
                  itinerary?
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={closeDeleteConfirm}
                    className="rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={confirmDelete}
                    className="rounded-lg bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
