/**
 * OWASP Top 10 2021 - Interactive Tree Management
 */

let owaspTree;

function initializeOwaspTree(treeData) {
    const $tree = $('#owasp-tree');
    
    // Configure jsTree
    $tree.jstree({
        'core': {
            'data': treeData,
            'themes': {
                'name': 'default',
                'responsive': true,
                'variant': 'large',
                'stripes': true
            },
            'expand_selected_onload': false,
            'worker': true,
            'force_text': true,
            'dblclick_toggle': true
        },
        'plugins': ['wholerow', 'types', 'search'],
        'types': {
            'default': {
                'icon': 'fas fa-folder text-primary'
            },
            'vulnerability': {
                'icon': 'fas fa-bug text-danger'
            },
            'challenge': {
                'icon': 'fas fa-flag text-success'
            },
            'info': {
                'icon': 'fas fa-info-circle text-info'
            }
        },
        'search': {
            'case_insensitive': true,
            'show_only_matches': true,
            'show_only_matches_children': true
        }
    });

    // Handle node selection
    $tree.on('select_node.jstree', function (e, data) {
        handleNodeClick(data.node);
    });

    // Handle node activation (double-click or Enter)
    $tree.on('activate_node.jstree', function (e, data) {
        handleNodeActivation(data.node);
    });

    // Expand root nodes by default
    $tree.on('ready.jstree', function() {
        $tree.jstree('open_node', $tree.jstree('get_node', '#').children);
        
        // Add custom styling to OWASP category nodes
        addOwaspCategoryIcons();
    });

    // Store tree reference
    owaspTree = $tree;
    
    // Add search functionality
    setupTreeSearch();
}

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
