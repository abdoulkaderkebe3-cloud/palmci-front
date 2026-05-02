import React, { useState, useRef, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import { 
  LayoutDashboard, BarChart2, Users, History, Settings,
  AlertTriangle, TrendingDown, CheckCircle, Globe,
  Send, RefreshCw, Bell, Download
} from "lucide-react";

// Correction du problème d'icônes Leaflet par défaut
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

function MapFlyTo({ siteActuel }) {
  const map = useMap();
  useEffect(() => {
    if (siteActuel) {
      const site = SITES_MAP.find(s => s.id === siteActuel);
      if (site) {
        map.flyTo([site.lat, site.lon], 12, { duration: 1.5 });
      }
    } else {
      map.flyTo([5.345, -5.0], 7, { duration: 1.5 });
    }
  }, [siteActuel, map]);
  return null;
}

export default function PalmciDashboard() {
  const [siteActuel, setSiteActuel] = useState(null);
  const [nomSite, setNomSite] = useState("");
  const [anneeActive] = useState("2025");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [erreur, setErreur] = useState(null);
  const cache = useRef({});

  const chargerDonnees = async (siteId, nom) => {
    setSiteActuel(siteId); 
    setNomSite(nom); 
    setErreur(null);
    
    const cacheKey = `${siteId}-${anneeActive}`;
    if (cache.current[cacheKey]) { 
      setData(cache.current[cacheKey]); 
      return; 
    }
    
    setLoading(true); 
    setData({});
    
    try {
      const [resAnalyse, resPrescription] = await Promise.all([
        fetch(`${API}/api/analyse/${siteId}?annee=${anneeActive}`).then(r=>r.json()),
        fetch(`${API}/api/prescription/${siteId}?annee=${anneeActive}&age_palmier=10`).then(r=>r.json()),
      ]);
      
      if (resAnalyse.erreur) throw new Error(resAnalyse.erreur);

      const result = { analyse: resAnalyse, prescription: resPrescription };
      cache.current[cacheKey] = result;
      setData(result);
    } catch (err) { 
      setErreur("Erreur lors de la récupération des données."); 
    } finally { 
      setLoading(false); 
    }
  };

  const analyse = data.analyse;
  const prescription = data.prescription;

  // Calculs factices globaux pour l'exemple
  const surfaceAnalyse = analyse ? Math.round((analyse.zone1_ha||0) + (analyse.zone2_ha||0) + (analyse.zone3_ha||0)) : 44000;
  const zonesCritiques = analyse ? (analyse.zone === 1 ? 1 : 0) : 1;
  const economie = analyse ? "15.4%" : "0%";
  const parcellesSaines = analyse ? "17%" : "0%";

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
            <Bell size={20} color="#64748b" style={{ cursor: "pointer" }} />
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
              <div className="kpi-header">
                SURFACE ANALYSÉE <Globe size={16} color="#3b82f6" />
              </div>
              <div className="kpi-value">{surfaceAnalyse.toLocaleString()} ha</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>+2.5% vs semaine</div>
              <div style={{ height: "3px", background: "#3b82f6", width: "100%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>
            
            <div className="kpi-card">
              <div className="kpi-header">
                ZONES CRITIQUES <AlertTriangle size={16} color="#ef4444" />
              </div>
              <div className="kpi-value">{zonesCritiques}</div>
              <div className="kpi-sub" style={{ color: "#ef4444" }}>Nécessitent attention</div>
              <div style={{ height: "3px", background: "#ef4444", width: "30%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                ÉCONOMIES D'ENGRAIS <TrendingDown size={16} color="#10b981" />
              </div>
              <div className="kpi-value">{economie}</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Économies réalisées</div>
              <div style={{ height: "3px", background: "#10b981", width: "80%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>

            <div className="kpi-card">
              <div className="kpi-header">
                PARCELLES SAINES <CheckCircle size={16} color="#10b981" />
              </div>
              <div className="kpi-value">{parcellesSaines}</div>
              <div className="kpi-sub" style={{ color: "#10b981" }}>Bonne santé</div>
              <div style={{ height: "3px", background: "#10b981", width: "60%", marginTop: "12px", borderRadius: "2px" }}></div>
            </div>
          </div>

          <div className="content-split">
            {/* Left Area (Map) */}
            <div className="map-section">
              <div className="map-header">
                <div className="map-tabs">
                  <div className="map-tab active">Carte NDVI</div>
                  <div className="map-tab">Statistiques</div>
                  <div className="map-tab">Alertes</div>
                </div>
              </div>
              
              <div style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <div>
                    <h3 style={{ margin: "0 0 4px 0", fontSize: "14px" }}>Sites PALMCI & GEE</h3>
                    <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Visualisation des périmètres et préparation GEE</p>
                  </div>
                  <div style={{ fontSize: "11px", background: "#f0fdf4", color: "#166534", padding: "4px 8px", borderRadius: "4px", border: "1px solid #bbf7d0" }}>
                    GEE status: Connecté
                  </div>
                </div>
              </div>

              <div className="map-container">
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
                      eventHandlers={{ click: () => chargerDonnees(site.id, site.nom) }}
                    >
                      <Popup>
                        <strong>{site.nom}</strong><br/>
                        Cliquez pour analyser.
                      </Popup>
                    </CircleMarker>
                  ))}
                  <MapFlyTo siteActuel={siteActuel} />
                </MapContainer>
              </div>
              
              <div className="map-footer">
                <button className="btn-primary-outline" onClick={() => siteActuel && chargerDonnees(siteActuel, nomSite)}>
                  <RefreshCw size={14} /> Charger NDVI GEE
                </button>
                <button className="btn-secondary" onClick={() => setSiteActuel(null)}>
                  Actualiser la carte
                </button>
                <div style={{ marginLeft: "auto", fontSize: "12px", color: "#64748b", display: "flex", alignItems: "center", gap: "8px" }}>
                  Sites chargés <strong style={{ color: "#10b981", fontSize: "16px" }}>{SITES_MAP.length}</strong>
                </div>
              </div>
            </div>

            {/* Right Area (Control Center) */}
            <div className="control-section">
              <div className="control-panel">
                <div className="panel-title">Centre de Contrôle</div>
                <div className="panel-desc">Sélectionnez un site pour charger les données</div>

                {!siteActuel ? (
                  <div style={{ textAlign: "center", padding: "40px 0" }}>
                    <div style={{ fontSize: "40px", marginBottom: "16px" }}>🌴</div>
                    <h3 style={{ fontSize: "14px", margin: "0 0 8px 0" }}>SÉLECTIONNEZ UN SITE</h3>
                    <p style={{ fontSize: "12px", color: "#64748b", margin: 0 }}>Cliquez un marqueur sur la carte pour lancer l'analyse</p>
                  </div>
                ) : loading ? (
                  <div className="spinner-container">
                    <div className="spinner"></div>
                    <div style={{ fontSize: "12px", fontWeight: "600", color: "#0e5033" }}>ANALYSE GEE EN COURS...</div>
                  </div>
                ) : erreur ? (
                  <div style={{ color: "#ef4444", fontSize: "13px", padding: "16px", background: "#fef2f2", borderRadius: "8px" }}>
                    {erreur}
                  </div>
                ) : analyse ? (
                  <div style={{ animation: "fadeIn 0.3s ease" }}>
                    <div style={{ background: analyse.zone===1?"#fef2f2":analyse.zone===2?"#fefce8":"#f0fdf4", 
                                  color: analyse.zone===1?"#b91c1c":analyse.zone===2?"#a16207":"#15803d", 
                                  fontSize: "10px", fontWeight: "700", padding: "4px 8px", borderRadius: "4px", display: "inline-block", marginBottom: "12px", textTransform: "uppercase" }}>
                      {analyse.label || `Zone ${analyse.zone}`}
                    </div>
                    
                    <h3 style={{ fontSize: "16px", margin: "0 0 4px 0", color: "#0f172a" }}>PALMCI {nomSite}</h3>
                    <p style={{ fontSize: "11px", color: "#64748b", margin: "0 0 20px 0" }}>
                      Coordonnées de périmètre disponibles<br/>
                      Surface estimée: {surfaceAnalyse.toLocaleString()} ha
                    </p>

                    <div className="diag-box">
                      <div className="diag-title">Diagnostic GEE</div>
                      <div className="diag-value">{(analyse.ndvi_moyen || 0).toFixed(2)}</div>
                      <div style={{ fontSize: "11px", color: "#0369a1", marginTop: "4px" }}>Indice NDVI moyen</div>
                    </div>

                    <div className="presc-box">
                      <div className="presc-title">Prescription IA</div>
                      <div className="presc-value">{prescription?.prescription?.dose || analyse.dose}</div>
                      <div style={{ fontSize: "11px", color: "#a16207", marginTop: "4px" }}>Dose NPK recommandée</div>
                    </div>

                    <button className="btn-primary">
                      <Send size={16} /> Envoyer à l'App
                    </button>
                  </div>
                ) : null}
              </div>

              <div className="sites-list-container">
                <div className="sites-list-header">Liste des sites PALMCI</div>
                <div className="sites-list">
                  {SITES_MAP.map(site => (
                    <div key={site.id} 
                         className={`site-item ${siteActuel === site.id ? 'active' : ''}`}
                         onClick={() => chargerDonnees(site.id, site.nom)}>
                      <div>
                        <div className="site-item-name">PALMCI {site.nom}</div>
                        <div className="site-item-sub">NDVI: {site.id === 1 ? '0.42' : 'N/A'}</div>
                      </div>
                      <div className="site-badge" style={{ 
                        background: site.id===3 ? '#fef2f2' : site.id===1 || site.id===2 ? '#fefce8' : '#f1f5f9',
                        color: site.id===3 ? '#ef4444' : site.id===1 || site.id===2 ? '#eab308' : '#64748b'
                      }}>
                        {site.id===3 ? 'CRITIQUE' : site.id===1 || site.id===2 ? 'STRESS' : '---'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
