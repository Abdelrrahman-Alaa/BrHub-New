// public/assets/front/js/products-filter.js

/**
 * Products Filter and AJAX Handler
 */
class ProductsFilter {
    constructor() {
        this.form = document.getElementById('filtersForm');
        this.productsContainer = document.getElementById('productsContainer');
        this.paginationContainer = document.getElementById('paginationContainer');
        this.loadingShimmer = document.getElementById('loadingShimmer');
        this.resultsCount = document.getElementById('resultsCount');
        this.sortSelect = document.getElementById('sortSelect');

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.initializeViewToggle();
        this.initializePagination();
    }

    attachEventListeners() {
        // Form submission
        if (this.form) {
            this.form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.applyFilters();
            });
        }

        // Clear filters
        const clearBtn = document.getElementById('clearFilters');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Reset filters
        const resetBtn = document.getElementById('resetFilters');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                this.clearFilters();
            });
        }

        // Sort change
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                this.applyFilters();
            });
        }

        // Real-time search (debounced)
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            let searchTimeout;
            searchInput.addEventListener('input', (e) => {
                clearTimeout(searchTimeout);
                searchTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 500);
            });
        }

        // Filter changes
        const filterSelects = this.form.querySelectorAll('select:not(#sortSelect)');
        filterSelects.forEach(select => {
            select.addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Price inputs
        const priceInputs = this.form.querySelectorAll('input[type="number"]');
        priceInputs.forEach(input => {
            let priceTimeout;
            input.addEventListener('input', () => {
                clearTimeout(priceTimeout);
                priceTimeout = setTimeout(() => {
                    this.applyFilters();
                }, 800);
            });
        });

        // Checkboxes
        const checkboxes = this.form.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.applyFilters();
            });
        });
    }

    async applyFilters() {
        this.showLoading();

        // Get form data
        const formData = new FormData(this.form);

        // Add sort parameter
        if (this.sortSelect) {
            formData.set('sort', this.sortSelect.value);
        }

        // Convert FormData to URLSearchParams
        const params = new URLSearchParams();

        for (let [key, value] of formData.entries()) {
            if (value) { // Only add non-empty values
                params.append(key, value);
            }
        }

        // Build URL with query parameters
        const url = `${window.location.pathname}?${params.toString()}`;

        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'Accept': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.updateProducts(data.html);
                this.updatePagination(data.pagination);
                this.updateResultsCount(data.count);
                this.updateURL(url);
            } else {
                this.showError('Failed to load products');
            }
        } catch (error) {
            console.error('Filter error:', error);
            this.showError('An error occurred while filtering products');
        } finally {
            this.hideLoading();
        }
    }

    showLoading() {
        if (this.productsContainer) {
            this.productsContainer.style.opacity = '0.5';
            this.productsContainer.style.pointerEvents = 'none';
        }
        if (this.loadingShimmer) {
            this.loadingShimmer.classList.remove('d-none');
        }
    }

    hideLoading() {
        if (this.loadingShimmer) {
            this.loadingShimmer.classList.add('d-none');
        }
        if (this.productsContainer) {
            this.productsContainer.style.opacity = '1';
            this.productsContainer.style.pointerEvents = 'auto';
        }
    }

    updateProducts(html) {
        if (this.productsContainer) {
            this.productsContainer.innerHTML = html;

            // Reinitialize any product-specific functionality
            this.initializeProductActions();
        }
    }

    updatePagination(html) {
        if (this.paginationContainer) {
            this.paginationContainer.innerHTML = html;
            this.initializePagination();
        }
    }

    updateResultsCount(count) {
        if (this.resultsCount) {
            this.resultsCount.textContent = new Intl.NumberFormat().format(count);
        }
    }

    updateURL(url) {
        window.history.pushState({}, '', url);
    }

    clearFilters() {
        if (this.form) {
            this.form.reset();

            // Also clear the sort select
            if (this.sortSelect) {
                this.sortSelect.value = 'featured';
            }

            // Reset URL to base products page
            window.history.pushState({}, '', window.location.pathname);

            // Apply filters (which will load all products)
            this.applyFilters();
        }
    }

    showError(message) {
        // Create a simple error notification
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-danger alert-dismissible fade show';
        errorDiv.style.position = 'fixed';
        errorDiv.style.top = '20px';
        errorDiv.style.right = '20px';
        errorDiv.style.zIndex = '9999';
        errorDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(errorDiv);

        // Auto remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    initializeViewToggle() {
        const viewButtons = document.querySelectorAll('.view-btn');
        const productsGrid = document.getElementById('productsGrid');

        viewButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                viewButtons.forEach(b => b.classList.remove('active'));
                this.classList.add('active');

                const view = this.dataset.view;

                if (productsGrid) {
                    if (view === 'list') {
                        productsGrid.style.gridTemplateColumns = '1fr';
                        productsGrid.classList.add('list-view');
                    } else {
                        productsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
                        productsGrid.classList.remove('list-view');
                    }
                }
            });
        });
    }

    initializePagination() {
        const paginationLinks = document.querySelectorAll('.pagination .page-link');

        paginationLinks.forEach(link => {
            link.addEventListener('click', async (e) => {
                e.preventDefault();

                const url = link.getAttribute('href');
                if (!url || url === '#' || link.parentElement.classList.contains('disabled')) {
                    return;
                }

                this.showLoading();

                try {
                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest',
                            'Accept': 'application/json'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();

                    if (data.success) {
                        this.updateProducts(data.html);
                        this.updatePagination(data.pagination);
                        this.updateResultsCount(data.count);

                        // Scroll to top of products
                        const productsSection = document.querySelector('.products-section');
                        if (productsSection) {
                            productsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }

                        // Update URL
                        window.history.pushState({}, '', url);
                    }
                } catch (error) {
                    console.error('Pagination error:', error);
                    this.showError('Failed to load page');
                } finally {
                    this.hideLoading();
                }
            });
        });
    }

    initializeProductActions() {
        // Wishlist buttons
        const wishlistBtns = document.querySelectorAll('.wishlist-btn');
        wishlistBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const icon = btn.querySelector('i');
                if (icon.classList.contains('far')) {
                    icon.classList.remove('far');
                    icon.classList.add('fas');
                    btn.style.color = '#e74c3c';
                } else {
                    icon.classList.remove('fas');
                    icon.classList.add('far');
                    btn.style.color = '';
                }
            });
        });

        // Quick view buttons
        const quickViewBtns = document.querySelectorAll('.quick-view-btn');
        quickViewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                // Implement quick view modal
                console.log('Quick view for product:', productId);
            });
        });

        // Compare buttons
        const compareBtns = document.querySelectorAll('.compare-btn');
        compareBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const productId = btn.dataset.productId;
                // Implement compare functionality
                console.log('Compare product:', productId);
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new ProductsFilter();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    location.reload();
});
