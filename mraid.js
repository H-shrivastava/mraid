
/* MRAID - In-Browser Simulation of MRAID
  
  v0.1 - support for getVersion, getStatus and open
  v0.2 - Full MRAID support - major rewrite of expanded functionality as well
*/

// The follwing EventTarget definition is from MDN
// Original code from MDN (https://developer.mozilla.org/en-US/docs/Web/API/EventTarget)

var EventTarget = function() {
  this.listeners = {};
};

EventTarget.prototype.listeners = null;
EventTarget.prototype.addEventListener = function(type, callback) {
  if (!(type in this.listeners)) {
    this.listeners[type] = [];

  }
  this.listeners[type].push(callback);
};

EventTarget.prototype.removeEventListener = function(type, callback) {
  if (!(type in this.listeners)) {
    return;
  }
  var stack = this.listeners[type];
  for (var i = 0, l = stack.length; i < l; i++) {
    if (stack[i] === callback){
      stack.splice(i, 1);
      return;
    }
  }
};

EventTarget.prototype.dispatchEvent = function(event) {
  if (!(event.type in this.listeners)) {
    return true;
  }

  // Get optional arguments on the events
  var args = Array.prototype.slice.call(arguments, 1);

  var stack = this.listeners[event.type];

  for (var i = 0, l = stack.length; i < l; i++) {
    //stack[i].call(this, param);
    stack[i].apply(this, args);
  }

  return !event.defaultPrevented;
};

new function(global) {
    var _state = 'loading';

    var _stateChange = function(state) {
    if (_state !== state) {
      _state = state;
      mraid.dispatchEvent(new CustomEvent('stateChange'),state);
    }    
  };

  var _expandProperties = false;
  var _resizeProperties = false;
  var _origProperties;
  
  var _lazyLoad = function() {
    _origProperties = _origProperties || {
      'width': document.body.offsetWidth,
      'height': document.body.offsetHeight,
      'useCustomClose': false,
      'isModal': true,
      'top': document.body.getBoundingClientRect().y,
      'left': document.body.getBoundingClientRect().x
    };
  };

  var mraid = new EventTarget();
    
  //Mraid 1.0 Interface
    mraid.getState = function() {
        return _state;
    };
    
    mraid.getVersion = function() {
        return '2.0';
    };

    mraid.open = function(URL) {
        window.open(URL);
    };

  mraid.close = function() {
    switch (_state) {
      case 'expanded':
        window.parent.postMessage({'sig': 'CLOSE'},'*');
        _stateChange('default');
        break;
      case 'resized':
        document.body.style['margin-top'] = _origProperties.top;
        document.body.style['margin-left'] = _origProperties.left;
        document.body.style['height'] = _origProperties.height;
        document.body.style['width']  = _origProperties.width;      
        _stateChange('default');
        break;
    }
  };

  mraid.useCustomClose = function() {
    if (_expandProperties) {
      _expandProperties.useCustomClose = true;
    } else {
      _lazyLoad();
      _origProperties.useCustomClose = true;
    }
  };

  mraid.expand = function(URL) {
    // When Expand is called with a URL, it'll open a new window with the URL
    if (URL !== undefined) {
      window.parent.postMessage({'sig': 'EXPAND','val': URL},'*');
    }
    else {
      _lazyLoad();
      // Setup Close Region
      _enableCloseRegion(_origProperties.left + (_expandProperties?_expandProperties.width:_origProperties.width) 
        , _origProperties.top
        , _expandProperties && !_expandProperties.useCustomClose || !_origProperties.useCustomClose);
      
      // If Expand Properties was set by user then use the values to setup close button
      /*if (_expandProperties && !_expandProperties.useCustomClose || !_origProperties.useCustomClose) {
      
        // If there is no custom close box then show one
        _showCloseButton();
      }*/
    }
    _stateChange('expanded');
  };

  mraid.getExpandProperties = function() {
    if (_expandProperties) {
      return _expandProperties;
    }
    else {
      _lazyLoad();
      return {
        'width': _origProperties.width,
        'height': _origProperties.height,
        'useCustomClose': false,
        'isModal': true
      } 
    }
  };

  mraid.setExpandProperties = function(obj) {
    _expandProperties = obj;

  };

  mraid.getPlacementType = function() {
    return "inline";
  };

  mraid.isViewable = function() {
    return true;
  };

  //2.0 Methods
  /*
resizeProperties object = {
Ã¢â‚¬Å“widthÃ¢â‚¬Â : integer,
Ã¢â‚¬Å“heightÃ¢â‚¬Â : integer,
Ã¢â‚¬Å“offsetXÃ¢â‚¬Â : integer,
Ã¢â‚¬Å“offsetYÃ¢â‚¬Â : integer,
Ã¢â‚¬Å“customClosePositionÃ¢â‚¬Â : string,
Ã¢â‚¬Å“allowOffscreenÃ¢â‚¬Â : boolean
} 
*/

  mraid.resize = function() {
    if (!_resizeProperties) {
      mraid.dispatchEvent(new CustomEvent('error'));
    }
    else {
      _lazyLoad();
      document.body.style['margin-top'] = _origProperties.top + _resizeProperties.offsetY; 
      document.body.style['margin-left'] = _origProperties.left + _resizeProperties.offsetX;
      document.body.style['height'] = _resizeProperties.height;
      document.body.style['width']  = _resizeProperties.width; 
      _enableCloseRegion(_origProperties.left + _resizeProperties.offsetX + _resizeProperties.width,
          _origProperties.top, false);  
      _stateChange('resized');
    }
  };

  mraid.setResizeProperties = function (obj) {
    _resizeProperties = obj;
  }

  mraid.getResizeProperties = function() {
    return _resizeProperties;
  }

  mraid.getScreenSize = function() {
    // This method should return the User Agent's usable height and width
    var ls = window.localStorage;
    if (ls) {
      return JSON.parse(ls.viewport);
    }
    else {
      return {
        width: _origProperties.width,
        height: _origProperties.height
      };
    }
  };

  mraid.getMaxSize = function() {
    // This method should simply return the maximu usable height and width
    return {
      width: _origProperties.width,
      height: _origProperties.height
    };
  };

  mraid.getDefaultPosition = function() {
    _lazyLoad();

    return {
      x: 0,
      y: 0,
      width: _origProperties.width,
      height: _origProperties.height
    };
  };
  /* getCurrentPosition method
      The getCurrentPosition method will return the current position and size of the ad view,
      measured in density-independent pixels.
  */
  mraid.getCurrentPosition = function() {
    switch (_state) {
      case 'expanded':
        if (!_expandProperties) {
          return this.getDefaultPosition();
        }
        else {
          return {
            x: 0,
            y: 0,
            width: _expandProperties.width,
            height: _expandProperties.height
          };
        }
        break;
      case 'resized':
        break;
      default:
        return this.getDefaultPosition();
    }
  };

  mraid.supports = function(val) {
    switch (val) {
      case 'sms':
        return false;
      case 'tel':
        return false;
      case 'calendar':
        return false;
      case 'storePicture':
        return false;
      case 'inlineVideo':
        return false;
    }
  };

  // Orientation Object
  /*
  orientationProperties object = {
    "allowOrientationChange" : boolean,
    "forceOrientation" : "portrait|landscape|none
  }
  */
  var _orientationProperties;

  mraid.setOrientationProperties = function(obj) {
    _orientationProperties = obj;
  };

  mraid.getOrientationProperties = function() {
    return _orientationProperties;
  };

    _state = 'ready';
    mraid.dispatchEvent(new CustomEvent('ready'));
    global.mraid = mraid;

  function _orientationChange(e) {
    //
    
  }

  // Utility functions
  var _cb;

  /*
  function _showCloseButton() {
    if (_cb == null) {
      _cb = document.createElement('button');
      _cb.id = '_mraid_close';
      _cb.textContent = 'x';
      _cb.style.cssText  = 'z-index:9999;left:0;top:0;position:absolute;'
      _cb.addEventListener('click',_hideCloseButton);
    }
    document.body.appendChild(_cb);
  }

  function _hideCloseButton(e) {
    document.body.removeChild(_cb);
    _stateChange('default');
  }*/

  var _cr;

  // Enable close region where the coordinate (x,y) is the top right corner of the ad
  function _enableCloseRegion(x, y, customClose) {
    _cr = document.createElement('div');
    _cr.id = "_mraid_close_region";
    _cr.style.cssText = 'z-index:10000;left:'+(x-50)+'px;top:'+y+'px;position:absolute;width:50px;height:50px';
    _cr.addEventListener('click',_disableCloseRegion);
    document.body.appendChild(_cr);

    if (customClose) {
      _cb = document.createElement('button');
      _cb.id = '_mraid_close';
      _cb.textContent = 'x';
      _cb.style.cssText  = 'margin-top:0;float:right;position:relative;'         
      _cr.appendChild(_cb);
    }
  }

  function _disableCloseRegion() {
    document.body.removeChild(_cr);
    _stateChange('default');  
  }

  global.addEventListener("orientationchange",_orientationChange);

}(window);
// mraid library code end

