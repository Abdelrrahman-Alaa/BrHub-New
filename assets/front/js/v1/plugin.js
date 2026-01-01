jQuery(document).ready(function ($) {
    hidePreloader(500);
    allSiteSwiperInit();
    toggleSideMenuInSmallScreens($);
    stickyHeader($);
    initEnhancedLazyLoad();
    customDropdown();
    dragToScrollTabs();
    toggleMenu();
    initGsapMarquees({
        selector: '.marquee_container__',
        contentSelector: '.marquee_content__',
        reverseClass: 'reverse__',
        speed: 50,
        pauseOnHover: true,
        centerIfSmall: true
    });

    initChart([
        {
            name: ' ',
            data: generateDayWiseTimeSeries(new Date('11 Feb 2017 GMT').getTime(), 20, {
                min: 10,
                max: 60
            })
        },
    ]);
});

/**
 * Enhanced Lazy Load with Progressive Image Loading
 * Features:
 * - Intersection Observer with fallback
 * - Blur-up effect for better UX
 * - Error handling with retry logic
 * - Responsive image support (srcset)
 * - Priority loading for above-the-fold images
 * - Loading skeleton/placeholder support
 * - Performance monitoring
 */
function initEnhancedLazyLoad() {
    const config = {
        rootMargin: '50px 0px',
        threshold: 0.01,
        retryAttempts: 3,
        retryDelay: 1000,
        fadeInDuration: 300,
        enableBlurEffect: true,
        enableProgressiveLoading: true,
        prioritySelector: '.lazy-priority',
        fallbackImage: null // Set a fallback image URL if needed
    };

    const images = document.querySelectorAll('.lazy-omd');

    if (!images.length) return;

    // Check browser support for IntersectionObserver
    const supportsIntersectionObserver = 'IntersectionObserver' in window;

    if (supportsIntersectionObserver) {
        initIntersectionObserver(images, config);
    } else {
        // Fallback for older browsers
        fallbackLazyLoad(images, config);
    }

    // Priority loading for above-the-fold images
    const priorityImages = document.querySelectorAll(config.prioritySelector);
    priorityImages.forEach(img => preloadImage(img, config, true));
}

/**
 * Initialize Intersection Observer for lazy loading
 */
function initIntersectionObserver(images, config) {
    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                preloadImage(img, config);
                imageObserver.unobserve(img);
            }
        });
    }, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
    });

    images.forEach(image => {
        // Skip priority images as they're already loaded
        if (!image.classList.contains('lazy-priority')) {
            imageObserver.observe(image);
        }
    });
}

/**
 * Enhanced preload image function with progressive loading and error handling
 */
