/**
 * OWASP Top 10 2021 - Interactive D3.js Tree Visualization
 * Complete fix for tree rendering
 */

let owaspTree;
let d3TreeData;
let svg, g, tree, diagonal, zoom;
let root, nodes, links;
let i = 0; // incremental id for nodes
let duration = 700;
const treeEase = d3.easeCubicInOut;
let treeLayout;
let searchInputElement;
let searchResultsContainer;
let searchClearButton;
const searchIndexData = Array.isArray(window.OwaspSearchIndex) ? window.OwaspSearchIndex : [];
let activeSearchTerm = '';
let treeMargin;
let treeWidth;
let treeHeight;
let lastSearchMatches = [];

// Initialize tree when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, checking for tree data...');
    
    // Wait a bit for the page to fully load
    setTimeout(() => {
        // Check if tree data is available in the page
        if (typeof treeData !== 'undefined' && treeData) {
            try {
                console.log('Found tree data');
                const parsedData = (typeof treeData === 'string') ? JSON.parse(treeData) : treeData;
                console.log('Tree data ready:', parsedData);
                initializeOwaspTree(parsedData);
            } catch (e) {
                console.error('Error handling tree data:', e);
                showTreeError('Error handling tree data: ' + e.message);
            }
        } else {
            console.log('No tree data found, showing loading message');
            showTreeLoading();
        }
    }, 100);

    // Re-center on resize for better responsiveness
    window.addEventListener('resize', () => {
        try { centerTree(); } catch (e) {}
    });
});

function initializeOwaspTree(treeData) {
    console.log('initializeOwaspTree called with:', treeData);
    
    try {
        // Convert jsTree format to D3 hierarchy
        d3TreeData = convertToD3Format(treeData);
        console.log('Converted D3 data:', d3TreeData);
        
        // Initialize D3 tree visualization
        initializeD3Tree();
        
        // Setup search functionality
        setupTreeSearch();
    } catch (error) {
        console.error('Error in initializeOwaspTree:', error);
        showTreeError('Error initializing tree: ' + error.message);
    }
}

function convertToD3Format(jsTreeData) {
    // Create root node for OWASP framework
    const root = {
        name: "OWASP Top 10 2021",
        description: "Web Application Security Risks",
        type: "root",
        children: []
    };
    
    // Convert each OWASP category
    jsTreeData.forEach(item => {
        const category = {
            name: item.text,
            description: item.data.description,
            type: item.type,
            owasp_id: item.data.owasp_id,
            severity: item.data.severity,
            children: []
        };
        
        // Add child nodes (info and challenge)
        if (item.children) {
            item.children.forEach(child => {
                category.children.push({
                    name: child.text,
                    type: child.type,
                    action: child.data.action,
                    owasp_id: child.data.owasp_id,
                    parent: category
                });
            });
        }
        
        root.children.push(category);
    });
    
    return root;
}

function initializeD3Tree() {
    console.log('Initializing D3 tree...');
    
    try {
        // Clear existing content
        const treeContainer = document.getElementById('owasp-tree');
        if (!treeContainer) {
            console.error('Tree container not found');
            return;
        }
        treeContainer.innerHTML = '';
        
        // Set dimensions and margins
        const margin = { top: 20, right: 120, bottom: 20, left: 120 };
        const width = Math.max(600, treeContainer.offsetWidth - margin.right - margin.left);
        const height = 500;
        treeMargin = margin;
        treeWidth = width;
        treeHeight = height;
        
        console.log('Container dimensions:', { width, height, containerWidth: treeContainer.offsetWidth });
        
        // Create SVG
        svg = d3.select('#owasp-tree')
            .append('svg')
            .attr('width', '100%')
            .attr('height', height + margin.top + margin.bottom)
            .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .style('font', '12px sans-serif');
        
        // Create zoom behavior
        zoom = d3.zoom()
            .scaleExtent([0.1, 3])
            .on('zoom', function(event) {
                g.attr('transform', event.transform);
            });
        
        svg.call(zoom);
        
        // Create container group
        g = svg.append('g')
            .attr('transform', `translate(${margin.left},${margin.top})`);
        
        // Create tree layout with better spacing
        treeLayout = d3.tree()
            .size([height, width])
            .separation((a, b) => (a.parent === b.parent ? 1 : 2) / a.depth);
        
        // Create diagonal path generator
        diagonal = d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x);
        
        // Initialize with data
        root = d3.hierarchy(d3TreeData);
        root.x0 = height / 2;
        root.y0 = 0;
        
        console.log('Root node created:', root);
        
        // Keep root expanded, but collapse the leaf nodes (challenge/info) initially
        if (root.children) {
            root.children.forEach(vulnerabilityNode => {
                // Keep vulnerability nodes expanded, but collapse their children (challenge/info)
                if (vulnerabilityNode.children) {
                    vulnerabilityNode.children.forEach(collapse);
                }
            });
        }
        
        update(root);
        
        // Center the tree after initial render
        setTimeout(() => {
            try {
                centerTree();
            } catch (e) {
                console.log('Tree will be centered once fully rendered');
            }
        }, 500);
        
    } catch (error) {
        console.error('Error initializing D3 tree:', error);
        showTreeError('Error initializing tree visualization: ' + error.message);
    }
}

