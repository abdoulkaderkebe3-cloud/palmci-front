import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { 
  LayoutDashboard, BarChart2, Users, History, Settings,
  AlertTriangle, TrendingDown, CheckCircle, Globe,
  Send, RefreshCw, Bell, Download
} from "lucide-react";

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const API = "https://palmci-ndvi-api.onrender.com";

const SITES_MAP = [
  { id: 1, nom: "EHANIA",     lat: 5.282, lon: -3.013 },
  { id: 2, nom: "TOUMANGUIE", lat: 5.367, lon: -3.376 },
  { id: 3, nom: "IROBO",      lat: 5.338, lon: -4.787 },
  { id: 4, nom: "BOUBO",      lat: 5.650, lon: -5.302 },
  { id: 5, nom: "BLIDOUBA",   lat: 4.552, lon: -7.482 },
  { id: 6, nom: "IBOKE",      lat: 4.600, lon: -7.447 },
  { id: 7, nom: "GBAPET",     lat: 4.972, lon: -7.511 },
  { id: 8, nom: "NEKA",       lat: 4.565, lon: -7.512 },
];

const ZONES = {
  1: { label: "Stress sévère",    dose: "DOSE MAX",      color: "#e74c3c" },
  2: { label: "Stress modéré",    dose: "DOSE STANDARD", color: "#f59e0b" },
  3: { label: "Végétation saine", dose: "DOSE RÉDUITE",  color: "#10b981" },
};

const IMAGES_TYPES = [
  { key: "rgb",        label: "RGB",        icon: "🌍", desc: "Vue naturelle" },
  { key: "ndvi",       label: "NDVI",       icon: "🌿", desc: "Zones prescription" },
  { key: "infrarouge", label: "INFRAROUGE", icon: "🔴", desc: "Fausses couleurs" },
];

const ANNEES = ["2023", "2024", "2025"];

function MapFlyTo({ siteActuel }) {
  const map = useMap();
  useEffect(() => {
    if (siteActuel) {
      const site = SITES_MAP.find(s => s.id === siteActuel);
      if (site) map.flyTo([site.lat, site.lon], 12, { duration: 1.5 });
    } else {
      map.flyTo([5.345, -5.0], 7, { duration: 1.5 });
    }
  }, [siteActuel, map]);
  return null;
}

function NdviBar({ value }) {
  const pct = Math.max(0, Math.min(100, (value||0)*100));
  const c = !value ? "#e2e8f0" : value < 0.35 ? "#e74c3c" : value < 0.55 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background:"#f1f5f9", borderRadius:4, height:8, overflow:"hidden", margin:"8px 0" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:4, transition:"width 1.4s ease" }}/>
    </div>
  );
}

