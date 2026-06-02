import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Search, Terminal, Network, BookOpen, Sun, Moon, 
  ArrowLeft, Maximize2, Minimize2, 
  RefreshCw, BarChart2, Cpu, Globe
} from 'lucide-react';
import { marked } from 'marked';
import { MicrowaveLinkDrawing, SpectrumAllocationDrawing } from './components/TechnicalDrawings';

// Interfaces for document nodes and links
interface DocNode {
  id: string;
  title: string;
  type: 'acts' | 'gazettes' | 'regulations';
  subtype: 'draft' | 'final' | null;
  filename: string;
  date: string | null;
  summary: string;
  content_length: number;
  linksCount: number;
  // Physics simulation properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

interface DocLink {
  source: string;
  target: string;
}

interface Metadata {
  nodes: DocNode[];
  links: DocLink[];
}

interface TerminalLog {
  id: string;
  type: 'command' | 'output' | 'error' | 'success';
  text: string;
}

export default function App() {
  // App view state
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);
  const [sidebarSearchText, setSidebarSearchText] = useState('');
  const [globalSearchText, setGlobalSearchText] = useState('');
  const [activeTab, setActiveTab] = useState<'acts' | 'gazettes' | 'regulations' | 'graph'>('acts');
  
  // Data State
  const [nodes, setNodes] = useState<DocNode[]>([]);
  const [links, setLinks] = useState<DocLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeDocContent, setActiveDocContent] = useState('');
  const [loadingDoc, setLoadingDoc] = useState(false);

  // Settings state
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isolateGraph, setIsolateGraph] = useState(false);
  const [showGlobalSearchResults, setShowGlobalSearchResults] = useState(false);

  // Terminal State
  const [terminalInput, setTerminalInput] = useState('');
  const [terminalLogs, setTerminalLogs] = useState<TerminalLog[]>([
    { id: '1', type: 'output', text: '==================================================' },
    { id: '2', type: 'success', text: '   TELECOMMUNICATION TECHNOLOGY NAMIBIA ARCHIVE   ' },
    { id: '3', type: 'output', text: '   System Core v4.1.0 // Database Online' },
    { id: '4', type: 'output', text: '   Type "help" to view available terminal commands.' },
    { id: '5', type: 'output', text: '==================================================' }
  ]);
  const terminalLogsEndRef = useRef<HTMLDivElement>(null);

  // Canvas Force Graph Refs and State
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const transformRef = useRef({ scale: 0.6, offsetX: 300, offsetY: 250 });
  const isDraggingCanvasRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const draggedNodeRef = useRef<DocNode | null>(null);
  const hoveredNodeRef = useRef<DocNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  
  // Hover state for tooltip overlay
  const [hoveredNode, setHoveredNode] = useState<DocNode | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 1. Fetch Metadata
  useEffect(() => {
    fetch('/docs/metadata.json')
      .then(res => res.json())
      .then((data: Metadata) => {
        // Initialize physics coordinates
        const initializedNodes = data.nodes.map((node, index) => {
          const angle = (index / data.nodes.length) * 2 * Math.PI;
          const radius = 100 + Math.random() * 250;
          return {
            ...node,
            x: 400 + Math.cos(angle) * radius,
            y: 300 + Math.sin(angle) * radius,
            vx: 0,
            vy: 0
          };
        });
        setNodes(initializedNodes);
        setLinks(data.links);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to load document metadata:', err);
        setLoading(false);
      });
  }, []);

  // 2. Manage theme changes
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-mode');
    } else {
      root.classList.remove('light-mode');
    }
  }, [theme]);

  // 3. Load active document content
  useEffect(() => {
    if (!selectedDocId) {
      setActiveDocContent('');
      return;
    }
    
    const activeDoc = nodes.find(n => n.id === selectedDocId);
    if (!activeDoc) return;

    setLoadingDoc(true);
    fetch(`/${activeDoc.filename}`)
      .then(res => {
        if (!res.ok) throw new Error(`Status ${res.status}`);
        return res.text();
      })
      .then(text => {
        // Strip front matter for clean reading if it exists
        let cleanText = text;
        if (text.startsWith('---')) {
          const parts = text.split('---', 2);
          if (parts.length >= 2 && text.includes('---', 3)) {
            // Find second '---' occurrence
            const secondIndex = text.indexOf('---', 3);
            cleanText = text.substring(secondIndex + 3).trim();
          }
        }
        setActiveDocContent(cleanText);
        setLoadingDoc(false);
      })
      .catch(err => {
        console.error(`Failed to load document: ${activeDoc.filename}`, err);
        setActiveDocContent(`### ERROR\n\nFailed to load the document content: \`/${activeDoc.filename}\`.\n\nPlease check if the file is correctly placed in the public folder structure.`);
        setLoadingDoc(false);
      });
  }, [selectedDocId, nodes]);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    terminalLogsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Compute counts for UI stats
  const stats = useMemo(() => {
    const total = nodes.length;
    const acts = nodes.filter(n => n.type === 'acts').length;
    const regulations = nodes.filter(n => n.type === 'regulations').length;
    const gazettes = nodes.filter(n => n.type === 'gazettes').length;
    return { total, acts, regulations, gazettes };
  }, [nodes]);

  // Filters for Sidebar list
  const filteredSidebarNodes = useMemo(() => {
    return nodes.filter(n => {
      // 1. Filter by active category tab (acts, gazettes, regulations)
      if (activeTab !== 'graph') {
        if (activeTab === 'regulations') {
          if (n.type !== 'regulations') return false;
        } else if (n.type !== activeTab) {
          return false;
        }
      }
      
      // 2. Filter by search text
      if (sidebarSearchText.trim() === '') return true;
      const searchLower = sidebarSearchText.toLowerCase();
      return (
        n.title.toLowerCase().includes(searchLower) ||
        n.id.toLowerCase().includes(searchLower) ||
        (n.summary && n.summary.toLowerCase().includes(searchLower))
      );
    });
  }, [nodes, activeTab, sidebarSearchText]);

  // Global Search Engine
  const globalSearchResults = useMemo(() => {
    if (globalSearchText.trim() === '') return [];
    const query = globalSearchText.toLowerCase();
    return nodes.filter(n => {
      return (
        n.title.toLowerCase().includes(query) ||
        n.id.toLowerCase().includes(query) ||
        n.summary.toLowerCase().includes(query)
      );
    }).slice(0, 10); // cap at 10 results
  }, [nodes, globalSearchText]);

  // Get current selected doc node
  const activeDocNode = useMemo(() => {
    return nodes.find(n => n.id === selectedDocId) || null;
  }, [nodes, selectedDocId]);

  // Cross references for active document
  const crossReferences = useMemo(() => {
    if (!selectedDocId) return { referencesTo: [], referencedBy: [] };
    
    // Find docs that are target of links where source is selectedDocId
    const toIds = links.filter(l => l.source === selectedDocId).map(l => l.target);
    // Find docs that are source of links where target is selectedDocId
    const byIds = links.filter(l => l.target === selectedDocId).map(l => l.source);
    
    const referencesTo = nodes.filter(n => toIds.includes(n.id));
    const referencedBy = nodes.filter(n => byIds.includes(n.id));
    
    return { referencesTo, referencedBy };
  }, [nodes, links, selectedDocId]);

  // Hot Links display
  const hotLinks = useMemo(() => {
    // Sort by link density (linksCount) to find the most referenced documents
    return [...nodes]
      .sort((a, b) => b.linksCount - a.linksCount)
      .slice(0, 5);
  }, [nodes]);

  // 4. Force-directed graph simulation & canvas rendering
  useEffect(() => {
    if (activeTab === 'graph' && !selectedDocId) {
      // Running main graph
      setIsolateGraph(false);
    }
  }, [activeTab, selectedDocId]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = canvas.clientWidth;
    let height = canvas.clientHeight;
    canvas.width = width;
    canvas.height = height;

    // Handle resizing
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        width = Math.floor(entry.contentRect.width);
        height = Math.floor(entry.contentRect.height);
        canvas.width = width;
        canvas.height = height;
      }
    });
    resizeObserver.observe(canvas);

    // Nodes and links to simulate
    // In isolated mode, we only simulate active node and its immediate neighbors
    let simulatedNodes: DocNode[] = [];
    let simulatedLinks: DocLink[] = [];

    if (isolateGraph && selectedDocId) {
      const neighborIds = new Set<string>();
      neighborIds.add(selectedDocId);
      links.forEach(l => {
        if (l.source === selectedDocId) neighborIds.add(l.target);
        if (l.target === selectedDocId) neighborIds.add(l.source);
      });
      simulatedNodes = nodes.filter(n => neighborIds.has(n.id));
      simulatedLinks = links.filter(l => neighborIds.has(l.source) && neighborIds.has(l.target));
    } else {
      simulatedNodes = nodes;
      simulatedLinks = links;
    }

    // Node index mapping for fast lookup
    const nodeMap = new Map<string, DocNode>();
    simulatedNodes.forEach(n => nodeMap.set(n.id, n));

    const simStep = () => {
      // Link Force (attraction)
      simulatedLinks.forEach(link => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;
        
        const dx = target.x! - source.x!;
        const dy = target.y! - source.y!;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        // Target distance between linked nodes
        const targetDist = 120;
        const k = 0.05; // strength
        const force = (dist - targetDist) * k;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (source !== draggedNodeRef.current) {
          source.vx! += fx;
          source.vy! += fy;
        }
        if (target !== draggedNodeRef.current) {
          target.vx! -= fx;
          target.vy! -= fy;
        }
      });

      // Charge Force (repulsion)
      for (let i = 0; i < simulatedNodes.length; i++) {
        const n1 = simulatedNodes[i];
        for (let j = i + 1; j < simulatedNodes.length; j++) {
          const n2 = simulatedNodes[j];
          const dx = n2.x! - n1.x!;
          const dy = n2.y! - n1.y!;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          
          if (dist < 350) {
            const repulsion = 400 / (dist * dist);
            const fx = (dx / dist) * repulsion;
            const fy = (dy / dist) * repulsion;
            
            if (n1 !== draggedNodeRef.current) {
              n1.vx! -= fx;
              n1.vy! -= fy;
            }
            if (n2 !== draggedNodeRef.current) {
              n2.vx! += fx;
              n2.vy! += fy;
            }
          }
        }
      }

      // Center force & collision with boundary
      const centerX = width / 2;
      const centerY = height / 2;
      simulatedNodes.forEach(n => {
        if (n === draggedNodeRef.current) return;
        
        // Gravity pull to center
        const gc = 0.008;
        n.vx! += (centerX - n.x!) * gc;
        n.vy! += (centerY - n.y!) * gc;
        
        // Collision prevention (push overlapping nodes apart)
        const radius = n.type === 'acts' ? 14 : 7;
        simulatedNodes.forEach(other => {
          if (other === n) return;
          const dx = n.x! - other.x!;
          const dy = n.y! - other.y!;
          const dist = Math.sqrt(dx*dx + dy*dy) || 1;
          const minD = radius + (other.type === 'acts' ? 14 : 7) + 15;
          if (dist < minD) {
            const push = (minD - dist) * 0.1;
            n.vx! += (dx / dist) * push;
            n.vy! += (dy / dist) * push;
          }
        });

        // Apply friction and velocities
        n.vx! *= 0.85;
        n.vy! *= 0.85;
        n.x! += n.vx!;
        n.y! += n.vy!;
      });
    };

    const drawGraph = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      
      // Apply zoom & pan translation
      ctx.translate(transformRef.current.offsetX, transformRef.current.offsetY);
      ctx.scale(transformRef.current.scale, transformRef.current.scale);

      // 1. Draw Links
      ctx.strokeStyle = theme === 'dark' ? 'rgba(0, 240, 255, 0.15)' : 'rgba(2, 132, 199, 0.18)';
      ctx.lineWidth = 1;
      simulatedLinks.forEach(link => {
        const source = nodeMap.get(link.source);
        const target = nodeMap.get(link.target);
        if (!source || !target) return;
        
        ctx.beginPath();
        ctx.moveTo(source.x!, source.y!);
        ctx.lineTo(target.x!, target.y!);
        ctx.stroke();
      });

      // 2. Draw Nodes
      simulatedNodes.forEach(node => {
        const radius = node.type === 'acts' ? 12 : node.type === 'regulations' ? 8 : 6;
        let color = '#10b981'; // gazettes = green
        
        if (node.type === 'acts') {
          color = '#f43f5e'; // acts = rose/pink
        } else if (node.type === 'regulations') {
          color = '#a855f7'; // regulations = purple
        }
        
        const isSelected = node.id === selectedDocId;
        const isHovered = hoveredNodeRef.current?.id === node.id;
        
        ctx.beginPath();
        ctx.arc(node.x!, node.y!, radius, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        
        // Node border styles
        if (isSelected) {
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 3;
          ctx.stroke();
          
          // Glow effect around selection
          ctx.save();
          ctx.strokeStyle = varColor('--accent-color');
          ctx.lineWidth = 6;
          ctx.globalAlpha = 0.5;
          ctx.stroke();
          ctx.restore();
        } else if (isHovered) {
          ctx.strokeStyle = varColor('--accent-color');
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        // 3. Draw Labels (Acts are always labelled, others on hover/select)
        const shouldShowLabel = node.type === 'acts' || isSelected || isHovered;
        if (shouldShowLabel) {
          ctx.fillStyle = isSelected ? varColor('--accent-color') : varColor('--text-header');
          ctx.font = isSelected ? 'bold 11px monospace' : '9px monospace';
          ctx.fillText(node.id, node.x! + radius + 5, node.y! + 3);
        }
      });

      ctx.restore();
    };

    const loop = () => {
      simStep();
      drawGraph();
      animationFrameRef.current = requestAnimationFrame(loop);
    };
    
    // Start simulation loop
    loop();

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      resizeObserver.disconnect();
    };
  }, [nodes, links, activeTab, theme, isolateGraph, selectedDocId]);

  // Helper to extract CSS variable colors on canvas
  const varColor = (cssVar: string) => {
    return getComputedStyle(document.documentElement).getPropertyValue(cssVar).trim();
  };

  // 5. Canvas Event Handlers (Pan/Zoom/Drag)
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert screen mouse coordinates to simulated canvas coordinates (applying zoom/pan offset)
    const simX = (mouseX - transformRef.current.offsetX) / transformRef.current.scale;
    const simY = (mouseY - transformRef.current.offsetY) / transformRef.current.scale;

    // Check if clicked close to any node
    let clickedNode: DocNode | null = null;
    let clickRadius = 20;

    let targetNodes = isolateGraph && selectedDocId ? 
      nodes.filter(n => {
        const neighborIds = new Set<string>();
        neighborIds.add(selectedDocId);
        links.forEach(l => {
          if (l.source === selectedDocId) neighborIds.add(l.target);
          if (l.target === selectedDocId) neighborIds.add(l.source);
        });
        return neighborIds.has(n.id);
      }) : nodes;

    for (let node of targetNodes) {
      const dx = node.x! - simX;
      const dy = node.y! - simY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < clickRadius) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      draggedNodeRef.current = clickedNode;
      // Anchor coordinates
      clickedNode.vx = 0;
      clickedNode.vy = 0;
    } else {
      // Pan action
      isDraggingCanvasRef.current = true;
      dragStartRef.current = { x: mouseX, y: mouseY };
    }
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 1. Handling Node Dragging
    if (draggedNodeRef.current) {
      const simX = (mouseX - transformRef.current.offsetX) / transformRef.current.scale;
      const simY = (mouseY - transformRef.current.offsetY) / transformRef.current.scale;
      
      draggedNodeRef.current.x = simX;
      draggedNodeRef.current.y = simY;
      draggedNodeRef.current.vx = 0;
      draggedNodeRef.current.vy = 0;
      return;
    }

    // 2. Handling Canvas Pan
    if (isDraggingCanvasRef.current) {
      const dx = mouseX - dragStartRef.current.x;
      const dy = mouseY - dragStartRef.current.y;
      
      transformRef.current.offsetX += dx;
      transformRef.current.offsetY += dy;
      
      dragStartRef.current = { x: mouseX, y: mouseY };
      return;
    }

    // 3. Handling Node Hover for tooltips
    const simX = (mouseX - transformRef.current.offsetX) / transformRef.current.scale;
    const simY = (mouseY - transformRef.current.offsetY) / transformRef.current.scale;

    let targetNodes = isolateGraph && selectedDocId ? 
      nodes.filter(n => {
        const neighborIds = new Set<string>();
        neighborIds.add(selectedDocId);
        links.forEach(l => {
          if (l.source === selectedDocId) neighborIds.add(l.target);
          if (l.target === selectedDocId) neighborIds.add(l.source);
        });
        return neighborIds.has(n.id);
      }) : nodes;

    let foundHoverNode: DocNode | null = null;
    for (let node of targetNodes) {
      const dx = node.x! - simX;
      const dy = node.y! - simY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 15) {
        foundHoverNode = node;
        break;
      }
    }

    hoveredNodeRef.current = foundHoverNode;
    setHoveredNode(foundHoverNode);
    if (foundHoverNode) {
      setTooltipPos({ x: mouseX + 15, y: mouseY + 15 });
    }
  };

  const handleCanvasMouseUpOrLeave = (e: React.MouseEvent<HTMLCanvasElement>) => {
    // If a node was dragged, click on it selects/views it!
    const canvas = canvasRef.current;
    if (draggedNodeRef.current && canvas) {
      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const simX = (mouseX - transformRef.current.offsetX) / transformRef.current.scale;
      const simY = (mouseY - transformRef.current.offsetY) / transformRef.current.scale;
      const dx = draggedNodeRef.current.x! - simX;
      const dy = draggedNodeRef.current.y! - simY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      
      // If we didn't drag it much, register it as a click select!
      if (dist < 5) {
        setSelectedDocId(draggedNodeRef.current.id);
        // Switch view tab to show contents
        if (activeTab === 'graph') {
          setActiveTab(draggedNodeRef.current.type);
        }
      }
    }
    
    draggedNodeRef.current = null;
    isDraggingCanvasRef.current = false;
  };

  const handleCanvasWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom factor scaling
    const zoomIntensity = 0.08;
    const zoomFactor = e.deltaY < 0 ? (1 + zoomIntensity) : (1 - zoomIntensity);
    
    const newScale = Math.max(0.15, Math.min(4, transformRef.current.scale * zoomFactor));

    // Adjust offsets to zoom focusing on the cursor position
    const simX = (mouseX - transformRef.current.offsetX) / transformRef.current.scale;
    const simY = (mouseY - transformRef.current.offsetY) / transformRef.current.scale;
    
    transformRef.current.scale = newScale;
    transformRef.current.offsetX = mouseX - simX * newScale;
    transformRef.current.offsetY = mouseY - simY * newScale;
  };

  const handleGraphZoomIn = () => {
    transformRef.current.scale = Math.min(4, transformRef.current.scale * 1.2);
  };
  const handleGraphZoomOut = () => {
    transformRef.current.scale = Math.max(0.15, transformRef.current.scale / 1.2);
  };
  const handleGraphReset = () => {
    transformRef.current = { scale: 0.6, offsetX: 300, offsetY: 200 };
    // Trigger reset physics velocities
    nodes.forEach(n => {
      n.vx = 0;
      n.vy = 0;
    });
  };

  // 6. Terminal Input Form Handler
  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const input = terminalInput.trim();
    if (!input) return;

    // Append entered command to logs
    const newLogId = Date.now().toString();
    const updatedLogs = [
      ...terminalLogs,
      { id: newLogId, type: 'command' as const, text: `guest@telco-namibia:~$ ${input}` }
    ];

    const args = input.split(' ');
    const command = args[0].toLowerCase();
    const param = args.slice(1).join(' ').trim();

    let outputText = '';
    let outputType: 'output' | 'error' | 'success' = 'output';

    switch (command) {
      case 'help':
        outputText = `Available commands:\n` +
          `  help             - List all terminal commands\n` +
          `  stats            - Display archive statistical metrics\n` +
          `  sysinfo          - Display simulated server specs\n` +
          `  ls <type>        - List files. Options: acts, regulations, gazettes\n` +
          `  search <term>    - Search documents for query term\n` +
          `  cat <id>         - Open/view document by ID (e.g. cat GG_4839)\n` +
          `  graph            - Switch view to interactive full Graph View\n` +
          `  clear            - Clear console logs`;
        break;
        
      case 'clear':
        setTerminalLogs([]);
        setTerminalInput('');
        return;
        
      case 'stats':
        outputText = `CRAN NAMIBIA DATABASE STATS:\n` +
          `  TOTAL DOCUMENTS INTRODUCED : ${stats.total}\n` +
          `  TELECOMMUNICATIONS ACTS    : ${stats.acts}\n` +
          `  REGULATORY GAZETTES        : ${stats.gazettes}\n` +
          `  SUBSIDIARY REGULATIONS     : ${stats.regulations}\n` +
          `  CROSS-DOCUMENT LINKAGES    : ${links.length}\n` +
          `  LINK DENSITY RATIO         : ${(links.length / stats.total).toFixed(2)} links/doc`;
        outputType = 'success';
        break;
        
      case 'sysinfo':
        outputText = `CRAN TELECOM VIRTUAL MAINFRAME:\n` +
          `  OS              : Debian GNU/Linux v12 (bookworm)\n` +
          `  CPU ARCHITECTURE: Intel(R) Xeon(R) Platinum CPU vScale\n` +
          `  NODE RUNTIME    : Node.js v24.15.0\n` +
          `  DEPLOY DIRECTORY: /home/u334805038/domains/telcostuff.peon.tech/public_html\n` +
          `  DNS DOMAIN      : telcostuff.peon.tech\n` +
          `  SERVER UPTIME   : 99.998% // STABLE`;
        break;
        
      case 'ls':
        const typeFilter = param.toLowerCase();
        if (typeFilter === 'acts' || typeFilter === 'act') {
          const actsList = nodes.filter(n => n.type === 'acts').map(n => `  - ${n.id} : ${n.title}`).join('\n');
          outputText = `ACTS ARCHIVED (${stats.acts} found):\n${actsList}`;
        } else if (typeFilter === 'regulations' || typeFilter === 'reg') {
          const regsList = nodes.filter(n => n.type === 'regulations').map(n => `  - ${n.id} : ${n.title.substring(0, 50)}...`).join('\n');
          outputText = `REGULATIONS ARCHIVED (${stats.regulations} found):\n${regsList}`;
        } else if (typeFilter === 'gazettes' || typeFilter === 'gaz') {
          const gazsList = nodes.filter(n => n.type === 'gazettes').slice(0, 15).map(n => `  - ${n.id} : ${n.title}`).join('\n');
          outputText = `GAZETTES ARCHIVED (Showing first 15 of ${stats.gazettes} found):\n${gazsList}\n...use search command for deep lookup.`;
        } else {
          outputText = `Usage: ls <acts|regulations|gazettes>`;
          outputType = 'error';
        }
        break;
        
      case 'search':
        if (!param) {
          outputText = `Usage: search <term>`;
          outputType = 'error';
        } else {
          const query = param.toLowerCase();
          const matches = nodes.filter(n => 
            n.title.toLowerCase().includes(query) || 
            n.id.toLowerCase().includes(query) || 
            n.summary.toLowerCase().includes(query)
          ).slice(0, 7);
          
          if (matches.length === 0) {
            outputText = `No document matches found for query: "${param}"`;
            outputType = 'error';
          } else {
            outputText = `SEARCH RESULTS FOR "${param}" (Showing top ${matches.length} matches):\n` +
              matches.map(n => `  [${n.type.toUpperCase()}] ${n.id} - ${n.title}`).join('\n');
            outputType = 'success';
          }
        }
        break;
        
      case 'cat':
      case 'view':
        if (!param) {
          outputText = `Usage: cat <document_id>`;
          outputType = 'error';
        } else {
          const match = nodes.find(n => n.id.toLowerCase() === param.toLowerCase());
          if (!match) {
            outputText = `Document with ID "${param}" not found. Try search first.`;
            outputType = 'error';
          } else {
            setSelectedDocId(match.id);
            setActiveTab(match.type);
            outputText = `SUCCESS: Opening document ${match.id} in reader pane...`;
            outputType = 'success';
          }
        }
        break;
        
      case 'graph':
        setActiveTab('graph');
        setSelectedDocId(null);
        outputText = `SUCCESS: Main interactive Network Graph displayed.`;
        outputType = 'success';
        break;
        
      default:
        outputText = `CRAN CLI: Command not recognized: "${command}". Type "help" for a list of commands.`;
        outputType = 'error';
    }

    setTerminalLogs([
      ...updatedLogs,
      { id: (Date.now() + 1).toString(), type: outputType, text: outputText }
    ]);
    setTerminalInput('');
  };

  return (
    <div className="app-container">
      {/* Retro scanline Overlay */}
      <div className="crt-overlay" />

      {/* Header Banner */}
      <header className="header-main">
        <div className="header-title-block" style={{ cursor: 'pointer' }} onClick={() => setSelectedDocId(null)}>
          <h1>
            <Terminal className="bento-card-icon" style={{ color: 'var(--accent-color)' }} />
            Telecommunication Technology Namibia
          </h1>
          <p>Regulatory Framework & Technical Docs Archive // CRAN STATICS</p>
        </div>
        
        <div className="header-controls">
          {/* Global Search Bar */}
          <div className="global-search-wrapper">
            <Search size={16} className="global-search-icon" />
            <input 
              type="text" 
              className="global-search-input" 
              placeholder="Search wiki database..." 
              value={globalSearchText}
              onChange={(e) => {
                setGlobalSearchText(e.target.value);
                setShowGlobalSearchResults(e.target.value.trim() !== '');
              }}
              onFocus={() => setShowGlobalSearchResults(globalSearchText.trim() !== '')}
            />
            {showGlobalSearchResults && (
              <div 
                className="graph-tooltip" 
                style={{ 
                  top: '42px', 
                  right: '0', 
                  width: '320px', 
                  maxWidth: '320px', 
                  cursor: 'default',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                  maxHeight: '350px',
                  overflowY: 'auto'
                }}
              >
                <div style={{ fontWeight: 'bold', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                  Search Results ({globalSearchResults.length})
                </div>
                {globalSearchResults.length === 0 ? (
                  <div style={{ color: 'var(--text-color)', padding: '5px' }}>No matches found</div>
                ) : (
                  globalSearchResults.map(res => (
                    <div 
                      key={res.id} 
                      style={{ 
                        padding: '6px', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)', 
                        cursor: 'pointer' 
                      }}
                      onMouseDown={() => {
                        setSelectedDocId(res.id);
                        setActiveTab(res.type);
                        setGlobalSearchText('');
                        setShowGlobalSearchResults(false);
                      }}
                    >
                      <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', fontSize: '10px' }}>
                        [{res.type.toUpperCase()}] {res.id}
                      </div>
                      <div style={{ color: 'var(--text-header)', fontSize: '11px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {res.title}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Theme Switcher Button */}
          <button 
            className="theme-toggle-btn" 
            title="Toggle terminal display theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* Main stats bar */}
      <section className="stats-bar">
        <div className="stat-item">
          <span className="stat-label">Main Database Status</span>
          <span className="stat-value success">ONLINE</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Total Acts Indexed</span>
          <span className="stat-value">{loading ? '...' : stats.acts}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Regulations Indexed</span>
          <span className="stat-value" style={{ color: 'var(--accent-color)' }}>{loading ? '...' : stats.regulations}</span>
        </div>
        <div className="stat-item">
          <span className="stat-label">Gov Gazettes Processed</span>
          <span className="stat-value warning">{loading ? '...' : stats.gazettes}</span>
        </div>
      </section>

      {loading ? (
        <div className="loading-indicator">
          <RefreshCw className="animate-spin" size={32} />
          <span>INITIALIZING DIGITAL DATABASE METRICS...</span>
        </div>
      ) : (
        /* Render Dashboard (Bento Grid) or Reader Layout depending on selection */
        !selectedDocId && activeTab === 'graph' ? (
          /* Main Graph View Screen */
          <div className="doc-viewer" style={{ minHeight: 'calc(100vh - 200px)' }}>
            <div className="doc-viewer-header" style={{ padding: '15px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Network size={18} color="var(--accent-color)" />
                    Interactive Telecommunication Knowledge Graph
                  </h2>
                  <p style={{ margin: '4px 0 0 0', fontSize: '10px' }}>
                    Map shows regulatory notices (green), regulations (purple) and legislative acts (red) connected by citations.
                  </p>
                </div>
                <button className="btn-action" onClick={() => { setSelectedDocId(null); setActiveTab('acts'); }}>
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
              </div>
            </div>
            
            <div className="bento-card" style={{ flexGrow: 1, padding: 0, minHeight: '550px' }}>
              <div className="graph-container-wrapper">
                <canvas 
                  ref={canvasRef} 
                  className="graph-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUpOrLeave}
                  onMouseLeave={handleCanvasMouseUpOrLeave}
                  onWheel={handleCanvasWheel}
                />
                
                {/* Canvas graph overlay tools */}
                <div className="graph-controls">
                  <button className="btn-graph-control" title="Zoom In" onClick={handleGraphZoomIn}><Maximize2 size={14} /></button>
                  <button className="btn-graph-control" title="Zoom Out" onClick={handleGraphZoomOut}><Minimize2 size={14} /></button>
                  <button className="btn-graph-control" title="Reset View" onClick={handleGraphReset}><RefreshCw size={14} /></button>
                </div>

                <div className="graph-legend">
                  <div className="legend-item"><span className="legend-dot act" /> Acts</div>
                  <div className="legend-item"><span className="legend-dot reg" /> Regulations</div>
                  <div className="legend-item"><span className="legend-dot gazette" /> Gazettes</div>
                </div>

                {hoveredNode && (
                  <div className="graph-tooltip" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-color)', marginBottom: '4px' }}>
                      {hoveredNode.id}
                    </div>
                    <div style={{ fontWeight: 500, marginBottom: '4px' }}>
                      {hoveredNode.title}
                    </div>
                    <div style={{ fontSize: '9px', opacity: 0.8 }}>
                      Type: {hoveredNode.type.toUpperCase()} ({hoveredNode.linksCount} connections)
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : !selectedDocId ? (
          /* Home Screen: Bento Grid Dashboard */
          <div className="bento-grid">
            
            {/* Card 1: Welcome Banner */}
            <div className="bento-card card-welcome">
              <div className="welcome-logo">CRAN_NAMIBIA // DATABASE</div>
              <div className="bento-card-title" style={{ border: 'none', padding: 0, marginBottom: '10px' }}>
                Namibian Telecommunications Regulatory Archive
              </div>
              <p className="welcome-text">
                Welcome to the digital technical archive of the Communications Regulatory Authority of Namibia (CRAN). 
                This portal indexes official acts, government gazettes, and specific spectrum / broadcasting regulations. 
                Interact via the visual knowledge graph, the sidebar categories, or run shell instructions in the integrated mainframe terminal console.
              </p>
              <div className="quick-action-buttons">
                <button className="btn-cyber" onClick={() => setActiveTab('acts')}>
                  <BookOpen size={16} />
                  <span>Browse Acts</span>
                </button>
                <button className="btn-cyber" onClick={() => setActiveTab('graph')}>
                  <Network size={16} />
                  <span>Interactive Graph</span>
                </button>
                <button className="btn-cyber" onClick={() => {
                  const inputField = document.querySelector('.terminal-input') as HTMLInputElement;
                  inputField?.focus();
                }}>
                  <Terminal size={16} />
                  <span>Console CLI</span>
                </button>
              </div>
            </div>

            {/* Card 2: Interactive Terminal Console CLI */}
            <div className="bento-card card-console">
              <div className="bento-card-header">
                <span className="bento-card-title">
                  <Terminal size={14} className="bento-card-icon" />
                  Mainframe Console Shell // guest@cran
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>interactive_cli.sh</span>
              </div>
              <div className="terminal-widget">
                <div className="terminal-logs">
                  {terminalLogs.map(log => (
                    <div key={log.id} className={`terminal-log-row ${log.type}`}>
                      {log.text}
                    </div>
                  ))}
                  <div ref={terminalLogsEndRef} />
                </div>
                <form onSubmit={handleTerminalSubmit} className="terminal-input-wrapper">
                  <span className="terminal-prompt">guest@telco-namibia:~$</span>
                  <input 
                    type="text" 
                    className="terminal-input"
                    placeholder="Enter terminal command (try 'help')..."
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                  />
                </form>
              </div>
            </div>

            {/* Card 3: Live Visual Knowledge Graph (Mini-View) */}
            <div className="bento-card card-graph">
              <div className="bento-card-header">
                <span className="bento-card-title">
                  <Network size={14} className="bento-card-icon" />
                  Cross-Citation Network Topology Map
                </span>
                <button className="btn-action" style={{ padding: '2px 8px', fontSize: '9px' }} onClick={() => setActiveTab('graph')}>
                  Fullscreen <Maximize2 size={10} style={{ marginLeft: '4px' }} />
                </button>
              </div>
              <div className="graph-container-wrapper">
                <canvas 
                  ref={canvasRef} 
                  className="graph-canvas"
                  onMouseDown={handleCanvasMouseDown}
                  onMouseMove={handleCanvasMouseMove}
                  onMouseUp={handleCanvasMouseUpOrLeave}
                  onMouseLeave={handleCanvasMouseUpOrLeave}
                  onWheel={handleCanvasWheel}
                />
                <div className="graph-legend">
                  <div className="legend-item"><span className="legend-dot act" /> Acts</div>
                  <div className="legend-item"><span className="legend-dot reg" /> Regulations</div>
                  <div className="legend-item"><span className="legend-dot gazette" /> Gazettes</div>
                </div>
                {hoveredNode && (
                  <div className="graph-tooltip" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{hoveredNode.id}</div>
                    <div style={{ fontSize: '10px' }}>{hoveredNode.title}</div>
                  </div>
                )}
              </div>
            </div>

            {/* Card 4: Technical drawing 1 (Microwave link) */}
            <div className="bento-card card-drawing-microwave">
              <div className="bento-card-header">
                <span className="bento-card-title">
                  <Cpu size={14} className="bento-card-icon" />
                  Physical Vector: Microwave Backhaul Link
                </span>
              </div>
              <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <MicrowaveLinkDrawing />
              </div>
            </div>

            {/* Card 5: Technical drawing 2 (Spectrum Plan) */}
            <div className="bento-card card-drawing-spectrum">
              <div className="bento-card-header">
                <span className="bento-card-title">
                  <Globe size={14} className="bento-card-icon" />
                  Frequency Distribution: LTE Carrier Allocations
                </span>
              </div>
              <div style={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                <SpectrumAllocationDrawing />
              </div>
            </div>

            {/* Card 6: Hot Links / Key Documents */}
            <div className="bento-card card-hotlinks">
              <div className="bento-card-header">
                <span className="bento-card-title">
                  <BarChart2 size={14} className="bento-card-icon" />
                  Highly Cited Documents
                </span>
                <span style={{ fontSize: '9px', opacity: 0.6 }}>weighted_index</span>
              </div>
              <div className="hotlinks-list">
                {hotLinks.map(link => (
                  <div key={link.id} className="hotlink-item" onClick={() => { setSelectedDocId(link.id); setActiveTab(link.type); }}>
                    <div className="hotlink-title">{link.title}</div>
                    <div className="hotlink-meta">
                      <span>ID: {link.id}</span>
                      <span style={{ color: 'var(--accent-color)' }}>{link.linksCount} references</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* Reader Screen: Split Sidebar and Document Viewer */
          <div className="layout-split">
            {/* Left Sidebar Document Navigator */}
            <aside className="doc-sidebar">
              <div className="sidebar-search-wrapper">
                <div className="global-search-wrapper">
                  <Search size={14} className="global-search-icon" />
                  <input 
                    type="text" 
                    className="global-search-input" 
                    style={{ width: '100%' }} 
                    placeholder="Search sidebar..." 
                    value={sidebarSearchText}
                    onChange={(e) => setSidebarSearchText(e.target.value)}
                  />
                </div>
              </div>
              
              <div className="sidebar-tabs">
                <button 
                  className={`sidebar-tab ${activeTab === 'acts' ? 'active' : ''}`}
                  onClick={() => setActiveTab('acts')}
                >
                  Acts
                </button>
                <button 
                  className={`sidebar-tab ${activeTab === 'regulations' ? 'active' : ''}`}
                  onClick={() => setActiveTab('regulations')}
                >
                  Regs
                </button>
                <button 
                  className={`sidebar-tab ${activeTab === 'gazettes' ? 'active' : ''}`}
                  onClick={() => setActiveTab('gazettes')}
                >
                  Gazettes
                </button>
              </div>

              <div className="sidebar-list">
                {filteredSidebarNodes.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', fontSize: '11px' }}>No matches found</div>
                ) : (
                  filteredSidebarNodes.map(node => (
                    <div 
                      key={node.id} 
                      className={`sidebar-item ${selectedDocId === node.id ? 'active' : ''}`}
                      onClick={() => setSelectedDocId(node.id)}
                    >
                      <div><strong>{node.id}</strong></div>
                      <div style={{ opacity: 0.8, fontSize: '10px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {node.title}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>

            {/* Right Pane Document Viewer */}
            <main className="doc-viewer">
              <div className="doc-navigation-actions">
                <button className="btn-action" onClick={() => setSelectedDocId(null)}>
                  <ArrowLeft size={14} /> Back to Dashboard
                </button>
                
                <button 
                  className="btn-action" 
                  onClick={() => setIsolateGraph(!isolateGraph)}
                  style={isolateGraph ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)' } : {}}
                >
                  <Network size={14} /> {isolateGraph ? 'Show Full Graph' : 'Show Local Graph Map'}
                </button>
              </div>

              {activeDocNode && (
                <article className="doc-viewer-header">
                  <h2 style={{ fontSize: '18px', color: 'var(--text-header)', margin: '0 0 10px 0' }}>
                    {activeDocNode.title}
                  </h2>
                  <div className="doc-meta-grid">
                    <span className="doc-meta-badge">ID: {activeDocNode.id}</span>
                    <span className="doc-meta-badge">TYPE: {activeDocNode.type.toUpperCase()}</span>
                    {activeDocNode.subtype && (
                      <span className="doc-meta-badge" style={{ backgroundColor: activeDocNode.subtype === 'final' ? 'var(--accent-bg)' : 'rgba(239, 68, 68, 0.1)', borderColor: activeDocNode.subtype === 'final' ? 'var(--accent-border)' : 'rgba(239, 68, 68, 0.3)', color: activeDocNode.subtype === 'final' ? 'var(--accent-color)' : 'var(--text-danger)' }}>
                        SUBTYPE: {activeDocNode.subtype.toUpperCase()}
                      </span>
                    )}
                    {activeDocNode.date && <span>DATE ENACTED: {activeDocNode.date}</span>}
                    <span>FILESIZE: {(activeDocNode.content_length / 1024).toFixed(1)} KB</span>
                    <span style={{ color: 'var(--accent-color)' }}>CONNECTIONS: {activeDocNode.linksCount} references</span>
                  </div>
                </article>
              )}

              {/* Toggle displaying isolated graph view above/within the viewer */}
              {isolateGraph && (
                <div className="bento-card" style={{ height: '300px', marginBottom: '20px', padding: 0 }}>
                  <div className="graph-container-wrapper">
                    <canvas 
                      ref={canvasRef} 
                      className="graph-canvas"
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUpOrLeave}
                      onMouseLeave={handleCanvasMouseUpOrLeave}
                      onWheel={handleCanvasWheel}
                    />
                    <div className="graph-controls">
                      <button className="btn-graph-control" title="Zoom In" onClick={handleGraphZoomIn}><Maximize2 size={12} /></button>
                      <button className="btn-graph-control" title="Zoom Out" onClick={handleGraphZoomOut}><Minimize2 size={12} /></button>
                      <button className="btn-graph-control" title="Reset View" onClick={handleGraphReset}><RefreshCw size={12} /></button>
                    </div>
                    <div className="graph-legend" style={{ fontSize: '8px', padding: '4px 6px' }}>
                      <div className="legend-item"><span className="legend-dot act" /> Acts</div>
                      <div className="legend-item"><span className="legend-dot reg" /> Regulations</div>
                      <div className="legend-item"><span className="legend-dot gazette" /> Gazettes</div>
                    </div>
                    {hoveredNode && (
                      <div className="graph-tooltip" style={{ left: `${tooltipPos.x}px`, top: `${tooltipPos.y}px` }}>
                        <div style={{ fontWeight: 'bold', color: 'var(--accent-color)' }}>{hoveredNode.id}</div>
                        <div style={{ fontSize: '10px' }}>{hoveredNode.title}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Document Markdown Content Box */}
              <div className="doc-content-box">
                {loadingDoc ? (
                  <div className="loading-indicator">
                    <RefreshCw className="animate-spin" size={24} />
                    <span>FETCHING FILE DATA FROM SYSTEM STORAGE...</span>
                  </div>
                ) : (
                  <>
                    <div 
                      className="doc-markdown"
                      dangerouslySetInnerHTML={{ __html: marked.parse(activeDocContent || '*Empty Document*') }}
                    />
                    
                    {/* Cross Citation tags section */}
                    {(crossReferences.referencesTo.length > 0 || crossReferences.referencedBy.length > 0) && (
                      <section className="cross-references-section">
                        <div className="cross-references-title">Citations and Network Connections</div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                          
                          {crossReferences.referencesTo.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-color)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Citations (Mentions in this doc):
                              </div>
                              <div className="cross-references-grid">
                                {crossReferences.referencesTo.map(ref => (
                                  <button 
                                    key={ref.id} 
                                    className="ref-tag"
                                    onClick={() => { setSelectedDocId(ref.id); setActiveTab(ref.type); }}
                                    title={ref.title}
                                  >
                                    {ref.id}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {crossReferences.referencedBy.length > 0 && (
                            <div>
                              <div style={{ fontSize: '10px', color: 'var(--text-color)', marginBottom: '8px', textTransform: 'uppercase' }}>
                                Cited By (Referenced by other docs):
                              </div>
                              <div className="cross-references-grid">
                                {crossReferences.referencedBy.map(ref => (
                                  <button 
                                    key={ref.id} 
                                    className="ref-tag"
                                    onClick={() => { setSelectedDocId(ref.id); setActiveTab(ref.type); }}
                                    title={ref.title}
                                  >
                                    {ref.id}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                        </div>
                      </section>
                    )}
                  </>
                )}
              </div>
            </main>
          </div>
        )
      )}

      {/* Main Footer Info */}
      <footer className="footer-main">
        CRAN ARCHIVE SYSTEM // TELECOMMUNICATIONS REGULATORY AUTHORITY OF NAMIBIA // COPYRIGHT © 2026. 
        DEVELOPED BY <span>ANTIGRAVITY SYSTEMS</span>. SYSTEM ONLINE.
      </footer>
    </div>
  );
}