function preloadImage(img, config, isPriority = false) {
    const parent = img.parentElement;
    const grandParent = parent?.parentElement;

    // Get image sources
    const src = img.getAttribute('data-src');
    const srcset = img.getAttribute('data-srcset');
    const sizes = img.getAttribute('data-sizes');

    if (!src) return;

    // Add loading state
    parent?.classList.add('loading-omd');
    img.classList.add('loading');

    // Create a new image object for preloading
    const tempImage = new Image();
    let retryCount = 0;

    // Progressive loading: show low-res placeholder first if available
    const placeholder = img.getAttribute('data-placeholder');
    if (config.enableProgressiveLoading && placeholder && !isPriority) {
        img.src = placeholder;
        if (config.enableBlurEffect) {
            img.style.filter = 'blur(10px)';
            img.style.transition = `filter ${config.fadeInDuration}ms ease-out`;
        }
    }

    // Success handler
    const onLoadSuccess = () => {
        // Set the actual source
        img.src = src;
        if (srcset) img.srcset = srcset;
        if (sizes) img.sizes = sizes;

        // Remove blur effect
        if (config.enableBlurEffect) {
            setTimeout(() => {
                img.style.filter = 'none';
            }, 50);
        }

        // Update classes with fade-in effect
        setTimeout(() => {
            parent?.classList.remove('loading-omd');
            parent?.classList.add('loaded-omd');
            grandParent?.classList.add('lazy-head-om');
            img.classList.remove('loading');
            img.classList.add('loaded');
        }, config.fadeInDuration);

        // Dispatch custom event for tracking
        img.dispatchEvent(new CustomEvent('lazyloaded', {
            detail: { src, isPriority, retries: retryCount }
        }));
    };

    // Error handler with retry logic
    const onLoadError = () => {
        if (retryCount < config.retryAttempts) {
            retryCount++;
            console.warn(`Retrying image load (${retryCount}/${config.retryAttempts}):`, src);

            setTimeout(() => {
                tempImage.src = src + (src.includes('?') ? '&' : '?') + 'retry=' + retryCount;
            }, config.retryDelay * retryCount);
        } else {
            // All retries failed, use fallback
            console.error('Failed to load image after retries:', src);

            if (config.fallbackImage) {
                img.src = config.fallbackImage;
            }

            parent?.classList.remove('loading-omd');
            parent?.classList.add('load-error-omd');
            img.classList.remove('loading');
            img.classList.add('load-error');

            // Dispatch error event
            img.dispatchEvent(new CustomEvent('lazyloaderror', {
                detail: { src, retries: retryCount }
            }));
        }
    };

    // Attach handlers to temp image
    tempImage.onload = onLoadSuccess;
    tempImage.onerror = onLoadError;

    // Start loading
    tempImage.src = src;
    if (srcset) tempImage.srcset = srcset;
}

/**
 * Fallback lazy load for browsers without IntersectionObserver
 */
function fallbackLazyLoad(images, config) {
    const loadImage = () => {
        images.forEach(img => {
            if (isInViewport(img) && !img.classList.contains('loaded')) {
                preloadImage(img, config);
            }
        });
    };

    // Load on scroll and resize with debouncing
    let ticking = false;
    const handleScroll = () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                loadImage();
                ticking = false;
            });
            ticking = true;
        }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleScroll, { passive: true });

    // Initial load
    loadImage();
}

/**
 * Check if element is in viewport (fallback helper)
 */
function isInViewport(element) {
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= -100 &&
        rect.left >= -100 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) + 100 &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth) + 100
    );
}

/**
 * Legacy lazy load function (kept for backwards compatibility)
 */
function lazyLoad() {
    initEnhancedLazyLoad();
}

function swiperInit(options) {
    const swiper = new Swiper(options.className + " .swiper-container", {
        spaceBetween: 30,
        autoplay: {
            delay: 3000,
            disableOnInteraction: false,
        },
        rtl: $("html").attr("dir") === "rtl" ? true : false,
        pagination: {
            el: options.className + " .swiper-pagination",
            clickable: true,
        },
        navigation: {
            nextEl: options.className + " .swiper-button-next",
            prevEl: options.className + " .swiper-button-prev",
        },
        breakpoints: options.breakpoints,
        observer: options.observer,
        observeParents: options.observeParents,
        grid: options.grid,
        ...options,
    });

    // Trigger lazy load after swiper initialization
    setTimeout(() => initEnhancedLazyLoad(), 100);

    return swiper;
}

function allSiteSwiperInit() {
    // =======================================================================
    // Businesses Slider
    // =======================================================================
    const businessesSwiperBreakNormalPoints = {
        0: {
            slidesPerView: 2,
        },
        480: {
            slidesPerView: 2,
        },
        767: {
            slidesPerView: 3,
        },
        992: {
            slidesPerView: 4,
        },
        1200: {
            slidesPerView: 6,
        },
    };

    const businessesSliderProps = {
        breakpoints: businessesSwiperBreakNormalPoints,
        className: ".businesses_swiper__",
        spaceBetween: 0,
        speed: 5000,
        autoplay: {delay: 0, disableOnInteraction: false, reverseDirection: true},
        loop: true,
        allowTouchMove: false,
        freeMode: false
    };

    swiperInit(businessesSliderProps);

    // =======================================================================
    // Banners Slider
    // =======================================================================
    const bannersSliderProps = {
        className: ".banner_swiper__",
        slidesPerView: 1.4,
        centeredSlides: true,
        loop: true,
        autoplay: false,
        breakpoints: {
            0: {
                spaceBetween: 8,
            },
            480: {
                spaceBetween: 16,
            },
            767: {
                spaceBetween: 24,
            },
            992: {
                spaceBetween: 32,
            },
        },
        autoplay: {
            delay: 2500,
            disableOnInteraction: false,
        },
    };

    swiperInit(bannersSliderProps);
}