function collapse(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapse);
        d.children = null;
    }
}

function expand(d) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
}

function expandAncestors(node) {
    let current = node;
    let expanded = false;

    while (current) {
        if (current._children) {
            current.children = current._children;
            current._children = null;
            expanded = true;
        }
        current = current.parent;
    }

    return expanded;
}

function update(source) {
    // Compute the new tree layout
    const treeData = treeLayout(root);
    nodes = treeData.descendants();
    links = treeData.descendants().slice(1);
    
    // Normalize for fixed-depth
    nodes.forEach(d => d.y = d.depth * 200);
    
    // Update the nodes
    const node = g.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));
    
    // Enter any new nodes at the parent's previous position
    const nodeEnter = node.enter().append('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${source.y0},${source.x0})`)
        .attr('role', 'treeitem')
        .attr('tabindex', 0)
        .attr('data-node-id', d => formatNodeIdentifier(d))
        .attr('data-has-children', d => (isExpandableNode(d) ? 'true' : 'false'))
        .attr('data-expanded', d => (d.children ? 'true' : 'false'))
        .attr('aria-level', d => d.depth + 1)
        .attr('aria-expanded', d => (isExpandableNode(d) ? (d.children ? 'true' : 'false') : null))
        .classed('has-children-node', d => isExpandableNode(d))
        .classed('is-expanded', d => Boolean(d.children))
        .classed('is-collapsed', d => !d.children && isExpandableNode(d))
        .on('click', click)
        .on('keydown', handleNodeKeydown)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)
        .style('cursor', 'pointer');
    
    // Add circles for the nodes with enhanced styling
    nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', d => getNodeColor(d))
        .style('stroke', d => getNodeStrokeColor(d))
        .style('stroke-width', d => getNodeStrokeWidth(d))
        .style('cursor', 'pointer')
        .attr('class', d => {
            let classes = [];
            if (d.data.type) classes.push(d.data.type);
            if (d.children || d._children) classes.push('has-children');
            return classes.join(' ');
        });
    
    // Add labels for the nodes
    nodeEnter.append('text')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -13 : 13)
        .attr('text-anchor', d => d.children || d._children ? 'end' : 'start')
        .text(d => truncateText(d.data.name, 35))
        .style('fill-opacity', 1e-6)
        .style('font-size', d => getNodeFontSize(d))
        .style('font-weight', d => getNodeFontWeight(d))
        .style('cursor', 'pointer');
    
    // Add icons for different node types
    nodeEnter.append('text')
        .attr('class', 'node-icon')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -30 : -10)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Font Awesome 6 Free')
        .style('font-weight', '900')
        .style('font-size', '14px')
        .style('fill', d => getIconColor(d))
        .text(d => getNodeIcon(d))
        .style('cursor', 'pointer');
    
    // Transition nodes to their new position
    const nodeUpdate = nodeEnter.merge(node);

    nodeUpdate
        .attr('data-node-id', d => formatNodeIdentifier(d))
        .attr('data-has-children', d => (isExpandableNode(d) ? 'true' : 'false'))
        .attr('data-expanded', d => (d.children ? 'true' : 'false'))
        .attr('aria-level', d => d.depth + 1)
        .attr('aria-expanded', d => (isExpandableNode(d) ? (d.children ? 'true' : 'false') : null))
        .classed('has-children-node', d => isExpandableNode(d))
        .classed('is-expanded', d => Boolean(d.children))
        .classed('is-collapsed', d => !d.children && isExpandableNode(d))
        .attr('tabindex', 0)
        .on('click', click)
        .on('keydown', handleNodeKeydown)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut)
        .style('cursor', 'pointer');
    
    nodeUpdate.transition()
        .duration(duration)
        .ease(treeEase)
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    // Update the node attributes and style
    nodeUpdate.select('circle')
        .transition()
        .duration(duration)
        .ease(treeEase)
        .attr('r', d => getNodeRadius(d))
        .style('fill', d => getNodeColor(d))
        .style('stroke', d => getNodeStrokeColor(d));
    
    nodeUpdate.select('text')
        .transition()
        .duration(duration)
        .ease(treeEase)
        .style('fill-opacity', 1);
    
    // Update icons for expandable nodes
    nodeUpdate.select('.node-icon')
        .text(d => getNodeIcon(d));
    
    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
        .ease(treeEase)
        .attr('transform', d => `translate(${source.y},${source.x})`)
        .remove();
    
    nodeExit.select('circle')
        .attr('r', 1e-6);
    
    nodeExit.select('text')
        .style('fill-opacity', 1e-6);
    
    // Update the links
    const link = g.selectAll('path.link')
        .data(links, d => d.id);
    
    // Enter any new links at the parent's previous position
    const linkEnter = link.enter().insert('path', 'g')
        .attr('class', 'link')
        .style('fill', 'none')
        .style('stroke', '#00d4ff') // HackerOne cyan for dark theme
        .style('stroke-opacity', '0.8') // Increased opacity for better visibility
        .style('stroke-width', '2px')
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });
    
    // Transition links to their new position
    linkEnter.merge(link).transition()
        .duration(duration)
        .ease(treeEase)
        .attr('d', d => diagonal({source: {x: d.parent.x, y: d.parent.y}, target: {x: d.x, y: d.y}}));
    
    // Remove any exiting links
    link.exit().transition()
        .duration(duration)
        .ease(treeEase)
        .attr('d', d => {
            const o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
        })
        .remove();
    
    // Store the old positions for transition
    nodes.forEach(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Click handler for nodes
function click(event, d) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }

    console.log('Node activated:', d.data, 'Has children:', !!d.children, 'Has _children:', !!d._children);

    if (isLeafNode(d)) {
        handleLeafNode(d);
        return;
    }

    const isExpanded = toggleNodeChildren(d);
    if (isExpanded === null) {
        return;
    }

    console.log(`${isExpanded ? 'Expanding' : 'Collapsing'} node:`, d.data.name);
    update(d);
}

