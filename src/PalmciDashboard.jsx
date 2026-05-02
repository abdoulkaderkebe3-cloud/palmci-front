import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { 
  LayoutDashboard, BarChart2, Users, History, Settings,
  AlertTriangle, TrendingDown, CheckCircle, Globe,
  Send, Download, Map as MapIcon
} from "lucide-react";

import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import MobileApp from './MobileApp';

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
      map.flyTo([7.54, -5.55], 6, { duration: 1.5 });
    }
  }, [siteActuel, map]);
  return null;
}

function NdviBar({ value }) {
  const pct = Math.max(0, Math.min(100, (value||0)*100));
  const c = !value ? "#e2e8f0" : value < 0.35 ? "#e74c3c" : value < 0.55 ? "#f59e0b" : "#10b981";
  return (
    <div style={{ background:"#f1f5f9", borderRadius:6, height:10, overflow:"hidden", margin:"8px 0" }}>
      <div style={{ width:`${pct}%`, height:"100%", background:c, borderRadius:6, transition:"width 1.4s ease" }}/>
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
  const [showMobileApp, setShowMobileApp] = useState(false);
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
    if (siteActuel) chargerDonnees(siteActuel, nomSite, anneeActive);
  }, [anneeActive]);

  const exporterDonnees = () => {
    if (!data.analyse) return alert("Veuillez sélectionner un site.");
    const rapport = { site: nomSite, annee: anneeActive, analyse: data.analyse, prescription: data.prescription?.prescription };
    const blob = new Blob([JSON.stringify(rapport, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `Rapport_PALMCI_${nomSite}_${anneeActive}.json`;
    a.click();
  };

  const envoyerApp = () => {
    setShowMobileApp(true);
  };

  const analyse = data.analyse;
  const images = data.images;
  const prescription = data.prescription;

  let surfaceA = 44000, zonesC = "8 sites", parcellesS = "17%";
  let infosGee = {
    images: "—",
    resolution: "10m × 10m",
    source: "Sentinel-2 SR",
    periode: "—"
  };

  if (analyse) {
    surfaceA = Math.round((analyse.zone1_ha||0) + (analyse.zone2_ha||0) + (analyse.zone3_ha||0));
    zonesC = Math.round(analyse.zone1_ha || 0) + " ha";
    parcellesS = (surfaceA > 0 ? ((analyse.zone3_ha || 0) / surfaceA * 100) : 0).toFixed(1) + "%";
    
    infosGee = {
      images: analyse.nb_images || "—",
      resolution: "10m × 10m",
      source: "Sentinel-2 SR",
      periode: analyse.periode || "N/A"
    };
  }

  const zone = analyse?.zone ?? 2;
  const zoneInfo = ZONES[zone] || ZONES[2];
  const imgUrl = images?.images?.[imgActive];

  if (showMobileApp) {
    return <MobileApp nomSite={nomSite} onBack={() => setShowMobileApp(false)} />;
  }

  return (
    <div className="layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo"><Globe size={24} color="#a5d6a7" /></div>
          <div className="logo-text"><h2>PALM-PRÉCISION</h2><p>Viso Studio | PALM CI</p></div>
        </div>
        
        <nav className="sidebar-nav">
          <div className="nav-item active"><LayoutDashboard size={18}/> Tableau de bord</div>
        </nav>

        <div className="sidebar-footer">
          <div className="api-badge"><span>Moteur d'IA</span><span className="status">ACTIF</span></div>
          <div className="user-profile">
            <div className="user-avatar">MP</div>
            <div className="user-info"><p className="name">Mr Paul</p><p className="role">Agronome Principal</p></div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Topbar */}
        <header className="topbar">
          <div>
            <div className="topbar-title"><h1>Supervision des Unités Agricoles</h1></div>
            <div className="topbar-subtitle">Gestion intelligente des cultures vivrières et suivi NDVI</div>
          </div>
          <div className="topbar-actions">
            <div className="api-status"><div className="api-dot"/> GEE API Connectée</div>
            <button className="export-btn" onClick={exporterDonnees}><Download size={16} /> Exporter Rapport</button>
          </div>
        </header>

        {/* Dashboard Body */}
        <div className="dashboard-body">
          {/* KPIs Dynamiques */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">SURFACE ANALYSÉE <Globe size={16} color="#3b82f6" /></div>
              <div className="kpi-value">{surfaceA.toLocaleString()} ha</div>
              <div className="kpi-sub" style={{ color: "#3b82f6" }}>{siteActuel ? `Pour ${nomSite}` : "Total estimé"}</div>
              <div style={{ height: "3px", background: "#3b82f6", width: "100%", marginTop: "12px", borderRadius: "2px" }}/>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header">STRESS SÉVÈRE (ZONE 1) <AlertTriangle size={16} color="#ef4444" /></div>
              <div className="kpi-value">{zonesC}</div>
              <div className="kpi-sub" style={{ color: "#ef4444" }}>Nécessitent une intervention</div>
              <div style={{ height: "3px", background: "#ef4444", width: "30%", marginTop: "12px", borderRadius: "2px" }}/>
            </div>

            <div className="kpi-card" style={{ paddingBottom: "12px" }}>
              <div className="kpi-header">INFORMATIONS GEE <MapIcon size={16} color="#6366f1" /></div>
              <div style={{ fontSize: "12px", color: "#475569", marginTop: "8px", display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Images analysées:</span> <strong style={{color:"#0f172a"}}>{infosGee.images}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Résolution:</span> <strong style={{color:"#0f172a"}}>{infosGee.resolution}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Source:</span> <strong style={{color:"#0f172a"}}>{infosGee.source}</strong></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Date:</span> <strong style={{color:"#0f172a"}}>{infosGee.periode}</strong></div>
              </div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">PARCELLES SAINES <CheckCircle size={16} color="#10b981" /></div>
              <div className="kpi-value">{parcellesS}</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Végétation optimale (Zone 3)</div>
              <div style={{ height: "3px", background: "#10b981", width: "60%", marginTop: "12px", borderRadius: "2px" }}/>
            </div>
          </div>

          <div className="content-split" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            
            {/* Map (Prend toute la largeur si pas de site, sinon reste grande) */}
            <div className="map-section" style={{ height: siteActuel ? "350px" : "500px", flex: "none" }}>
              <div className="map-header">
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>Cartographie Google Earth Hybride</div>
                {!siteActuel && <div style={{ fontSize: "12px", color: "#64748b" }}>Sélectionnez un marqueur pour afficher l'analyse détaillée ci-dessous.</div>}
              </div>
              <div className="map-container" style={{ height: "100%" }}>
                <MapContainer center={[7.54, -5.55]} zoom={6} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer url="http://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" attribution="&copy; Google Earth"/>
                  {SITES_MAP.map(site => (
                    <CircleMarker 
                      key={site.id} center={[site.lat, site.lon]} radius={siteActuel === site.id ? 10 : 6}
                      color={siteActuel === site.id ? "#10b981" : "#fff"} fillColor={siteActuel === site.id ? "#10b981" : "#0e5033"} fillOpacity={1} weight={2}
                      eventHandlers={{ click: () => chargerDonnees(site.id, site.nom, anneeActive) }}>
                      <Popup><strong>{site.nom}</strong></Popup>
                    </CircleMarker>
                  ))}
                  <MapFlyTo siteActuel={siteActuel} />
                </MapContainer>
              </div>
            </div>

            {/* RAPPORT DETAILLE (Apparaît en bas quand un site est sélectionné, exactement comme le 1er dashboard) */}
            {siteActuel && (
              <div style={{ background: "white", padding: "24px", borderRadius: "12px", border: "1px solid #e2e8f0", animation: "fadeIn 0.5s ease" }}>
                
                {/* Header Rapport */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Analyse Détaillée : PALMCI {nomSite}</h2>
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Supervision satellite et recommandations agronomiques</p>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    {ANNEES.map(annee => (
                      <button key={annee} onClick={() => setAnneeActive(annee)} style={{
                        background: anneeActive === annee ? "#0e5033" : "#f8fafc",
                        border: `1px solid ${anneeActive === annee ? "#0e5033" : "#cbd5e1"}`,
                        color: anneeActive === annee ? "white" : "#475569",
                        padding: "8px 20px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", transition: "all 0.2s"
                      }}>{annee}</button>
                    ))}
                  </div>
                </div>

                {loading ? (
                  <div className="spinner-container" style={{ padding: "80px 0" }}><div className="spinner"/><div style={{ fontSize: "13px", fontWeight: "600", color: "#0e5033" }}>ANALYSE GEE EN COURS...</div></div>
                ) : erreur ? (
                  <div style={{ color: "#ef4444", padding: "16px", background: "#fef2f2", borderRadius: "8px" }}>{erreur}</div>
                ) : analyse ? (
                  <div style={{ display: "flex", gap: "32px", flexWrap: "wrap" }}>
                    
                    {/* COLONNE GAUCHE (Les 5 boîtes de stats du 1er dashboard) */}
                    <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* 1. ZONE DOMINANTE */}
                      <div style={{ background: `${zoneInfo.color}15`, borderLeft: `4px solid ${zoneInfo.color}`, padding: "16px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: zoneInfo.color, textTransform: "uppercase", marginBottom: "4px", letterSpacing: "1px" }}>ZONE DOMINANTE</div>
                        <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Zone {zone} — {zoneInfo.label}</div>
                        <div style={{ fontSize: "13px", color: zoneInfo.color, fontWeight: "600", marginTop: "4px" }}>→ {analyse.action || "Action recommandée"}</div>
                      </div>

                      {/* 2. INDICE NDVI */}
                      <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0e5033", marginBottom: "8px", textTransform: "uppercase", letterSpacing: "1px" }}>INDICE NDVI</div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                          <span style={{ fontSize: "36px", fontWeight: "800", color: zoneInfo.color, lineHeight: 1 }}>
                            {(analyse.ndvi_moyen ?? 0).toFixed(4)}
                          </span>
                          <div style={{ fontSize: "11px", color: "#64748b", textAlign: "right" }}>
                            <div>min <span style={{ color: "#ef4444", fontWeight: "700" }}>{(analyse.ndvi_min??0).toFixed(4)}</span></div>
                            <div>max <span style={{ color: "#10b981", fontWeight: "700" }}>{(analyse.ndvi_max??0).toFixed(4)}</span></div>
                          </div>
                        </div>
                        <NdviBar value={analyse.ndvi_moyen} />
                      </div>

                      {/* 3. SURFACES ET PRESCRIPTIONS PAR ZONE */}
                      <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0e5033", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>SURFACES ET DOSES PAR ZONE</div>
                        {[
                          { z:1, ha: analyse.zone1_ha ?? 0 },
                          { z:2, ha: analyse.zone2_ha ?? 0 },
                          { z:3, ha: analyse.zone3_ha ?? 0 },
                        ].map(({ z, ha }) => {
                          const total = ((analyse.zone1_ha??0)+(analyse.zone2_ha??0)+(analyse.zone3_ha??0)) || 1;
                          const pct = ((ha/total)*100).toFixed(1);
                          return (
                            <div key={z} style={{ marginBottom: "14px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                                <span style={{ fontSize: "12px", fontWeight: "600", color: ZONES[z].color }}>Zone {z} — {ZONES[z].label}</span>
                                <span style={{ fontSize: "12px", fontWeight: "800", color: ZONES[z].color }}>{Number(ha).toFixed(0)} ha ({pct}%)</span>
                              </div>
                              <div style={{ fontSize: "11px", color: "#475569", marginBottom: "6px", fontWeight: "500" }}>
                                Quantité prescrite : <strong style={{ color: ZONES[z].color }}>{ZONES[z].dose}</strong>
                              </div>
                              <div style={{ background: "#e2e8f0", borderRadius: "6px", height: "8px" }}>
                                <div style={{ width: `${pct}%`, height: "100%", background: ZONES[z].color, borderRadius: "6px" }}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* 4. PRESCRIPTION ENGRAIS */}
                      {prescription && (
                        <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: "16px", borderRadius: "8px" }}>
                          <div style={{ fontSize: "11px", fontWeight: "700", color: "#0e5033", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "1px" }}>PRESCRIPTION ENGRAIS</div>
                          {[
                            { label: "Type engrais", value: prescription.prescription?.type_engrais },
                            { label: "Dose recommandée", value: prescription.prescription?.dose || analyse.dose }
                          ].map(({ label, value }) => (
                            <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                              <span style={{ color: "#64748b", fontWeight: "500" }}>{label}</span>
                              <span style={{ color: "#0f172a", fontWeight: "800" }}>{value||"—"}</span>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>

                    {/* COLONNE DROITE (Images Satellites du 1er dashboard) */}
                    <div style={{ flex: 1, minWidth: "300px", display: "flex", flexDirection: "column", gap: "16px" }}>
                      
                      {/* 6. IMAGES SATELLITES */}
                      <div style={{ border: "1px solid #e2e8f0", background: "#f8fafc", padding: "20px", borderRadius: "8px", flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#0e5033", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "1px" }}>
                          IMAGES SATELLITES GEE
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px", marginBottom: "16px" }}>
                          {IMAGES_TYPES.map(img => (
                            <button key={img.key} onClick={() => setImgActive(img.key)} style={{
                              flex: 1, background: imgActive === img.key ? "#0e5033" : "white",
                              border: `1px solid ${imgActive === img.key ? "#0e5033" : "#cbd5e1"}`,
                              color: imgActive === img.key ? "white" : "#475569",
                              borderRadius: "8px", padding: "12px 8px", cursor: "pointer", transition: "all 0.2s"
                            }}>
                              <div style={{ fontSize: "20px", marginBottom: "4px" }}>{img.icon}</div>
                              <div style={{ fontSize: "11px", fontWeight: "800", letterSpacing: "0.5px" }}>{img.label}</div>
                              <div style={{ fontSize: "10px", opacity: 0.8, marginTop: "2px" }}>{img.desc}</div>
                            </button>
                          ))}
                        </div>

                        <div style={{ background: "white", border: "1px solid #cbd5e1", borderRadius: "8px", overflow: "hidden", flex: 1, minHeight: "400px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          {imgUrl ? (
                            <img src={imgUrl} alt={imgActive} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                          ) : (
                            <div style={{ color: "#64748b", fontSize: "14px", textAlign: "center" }}>
                              <div style={{ fontSize: "36px", marginBottom: "12px" }}>🛰️</div>
                              Image en cours de génération...
                            </div>
                          )}
                        </div>

                        <div style={{ textAlign: "center", marginTop: "16px" }}>
                          <button className="btn-primary" onClick={envoyerApp} style={{ padding: "16px", fontSize: "15px", width: "100%" }}>
                            <Send size={18} /> Envoyer positions aux Agriculteurs
                          </button>
                        </div>

                      </div>
                    </div>

                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
