jQuery.noConflict()(function($) {

    "use strict";



    var $window = window,
        offset = '90%',
        $doc = $(document),
        self = this,
        $body = $('body'),
        TweenMax = window.TweenMax,
        fl_theme = window.fl_theme || {};
    fl_theme.window = $(window);
    fl_theme.document = $(document);
    window.fl_theme = fl_theme;
    fl_theme.window = $(window);
    fl_theme.sameOrigin = true;

// Header Events
    fl_theme.initEventsCustom = function() {
        fl_theme.window.load(function() {
            if(fl_theme.sameOrigin && typeof parent.vc != 'undefined' && typeof parent.vc.events != 'undefined') {
                parent.vc.events.on('shortcodeView:ready', function() {
                    $('body').trigger('post-load');

                });
            }
        });
    };
// Stiky Sidebar
    fl_theme.initStikySidebar = function(){
        var sidebar_stiky = $('.sidebar-sticky');
        if(sidebar_stiky.length){
            sidebar_stiky.theiaStickySidebar({
                additionalMarginTop: 30,
                additionalMarginBottom: 30
            });
        }
    };

// Resize iframe video
    fl_theme.initResponsiveIframe = function(){
        var resizeitem = $('iframe');
        resizeitem.height(
            resizeitem.attr("height") / resizeitem.attr("width") * resizeitem.width()
        );
    };

//Image Popups
    fl_theme.initImagePopup = function(){
        $('.fl-gallery-image-popup').magnificPopup({
            delegate: 'a',
            type: 'image',
            removalDelay: 500,
            image: {
                markup: '<div class="mfp-figure">'+
                    '<div class="mfp-img"></div>'+
                    '<div class="mfp-bottom-bar">'+
                    '<div class="mfp-title"></div>'+
                    '</div>'+
                    '</div>'+
                    '<div class="mfp-close"></div>'+
                    '<div class="mfp-counter"></div>'
            },
            callbacks: {
                beforeOpen: function() {
                    this.st.image.markup = this.st.image.markup.replace('mfp-figure', 'mfp-figure mfp-with-anim');
                    this.st.mainClass = 'fl-zoom-in-popup-animation';
                }
            },
            closeOnContentClick: true,
            midClick: true,
            gallery: {
                enabled: true,
                arrowMarkup: '<button title="%title%" type="button" class="mfp-arrow mfp-arrow-%dir%">' +
                    '<svg viewBox="0 0 40 40">'+
                    '<path d="M10,20 L30,20 M22,12 L30,20 L22,28"></path>'+
                    '</svg>'+
                    '</button>', // markup of an arrow button

                tPrev: 'Previous', // title for left button
                tNext: 'Next', // title for right button

                tCounter: '<span class="mfp-counter">%curr% of %total%</span>' // markup of counter
            }
        });
    };
// Gallery Popups
    fl_theme.initGalleryPopup = function(){
        $('.fl-magic-popup').each(function() {
            var popup_gallery_custom_class = $(this).attr('data-custom-class'),
                gallery_enable = true,
                popup_type = 'image';
            if($(this).hasClass('fl-single-popup')){
                gallery_enable = false;
                popup_gallery_custom_class = 'fl-single-popup';
            } else if ($(this).hasClass('fl-video-popup')) {
                popup_type = 'iframe';
                gallery_enable = false;
                popup_gallery_custom_class = 'fl-video-popup';
            }

            $("." + popup_gallery_custom_class).magnificPopup({
                delegate: 'a',
                type: popup_type,
                gallery: {
                    enabled: gallery_enable,
                    tPrev: 'Previous',
                    tNext: 'Next',
                    tCounter: '<span class="mfp-counter">%curr% / %total%</span>' // markup of counter
                },
                image: {
                    markup:
                        '<div class="mfp-figure">'+
                        '<div class="mfp-img"></div>'+
                        '</div>'+
                        '<div class="mfp-close"></div>'+
                        '<div class="mfp-bottom-bar">'+
                        '<div class="mfp-title"></div>'+
                        '<div class="mfp-counter"></div>' +
                        '</div>'
                },
                iframe: {
                    markup: '<div class="mfp-iframe-scaler">'+
                        '<iframe class="mfp-iframe" frameborder="0" allowfullscreen></iframe>'+
                        '</div>'+
                        '<div class="mfp-close"></div>'
                },
                mainClass: 'mfp-zoom-in',
                removalDelay: 300,
                callbacks: {
                    open: function () {
                        $.magnificPopup.instance.next = function () {
                            var self = this;
                            self.wrap.removeClass('mfp-image-loaded');
                            setTimeout(function () {
                                $.magnificPopup.proto.next.call(self);
                            }, 120);
                        };
                        $.magnificPopup.instance.prev = function () {
                            var self = this;
                            self.wrap.removeClass('mfp-image-loaded');
                            setTimeout(function () {
                                $.magnificPopup.proto.prev.call(self);
                            }, 120);
                        }
                    },
                    imageLoadComplete: function () {
                        var self = this;
                        setTimeout(function () {
                            self.wrap.addClass('mfp-image-loaded');
                        }, 16);
                    }
                }
            });

        });
    };
// Var
    fl_theme.initCustomSelect =function(){
        var jelect = $('.jelect');
        if(jelect.length){
            jelect.jelect();
        }
    };
// Isotope Indicator
    fl_theme.initIsotopeCustomFunction = function() {
        var $grid = $('.fl-isotope-wrapper');
        $grid.isotope({
            itemSelector: '.fl-grid-item',
            isAnimated: true,
            percentPosition: true,
            masonry: {
                columnWidth: '.fl-grid-item'
            }
        });

        $grid.imagesLoaded().progress( function() {
            $grid.isotope('layout');
        });
    };


//Search Form Navigatop
    fl_theme.initHeaderSearchForm = function() {
        var $SearchForm = $('.header-search-form'),
            OpenSearchForm = void 0,
            search_form = $('form.search_global'),
            $searchformicon =  $('.header-search');



        self.toggleFullscreenSearchForm = function () {
            self[OpenSearchForm ? 'closeFullscreenSearchForm' : 'openFullscreenSearchForm']();
        };




        self.openFullscreenSearchForm = function () {
            if (OpenSearchForm || !$SearchForm.length) {
                return;
            }
            OpenSearchForm = 1;
            //Default
            // Search form Wrapper
            TweenMax.set($SearchForm, {
                opacity: 0,
                force3D: true
            });
            // Search form search_form
            TweenMax.set(search_form, {
                opacity: 0,
                y: '-100%',
                force3D: true
            });


            $searchformicon.addClass('opened');
            $searchformicon.removeClass('closed');

            // set top position and animate
            TweenMax.to($SearchForm, 0.4, {
                opacity: 1,
                display: 'block'
            });
            // Search form search_form
            TweenMax.to(search_form, 0.5, {
                opacity: 1,
                y: '0%',
                delay: 0.4
            });

            $SearchForm.addClass('open');
            $('body').addClass('stop-scrolling');
        };

        self.closeFullscreenSearchForm = function () {
            if (!OpenSearchForm || !$SearchForm.length) {
                return;
            }
            OpenSearchForm = 0;
            // disactive all togglers
            $searchformicon.removeClass('opened');
            $searchformicon.addClass('closed');


            // Search form search_form
            TweenMax.to(search_form, 0.4, {
                opacity: 0,
                y: '-100%'
            });

            // set top position and animate
            TweenMax.to($SearchForm, 0.4, {
                force3D: true,
                display: 'none',
                delay: 0.4
            });


            // open search form wrapper block
            $SearchForm.removeClass('open');

            $('body').removeClass('stop-scrolling');



        };

        $doc.on('click', '.header-search', function (e) {
            self.toggleFullscreenSearchForm();
            e.preventDefault();
        });

    };
// Fixed Nav Bar
    fl_theme.initNavBarFixed = function() {


        var c, currentScrollTop = 0;
        var body = $('body'),
            nav_bar = $('.fl--header'),
            nav_bar_height = nav_bar.height();

        if(nav_bar.hasClass( "fixed-navbar" )){
            body.find('.header-padding').css("padding-top",nav_bar_height+"px");

            $(window).scroll(function () {
                var a = $(window).scrollTop();
                var b = nav_bar.height();
                var d = nav_bar.find('.fl-top-header-content').height();
                currentScrollTop = a;
                if(nav_bar.hasClass( "auto-hide-navbar" )){
                    if (c < currentScrollTop && a > b + 500) {
                        nav_bar.addClass("scrollUp");
                    } else if (c > currentScrollTop && !(a <= b)) {
                        nav_bar.removeClass("scrollUp");
                    }
                }

                if (c < currentScrollTop && a > b) {
                    nav_bar.addClass("padding-disable");
                } else if (c > currentScrollTop && a < b + d ) {
                    nav_bar.removeClass("padding-disable");
                }

                if (c < currentScrollTop && a > b + 150) {
                    nav_bar.addClass("fixed-enable");
                }else if (c > currentScrollTop && a < b) {
                    nav_bar.removeClass("fixed-enable");
                }


                c = currentScrollTop;

            });
        }


    };
// Comments Back Content
    fl_theme.initCommentBackContent = function() {
        var comments_content = $('.comments-container'),
            comments_content_back_text = comments_content.data('coment-content'),
            asd= comments_content.find('.comment-title-content');

        asd.each(function () {
            $(this).append( $( "<div class='back-text'>"+comments_content_back_text+"</div>" ) );
        });
    };
// Car slider
    fl_theme.initCarsSlider = function() {

        $('.auto-slider .slides').slick({
            dots: false,
            infinite: false,
            speed: 500,
            slidesToShow: 1,
            slidesToScroll: 1,
            draggable: true,
            focusOnSelect: true,
            nextArrow: '.fl-slider-arrow-right',
            prevArrow: '.fl-slider-arrow-left',
            asNavFor: '.auto-carousel .slides'
        });

        $('.auto-carousel .slides').slick({
            dots: false,
            infinite: false,
            draggable: true,
            speed: 500,
            slidesToShow: 5,
            slidesToScroll: 1,
            focusOnSelect: true,
            arrows: false,
            swipeToSlide: true,
            asNavFor: '.auto-slider .slides',
            responsive: [
                {
                    breakpoint: 1024,
                    settings: {
                        slidesToShow: 3,
                        slidesToScroll: 1
                    }
                },
                {
                    breakpoint: 600,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1
                    }
                },
                {
                    breakpoint: 480,
                    settings: {
                        slidesToShow: 2,
                        slidesToScroll: 1
                    }
                }
            ]
        });

    };
// About Us Tabs
    fl_theme.initCustomTabs = function(){
        var $tabs = $('.wrap-nav-table-content');

        $tabs.on('click', 'li', function () {
            var tab_id = $(this).attr('data-tab'),
                $tabs_content = $('.tab-content'),
                $tabs_clicked = $("#"+tab_id);
            $tabs.find('li').removeClass('active');
            $(this).addClass('active');
            $tabs_content.removeClass('active');
            $tabs_clicked.addClass('active');
        });



    };
// Car Google Maps
    fl_theme.initCarGoogleMaps = function(){
        var car_maps = $('#contact-map'),
            lat = car_maps.attr('data-location-lat'),
            long = car_maps.attr('data-location-long');

        if(car_maps.length){
            car_maps.gmap3({
                marker: {
                    options: {
                        position:[lat, long],
                        //icon: "'.$image_done[0].'"
                    }
                },map: {
                    options: {
                        center:[lat, long],
                        zoom: 11,
                        scrollwheel: false,
                        draggable: true,
                        mapTypeControl: true,
                        styles:[{"featureType":"administrative","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-100},{"lightness":20}]},{"featureType":"road","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-100},{"lightness":40}]},{"featureType":"water","elementType":"all","stylers":[{"visibility":"on"},{"saturation":-10},{"lightness":30}]},{"featureType":"landscape.man_made","elementType":"all","stylers":[{"visibility":"simplified"},{"saturation":-60},{"lightness":10}]},{"featureType":"landscape.natural","elementType":"all","stylers":[{"visibility":"simplified"},{"saturation":-60},{"lightness":60}]},{"featureType":"poi","elementType":"all","stylers":[{"visibility":"off"},{"saturation":-100},{"lightness":60}]},{"featureType":"transit","elementType":"all","stylers":[{"visibility":"off"},{"saturation":-100},{"lightness":60}]}]
                    }
                }
            });

        }
    };