function handleLeafNode(d) {
    if (typeof handleNodeClick === 'function') {
        handleNodeClick(d.data);
    } else {
        console.log('Leaf node activated:', d.data);
    }
}

function handleNodeKeydown(event, d) {
    if (!event) return;
    const actionableKeys = ['Enter', ' '];
    if (actionableKeys.includes(event.key)) {
        event.preventDefault();
        click(event, d);
    }
}

function toggleNodeChildren(d) {
    if (d.children) {
        d._children = d.children;
        d.children = null;
        return false;
    }

    if (d._children) {
        d.children = d._children;
        d._children = null;
        return true;
    }

    return null;
}

function isExpandableNode(d) {
    return Boolean(d.children) || Boolean(d._children);
}

function isLeafNode(d) {
    return !isExpandableNode(d);
}

function formatNodeIdentifier(d) {
    if (d.data.owasp_id) {
        return d.data.owasp_id;
    }
    if (d.data.id) {
        return d.data.id;
    }
    if (d.data.name) {
        return d.data.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-_]/g, '');
    }
    return `node-${d.depth}-${d.id || Math.random().toString(36).slice(2, 7)}`;
}

// Mouse event handlers
function handleMouseOver(event, d) {
    d3.select(this).select('circle').style('stroke-width', '3px');
}

function handleMouseOut(event, d) {
    d3.select(this).select('circle').style('stroke-width', d => getNodeStrokeWidth(d));
}

// Node styling functions
function getNodeColor(d) {
    if (d.data.type === 'root') return '#00d4ff'; // HackerOne cyan
    if (d.data.type === 'challenge') return '#00ff88'; // Green
    if (d.data.type === 'info') return '#ff6b35'; // Orange
    return '#b0b0b0'; // Light gray
}

