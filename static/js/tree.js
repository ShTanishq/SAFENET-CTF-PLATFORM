/**
 * OWASP Top 10 2021 - Interactive D3.js Tree Visualization
 * Inspired by osintframework.com
 */

let owaspTree;
let d3TreeData;
let svg, g, tree, diagonal, zoom;
let root, nodes, links;
let duration = 750;
let treeLayout;

function initializeOwaspTree(treeData) {
    // Convert jsTree format to D3 hierarchy
    d3TreeData = convertToD3Format(treeData);
    
    // Initialize D3 tree visualization
    initializeD3Tree();
    
    // Setup search functionality
    setupTreeSearch();
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
    // Clear existing content
    $('#owasp-tree').empty();
    
    // Set dimensions and margins
    const container = document.getElementById('owasp-tree');
    const margin = { top: 20, right: 120, bottom: 20, left: 120 };
    const width = container.offsetWidth - margin.right - margin.left;
    const height = 800 - margin.top - margin.bottom;
    
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
    
    // Create tree layout
    treeLayout = d3.tree().size([height, width]);
    
    // Create diagonal path generator
    diagonal = d3.linkHorizontal()
        .x(d => d.y)
        .y(d => d.x);
    
    // Initialize with data
    root = d3.hierarchy(d3TreeData);
    root.x0 = height / 2;
    root.y0 = 0;
    
    // Collapse children initially except root
    root.children.forEach(collapse);
    
    update(root);
    
    // Center the tree after initial render
    setTimeout(() => {
        const rootNode = g.select('.node');
        if (!rootNode.empty()) {
            try {
                const bbox = rootNode.node().getBBox();
                const centerX = width / 2 - bbox.x;
                const centerY = height / 2 - bbox.y;
                svg.call(zoom.transform, d3.zoomIdentity.translate(centerX, centerY));
            } catch (e) {
                console.log('Tree centering will be available after render');
            }
        }
    }, 100);
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

function expandAll(d) {
    if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    if (d.children) {
        d.children.forEach(expandAll);
    }
}

function collapseAll(d) {
    if (d.children) {
        d._children = d.children;
        d._children.forEach(collapseAll);
        d.children = null;
    }
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
        .on('click', click)
        .on('mouseover', handleMouseOver)
        .on('mouseout', handleMouseOut);
    
    // Add circles for the nodes
    nodeEnter.append('circle')
        .attr('r', 1e-6)
        .style('fill', d => getNodeColor(d))
        .style('stroke', d => getNodeStrokeColor(d))
        .style('stroke-width', '2px')
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
        .text(d => truncateText(d.data.name, 30))
        .style('fill-opacity', 1e-6)
        .style('font-size', d => getNodeFontSize(d))
        .style('font-weight', d => getNodeFontWeight(d))
        .style('cursor', 'pointer');
    
    // Add icons for different node types
    nodeEnter.append('text')
        .attr('class', 'node-icon')
        .attr('dy', '.35em')
        .attr('x', d => d.children || d._children ? -25 : -8)
        .attr('text-anchor', 'middle')
        .style('font-family', 'Font Awesome 6 Free')
        .style('font-weight', '900')
        .style('font-size', '14px')
        .style('fill', d => getIconColor(d))
        .text(d => getNodeIcon(d))
        .style('cursor', 'pointer');
    
    // Transition nodes to their new position
    const nodeUpdate = nodeEnter.merge(node);
    
    nodeUpdate.transition()
        .duration(duration)
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    // Update the node attributes and style
    nodeUpdate.select('circle')
        .transition()
        .duration(duration)
        .attr('r', d => getNodeRadius(d))
        .style('fill', d => getNodeColor(d))
        .style('stroke', d => getNodeStrokeColor(d));
    
    nodeUpdate.select('text')
        .transition()
        .duration(duration)
        .style('fill-opacity', 1);
    
    // Remove any exiting nodes
    const nodeExit = node.exit().transition()
        .duration(duration)
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
        .style('stroke', '#555')
        .style('stroke-opacity', '0.6')
        .style('stroke-width', '2px')
        .attr('d', d => {
            const o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
        });
    
    // Transition links to their new position
    linkEnter.merge(link).transition()
        .duration(duration)
        .attr('d', diagonal);
    
    // Remove any exiting links
    link.exit().transition()
        .duration(duration)
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

let i = 0;

function click(event, d) {
    // Always show node information
    showNodeInfo(d.data);
    
    // Only handle navigation for leaf nodes (nodes without children)
    if (d.data.action && (!d.children && !d._children)) {
        // This is a leaf node with an action - don't navigate automatically
        // Let user click the button in the info panel instead
        return;
    }
    
    // For nodes with children, toggle expand/collapse
    if (d.children) {
        d._children = d.children;
        d.children = null;
    } else if (d._children) {
        d.children = d._children;
        d._children = null;
    }
    
    update(d);
}

function getNodeColor(d) {
    switch (d.data.type) {
        case 'root':
            return '#2E86AB';
        case 'vulnerability':
            return getSeverityColor(d.data.severity);
        case 'challenge':
            return '#28a745';
        case 'info':
            return '#17a2b8';
        default:
            return '#6c757d';
    }
}

function getNodeStrokeColor(d) {
    return d.children || d._children ? '#fff' : getNodeColor(d);
}

function getSeverityColor(severity) {
    switch (severity) {
        case 'Critical':
            return '#dc3545';
        case 'High':
            return '#fd7e14';
        case 'Medium':
            return '#ffc107';
        case 'Low':
            return '#28a745';
        default:
            return '#6c757d';
    }
}

function getNodeRadius(d) {
    switch (d.data.type) {
        case 'root':
            return 12;
        case 'vulnerability':
            return 8;
        default:
            return 6;
    }
}

function getNodeFontSize(d) {
    switch (d.data.type) {
        case 'root':
            return '16px';
        case 'vulnerability':
            return '14px';
        default:
            return '12px';
    }
}

function getNodeFontWeight(d) {
    return d.data.type === 'root' || d.data.type === 'vulnerability' ? 'bold' : 'normal';
}

function getNodeIcon(d) {
    switch (d.data.type) {
        case 'root':
            return '\uf3ed'; // shield-alt
        case 'vulnerability':
            return '\uf188'; // bug
        case 'challenge':
            return '\uf024'; // flag
        case 'info':
            return '\uf05a'; // info-circle
        default:
            return '\uf07c'; // folder
    }
}

function getIconColor(d) {
    switch (d.data.type) {
        case 'root':
            return '#2E86AB';
        case 'vulnerability':
            return '#dc3545';
        case 'challenge':
            return '#28a745';
        case 'info':
            return '#17a2b8';
        default:
            return '#6c757d';
    }
}

function truncateText(text, maxLength) {
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
}

function handleMouseOver(event, d) {
    // Create tooltip
    const tooltip = d3.select('body').append('div')
        .attr('class', 'tree-tooltip')
        .style('position', 'absolute')
        .style('background', 'rgba(0, 0, 0, 0.8)')
        .style('color', 'white')
        .style('padding', '10px')
        .style('border-radius', '5px')
        .style('font-size', '12px')
        .style('max-width', '300px')
        .style('z-index', '1000')
        .style('opacity', 0);
    
    let tooltipHTML = `<strong>${d.data.name}</strong>`;
    if (d.data.description) {
        tooltipHTML += `<br><span style="font-size: 11px;">${d.data.description}</span>`;
    }
    if (d.data.severity) {
        tooltipHTML += `<br><span style="color: ${getSeverityColor(d.data.severity)};">Severity: ${d.data.severity}</span>`;
    }
    
    tooltip.html(tooltipHTML)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .transition()
        .duration(200)
        .style('opacity', 1);
}

function handleMouseOut() {
    d3.selectAll('.tree-tooltip').remove();
}

// Remaining functions from original implementation
function handleNodeClick(node) {
    // Add visual feedback for selection
    $('.node').removeClass('active-node');
    d3.select(event.currentTarget).classed('active-node', true);
    
    // Show node information
    showNodeInfo(node.data);
}

function handleNodeActivation(node) {
    const nodeData = node.data;
    
    if (nodeData.action === 'view_vulnerability') {
        window.location.href = `/vulnerability/${nodeData.owasp_id}`;
    } else if (nodeData.action === 'start_challenge') {
        window.location.href = `/challenge/${nodeData.owasp_id}`;
    }
}

function showVulnerabilityInfo(owaspId) {
    // Redirect to vulnerability info page
    window.location.href = `/vulnerability/${owaspId}`;
}

function showNodeInfo(nodeData) {
    // Update info panel with rich node details
    const infoPanel = document.getElementById('node-info');
    if (infoPanel) {
        let content = '';
        
        if (nodeData.type === 'root') {
            content = `
                <div class="text-center">
                    <i class="fas fa-shield-alt fa-3x text-primary mb-3"></i>
                    <h5 class="text-primary">${nodeData.name}</h5>
                    <p class="text-muted">${nodeData.description}</p>
                    <div class="row g-2 mt-3">
                        <div class="col-6">
                            <div class="bg-light rounded p-2 text-center">
                                <small class="text-muted">Categories</small>
                                <h6 class="mb-0">10</h6>
                            </div>
                        </div>
                        <div class="col-6">
                            <div class="bg-light rounded p-2 text-center">
                                <small class="text-muted">Challenges</small>
                                <h6 class="mb-0">10</h6>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        } else if (nodeData.type === 'vulnerability') {
            content = `
                <div class="mb-3">
                    <div class="d-flex align-items-center mb-2">
                        <i class="fas fa-bug text-danger me-2"></i>
                        <h6 class="mb-0">${nodeData.name}</h6>
                    </div>
                    ${nodeData.severity ? `<span class="badge bg-${getSeverityBadgeClass(nodeData.severity)} mb-2">${nodeData.severity} Severity</span>` : ''}
                </div>
                ${nodeData.description ? `<p class="text-muted small">${nodeData.description}</p>` : ''}
                <div class="mt-3">
                    <small class="text-muted">Click to expand and see:</small>
                    <ul class="small mt-1 mb-0">
                        <li>Vulnerability information</li>
                        <li>CTF Challenge</li>
                    </ul>
                </div>
            `;
        } else if (nodeData.type === 'challenge') {
            content = `
                <div class="text-center">
                    <i class="fas fa-flag text-success fa-2x mb-2"></i>
                    <h6 class="text-success">${nodeData.name}</h6>
                    <p class="text-muted small">Interactive CTF Challenge</p>
                    <button class="btn btn-success btn-sm mt-2" onclick="handleNodeActivation({data: {action: '${nodeData.action}', owasp_id: '${nodeData.owasp_id}'}})">
                        <i class="fas fa-play me-1"></i>
                        Start Challenge
                    </button>
                </div>
            `;
        } else if (nodeData.type === 'info') {
            content = `
                <div class="text-center">
                    <i class="fas fa-info-circle text-info fa-2x mb-2"></i>
                    <h6 class="text-info">${nodeData.name}</h6>
                    <p class="text-muted small">Educational Content</p>
                    <button class="btn btn-info btn-sm mt-2" onclick="handleNodeActivation({data: {action: '${nodeData.action}', owasp_id: '${nodeData.owasp_id}'}})">
                        <i class="fas fa-book me-1"></i>
                        Learn More
                    </button>
                </div>
            `;
        }
        
        infoPanel.innerHTML = content;
    }
}

function getSeverityBadgeClass(severity) {
    switch (severity) {
        case 'Critical': return 'danger';
        case 'High': return 'warning';
        case 'Medium': return 'info';
        case 'Low': return 'success';
        default: return 'secondary';
    }
}

function setupTreeSearch() {
    const searchInput = document.getElementById('tree-search');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            searchTree(searchTerm);
        });
    }
    
    // Add control buttons
    setupTreeControls();
}

function searchTree(searchTerm) {
    if (!searchTerm) {
        // Reset all nodes to normal state
        g.selectAll('.node')
            .classed('search-match search-dimmed', false)
            .style('opacity', 1);
        g.selectAll('.link').style('opacity', 0.4);
        return;
    }
    
    // Find matching nodes
    const matches = nodes.filter(d => 
        d.data.name.toLowerCase().includes(searchTerm) ||
        (d.data.description && d.data.description.toLowerCase().includes(searchTerm)) ||
        (d.data.owasp_id && d.data.owasp_id.toLowerCase().includes(searchTerm))
    );
    
    // Update node classes for search highlighting
    g.selectAll('.node').each(function(d) {
        const node = d3.select(this);
        const isMatch = matches.some(match => match.id === d.id);
        
        node.classed('search-match', isMatch)
            .classed('search-dimmed', !isMatch)
            .style('opacity', isMatch ? 1 : 0.3);
    });
    
    // Update link opacity
    g.selectAll('.link').style('opacity', d => {
        const isMatch = matches.some(match => match.id === d.id || match.id === d.parent?.id);
        return isMatch ? 0.6 : 0.15;
    });
    
    // Auto-expand nodes to show matches
    matches.forEach(match => {
        let current = match.parent;
        while (current) {
            if (current._children) {
                current.children = current._children;
                current._children = null;
            }
            current = current.parent;
        }
    });
    
    // Update the tree to show expanded nodes
    if (matches.length > 0) {
        update(root);
    }
}

function setupTreeControls() {
    // Add expand/collapse all buttons
    const controlsContainer = document.getElementById('tree-controls');
    if (controlsContainer) {
        controlsContainer.innerHTML = `
            <div class="btn-group mb-3" role="group">
                <button type="button" class="btn btn-outline-primary btn-sm" id="expand-all">
                    <i class="fas fa-expand-arrows-alt"></i> Expand All
                </button>
                <button type="button" class="btn btn-outline-secondary btn-sm" id="collapse-all">
                    <i class="fas fa-compress-arrows-alt"></i> Collapse All
                </button>
                <button type="button" class="btn btn-outline-info btn-sm" id="center-tree">
                    <i class="fas fa-crosshairs"></i> Center
                </button>
            </div>
        `;
        
        // Add event listeners
        document.getElementById('expand-all').addEventListener('click', () => {
            expandAll(root);
            update(root);
        });
        
        document.getElementById('collapse-all').addEventListener('click', () => {
            root.children.forEach(collapse);
            update(root);
        });
        
        document.getElementById('center-tree').addEventListener('click', centerTree);
    }
}

function centerTree() {
    const bounds = g.node().getBBox();
    const parent = g.node().parentElement;
    const fullWidth = parent.clientWidth || parent.parentNode.clientWidth;
    const fullHeight = parent.clientHeight || parent.parentNode.clientHeight;
    const width = bounds.width;
    const height = bounds.height;
    const midX = bounds.x + width / 2;
    const midY = bounds.y + height / 2;
    
    if (width == 0 || height == 0) return; // nothing to fit
    
    const scale = 0.85 / Math.max(width / fullWidth, height / fullHeight);
    const translate = [fullWidth / 2 - scale * midX, fullHeight / 2 - scale * midY];
    
    svg.transition()
        .duration(750)
        .call(zoom.transform, d3.zoomIdentity.translate(translate[0], translate[1]).scale(scale));
}

// Export functions for global access
window.owaspTreeFunctions = {
    expandAll: () => { expandAll(root); update(root); },
    collapseAll: () => { root.children.forEach(collapse); update(root); },
    centerTree: centerTree,
    searchTree: searchTree
};

function handleNodeClick(node) {
    // Add visual feedback for selection
    $('.jstree-anchor').removeClass('active-node');
    $(`#${node.id}_anchor`).addClass('active-node');
    
    // Update info panel if exists
    updateInfoPanel(node);
}

function handleNodeActivation(node) {
    if (node.li_attr && node.li_attr.href) {
        // Navigate to URL
        window.location.href = node.li_attr.href;
    } else if (node.data && node.data.url) {
        // Navigate to data URL
        window.location.href = node.data.url;
    } else if (node.data && node.data.action) {
        // Execute custom action
        executeNodeAction(node.data.action, node);
    }
}

function executeNodeAction(action, node) {
    switch (action) {
        case 'view_vulnerability':
            window.location.href = `/vulnerability/${node.data.owasp_id}`;
            break;
        case 'start_challenge':
            window.location.href = `/challenge/${node.data.owasp_id}`;
            break;
        case 'external_link':
            window.open(node.data.url, '_blank');
            break;
        default:
            console.log('Unknown action:', action);
    }
}

function addOwaspCategoryIcons() {
    // Add custom icons to OWASP categories
    const owaspCategories = {
        'A01': '🔓',
        'A02': '🔐',
        'A03': '💉',
        'A04': '📐',
        'A05': '⚙️',
        'A06': '📦',
        'A07': '🔑',
        'A08': '📊',
        'A09': '📝',
        'A10': '🌐'
    };

    Object.keys(owaspCategories).forEach(category => {
        const node = owaspTree.jstree('get_node', category);
        if (node) {
            const $anchor = $(`#${category}_anchor`);
            const icon = owaspCategories[category];
            $anchor.prepend(`<span class="owasp-icon me-2">${icon}</span>`);
        }
    });
}

function updateInfoPanel(node) {
    // Create or update info panel (if exists)
    const $infoPanel = $('#tree-info-panel');
    if ($infoPanel.length === 0) return;
    
    let content = '';
    
    if (node.data && node.data.description) {
        content = `
            <div class="card">
                <div class="card-header">
                    <h6 class="mb-0">${node.text}</h6>
                </div>
                <div class="card-body">
                    <p class="mb-2">${node.data.description}</p>
                    ${node.data.severity ? `<span class="badge bg-${getSeverityColor(node.data.severity)}">${node.data.severity}</span>` : ''}
                </div>
            </div>
        `;
    } else {
        content = `
            <div class="card">
                <div class="card-body">
                    <h6>${node.text}</h6>
                    <p class="text-muted mb-0">Click to explore this category</p>
                </div>
            </div>
        `;
    }
    
    $infoPanel.html(content);
}

function getSeverityColor(severity) {
    const colors = {
        'Critical': 'danger',
        'High': 'warning',
        'Medium': 'info',
        'Low': 'success'
    };
    return colors[severity] || 'secondary';
}

function setupTreeSearch() {
    // Add search input if it exists
    const $searchInput = $('#tree-search');
    if ($searchInput.length === 0) return;
    
    let searchTimeout;
    
    $searchInput.on('input', function() {
        clearTimeout(searchTimeout);
        const searchTerm = $(this).val();
        
        searchTimeout = setTimeout(() => {
            if (searchTerm.length > 2) {
                owaspTree.jstree('search', searchTerm);
            } else {
                owaspTree.jstree('clear_search');
            }
        }, 300);
    });
    
    // Clear search button
    $('#clear-search').on('click', function() {
        $searchInput.val('');
        owaspTree.jstree('clear_search');
    });
}

// Tree utility functions
function expandAllNodes() {
    owaspTree.jstree('open_all');
}

function collapseAllNodes() {
    owaspTree.jstree('close_all');
}

function selectNodeById(nodeId) {
    owaspTree.jstree('select_node', nodeId);
}

function expandToNode(nodeId) {
    const node = owaspTree.jstree('get_node', nodeId);
    if (node) {
        owaspTree.jstree('open_node', node.parents);
        owaspTree.jstree('select_node', nodeId);
    }
}

// Keyboard navigation
$(document).on('keydown', function(e) {
    if ($('#owasp-tree').is(':focus-within')) {
        switch(e.key) {
            case 'Escape':
                owaspTree.jstree('deselect_all');
                break;
            case 'Enter':
                const selected = owaspTree.jstree('get_selected', true);
                if (selected.length > 0) {
                    handleNodeActivation(selected[0]);
                }
                break;
        }
    }
});

// Export functions for global access
window.OwaspTree = {
    expandAll: expandAllNodes,
    collapseAll: collapseAllNodes,
    selectNode: selectNodeById,
    expandToNode: expandToNode
};