// Change Grid Switch Car Page
    fl_theme.initGridSwitchCar = function (){
        if ($('#pixad-listing').hasClass('grid')) {
            $('.sorting__item.view-by .grid').addClass('active')
        }else{
            $('.sorting__item.view-by .list').addClass('active')
        }
    };





    fl_theme.initCustomWidgetRange= function(){
        /////////////////////////////////////////////////////////////////
        //PRICE RANGE
        /////////////////////////////////////////////////////////////////
        if ($('#slider-price').length > 0) {
            var slider = document.getElementById('slider-price');
            var min_price = document.getElementById('pix-min-price').value;
            var max_price = document.getElementById('pix-max-price').value;
            var max_slider_price = document.getElementById('pix-max-slider-price').value;

            var pix_thousand = document.getElementById('pix-thousand').value;
            var pix_decimal = document.getElementById('pix-decimal').value;
            var pix_decimal_number = document.getElementById('pix-decimal_number').value;

            //var symbol_price = document.getElementById('pix-currency-symbol').value;
            min_price = min_price == '' ? 0 : min_price;
            max_price = max_price == '' ? max_slider_price : max_price;

            noUiSlider.create(slider, {
                start: [min_price, max_price],
                step: 1000,
                connect: true,
                range: {
                    'min': 0,
                    'max': Number(max_slider_price)
                },

                format: wNumb({
                    decimals: pix_decimal_number,
                    mark: pix_decimal,
                    thousand: pix_thousand
                })

            });

            var pValues_price = [
                document.getElementById('slider-price_min'),
                document.getElementById('slider-price_max')
            ];

            slider.noUiSlider.on('update', function( values, handle ) {
                pValues_price[handle].value = values[handle];
            });

            slider.noUiSlider.on('change', function( values, handle ) {
                $(pValues_price[handle]).trigger('change');
            });
        }


        /////////////////////////////////////////////////////////////////
        //YEAR RANGE
        /////////////////////////////////////////////////////////////////
        if ($('#slider-year').length > 0) {
            var slider_year = document.getElementById('slider-year');
            var min_year = document.getElementById('pix-min-year').value;
            var max_year = document.getElementById('pix-max-year').value;
            var max_slider_year = document.getElementById('pix-max-slider-year').value;
            min_year = min_year == '' ? 1950 : min_year;
            max_year = max_year == '' ? max_slider_year : max_year;

            noUiSlider.create(slider_year, {
                start: [min_year, max_year],
                step: 1,
                connect: true,
                range: {
                    'min': 1950,
                    'max': Number(max_slider_year)
                },

                format: {
                    to: function ( value ) {
                        return value;
                    },
                    from: function ( value ) {
                        return value;
                    }
                }

            });

            var pValues_year = [
                document.getElementById('slider-year_min'),
                document.getElementById('slider-year_max')
            ];

            slider_year.noUiSlider.on('update', function( values, handle ) {
                pValues_year[handle].value = values[handle];
            });

            slider_year.noUiSlider.on('change', function( values, handle ) {
                $(pValues_year[handle]).trigger('change');
            });

        }


        /////////////////////////////////////////////////////////////////
        //   MILEAGE RANGE
        /////////////////////////////////////////////////////////////////
        if ($('#slider-mileage').length > 0) {
            var slider_mileage = document.getElementById('slider-mileage');
            var min_mileage = document.getElementById('pix-min-mileage').value;
            var max_mileage = document.getElementById('pix-max-mileage').value;
            var max_slider_mileage = document.getElementById('pix-max-slider-mileage').value;
            min_mileage = min_mileage == '' ? 0 : min_mileage;
            max_mileage = max_mileage == '' ? max_slider_mileage : max_mileage;

            noUiSlider.create(slider_mileage, {
                start: [min_mileage, max_mileage],
                step: 10000,
                connect: true,
                range: {
                    'min': 0,
                    'max': Number(max_slider_mileage)
                },

                format: {
                    to: function ( value ) {
                        return value;
                    },
                    from: function ( value ) {
                        return value;
                    }
                }

            });

            var pValues_mileage = [
                document.getElementById('slider-mileage_min'),
                document.getElementById('slider-mileage_max')
            ];

            slider_mileage.noUiSlider.on('update', function( values, handle ) {
                pValues_mileage[handle].value = values[handle];
            });

            slider_mileage.noUiSlider.on('change', function( values, handle ) {
                $(pValues_mileage[handle]).trigger('change');
            });

        }


        /////////////////////////////////////////////////////////////////
        //   ENGINE RANGE
        /////////////////////////////////////////////////////////////////
        if ($('#slider-engine').length > 0) {
            var slider_engine = document.getElementById('slider-engine');
            var min_engine = document.getElementById('pix-min-engine').value;
            var max_engine = document.getElementById('pix-max-engine').value;
            var max_slider_engine = document.getElementById('pix-max-slider-engine').value;
            min_engine = min_engine == '' ? 0 : min_engine;
            max_engine = max_engine == '' ? max_slider_engine : max_engine;

            noUiSlider.create(slider_engine, {
                start: [min_engine, max_engine],
                step: 0.1,
                connect: true,
                range: {
                    'min': 0,
                    'max': Number(max_slider_engine)
                },

                // Full number format support.

            });

            var pValues_engine = [
                document.getElementById('slider-engine_min'),
                document.getElementById('slider-engine_max')
            ];

            slider_engine.noUiSlider.on('update', function( values, handle ) {
                pValues_engine[handle].value = values[handle];
            });

            slider_engine.noUiSlider.on('change', function( values, handle ) {
                $(pValues_engine[handle]).trigger('change');
            });

        }

    };

    fl_theme.initCustomHeidthLoginSearchForm = function(){
        var search_form = $('.header-search-form'),
            login_form = $('.login-form'),
            nav_bar = $('.fl--header'),
            nav_bar_height = nav_bar.height();

        if(login_form.length){
            login_form.css({ 'height': 'calc(100% - ' + nav_bar_height+ 'px)' });
            login_form.css("top",nav_bar_height+"px");
            if($body.hasClass('admin-bar')){
                login_form.css("top",nav_bar_height+30+"px");
            }
        }
        if(search_form.length){
            search_form.css({ 'height': 'calc(100% - ' + nav_bar_height+ 'px)' });
            search_form.css("top",nav_bar_height+"px");
            if($body.hasClass('admin-bar')){
                search_form.css("top",nav_bar_height+30+"px");
            }
        }

    };

    fl_theme.initCustomHeidthIframeSlider = function(){
        var slider_iframe = $('.car-details .auto-slider .slides li iframe'),
            slider_iframe_parent = $('.car-details .auto-slider .slides li').height();

        if(slider_iframe.length){
            slider_iframe.css({ 'height': '' + slider_iframe_parent+ 'px' });
        }



    };

    fl_theme.initCustomWidgetFunction = function(){
        /*Widgets*/
        $('.widget.widget_categories .children').parent('.cat-item').addClass('has-sub-category');
    };


    //Login Form
    fl_theme.initLoginFormOptionFunction = function(){
        var $loginForm = $('.login-form');
        var OpenLoginForm = void 0;
        var login_form = $('.fl-login_form');
        var $header_login_icon =  $('.header-login');



        self.toggleLoginForm = function () {
            self[OpenLoginForm ? 'closeHeaderLoginForm' : 'openHeaderLoginForm']();
        };




        self.openHeaderLoginForm = function () {
            if (OpenLoginForm || !$loginForm.length) {
                return;
            }
            OpenLoginForm = 1;
            //Default
            // Search form Wrapper
            TweenMax.set($loginForm, {
                opacity: 0,
                force3D: true
            });
            // Search form search_form
            TweenMax.set(login_form, {
                opacity: 0,
                y: '-100%',
                force3D: true
            });


            $header_login_icon.addClass('opened');
            $header_login_icon.removeClass('closed');

            // set top position and animate
            TweenMax.to($loginForm, 0.4, {
                opacity: 1,
                display: 'block'
            });
            // Search form search_form
            TweenMax.to(login_form, 0.5, {
                opacity: 1,
                y: '0%',
                delay: 0.4
            });

            $loginForm.addClass('open');
            $('body').addClass('stop-scrolling');
        };

        self.closeHeaderLoginForm = function () {
            if (!OpenLoginForm || !$loginForm.length) {
                return;
            }
            OpenLoginForm = 0;
            // disactive all togglers
            $header_login_icon.removeClass('opened');
            $header_login_icon.addClass('closed');


            // Search form search_form
            TweenMax.to(login_form, 0.4, {
                opacity: 0,
                y: '-100%'
            });
            // set top position and animate
            TweenMax.to($loginForm, 0.4, {
                force3D: true,
                display: 'none',
                delay: 0.4
            });


            // open search form wrapper block
            $loginForm.removeClass('open');

            $('body').removeClass('stop-scrolling');



        };

        $doc.on('click', '.header-login .fl-flipper-icon', function (e) {
            self.toggleLoginForm();
            e.preventDefault();
        });

    };

    // Open Close Mobile Navigation
    fl_theme.initMobileNavigationOpenClose = function () {
        var $navbar_wrapper         = $('.fl-mobile-menu-wrapper'),
            $navbar_menu_sidebar    = $('.fl--mobile-menu-navigation-wrapper'),
            $hamburgerbars          = $('.fl--hamburger-menu-wrapper,.fl--hamburger-menu'),
            $social_profiles        = $('.fl-mobile-menu-wrapper ul.fl-sidebar-social-profiles li a'),
            OpenNavBar              = void 0;

        self.fullscreenNavbarIsOpened = function () {
            return OpenNavBar;
        };

        self.toogleOpenCloseMobileMenu = function () {
            self[OpenNavBar ? 'closeFullscreenNavbar' : 'openFullscreenNavbar']();
        };
        self.openFullscreenNavbar = function () {
            if (OpenNavBar || !$navbar_wrapper.length) {
                return;
            }
            OpenNavBar = 1;

            var $navbarMenuItems = $navbar_wrapper.find('.fl--mobile-menu >li >a,.fl--mobile-menu li.opened .sub-menu >li >a');
            if (!$navbar_wrapper.find('.fl--mobile-menu >li.opened').length) {
                $navbarMenuItems = $navbar_wrapper.find('.fl--mobile-menu >li >a');
            }

            $hamburgerbars.addClass('opened');
            $hamburgerbars.removeClass('closed');

            // NavBarMenu Items Animation
            TweenMax.set($navbarMenuItems, {
                opacity: 0,
                x: '-20%',
                force3D: true
            });

            TweenMax.staggerTo($navbarMenuItems, 0.2, {
                opacity: 1,
                x: '0%',
                delay: 0.4
            }, 0.04);

            // Social Profiles Animation
            TweenMax.set($social_profiles, {
                opacity: 0,
                y: '-100%',
                force3D: true
            });

            TweenMax.staggerTo($social_profiles, 0.2, {
                opacity: 1,
                y: '0%',
                delay: 0.6
            }, 0.04);

            // NavBarMenu wrapper Animation
            TweenMax.set($navbar_wrapper, {
                display: 'none',
                force3D: true
            });

            TweenMax.to($navbar_wrapper, 0.4, {
                opacity: 1,
                display: 'block'
            }, 0.04);

            // NavBarMenu menu sidebar Animation
            TweenMax.set($navbar_menu_sidebar, {
                opacity: 0,
                x: '-100%',
                force3D: true
            });

            TweenMax.to($navbar_menu_sidebar, 0.4, {
                opacity: 1,
                x: '0%',
                display: 'block'
            }, 0.04);

            $navbar_wrapper.addClass('open');

        };

        self.closeFullscreenNavbar = function (dontTouchBody) {
            if (!OpenNavBar || !$navbar_wrapper.length) {
                return;
            }
            OpenNavBar = 0;


            // disactive all togglers
            $hamburgerbars.removeClass('opened');
            $hamburgerbars.addClass('closed');


            var $navbarMenuItems = $navbar_wrapper.find('.fl--mobile-menu >li >a');


            // set top position and animate
            TweenMax.to($navbar_wrapper, 0.4, {
                force3D: true,
                opacity: 0,
                display: 'none',
                delay: 0.1
            });

            TweenMax.to($navbar_menu_sidebar, 0.2, {
                opacity: 0,
                x: '-100%',
                force3D: true,
                delay: 0.3
            }, 0.1);

            TweenMax.to($navbarMenuItems, 0.2, {
                opacity: 0,
                x: '-20%',
                delay: 0.2
            }, 0.1);



            // open navbar block
            $navbar_wrapper.removeClass('open');

        };

        $doc.on('click', '.fl--hamburger-menu-wrapper,.fl--mobile-menu-icon,.fl--hamburger-menu', function (e) {
            self.toogleOpenCloseMobileMenu();
            e.preventDefault();
        });
    };