function getNodeStrokeColor(d) {
    if (d.children || d._children) return '#00d4ff'; // HackerOne cyan for parent nodes
    return '#ffffff'; // White for leaf nodes
}

function getNodeStrokeWidth(d) {
    if (d.children || d._children) return '2px';
    return '1px';
}

function getNodeRadius(d) {
    if (d.data.type === 'root') return 8;
    if (d.children || d._children) return 6;
    return 4;
}

function getNodeFontSize(d) {
    if (d.data.type === 'root') return '14px';
    if (d.children || d._children) return '12px';
    return '11px';
}

function getNodeFontWeight(d) {
    if (d.data.type === 'root') return 'bold';
    if (d.children || d._children) return '600';
    return '400';
}

function getNodeIcon(d) {
    if (d.data.type === 'root') return '\uf132'; // fa-shield-alt
    if (d.data.type === 'challenge') return '\uf024'; // fa-flag
    if (d.data.type === 'info') return '\uf05a'; // fa-info-circle
    if (d.data.type === 'vulnerability') {
        // Show expand/collapse icon for vulnerability nodes
        if (d.children) return '\uf146'; // fa-minus-circle (can collapse)
        if (d._children) return '\uf0fe'; // fa-plus-circle (can expand)
        return '\uf188'; // fa-bug (fallback)
    }
    return '\uf111'; // fa-circle
}

