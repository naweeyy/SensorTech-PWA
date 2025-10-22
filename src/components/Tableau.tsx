import { useCallback, useEffect, useRef, useState } from 'react'

const TABS = ['sondes', 'toilettes'] as const
type TabKey = typeof TABS[number]
type Row = Record<string, string | number | null>

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
    background: '#242424'
  },
  nav: {
    display: 'flex',
    borderBottom: '1px solid #333',
    marginBottom: '20px'
  },
  tab: {
    padding: '10px 20px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '0.9rem',
    textTransform: 'uppercase' as const
  },
  activeTab: {
    background: '#333',
    color: 'white'
  },
  tabHover: {
    background: '#2a2a2a',
    color: 'white'
  },
  refresh: {
    marginLeft: 'auto',
    padding: '10px',
    background: 'none',
    border: 'none',
    color: '#888',
    cursor: 'pointer',
    fontSize: '20px'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const
  },
  th: {
    padding: '10px',
    textAlign: 'left' as const,
    color: '#888',
    background: '#1a1a1a'
  },
  td: {
    padding: '10px',
    borderBottom: '1px solid #333',
    color: 'white'
  },
  message: {
    padding: '20px',
    textAlign: 'center' as const,
    color: '#888'
  }
}

export default function Tableau() {
  const [tab, setTab] = useState<TabKey>('sondes')
  const [data, setData] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hoveredButton, setHoveredButton] = useState<TabKey | 'refresh' | null>(null)

  const apiBase = import.meta.env.VITE_API_URL
  const cache = useRef<Record<TabKey, Row[]>>({ sondes: [], toilettes: [] })

  const fetchData = useCallback(async (tab: TabKey, force = false) => {
    if (!apiBase) {
      setError('URL API non définie')
      return
    }

    if (!force && cache.current[tab].length > 0) {
      setData(cache.current[tab])
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`${apiBase}/${tab}`)
      if (!response.ok) throw new Error(`Erreur ${response.status}`)

      const json = await response.json()
      const items = Array.isArray(json) ? json : json?.data ?? [json]
      
      cache.current[tab] = items
      setData(items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement')
      setData([])
    } finally {
      setLoading(false)
    }
  }, [apiBase])

  useEffect(() => {
    fetchData(tab)
  }, [tab, fetchData])

  const columns = data.length ? Array.from(new Set(data.flatMap(Object.keys))) : []

  const getButtonStyle = (buttonTab: TabKey | 'refresh') => {
    if (buttonTab === 'refresh') {
      return {
        ...styles.refresh,
        ...(hoveredButton === 'refresh' && styles.tabHover)
      }
    }

    return {
      ...styles.tab,
      ...(tab === buttonTab && styles.activeTab),
      ...(hoveredButton === buttonTab && styles.tabHover)
    }
  }

  const renderContent = () => {
    if (loading) return <div style={styles.message}>Chargement...</div>
    if (error) return <div style={styles.message}>{error}</div>
    if (!data.length) return <div style={styles.message}>Aucune donnée</div>

    return (
      <table style={styles.table}>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col} style={styles.th}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, index) => (
            <tr key={index}>
              {columns.map(col => (
                <td key={`${index}-${col}`} style={styles.td}>
                  {row[col] ?? ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.nav}>
        {TABS.map(tabKey => (
          <button
            key={tabKey}
            style={getButtonStyle(tabKey)}
            onClick={() => setTab(tabKey)}
            onMouseEnter={() => setHoveredButton(tabKey)}
            onMouseLeave={() => setHoveredButton(null)}
          >
            {tabKey}
          </button>
        ))}
        <button 
          style={getButtonStyle('refresh')}
          onClick={() => fetchData(tab, true)}
          onMouseEnter={() => setHoveredButton('refresh')}
          onMouseLeave={() => setHoveredButton(null)}
          title="Actualiser"
        >
          ↻
        </button>
      </div>
      {renderContent()}
    </div>
  )
}
