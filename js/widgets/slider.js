(function( $ ) {
    "use strict";

    $.widget("metro.slider", {

        version: "3.0.0",

        options: {
            position: 0,
            accuracy: 0,
            color: 'default',
            completeColor: 'default',
            markerColor: 'default',
            colors: false,
            showHint: false,
            permanentHint: false,
            hintPosition: 'top',
            vertical: false,
			min: 0,
			max: 100,
			animate: true,
            minValue: 0,
            maxValue: 100,
            currValue: 0,
            returnType: 'value',
            target: false,

            onChange: function(value, slider){},
            onChanged: function(value, slider){},

            _slider : {
                vertical: false,
                offset: 0,
                length: 0,
                marker: 0,
                ppp: 0,
                start: 0,
                stop: 0
            }
        },

        _create: function(){
            var that = this,
                element = this.element;


            var o = this.options,
                s = o._slider;

            $.each(element.data(), function(key, value){
                if (key in o) {
                    try {
                        o[key] = $.parseJSON(value);
                    } catch (e) {
                        o[key] = value;
                    }
                }
            });

            o.accuracy = o.accuracy < 0 ? 0 : o.accuracy;
			o.min = o.min < 0 ? 0 : o.min;
			o.min = o.min > o.max ? o.max : o.min;
			o.max = o.max > 100 ? 100 : o.max;
			o.max = o.max < o.min ? o.min : o.max;
            o.position = this._correctValue(element.data('position') > o.min ? (element.data('position') > o.max ? o.max : element.data('position')) : o.min);
            o.colors = o.colors ? o.colors.split(",") : false;

            s.vertical = o.vertical;
            if (o.vertical && !element.hasClass('vertical')) {
                element.addClass('vertical');
            }
            if (o.permanentHint && !element.hasClass('permanent-hint')) {
                element.addClass('permanent-hint');
            }

            if (!o.vertical && o.hintPosition === 'bottom') {
                element.addClass('hint-bottom');
            }

            if (o.vertical && o.hintPosition === 'left') {
                element.addClass('hint-left');
            }

            this._createSlider();
            this._initPoints();
            this._placeMarker(o.position);

            addTouchEvents(element[0]);

            element.children('.marker').on('mousedown', function (e) {
                e.preventDefault();
                that._startMoveMarker(e);
            });

            element.on('mousedown', function (e) {
                e.preventDefault();
                that._startMoveMarker(e);
            });

            element.data('slider', this);

        },

        _startMoveMarker: function(e){
            var element = this.element, o = this.options, that = this, hint = element.children('.slider-hint');
            var returnedValue;

            $(element).on("mousemove", function (event) {
                that._movingMarker(event);
                if (!element.hasClass('permanent-hint')) {
                    hint.css('display', 'block');
                }
            });
            $(element).on("mouseup mouseleave", function () {
                $(element).off('mousemove');
                $(element).off('mouseup');
                element.data('value', o.position);
                element.trigger('changed', o.position);

                returnedValue = o.returnType === 'value' ? that._valueToRealValue(o.position) : o.position;

                if (typeof o.onChanged === 'string') {
                    window[o.onChanged](returnedValue, element);
                } else {
                    o.onChanged(returnedValue, element);
                }


                if (!element.hasClass('permanent-hint')) {
                    hint.css('display', 'none');
                }
            });

            this._initPoints();

            this._movingMarker(e);
        },

        _movingMarker: function (event) {
            var element = this.element, o = this.options;
            var cursorPos,
                percents,
                valuePix,

                vertical = o._slider.vertical,
                sliderOffset = o._slider.offset,
                sliderStart = o._slider.start,
                sliderEnd = o._slider.stop,
                sliderLength = o._slider.length,
                markerSize = o._slider.marker;

            if (vertical) {
                cursorPos = event.pageY - sliderOffset;
            } else {
                cursorPos = event.pageX - sliderOffset;
            }

            if (cursorPos < sliderStart) {
                cursorPos = sliderStart;
            } else if (cursorPos > sliderEnd) {
                cursorPos = sliderEnd;
            }

            if (vertical) {
                valuePix = sliderLength - cursorPos - markerSize / 2;
            } else {
                valuePix = cursorPos - markerSize / 2;
            }

            percents = this._pixToPerc(valuePix);

            this._placeMarker(percents);

            o.currValue = this._valueToRealValue(percents);
            o.position = percents;

            var returnedValue = o.returnType === 'value' ? this._valueToRealValue(o.position) : o.position;

            if (o.target) {
                $(o.target).val(returnedValue);
            }

            if (typeof o.onChange === 'string') {
                window[o.onChange](returnedValue, element);
            } else {
                o.onChange(returnedValue, element);
            }
        },

        _placeMarker: function (value) {
            var size, size2, o = this.options, colorParts, colorIndex = 0, colorDelta, element = this.element,
                marker = this.element.children('.marker'),
                complete = this.element.children('.complete'),
                hint = this.element.children('.slider-hint'), hintValue,
				oldPos = this._percToPix(o.position);

            colorParts = o.colors.length;
            colorDelta = o._slider.length / colorParts;

            if (o._slider.vertical) {
				var oldSize = this._percToPix(o.position) + o._slider.marker,
					oldSize2 = o._slider.length - oldSize;
                size = this._percToPix(value) + o._slider.marker;
                size2 = o._slider.length - size;
                this._animate(marker.css('top', oldSize2),{top: size2});
                this._animate(complete.css('height', oldSize),{height: size});

                if (colorParts) {
                    colorIndex = Math.round(size / colorDelta)-1;
                    complete.css('background-color', o.colors[colorIndex<0?0:colorIndex]);
                }
                if (o.showHint) {
                    hintValue = this._valueToRealValue(value);
                    hint.html(hintValue).css('top', size2 - hint.height()/2 + (element.hasClass('large') ? 8 : 0));
                }
            } else {
                size = this._percToPix(value);
                this._animate(marker.css('left', oldPos),{left: size});
                this._animate(complete.css('width', oldPos),{width: size});
                if (colorParts) {
                    colorIndex = Math.round(size / colorDelta)-1;
                    complete.css('background-color', o.colors[colorIndex<0?0:colorIndex]);
                }
                if (o.showHint) {
                    hintValue = this._valueToRealValue(value);
                    hint.html(hintValue).css({left: size - hint.width() / 2 + (element.hasClass('large') ? 6 : 0)});
                }
            }
        },

        _valueToRealValue: function(value){
            var o = this.options;
            var real_value;

            var percent_value = (o.maxValue - o.minValue) / 100;

            real_value = value * percent_value + o.minValue;

            return Math.round(real_value);
        },
		
		_animate: function (obj, val) {
            var o = this.options;

			if(o.animate) {
				obj.stop(true).animate(val);
			} else {
				obj.css(val);
			}
		},

        _pixToPerc: function (valuePix) {
            var valuePerc;
            valuePerc = valuePix * this.options._slider.ppp;
            return Math.round(this._correctValue(valuePerc));
        },

        _percToPix: function (value) {
            if (this.options._slider.ppp === 0) {
                return 0;
            }
            return Math.round(value / this.options._slider.ppp);
        },

        _correctValue: function (value) {
            var o = this.options;
            var accuracy = o.accuracy;
			var max = o.max;
			var min = o.min;
            if (accuracy === 0) {
                return value;
            }
            if (value === max) {
                return max;
            }
			if (value === min) {
                return min;
            }
            value = Math.floor(value / accuracy) * accuracy + Math.round(value % accuracy / accuracy) * accuracy;
            if (value > max) {
                return max;
            }
			if (value < min) {
                return min;
            }
            return value;
        },

        _initPoints: function(){
            var o = this.options, s = o._slider, element = this.element;

            if (s.vertical) {
                s.offset = element.offset().top;
                s.length = element.height();
                s.marker = element.children('.marker').height();
            } else {
                s.offset = element.offset().left;
                s.length = element.width();
                s.marker = element.children('.marker').width();
            }

            s.ppp = o.max / (s.length - s.marker);
            s.start = s.marker / 2;
            s.stop = s.length - s.marker / 2;
        },

        _createSlider: function(){
            var element = this.element,
                o = this.options,
                complete, marker, hint;

            element.html('');

            complete = $("<div/>").addClass("complete").appendTo(element);
            marker = $("<a/>").addClass("marker").appendTo(element);

            if (o.showHint) {
                hint = $("<span/>").addClass("slider-hint").appendTo(element);
            }

            if (o.color !== 'default') {
                if (o.color.isColor()) {
                    element.css('background-color', o.color);
                } else {
                    element.addClass(o.color);
                }
            }
            if (o.completeColor !== 'default') {
                if (o.completeColor.isColor()) {
                    complete.css('background-color', o.completeColor);
                } else {
                    complete.addClass(o.completeColor);
                }
            }
            if (o.markerColor !== 'default') {
                if (o.markerColor.isColor()) {
                    marker.css('background-color', o.markerColor);
                } else {
                    marker.addClass(o.markerColor);
                }
            }
        },

        value: function (value) {
            var o = this.options, returnedValue;

            if (typeof value !== 'undefined') {

                value = value > o.max ? o.max : value;
                value = value < o.min ? o.min : value;

                this._placeMarker(parseInt(value));
                o.position = parseInt(value);

                returnedValue = o.returnType === 'value' ? this._valueToRealValue(o.position) : o.position;


                if (typeof o.onChange === 'string') {
                    window[o.onChange](returnedValue, this.element);
                } else {
                    o.onChange(returnedValue, this.element);
                }

                return this;
            } else {
                returnedValue = o.returnType === 'value' ? this._valueToRealValue(o.position) : o.position;
                return returnedValue;
            }
        },

        _destroy: function(){},

        _setOption: function(key, value){
            this._super('_setOption', key, value);
        }
    });
})( jQuery );