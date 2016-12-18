(function(){
	//_____Variables_____________________________________________________________________________________________________/
	var wsStatus;
	var connecting = false;
	var connected = false;
	var lastSend = {
		r: 64,
		g: 64,
		b: 64,
		i: 0.25,
		a: 17,
		h: 0,
		s: 0,
		v: 25
	};

	var _sliders;
	var _slidersInfo = [];
	var _amountSliderFiller;

	//_____Functions_____________________________________________________________________________________________________/
	var _connect = function(){
		if(window.WebSocket){
			if(!connecting || !connected){
				websocket = new WebSocket("ws://"+location.host);
				var connecting = true;

				websocket.onopen = function(){
					connecting = false;
					connected = true;
					wsStatus.innerHTML = "alive";
					wsStatus.style.color = "#33dd33";
					// console.log(e);
				};
				websocket.onclose = function(){
					connected = false;
					// console.log('connection closed');
					wsStatus.innerHTML = 'closed';
					wsStatus.style.color = "#dd3333";
				};
				websocket.onerror = function(){
					connected = false;
					wsStatus.innerHTML = "error";
					wsStatus.style.color = "#dd3333";
				};
				websocket.onmessage = function(ms){
					// console.log("received a message:",ms.data);
				};
			} else {
				// already connecting or connected
				// console.log('websocket already connected or trying to connect');
			}
		} else {
			// websocket impossible in this browser!
			// console.log('browser does not support websockets');
		}
	};

	var _sendUpdate = function(obj){
		if(connected){
			_amountSliderFiller.style.backgroundColor = "rgba("+obj.r+","+obj.g+","+obj.b+","+obj.i+")";
			websocket.send(JSON.stringify(obj));
			//lastSend = obj;
		} else {
			// console.log('oops, not connected!');
		}
		_updateSliders(obj);
	};

	var _updateAllValues = function(val, type){
		var c;
		var o = lastSend;
		o[type] = val;

		switch(type){
			case "r":
			case "g":
			case "b":
				c = RGBtoHSV(o)
				o.h = c.h;
				o.s = c.s;
				o.v = c.v;
				break;
			case "i":
			case "a":
				break;
			case "h":
			case "s":
			case "v":
				c = HSVtoRGB(o);
				o.r = c.r;
				o.g = c.g;
				o.b = c.b;
				break;
		}
		return o;
	};

	var _updateSliders = function(obj){
		for(var j=0; j<_sliders.length; j++){
			var bgc = "";
			var w = (obj[_slidersInfo[j].type]/_slidersInfo[j].max)*100;

			switch(_slidersInfo[j].type){
	        	case "r":
	        		bgc = "rgb("+obj.r+",0,0)";
	        		break;
	        	case "g":
	        		bgc = "rgb(0,"+obj.g+",0)";
	        		break;
	        	case "b":
	        		bgc = "rgb(0,0,"+obj.b+")";
	        		break;
	        	case "i":
	        		var i = obj.i*255;
	        		bgc = "rgb("+i+","+i+","+i+")";
	        		break;
	    		case "a":// amount
	        		bgc = "rgb("+obj.r+","+obj.g+","+obj.b+")";
	        		break;
				case "h":
					var h = HSVtoRGB(obj.h,100,100);
	        		//bgc = "rgb("+h.r+","+h.g+","+h.b+")";
	        		break;
				case "s":
					var s = HSVtoRGB(obj.h,obj.s,100);
	        		bgc = "rgb("+s.r+","+s.g+","+s.b+")";
	        		break;
				case "v":
					var v = HSVtoRGB(obj.h,100,obj.v);
	        		bgc = "rgb("+v.r+","+v.g+","+v.b+")";
	        		break;
			}
			_slidersInfo[j].filler.style.backgroundColor = bgc;
			_slidersInfo[j].filler.style.width = w +"%";
		}
	};

	var _move = function(pageX, element, elementId){
		var position = (pageX - element.getBoundingClientRect().left)/element.offsetWidth;
	        if(position < 0)position = 0;
	        else if(position > 1) position = 1;
	        
	        var val = 0;
	        var bgc = "";
	        switch(_slidersInfo[elementId].type){
	        	case "r":
	        	case "g":
	        	case "b":
	    		case "a":// amount
				case "h":
				case "s":
				case "v":
	        		val = Math.round(_slidersInfo[elementId].max * position);
	        		break;
	        	case "i":
	        		val = Math.round(_slidersInfo[elementId].max * position * 100)/100;
					break;
	        }
	        if(lastSend[_slidersInfo[elementId].type] !== val){
	        	lastSend = _updateAllValues(val,_slidersInfo[elementId].type);
	        	_sendUpdate(lastSend);
	        }
	};

	//_____Mouse_Events__________________________________________________________________________________________________/
	var _sliderMouseDownEvent = function(e){
		var me = this;
		var id = this.getAttribute('data-id');
		;
		var _mouseMove = function(mouse){
			_move(mouse.pageX,me,id);
	    };
	    _mouseMove(e);
	    
	    document.addEventListener('mousemove',_mouseMove);
	    document.addEventListener('mouseup',function bb(){
	        document.removeEventListener('mouseup',bb);
	        document.removeEventListener('mousemove',_mouseMove);
		});
	};


	//_____Touch_Events__________________________________________________________________________________________________/
	var _sliderTouchStartEvent = function(e){
		var me = this;
		var id = this.getAttribute('data-id');

		var _touchMove = function(e){
			_move(e.touches[0].pageX,me,id);
		};
		_touchMove(e);

		document.addEventListener('touchmove',_touchMove);
		document.addEventListener('touchend',function te(){
			document.removeEventListener('touchend',te);
			document.removeEventListener('touchmove',_touchMove);
		});
	};

	//_____Initialize____________________________________________________________________________________________________/
	var _init = function(){
		document.body.onload = null;

		wsStatus = document.getElementById('websocketStatus');
		_sliders = document.getElementsByClassName('slider');
		_amountSliderFiller = document.getElementById('amountSliderFiller');
		
		for(var i = 0; i<_sliders.length; i++){
			_sliders[i].addEventListener('mousedown',_sliderMouseDownEvent);
			_sliders[i].addEventListener('touchstart',_sliderTouchStartEvent);
			_sliders[i].setAttribute('data-id',i);

			_slidersInfo[i] = {
				type:    _sliders[i].getAttribute('data-type'),
				max:     _sliders[i].getAttribute('data-max'),
				filler:  _sliders[i].getElementsByClassName('filler')[0]
			};
		}

		_connect();
	};
	window.onload = _init;

	//_____Helper_Functions______________________________________________________________________________________________/
	function HSVtoRGB(h, s, v) {
	    var r, g, b, i, f, p, q, t;
	    if (arguments.length === 1) {
	        s = h.s, v = h.v, h = h.h;
	    }
	    h=h/255
	    s=s/100;
	    v=v/100;
	    i = Math.floor(h * 6);
	    f = h * 6 - i;
	    p = v * (1 - s);
	    q = v * (1 - f * s);
	    t = v * (1 - (1 - f) * s);
	    switch (i % 6) {
	        case 0: r = v, g = t, b = p; break;
	        case 1: r = q, g = v, b = p; break;
	        case 2: r = p, g = v, b = t; break;
	        case 3: r = p, g = q, b = v; break;
	        case 4: r = t, g = p, b = v; break;
	        case 5: r = v, g = p, b = q; break;
	    }
	    return {
	        r: Math.round(r * 255),
	        g: Math.round(g * 255),
	        b: Math.round(b * 255)
	    };
	}
	function RGBtoHSV(r, g, b) {
	    if (arguments.length === 1) {
	        g = r.g, b = r.b, r = r.r;
	    }
	    var max = Math.max(r, g, b), min = Math.min(r, g, b),
	        d = max - min,
	        h,
	        s = (max === 0 ? 0 : d / max),
	        v = max / 255;

	    switch (max) {
	        case min: h = 0; break;
	        case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
	        case g: h = (b - r) + d * 2; h /= 6 * d; break;
	        case b: h = (r - g) + d * 4; h /= 6 * d; break;
	    }

	    return {
	        h: h*255,
	        s: s*100,
	        v: v*100
	    };
	}
}());