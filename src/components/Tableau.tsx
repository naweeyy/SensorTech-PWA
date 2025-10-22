import { useCallback, useEffect, useRef, useState } from "react";
import { fetchWithOfflineSupport } from "../utils/dbService";
import "./Tableau.css";

const TABS = ["sondes", "toilettes"] as const;
type TabKey = (typeof TABS)[number];
type Row = Record<string, string | number | null>;

export default function Tableau() {
  const [tab, setTab] = useState<TabKey>("sondes");
  const [data, setData] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredButton, setHoveredButton] = useState<TabKey | "refresh" | null>(
    null
  );

  const apiBase = import.meta.env.VITE_API_URL;
  const cache = useRef<Record<TabKey, Row[]>>({ sondes: [], toilettes: [] });

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
        const result = await fetchWithOfflineSupport(`${apiBase}/${tab}`);

        cache.current[tab] = result.data;
        setData(result.data);
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
    const isOnline = navigator.onLine;
    if (isOnline || cache.current[tab].length === 0) {
      fetchData(tab);
    } else {
      setData(cache.current[tab]);
    }
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
            if (navigator.onLine) {
              fetchData(tab, true);
            }
          }}
          onMouseEnter={() => setHoveredButton("refresh")}
          onMouseLeave={() => setHoveredButton(null)}
          disabled={!navigator.onLine}
        >
          Rafraîchir
        </button>
      </div>
      {renderContent()}
    </div>
  );
}
