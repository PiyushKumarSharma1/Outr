import { useEffect, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import type { Map as MapLibreMap } from 'maplibre-gl';
import mapWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import type { Lead } from '../types';

maplibregl.setWorkerUrl(mapWorkerUrl);

export function LeadMap({ leads, selectedId, onSelect }: { leads:Lead[]; selectedId?:string; onSelect:(lead:Lead)=>void }) {
  const container = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    if (!container.current || mapRef.current) return;
    const map = new maplibregl.Map({
      container: container.current,
      center: [-97, 38],
      zoom: 3.2,
      attributionControl: false,
      style: {
        version: 8,
        sources: { osm: { type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256, attribution:'© OpenStreetMap contributors' } },
        layers: [{ id:'osm', type:'raster', source:'osm', paint:{ 'raster-saturation':-0.72, 'raster-brightness-max':0.92, 'raster-contrast':-0.08 } }],
      },
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass:false }), 'bottom-right');
    map.addControl(new maplibregl.AttributionControl({ compact:true }), 'bottom-left');
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;
    markers.current.forEach(marker => marker.remove());
    markers.current = leads.map(lead => {
      const element = document.createElement('button');
      element.className = `map-pin ${lead.score >= 90 ? 'is-high' : lead.score >= 75 ? 'is-warm' : 'is-watch'} ${lead.id === selectedId ? 'is-selected' : ''}`;
      element.type = 'button';
      element.setAttribute('aria-label', `${lead.name} at ${lead.company}, score ${lead.score}`);
      const label = document.createElement('span');
      label.textContent = String(lead.score);
      element.append(label);
      element.addEventListener('click', () => onSelect(lead));
      return new maplibregl.Marker({ element }).setLngLat([lead.longitude, lead.latitude]).addTo(mapRef.current!);
    });
  }, [leads, onSelect, selectedId]);

  return <div className="map-shell"><div ref={container} className="map-canvas"/><div className="map-key"><span><i className="key-high"/>90+ fit</span><span><i className="key-warm"/>75–89</span></div></div>;
}
