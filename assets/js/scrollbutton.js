/**
 * Jellybo ScrollButton004 , JavaScript scroll button animation
 *
 * @license Copyright (c) 2017, Jellybo. All rights reserved, http://tech.jellybo.com/doc/license.html
 * To use this plugin you must buy our product in http://jellybo.com.
 * @author  Marian Spisiak
 * @created 2017-07-27
 * @link    http://jellybo.com
 */

var Jellybo = Jellybo || {};

Jellybo._prefix = "jellybo";

Jellybo.BootLoader = function ($) {
    var defaultSettings = {
        pluginName: "",
        animationFactory: null,
        publicFunctions: null,
        selector: "",
        settingAttributes: null
    };
    var _prefix = Jellybo._prefix;
    return function (c_settings) {
        var settings = {};
        $.extend(settings, defaultSettings, c_settings);
        var dataName = _prefix + "animation_plugin_" + settings.pluginName;

        function proxyEachFunction(es, fn) {
            return function () {
                var retval = null;
                var args = arguments;
                es.each(function () {
                    var obj = $(this).data(dataName);
                    retval = obj[fn].apply(obj, args);
                });
                return retval;
            };
        }
        function proxyObject(es) {
            var obj = {};
            for (var i in settings.publicFunctions) {
                obj[settings.publicFunctions[i]] = proxyEachFunction(es, settings.publicFunctions[i]);
            }
            return obj;
        }
        function proxyFunction(obj, fn) {
            return function () {
                return obj[fn].apply(obj, arguments);
            };
        }
        function createPluginObject(e, init_args) {
            var args = {};
            for (var i in settings.settingAttributes) {
                var attr = settings.settingAttributes[i].toString().toLowerCase();
                if (e.data(attr)) {
                    args[attr] = e.data(attr);
                }
            }
            if (init_args.length === 1) {
                $.extend(args, init_args[0]);
            }
            var anim = settings.animationFactory(e, args);
            var obj = {};
            anim.init();
            obj.settings = proxyFunction(anim, "settings");
            for (var i in settings.publicFunctions) {
                obj[settings.publicFunctions[i]] = proxyFunction(anim, settings.publicFunctions[i]);
            }
            return obj;
        }
        function plugin() {
            return function () {
                var args = arguments;
                this.each(function () {
                    if (!$(this).data(dataName)) {
                        $(this).data(dataName, createPluginObject($(this), args));
                    } else {
                        if (args.length === 1 && $.isPlainObject(args[0])) {
                            $(this).data(dataName).settings(args[0]);
                        }
                    }
                });
                return proxyObject(this);
            };
        }
        function registerPlugin() {
            $.fn[settings.pluginName] = plugin();
        }
        return function () {
            registerPlugin();
            $(function () {
                $(settings.selector)[settings.pluginName]();
            });
            return null;
        }();
    };
}($);

