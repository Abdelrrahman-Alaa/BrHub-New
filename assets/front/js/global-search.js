/**
 * Global Search Manager with Advanced Filters
 * Professional search functionality for products and investments
 */

class GlobalSearchManager {
    constructor() {
        // Modal elements
        this.modal = document.getElementById('globalSearchModal');
        this.input = document.getElementById('globalSearchInput');
        this.searchButton = document.getElementById('searchTrigger');
        this.closeButton = document.getElementById('searchModalClose');
        this.overlay = document.getElementById('searchModalOverlay');
        this.clearButton = document.getElementById('searchClearBtn');

        // State elements
        this.preloader = document.getElementById('searchPreloader');
        this.emptyState = document.getElementById('searchEmptyState');
        this.noResults = document.getElementById('searchNoResults');
        this.resultsContainer = document.getElementById('searchResultsContainer');

        // Results elements
        this.resultsHeader = document.getElementById('resultsHeader');
        this.resultsCount = document.getElementById('resultsCount');
        this.productsSection = document.getElementById('productsSection');
        this.investmentsSection = document.getElementById('investmentsSection');
        this.productsResults = document.getElementById('productsResults');
        this.investmentsResults = document.getElementById('investmentsResults');
        this.productsCount = document.getElementById('productsCount');
        this.investmentsCount = document.getElementById('investmentsCount');

        // Filter elements
        this.advancedToggle = document.getElementById('advancedSearchToggle');
        this.advancedPanel = document.getElementById('advancedSearchPanel');
        this.productFilters = document.getElementById('productFilters');
        this.investmentFilters = document.getElementById('investmentFilters');
        this.applyFiltersBtn = document.getElementById('applyFiltersBtn');
        this.clearFiltersBtn = document.getElementById('clearFiltersBtn');
        this.clearAllFiltersBtn = document.getElementById('clearAllFiltersBtn');
        this.activeFiltersBar = document.getElementById('activeFiltersBar');
        this.activeFiltersList = document.getElementById('activeFiltersList');
        this.filterCount = document.getElementById('filterCount');

        // Tab elements
        this.searchTabs = document.querySelectorAll('.search-tab');
        this.popularTags = document.querySelectorAll('.popular-tag');

        // State
        this.currentFilter = 'all';
        this.searchTimeout = null;
        this.minSearchLength = 2;
        this.activeFilters = {};
        this.advancedSearchOpen = false;

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.updateFilterVisibility();
    }