// Mobile Menu
    fl_theme.initMobileNavigationSubMenuAnimation = function () {
        var $mobileMenu = $('.fl--mobile-menu');

        $mobileMenu.find('li').each(function(){
            var $this = $(this);
            if($this.find('ul').length > 0) {
                $this.find('> a').append('<span class="fl-menu-flipper-icon fl--open-child-menu"><span class="fl-front-content"><i class="fl-custom-icon-list-style-6"></i></span><span class="fl-back-content"><i class="fl-custom-icon-cancel-5"></i></span></span>');
            }
        });

        // open -> close sub-menu
        function toggleSub_menu($sub_menu_find) {
            var $navigation_Items = $sub_menu_find.find('.sub-nav >.sub-menu >li >a');

            if (!$sub_menu_find.find('.sub-nav >.sub-menu >li.opened').length) {
                $navigation_Items = $sub_menu_find.find('.sub-menu >li >a');
            }

            TweenMax.set($navigation_Items, {
                opacity: 0,
                x: '-20%',
                force3D: true
            }, 0.04);
            if ($sub_menu_find.hasClass('opened')) {
                $sub_menu_find.removeClass('opened');
                $sub_menu_find.find('li').removeClass('opened');
                $sub_menu_find.find('ul').slideUp(200);
                TweenMax.staggerTo($navigation_Items, 0.3, {
                    opacity: 0,
                    x: '-20%',
                    force3D: true
                }, 0.04);
                console.log($navigation_Items);
            } else {
                TweenMax.staggerTo($navigation_Items, 0.3, {
                    x: '0%',
                    opacity: 1,
                    delay: 0.2
                }, 0.04);

                $sub_menu_find.addClass('opened');
                if (!$sub_menu_find.children('ul').length) {
                    $sub_menu_find.find('div').children('ul').slideDown();
                } else {
                    $sub_menu_find.children('ul').slideDown();
                }
                // Sub menu Children
                $sub_menu_find.siblings('li').children('ul').slideUp(200);
                $sub_menu_find.siblings('li').removeClass('opened');
                $sub_menu_find.siblings('li').find('li').removeClass('opened');
                $sub_menu_find.siblings('li').find('ul').slideUp(200);
            }
        }

        $mobileMenu.on('click', 'li.has-submenu >a', function (e) {
            toggleSub_menu($(this).parent());
            e.preventDefault();
        });
    };


    fl_theme.initWPMLDemoClickLink = function(){

        $body.on('click', '.demo-language-selector a', function (e) {

            alert('The language switcher requires WPML plugin to be installed and activated.If you don\'t need this option do not install the plugin');

            e.preventDefault();
        });
    };

    fl_theme.initVelocityAnimationSave = function(){
        var animated_velocity = $('.fl-animated-item-velocity');

        // Hided item if animated not complete
        animated_velocity.each(function () {
            var $this = $(this),
                $item;

            if ($this.data('item-for-animated')) {
                $item = $this.find($this.data('item-for-animated'));
                $item.each(function() {
                    if(!$(this).hasClass('animation-complete')) {
                        $(this).css('opacity','0');
                    }
                });
            } else {
                if(!$this.hasClass('animation-complete')) {
                    $this.css('opacity','0');
                }
            }
        });

        // animated Function
        animated_velocity.each(function () {
            var $this_item = $(this), $item, $animation;
            $animation = $this_item.data('animate-type');
            if ($this_item.data('item-for-animated')) {
                $item = $this_item.find($this_item.data('item-for-animated'));
                $item.each(function() {
                    var $this = $(this);
                    var delay='';
                    if ($this_item.data('item-delay')) {
                        delay = $this_item.data('item-delay');
                    }else {
                        if ($this.data('item-delay')) {
                            delay = $this.data('item-delay');
                        }
                    }
                    $this.waypoint(function () {
                            if(!$this.hasClass('animation-complete')) {
                                $this.addClass('animation-complete')
                                    .velocity('transition.'+$animation,{delay:delay,display:'undefined',opacity:1});
                            }
                        },
                        {
                            offset: offset
                        });
                });
            } else {
                $this_item.waypoint(function () {
                        var delay='';
                        if ($this_item.data('item-delay')) {
                            delay = $this_item.data('item-delay');
                        }

                        if(!$this_item.hasClass('animation-complete')) {
                            $this_item.addClass('animation-complete')
                                .velocity('transition.'+$animation,{  delay:delay,display:'undefined',opacity:1});
                        }

                    },
                    {
                        offset: offset
                    });
            }
        });
    };

    fl_theme.initVcCustomFunction = function(){

        var initVcShortcodeFunction = function(){
                initVelocityAnimation();
                initCounterFunction();
                initHotspot();
                initTespimonialSlider();
                initProgressBarFunction();
                initAccordionFunction();
                initTabsVCFunction();
                initProgressBar();
                initServicesBoatSlider();
                initVideoButtonSetting();
            },

            // Velocity Animation
            initVelocityAnimation = function(){
                var animated_velocity = $('.fl-animated-item-velocity');

                // Hided item if animated not complete
                animated_velocity.each(function () {
                    var $this = $(this),
                        $item;

                    if ($this.data('item-for-animated')) {
                        $item = $this.find($this.data('item-for-animated'));
                        $item.each(function() {
                            if(!$(this).hasClass('animation-complete')) {
                                $(this).css('opacity','0');
                            }
                        });
                    } else {
                        if(!$this.hasClass('animation-complete')) {
                            $this.css('opacity','0');
                        }
                    }
                });

                // animated Function
                animated_velocity.each(function () {
                    var $this_item = $(this), $item, $animation;
                    $animation = $this_item.data('animate-type');
                    if ($this_item.data('item-for-animated')) {
                        $item = $this_item.find($this_item.data('item-for-animated'));
                        $item.each(function() {
                            var $this = $(this);
                            var delay='';
                            if ($this_item.data('item-delay')) {
                                delay = $this_item.data('item-delay');
                            }else {
                                if ($this.data('item-delay')) {
                                    delay = $this.data('item-delay');
                                }
                            }
                            $this.waypoint(function () {
                                    if(!$this.hasClass('animation-complete')) {
                                        $this.addClass('animation-complete')
                                            .velocity('transition.'+$animation,{delay:delay,display:'undefined',opacity:1});
                                    }
                                },
                                {
                                    offset: offset
                                });
                        });
                    } else {
                        $this_item.waypoint(function () {
                                var delay='';
                                if ($this_item.data('item-delay')) {
                                    delay = $this_item.data('item-delay');
                                }

                                if(!$this_item.hasClass('animation-complete')) {
                                    $this_item.addClass('animation-complete')
                                        .velocity('transition.'+$animation,{  delay:delay,display:'undefined',opacity:1});
                                }

                            },
                            {
                                offset: offset
                            });
                    }
                });
            },
            // Counter
            initCounterFunction = function () {
                var fl_counter = $('.fl-counter');
                fl_counter.each(function() {
                    var $this = $(this);
                    $this.waypoint(function () {
                        $this.countTo();
                    },{
                        offset: offset
                    });
                });
            },
            // Hot Spot
            initHotspot = function() {
                var initOffsets = function() {
                    $('.fl-hotspot-shortcode').each(function() {
                        $(this).find('.HotspotPlugin_Hotspot').each(function(index) {
                            var $self = $(this);
                            if( !$self.parents('.fp-scroller').length) {
                                if(!$self.hasClass('animation-done')) {
                                    $self.css('opacity', '0');
                                }
                                $self.waypoint(function () {
                                    if(!$self.hasClass('animation-done')) {
                                        $self.addClass('animation-done')
                                            .velocity('transition.slideUpBigIn',{
                                                display: 'block',
                                                opacity: '1',
                                                delay: index * 20,
                                                complete: function(el) {
                                                    $(el).css({
                                                        '-webkit-transform': 'none',
                                                        '-moz-transform': 'none',
                                                        '-o-transform': 'none',
                                                        'transform': 'none'
                                                    });
                                                }
                                            });
                                    }
                                }, {offset: offset});
                            }
                        });
                    });

                };
                $('.fl-hotspot-shortcode').each(function() {
                    var $self = $(this),
                        hotspotContent = $self.data('hotspot-content') ? $self.data('hotspot-content') : '';

                    if(hotspotContent != '' && !$self.find('.fl-hotspot-image-cover').hasClass('fl-htospot-inited')) {
                        $self.find('.fl-hotspot-image-cover').addClass('fl-htospot-inited').hotspot({
                            hotspotClass: 'HotspotPlugin_Hotspot',
                            interactivity: 'hover',
                            data: decodeURIComponent(hotspotContent)
                        });
                    }
                });
                $('body').on('fl-hotspot-inited', initOffsets);
                initOffsets();
                window.fl_theme.window.on('resize', initOffsets);
            },
            // Testimonial Slider
            initTespimonialSlider = function () {
                var testimonila_slider = $('.testimonial-slider');
                if(testimonila_slider.length){
                    testimonila_slider.each(function() {
                        var $this = $(this);
                        $this.not('.slick-initialized').slick({
                            dots: false,
                            infinite: true,
                            prevArrow: null,
                            nextArrow: null,
                            autoplay:true,
                            autoplaySpeed: 6000,
                            speed: 500,
                            slidesToShow: 1,
                            slidesToScroll: 1,
                            draggable: true,
                            responsive: [
                                {
                                    breakpoint: 900,
                                    settings: {
                                        slidesToShow: 1,
                                        slidesToScroll: 1
                                    }
                                },
                            ]
                        });
                    });
                }

            },
            // Progress Bar
            initProgressBarFunction = function () {
                var fl_progress_bar = $('.fl-progress-bar');
                fl_progress_bar.each(function() {
                    var $this = $(this);
                    $this.waypoint(function () {
                        var duration_progress = Number($this.attr("data-duration"));
                        $this.find('.fl-tracking-progress-bar__item').animate({
                            width:$this.attr('data-progress-width')
                        },duration_progress);
                        $this.find('.fl-progress-wrapper').animate(
                            {text:$this.attr('data-progress-width')},
                            {
                                duration: duration_progress,
                                step: function(now) {
                                    var data = Math.round(now);
                                    $this.find('.fl-progress-bar__number .fl-animated-number').html(data + '%');
                                }
                            });
                    },{
                        offset: offset
                    });
                });
            },
            // Accordion
            initAccordionFunction = function (){
                var fl_accordion = $('.fl-accordion');
                fl_accordion.each(function(){
                    var $this = $(this);
                    $this.find('.vc_tta-panel-heading .vc_tta-panel-title a').append( "<span class='fl-counter-animated-icon'><i class='fa fa-angle-right'></i></span>" );
                });
            },
            // Tabs
            initTabsVCFunction = function (){
                var tabs = $(".fl-tabs");
                tabs.each(function() {
                    var customClass = $(this).attr('data-custom-tabs-class');
                    $(customClass).on('click','.nav-tabs li',  function(e){
                        var $this = $(this),parrent = $this.parent(),data = $this.attr('data-tab');
                        $(customClass).find('.nav-tabs li').removeClass('active');
                        $this.addClass('active');
                        $(customClass).find('.tab-content .tab-pane').removeClass('active');
                        $(customClass).find('.'+data).addClass('active');
                        e.preventDefault();
                    });
                })
            },
            // Services Boat Slider
            initServicesBoatSlider = function () {
                var services_boat_slider = $('.services-boat-slider');
                if(services_boat_slider.length){
                    services_boat_slider.each(function() {
                        var $this = $(this);
                        $this.not('.slick-initialized').slick({
                            dots: false,
                            infinite: true,
                            prevArrow: $this.parent().find('.left-slider-arrow'),
                            nextArrow: $this.parent().find('.right-slider-arrow'),
                            autoplay:true,
                            autoplaySpeed: 6000,
                            speed: 500,
                            slidesToShow: 3,
                            slidesToScroll: 1,
                            draggable: true,
                            responsive: [
                                {
                                    breakpoint: 993,
                                    settings: {
                                        slidesToShow: 2,
                                        slidesToScroll: 1
                                    }
                                },
                                {
                                    breakpoint: 769,
                                    settings: {
                                        slidesToShow: 1,
                                        slidesToScroll: 1
                                    }
                                },
                            ]
                        });
                    });
                }

            },
            // Video Button Setting
            initVideoButtonSetting = function () {
                var venobox = $('.venobox');
                if(venobox.length){
                    venobox.each(function() {
                        $(this).venobox();
                    });
                }

            },
            // Progress Bar
            initProgressBar = function() {
                $(".vc-semi-circle-progress-bar").each(function(){
                    var bar = $(this).find(".bar"),
                        val = $(this).find("span"),
                        per = parseInt( val.text(), 10),
                        $this = $(this);
                    $this.waypoint(function () {
                            if(!$this.hasClass('animation-progress-complete')) {
                                $({p:0}).animate({p:per}, {
                                    duration: 1500,
                                    step: function(p) {
                                        bar.css({
                                            transform: "rotate("+ (45+(p*1.8)) +"deg)"
                                        });
                                        val.text(p|0);
                                    }
                                }).delay( 200 );
                                $this.addClass('animation-progress-complete');
                            }
                        },
                        {
                            offset: offset
                        });

                });
            };

        fl_theme.document.ready(function() {
            initVcShortcodeFunction();
        });
        $('body').on('post-load', initVcShortcodeFunction);

    };


    fl_theme.initListingButton = function () {
        var $ButtonListingWrap = $('#pixad-listing');
        $ButtonListingWrap.on('click', '.button-info', function () {
            var $thisItemParrent = $(this).parent().parent();
            $thisItemParrent.addClass('opened');
        });
        $ButtonListingWrap.on('click', '.button-info-closed', function () {
            var $thisItemParrent = $(this).parent().parent();
            $thisItemParrent.removeClass('opened');
        });
    };
    // Line Height Check
    fl_theme.initLineHeightСheck = function () {
        var $element = $('.single-page-wrapper .inner_content .fl-content >p,.single-post-wrapper .post-inner_content >p');
        $element.each(function() {
            if ($(this).css("font-size") >= "20px") {
                $(this).css('line-height','1.6');
            }
        });
    };

    fl_theme.initAcFunctiom = function(){
        'use strict';

        class Accordion {
            constructor(element, options = {}) {
                this.accordion = element
                this.buttons = null
                this.bodies = null
                this.options = {
                    activeClassName: 'is-active',
                    closeOthers: true,
                    ...options,
                }

                this.handleKeydown = this.handleKeydown.bind(this)
                this.handleClick = this.handleClick.bind(this)
                this.handleTransitionend = this.handleTransitionend.bind(this)

                this.init()
            }

            init() {
                if (this.accordion.classList.contains('is-init-accordion')) {
                    throw Error('Accordion is already initialized.')
                }

                this.buttons = [...this.accordion.querySelectorAll('.js-accordion__button')]
                this.bodies = [...this.accordion.querySelectorAll('.js-accordion__body')]

                // Handle active accordion item
                for (const button of this.buttons) {
                    if (!button.classList.contains(this.options.activeClassName)) continue
                    button.setAttribute('aria-expanded', 'true')
                    const body = button.nextElementSibling
                    body.style.display = 'block'
                    body.style.maxHeight = 'none'
                }

                // Hide all bodies except the active
                for (const body of this.bodies) {
                    if (body.previousElementSibling.classList.contains(this.options.activeClassName)) continue
                    body.style.display = 'none'
                    body.style.maxHeight = '0px'
                }

                this.addEvents()

                this.accordion.classList.add('is-init-accordion')
            }

            closeOthers(elException) {
                for (const button of this.buttons) {
                    if (button === elException) continue
                    button.classList.remove(this.options.activeClassName)
                    button.setAttribute('aria-expanded', 'false')
                    const body = button.nextElementSibling
                    body.style.maxHeight = `${body.scrollHeight}px`
                    setTimeout(() => void (body.style.maxHeight = '0px'), 0)
                }
            }

            handleKeydown(event) {
                const target = event.target
                const key = event.which.toString()

                if (target.classList.contains('js-accordion__button') && key.match(/35|36|38|40/)) {
                    event.preventDefault()
                } else {
                    return false
                }

                switch (key) {
                    case '36':
                        // "Home" key
                        this.buttons[0].focus()
                        break
                    case '35':
                        // "End" key
                        this.buttons[this.buttons.length - 1].focus()
                        break
                    case '38':
                        // "Up Arrow" key
                        const prevIndex = this.buttons.indexOf(target) - 1
                        if (this.buttons[prevIndex]) {
                            this.buttons[prevIndex].focus()
                        } else {
                            this.buttons[this.buttons.length - 1].focus()
                        }
                        break
                    case '40':
                        // "Down Arrow" key
                        const nextIndex = this.buttons.indexOf(target) + 1
                        if (this.buttons[nextIndex]) {
                            this.buttons[nextIndex].focus()
                        } else {
                            this.buttons[0].focus()
                        }
                        break
                }
            }

            handleClick(event) {
                const button = event.currentTarget
                const body = button.nextElementSibling

                if (this.options.closeOthers) {
                    this.closeOthers(button)
                }

                // Set height to the active body
                if (body.style.maxHeight === 'none') {
                    body.style.maxHeight = `${body.scrollHeight}px`
                }

                if (button.classList.contains(this.options.activeClassName)) {
                    // Close accordion item
                    button.classList.remove(this.options.activeClassName)
                    button.setAttribute('aria-expanded', 'false')
                    setTimeout(() => void (body.style.maxHeight = '0px'), 0)
                } else {
                    // Open accordion item
                    button.classList.add(this.options.activeClassName)
                    button.setAttribute('aria-expanded', 'true')
                    body.style.display = 'block'
                    body.style.maxHeight = `${body.scrollHeight}px`
                }
            }

            handleTransitionend(event) {
                const body = event.currentTarget
                if (body.style.maxHeight !== '0px') {
                    // Remove the height from the active body
                    body.style.maxHeight = 'none'
                } else {
                    // Hide the active body
                    body.style.display = 'none'
                }
            }

            addEvents() {
                this.accordion.addEventListener('keydown', this.handleKeydown)
                for (const button of this.buttons) {
                    button.addEventListener('click', this.handleClick)
                }
                for (const body of this.bodies) {
                    body.addEventListener('transitionend', this.handleTransitionend)
                }
            }

            destroy() {
                this.accordion.removeEventListener('keydown', this.handleKeydown)
                for (const button of this.buttons) {
                    button.removeEventListener('click', this.handleClick)
                }
                for (const body of this.bodies) {
                    body.addEventListener('transitionend', this.handleTransitionend)
                }

                this.buttons = null
                this.bodies = null

                this.accordion.classList.remove('is-init-accordion')
            }
        }

// ---

        window.addEventListener('DOMContentLoaded', () => {
            const accordionEls = [...document.querySelectorAll('.js-accordion')]
            for (const accordionEl of accordionEls) {
                new Accordion(accordionEl)
            }
        })
    };

    // Car slider
    fl_theme.initArchiveBoatsSliderImage = function() {
        if($('.gallery-archive-boats-image').length){
            $('.gallery-archive-boats-image').each(function() {
                var $this = $(this);
                var slider_big = $this.data('custom-html-slider');
                var slider_small = $this.data('custom-carousel-html-slider');
                $('.'+slider_big).not('.slick-initialized').slick({
                    dots: false,
                    infinite: false,
                    speed: 500,
                    slidesToShow: 1,
                    slidesToScroll: 1,
                    draggable: true,
                    focusOnSelect: true,
                    nextArrow: '.fl-slider-arrow-right',
                    prevArrow: '.fl-slider-arrow-left',
                    asNavFor: '.'+slider_small+' .slider-carousel-content'
                });

                $('.'+slider_small+' .slider-carousel-content').not('.slick-initialized').slick({
                    dots: false,
                    infinite: false,
                    draggable: true,
                    speed: 500,
                    slidesToShow: 2,
                    slidesToScroll: 1,
                    focusOnSelect: true,
                    arrows: false,
                    swipeToSlide: true,
                    asNavFor: '.'+slider_big,
                });
            });
        }
    };
    fl_theme.initCustomFunction = function(){
        //Slider Boats Archive
        fl_theme.initArchiveBoatsSliderImage();
        //
        fl_theme.initEventsCustom();
        // Sidebar
        fl_theme.initStikySidebar();
        // Resize iframe video
        fl_theme.initResponsiveIframe();
        // Image Popup
        fl_theme.initImagePopup();
        // Gallery Popups
        fl_theme.initGalleryPopup();
        // Select
        fl_theme.initCustomSelect();
        // Open Close Mobile Navigation
        fl_theme.initMobileNavigationOpenClose();
        // Sub Menu Animation
        fl_theme.initMobileNavigationSubMenuAnimation();
        // FullscreenSearch
        fl_theme.initHeaderSearchForm();
        // Header Login Form
        fl_theme.initLoginFormOptionFunction();
        //Navbar fixed
        fl_theme.initNavBarFixed();
        // Comments Back Content
        fl_theme.initCommentBackContent();
        // Car slider
        fl_theme.initCarsSlider();
        // Custom Tabs
        fl_theme.initCustomTabs();
        // Car Google Maps
        fl_theme.initCarGoogleMaps();
        // Change Grid Switch Car Page
        fl_theme.initGridSwitchCar();
        // Widget Range
        fl_theme.initCustomWidgetRange();
        //
        fl_theme.initCustomHeidthLoginSearchForm();
        //
        fl_theme.initCustomWidgetFunction();
        //  Custom Iframe Slider Function
        fl_theme.initCustomHeidthIframeSlider();
        //  WPML Demo Click Link
        fl_theme.initWPMLDemoClickLink();
        //
        fl_theme.initVcCustomFunction();
        //
        fl_theme.initListingButton();
        // Line Height Check
        fl_theme.initLineHeightСheck();
    };


    fl_theme.initCustomFunction();


    $($window).resize(function() {
        fl_theme.initResponsiveIframe();
        fl_theme.initNavBarFixed();
        //
        fl_theme.initCustomHeidthLoginSearchForm();
        // Resize iframe video
        fl_theme.initResponsiveIframe();
        // Custom Iframe Slider Function
        fl_theme.initCustomHeidthIframeSlider();
        setTimeout(fl_theme.initCustomHeidthIframeSlider, 200);
    });

    $($window).scroll(function() {
        fl_theme.initCustomHeidthLoginSearchForm();
    });


});