var _defaultStyle = "\033[1m";
var _defaultColorDepth = 3;

var _enabled = false;
var _enabledLevels = [];
var _useColors = true;
var _colorDepth = 3;


var _newArguments = function(start, args){
	args = (args.length == 1)? [args[0]] : Array.apply(null,args);

	args.splice(0,start);
	return args;
}

var _addLevels = function(existing, _new){
	var newObject = {};

	_new = _new || false;

	if(_new.constructor === String){
		newObject[_new] = _defaultStyle;

	} else if(_new.constructor === Array){
		for(var i=0; i<_new.length; i++){
			newObject[_new[i]] = _defaultStyle;
		}
	} else if(_new.constructor === Object){
		for(var k in _new){
			if(_new[k] && _new[k].constructor === String){
				newObject[k] = _new[k];
			} else {
				newObject[k] = _defaultStyle;
			}
		}
	} else {
		newObject = {
			'default': _defaultStyle
		}
	}

	for(var l in newObject){
		existing[l] = newObject[l];
	}

	return existing;
}

var _removeLevels = function(existing, _tbr){ // _tbr = to be removed
	if(_tbr.constructor === String){
		delete existing[_tbr];

	} else if(_tbr.constructor === Array){
		for(var i=0; i<_tbr.length; i++){
			delete existing[_tbr[i]];
		}
	} else if(_tbr.constructor === Object){ // is here for convenience. 
		for(var k in _tbr){
			delete existing[k];
		}
	}

	return existing;
}

var _getTimeStamp = function() {
	var d = new Date();
	return (d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + ' ' + d.getHours() + ':' + ('0' + d.getMinutes()).slice(-2) + ':' + ('0' + d.getSeconds()).slice(-2) + '.' + ('00' + d.getMilliseconds()).slice(-3));
}

var _colorConsole = function(args, levelDepth ,level){
	level = level || 0;
	for(var i=0; i<args.length; i++){
		if(args[i].constructor === Number){
			args[i] = "\033[33m"+ args[i].toString() +"\033[0m";// color yellow

		} else if(args[i].constructor === Boolean){
			args[i] = "\033[33m"+ args[i].toString() +"\033[0m";// color magenta = 35

		} else if(args[i].constructor === String && (i > 0 || level !== 0) ){
			args[i] = "\033[32m'"+ args[i] + "'\033[0m"; // color green
		} else if(args[i].constructor === Array){
			if(level < levelDepth)args[i] = '[ '+_colorConsole(args[i], levelDepth, level+1).join(', ')+ ' ]';
			else args[i] = '[ '+args[i].join(', ')+' ]';

		// } else if(args[i].constructor === Object){ //// this one is not working correctly yet.....
		// 	if(level <= levelDepth){
		// 		for(var k in args[i]){

		// 			if(args[i].hasOwnProperty(k))args[i][k] = _colorConsole(args[i][k], levelDepth, level+1);
		// 		}
		// 	}
		}
	}

	return args;
}

var _Debug = function(type, args, style, colors, colorDepth){
	if(args[0].constructor === String) args[0] = style + _getTimeStamp() + ' | ' + args[0] + "\033[0m";
	else args.unshift(style + _getTimeStamp() + " |\033[0m");

	if(type === 'dir'){
		console.log('    '+args.shift());
		for(var i=0; i<args.length; i++){
			console.dir(args[i],{colors: colors});
		}
	} else {
		if(colors)args = _colorConsole(args, colorDepth);

		switch(type){
			case "error":
				args[0] = '\033[1;41;7m X \033[0m '+ args[0];
				break;
			case "warn":
				args[0] = '\033[1;43;7m ! \033[0m '+ args[0];
				break;
			case "info":
				args[0] = '\033[1;44m i \033[0m '+ args[0];
				break;
			default:
			case "log":
				args[0] = '    '+ args[0];
				break;
		}
		console.log.apply(console, args);
	}
}

var _debug = function(type, level, style,args){
	if(_enabled && _enabledLevels.hasOwnProperty(level)){
		if(!style) style = _enabledLevels[level];

		_Debug(type, args, style, _useColors, _colorDepth);
	}
};

