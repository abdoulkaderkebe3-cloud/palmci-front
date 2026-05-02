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

  const surfaceAnalyse = analyse ? Math.round((analyse.zone1_ha||0) + (analyse.zone2_ha||0) + (analyse.zone3_ha||0)) : 44000;
  const zonesCritiques = analyse ? (analyse.zone === 1 ? 1 : 0) : 1;

  const zone = analyse?.zone ?? 2;
  const zoneInfo = ZONES[zone] || ZONES[2];
  const imgUrl = images?.images?.[imgActive];

  return (
    <div className="layout">
      {/* Sidebar */}
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
          {/* KPIs */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <div className="kpi-header">SURFACE ANALYSÉE <Globe size={16} color="#3b82f6" /></div>
              <div className="kpi-value">{surfaceAnalyse.toLocaleString()} ha</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>+2.5% vs semaine</div>
              <div style={{ height: "3px", background: "#3b82f6", width: "100%", marginTop: "12px" }}></div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header">ZONES CRITIQUES <AlertTriangle size={16} color="#ef4444" /></div>
              <div className="kpi-value">{zonesCritiques}</div>
              <div className="kpi-sub" style={{ color: "#ef4444" }}>Nécessitent attention</div>
              <div style={{ height: "3px", background: "#ef4444", width: "30%", marginTop: "12px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">ÉCONOMIES D'ENGRAIS <TrendingDown size={16} color="#10b981" /></div>
              <div className="kpi-value">15.4%</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Économies réalisées</div>
              <div style={{ height: "3px", background: "#10b981", width: "80%", marginTop: "12px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">PARCELLES SAINES <CheckCircle size={16} color="#10b981" /></div>
              <div className="kpi-value">17%</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Bonne santé</div>
              <div style={{ height: "3px", background: "#10b981", width: "60%", marginTop: "12px" }}></div>
            </div>
          </div>

          {/* Map & Site Selection Area */}
          <div style={{ display: "flex", gap: "24px" }}>
            {/* Map (Takes 1/3) */}
            <div className="map-section" style={{ flex: 1, minHeight: "450px" }}>
              <div className="map-header">
                <div style={{ fontWeight: 600, fontSize: "14px", color: "#0f172a" }}>Carte des Sites PALMCI</div>
                <div style={{ fontSize: "11px", background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: "4px" }}>GEE Connecté</div>
              </div>
              <div className="map-container" style={{ height: "350px" }}>
                <MapContainer center={[5.345, -5.0]} zoom={7} style={{ height: "100%", width: "100%" }} zoomControl={false}>
                  <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    attribution="Tiles &copy; Esri"
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

            {/* List of Sites (Takes 2/3 but acts as side nav) */}
            <div className="sites-list-container" style={{ flex: 1, maxHeight: "450px" }}>
              <div className="sites-list-header">Sélectionnez un site pour charger les données</div>
              <div className="sites-list" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", padding: "16px" }}>
                {SITES_MAP.map(site => (
                  <div key={site.id} 
                       className={`site-item ${siteActuel === site.id ? 'active' : ''}`}
                       style={{ margin: 0 }}
                       onClick={() => chargerDonnees(site.id, site.nom, anneeActive)}>
                    <div>
                      <div className="site-item-name">{site.nom}</div>
                      <div className="site-item-sub">Cliquez pour analyser</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed Rapport Area (Appears when site is selected) */}
          {siteActuel && (
            <div style={{ background: "white", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "24px", marginTop: "8px", animation: "fadeIn 0.5s ease" }}>
              
              {/* Header of Rapport (Title + Years) */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #f1f5f9", paddingBottom: "16px", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: "20px", color: "#0f172a" }}>Analyse Détaillée : PALMCI {nomSite}</h2>
                  <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#64748b" }}>Données générées par Sentinel-2 via Google Earth Engine</p>
                </div>
                
                {/* Sélecteur d'année */}
                <div style={{ display: "flex", gap: "8px" }}>
                  {ANNEES.map(annee => (
                    <button key={annee} onClick={() => setAnneeActive(annee)} style={{
                      background: anneeActive === annee ? "#0e5033" : "#f8fafc",
                      border: `1px solid ${anneeActive === annee ? "#0e5033" : "#e2e8f0"}`,
                      color: anneeActive === annee ? "white" : "#475569",
                      padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer", transition: "all 0.2s"
                    }}>
                      {annee}
                    </button>
                  ))}
                </div>
              </div>

              {loading ? (
                <div className="spinner-container" style={{ padding: "80px 0" }}>
                  <div className="spinner"></div>
                  <div style={{ fontSize: "13px", fontWeight: "600", color: "#0e5033" }}>ANALYSE GEE EN COURS...</div>
                </div>
              ) : erreur ? (
                <div style={{ color: "#ef4444", padding: "16px", background: "#fef2f2", borderRadius: "8px" }}>{erreur}</div>
              ) : analyse ? (
                <div style={{ display: "flex", gap: "32px" }}>
                  
                  {/* Colonne de Gauche : Statistiques */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    
                    {/* Zone Dominante */}
                    <div style={{ background: `${zoneInfo.color}15`, borderLeft: `4px solid ${zoneInfo.color}`, padding: "16px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: zoneInfo.color, textTransform: "uppercase", marginBottom: "4px" }}>ZONE DOMINANTE</div>
                      <div style={{ fontSize: "18px", fontWeight: "800", color: "#0f172a" }}>Zone {zone} — {zoneInfo.label}</div>
                      <div style={{ fontSize: "13px", color: zoneInfo.color, fontWeight: "600", marginTop: "4px" }}>→ {analyse.action || "Action recommandée"}</div>
                    </div>

                    {/* Indice NDVI */}
                    <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "8px", textTransform: "uppercase" }}>Indice NDVI</div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                        <span style={{ fontSize: "32px", fontWeight: "800", color: zoneInfo.color, lineHeight: 1 }}>
                          {(analyse.ndvi_moyen ?? 0).toFixed(4)}
                        </span>
                        <div style={{ fontSize: "11px", color: "#64748b", textAlign: "right" }}>
                          <div>min <span style={{ color: "#e74c3c", fontWeight: "600" }}>{(analyse.ndvi_min??0).toFixed(4)}</span></div>
                          <div>max <span style={{ color: "#10b981", fontWeight: "600" }}>{(analyse.ndvi_max??0).toFixed(4)}</span></div>
                        </div>
                      </div>
                      <NdviBar value={analyse.ndvi_moyen} />
                    </div>

                    {/* Surfaces par zone */}
                    <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "16px", textTransform: "uppercase" }}>Répartition des surfaces</div>
                      {[
                        { z:1, ha: analyse.zone1_ha ?? 0 },
                        { z:2, ha: analyse.zone2_ha ?? 0 },
                        { z:3, ha: analyse.zone3_ha ?? 0 },
                      ].map(({ z, ha }) => {
                        const total = ((analyse.zone1_ha??0)+(analyse.zone2_ha??0)+(analyse.zone3_ha??0)) || 1;
                        const pct = ((ha/total)*100).toFixed(1);
                        return (
                          <div key={z} style={{ marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <span style={{ fontSize: "12px", fontWeight: "600", color: "#334155" }}>{ZONES[z].label}</span>
                              <span style={{ fontSize: "12px", fontWeight: "700", color: ZONES[z].color }}>{Number(ha).toFixed(0)} ha ({pct}%)</span>
                            </div>
                            <div style={{ background: "#f1f5f9", borderRadius: "4px", height: "6px" }}>
                              <div style={{ width: `${pct}%`, height: "100%", background: ZONES[z].color, borderRadius: "4px" }}/>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Prescription Engrais */}
                    {prescription && (
                      <div style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "8px", background: "#f8fafc" }}>
                        <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", marginBottom: "12px", textTransform: "uppercase" }}>Prescription Engrais IA</div>
                        {[
                          { label: "Type engrais", value: prescription.prescription?.type_engrais },
                          { label: "Dose recommandée", value: prescription.prescription?.dose },
                          { label: "Âge palmier", value: prescription.prescription?.age_palmier ? `${prescription.prescription.age_palmier} ans` : "—" },
                        ].map(({ label, value }) => (
                          <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", fontSize: "13px" }}>
                            <span style={{ color: "#64748b" }}>{label}</span>
                            <span style={{ color: "#0f172a", fontWeight: "700" }}>{value||"—"}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Colonne de Droite : Images Satellites */}
                  <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: "#64748b", textTransform: "uppercase" }}>Cartographie Spatiale</div>
                    
                    {/* Boutons de sélection d'image */}
                    <div style={{ display: "flex", gap: "8px" }}>
                      {IMAGES_TYPES.map(img => (
                        <button key={img.key} onClick={() => setImgActive(img.key)} style={{
                          flex: 1, 
                          background: imgActive === img.key ? "#0e5033" : "#f8fafc",
                          border: `1px solid ${imgActive === img.key ? "#0e5033" : "#e2e8f0"}`,
                          color: imgActive === img.key ? "white" : "#475569",
                          borderRadius: "8px", padding: "12px", cursor: "pointer", transition: "all 0.2s"
                        }}>
                          <div style={{ fontSize: "20px", marginBottom: "4px" }}>{img.icon}</div>
                          <div style={{ fontSize: "12px", fontWeight: "700" }}>{img.label}</div>
                          <div style={{ fontSize: "10px", opacity: 0.8 }}>{img.desc}</div>
                        </button>
                      ))}
                    </div>

                    {/* Affichage de l'image */}
                    <div style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "12px", overflow: "hidden", flex: 1, minHeight: "350px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {imgUrl ? (
                        <img src={imgUrl} alt={imgActive} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}/>
                      ) : (
                        <div style={{ color: "#64748b", fontSize: "13px", textAlign: "center" }}>
                          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛰️</div>
                          Image non disponible
                        </div>
                      )}
                    </div>
                    
                    {/* Infos supplémentaires */}
                    <div style={{ background: "#f8fafc", padding: "12px", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                      {[
                        { label: "Source des données", value: "Sentinel-2 SR" },
                        { label: "Images analysées", value: `${analyse.nb_images??"—"} scènes fusionnées` },
                        { label: "Période", value: analyse.periode??"N/A" },
                        { label: "Résolution spatiale", value: "10m × 10m par pixel" },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "12px" }}>
                          <span style={{ color: "#64748b" }}>{label}</span>
                          <span style={{ color: "#0f172a", fontWeight: "600" }}>{value}</span>
                        </div>
                      ))}
                    </div>

                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