    attachEventListeners() {
        // Open/Close modal
        this.searchButton?.addEventListener('click', () => this.openModal());
        this.closeButton?.addEventListener('click', () => this.closeModal());
        this.overlay?.addEventListener('click', () => this.closeModal());

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.classList.contains('active')) {
                this.closeModal();
            }
        });

        // Search input
        this.input?.addEventListener('input', (e) => {
            const query = e.target.value.trim();

            // Show/hide clear button
            if (query.length > 0) {
                this.clearButton.classList.remove('d-none');
            } else {
                this.clearButton.classList.add('d-none');
            }

            // Debounced search
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                this.handleSearch(query);
            }, 400);
        });

        // Clear button
        this.clearButton?.addEventListener('click', () => {
            this.input.value = '';
            this.clearButton.classList.add('d-none');
            this.showEmptyState();
        });

        // Filter tabs
        this.searchTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.handleTabChange(tab);
            });
        });

        // Popular tags
        this.popularTags.forEach(tag => {
            tag.addEventListener('click', () => {
                this.input.value = tag.textContent.trim();
                this.handleSearch(tag.textContent.trim());
            });
        });

        // Advanced search toggle
        this.advancedToggle?.addEventListener('click', () => {
            this.toggleAdvancedSearch();
        });

        // Apply filters
        this.applyFiltersBtn?.addEventListener('click', () => {
            this.applyFilters();
        });

        // Clear filters
        this.clearFiltersBtn?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Clear all filters
        this.clearAllFiltersBtn?.addEventListener('click', () => {
            this.clearFilters();
        });

        // Filter inputs - trigger search on change
        this.attachFilterListeners();
    }

    attachFilterListeners() {
        // Common filters
        const commonFilters = [
            'filterCategory',
            'filterCountry',
            'filterSort'
        ];

        // Product filters
        const productFilterIds = [
            'filterPriceMin',
            'filterPriceMax',
            'filterAvailability',
            'filterVerified'
        ];

        // Investment filters
        const investmentFilterIds = [
            'filterInvestmentMin',
            'filterInvestmentMax',
            'filterROI',
            'filterRisk',
            'filterTimeline',
            'filterOpportunityType',
            'filterStatus'
        ];

        // Attach listeners to all filters
        [...commonFilters, ...productFilterIds, ...investmentFilterIds].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                if (element.type === 'checkbox') {
                    element.addEventListener('change', () => {
                        // Auto-apply on checkbox change
                        this.collectFilters();
                        this.updateFilterCount();
                    });
                } else {
                    element.addEventListener('change', () => {
                        this.updateFilterCount();
                    });
                }
            }
        });
    }

    openModal() {
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Focus input after animation
        setTimeout(() => {
            this.input?.focus();
        }, 300);
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';

        // Reset on close
        setTimeout(() => {
            this.input.value = '';
            this.clearButton.classList.add('d-none');
            this.advancedSearchOpen = false;
            this.advancedPanel.classList.remove('active');
            this.advancedToggle.classList.remove('active');
            this.showEmptyState();
        }, 300);
    }

    handleTabChange(clickedTab) {
        // Update active tab
        this.searchTabs.forEach(tab => tab.classList.remove('active'));
        clickedTab.classList.add('active');

        // Update filter
        this.currentFilter = clickedTab.dataset.type;

        // Update filter visibility
        this.updateFilterVisibility();

        // Re-search if there's a query
        if (this.input.value.trim().length >= this.minSearchLength) {
            this.handleSearch(this.input.value.trim());
        }
    }

    updateFilterVisibility() {
        // Hide all specific filters
        this.productFilters?.classList.remove('active');
        this.investmentFilters?.classList.remove('active');

        // Show relevant filters based on current tab
        if (this.currentFilter === 'products') {
            this.productFilters?.classList.add('active');
        } else if (this.currentFilter === 'investments') {
            this.investmentFilters?.classList.add('active');
        } else if (this.currentFilter === 'all') {
            // Show both
            this.productFilters?.classList.add('active');
            this.investmentFilters?.classList.add('active');
        }
    }

    toggleAdvancedSearch() {
        this.advancedSearchOpen = !this.advancedSearchOpen;

        if (this.advancedSearchOpen) {
            this.advancedPanel.classList.add('active');
            this.advancedToggle.classList.add('active');
        } else {
            this.advancedPanel.classList.remove('active');
            this.advancedToggle.classList.remove('active');
        }
    }

    collectFilters() {
        const filters = {};

        // Common filters
        const category = document.getElementById('filterCategory')?.value;
        const country = document.getElementById('filterCountry')?.value;
        const sort = document.getElementById('filterSort')?.value;

        if (category) filters.category = category;
        if (country) filters.country = country;
        if (sort) filters.sort = sort;

        // Product-specific filters
        if (this.currentFilter === 'all' || this.currentFilter === 'products') {
            const priceMin = document.getElementById('filterPriceMin')?.value;
            const priceMax = document.getElementById('filterPriceMax')?.value;
            const availability = document.getElementById('filterAvailability')?.value;
            const verified = document.getElementById('filterVerified')?.checked;

            if (priceMin) filters.price_min = priceMin;
            if (priceMax) filters.price_max = priceMax;
            if (availability) filters.availability = availability;
            if (verified) filters.verified = true;
        }

        // Investment-specific filters
        if (this.currentFilter === 'all' || this.currentFilter === 'investments') {
            const investMin = document.getElementById('filterInvestmentMin')?.value;
            const investMax = document.getElementById('filterInvestmentMax')?.value;
            const roi = document.getElementById('filterROI')?.value;
            const risk = document.getElementById('filterRisk')?.value;
            const timeline = document.getElementById('filterTimeline')?.value;
            const opportunityType = document.getElementById('filterOpportunityType')?.value;
            const status = document.getElementById('filterStatus')?.value;

            if (investMin) filters.investment_min = investMin;
            if (investMax) filters.investment_max = investMax;
            if (roi) filters.roi = roi;
            if (risk) filters.risk = risk;
            if (timeline) filters.timeline = timeline;
            if (opportunityType) filters.opportunity_type = opportunityType;
            if (status) filters.status = status;
        }

        this.activeFilters = filters;
        return filters;
    }

    updateFilterCount() {
        const filters = this.collectFilters();
        const count = Object.keys(filters).length;

        if (count > 0) {
            this.filterCount.textContent = count;
            this.filterCount.classList.remove('d-none');
        } else {
            this.filterCount.classList.add('d-none');
        }
    }

    applyFilters() {
        this.collectFilters();
        this.displayActiveFilters();

        // Perform search with filters
        if (this.input.value.trim().length >= this.minSearchLength) {
            this.handleSearch(this.input.value.trim());
        }

        // Close advanced panel on mobile
        if (window.innerWidth <= 768) {
            this.toggleAdvancedSearch();
        }
    }

    clearFilters() {
        // Reset all filter inputs
        document.querySelectorAll('.filter-select, .filter-input').forEach(input => {
            input.value = '';
        });

        document.querySelectorAll('.filter-checkbox').forEach(checkbox => {
            checkbox.checked = false;
        });

        this.activeFilters = {};
        this.updateFilterCount();
        this.hideActiveFilters();

        // Re-search without filters
        if (this.input.value.trim().length >= this.minSearchLength) {
            this.handleSearch(this.input.value.trim());
        }
    }

    displayActiveFilters() {
        const filterLabels = {
            category: 'Category',
            country: 'Country',
            sort: 'Sort',
            price_min: 'Min Price',
            price_max: 'Max Price',
            availability: 'Availability',
            verified: 'Verified Only',
            investment_min: 'Min Investment',
            investment_max: 'Max Investment',
            roi: 'ROI',
            risk: 'Risk Level',
            timeline: 'Timeline',
            opportunity_type: 'Type',
            status: 'Status'
        };

        const activeFiltersCount = Object.keys(this.activeFilters).length;

        if (activeFiltersCount === 0) {
            this.hideActiveFilters();
            return;
        }

        this.activeFiltersBar.classList.remove('d-none');
        this.activeFiltersBar.classList.add('active');

        this.activeFiltersList.innerHTML = Object.entries(this.activeFilters)
            .map(([key, value]) => {
                const label = filterLabels[key] || key;
                let displayValue = value;

                // Format display value
                if (typeof value === 'boolean') {
                    displayValue = 'Yes';
                }

                return `
                    <div class="active-filter-tag">
                        <span>${label}: ${displayValue}</span>
                        <button onclick="window.globalSearch.removeFilter('${key}')" aria-label="Remove filter">
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                                <path d="M10.5 3.5L3.5 10.5M3.5 3.5L10.5 10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                            </svg>
                        </button>
                    </div>
                `;
            })
            .join('');
    }

    hideActiveFilters() {
        this.activeFiltersBar.classList.remove('active');
        this.activeFiltersBar.classList.add('d-none');
    }

    removeFilter(filterKey) {
        // Remove from active filters
        delete this.activeFilters[filterKey];

        // Reset the input
        const filterMap = {
            category: 'filterCategory',
            country: 'filterCountry',
            sort: 'filterSort',
            price_min: 'filterPriceMin',
            price_max: 'filterPriceMax',
            availability: 'filterAvailability',
            verified: 'filterVerified',
            investment_min: 'filterInvestmentMin',
            investment_max: 'filterInvestmentMax',
            roi: 'filterROI',
            risk: 'filterRisk',
            timeline: 'filterTimeline',
            opportunity_type: 'filterOpportunityType',
            status: 'filterStatus'
        };

        const inputId = filterMap[filterKey];
        const input = document.getElementById(inputId);

        if (input) {
            if (input.type === 'checkbox') {
                input.checked = false;
            } else {
                input.value = '';
            }
        }

        // Update display
        this.displayActiveFilters();
        this.updateFilterCount();

        // Re-search
        if (this.input.value.trim().length >= this.minSearchLength) {
            this.handleSearch(this.input.value.trim());
        }
    }

    async handleSearch(query) {
        if (query.length < this.minSearchLength) {
            this.showEmptyState();
            return;
        }

        // Show loading
        this.showLoading();

        try {
            // Build query parameters
            const params = new URLSearchParams({
                q: query,
                type: this.currentFilter
            });

            // Add active filters
            Object.entries(this.activeFilters).forEach(([key, value]) => {
                params.append(key, value);
            });

            // Fetch results
            const response = await fetch(`/api/search?${params.toString()}`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            if (!response.ok) {
                throw new Error('Search failed');
            }

            const data = await response.json();

            // Display results
            this.displayResults(data);

        } catch (error) {
            console.error('Search error:', error);
            this.showNoResults();
        }
    }

    displayResults(data) {
        const { products = [], investments = [], total = 0 } = data;

        // Check if we have any results
        if (products.length === 0 && investments.length === 0) {
            this.showNoResults();
            return;
        }

        // Hide other states
        this.hideAllStates();
        this.resultsContainer.classList.remove('d-none');
        this.resultsContainer.classList.add('active');

        // Update results count
        if (this.resultsCount) {
            this.resultsCount.textContent = total;
        }

        // Render products
        if (this.currentFilter === 'all' || this.currentFilter === 'products') {
            if (products.length > 0) {
                this.productsSection.style.display = 'block';
                this.productsCount.textContent = products.length;
                this.productsResults.innerHTML = products.map(product => this.createProductCard(product)).join('');
            } else {
                this.productsSection.style.display = 'none';
            }
        } else {
            this.productsSection.style.display = 'none';
        }

        // Render investments
        if (this.currentFilter === 'all' || this.currentFilter === 'investments') {
            if (investments.length > 0) {
                this.investmentsSection.style.display = 'block';
                this.investmentsCount.textContent = investments.length;
                this.investmentsResults.innerHTML = investments.map(investment => this.createInvestmentCard(investment)).join('');
            } else {
                this.investmentsSection.style.display = 'none';
            }
        } else {
            this.investmentsSection.style.display = 'none';
        }
    }

    createProductCard(product) {
        const noDescription = this.getTranslation('no_description_available');
        const productLabel = this.getTranslation('product');

        return `
            <a href="/products/${product.slug}" class="search-result-card">
                <img src="${product.image || '/assets/front/images/logo.jpg'}"
                     alt="${this.escapeHtml(product.name)}"
                     class="search-result-image"
                     loading="lazy">

                <div class="search-result-content">
                    <h4 class="search-result-title">${this.escapeHtml(product.name)}</h4>
                    <p class="search-result-description">${this.escapeHtml(product.description || noDescription)}</p>
                </div>

                <div class="search-result-meta">
                    <span class="search-result-badge">${productLabel}</span>
                    ${product.category ? `<span class="search-result-info">${this.escapeHtml(product.category)}</span>` : ''}
                </div>
            </a>
        `;
    }

    createInvestmentCard(investment) {
        const noDescription = this.getTranslation('no_description_available');
        const investmentLabel = this.getTranslation('investment');

        return `
            <a href="/investments/${investment.id}/show" class="search-result-card">
                <img src="${investment.image || '/assets/front/images/logo.jpg'}"
                     alt="${this.escapeHtml(investment.name)}"
                     class="search-result-image"
                     loading="lazy">

                <div class="search-result-content">
                    <h4 class="search-result-title">${this.escapeHtml(investment.name)}</h4>
                    <p class="search-result-description">${this.escapeHtml(investment.description || noDescription)}</p>
                </div>

                <div class="search-result-meta">
                    <span class="search-result-badge">${investmentLabel}</span>
                    ${investment.expected_roi ? `<span class="search-result-roi">${investment.expected_roi}% ROI</span>` : ''}
                </div>
            </a>
        `;
    }

    getTranslation(key) {
        const lang = document.documentElement.lang || 'en';
        const translations = {
            en: {
                no_description_available: 'No description available',
                product: 'Product',
                investment: 'Investment'
            },
            ar: {
                no_description_available: 'لا يوجد وصف متاح',
                product: 'منتج',
                investment: 'استثمار'
            },
            pt: {
                no_description_available: 'Nenhuma descrição disponível',
                product: 'Produto',
                investment: 'Investimento'
            }
        };

        return translations[lang]?.[key] || translations['en'][key];
    }

    showLoading() {
        this.hideAllStates();
        this.preloader.classList.add('active');
    }

    showEmptyState() {
        this.hideAllStates();
        this.emptyState.classList.add('active');
    }

    showNoResults() {
        this.hideAllStates();
        this.noResults.classList.remove('d-none');
        this.noResults.classList.add('active');
    }

    hideAllStates() {
        this.preloader.classList.remove('active');
        this.emptyState.classList.remove('active');
        this.noResults.classList.remove('active');
        this.noResults.classList.add('d-none');
        this.resultsContainer.classList.remove('active');
        this.resultsContainer.classList.add('d-none');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.globalSearch = new GlobalSearchManager();
});
