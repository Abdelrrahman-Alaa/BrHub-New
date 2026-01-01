/**
 * Enhanced Investments Manager
 * Handles AJAX loading with parent-child categories, creative shimmer, and exact card structure
 */



(function ($) {
    'use strict';







    const InvestmentsManager = {
        // Configuration
        config: {
            container: '#investments_container',
            loaderWrapper: '.testimonials_section__ .loader_wrapper__',
            tabButtons: '.testimonials_section__ .tab_button__',
            ajaxUrl: '/api/investments/by-category',
            retryDelay: 3000,
            animationDuration: 400,
            staggerDelay: 80,
            maxRetries: 3,
            shimmerItemsCount: 6
        },

        // State
        state: {
            isLoading: false,
            currentCategory: null,
            retryCount: 0,
            currentRequest: null
        },

        /**
         * Initialize the manager
         */
        init() {
            this.bindEvents();
            this.initializeLazyLoading();
        },

        /**
         * Bind event listeners
         */
        bindEvents() {
            const self = this;

            // Category button click handler
            $(document).on('click', self.config.tabButtons, function (e) {
                e.preventDefault();

                if (self.state.isLoading) {
                    return;
                }

                const $button = $(this);
                const categoryId = $button.data('category-id');


                // Don't reload if clicking the same category
                if (categoryId === self.state.currentCategory) {
                    return;
                }

                // Update active state
                self.updateActiveButton($button);

                // Load investments
                self.loadInvestments(categoryId);
            });
        },

        /**
         * Update active button state
         */
        updateActiveButton($activeButton) {
            $(this.config.tabButtons).removeClass('active');
            $activeButton.addClass('active');
        },

        /**
         * Load investments by category
         */
        loadInvestments(categoryId) {
            const self = this;

            // Cancel previous request if exists
            if (self.state.currentRequest) {
                self.state.currentRequest.abort();
            }

            // Update state
            self.state.isLoading = true;
            self.state.currentCategory = categoryId;
            self.state.retryCount = 0;

            // Show shimmer loader
            self.showShimmerLoader();

            // Fetch investments
            self.fetchInvestments(categoryId);
        },

        /**
         * Fetch investments from server
         */
        fetchInvestments(categoryId) {
            const self = this;

            self.state.currentRequest = $.ajax({
                url: self.config.ajaxUrl,
                method: 'GET',
                data: {
                    category_id: categoryId ?? 'all'
                },
                dataType: 'json',
                timeout: 15000,
                headers: {
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                },
                success(response) {
                    self.handleSuccess(response);
                },
                error(xhr, status, error) {
                    if (status !== 'abort') {
                        self.handleError(xhr, status, error, categoryId);
                    }
                },
                complete() {
                    self.state.currentRequest = null;
                }
            });
        },

        /**
         * Handle successful response
         */
        handleSuccess(response) {
            const self = this;

            // Validate response
            if (!response || !response.success) {
                self.handleError(null, 'Invalid response format', null, self.state.currentCategory);
                return;
            }

            // Minimum loading time for smooth UX (600ms)
            setTimeout(() => {
                // Render investments
                self.renderInvestments(response.investments || []);

                // Update state
                self.state.isLoading = false;
                self.state.retryCount = 0;
            }, 600);
        },

        /**
         * Handle error response
         */
        handleError(xhr, status, error, categoryId) {
            const self = this;

            console.error('Investment loading error:', {
                status: status,
                error: error,
                xhr: xhr
            });

            // Update state
            self.state.isLoading = false;

            // Attempt retry if under max retries
            if (self.state.retryCount < self.config.maxRetries && status !== 'timeout') {
                self.state.retryCount++;

                // Show retry message
                self.showRetryMessage(self.state.retryCount);

                setTimeout(() => {
                    console.log(`Retrying... Attempt ${self.state.retryCount}`);
                    self.state.isLoading = true;
                    self.fetchInvestments(categoryId);
                }, self.config.retryDelay);
            } else {
                // Max retries reached
                self.hideShimmerLoader(() => {
                    self.renderErrorState();
                });
            }
        },

        /**
         * Show creative shimmer loader
         */
        showShimmerLoader() {
            const self = this;
            const $container = $(self.config.container);
            const shimmerHtml = self.generateShimmerHTML();

            // Add shimmer class
            $container.addClass('shimmer-loading');

            // Fade out current content
            $container.children().each(function (index) {
                const $item = $(this);
                setTimeout(() => {
                    $item.css({
                        'opacity': '0',
                        'transform': 'scale(0.95)'
                    });
                }, index * 30);
            });

            // Replace with shimmer
            setTimeout(() => {
                $container.html(shimmerHtml);

                // Trigger animation
                setTimeout(() => {
                    $('.shimmer-investment-item').addClass('visible');
                }, 50);
            }, 300);
        },

        /**
         * Hide shimmer loader
         */
        hideShimmerLoader(callback) {
            const self = this;
            const $container = $(self.config.container);

            // Fade out shimmer items
            $('.shimmer-investment-item').each(function (index) {
                const $item = $(this);
                setTimeout(() => {
                    $item.removeClass('visible').addClass('hiding');
                }, index * 30);
            });

            // Remove shimmer class and execute callback
            setTimeout(() => {
                $container.removeClass('shimmer-loading');
                if (typeof callback === 'function') {
                    callback();
                }
            }, 400);
        },

        /**
         * Generate shimmer HTML matching exact card structure
         */
        generateShimmerHTML() {
            const self = this;
            let shimmerHtml = '';

            for (let i = 0; i < self.config.shimmerItemsCount; i++) {
                shimmerHtml += `
                    <div class="testimonial_card__ shimmer-investment-item" style="animation-delay: ${i * 50}ms;">
                        <div class="head__">
                            <div class="company_card__">
                                <div class="image_wrapper__">
                                    <div class="shimmer-box shimmer-circle" style="width: 60px; height: 60px;"></div>
                                </div>
                                <div class="compony_content__">
                                    <div class="shimmer-box shimmer-title" style="width: 140px; height: 20px; margin-bottom: 8px;"></div>
                                    <div class="location_wrapper__">
                                        <div class="shimmer-box shimmer-circle" style="width: 20px; height: 20px; margin-right: 6px;"></div>
                                        <div class="shimmer-box shimmer-text" style="width: 100px; height: 16px;"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="shimmer-box" style="width: 90px; height: 28px; border-radius: 14px;"></div>
                        </div>

                        <div class="shimmer-box shimmer-text" style="width: 100%; height: 16px; margin-bottom: 8px;"></div>
                        <div class="shimmer-box shimmer-text" style="width: 95%; height: 16px; margin-bottom: 8px;"></div>
                        <div class="shimmer-box shimmer-text" style="width: 80%; height: 16px; margin-bottom: 16px;"></div>

                        <div class="body__" style="gap: 12px;">
                            <div class="info__">
                                <div class="shimmer-box shimmer-text" style="width: 90%; height: 14px; margin-bottom: 6px;"></div>
                                <div class="shimmer-box shimmer-text" style="width: 60%; height: 18px;"></div>
                            </div>
                            <div class="info__">
                                <div class="shimmer-box shimmer-text" style="width: 90%; height: 14px; margin-bottom: 6px;"></div>
                                <div class="shimmer-box shimmer-text" style="width: 70%; height: 18px;"></div>
                            </div>
                            <div class="info__">
                                <div class="shimmer-box shimmer-text" style="width: 90%; height: 14px; margin-bottom: 6px;"></div>
                                <div class="shimmer-box shimmer-text" style="width: 70%; height: 18px;"></div>
                            </div>
                            <div class="info__">
                                <div class="shimmer-box shimmer-text" style="width: 90%; height: 14px; margin-bottom: 6px;"></div>
                                <div class="shimmer-box shimmer-text" style="width: 65%; height: 18px;"></div>
                            </div>
                        </div>

                        <div class="card_categories_wrapper__" style="margin-top: 16px;">
                            <div class="shimmer-box" style="width: 120px; height: 28px; border-radius: 14px;"></div>
                        </div>

                        <div class="footer__" style="margin-top: 16px;">
                            <div class="shimmer-box shimmer-button" style="flex: 1; height: 44px;"></div>
                            <div class="shimmer-box shimmer-button" style="flex: 1; height: 44px;"></div>
                        </div>
                    </div>
                `;
            }

            return shimmerHtml;
        },

        /**
         * Show retry message
         */
        showRetryMessage(attemptNumber) {
            const self = this;
            const $container = $(self.config.container);

            const retryHtml = `
                <div class="investment-retry-wrapper fade-in-up">
                    <div class="investment-retry-content">
                        <div class="retry-icon">
                            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="12" y1="8" x2="12" y2="12"></line>
                                <line x1="12" y1="16" x2="12.01" y2="16"></line>
                            </svg>
                        </div>
                        <h4>Connection Issue</h4>
                        <p>Retrying automatically... Attempt ${attemptNumber} of ${self.config.maxRetries}</p>
                        <div class="retry-spinner">
                            <div class="spinner"></div>
                        </div>
                    </div>
                </div>
            `;

            $container.html(retryHtml);
        },

        /**
         * Render investments with staggered animation
         */
        renderInvestments(investments) {
            const self = this;
            const $container = $(self.config.container);

            if (!investments || investments.length === 0) {
                self.hideShimmerLoader(() => {
                    self.renderEmptyState();
                });
                return;
            }

            // Generate HTML
            let investmentsHtml = '';

            investments.forEach((investment, index) => {
                investmentsHtml += self.buildInvestmentCard(investment, index);
            });

            // Hide shimmer and update DOM
            self.hideShimmerLoader(() => {
                $container.html(investmentsHtml);

                // Trigger animation
                setTimeout(() => {
                    $('.investment-item-animated').addClass('visible');

                    // Reinitialize lazy loading
                    self.initializeLazyLoading();
                }, 50);
            });
        },

        /**
         * Build investment card HTML - EXACT structure from blade template
         */
        buildInvestmentCard(investment, index) {
            const self = this;
            const countryCode = investment.country ? investment.country.toLowerCase() : 'sa';
            const countryName = investment.country_name || 'Unknown';

            // Format investment amounts
            const minInvestment = self.formatInvestment(investment.minimum_investment);
            const maxInvestment = self.formatInvestment(investment.maximum_investment);

            // Get categories
            const categories = investment.categories || [];
            const categoriesHtml = categories.length > 0
                ? categories.map(cat => `<span class="cat_lable__">${self.escapeHtml(cat.name)}</span>`).join('')
                : '<span class="cat_lable__">Uncategorized</span>';

            return `
                <div class="testimonial_card__ investment-item-animated"
                     style="animation-delay: ${index * self.config.staggerDelay}ms; opacity: 0;"
                     data-opportunity-id="${investment.id}">
                    <div class="head__">
                        <div class="company_card__">
                            <div class="image_wrapper__">
                                <figure class="figure__ asp-om loading-omd company_figure__">
                                    <img class="img-om lazy-omd"
                                         src="${investment.image}"
                                         data-src="${investment.image}"
                                         alt="${self.escapeHtml(investment.name)}"/>
                                </figure>
                            </div>

                            <div class="compony_content__">
                                <h3 class="title__">${self.escapeHtml(investment.name)}</h3>

                                <div class="location_wrapper__">
                                    <figure class="figure__ flag__">
                                        <img class="img-om"
                                             src="https://flagcdn.com/${countryCode}.svg"
                                             alt="${self.escapeHtml(countryName)}">
                                    </figure>
                                    <span class="text__">${self.escapeHtml(countryName)}</span>
                                </div>
                            </div>
                        </div>

                        ${investment.is_premium ? `
                        <span class="badge__">
                            <img width="16" height="16"
                                 src="${window.location.origin}/assets/front/images/shapes/sun.svg" alt="">
                            Premium
                        </span>
                        ` : ''}
                    </div>

                    <p class="parag__">${self.escapeHtml(self.truncateText(investment.description, 150))}</p>

                    <div class="body__">
                        <div class="info__">
                            <span class="title__">${window.translations.expected_roi}</span>
                            <span class="value__">${self.escapeHtml(investment.expected_roi)}%</span>
                        </div>
                        <div class="info__">
                            <span class="title__">${window.translations.minimum_amount}</span>
                            <span class="value__">${minInvestment}</span>
                        </div>
                        <div class="info__">
                            <span class="title__">${window.translations.maximum_amount}</span>
                            <span class="value__">${maxInvestment}</span>
                        </div>
                        <div class="info__">
                            <span class="title__">${window.translations.round_duration}</span>
                            <span class="value__">${self.escapeHtml(investment.investment_timeline)} ${window.translations.months}</span>
                        </div>
                    </div>

                    <div class="card_categories_wrapper__">
                        ${categoriesHtml}
                    </div>

                    <div class="footer__">
                        <button class="button__ testimonial_details_button__"
                                onclick="window.location.href='${investment.url}'">
                            Details
                        </button>
                        <button class="button__ primary_button__ testimonial_invest_button__">
                            <i class="fas fa-hand-holding-usd me-2"></i>
                            Invest Now
                        </button>
                    </div>
                </div>
            `;
        },

        /**
         * Render empty state
         */
        renderEmptyState() {
            const $container = $(this.config.container);

            const emptyHtml = `
                <div class="investment-empty-wrapper fade-in-up">
                    <div class="investment-empty-content">
                        <div class="empty-icon">
                            <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                                <circle cx="12" cy="12" r="10"></circle>
                                <path d="M16 16s-1.5-2-4-2-4 2-4 2"></path>
                                <line x1="9" y1="9" x2="9.01" y2="9"></line>
                                <line x1="15" y1="9" x2="15.01" y2="9"></line>
                            </svg>
                        </div>
                        <h4>No Investments Found</h4>
                        <p>There are no investment opportunities available in this category at the moment.</p>
                        <button class="button__ secondary_button__ view-all-investments-btn">
                            View All Investments
                        </button>
                    </div>
                </div>
            `;

            $container.html(emptyHtml);

            // Bind view all button
            setTimeout(() => {
                $('.view-all-investments-btn').on('click', () => {
                    $(this.config.tabButtons).first().trigger('click');
                });
            }, 100);
        },

        /**
         * Render error state with manual retry
         */
        renderErrorState() {
            const self = this;
            const $container = $(self.config.container);

            const errorHtml = `
                <div class="investment-error-wrapper fade-in-up">
                    <div class="investment-error-content">
                        <div class="error-icon error">
                            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="15" y1="9" x2="9" y2="15"></line>
                                <line x1="9" y1="9" x2="15" y2="15"></line>
                            </svg>
                        </div>
                        <h4>Unable to Load Investments</h4>
                        <p>We couldn't connect to the server. Please check your internet connection and try again.</p>
                        <button class="button__ primary_button__ retry-button-investment-ajax">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="23 4 23 10 17 10"></polyline>
                                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                            </svg>
                            Try Again
                        </button>
                    </div>
                </div>
            `;

            $container.html(errorHtml);

            // Bind retry button
            setTimeout(() => {
                $('.retry-button-investment-ajax').on('click', function () {
                    $(this).addClass('loading');
                    self.state.retryCount = 0;
                    self.loadInvestments(self.state.currentCategory);
                });
            }, 100);
        },

        /**
         * Initialize lazy loading for images
         */
        initializeLazyLoading() {
            const lazyImages = document.querySelectorAll('.lazy-omd');

            if ('IntersectionObserver' in window) {
                const imageObserver = new IntersectionObserver((entries) => {
                    entries.forEach(entry => {
                        if (entry.isIntersecting) {
                            const img = entry.target;
                            const src = img.getAttribute('data-src');

                            if (src) {
                                const tempImg = new Image();
                                tempImg.onload = () => {
                                    img.src = src;
                                    img.classList.remove('lazy-omd');
                                    img.parentElement.classList.remove('loading-omd');
                                    img.parentElement.classList.add('loaded-omd');
                                };
                                tempImg.src = src;
                            }

                            imageObserver.unobserve(img);
                        }
                    });
                }, {
                    rootMargin: '100px'
                });

                lazyImages.forEach(img => imageObserver.observe(img));
            } else {
                // Fallback
                lazyImages.forEach(img => {
                    const src = img.getAttribute('data-src');
                    if (src) {
                        img.src = src;
                        img.classList.remove('lazy-omd');
                        img.parentElement.classList.remove('loading-omd');
                        img.parentElement.classList.add('loaded-omd');
                    }
                });
            }
        },

        /**
         * Format investment amount
         */
        formatInvestment(value) {
            if (!value || isNaN(value)) return '$0';

            const num = parseFloat(value);

            if (num >= 1000000) {
                return '$' + (num / 1000000).toFixed(1) + 'M';
            } else if (num >= 1000) {
                return '$' + (num / 1000).toFixed(1) + 'K';
            } else {
                return '$' + num.toLocaleString();
            }
        },

        /**
         * Truncate text
         */
        truncateText(text, maxLength) {
            if (!text) return '';
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength).trim() + '...';
        },

        /**
         * Escape HTML to prevent XSS
         */
        escapeHtml(text) {
            if (!text) return '';

            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
    };

    // Initialize on document ready
    $(document).ready(() => {
        InvestmentsManager.init();
    });

    // Expose to global scope for debugging
    window.InvestmentsManager = InvestmentsManager;

})(jQuery);