function toggleSideMenuInSmallScreens($) {
    // nav menu activation
    $("#menu-butt-activ-om").on("click", function (e) {
        e.preventDefault();

        $("#navbar-menu-om").addClass("active-menu");
        $(".overlay").addClass("active");
        $("body").addClass("overflow-body");
    });

    // nav menu close
    $(".close-button__, .overlay").on("click", function (e) {
        e.preventDefault();
        $("#navbar-menu-om").removeClass("active-menu");
        $(".overlay").removeClass("active");
        $("body").removeClass("overflow-body");
    });
}

function stickyHeader($) {
    let headerHeight = $("header").outerHeight();

    $("header").innerHeight(headerHeight);

    let lastScroll = 0;
    $(document).on("scroll", function () {
        let currentScroll = $(this).scrollTop();

        // side links
        if (currentScroll > headerHeight + 500 || screen.width < 500) {
            $(".side_links_section").addClass("active");
        } else {
            $(".side_links_section").removeClass("active");
        }

        // add class active menu when scroll starts
        if (currentScroll > 0) {
            $(".fixed_header__").addClass("active_menu__");
        } else {
            $(".fixed_header__").removeClass("active_menu__");
        }
        lastScroll = currentScroll;
    });

    $(".arrow_button__").click(() => {
        $(".side_links_section").removeClass("active");
    });
}

function hidePreloader(duration = 2000) {
    $(".preloader").fadeOut(duration);
    $("body").removeClass("no_scroll__");
}

function dragToScrollTabs() {
    $('.tabs_list__').each(function() {
        const $slider = $(this);
        let isDown = false;
        let startX;
        let scrollLeft;

        // Mouse events
        $slider.on('mousedown', function(e) {
            isDown = true;
            $slider.css({
                'cursor': 'grabbing',
                'scroll-behavior': 'auto'
            });
            startX = e.pageX - $slider.offset().left;
            scrollLeft = $slider.scrollLeft();
        });

        $slider.on('mouseleave mouseup', function() {
            isDown = false;
            $slider.css({
                'cursor': 'grab',
                'scroll-behavior': 'smooth'
            });
        });

        $slider.on('mousemove', function(e) {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - $slider.offset().left;
            const walk = x - startX;
            $slider.scrollLeft(scrollLeft - walk);
        });

        // Touch events
        let touchStartX = 0;
        let touchScrollLeft = 0;

        $slider.on('touchstart', function(e) {
            $slider.css('scroll-behavior', 'auto');
            touchStartX = e.originalEvent.touches[0].pageX;
            touchScrollLeft = $slider.scrollLeft();
        });

        $slider.on('touchmove', function(e) {
            const x = e.originalEvent.touches[0].pageX;
            const walk = touchStartX - x;
            $slider.scrollLeft(touchScrollLeft + walk);
        });

        $slider.on('touchend', function() {
            $slider.css('scroll-behavior', 'smooth');
        });
    });
}

function customDropdown() {
    $(".dropdown_button__").on("click", function (event) {
        const parentElement = $(this).closest(".custom_dropdown__");
        const menu = parentElement.find(".dropdown_menu__");
        let timeoutId;

        event.preventDefault();
        parentElement.toggleClass("show");

        menu.on("mouseleave", function () {
            timeoutId = setTimeout(function () {
                parentElement.removeClass("show");
            }, 750);
        });

        menu.on("mouseenter", () => clearTimeout(timeoutId));
    });
}