// start  new creative code

   
const adcontainer = document.getElementById("ad-container");
adcontainer.innerHTML = `<img id="ad-image" src="https://www.vdo.ai/sample/expandable-ads/sample-creative/gyroscope_mraid/img/1.png" alt="Ad Image">`  
  
  

function initializeMraid() {
  // console.log("mraid State:-",mraid.getState());
if (mraid.getState() === 'loading') {
  mraid.addEventListener("ready", function(){
    // console.log("mraid ready");
    displayAd();
  })
} else {
  // console.log("mraid ready");
  displayAd();
}
}

function displayAd() {
var adContainer = document.getElementById('ad-container');
var adImage = document.getElementById('ad-image');

// Check if permission is granted for DeviceOrientation API
if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
  DeviceOrientationEvent.requestPermission()
    .then(function (response) {
      if (response === 'granted') {
        console.log('DeviceOrientation permission granted');
        listenForOrientation(adContainer);
      } else {
        console.log('DeviceOrientation permission denied');
      }
    })
    .catch(function (error) {
      console.error('Error requesting DeviceOrientation permission:', error);
    });
} else {
  // If permission not required or already granted
  listenForOrientation(adContainer);
}
}

function listenForOrientation(adContainer) {
// Start listening for changes in device orientation
window.addEventListener('deviceorientation', function (event) {
  // Calculate rotation based on the device's gamma value
  var rotation;
  if (event.gamma !== null && event.gamma !== undefined) {
    // Standard gamma value for most devices
    rotation = event.gamma * 2;
  } else if (event.webkitCompassHeading !== undefined) {
    // For iOS devices
    rotation = event.webkitCompassHeading;
  }

   if (Math.abs(rotation) > 9) {
    var tiltPercentage = (Math.abs(rotation) / 90) * 100;

    adContainer.style.transform = 'rotate(' + rotation + 'deg) translateY(-' + tiltPercentage + '%)';
  } else {
    adContainer.style.transform = 'rotate(0) translateY(0)';
  }
}, false);
}

function init() {
var success = false;
// console.log("document:-",document.readyState);
if (document.readyState === 'complete') {
  if (typeof mraid !== 'undefined') {
    initializeMraid();
    success = true;
  }
}
else {
  window.addEventListener('load', initializeMraid);
  success = true;
}
return success;
}

init();