export default function PalmciDashboard() {
  const [siteActuel, setSiteActuel] = useState(null);
  const [nomSite, setNomSite] = useState("");
  const [anneeActive, setAnneeActive] = useState("2025");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [erreur, setErreur] = useState(null);
  const [imgActive, setImgActive] = useState("ndvi");
  const cache = useRef({});

  const chargerDonnees = async (siteId, nom, annee) => {
    setSiteActuel(siteId); 
    setNomSite(nom); 
    setErreur(null);
    
    const cacheKey = `${siteId}-${annee}`;
    if (cache.current[cacheKey]) { 
      setData(cache.current[cacheKey]); 
      return; 
    }
    
    setLoading(true); 
    setData({});
    
    try {
      const [resAnalyse, resImages, resPrescription] = await Promise.all([
        fetch(`${API}/api/analyse/${siteId}?annee=${annee}`).then(r=>r.json()),
        fetch(`${API}/api/images/${siteId}?annee=${annee}`).then(r=>r.json()),
        fetch(`${API}/api/prescription/${siteId}?annee=${annee}&age_palmier=10`).then(r=>r.json()),
      ]);
      
      if (resAnalyse.erreur) throw new Error(resAnalyse.erreur);

      const result = { analyse: resAnalyse, images: resImages, prescription: resPrescription };
      cache.current[cacheKey] = result;
      setData(result);
    } catch (err) { 
      setErreur("Erreur lors de la récupération des données."); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => {
    if (siteActuel) {
      chargerDonnees(siteActuel, nomSite, anneeActive);
    }
  }, [anneeActive]);

  const analyse = data.analyse;
  const images = data.images;
  const prescription = data.prescription;

  // KPIs fixes basés sur les données ou statiques pour l'instant
  const surfaceAnalyse = analyse ? Math.round((analyse.zone1_ha||0) + (analyse.zone2_ha||0) + (analyse.zone3_ha||0)) : 44000;
  const zonesCritiques = analyse ? (analyse.zone === 1 ? 1 : 0) : 1;

  const zone = analyse?.zone ?? 2;
  const zoneInfo = ZONES[zone] || ZONES[2];
  const imgUrl = images?.images?.[imgActive];

  return (
    <div className="layout">
      {/* Sidebar (Même design) */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <Globe size={24} color="#a5d6a7" />
          </div>
          <div className="logo-text">
            <h2>PALM-PRÉCISION</h2>
            <p>Viso Studio | PALM CI</p>
          </div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item active"><LayoutDashboard size={18}/> Tableau de bord</div>
          <div className="nav-item"><BarChart2 size={18}/> Analytiques</div>
          <div className="nav-item"><Users size={18}/> Agriculteurs</div>
          <div className="nav-item"><History size={18}/> Historique</div>
          <div className="nav-item"><Settings size={18}/> Paramètres</div>
        </nav>

        <div className="sidebar-footer">
          <div className="api-badge">
            <span>Données GEE</span>
            <span className="status">EN LIGNE</span>
          </div>
          <div className="user-profile">
            <div className="user-avatar">MP</div>
            <div className="user-info">
              <p className="name">Mr Paul</p>
              <p className="role">Administrateur</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title"><h1>Supervision des Unités Agricoles</h1></div>
            <div className="topbar-subtitle">Gestion intelligente des cultures vivrières</div>
          </div>
          <div className="topbar-actions">
            <div className="api-status">
              <div className="api-dot"></div>
              GEE API Connectée
            </div>
            <button className="export-btn">
              <Download size={16} /> Exporter
            </button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="dashboard-body">
          {/* KPIs du nouveau design */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">SURFACE ANALYSÉE <Globe size={16} color="#3b82f6" /></div>
              <div className="kpi-value">{surfaceAnalyse.toLocaleString()} ha</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>+2.5% vs semaine</div>
              <div style={{ height: "3px", background: "#3b82f6", width: "100%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header">ZONES CRITIQUES <AlertTriangle size={16} color="#ef4444" /></div>
              <div className="kpi-value">{zonesCritiques}</div>
              <div className="kpi-sub" style={{ color: "#ef4444" }}>Nécessitent attention</div>
              <div style={{ height: "3px", background: "#ef4444", width: "30%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">ÉCONOMIES D'ENGRAIS <TrendingDown size={16} color="#10b981" /></div>
              <div className="kpi-value">15.4%</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Économies réalisées</div>
              <div style={{ height: "3px", background: "#10b981", width: "80%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">PARCELLES SAINES <CheckCircle size={16} color="#10b981" /></div>
              <div className="kpi-value">17%</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Bonne santé</div>
              <div style={{ height: "3px", background: "#10b981", width: "60%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>
          </div>

          <div className="content-split">
            {/* Left Area (Map Google Earth) */}
            <div className="map-section">
              <div className="map-header">
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>Carte des Sites PALMCI (Google Earth)</div>
                <div style={{ fontSize: "11px", background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: "4px" }}>GEE Connecté</div>
              </div>
              <div className="map-container">
                <MapContainer center={[5.345, -5.0]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  {/* Google Satellite Map Layer */}
                  <TileLayer
                    url="http://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}"
                    attribution="&copy; Google Earth"
                  />
                  {SITES_MAP.map(site => (
                    <CircleMarker 
                      key={site.id} 
                      center={[site.lat, site.lon]} 
                      radius={siteActuel === site.id ? 10 : 6}
                      color={siteActuel === site.id ? "#10b981" : "#fff"}
                      fillColor={siteActuel === site.id ? "#10b981" : "#0e5033"}
                      fillOpacity={1}
                      weight={2}
                      eventHandlers={{ click: () => chargerDonnees(site.id, site.nom, anneeActive) }}
                    >
                      <Popup><strong>{site.nom}</strong></Popup>
                    </CircleMarker>
                  ))}
                  <MapFlyTo siteActuel={siteActuel} />
                </MapContainer>
              </div>
            </div>

            {/* Right Area (Scrollable Control Center with all original data & photos) */}
            <div className="control-section">
              <div className="control-panel scrollable-panel">
                
                {/* Toujours afficher la liste si aucun site sélectionné */}
                {!siteActuel ? (
                  <>
                    <div className="panel-title">Centre de Contrôle</div>
                    <div className="panel-desc">Sélectionnez un site pour charger les données et les photos.</div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "8px", marginTop: "24px" }}>
                      {SITES_MAP.map(site => (
                        <div key={site.id} 
                             className="site-item"
                             onClick={() => chargerDonnees(site.id, site.nom, anneeActive)}>
                          <div>
                            <div className="site-item-name">PALMCI {site.nom}</div>
                            <div className="site-item-sub">Cliquez pour analyser</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Header: Titre du site et sélection de l'année */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px" }}>
                      <div>
                        <div style={{ background: analyse?.zone===1?"#fef2f2":analyse?.zone===2?"#fefce8":"#f0fdf4", 
                                      color: analyse?.zone===1?"#b91c1c":analyse?.zone===2?"#a16207":"#15803d", 
                                      fontSize: "10px", fontWeight: "700", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "8px", textTransform: "uppercase" }}>
                          {analyse?.label || "Sélectionné"}
                        </div>
                        <h2 style={{ margin: 0, fontSize: "18px", color: "#0f172a" }}>PALMCI {nomSite}</h2>
                      </div>
                      
                      <select 
                        value={anneeActive} 
                        onChange={(e) => setAnneeActive(e.target.value)}
                        style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", background: "#f8fafc", fontWeight: "600", outline: "none", cursor: "pointer" }}
                      >
                        {ANNEES.map(a => <option key={a} value={a}>{a}</option>)}
                      </select>
                    </div>

                    {loading ? (
                      <div className="spinner-container" style={{ padding: "60px 0" }}>
                        <div className="spinner"></div>
                        <div style={{ fontSize: "12px", fontWeight: "600", color: "#0e5033" }}>ANALYSE GEE EN COURS...</div>
                      </div>
                    ) : erreur ? (
                      <div style={{ color: "#ef4444", padding: "16px", background: "#fef2f2", borderRadius: "8px" }}>{erreur}</div>
                    ) : analyse ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "20px", animation: "fadeIn 0.4s ease" }}>
                        
                        {/* 1. Diagnostic GEE et Indice NDVI */}
                        <div style={{ display: "flex", gap: "16px" }}>
                          <div className="diag-box" style={{ flex: 1, margin: 0 }}>
                            <div className="diag-title">Diagnostic GEE</div>
                            <div className="diag-value">{(analyse.ndvi_moyen || 0).toFixed(2)}</div>
                            <div style={{ fontSize: "11px", color: "#0369a1", marginTop: "4px" }}>NDVI Moyen</div>
                          </div>
                          
                          <div style={{ flex: 1, border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b" }}>
                              <span>min: <strong style={{color:"#e74c3c"}}>{(analyse.ndvi_min??0).toFixed(2)}</strong></span>
                              <span>max: <strong style={{color:"#10b981"}}>{(analyse.ndvi_max??0).toFixed(2)}</strong></span>
                            </div>
                            <NdviBar value={analyse.ndvi_moyen} />
                            <div style={{ fontSize: "10px", textAlign: "center", color: "#64748b" }}>Spectre Végétatif</div>
                          </div>
                        </div>

                        {/* 2. Photos Satellites depuis le Back */}
                        <div style={{ border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", background: "#f8fafc" }}>
                          <div style={{ fontSize: "12px", fontWeight: "700", color: "#0f172a", marginBottom: "12px", textTransform: "uppercase" }}>
                            Imagerie Spatiale
                          </div>
                          
                          {/* Boutons Photos */}
                          <div style={{ display: "flex", gap: "8px", marginBottom: "12px" }}>
                            {IMAGES_TYPES.map(img => (
                              <button key={img.key} onClick={() => setImgActive(img.key)} style={{
                                flex: 1, 
                                background: imgActive === img.key ? "#0e5033" : "white",
                                border: `1px solid ${imgActive === img.key ? "#0e5033" : "#cbd5e1"}`,
                                color: imgActive === img.key ? "white" : "#475569",
                                borderRadius: "6px", padding: "8px", cursor: "pointer", transition: "all 0.2s"
                              }}>
                                <div style={{ fontSize: "16px", marginBottom: "2px" }}>{img.icon}</div>
                                <div style={{ fontSize: "10px", fontWeight: "700" }}>{img.label}</div>
                              </button>
                            ))}
                          </div>

                          {/* Affichage de la photo */}
                          <div style={{ background: "white", border: "1px solid #e2e8f0", borderRadius: "8px", overflow: "hidden", height: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                            {imgUrl ? (
                              <img src={imgUrl} alt={imgActive} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                            ) : (
                              <div style={{ color: "#64748b", fontSize: "12px", textAlign: "center" }}>
                                <div style={{ fontSize: "24px", marginBottom: "8px" }}>🛰️</div>
                                Photo en cours de traitement...
                              </div>
                            )}
                          </div>
                        </div>

                        {/* 3. Prescription IA & Surfaces */}
                        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                          {prescription && (
                            <div className="presc-box" style={{ flex: 1, minWidth: "200px", margin: 0 }}>
                              <div className="presc-title">Prescription IA</div>
                              <div className="presc-value" style={{ fontSize: "18px" }}>{prescription.prescription?.dose || analyse.dose}</div>
                              <div style={{ fontSize: "11px", color: "#a16207", marginTop: "4px" }}>{prescription.prescription?.type_engrais}</div>
                            </div>
                          )}

                          <div style={{ flex: 1, minWidth: "200px", border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px" }}>
                            <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "12px", textTransform: "uppercase" }}>Répartition</div>
                            {[
                              { z:1, ha: analyse.zone1_ha ?? 0 },
                              { z:2, ha: analyse.zone2_ha ?? 0 },
                              { z:3, ha: analyse.zone3_ha ?? 0 },
                            ].map(({ z, ha }) => {
                              const total = ((analyse.zone1_ha??0)+(analyse.zone2_ha??0)+(analyse.zone3_ha??0)) || 1;
                              const pct = ((ha/total)*100).toFixed(1);
                              return (
                                <div key={z} style={{ marginBottom: "8px" }}>
                                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                    <span style={{ fontSize: "10px", color: "#334155" }}>{ZONES[z].label}</span>
                                    <span style={{ fontSize: "10px", fontWeight: "700", color: ZONES[z].color }}>{pct}%</span>
                                  </div>
                                  <div style={{ background: "#f1f5f9", borderRadius: "4px", height: "4px" }}>
                                    <div style={{ width: `${pct}%`, height: "100%", background: ZONES[z].color, borderRadius: "4px" }}/>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <button className="btn-primary" onClick={() => setSiteActuel(null)}>
                          Retour à la liste des sites
                        </button>

                      </div>
                    ) : null}
                  </>
                )}
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