function toggleMenu() {
    if (window.innerWidth < 991) return;

    let hideTimer;

    $('.header_list_item__.with_menu__').hover(
        function () {
            clearTimeout(hideTimer);
            $(this).addClass('active__');
        },
        function () {
            let element = $(this);
            hideTimer = setTimeout(function () {
                element.removeClass('active__');
            }, 300);
        }
    );
}

function generateDayWiseTimeSeries(baseval, count, yrange) {
    var i = 0;
    var series = [];
    while (i < count) {
        var x = baseval;
        var y = Math.floor(Math.random() * (yrange.max - yrange.min + 1)) + yrange.min;

        series.push([x, y]);
        baseval += 86400000; // Add one day in milliseconds
        i++;
    }
    return series;
}

function initChart(series) {
    var options = {
        series,
        chart: {
            type: 'area',
            height: 100,
            width: '300px',
            sparkline: {
                enabled: true
            },
            toolbar: {
                show: false
            }
        },
        colors: ['#078B4C'],
        dataLabels: {
            enabled: false
        },
        stroke: {
            curve: 'smooth',
            width: 2
        },
        fill: {
            type: 'gradient',
            gradient: {
                shade: 'light',
                shadeIntensity: 10,
                opacityFrom: 0.4,
                opacityTo: 0.1,
                stops: [0, 90, 100]
            }
        },
        tooltip: {
            enabled: true,
            theme: 'light',
            x: {
                show: false
            },
            y: {
                formatter: function(val) {
                    return val.toLocaleString();
                }
            }
        },
        xaxis: {
            type: 'datetime'
        }
    };

    var chart = new ApexCharts(document.querySelector("#chart"), options);
    chart.render();
}

function initGsapMarquees(options = {}) {
    const {
        selector = '.marquee_container__',
        contentSelector = '.marquee_content__',
        reverseClass = 'reverse__',
        speed = 120,               // px per second
        pauseOnHover = true,
        centerIfSmall = true
    } = options;

    document.querySelectorAll(selector).forEach(container => {
        const marquee = container.querySelector(contentSelector);
        if (!marquee) return;

        const originalHTML = marquee.innerHTML;
        let tween = null;
        const isReverse = container.classList.contains(reverseClass);

        function refreshLazy() {
            if (typeof initEnhancedLazyLoad === "function") {
                setTimeout(() => initEnhancedLazyLoad(), 100);
            }
        }

        function cleanup() {
            if (tween) { tween.kill(); tween = null; }
            gsap.set(marquee, { x: 0 });
            marquee.innerHTML = originalHTML;
            refreshLazy();
        }

        function init() {
            cleanup();

            const containerWidth = container.getBoundingClientRect().width;

            if (marquee.scrollWidth <= containerWidth + 1) {
                if (centerIfSmall) marquee.style.justifyContent = "center";
                return;
            }
            marquee.style.justifyContent = "";

            // duplication until we can loop seamlessly
            while (marquee.scrollWidth < containerWidth * 2) {
                marquee.innerHTML += originalHTML;
            }
            marquee.innerHTML += originalHTML;

            refreshLazy();

            const wrapWidth = marquee.scrollWidth / 2;

            // reverse must start inside duplicated content
            gsap.set(marquee, { x: isReverse ? -wrapWidth : 0 });

            tween = gsap.to(marquee, {
                x: isReverse ? `+=${wrapWidth}` : `-=${wrapWidth}`,
                duration: wrapWidth / speed,
                ease: "none",
                repeat: -1,
                modifiers: {
                    x: gsap.utils.unitize(
                        gsap.utils.wrap(-wrapWidth, 0)
                    )
                }
            });
        }

        if (pauseOnHover) {
            container.addEventListener('mouseenter', () => tween && tween.pause());
            container.addEventListener('mouseleave', () => tween && tween.play());
        }

        window.addEventListener('load', init);
        requestAnimationFrame(() => requestAnimationFrame(init));
        new ResizeObserver(init).observe(container);
    });
}