module.exports = {
	setOptions: function(options){
		options = (options && options.constructor === Object)? options : {};

		_enabled = (options.enabled === true);
		_enabledLevels = _addLevels({'default': _defaultStyle}, options.enabledLevels);
		_useColors = (options.useColors === true);
		_colorDepth = (options.colorDepth)? Number(options.colorDepth) : _defaultColorDepth;
	},
	/**
	 * Enable debugging.
	 *
	 * @method enable
	 * @return null
	 */
	enable: function(){
		_enabled = true;
	},

	/**
	 * Disable debugging.
	 *
	 * @method disable
	 * @return null
	 */
	disable: function(){
		_enabled = false;
	},

	/**
	 * Enable debugging on a list of debug levels.
	 *
	 * @method enableLevels
	 * @param {String|Array|Object} arrayLevels The list of debug levels to enable.
	 * @return null
	 * @example
	 * 		Debug.enableLevels('myCustomLevel');
	 * 		Debug.enableLevels(['customLevel1','customLevel2']);
	 * 		Debug.enableLevels({customLevel1: "\033[1;31m", customLevel2: "\033[32m"});
	 */
	enableLevels: function(levels){
		_enabledLevels = _addLevels(_enabledLevels, levels);
	},

	/**
	 * Disable debugging on a list of debug levels.
	 *
	 * @method disableLevels
	 * @param {String|Array|Object} arrayLevels The list of debug levels to enable.
	 * @return null
	 * @example
	 * 		Debug.disableLevels('myCustomLevel');
	 * 		Debug.disableLevels(['customLevel1','customLevel2']);
	 * 		Debug.disableLevels({customLevel1: "\033[1;31m", customLevel2: "\033[32m"});
	 */
	disableLevels: function(levels){
		_enabledLevels = _removeLevels(_enabledLevels, levels);
	},

	/**
	 * Enable or disable debugging.
	 *
	 * @method set
	 * @param {Boolean} bool set debugging on true or false
	 * @return null
	 */
	set: function(bool){
		_enabled = !(!bool);
	},

	/**
	 * Use colors on numbers, strings and booleans.
	 *
	 * @method useColors
	 * @param {Boolean} bool set the use of colors on true or false
	 * @return null
	 */
	useColors: function(bool){
		_useColors = !(!bool);
	},

	/**
	 * Change the depth level of coloring Arrays
	 *
	 * @method changeColorDepth
	 * @param {Number} int amount of levels Arrays are getting colored if useColors is enabled
	 * @return null
	 */
	changeColorDepth: function(int){
		_colorDepth = Number(int);
	},
	/**
	 * Outputs a message to the Console.
	 * Uses debug level 'default'.
	 *
	 * @method log
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.log('Hello World!');
	 * 		Debug.log('Hello World!', MyObject, 16);
	 */
	log: function(){
		_debug('log', 'default', false, _newArguments(0, arguments));
	},
	/**
	 * Outputs a message to the Console.
	 *
	 * @method logL
	 * @param {String} level The debug level for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.logL('myCustomLevel',Hello World!');
	 * 		Debug.logL('myCustomLevel',Hello World!', MyObject, 16);
	 */
	logL: function(level){
		_debug('log', level, false, _newArguments(1, arguments));
	},
	/**
	 * Outputs a message to the Console.
	 *
	 * @method logS
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.logS('\033[1m','Hello World!');
	 * 		Debug.logS('\033[31m',Hello World!', MyObject, 16);
	 */
	logS: function(style){
		_debug('log', 'default', style, _newArguments(1, arguments));
	},
	/**
	 * Outputs a message to the Console.
	 *
	 * @method logE
	 * @param {String} level The debug level for the output
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.logE('myCustomLevel','\033[1m','Hello World!');
	 * 		Debug.logE('myCustomLevel','\033[31m',Hello World!', MyObject, 16);
	 */
	logE: function(level, style){
		_debug('log', level, style, _newArguments(2, arguments));
	},

	/**
	 * Outputs a warning message to the Console.
	 * Uses debug level 'default'.
	 *
	 * @method warn
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.warn('Hello World!');
	 * 		Debug.warn('Hello World!', MyObject, 16);
	 */
	warn: function(){
		_debug('warn', 'default', false, _newArguments(0, arguments));
	},
	/**
	 * Outputs a warning message to the Console.
	 *
	 * @method warnL
	 * @param {String} level The debug level for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.warnL('myCustomLevel',Hello World!');
	 * 		Debug.warnL('myCustomLevel',Hello World!', MyObject, 16);
	 */
	warnL: function(level){
		_debug('warn', level, false, _newArguments(1, arguments));
	},
	/**
	 * Outputs a warning message to the Console.
	 *
	 * @method warnS
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.warnS('\033[1m','Hello World!');
	 * 		Debug.warnS('\033[31m',Hello World!', MyObject, 16);
	 */
	warnS: function(style){
		_debug('warn', 'default', style, _newArguments(1, arguments));
	},
	/**
	 * Outputs a warning message to the Console.
	 *
	 * @method warnE
	 * @param {String} level The debug level for the output
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.warnE('myCustomLevel','\033[1m','Hello World!');
	 * 		Debug.warnE('myCustomLevel','\033[31m',Hello World!', MyObject, 16);
	 */
	warnE: function(level, style){
		_debug('warn', level, style, _newArguments(2, arguments));
	},

	/**
	 * Outputs an info message to the Console.
	 * Uses debug level 'default'.
	 *
	 * @method info
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.info('Hello World!');
	 * 		Debug.info('Hello World!', MyObject, 16);
	 */
	info: function(){
		_debug('info', 'default', false, _newArguments(0, arguments));
	},
	/**
	 * Outputs an info message to the Console.
	 *
	 * @method infoL
	 * @param {String} level The debug level for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.infoL('myCustomLevel',Hello World!');
	 * 		Debug.infoL('myCustomLevel',Hello World!', MyObject, 16);
	 */
	infoL: function(level){
		_debug('info', level, false, _newArguments(1, arguments));
	},
	/**
	 * Outputs an info message to the Console.
	 *
	 * @method infoS
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.infoS('\033[1m','Hello World!');
	 * 		Debug.infoS('\033[31m',Hello World!', MyObject, 16);
	 */
	infoS: function(style){
		_debug('info', 'default', style, _newArguments(1, arguments));
	},
	/**
	 * Outputs an info message to the Console.
	 *
	 * @method infoE
	 * @param {String} level The debug level for the output
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.infoE('myCustomLevel','\033[1m','Hello World!');
	 * 		Debug.infoE('myCustomLevel','\033[31m',Hello World!', MyObject, 16);
	 */
	infoE: function(level, style){
		_debug('info', level, style, _newArguments(2, arguments));
	},

	/**
	 * Outputs an error message to the Console.
	 * Uses debug level 'default'.
	 *
	 * @method error
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.error('Hello World!');
	 * 		Debug.error('Hello World!', MyObject, 16);
	 */
	error: function(){
		_debug('error', 'default', false, _newArguments(0, arguments));
	},
	/**
	 * Outputs an error message to the Console.
	 *
	 * @method errorL
	 * @param {String} level The debug level for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.errorL('myCustomLevel',Hello World!');
	 * 		Debug.errorL('myCustomLevel',Hello World!', MyObject, 16);
	 */
	errorL: function(level){
		_debug('error', level, false, _newArguments(1, arguments));
	},
	/**
	 * Outputs an error message to the Console.
	 *
	 * @method errorS
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.errorS('\033[1m','Hello World!');
	 * 		Debug.errorS('\033[31m',Hello World!', MyObject, 16);
	 */
	errorS: function(style){
		_debug('error', 'default', style, _newArguments(1, arguments));
	},
	/**
	 * Outputs an error message to the Console.
	 *
	 * @method errorE
	 * @param {String} level The debug level for the output
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.errorE('myCustomLevel','\033[1m','Hello World!');
	 * 		Debug.errorE('myCustomLevel','\033[31m',Hello World!', MyObject, 16);
	 */
	errorE: function(level, style){
		_debug('error', level, style, _newArguments(2, arguments));
	},

	/**
	 * Outputs a dir message to the Console.
	 * Uses debug level 'default'.
	 *
	 * @method dir
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.dir('Hello World!');
	 * 		Debug.dir('Hello World!', MyObject, 16);
	 */
	dir: function(){
		_debug('dir', 'default', false, _newArguments(0, arguments));
	},
	/**
	 * Outputs a dir message to the Console.
	 *
	 * @method dirL
	 * @param {String} level The debug level for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.dirL('myCustomLevel',Hello World!');
	 * 		Debug.dirL('myCustomLevel',Hello World!', MyObject, 16);
	 */
	dirL: function(level){
		_debug('dir', level, false, _newArguments(1, arguments));
	},
	/**
	 * Outputs a dir message to the Console.
	 *
	 * @method dirS
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.dirS('\033[1m','Hello World!');
	 * 		Debug.dirS('\033[31m',Hello World!', MyObject, 16);
	 */
	dirS: function(style){
		_debug('dir', 'default', style, _newArguments(1, arguments));
	},
	/**
	 * Outputs a dir message to the Console.
	 *
	 * @method dirE
	 * @param {String} level The debug level for the output
	 * @param {String} style The debug style for the output
	 * @param {Object} obj1...objN Objects to output.
	 * @return null
	 * @example
	 * 		Debug.dirE('myCustomLevel','\033[1m','Hello World!');
	 * 		Debug.dirE('myCustomLevel','\033[31m',Hello World!', MyObject, 16);
	 */
	dirE: function(level, style){
		_debug('dir', level, style, _newArguments(2, arguments));
	}
};