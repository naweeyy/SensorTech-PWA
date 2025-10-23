import { useCallback, useEffect, useRef, useState } from "react";
import "./Tableau.css";
import { sentNotification } from '../main';

const TABS = ["sondes", "toilettes"] as const;
type TabKey = (typeof TABS)[number];
type Row = Record<string, string | number | null>;

export default function Tableau() {
  const [tab, setTab] = useState<TabKey>("sondes");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hoveredButton, setHoveredButton] = useState<TabKey | "refresh" | null>(
    null
  );

  const apiBase = import.meta.env.VITE_API_URL;
  const cache = useRef<Record<TabKey, Row[]>>({ sondes: [], toilettes: [] });

  // Gestionnaire des événements en ligne/hors ligne
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      sentNotification("Connexion rétablie");
    };

    const handleOffline = () => {
      setIsOnline(false);
      sentNotification("Mode hors ligne activé");
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const fetchData = useCallback(
    async (tab: TabKey, force = false) => {
      if (!apiBase) {
        setError("URL API non définie");
        return;
      }

      if (!force && cache.current[tab].length > 0) {
        setData(cache.current[tab]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${apiBase}/${tab}`);
        
        if (!response.ok) {
          throw new Error(`Erreur réseau: ${response.status} ${response.statusText}`);
        }

        const json = await response.json();
        const data = Array.isArray(json) ? json : json?.data || [json];

        cache.current[tab] = data;
        setData(data);
        
        sentNotification(`Données des ${tab} mises à jour.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur de chargement");
        setData([]);
      } finally {
        setLoading(false);
      }
    },
    [apiBase]
  );

  useEffect(() => {
    fetchData(tab);
  }, [tab, fetchData]);

  const columns = data.length
    ? Array.from(new Set(data.flatMap(Object.keys)))
    : [];

  const getButtonClass = (buttonTab: TabKey | "refresh") => {
    if (buttonTab === "refresh") {
      return `refresh ${hoveredButton === "refresh" ? "tabHover" : ""}`;
    }

    let className = "tab";
    if (tab === buttonTab) className += " activeTab";
    if (hoveredButton === buttonTab) className += " tabHover";
    return className;
  };

  const renderContent = () => {
    if (loading) return <div className="message">Chargement...</div>;
    if (error) return <div className="message">{error}</div>;
    if (!data.length) return <div className="message">Aucune donnée</div>;

    return (
      <table className="table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col} className="th">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={`${index}-${col}`} className="td">
                  {row[col] ?? ""}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  return (
    <div className="container">
      <div className="nav">
        {TABS.map((tabKey) => (
          <button
            key={tabKey}
            className={getButtonClass(tabKey)}
            onClick={() => setTab(tabKey)}
            onMouseEnter={() => setHoveredButton(tabKey)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {tabKey}
          </button>
        ))}
        <button
          className={getButtonClass("refresh")}
          onClick={() => {
            if (isOnline) {
              fetchData(tab, true);
            }
          }}
          onMouseEnter={() => setHoveredButton("refresh")}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={!isOnline}
          title={isOnline ? "Rafraîchir les données" : "Hors ligne - rafraîchissement indisponible"}
        >
          {isOnline ? "Rafraîchir" : "Hors ligne"}
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
