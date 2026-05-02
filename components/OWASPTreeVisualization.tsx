import React, { useState, useCallback, useMemo, useEffect } from 'react';
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  MiniMap,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Types for OWASP data
interface OWASPData {
  id: string;
  text: string;
  type: string;
  data: {
    owasp_id: string;
    description: string;
    severity: string;
    url: string;
  };
  children?: OWASPData[];
}

// Custom Node Component
const OWASPNode = ({ data, selected }: { data: any; selected: boolean }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return '#ff0080';
      case 'High': return '#ff4081';
      case 'Medium': return '#ff9800';
      case 'Low': return '#4caf50';
      default: return '#00bcd4';
    }
  };

  const getRiskGlow = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Critical': return '0 0 20px #ff0080, 0 0 40px #ff0080, 0 0 60px #ff0080';
      case 'High': return '0 0 15px #ff4081, 0 0 30px #ff4081';
      case 'Medium': return '0 0 10px #ff9800, 0 0 20px #ff9800';
      case 'Low': return '0 0 8px #4caf50, 0 0 16px #4caf50';
      default: return '0 0 12px #00bcd4, 0 0 24px #00bcd4';
    }
  };

  return (
    <div
      className={`owasp-node ${selected ? 'selected' : ''} ${isHovered ? 'hovered' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(20px)',
        border: `2px solid ${getRiskColor(data.riskLevel)}`,
        borderRadius: '16px',
        padding: '16px',
        minWidth: '200px',
        maxWidth: '300px',
        boxShadow: getRiskGlow(data.riskLevel),
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Animated background gradient */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, ${getRiskColor(data.riskLevel)}20, transparent)`,
          opacity: isHovered ? 1 : 0.3,
          transition: 'opacity 0.3s ease',
        }}
      />
      
      {/* Node content */}
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '8px',
          }}
        >
          <h3
            style={{
              color: '#ffffff',
              fontSize: '14px',
              fontWeight: '600',
              margin: 0,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {data.id}
          </h3>
          <span
            style={{
              background: getRiskColor(data.riskLevel),
              color: '#000',
              padding: '2px 8px',
              borderRadius: '12px',
              fontSize: '10px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {data.riskLevel}
          </span>
        </div>
        
        <h4
          style={{
            color: '#e2e8f0',
            fontSize: '16px',
            fontWeight: '500',
            margin: '0 0 8px 0',
            lineHeight: '1.4',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {data.title}
        </h4>
        
        <p
          style={{
            color: '#94a3b8',
            fontSize: '12px',
            margin: '0 0 12px 0',
            lineHeight: '1.5',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {data.description}
        </p>
        
        {/* Expandable content */}
        {isExpanded && (
          <div
            style={{
              marginTop: '12px',
              padding: '12px',
              background: 'rgba(0, 0, 0, 0.3)',
              borderRadius: '8px',
              border: `1px solid ${getRiskColor(data.riskLevel)}40`,
            }}
          >
            <h5
              style={{
                color: '#00bcd4',
                fontSize: '12px',
                fontWeight: '600',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
            >
              Key Points:
            </h5>
            <ul
              style={{
                color: '#cbd5e1',
                fontSize: '11px',
                margin: 0,
                paddingLeft: '16px',
                lineHeight: '1.6',
              }}
            >
              {data.keyPoints?.map((point: string, index: number) => (
                <li key={index}>{point}</li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Expand/Collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            position: 'absolute',
            top: '12px',
            right: '12px',
            background: 'rgba(0, 188, 212, 0.2)',
            border: '1px solid #00bcd4',
            borderRadius: '50%',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#00bcd4',
            fontSize: '12px',
            transition: 'all 0.2s ease',
            boxShadow: '0 0 8px rgba(0, 188, 212, 0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(0, 188, 212, 0.4)';
            e.currentTarget.style.boxShadow = '0 0 12px rgba(0, 188, 212, 0.6)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(0, 188, 212, 0.2)';
            e.currentTarget.style.boxShadow = '0 0 8px rgba(0, 188, 212, 0.3)';
          }}
        >
          {isExpanded ? '−' : '+'}
        </button>
      </div>
    </div>
  );
};

// Custom Node Types
const nodeTypes: NodeTypes = {
  owaspNode: OWASPNode,
};

// Main Component
const OWASPTreeVisualization: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [layout, setLayout] = useState<'vertical' | 'horizontal'>('vertical');
  const [showRiskPanel, setShowRiskPanel] = useState(true);
  const [showLeaderboard, setShowLeaderboard] = useState(true);
  const [owaspData, setOwaspData] = useState<OWASPData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch OWASP data from backend
  useEffect(() => {
    const fetchOwaspData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Try to fetch from Flask backend first
        const response = await fetch('http://localhost:5000/api/owasp-data');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            setOwaspData(result.data);
            setLoading(false);
            return;
          }
        }
        
        // Fallback to hardcoded data if backend is not available
        console.warn('Backend not available, using fallback data');
        const fallbackData: OWASPData[] = [
          {
            id: 'A01',
            text: 'A01:2021 - Broken Access Control',
            type: 'vulnerability',
            data: {
              owasp_id: 'A01',
              description: 'Access control enforces policy such that users cannot act outside of their intended permissions.',
              severity: 'Critical',
              url: '/vulnerability/A01'
            }
          },
          {
            id: 'A02',
            text: 'A02:2021 - Cryptographic Failures',
            type: 'vulnerability',
            data: {
              owasp_id: 'A02',
              description: 'Sensitive data exposure due to weak or missing cryptographic controls.',
              severity: 'Critical',
              url: '/vulnerability/A02'
            }
          },
          {
            id: 'A03',
            text: 'A03:2021 - Injection',
            type: 'vulnerability',
            data: {
              owasp_id: 'A03',
              description: 'Untrusted data is sent to an interpreter as part of a command or query.',
              severity: 'Critical',
              url: '/vulnerability/A03'
            }
          },
          {
            id: 'A04',
            text: 'A04:2021 - Insecure Design',
            type: 'vulnerability',
            data: {
              owasp_id: 'A04',
              description: 'Missing or ineffective control design within a system.',
              severity: 'High',
              url: '/vulnerability/A04'
            }
          },
          {
            id: 'A05',
            text: 'A05:2021 - Security Misconfiguration',
            type: 'vulnerability',
            data: {
              owasp_id: 'A05',
              description: 'Insecure default configurations, incomplete configurations, or misconfigured security settings.',
              severity: 'High',
              url: '/vulnerability/A05'
            }
          },
          {
            id: 'A06',
            text: 'A06:2021 - Vulnerable and Outdated Components',
            type: 'vulnerability',
            data: {
              owasp_id: 'A06',
              description: 'Using components with known vulnerabilities or outdated dependencies.',
              severity: 'High',
              url: '/vulnerability/A06'
            }
          },
          {
            id: 'A07',
            text: 'A07:2021 - Identification and Authentication Failures',
            type: 'vulnerability',
            data: {
              owasp_id: 'A07',
              description: 'Confirmation of the user identity, authentication, and session management.',
              severity: 'High',
              url: '/vulnerability/A07'
            }
          },
          {
            id: 'A08',
            text: 'A08:2021 - Software and Data Integrity Failures',
            type: 'vulnerability',
            data: {
              owasp_id: 'A08',
              description: 'Software and data integrity failures related to code and infrastructure.',
              severity: 'Medium',
              url: '/vulnerability/A08'
            }
          },
          {
            id: 'A09',
            text: 'A09:2021 - Security Logging and Monitoring Failures',
            type: 'vulnerability',
            data: {
              owasp_id: 'A09',
              description: 'Insufficient logging and monitoring capabilities.',
              severity: 'Medium',
              url: '/vulnerability/A09'
            }
          },
          {
            id: 'A10',
            text: 'A10:2021 - Server-Side Request Forgery',
            type: 'vulnerability',
            data: {
              owasp_id: 'A10',
              description: 'SSRF flaws occur whenever a web application is fetching a remote resource.',
              severity: 'Medium',
              url: '/vulnerability/A10'
            }
          }
        ];
        setOwaspData(fallbackData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching OWASP data:', err);
        setError('Failed to load OWASP data');
        setLoading(false);
      }
    };

    fetchOwaspData();
  }, []);

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchTerm) return owaspData;
    return owaspData.filter(item =>
      item.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.data.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [owaspData, searchTerm]);

  // Generate nodes and edges
  const { nodes, edges } = useMemo(() => {
    const nodeList: Node[] = filteredData.map((item, index) => ({
      id: item.id,
      type: 'owaspNode',
      position: layout === 'vertical' 
        ? { x: 0, y: index * 250 }
        : { x: index * 350, y: 0 },
      data: {
        id: item.id,
        title: item.text,
        description: item.data.description,
        riskLevel: item.data.severity,
        keyPoints: [
          'Learn more about this vulnerability',
          'Understand the security implications',
          'Explore prevention techniques',
          'Practice with CTF challenges'
        ]
      },
    }));

    const edgeList: Edge[] = [];
    for (let i = 0; i < nodeList.length - 1; i++) {
      edgeList.push({
        id: `e${i}-${i + 1}`,
        source: nodeList[i].id,
        target: nodeList[i + 1].id,
        type: 'smoothstep',
        animated: true,
        style: { stroke: '#00bcd4', strokeWidth: 2 },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: '#00bcd4',
        },
      });
    }

    return { nodes: nodeList, edges: edgeList };
  }, [filteredData, layout]);

  const [nodesState, setNodes, onNodesChange] = useNodesState(nodes);
  const [edgesState, setEdges, onEdgesChange] = useEdgesState(edges);

  // Update nodes when filtered data changes
  useEffect(() => {
    setNodes(nodes);
    setEdges(edges);
  }, [nodes, edges, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Risk level statistics
  const riskStats = useMemo(() => {
    const stats = filteredData.reduce((acc, item) => {
      acc[item.riskLevel] = (acc[item.riskLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    return stats;
  }, [filteredData]);

  // Show loading state
  if (loading) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#00bcd4',
          }}
        >
          Loading OWASP Knowledge Tree...
        </div>
        <div
          style={{
            width: '50px',
            height: '50px',
            border: '3px solid rgba(0, 188, 212, 0.3)',
            borderTop: '3px solid #00bcd4',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        />
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          color: '#ffffff',
        }}
      >
        <div
          style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '20px',
            color: '#ff4081',
          }}
        >
          Error Loading OWASP Data
        </div>
        <div
          style={{
            fontSize: '16px',
            color: '#94a3b8',
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          {error}
        </div>
        <button
          onClick={() => window.location.reload()}
          className="glow-button"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
        fontFamily: 'Inter, system-ui, sans-serif',
        overflow: 'hidden',
        position: 'relative',
      }}
    >

      {/* Top Search Bar */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 1000,
          width: '400px',
        }}
      >
        <input
          type="text"
          placeholder="Search OWASP vulnerabilities..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      {/* Control Panel */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          gap: '12px',
        }}
      >
        <button
          onClick={() => setLayout(layout === 'vertical' ? 'horizontal' : 'vertical')}
          className="glow-button"
          style={{ fontSize: '14px' }}
        >
          {layout === 'vertical' ? '↔️ Horizontal' : '↕️ Vertical'}
        </button>
        <button
          onClick={() => setShowRiskPanel(!showRiskPanel)}
          className="glow-button"
          style={{ fontSize: '14px' }}
        >
          {showRiskPanel ? '📊 Hide Stats' : '📊 Show Stats'}
        </button>
        <button
          onClick={() => setShowLeaderboard(!showLeaderboard)}
          className="glow-button"
          style={{ fontSize: '14px' }}
        >
          {showLeaderboard ? '🏆 Hide Leaderboard' : '🏆 Show Leaderboard'}
        </button>
      </div>

      {/* Risk Level Panel */}
      {showRiskPanel && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '80px',
            right: '20px',
            zIndex: 1000,
            padding: '20px',
            minWidth: '200px',
          }}
        >
          <h3
            style={{
              color: '#00bcd4',
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            Risk Distribution
          </h3>
          {Object.entries(riskStats).map(([level, count]) => (
            <div
              key={level}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '8px',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
              }}
            >
              <span style={{ color: '#e2e8f0', fontSize: '14px' }}>{level}</span>
              <span
                style={{
                  background: level === 'Critical' ? '#ff0080' : 
                             level === 'High' ? '#ff4081' :
                             level === 'Medium' ? '#ff9800' : '#4caf50',
                  color: '#000',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '700',
                }}
              >
                {count}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Leaderboard Panel */}
      {showLeaderboard && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            bottom: '20px',
            right: '20px',
            zIndex: 1000,
            padding: '20px',
            minWidth: '250px',
          }}
        >
          <h3
            style={{
              color: '#ff0080',
              margin: '0 0 16px 0',
              fontSize: '18px',
              fontWeight: '600',
            }}
          >
            Top Vulnerabilities
          </h3>
          {filteredData.slice(0, 5).map((item, index) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '12px',
                padding: '8px 12px',
                background: 'rgba(0, 0, 0, 0.3)',
                borderRadius: '8px',
                transition: 'all 0.2s ease',
              }}
            >
              <span
                style={{
                  background: 'linear-gradient(135deg, #00bcd4, #ff0080)',
                  color: '#000',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px',
                  fontWeight: '700',
                  marginRight: '12px',
                }}
              >
                {index + 1}
              </span>
              <div>
                <div style={{ color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                  {item.id}
                </div>
                <div style={{ color: '#94a3b8', fontSize: '12px' }}>
                  {item.title}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* React Flow */}
      <ReactFlow
        nodes={nodesState}
        edges={edgesState}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-left"
        style={{
          background: 'transparent',
        }}
      >
        <Controls
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            borderRadius: '12px',
          }}
        />
        <MiniMap
          style={{
            background: 'rgba(15, 23, 42, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 188, 212, 0.3)',
            borderRadius: '12px',
          }}
          nodeColor={(node) => {
            const riskLevel = node.data?.riskLevel;
            switch (riskLevel) {
              case 'Critical': return '#ff0080';
              case 'High': return '#ff4081';
              case 'Medium': return '#ff9800';
              case 'Low': return '#4caf50';
              default: return '#00bcd4';
            }
          }}
        />
        <Background
          color="#334155"
          gap={20}
          size={1}
          style={{
            opacity: 0.3,
          }}
        />
      </ReactFlow>
    </div>
  );
};

export default OWASPTreeVisualization;
