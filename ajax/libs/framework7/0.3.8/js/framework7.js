/*
 * Framework7 0.3.8
 * Full Featured HTML Framework For Building iOS7 Apps
 *
 * http://www.idangero.us/framework7
 *
 * Copyright 2014, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 *
 * Licensed under MIT
 *
 * Released on: March 4, 2014
*/
(function () {

    'use strict';
    /*===========================
    Framework 7
    ===========================*/
    window.Framework7 = function (params) {
        // CSS ":active" pseudo selector fix
        document.addEventListener('touchstart', function () {}, true);
    
        // App
        var app = this;
    
        // Anim Frame
        app._animFrame = function (callback) {
            if (window.requestAnimationFrame) window.requestAnimationFrame(callback);
            else if (window.webkitRequestAnimationFrame) window.webkitRequestAnimationFrame(callback);
            else if (window.mozRequestAnimationFrame) window.mozRequestAnimationFrame(callback);
            else {
                window.setTimeout(callback, 1000 / 60);
            }
        };
    
        // Default Parameters
        app.params = {
            cache: true,
            cacheDuration: 1000 * 60 * 10, // Ten minutes 
            preloadPreviousPage: true,
            swipeBackPage: true,
            swipeBackPageThreshold: 30,
            swipeBackPageActiveArea: 30,
            // Panels
            panelsCloseByOutside: true,
            panelsVisibleZIndex: 6000,
            panelsAnimationDuration: 400,
            // panelsOpenBySwipe: true,
            modalTemplate: '<div class="modal {{noButtons}}">' +
                                '<div class="modal-inner">' +
                                    '{{if title}}<div class="modal-title">{{title}}</div>{{/if title}}' +
                                    '<div class="modal-text">{{text}}</div>' +
                                    '{{afterText}}' +
                                '</div>' +
                                '<div class="modal-buttons">{{buttons}}</div>' +
                            '</div>',
            modalActionsTemplate: '<div class="actions-modal">{{buttons}}</div>',
            modalButtonOk: 'OK',
            modalButtonCancel: 'Cancel',
            modalTitle: 'Framework7',
            modalCloseByOutside: false,
            modalActionsCloseByOutside: true,
            modalPreloaderText: 'Loading... '
        };
    
        // Extend defaults with parameters
        for (var param in params) {
            app.params[param] = params[param];
        }
    
        // Expose DOM lib
        app.$ = $;
    
        // Touch events
        app.touchEvents = {
            start: $.supportTouch ? 'touchstart' : 'mousedown',
            move: $.supportTouch ? 'touchmove' : 'mousemove',
            end: $.supportTouch ? 'touchend' : 'mouseup'
        };
        /*======================================================
        ************   Views   ************
        ======================================================*/
        app.views = [];
        app.addView = function (viewSelector, viewParams) {
            if (!viewSelector) return;
            var container = $(viewSelector)[0];
            var view = {
                container: container,
                selector: viewSelector,
                params: viewParams || {},
                history: [],
                url: '',
                pagesContainer: $('.pages', container)[0],
                main: $(container).hasClass('view-main'),
                loadPage: function (url) {
                    app.loadPage(view, url);
                },
                goBack: function (url) {
                    app.goBack(view, url);
                },
                hideNavbar: function () {
                    app.hideNavbar(container);
                },
                showNavbar: function () {
                    app.showNavbar(container);
                },
                hideToolbar: function () {
                    app.hideToolbar(container);
                },
                showToolbar: function () {
                    app.showToolbar(container);
                }
            };
            // Store to history main view's url
            if (view.main) {
                view.url = document.location.href;
                view.history.push(view.url);
            }
            // Store View in element for easy access
            container.f7View = view;
        
            // Add view to app
            app.views.push(view);
        
            // Init View's events
            app.initViewEvents(view);
        
            // Return view object
            return view;
        };
        
        // Live Events on view links
        app.initViewEvents = function (view) {
            // Swipe Back to previous page
            var viewContainer = $(view.container),
                isTouched = false,
                isMoved = false,
                touchesStart = {},
                isScrolling,
                activePage,
                previousPage,
                viewContainerWidth,
                touchesDiff,
                allowViewTouchMove = true,
                touchStartTime,
                activeNavbar,
                previousNavbar,
                activeNavElements,
                previousNavElements,
                i,
                dynamicNavbar,
                el;
        
            viewContainer.on(app.touchEvents.start, function (e) {
                if (!allowViewTouchMove || !app.params.swipeBackPage) return;
                isMoved = false;
                isTouched = true;
                isScrolling = undefined;
                touchesStart.x = e.type === 'touchstart' ? e.targetTouches[0].pageX : e.pageX;
                touchesStart.y = e.type === 'touchstart' ? e.targetTouches[0].pageY : e.pageY;
                touchStartTime = (new Date()).getTime();
                dynamicNavbar = view.params.dynamicNavbar && viewContainer.find('.navbar-inner').length > 1;
            });
            viewContainer.on(app.touchEvents.move, function (e) {
                if (!isTouched) return;
                
                var pageX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
                var pageY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                if (typeof isScrolling === 'undefined') {
                    isScrolling = !!(isScrolling || Math.abs(pageY - touchesStart.y) > Math.abs(pageX - touchesStart.x));
                }
                if (isScrolling) {
                    isTouched = false;
                    return;
                }
        
                if (!isMoved) {
                    var cancel = false;
                    // Calc values during first move fired
                    viewContainerWidth = viewContainer.width();
                    activePage = $(e.target).is('.page') ? $(e.target) : $(e.target).parents('.page');
                    previousPage = viewContainer.find('.page-on-left');
                    if (touchesStart.x - viewContainer.offset().left > app.params.swipeBackPageActiveArea) cancel = true;
                    if (previousPage.length === 0 || activePage.length === 0) cancel = true;
                    if (cancel) {
                        isTouched = false;
                        return;
                    }
                    if (dynamicNavbar) {
                        activeNavbar = viewContainer.find('.navbar-on-center');
                        previousNavbar = viewContainer.find('.navbar-on-left');
                        activeNavElements = activeNavbar.find('.left, .center, .right');
                        previousNavElements = previousNavbar.find('.left, .center, .right');
                    }
                }
                isMoved = true;
        
                e.preventDefault();
                touchesDiff = pageX - touchesStart.x - app.params.swipeBackPageThreshold;
                if (touchesDiff < 0) touchesDiff = 0;
                var percentage = touchesDiff / viewContainerWidth;
        
                // Transform pages
                activePage.transform('translate3d(' + touchesDiff + 'px,0,0)');
                activePage[0].style.boxShadow = '0px 0px 8px rgba(0,0,0,' + (0.6 - 0.6 * percentage) + ')';
                previousPage.transform('translate3d(' + (touchesDiff / 5 - viewContainerWidth / 5) + 'px,0,0)');
                previousPage[0].style.opacity = 0.8 + 0.2 * percentage;
        
                // Dynamic Navbars Animation
                if (dynamicNavbar) {
                    for (i = 0; i < activeNavElements.length; i++) {
                        el = $(activeNavElements[i]);
                        el[0].style.opacity = (1 - percentage * 1.3);
                        if (el[0].className.indexOf('sliding') >= 0) {
                            el.transform('translate3d(' + (percentage * el[0].f7NavbarRightOffset) + 'px,0,0)');
                        }
                    }
                    for (i = 0; i < previousNavElements.length; i++) {
                        el = $(previousNavElements[i]);
                        el[0].style.opacity = percentage * 1.3 - 0.3;
                        if (el[0].className.indexOf('sliding') >= 0) {
                            el.transform('translate3d(' + (el[0].f7NavbarLeftOffset * (1 - percentage)) + 'px,0,0)');
                        }
                    }
                }
        
            });
            viewContainer.on(app.touchEvents.end, function (e) {
                if (!isTouched || !isMoved) {
                    isTouched = false;
                    isMoved = false;
                    return;
                }
                isTouched = false;
                isMoved = false;
                var timeDiff = (new Date()).getTime() - touchStartTime;
                var pageChanged = false;
                // Swipe back to previous page
                if (
                        timeDiff < 300 && touchesDiff > 10 ||
                        timeDiff >= 300 && touchesDiff > viewContainerWidth / 2
                    ) {
                    activePage.removeClass('page-on-center').addClass('page-on-right');
                    previousPage.removeClass('page-on-left').addClass('page-on-center');
                    if (dynamicNavbar) {
                        activeNavbar.removeClass('navbar-on-center').addClass('navbar-on-right');
                        previousNavbar.removeClass('navbar-on-left').addClass('navbar-on-center');
                    }
                    pageChanged = true;
                }
                // Reset custom styles
                // Add transitioning class for transition-duration
                $([activePage[0], previousPage[0]]).transform('').css({opacity: '', boxShadow: ''}).addClass('page-transitioning');
                if (dynamicNavbar) {
                    activeNavElements.css({opacity: ''})
                    .each(function () {
                        var translate = pageChanged ? $(this).attr('data-right') : 0;
                        $(this).transform('translate3d(' + translate + 'px,0,0)');
                    }).addClass('page-transitioning');
                    previousNavElements.transform('').css({opacity: ''}).each(function () {
                        var translate = pageChanged ? 0 : $(this).attr('data-left');
                        $(this).transform('translate3d(' + translate + 'px,0,0)');
                    }).addClass('page-transitioning');
                }
                allowViewTouchMove = false;
                app.allowPageChange = false;
        
                if (pageChanged) {
                    // Update View's URL
                    var url = view.history[view.history.length - 2];
                    view.url = url;
                    
                    // Page before animation callback
                    app.pageAnimCallbacks('before', view, {pageContainer: previousPage[0], url: url, position: 'left', newPage: previousPage, oldPage: activePage});
                }
        
                activePage.transitionEnd(function () {
                    $([activePage[0], previousPage[0]]).removeClass('page-transitioning');
                    if (dynamicNavbar) {
                        activeNavElements.removeClass('page-transitioning');
                        previousNavElements.removeClass('page-transitioning');
                    }
                    allowViewTouchMove = true;
                    app.allowPageChange = true;
                    if (pageChanged) app.afterGoBack(view, activePage, previousPage);
                });
            });
        };
        /*======================================================
        ************   Navbars && Toolbars   ************
        ======================================================*/
        app.sizeNavbars = function (viewContainer) {
            var navbarInner = viewContainer ? $(viewContainer).find('.navbar .navbar-inner') : $('.navbar .navbar-inner');
            navbarInner.each(function () {
                var tt = $(this),
                    left = tt.find('.left'),
                    right = tt.find('.right'),
                    center = tt.find('.center'),
                    noLeft = left.length === 0,
                    noRight = right.length === 0,
                    leftWidth = noLeft ? 0 : left.outerWidth(true),
                    rightWidth = noRight ? 0 : right.outerWidth(true),
                    centerWidth = center.outerWidth(true),
                    navbarWidth = tt.width(),
                    currLeft, diff;
        
                if (noRight) {
                    currLeft = navbarWidth - centerWidth;
                }
                if (noLeft) {
                    currLeft = 0;
                }
                if (!noLeft && !noRight) {
                    currLeft = (navbarWidth - rightWidth - centerWidth + leftWidth) / 2;
                }
                var requiredLeft = (navbarWidth - centerWidth) / 2;
                if (navbarWidth - leftWidth - rightWidth > centerWidth) {
                    if (requiredLeft < leftWidth) {
                        requiredLeft = leftWidth;
                    }
                    if (requiredLeft + centerWidth > navbarWidth - rightWidth) {
                        requiredLeft = navbarWidth - rightWidth - centerWidth;
                    }
                    diff = requiredLeft - currLeft;
                }
                else {
                    diff = 0;
                }
                center.css({left: diff + 'px'});
                if (center.hasClass('sliding')) {
                    center[0].f7NavbarLeftOffset = -(currLeft + diff);
                    center[0].f7NavbarRightOffset = navbarWidth - currLeft - diff - centerWidth;
                }
                if (!noLeft && left.hasClass('sliding')) {
                    left[0].f7NavbarLeftOffset = -leftWidth;
                    left[0].f7NavbarRightOffset = (navbarWidth - left.outerWidth()) / 2;
                }
                if (!noRight && right.hasClass('sliding')) {
                    right[0].f7NavbarLeftOffset = -(navbarWidth - right.outerWidth()) / 2;
                    right[0].f7NavbarRightOffset = rightWidth;
                }
                
            });
        };
        app.hideNavbar = function (viewContainer) {
            $(viewContainer).addClass('hidden-navbar');
            return true;
        };
        app.showNavbar = function (viewContainer) {
            var vc = $(viewContainer);
            vc.addClass('hiding-navbar').removeClass('hidden-navbar').find('.navbar').transitionEnd(function () {
                vc.removeClass('hiding-navbar');
            });
            return true;
        };
        app.hideToolbar = function (viewContainer) {
            $(viewContainer).addClass('hidden-toolbar');
            return true;
        };
        app.showToolbar = function (viewContainer) {
            var vc = $(viewContainer);
            vc.addClass('hiding-toolbar').removeClass('hidden-toolbar').find('.toolbar').transitionEnd(function () {
                vc.removeClass('hiding-toolbar');
            });
        };
        /*======================================================
        ************   XHR   ************
        ======================================================*/
        // XHR Caching
        app.cache = [];
        app.removeFromCache = function (url) {
            var index = false;
            for (var i = 0; i < app.cache.length; i++) {
                if (app.cache[i].url === url) index = i;
            }
            if (index !== false) app.cache.splice(index, 1);
        };
        
        // XHR
        app.xhr = false;
        app.get = function (url, callback) {
            if (app.params.cache) {
                // Check is the url cached
                for (var i = 0; i < app.cache.length; i++) {
                    if (app.cache[i].url === url) {
                        // Check expiration
                        if ((new Date()).getTime() - app.cache[i].time < app.params.cacheDuration) {
                            // Load from cache
                            callback(app.cache[i].data);
                            return false;
                        }
                    }
                }
            }
            var xhr = new XMLHttpRequest();
            xhr.open('GET', url, true);
            xhr.onload = function (e) {
                if (callback) {
                    if (this.status === 200) {
                        callback(this.responseText, false);
                        if (app.params.cache) {
                            app.removeFromCache(url);
                            app.cache.push({
                                url: url,
                                time: (new Date()).getTime(),
                                data: this.responseText
                            });
                        }
                    }
                    else {
                        callback(this.responseText, true);
                    }
                }
            };
            xhr.send();
            app.xhr = xhr;
            return xhr;
        };
        /*======================================================
        ************   Pages   ************
        ======================================================*/
        // On Page Init Callback
        app.pageInitCallback = function (view, pageContainer, url, position) {
            if (pageContainer.f7PageInitialized) return;
            pageContainer.f7PageInitialized = true;
            // Page Data
            var pageData = {
                container: pageContainer,
                url: url,
                query: $.parseUrlQuery(url || ''),
                name: $(pageContainer).attr('data-page'),
                view: view,
                from: position
            };
            // Before Init Callback
            if (app.params.onBeforePageInit) {
                app.params.onBeforePageInit(pageData);
            }
            if (view.params.onBeforePageInit) {
                view.params.onBeforePageInit(pageData);
            }
            app.initPage(pageContainer);
            // Init Callback
            if (app.params.onPageInit) {
                app.params.onPageInit(pageData);
            }
            if (view.params.onPageInit) {
                view.params.onPageInit(pageData);
            }
        };
        app.pageAnimCallbacks = function (callback, view, params) {
            // Page Data
            var pageData = {
                container: params.pageContainer,
                url: params.url,
                query: $.parseUrlQuery(params.url || ''),
                name: $(params.pageContainer).attr('data-page'),
                view: view,
                from: params.position
            };
            var oldPage = params.oldPage,
                newPage = params.newPage;
        
            if (callback === 'after') {
        
                if (app.params.onPageAfterAnimation) {
                    app.params.onPageAfterAnimation(pageData);
                }
                if (view.params.onPageAfterAnimation) {
                    view.params.onPageAfterAnimation(pageData);
                }
            }
            if (callback === 'before') {
                // Hide/show navbar dynamically
                if (newPage.hasClass('no-navbar') && !oldPage.hasClass('no-navbar')) {
                    view.hideNavbar();
                }
                if (!newPage.hasClass('no-navbar') && oldPage.hasClass('no-navbar')) {
                    view.showNavbar();
                }
                // Hide/show navbar toolbar
                if (newPage.hasClass('no-toolbar') && !oldPage.hasClass('no-toolbar')) {
                    view.hideToolbar();
                }
                if (!newPage.hasClass('no-toolbar') && oldPage.hasClass('no-toolbar')) {
                    view.showToolbar();
                }
                if (app.params.onPageBeforeAnimation) {
                    app.params.onPageBeforeAnimation(pageData);
                }
                if (view.params.onPageBeforeAnimation) {
                    view.params.onPageBeforeAnimation(pageData);
                }
            }
        };
        // Init Page Events and Manipulations
        app.initPage = function (pageContainer) {
            // Prevent Togglers from bubbling AnimationEnd events
            $(pageContainer).find('.switch').on('webkitAnimationEnd OAnimationEnd MSAnimationEnd animationend', function (e) {
                e.stopPropagation();
            });
            // Size navbars on page load
            app.sizeNavbars($(pageContainer).parents('.view')[0]);
            app.initSliders(pageContainer);
        };
        // Load Page
        app.allowPageChange = true;
        app._tempDomElement = document.createElement('div');
        app.loadPage = function (view, url) {
            if (!app.allowPageChange) return false;
            if (view.url === url) return false;
            app.allowPageChange = false;
            if (app.xhr) {
                app.xhr.abort();
                app.xhr = false;
            }
            app.get(url, function (data, error) {
                if (error) {
                    app.allowPageChange = true;
                    return;
                }
                var viewContainer = $(view.container),
                    newPage, oldPage, pagesInView, i, oldNavbarInner, newNavbarInner, navbar, dynamicNavbar;
        
                // Parse DOM to find new page
                app._tempDomElement.innerHTML = data;
                newPage = $('.page', app._tempDomElement);
                if (newPage.length > 1) {
                    newPage = $(app._tempDomElement).find('.view-main .page');
                }
        
                // If pages not found or there are still more than one, exit
                if (newPage.length === 0 || newPage.length > 1) {
                    app.allowPageChange = true;
                    return;
                }
                newPage.addClass('page-on-right');
        
                // Update View history
                view.url = url;
                view.history.push(url);
        
                // Find old page (should be the last one) and remove older pages
                pagesInView = viewContainer.find('.page');
                if (pagesInView.length > 1) {
                    for (i = 0; i < pagesInView.length - 2; i++) {
                        $(pagesInView[i]).remove();
                    }
                    $(pagesInView[i]).remove();
                }
                oldPage = viewContainer.find('.page');
        
                // Dynamic navbar
                if (view.params.dynamicNavbar) {
                    dynamicNavbar = true;
                    // Find navbar
                    newNavbarInner = $('.navbar-inner', app._tempDomElement);
                    if (newNavbarInner.length > 1) {
                        newNavbarInner = $('.view-main .navbar-inner', app._tempDomElement);
                    }
                    if (newNavbarInner.length === 0 || newNavbarInner > 1) {
                        dynamicNavbar = false;
                    }
                    navbar = viewContainer.find('.navbar');
                    oldNavbarInner = navbar.find('.navbar-inner');
                    if (oldNavbarInner.length > 0) {
                        for (i = 0; i < oldNavbarInner.length - 1; i++) {
                            $(oldNavbarInner[i]).remove();
                        }
                        if (newNavbarInner.length === 0 && oldNavbarInner.length === 1) {
                            $(oldNavbarInner[0]).remove();
                        }
                        oldNavbarInner = navbar.find('.navbar-inner');
                    }
                }
                if (dynamicNavbar) {
                    newNavbarInner.addClass('navbar-on-right');
                    navbar.append(newNavbarInner[0]);
                }
        
                // Append Old Page and add classes for animation
                $(view.pagesContainer).append(newPage[0]);
        
                // Page Init Events
                app.pageInitCallback(view, newPage[0], url, 'right');
                
                if (dynamicNavbar) {
                    newNavbarInner.find('.sliding').each(function () {
                        $(this).transform('translate3d(' + (this.f7NavbarRightOffset) + 'px,0,0)');
                    });
                }
                // Force reLayout
                var clientLeft = newPage[0].clientLeft;
        
                // Before Anim Callback
                app.pageAnimCallbacks('before', view, {pageContainer: newPage[0], url: url, position: 'left', oldPage: oldPage, newPage: newPage});
                
                newPage.addClass('page-from-right-to-center');
                oldPage.addClass('page-from-center-to-left').removeClass('page-on-center');
        
                // Dynamic navbar animation
                if (dynamicNavbar) {
                    newNavbarInner.removeClass('navbar-on-right').addClass('navbar-from-right-to-center');
                    newNavbarInner.find('.sliding').each(function () {
                        $(this).transform('translate3d(0px,0,0)');
                    });
                    oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-left');
                    oldNavbarInner.find('.sliding').each(function () {
                        $(this).transform('translate3d(' + (this.f7NavbarLeftOffset) + 'px,0,0)');
                    });
                }
        
                newPage.animationEnd(function (e) {
                    app.allowPageChange = true;
                    newPage.toggleClass('page-from-right-to-center page-on-center page-on-right');
                    oldPage.toggleClass('page-from-center-to-left page-on-left');
                    if (dynamicNavbar) {
                        newNavbarInner.toggleClass('navbar-from-right-to-center navbar-on-center');
                        oldNavbarInner.toggleClass('navbar-from-center-to-left navbar-on-left');
                    }
                    app.pageAnimCallbacks('after', view, {pageContainer: newPage[0], url: url, position: 'right', oldPage: oldPage, newPage: newPage});
                });
        
            });
        };
        app.goBack = function (view, url, preloadOnly) {
            if (!app.allowPageChange) return false;
            app.allowPageChange = false;
            if (app.xhr) {
                app.xhr.abort();
                app.xhr = false;
            }
        
            var viewContainer = $(view.container),
                pagesInView = viewContainer.find('.page'),
                oldPage, newPage, oldNavbarInner, newNavbarInner, navbar, dynamicNavbar;
            if (pagesInView.length > 1) {
                // Exit if only preloadOnly
                if (preloadOnly) {
                    app.allowPageChange = true;
                    return;
                }
                // Update View's URL
                view.url = view.history[view.history.length - 2];
        
                // Define old and new pages
                newPage = $(pagesInView[pagesInView.length - 2]);
                oldPage = $(pagesInView[pagesInView.length - 1]);
        
                // Dynamic navbar
                if (view.params.dynamicNavbar) {
                    dynamicNavbar = true;
                    // Find navbar
                    var inners = viewContainer.find('.navbar-inner');
                    newNavbarInner = $(inners[0]);
                    oldNavbarInner = $(inners[1]);
                }
        
                // Page before animation callback
                app.pageAnimCallbacks('before', view, {pageContainer: newPage[0], url: url, position: 'left', oldPage: oldPage, newPage: newPage});
        
                // Add classes for animation
                newPage.removeClass('page-on-left').addClass('page-from-left-to-center');
                oldPage.removeClass('page-on-center').addClass('page-from-center-to-right');
        
                // Dynamic navbar animation
                if (dynamicNavbar) {
                    newNavbarInner.removeClass('navbar-on-left').addClass('navbar-from-left-to-center');
                    newNavbarInner.find('.sliding').each(function () {
                        $(this).transform('translate3d(0px,0,0)');
                    });
        
                    oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-right');
                    oldNavbarInner.find('.sliding').each(function () {
                        $(this).transform('translate3d(' + (this.f7NavbarRightOffset) + 'px,0,0)');
                    });
                }
                
                newPage.animationEnd(function () {
                    app.afterGoBack(view, oldPage[0], newPage[0]);
                    app.pageAnimCallbacks('after', view, {pageContainer: newPage[0], url: url, position: 'left', oldPage: oldPage, newPage: newPage});
                });
            }
            else {
                if (url && url.indexOf('#') === 0) url = undefined;
                if (view.history.length > 1) {
                    url = view.history[view.history.length - 2];
                }
                if (!url) {
                    app.allowPageChange = true;
                    return;
                }
                app.get(url, function (data, error) {
                    if (error) {
                        app.allowPageChange = true;
                        return;
                    }
                    // Parse DOM to find new page
                    app._tempDomElement.innerHTML = data;
                    newPage = $('.page', app._tempDomElement);
                    if (newPage.length > 1) {
                        newPage = $(app._tempDomElement).find('.view-main .page');
                    }
        
                    // If pages not found or there are still more than one, exit
                    if (newPage.length === 0 || newPage.length > 1) {
                        app.allowPageChange = true;
                        return;
                    }
                    newPage.addClass('page-on-left');
        
                    // Find old page (should be the only one)
                    oldPage = $(viewContainer.find('.page')[0]);
        
                    // Dynamic navbar
                    if (view.params.dynamicNavbar) {
                        dynamicNavbar = true;
                        // Find navbar
                        newNavbarInner = $('.navbar-inner', app._tempDomElement);
                        if (newNavbarInner.length > 1) {
                            newNavbarInner = $('.view-main .navbar-inner', app._tempDomElement);
                        }
                        if (newNavbarInner.length === 0 || newNavbarInner > 1) {
                            dynamicNavbar = false;
                        }
                        
                    }
        
                    if (dynamicNavbar) {
                        navbar = viewContainer.find('.navbar');
                        oldNavbarInner = navbar.find('.navbar-inner');
                        newNavbarInner.addClass(oldNavbarInner.length > 0 ? 'navbar-on-left' : 'navbar-on-center');
                        if (oldNavbarInner.length > 1) {
                            $(oldNavbarInner[0]).remove();
                            oldNavbarInner = navbar.find('.navbar-inner');
                        }
                        navbar.prepend(newNavbarInner[0]);
                    }
                    // Prepend new Page and add classes for animation
                    $(view.pagesContainer).prepend(newPage[0]);
        
                    // Page Init Events
                    app.pageInitCallback(view, newPage[0], url, 'left');
        
                    if (dynamicNavbar && newNavbarInner.hasClass('navbar-on-left')) {
                        newNavbarInner.find('.sliding').each(function () {
                            $(this).transform('translate3d(' + (this.f7NavbarLeftOffset) + 'px,0,0)');
                        });
                    }
                    
                    // Exit if we need only to preload page
                    if (preloadOnly) {
                        newPage.addClass('page-on-left');
                        app.allowPageChange = true;
                        return;
                    }
        
                    // Update View's URL
                    view.url = url;
        
                    // Force reLayout
                    var clientLeft = newPage[0].clientLeft;
        
                    // Before Anim Callback
                    app.pageAnimCallbacks('before', view, {pageContainer: newPage[0], url: url, position: 'left', oldPage: oldPage, newPage: newPage});
        
                    newPage.addClass('page-from-left-to-center');
                    oldPage.removeClass('page-on-center').addClass('page-from-center-to-right');
        
                    // Dynamic navbar animation
                    if (dynamicNavbar) {
                        newNavbarInner.removeClass('navbar-on-left').addClass('navbar-from-left-to-center');
                        newNavbarInner.find('.sliding').each(function () {
                            $(this).transform('translate3d(0px,0,0)');
                        });
                        oldNavbarInner.removeClass('navbar-on-center').addClass('navbar-from-center-to-right');
                        oldNavbarInner.find('.sliding').each(function () {
                            $(this).transform('translate3d(' + (this.f7NavbarRightOffset) + 'px,0,0)');
                        });
                    }
        
                    newPage.animationEnd(function () {
                        app.afterGoBack(view, oldPage[0], newPage[0]);
                        app.pageAnimCallbacks('after', view, {pageContainer: newPage[0], url: url, position: 'left', oldPage: oldPage, newPage: newPage});
                    });
        
                });
            }
        };
        app.afterGoBack = function (view, oldPage, newPage) {
            // Remove old page and set classes on new one
            oldPage = $(oldPage);
            newPage = $(newPage);
            oldPage.remove();
            newPage.removeClass('page-from-left-to-center page-on-left').addClass('page-on-center');
            app.allowPageChange = true;
            // Updated dynamic navbar
            if (view.params.dynamicNavbar) {
                var inners = $(view.container).find('.navbar-inner');
                var oldNavbar = $(inners[1]).remove();
                var newNavbar = $(inners[0]).removeClass('navbar-on-left navbar-from-left-to-center').addClass('navbar-on-center');
            }
            // Update View's Hitory
            view.history.pop();
            // Preload previous page
            if (app.params.preloadPreviousPage) {
                app.goBack(view, false, true);
            }
        };
        /*======================================================
        ************   Modals   ************
        ======================================================*/
        app._modalTemlateTempDiv = document.createElement('div');
        app.modal = function (params) {
            params = params || {};
            /* @params example
            {
                title: 'Modal title',
                text: 'Modal text',
                afterText: 'Custom content after text',
                buttons: [{
                    text:'Cancel',
                    bold: true,
                    onClick: function (){},
                    close:false
                }]
            }
            */
            var buttonsHTML = '';
            if (params.buttons && params.buttons.length > 0) {
                for (var i = 0; i < params.buttons.length; i++) {
                    buttonsHTML += '<span class="modal-button' + (params.buttons[i].bold ? ' modal-button-bold' : '') + '">' + params.buttons[i].text + '</span>';
                }
            }
            var modalTemplate = app.params.modalTemplate;
            if (!params.title) {
                modalTemplate = modalTemplate.split('{{if title}}')[0] + modalTemplate.split('{{/if title}}')[1];
            }
            else {
                modalTemplate = modalTemplate.replace(/{{if\ title}}/g, '').replace(/{{\/if\ title}}/g, '');
            }
            var modalHTML = modalTemplate
                            .replace(/{{title}}/g, params.title || '')
                            .replace(/{{text}}/g, params.text || '')
                            .replace(/{{afterText}}/g, params.afterText || '')
                            .replace(/{{buttons}}/g, buttonsHTML)
                            .replace(/{{noButtons}}/g, !params.buttons || params.buttons.length === 0 ? 'modal-no-buttons' : '');
            app._modalTemlateTempDiv.innerHTML = modalHTML;
        
            var modal = $(app._modalTemlateTempDiv).children();
        
            $('body').append(modal[0]);
            
            // Add events on buttons
            modal.find('.modal-button').each(function (index, el) {
                $(el).tap(function (e) {
                    if (params.buttons[index].close !== false) app.closeModal(modal);
                    if (params.buttons[index].onClick) params.buttons[index].onClick(modal, e);
                });
            });
            app.openModal(modal);
            return modal[0];
        };
        app.alert = function (text, title) {
            return app.modal({
                text: text || '',
                title: title || app.params.modalTitle,
                buttons: [ {text: app.params.modalButtonOk, bold: true} ]
            });
        };
        app.confirm = function (text, callbackOk, callbackCancel) {
            return app.modal({
                text: text || '',
                title: app.params.modalTitle || '',
                buttons: [
                    {text: app.params.modalButtonCancel, onClick: callbackCancel},
                    {text: app.params.modalButtonOk, bold: true, onClick: callbackOk}
                ]
            });
        };
        app.prompt = function (text, callbackOk, callbackCancel) {
            return app.modal({
                text: text || '',
                title: app.params.modalTitle || '',
                afterText: '<input type="text" class="modal-prompt-input">',
                buttons: [
                    {text: app.params.modalButtonCancel, onClick: function (modal) {
                        if (callbackCancel) callbackCancel($(modal).find('.modal-prompt-input').val());
                    }},
                    {text: app.params.modalButtonOk, bold: true, onClick: function (modal) {
                        if (callbackOk) callbackOk($(modal).find('.modal-prompt-input').val());
                    }}
                ]
            });
        };
        app.showPreloader = function (text) {
            return app.modal({
                title: text || app.params.modalPreloaderText,
                text: ' ',
                afterText: '<div class="preloader"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>'
            });
        };
        app.hidePreloader = function () {
            app.closeModal();
        };
        // Action Sheet
        app.actions = function (params) {
            params = params || [];
            /*Example of @params
            [
                [
                    {
                        text: 'Button 1',
                        red: false,
                        bold: false,
                        onClick: function () { ... }
                    },
                    {
                        text: '<a href="#" class="open-panel">Open panel</a>',
                        red: false,
                        bold: false,
                        onClick: function () { ... }  
                    }
                    ... more buttons in this group
                ],
                ... more groups
            ]
            */
            if (params.length > 0 && !$.isArray(params[0])) {
                params = [params];
            }
        
            var actionsTemplate = app.params.modalActionsTemplate;
            var buttonsHTML = '';
            for (var i = 0; i < params.length; i++) {
                for (var j = 0; j < params[i].length; j++) {
                    if (j === 0) buttonsHTML += '<div class="actions-modal-group">';
                    var button = params[i][j];
                    var buttonClass = 'actions-modal-button';
                    if (button.bold) buttonClass += ' actions-modal-button-bold';
                    if (button.red) buttonClass += ' actions-modal-button-red';
                    buttonsHTML += '<span class="' + buttonClass + '">' + button.text + '</span>';
                    if (j === params[i].length - 1) buttonsHTML += '</div>';
                }
            }
            var modalHTML = actionsTemplate.replace(/{{buttons}}/g, buttonsHTML);
        
            app._modalTemlateTempDiv.innerHTML = modalHTML;
            var modal = $(app._modalTemlateTempDiv).children();
            $('body').append(modal[0]);
        
            var groups = modal.find('.actions-modal-group');
            groups.each(function (index, el) {
                var groupIndex = index;
                $(el).find('.actions-modal-button').each(function (index, el) {
                    var buttonIndex = index;
                    var buttonParams = params[groupIndex][buttonIndex];
                    $(el).tap(function (e) {
                        if (buttonParams.close !== false) app.closeModal(modal);
                        if (buttonParams.onClick) buttonParams.onClick(modal, e);
                    });
                });
            });
            app.openModal(modal);
            return modal[0];
        };
        app.openModal = function (modal) {
            modal = $(modal);
            if ($('.modal-overlay').length === 0) {
                var overlay = document.createElement('div');
                overlay.className = 'modal-overlay';
                $('body').append(overlay);
            }
            if (!modal.hasClass('actions-modal')) modal.css({marginTop: -modal.outerHeight() / 2 + 'px'});
            //Make sure that styles are applied, trigger relayout;
            var clientLeft = modal[0].clientLeft;
        
            // Classes for transition in
            $('.modal-overlay').addClass('modal-overlay-visible');
            $(modal).addClass('modal-in');
            return true;
        };
        app.closeModal = function (modal) {
            modal = $(modal || '.modal-in');
            $('.modal-overlay').removeClass('modal-overlay-visible');
            modal.trigger('close');
            modal.toggleClass('modal-in modal-out').transitionEnd(function (e) {
                modal.trigger('closed');
                modal.remove();
            });
            return true;
        };
        /*======================================================
        ************   Panels   ************
        ======================================================*/
        app.allowPanelOpen = true;
        app.openPanel = function (panelPosition) {
            // @panelPosition - string with panel position "left", "right", "top"
            if (!app.allowPanelOpen) return false;
            var panel = $('.panel-' + panelPosition);
            if (panel.length === 0 || panel.hasClass('active')) return false;
            app.closePanel(); // Close if some panel is opened
            app.allowPanelOpen = false;
            var effect = panel.hasClass('panel-reveal') ? 'reveal' : 'cover';
            panel.css({display: 'block'}).addClass('active');
            panel.trigger('open');
        
            // Trigger reLayout
            var clientLeft = panel[0].clientLeft;
            
            // Transition End;
            var transitionEndTarget = effect === 'reveal' ? $('.views') : panel;
            var openedTriggered = false;
            transitionEndTarget.transitionEnd(function (e) {
                if ($(e.target).is(transitionEndTarget)) {
                    if (!openedTriggered) panel.trigger('opened');
                }
                app.allowPanelOpen = true;
            });
            setTimeout(function () {
                if (!openedTriggered) panel.trigger('opened');
            }, app.params.panelsAnimationDuration);
        
            $('body').addClass('with-panel-' + panelPosition + '-' + effect);
            return true;
        };
        app.closePanel = function () {
            var activePanel = $('.panel.active');
            if (activePanel.length === 0) return false;
            var effect = activePanel.hasClass('panel-reveal') ? 'reveal' : 'cover';
            var panelPosition = activePanel.hasClass('panel-left') ? 'left' : 'right';
            activePanel.removeClass('active');
            var transitionEndTarget = effect === 'reveal' ? $('.views') : activePanel;
            activePanel.trigger('close');
            transitionEndTarget.transitionEnd(function () {
                activePanel.css({display: ''});
                activePanel.trigger('closed');
                $('body').removeClass('panel-closing');
            });
            $('body').addClass('panel-closing').removeClass('with-panel-' + panelPosition + '-' + effect);
        };
        /*======================================================
        ************   Slider   ************
        ======================================================*/
        app.initSliders = function (pageContainer) {
            $(pageContainer).find('.slider').each(function () {
                var slider = $(this),
                    isTouched = false,
                    isMoved = false,
                    isScrolling,
                    minValue = slider.attr('data-min') * 1 || 0,
                    maxValue = slider.attr('data-max') * 1 || 0,
                    value = slider.attr('data-value') * 1 || 0,
                    startValue = value,
                    sliderWidth,
                    handle = slider.find('.slider-handle'),
                    range = slider.find('.slider-range'),
                    touches = {};
                // Set Handle/Range Position/Width
                var perc = (startValue - minValue) / (maxValue - minValue);
                if (perc < 0) perc = 0;
                if (perc > 1) perc = 1;
                handle.css({left: perc * 100 + '%'}).transform('translate3d(-' + perc * 100 + '%,0,0)');
                range.css({width: perc * 100 + '%'});
                // Handle Events
                handle.on(app.touchEvents.start, function (e) {
                    if (isTouched) return;
                    e.stopPropagation();
                    isTouched = true;
                    touches.startX = touches.currentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
                    touches.startY = touches.currentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                    sliderWidth = slider.width();
                    startValue = value = slider.attr('data-value') * 1 || 0;
                    isScrolling = undefined;
                });
                handle.on(app.touchEvents.move, function (e) {
                    if (!isTouched) return;
                    touches.currentX = e.type === 'touchmove' ? e.targetTouches[0].pageX : e.pageX;
                    touches.currentY = e.type === 'touchmove' ? e.targetTouches[0].pageY : e.pageY;
                    if (typeof isScrolling === 'undefined') {
                        isScrolling = !!(isScrolling || Math.abs(touches.currentY - touches.startY) > Math.abs(touches.currentX - touches.startX));
                    }
                    if (isScrolling) {
                        isTouched = false;
                        return;
                    }
                    e.stopPropagation();
                    e.preventDefault();
                    isMoved = true;
                    var diff = touches.currentX - touches.startX;
        
                    var perc = diff / sliderWidth + (startValue - minValue) / (maxValue - minValue);
                    if (perc < 0) perc = 0;
                    if (perc > 1) perc = 1;
                    value = (maxValue - minValue) * perc + minValue;
                    slider.attr('data-value', value);
                    
                    handle.css({left: perc * 100 + '%'}).transform('translate3d(-' + perc * 100 + '%,0,0)');
                    range.css({width: perc * 100 + '%'});
                    slider.trigger('change', {values: [value]});
                });
                handle.on(app.touchEvents.end, function (e) {
                    if (!isTouched || !isMoved) {
                        isTouched = isMoved = false;
                        return;
                    }
        
                    isTouched = isMoved = false;
                });
            });
        };
        app.setSliderValue = function (sliderContainer, value) {
            var slider = $(sliderContainer),
                minValue = slider.attr('data-min') * 1 || 0,
                maxValue = slider.attr('data-max') * 1 || 0,
                handle = slider.find('.slider-handle'),
                range = slider.find('.slider-range');
            if (value > maxValue) value = maxValue;
            if (value < minValue) value = minValue;
            slider.attr('data-value', value);
            // Set Handle/Range Position/Width
            var perc = (value - minValue) / (maxValue - minValue);
            if (perc < 0) perc = 0;
            if (perc > 1) perc = 1;
            handle.css({left: perc * 100 + '%'}).transform('translate3d(-' + perc * 100 + '%,0,0)');
            range.css({width: perc * 100 + '%'});
        };
        /*===============================================================================
        ************   Handle clicks and make them fast (on tap);   ************
        ===============================================================================*/
        app.initClickEvents = function () {
            $(document).tap('a, .open-panel, .close-panel, .panel-overlay, .modal-overlay', function (e) {
                var clicked = $(this);
                // External
                if (clicked.hasClass('external')) {
                    return;
                }
                // Open Panel
                if (clicked.hasClass('open-panel')) {
                    // e.preventDefault();
                    if ($('.panel').length === 1) {
                        if ($('.panel').hasClass('panel-left')) app.openPanel('left');
                        else app.openPanel('right');
                    }
                    else {
                        if (clicked.attr('data-panel') === 'right') app.openPanel('right');
                        else app.openPanel('left');
                    }
                }
                // Close Panel
                if (clicked.hasClass('close-panel')) {
                    app.closePanel();
                }
        
                if (clicked.hasClass('panel-overlay') && app.params.panelsCloseByOutside) {
                    app.closePanel();
                }
                // Close Modal
                if (clicked.hasClass('modal-overlay')) {
                    if ($('.modal.modal-in').length > 0 && app.params.modalCloseByOutside)
                        app.closeModal();
                    if ($('.actions-modal.modal-in').length > 0 && app.params.modalActionsCloseByOutside)
                        app.closeModal();
                }
                // Tabs
                if (clicked.hasClass('tab-link')) {
                    var newTab = $(clicked.attr('href'));
                    var oldTab = newTab.parent().find('.tab.active').removeClass('active');
                    newTab.addClass('active');
                    if (clicked.parent().hasClass('buttons-row')) {
                        clicked.parent().find('.active').removeClass('active');
                        clicked.addClass('active');
                    }
                }
                // Load Page
                var url = $(this).attr('href');
                var validUrl = url && url.length > 0 && url.indexOf('#') !== 0;
                if (validUrl || clicked.hasClass('back')) {
                    var view;
                    if (clicked.attr('data-view')) {
                        view = $(clicked.attr('data-view'))[0].f7View;
                    }
                    else {
                        view = clicked.parents('.view')[0] && clicked.parents('.view')[0].f7View;
                    }
                    if (!view) {
                        for (var i = 0; i < app.views.length; i++) {
                            if (app.views[i].main) view = app.views[i];
                        }
                    }
                    if (!view) return;
                    if (clicked.hasClass('back')) view.goBack(clicked.attr('href'));
                    else view.loadPage(clicked.attr('href'));
                }
            });
            //Disable clicks
            $(document).on('click', 'a', function (e) {
                if (!$(this).hasClass('external')) e.preventDefault();
            });
        };
        /*======================================================
        ************   App Resize Actions   ************
        ======================================================*/
        app.onResize = function () {
            app.sizeNavbars();
            // Something else could be here
        };
        /*======================================================
        ************   App Init   ************
        ======================================================*/
        app.init = function () {
            // Init Click events
            app.initClickEvents();
            // Init each page callbacks
            $('.page').each(function () {
                app.initPage(this);
            });
            // App resize events
            $(window).on('resize', app.onResize);
            // App Init callback
            if (app.params.onAppInit) app.params.onAppInit();
        };
        app.init();
        //Return instance        
        return app;
    };
    
    /*===========================
    jQuery-like DOM library
    ===========================*/
    var Dom = function (arr) {
        var _this = this, i = 0;
        // Create array-like object
        for (i = 0; i < arr.length; i++) {
            _this[i] = arr[i];
        }
        _this.length = arr.length;
        // Return collection with methods
        return this;
    };
    Dom.prototype = {
        // Classes and attriutes
        addClass: function (className) {
            var classes = className.split(' ');
            for (var i = 0; i < classes.length; i++) {
                for (var j = 0; j < this.length; j++) {
                    this[j].classList.add(classes[i]);
                }
            }
            return this;
        },
        removeClass: function (className) {
            var classes = className.split(' ');
            for (var i = 0; i < classes.length; i++) {
                for (var j = 0; j < this.length; j++) {
                    this[j].classList.remove(classes[i]);
                }
            }
            return this;
        },
        hasClass: function (className) {
            if (!this[0]) return false;
            else return this[0].className.indexOf(className) >= 0;
        },
        toggleClass: function (className) {
            var classes = className.split(' ');
            for (var i = 0; i < classes.length; i++) {
                for (var j = 0; j < this.length; j++) {
                    this[j].classList.toggle(classes[i]);
                }
            }
            return this;
        },
        attr: function (attr, value) {
            if (typeof value === 'undefined') {
                return this[0].getAttribute(attr);
            }
            else {
                for (var i = 0; i < this.length; i++) {
                    this[i].setAttribute(attr, value);
                }
                return this;
            }
        },
        val: function (value) {
            if (typeof value === 'undefined') {
                if (this[0]) return this[0].value;
                else return null;
            }
            else {
                for (var i = 0; i < this.length; i++) {
                    this[i].value = value;
                }
                return this;
            }
        },
        // Transforms
        transform : function (transform) {
            for (var i = 0; i < this.length; i++) {
                var elStyle = this[i].style;
                elStyle.webkitTransform = elStyle.MsTransform = elStyle.msTransform = elStyle.MozTransform = elStyle.OTransform = elStyle.transform = transform;
            }
            return this;
        },
        transition: function (duration) {
            for (var i = 0; i < this.length; i++) {
                var elStyle = this[i].style;
                elStyle.webkitTransitionDuration = elStyle.MsTransitionDuration = elStyle.msTransitionDuration = elStyle.MozTransitionDuration = elStyle.OTransitionDuration = elStyle.transitionDuration = duration + 'ms';
            }
            return this;
        },
        //Events
        on: function (eventName, targetSelector, listener) {
            function handleLiveEvent(e) {
                var target = e.target;
                if ($(target).is(targetSelector)) listener.call(target, e);
                else {
                    var parents = $(target).parents();
                    for (var k = 0; k < parents.length; k++) {
                        if ($(parents[k]).is(targetSelector)) listener.call(parents[k], e);
                    }
                }
            }
            var events = eventName.split(' ');
            var i, j;
            for (i = 0; i < this.length; i++) {
                if (arguments.length === 2 || targetSelector === false) {
                    // Usual events
                    if (arguments.length === 2) listener = arguments[1];
                    for (j = 0; j < events.length; j++) {
                        this[i].addEventListener(events[j], listener, false);
                    }
                }
                else {
                    //Live events
                    for (j = 0; j < events.length; j++) {
                        this[i].addEventListener(events[j], handleLiveEvent, false);
                    }
                }
            }
    
            return this;
        },
        tap: function (targetSelector, listener) {
            var dom = this;
            var isTouched, isMoved, touchesStart = {}, touchStartTime, deltaX, deltaY;
            if (arguments.length === 1) {
                listener = arguments[0];
                targetSelector = false;
            }
            if ($.supportTouch) {
                dom.on('touchstart', targetSelector, function (e) {
                    isTouched = true;
                    isMoved = false;
                    // touchesStart.x = e.targetTouches[0].pageX;
                    // touchesStart.y = e.targetTouches[0].pageY;
                    // deltaX = deltaY = 0;
                    // touchStartTime = (new Date()).getTime();
                });
                dom.on('touchmove', targetSelector, function (e) {
                    if (!isTouched) return;
                    isMoved = true;
                    // deltaX = e.targetTouches[0].pageX - touchesStart.x;
                    // deltaY = e.targetTouches[0].pageY - touchesStart.y;
                });
                dom.on('touchend', targetSelector, function (e) {
                    // var timeDiff = (new Date()).getTime() - touchStartTime;
                    e.preventDefault(); // - to prevent Safari's Ghost click
                    if (isTouched && !isMoved) {
                        listener.call(this, e);
                    }
                    isTouched = isMoved = false;
                });
            }
            else {
                dom.on('click', targetSelector, listener);
            }
        },
        off: function (event, listener) {
            for (var i = 0; i < this.length; i++) {
                this[i].removeEventListener(event, listener, false);
            }
            return this;
        },
        trigger: function (eventName, eventData) {
            for (var i = 0; i < this.length; i++) {
                var e = new Event(eventName);
                e.detail = eventData;
                this[i].dispatchEvent(e);
            }
        },
        transitionEnd: function (callback) {
            var events = ['webkitTransitionEnd', 'transitionend', 'oTransitionEnd', 'MSTransitionEnd', 'msTransitionEnd'],
                i, j, dom = this;
            function fireCallBack(e) {
                /*jshint validthis:true */
                callback.call(this, e);
                for (i = 0; i < events.length; i++) {
                    dom.off(events[i], fireCallBack);
                }
            }
            if (callback) {
                for (i = 0; i < events.length; i++) {
                    dom.on(events[i], fireCallBack);
                }
            }
        },
        animationEnd: function (callback) {
            var events = ['webkitAnimationEnd', 'OAnimationEnd', 'MSAnimationEnd', 'animationend'],
                i, j, dom = this;
            function fireCallBack(e) {
                callback(e);
                for (i = 0; i < events.length; i++) {
                    dom.off(events[i], fireCallBack);
                }
            }
            if (callback) {
                for (i = 0; i < events.length; i++) {
                    dom.on(events[i], fireCallBack);
                }
            }
        },
        // Sizing/Styles
        width: function () {
            if (this.length > 0) {
                return parseFloat(this.css('width')) - parseFloat(this.css('padding-left')) - parseFloat(this.css('padding-right'));
            }
            else {
                return null;
            }
        },
        outerWidth: function (margins) {
            if (this.length > 0) {
                if (margins)
                    return this[0].offsetWidth + parseFloat(this.css('margin-right')) + parseFloat(this.css('margin-left'));
                else
                    return this[0].offsetWidth;
            }
            else return null;
        },
        height: function () {
            if (this.length > 0) {
                return this[0].offsetHeight - parseFloat(this.css('padding-top')) - parseFloat(this.css('padding-bottom'));
            }
            else {
                return null;
            }
        },
        outerHeight: function (margins) {
            if (this.length > 0) {
                if (margins)
                    return this[0].offsetHeight + parseFloat(this.css('margin-top')) + parseFloat(this.css('margin-bottom'));
                else
                    return this[0].offsetHeight;
            }
            else return null;
        },
        offset: function () {
            if (this.length > 0) {
                var el = this[0];
                var box = el.getBoundingClientRect();
                var body = document.body;
                var clientTop  = el.clientTop  || body.clientTop  || 0;
                var clientLeft = el.clientLeft || body.clientLeft || 0;
                var scrollTop  = window.pageYOffset || el.scrollTop;
                var scrollLeft = window.pageXOffset || el.scrollLeft;
                return {
                    top: box.top  + scrollTop  - clientTop,
                    left: box.left + scrollLeft - clientLeft
                };
            }
            else {
                return null;
            }
        },
        hide: function () {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'none';
            }
        },
        show: function () {
            for (var i = 0; i < this.length; i++) {
                this[i].style.display = 'block';
            }
        },
        css: function (props) {
            if (typeof props === 'string') {
                if (this[0]) return window.getComputedStyle(this[0], null).getPropertyValue(props);
            }
            else {
                for (var i = 0; i < this.length; i++) {
                    for (var prop in props) {
                        this[i].style[prop] = props[prop];
                    }
                }
                return this;
            }
            
        },
        
        //Dom manipulation
        each: function (callback) {
            for (var i = 0; i < this.length; i++) {
                callback.call(this[i], i, this[i]);
            }
            return this;
        },
        html: function (html) {
            if (typeof html === 'undefined') {
                return this[0].innerHTML;
            }
            else {
                for (var i = 0; i < this.length; i++) {
                    this[i].innerHTML = html;
                }
                return this;
            }
        },
        is: function (selector) {
            var compareWith;
            if (typeof selector === 'string') compareWith = document.querySelectorAll(selector);
            else if (selector.nodeType) compareWith = [selector];
            else compareWith = selector;
            var match = false;
            for (var i = 0; i < compareWith.length; i++) {
                if (compareWith[i] === this[0]) return true;
            }
            return false;
        },
        indexOf: function (el) {
            for (var i = 0; i < this.length; i++) {
                if (this[i] === el) return i;
            }
        },
        append: function (newChild) {
            for (var i = 0; i < this.length; i++) {
                if (typeof newChild === 'string') {
                    this[i].innerHTML += newChild;
                }
                else {
                    this[i].appendChild(newChild);
                }
            }
            return this;
        },
        prepend: function (newChild) {
            for (var i = 0; i < this.length; i++) {
                if (typeof newChild === 'string') {
                    this[i].innerHTML = newChild + this[i].innerHTML;
                }
                else {
                    this[i].insertBefore(newChild, this[i].childNodes[0]);
                }
            }
            return this;
        },
        insertBefore: function (selector) {
            var before = $(selector);
            for (var i = 0; i < this.length; i++) {
                if (before.length === 1) {
                    before[0].parentNode.insertBefore(this[i], before[0]);
                }
                else if (before.length > 1) {
                    for (var j = 0; j < before.length; j++) {
                        before[j].parentNode.insertBefore(this[i].cloneNode(true), before[j]);
                    }
                }
            }
        },
        parent: function () {
            var parents = [];
            for (var i = 0; i < this.length; i++) {
                parents.push(this[i].parentNode);
            }
            return $($.unique(parents));
        },
        parents: function (selector) {
            var parents = [];
            for (var i = 0; i < this.length; i++) {
                var parent = this[i].parentNode;
                while (parent) {
                    if (selector) {
                        if ($(parent).is(selector)) parents.push(parent);
                    }
                    else {
                        parents.push(parent);
                    }
                    parent = parent.parentNode;
                }
            }
            return $($.unique(parents));
        },
        find : function (selector) {
            var foundElements = [];
            for (var i = 0; i < this.length; i++) {
                var found = this[i].querySelectorAll(selector);
                for (var j = 0; j < found.length; j++) {
                    foundElements.push(found[j]);
                }
            }
            return new Dom(foundElements);
        },
        children: function (selector) {
            var children = [];
            for (var i = 0; i < this.length; i++) {
                var childNodes = this[i].childNodes;
    
                for (var j = 0; j < childNodes.length; j++) {
                    if (!selector) {
                        if (childNodes[j].nodeType === 1) children.push(childNodes[j]);
                    }
                    else {
                        if (childNodes[j].nodeType === 1 && $(childNodes[j]).is(selector)) children.push(childNodes[j]);
                    }
                }
            }
            return new Dom($.unique(children));
        },
        remove: function () {
            for (var i = 0; i < this.length; i++) {
                this[i].parentNode.removeChild(this[i]);
            }
            return this;
        },
        
    };
    var $ = function (selector, context) {
        var arr = [], i = 0;
        if (selector) {
            // String
            if (typeof selector === 'string') {
                var els = (context || document).querySelectorAll(selector);
                for (i = 0; i < els.length; i++) {
                    arr.push(els[i]);
                }
            }
            // Node/element
            else if (selector.nodeType || selector === window || selector === document) {
                arr.push(selector);
            }
            //Array of elements or instance of Dom
            else if (selector.length > 0 && selector[0].nodeType) {
                for (i = 0; i < selector.length; i++) {
                    arr.push(selector[i]);
                }
            }
        }
        return new Dom(arr);
    };
    $.parseUrlQuery = function (url) {
        var query = {}, i, params, param;
        if (url.indexOf('?') >= 0) url = url.split('?')[1];
        params = url.split('&');
        for (i = 0; i < params.length; i++) {
            param = params[i].split('=');
            query[param[0]] = param[1];
        }
        return query;
    };
    $.isArray = function (arr) {
        if (Object.prototype.toString.apply(arr) === '[object Array]') return true;
        else return false;
    };
    $.unique = function (arr) {
        var unique = [];
        for (var i = 0; i < arr.length; i++) {
            if (unique.indexOf(arr[i]) === -1) unique.push(arr[i]);
        }
        return unique;
    };
    $.supportTouch = (function () {
        return !!(('ontouchstart' in window) || window.DocumentTouch && document instanceof DocumentTouch);
    })();
})();