function getIconColor(d) {
    if (d.data.type === 'root') return '#00d4ff';
    if (d.data.type === 'challenge') return '#00ff88';
    if (d.data.type === 'info') return '#ff6b35';
    if (d.data.type === 'vulnerability') return '#ff4d8d';
    return '#b0b0b0';
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// Center the tree in the viewport
function centerTree() {
    try {
        if (!svg || !g) return;
        
        const allNodes = g.selectAll('.node').nodes();
        if (allNodes.length === 0) return;
        
        // Calculate bounds of all nodes
        let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
        
        allNodes.forEach(node => {
            const transform = d3.select(node).attr('transform');
            if (transform) {
                const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
                if (match) {
                    const x = parseFloat(match[1]);
                    const y = parseFloat(match[2]);
                    minX = Math.min(minX, x);
                    maxX = Math.max(maxX, x);
                    minY = Math.min(minY, y);
                    maxY = Math.max(maxY, y);
                }
            }
        });
        
        if (isFinite(minX) && isFinite(maxX) && isFinite(minY) && isFinite(maxY)) {
            const centerX = (minX + maxX) / 2;
            const centerY = (minY + maxY) / 2;
            const offsetX = 400 / 2 - centerX; // Use fixed width for centering
            const offsetY = 300 / 2 - centerY; // Use fixed height for centering
            
            svg.transition()
                .duration(750)
                .ease(treeEase)
                .call(zoom.transform, d3.zoomIdentity.translate(offsetX, offsetY));
        }
    } catch (e) {
        console.log('Tree centering error:', e);
    }
}

function focusTreeOnNode(node) {
    if (!svg || !zoom || !node) {
        return;
    }

    const container = document.getElementById('owasp-tree');
    if (!container) {
        return;
    }

    const bounds = container.getBoundingClientRect();
    const marginLeft = treeMargin ? treeMargin.left : 0;
    const marginTop = treeMargin ? treeMargin.top : 0;
    const targetX = node.x + marginTop;
    const targetY = node.y + marginLeft;
    const translateX = bounds.width / 2 - targetY;
    const translateY = bounds.height / 2 - targetX;

    svg.transition()
        .duration(600)
        .ease(treeEase)
        .call(zoom.transform, d3.zoomIdentity.translate(translateX, translateY));
}

// Setup search functionality
function setupTreeSearch() {
    searchInputElement = document.getElementById('search-input');
    searchResultsContainer = document.getElementById('search-results');
    searchClearButton = document.getElementById('search-clear');

    if (searchInputElement) {
        searchInputElement.addEventListener('input', (event) => handleSearchInput(event.target.value));
        searchInputElement.addEventListener('focus', () => {
            if (activeSearchTerm.length >= 2) {
                renderSearchResults(filterSearchIndex(activeSearchTerm));
            }
        });
        searchInputElement.addEventListener('keydown', handleSearchKeydown);
    }

    if (searchClearButton) {
        searchClearButton.addEventListener('click', clearSearchUI);
        searchClearButton.classList.add('d-none');
    }

    document.addEventListener('click', (event) => {
        if (!searchResultsContainer) {
            return;
        }
        if (searchResultsContainer.contains(event.target) || event.target === searchInputElement) {
            return;
        }
        hideSearchResults();
    });
}

// Search tree functionality
function searchTree(searchTerm) {
    if (!g || !nodes) return;

    const normalizedTerm = (searchTerm || '').trim().toLowerCase();
    if (normalizedTerm.length < 2) {
        clearSearch();
        return;
    }

    activeSearchTerm = normalizedTerm;

    const matchedNodes = [];
    let expandedPath = false;

    nodes.forEach((node) => {
        const searchableChunks = [
            node.data.name || '',
            node.data.type || '',
            node.data.owasp_id || '',
        ];

        if (node.data.summary) {
            searchableChunks.push(
                node.data.summary.title || '',
                node.data.summary.description || ''
            );
        }

        if (node.data.description) {
            searchableChunks.push(node.data.description);
        }

        const haystack = searchableChunks.join(' ').toLowerCase();

        if (haystack.includes(normalizedTerm)) {
            matchedNodes.push(node);
            if (expandAncestors(node)) {
                expandedPath = true;
            }
        }
    });

    const matchIds = new Set(matchedNodes.map(match => match.id));

    if (expandedPath) {
        update(root);
    }

    g.selectAll('.node')
        .classed('search-highlight', d => matchIds.has(d.id))
        .classed('search-dim', d => matchIds.size > 0 && !matchIds.has(d.id));

    if (matchIds.size > 0) {
        const freshMatch = nodes.find(node => matchIds.has(node.id));
        if (freshMatch) {
            focusTreeOnNode(freshMatch);
        }
    }
}

// Clear search highlighting
function clearSearch() {
    if (!g || !nodes) return;
    activeSearchTerm = '';
    g.selectAll('.node')
        .classed('search-highlight', false)
        .classed('search-dim', false);
}

function handleSearchInput(rawValue) {
    const value = (rawValue || '').trim();
    if (searchClearButton) {
        if (value.length === 0) {
            searchClearButton.classList.add('d-none');
        } else {
            searchClearButton.classList.remove('d-none');
        }
    }

    if (value.length < 2) {
        lastSearchMatches = [];
        hideSearchResults();
        clearSearch();
        return;
    }

    lastSearchMatches = filterSearchIndex(value);
    renderSearchResults(lastSearchMatches);
    searchTree(value);
}

function handleSearchKeydown(event) {
    if (event.key === 'Escape') {
        clearSearchUI();
        return;
    }

    if (event.key === 'Enter') {
        if (lastSearchMatches.length > 0) {
            focusNodeInTree(lastSearchMatches[0].id);
            hideSearchResults();
        }
    }
}

function filterSearchIndex(term) {
    const normalized = term.trim().toLowerCase();
    if (normalized.length < 2) {
        return [];
    }

    return searchIndexData
        .filter((item) => {
            const haystack = [
                item.id,
                item.title,
                item.description,
                item.challengeTitle
            ].filter(Boolean).join(' ').toLowerCase();
            return haystack.includes(normalized);
        })
        .slice(0, 10);
}

function renderSearchResults(matches) {
    if (!searchResultsContainer) return;

    searchResultsContainer.innerHTML = '';

    if (!matches.length) {
        searchResultsContainer.classList.remove('d-none');
        const emptyState = document.createElement('div');
        emptyState.className = 'search-results__empty';
        emptyState.textContent = 'No matching vulnerabilities found';
        searchResultsContainer.appendChild(emptyState);
        return;
    }

    searchResultsContainer.classList.remove('d-none');

    matches.forEach((item) => {
        const resultItem = document.createElement('div');
        resultItem.className = 'search-result-item';
        resultItem.setAttribute('role', 'option');
        resultItem.dataset.owaspId = item.id;

        const header = document.createElement('div');
        header.className = 'search-result-item__header';
        header.innerHTML = `<span class="search-result-item__badge">${item.id}</span><span class="search-result-item__title">${item.title || ''}</span>`;

        const meta = document.createElement('div');
        meta.className = 'search-result-item__meta';
        const severity = item.severity ? `<span class="badge rounded-pill bg-info text-uppercase">${item.severity}</span>` : '';
        const challengeSnippet = item.challengeTitle ? `<span class="search-result-item__meta-text">${item.challengeTitle}</span>` : '';
        meta.innerHTML = `${severity}${challengeSnippet ? ` · ${challengeSnippet}` : ''}`;

        const desc = document.createElement('p');
        desc.className = 'search-result-item__desc';
        desc.textContent = item.description || '';

        const actions = document.createElement('div');
        actions.className = 'search-result-item__actions';

        const highlightButton = document.createElement('button');
        highlightButton.type = 'button';
        highlightButton.className = 'btn btn-link btn-sm px-0';
        highlightButton.innerHTML = '<i class="fas fa-highlighter me-1"></i>Highlight in tree';
        highlightButton.addEventListener('click', (evt) => {
            evt.preventDefault();
            focusNodeInTree(item.id);
        });

        const detailLink = document.createElement('a');
        detailLink.href = item.url;
        detailLink.className = 'btn btn-outline-primary btn-sm';
        detailLink.innerHTML = '<i class="fas fa-book-open me-1"></i>Details';

        const challengeLink = document.createElement('a');
        challengeLink.href = item.challengeUrl;
        challengeLink.className = 'btn btn-primary btn-sm';
        challengeLink.innerHTML = '<i class="fas fa-flag me-1"></i>Challenge';

        actions.append(highlightButton, detailLink, challengeLink);

        resultItem.append(header, meta, desc, actions);
        searchResultsContainer.appendChild(resultItem);
    });
}

function hideSearchResults() {
    if (searchResultsContainer) {
        searchResultsContainer.classList.add('d-none');
    }
}

function clearSearchUI() {
    if (searchInputElement) {
        searchInputElement.value = '';
        searchInputElement.focus();
    }
    if (searchClearButton) {
        searchClearButton.classList.add('d-none');
    }
    lastSearchMatches = [];
    hideSearchResults();
    clearSearch();
}

function focusNodeInTree(owaspId) {
    if (!nodes) return;
    let target = nodes.find(node => node.data.owasp_id === owaspId || formatNodeIdentifier(node) === owaspId);

    if (!target) {
        return;
    }

    if (expandAncestors(target)) {
        update(target);
        target = nodes.find(node => node.data.owasp_id === owaspId || formatNodeIdentifier(node) === owaspId) || target;
    }

    const targetId = target.id;

    g.selectAll('.node')
        .classed('search-highlight', d => d.id === targetId)
        .classed('search-dim', d => d.id !== targetId);

    focusTreeOnNode(target);
}

// Show loading state
function showTreeLoading() {
    const treeContainer = document.getElementById('owasp-tree');
    if (treeContainer) {
        treeContainer.innerHTML = `
            <div class="text-center p-5">
                <div class="loading mb-3"></div>
                <h5 class="text-primary">Loading OWASP Knowledge Tree</h5>
                <p class="text-muted">Please wait while we prepare the interactive visualization...</p>
            </div>
        `;
    }
}

// Show error state
function showTreeError(message) {
    const treeContainer = document.getElementById('owasp-tree');
    if (treeContainer) {
        treeContainer.innerHTML = `
            <div class="text-center p-5">
                <i class="fas fa-exclamation-triangle text-warning fa-2x mb-3"></i>
                <h5 class="text-warning">Tree Loading Error</h5>
                <p class="text-muted">${message}</p>
                <button class="btn btn-outline btn-sm mt-3" onclick="location.reload()">
                    <i class="fas fa-redo me-2"></i>Refresh Page
                </button>
            </div>
        `;
    }
}

// Export functions for global access
window.OwaspTree = {
    expandAll: () => { 
        if (root) { 
            expandAll(root); 
            update(root); 
            // Center tree after expanding
            setTimeout(() => centerTree(), 100);
        } 
    },
    collapseAll: () => { 
        if (root) { 
            root.children.forEach(collapse); 
            update(root); 
            // Center tree after collapsing
            setTimeout(() => centerTree(), 100);
        } 
    },
    centerTree: centerTree,
    searchTree: searchTree
};

function expandAll(d) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if (d.children) {
        d.children.forEach(expandAll);
    }
}