Jellybo.ScrollButton4 = function ($, Snap, mina) {
    var defaultSettings = {
        time_offset: 0.83,
        width: 40,
        height: 70,
        color1: "#ccc",
        color2: "#fff",
        color3: "#999",
        loops: 1,
        shadow_color: "#fff",
        line_stroke: 2,
        duration: 1100,
        duration2: 700,
        duration3: 1200,
        text: "Scroll",
        font_size: 16
    };
    var eventsNames = {
        onSubmit: "event_submit",
        onItemSelect: "event_itemClick",
        onChange: "event_change",
        onItemHighlight: "event_itemHighlight"
    };
    var eventNamesArray = [];
    for (var i in eventsNames) {
        eventNamesArray.push(i);
    }

    function distribution(arr, value) {
        var l = 0;
        for (var i in arr) {
            var len = i / 100;
            if ((value > l && value <= len) || (l ===0 && value <= len)) {
                var v = (value - l) / (len - l);
                if ($.isFunction(arr[i])) {
                    arr[i](v);
                }
            }
            l = len;
        }
    }

    function extractListeners($e, s) {
        function listener(event, fn) {
            $e.on(event, function () {
                if ($.isFunction(fn)) {
                    fn.apply(this, arguments);
                } else {
                    window[fn].apply(this, arguments);
                }
            });
        }
        for (var i in s) {
            for (var j in eventsNames) {
                if (i.toString().toLowerCase() === j.toString().toLowerCase()) {
                    listener(eventsNames[j], s[i]);
                }
            }
        }
    }
    function hideSvg(e) {
        e.attr({
            visibility: "hidden"
        });
    }
    function showSvg(e) {
        e.attr({
            visibility: "visible"
        });
    }
    function extendArrayExcept(dest, src, except) {
        for (var i in src) {
            if ($.inArray(i, except) < 0) {
                dest[i] = src[i];
            }
        }
    }
    function bezier(x1, y1, x2, y2, duration) {

        var epsilon = (1000 / 60 / duration) / 4;

        var curveX = function (t) {
            var v = 1 - t;
            return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
        };

        var curveY = function (t) {
            var v = 1 - t;
            return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
        };

        var derivativeCurveX = function (t) {
            var v = 1 - t;
            return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (-t * t * t + 2 * v * t) * x2;
        };

        return function (t) {

            var x = t, t0, t1, t2, x2, d2, i;

            // First try a few iterations of Newton's method -- normally very fast.
            for (t2 = x, i = 0; i < 8; i++) {
                x2 = curveX(t2) - x;
                if (Math.abs(x2) < epsilon)
                    return curveY(t2);
                d2 = derivativeCurveX(t2);
                if (Math.abs(d2) < 1e-6)
                    break;
                t2 = t2 - x2 / d2;
            }

            t0 = 0; t1 = 1; t2 = x;

            if (t2 < t0)
                return curveY(t0);
            if (t2 > t1)
                return curveY(t1);

            // Fallback to the bisection method for reliability.
            while (t0 < t1) {
                x2 = curveX(t2);
                if (Math.abs(x2 - x) < epsilon)
                    return curveY(t2);
                if (x > x2)
                    t0 = t2;
                else
                    t1 = t2;
                t2 = (t1 - t0) * .5 + t0;
            }

            // Failure
            return curveY(t2);

        };

    }


    return function (e, c_settings) {
        var settings = {};
        $.extend(settings, defaultSettings);
        extendArrayExcept(settings, c_settings, eventNamesArray);

        var stroke = settings.line_stroke;
        var width = settings.width;
        var height = settings.height;
        var strokeOffset = stroke / 2;
        var w = width - (2 * strokeOffset);
        var h = height - (2 * strokeOffset);
        var duration = settings.duration;
        var duration2 = settings.duration2;
        var duration3 = settings.duration3;
        var color1 = settings.color1;
        var color2 = settings.color2;
        var shadowColor = settings.shadow_color;

        var $parentElem;
        var $svgElem;
        var $rectElem;
        var $rectElem2;
        var $circleElem;
        var $svgGroup;
        var $rectLen;
        var radius;
        var $circleRadius;
        var $startCircleR;
        var $textElem;
        var $wrapperElem;
        var offD = 7;
        function drawHtml(e) {
            $parentElem = $(e);
            $parentElem.html("<div style=\"display: inline-block;\" class=\"jellyboScrollButton004Wrapper\"><svg style=\"display: inline-block;\"></svg></div>");
            $svgElem = Snap($parentElem.find("svg")[0]);
            $svgElem.attr({
                width: width,
                height: height,
                style: "overflow: visible;"
            });
            $wrapperElem = $parentElem.find(".jellyboScrollButton004Wrapper");
            var spacing = 7;
            var tl = settings.text.length;
            var wt = (tl*((settings.font_size/2) + spacing)) - w;
            $wrapperElem.css({
                paddingBottom: (h * 0.7) ,
                paddingLeft:wt/2,
                paddingRight: wt/2
            });
            radius = Math.min(w, h) / 2;
            $rectElem = $svgElem.rect(strokeOffset, strokeOffset, w, h, radius, radius);
            var shadow = $svgElem.filter(Snap.filter.shadow(0, 0, 2, shadowColor, 0.5));
            $rectElem.attr({
                stroke: color1,
                fill: 'none',
                strokeWidth: stroke,
                strokeLinecap: "round",
                opacity: .3
            });
            $rectElem2 = $svgElem.rect(strokeOffset, strokeOffset, w, h, radius, radius);
            $rectElem2.attr({
                stroke: color2,
                fill: 'none',
                strokeWidth: stroke,
                strokeLinecap: "round",
                opacity: .8,
                filter: shadow

            });
            $rectLen = (2 * Math.PI * radius) + ((h - (2 * radius)) * 2);


            $circleRadius = w * .1;
            $startCircleR = $circleRadius;
            $circleElem = $svgElem.circle((w / 2) + strokeOffset, radius, $startCircleR);

            $circleElem.attr({
                fill: color2,
                stroke: 'none',
                filter: shadow,
                opacity: 0.8

            });

            $textElem = $svgElem.text(w / 2, h + (h * 0.7), settings.text);
            $textElem.attr({
                fill: color2,
                stroke: 'none',
                opacity: 0.8,
                style: "text-anchor: middle; font-family: 'UniformRnd-Regular', arial; letter-spacing: "+spacing+"px;",
                fontSize: settings.font_size

            });
            $svgGroup = $svgElem.group($rectElem, $rectElem2, $circleElem);

            runNext();
        }
        var step = 0;
        var counter = 0;
        var maxLoops = settings.loops;
        function runNext() {
            switch (step) {
                case 0:
                    anim1();
                    step = 1;
                    break;
                case 1:
                    anim2();
                    counter++;
                    if (counter === maxLoops) {
                        step = 2;
                        counter = 0;
                    } else {
                        step = 0;
                    }
                    break;
                case 2:
                    setTimeout(function () {
                        runNext();
                    }, duration3);

                    step = 0;
                    break;
            }

        }

        function anim1() {
            $rectElem2.attr({
                'strokeDashoffset': 0,
                'strokeDasharray': ($rectLen) + "px " + (0) + "px"
            });
            Snap.animate(0, 1, function (value) {
                var v = calculatePosition(0, $rectLen, value);
                var of2 = radius;
                $rectElem2.attr({
                    'strokeDashoffset': -(v / 2),
                    'strokeDasharray': ($rectLen - v) + "px " + (v) + "px"
                });
                var r = 0;
                distribution({40: function (v) {
                        var scaleMatrix = new Snap.Matrix();
                        
                        var tr = calculatePosition(0, offD, v);
                        
                        scaleMatrix.translate(0, tr);
                        $svgGroup.attr({transform: scaleMatrix});
                    }}, value);
                distribution({
                    70: function () {

                        r = $circleRadius;
                    },
                    100: function (v) {
                        r = calculatePosition($circleRadius, 0, v);
                    }
                }, value);
                distribution({
                    100: function (v) {
                        of2 = calculatePosition(radius, h - radius, v);
                    }
                }, value);
                $circleElem.attr({
                    cy: of2,
                    r: r
                });
                var op2 = calculatePosition(0.8, 0.2, value);
                $textElem.attr({opacity: op2});
               

            }, duration, mina.linear, function () {
                runNext();
            });

        }

        function anim2() {
            $rectElem2.attr({
                'strokeDasharray': $rectLen + "px " + "0px",
                opacity: 0
            });

            Snap.animate(0, 1, function (value) {
                var of = radius;
                var r = 0;
                distribution({
                    90: function (v) {
                        var scaleMatrix = new Snap.Matrix();
                        var tr = calculatePosition(offD, 0, v);
                        scaleMatrix.translate(0, tr);
                        $svgGroup.attr({transform: scaleMatrix});
                    }}, value);
                distribution({
                    50: function (v) {
                        r = 0;
                    },
                    90: function (v) {
                        r = calculatePosition(0, $startCircleR, v);
                    },
                    100: function () {
                        r = $startCircleR;
                    }
                }, value);
                distribution({
                    50: function (v) {

                    },
                    90: function (v) {
                        $rectElem2.attr({opacity: v});
                    }
                }, value);
                distribution({
                    90: function (v) {
                        of = calculatePosition(h - radius, radius, v);
                    },
                    100: function () {
                        of = radius;
                    }
                }, value);
                var op2 = calculatePosition(0.2, 0.8, value);
                $textElem.attr({opacity: op2});

                $circleElem.attr({
                    cy: of,
                    r: r
                });

            }, duration2, mina.linear, function () {
                runNext();

            });
        }


        function calculatePosition(from, to, value) {
            return from + ((to - from) * value);
        }

        function setSettings(s) {
            extendArrayExcept(settings, s, eventNamesArray);
            extractListeners($parentElem, s);
        }

        return {
            init: function () {
                drawHtml(e);
            },
            settings: setSettings

        };
    };
}($, Snap, mina);

Jellybo.BootLoader({
    pluginName: "jellyboScrollButton004",
    animationFactory: Jellybo.ScrollButton4,
    publicFunctions: ["start", "stop"],
    selector: ".jellybo-ScrollBtn004",
    settingAttributes: ["color1", "color2",  "shadow_color", "loops", 
        "line_stroke", "height", "width", "text"]
});
