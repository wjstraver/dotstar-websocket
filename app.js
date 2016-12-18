//_____Settings______________________________________________________________________________________________________/
var IS_PI = false; // set this on false in test environment
var DEBUG = true;
var LEDSTRIP_LENGTH = 17;
var PORT = 8080;


//_____App_Variables_________________________________________________________________________________________________/
var blockVals = {
	r: 0,
	g: 0,
	b: 0,
	i: 0,
	a: LEDSTRIP_LENGTH
};
var doingStartAnimation = false;
var doingCloseAnimation = false;
var blockUpdate = false;
var blockHold = false;
var blockTimeout;
var blockTimeoutTime = 1000/40;
//_____Debug_Variables_______________________________________________________________________________________________/
var Debug = require('./helpers/Debug');
Debug.setOptions({enabled: true, enabledLevels:{
	 ws: '\033[95m',   // magenta
	 server: '\033[96m',   // cyan
	 led: '\033[93m',   // yellow '\033[92m', 	// green
	 exit: '\033[01;31m'   // red
},useColors: true});

//_____Dotstar_Variables_____________________________________________________________________________________________/
var dotstar, SPI, spi, ledStrip;
if(IS_PI){
	dotstar = require('dotstar');
	SPI = require('pi-spi');
	spi = SPI.initialize('/dev/spidev0.0');

	ledStrip = new dotstar.Dotstar(spi, {length: LEDSTRIP_LENGTH});
}
//_____Server_&_WebSocket_Variables__________________________________________________________________________________/
var server = require('http').createServer()
  , url = require('url')
  , WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ server: server })
  , express = require('express')
  , app = express()
  , path = require('path');



//_____Dotstar_Functions_____________________________________________________________________________________________/
var _updateLights = function(_obj){
	if(!doingStartAnimation && !doingCloseAnimation){
		if(!blockUpdate){
			blockHold = false;
			blockUpdate = true;

			for(var i=0; i<LEDSTRIP_LENGTH; i++){
				if(i <=_obj.a)ledStrip.set(i, _obj.r, _obj.g, _obj.b, _obj.i);
				else ledStrip.set(i, 0, 0, 0, _obj.i);
			}
			ledStrip.sync();

			blockTimeout = setTimeout(_blockTimeoutEnd,blockTimeoutTime);
		} else {
			// blocked by too fast update
			blockHold = true;
	    	blockVals = _obj;
		}
	} else {
		// blocked by start/close animation
	}
};
var _blockTimeoutEnd = function(){
	clearTimeout(blockTimeout);
	blockUpdate = false;
	if(blockHold)_updateLights(blockVals);
};
var _startAnim = function(){
	if(!doingStartAnimation && !doingCloseAnimation){
		doingStartAnimation = true;	

		ledStrip.all(0,255,0,0.5);
		ledStrip.sync();

		setTimeout(function(){
			ledStrip.clear();
			ledStrip.sync();
			doingStartAnimation = false;
		},500);
	}
};
var _closeAnim = function(){
	if(!doingStartAnimation && !doingCloseAnimation){
		doingCloseAnimation = true;

		var counter = 0
		var maxAmount = 4;
		var interval;

		interval = setInterval(function(){
			if(counter < maxAmount){
				if(counter%2)ledStrip.all(0, 0, 0, 0.5);
				else ledStrip.all(255, 0, 0, 0.5);
				ledStrip.sync();
				counter++;
			} else {
				clearInterval(interval);
				ledStrip.clear();
				ledStrip.sync();
				doingCloseAnimation = false;
			}
		},500);
	}
};

//_____WebSocket_Functions___________________________________________________________________________________________/
wss.on('connection', function connection(ws) {
	ws.on('open',function(){
		Debug.logL('ws','WebSocket | onOpen() |','connection opened');
	});

	ws.on('close', function closing(){
		Debug.logL('ws','WebSocket | onClose() |','lost connection with', ws._socket.remoteAddress);
		if(IS_PI)_closeAnim();
	});

	ws.on('message', function incoming(message) {
		var obj = JSON.parse(message);
		if(IS_PI){
			_updateLights(obj);
		} else {
			Debug.logL('led','Leds | no pi | onMessage() |','ledStrip.set('+obj.r+','+obj.g+','+obj.b+','+obj.i+') amount: '+obj.a);
		}
	});

  	Debug.logL('ws','WebSocketServer | onConnection() | ','New connected with:',ws._socket.remoteAddress);
  	if(IS_PI)_startAnim();
  	ws.send('hello!');
});

//_____Server_Functions______________________________________________________________________________________________/
app.use(express.static(path.join(__dirname,'public')));
app.use('/style',express.static(path.join(__dirname,'public/style')));
app.use('/media',express.static(path.join(__dirname,'public/media')));
app.use('/js',express.static(path.join(__dirname,'public/js')));
app.use(function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});

server.on('request', app);
server.listen(PORT, function () {
	Debug.logL('server','Server | listen() |','Listening on ' + server.address().port) 
});

//_____Exit_Handler__________________________________________________________________________________________________/
var _exitHandler = function(){
	Debug.logL('exit','App | exitHandler() |','stopping process');
	if(IS_PI){
		ledStrip.clear();
		ledStrip.sync();
		ledStrip.off();
	}
	process.exit(0);

};
process.on('close',_exitHandler);
process.on('SIGINT',_exitHandler);
//process.on('uncaughtException',_exitHandler);