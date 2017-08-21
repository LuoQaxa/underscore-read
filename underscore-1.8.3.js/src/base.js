//     Underscore.js 1.8.3
//     http://underscorejs.org
//     (c) 2009-2015 Jeremy Ashkenas, DocumentCloud and Investigative Reporters & Editors
//     Underscore may be freely distributed under the MIT license.

// 自执行函数，并把全局对象传入，在浏览器环境下是window，在服务端是exports
(function() {

  // Baseline setup
  // --------------

  // Establish the root object, `window` in the browser, or `exports` on the server.
  var root = this;

  // Save the previous value of the `_` variable.

  var previousUnderscore = root._;

  // Save bytes in the minified (but not gzipped) version:
  var ArrayProto = Array.prototype, ObjProto = Object.prototype, FuncProto = Function.prototype;

  // Create quick reference variables for speed access to core prototypes.
  // 避免每次都去原型链上查找值，将核心方法全部缓存起来
  var
    push             = ArrayProto.push,
    slice            = ArrayProto.slice,
    toString         = ObjProto.toString,
    hasOwnProperty   = ObjProto.hasOwnProperty;

  // All **ECMAScript 5** native function implementations that we hope to use
  // are declared here.
  var
    nativeIsArray      = Array.isArray,
    nativeKeys         = Object.keys,
    nativeBind         = FuncProto.bind,
    nativeCreate       = Object.create;

  // Naked function reference for surrogate-prototype-swapping.
  // 不太明白这个空的匿名函数的作用，stackoverflow上的回答是：
  //    "Surrogate prototype swapping" (which I doubt is a real thing to begin with) is using an 
  //    object only to assign to its prototype. That variable is used only once:
  // 并且还举了一个栗子：
  // Naked function reference for surrogate-prototype-swapping.
  /*var Ctor = function(){};
    var nativeCreate = Object.create;
    // An internal function for creating a new object that inherits from another.
    var baseCreate = function(prototype) {
      if (!_.isObject(prototype)) return {};
      if (nativeCreate) return nativeCreate(prototype);
      Ctor.prototype = prototype;
      var result = new Ctor;
      Ctor.prototype = null;
      return result;
    };
    //It is used to make a cross-browser version of Object.create. You can't create a new 
    //instance of a prototype object directly, so you create a temporary object with your 
    //prototype object as its prototype and return a new instance of that.
  */
  var Ctor = function(){};

  // Create a safe reference to the Underscore object for use below.
  // 实现不用new关键字创建实例对象
  /*
    function Point(x,y){
      if(this instanceof Point) {
        this.x = x;
        this.y = y;
      }else {
        return new Point(x,y)
      }
    }
    可以通过判断this的值来判断是否有用new关键字，因为如果没有用new关键字，Point(x,y)相当于普通函数调用，this的指向window
    而如果new关键字创建的对象是继承Point.prototype的。
  */
  var _ = function(obj) {
    if (obj instanceof _) return obj;
    if (!(this instanceof _)) return new _(obj);
    this._wrapped = obj;
  };

  // Export the Underscore object for **Node.js**, with
  // backwards-compatibility for the old `require()` API. If we're in
  // the browser, add `_` as a global object.
  if (typeof exports !== 'undefined') {
    if (typeof module !== 'undefined' && module.exports) {
      exports = module.exports = _;
    }
    exports._ = _;
  } else {
    root._ = _;
  }

  // Current version.
  _.VERSION = '1.8.3';

  // Internal function that returns an efficient (for current engines) version
  // of the passed-in callback, to be repeatedly applied in other Underscore
  // functions.
  var optimizeCb = function(func, context, argCount) {
    if (context === void 0) return func;
    switch (argCount == null ? 3 : argCount) {
      case 1: return function(value) {
        return func.call(context, value);
      };
      case 2: return function(value, other) {
        return func.call(context, value, other);
      };
      case 3: return function(value, index, collection) {
        return func.call(context, value, index, collection);
      };
      case 4: return function(accumulator, value, index, collection) {
        return func.call(context, accumulator, value, index, collection);
      };
    }
    return function() {
      return func.apply(context, arguments);
    };
  };

  // A mostly-internal function to generate callbacks that can be applied
  // to each element in a collection, returning the desired result — either
  // identity, an arbitrary callback, a property matcher, or a property accessor.
  var cb = function(value, context, argCount) {
    if (value == null) return _.identity;
    if (_.isFunction(value)) return optimizeCb(value, context, argCount);
    if (_.isObject(value)) return _.matcher(value);
    return _.property(value);
  };
  _.iteratee = function(value, context) {
    return cb(value, context, Infinity);
  };


  // An internal function for creating assigner functions.
  var createAssigner = function(keysFunc, undefinedOnly) {
    // 返回的是一个函数
    // 经典闭包
    return function(obj) {
      // 如果参数<2，即只有一个参数或没有参数或者null，就返回object
      var length = arguments.length;
      if (length < 2 || obj == null) return obj;
      // 从第二个参数开始遍历
      for (var index = 1; index < length; index++) {
        // source对象，从第二个参数开始的对象
        var source = arguments[index],
            // createAssigner 函数传入的keysFunc
            // 通过keysFunc来提取对象的keys
            // keysFunc可以是_allKeys 或者 _keys
            keys = keysFunc(source),
            // 对象的属性个数
            l = keys.length;
        for (var i = 0; i < l; i++) {
          // 遍历keys
          var key = keys[i];
           // _.defaults = createAssigner(_.allKeys, true);
           // 传入的undefinedOnly 为true
           // 只有当obj[key] === void 0 时，即原对象没有key这个属性时才赋值
          if (!undefinedOnly || obj[key] === void 0) obj[key] = source[key];
        }
      }
      return obj;
    };
  };

  // An internal function for creating a new object that inherits from another.
  // _.create()用到了这个内部方法
  var baseCreate = function(prototype) {
    // 如果不是对象就返回空对象
    if (!_.isObject(prototype)) return {};
    // 如果有nativeCreate方法 Es5 Object.create()，就使用
    if (nativeCreate) return nativeCreate(prototype);
    // 匿名函数的原型是传入的需要继承的原型对象
    Ctor.prototype = prototype;
    // var Ctor = function(){};
    // new 关键字让result的原型是Ctor.prototype，这样就实现了继承
    var result = new Ctor;
    Ctor.prototype = null;
    return result;
  };


  var property = function(key) {
    // 返回的内部函数保留着对外层函数key的引用，这是一个闭包
    return function(obj) {
      // 如果obj是==null ，返回 undefined 否则返回obj[key]
      // 获取obj的key属性
      return obj == null ? void 0 : obj[key];
    };
  };

  // Helper for collection methods to determine whether a collection
  // should be iterated as an array or as an object
  // Related: http://people.mozilla.org/~jorendorff/es6-draft.html#sec-tolength
  // Avoids a very nasty iOS 8 JIT bug on ARM-64. #2094

  // 由于js中的所有数字都是64位浮点数。并且规定64位的组成是：
  /*
    第1位：符号位，0表示正数，1表示负数
    第2位-12位：指数部分
    第13-64位：小数部分（即有效数字）
    符号位决定了一个数的正负，指数部分决定了数值的大小，小数部分决定了数值的精度。
    IEEE 754 规定，有效数字第一位默认总是1，不保存在64位浮点数之中。也就是说，有效数字总是1.xx...xx的形式，
    其中xx..xx的部分保存在64位浮点数之中，最长可能为52位。因此，JavaScript 提供的有效数字最长为53个二进制位。
  */
  var MAX_ARRAY_INDEX = Math.pow(2, 53) - 1;

  var getLength = property('length');

  // 是否是类数组对象
  var isArrayLike = function(collection) {
    // 包括数组、arguments、HTML Collection 以及 NodeList 等等
    var length = getLength(collection);
    return typeof length == 'number' && length >= 0 && length <= MAX_ARRAY_INDEX;
  };

  
  // Collection Functions
  // Array Functions
  // Function (ahem) Functions
  // Object Functions
  // Utility Functions

  // Add a "chain" function. Start chaining a wrapped Underscore object.
  // 添加chain属性，使对象支持链式调用
  _.chain = function(obj) {
    var instance = _(obj);
    instance._chain = true;
    return instance;
  };

  // OOP
  // ---------------
  // If Underscore is called as a function, it returns a wrapped object that
  // can be used OO-style. This wrapper holds altered versions of all the
  // underscore functions. Wrapped objects may be chained.

  // Helper function to continue chaining intermediate results.
  var result = function(instance, obj) {
    return instance._chain ? _(obj).chain() : obj;
  };

  // Add your own custom functions to the Underscore object.
  _.mixin = function(obj) {
    _.each(_.functions(obj), function(name) {
      var func = _[name] = obj[name];
      _.prototype[name] = function() {
        var args = [this._wrapped];
        push.apply(args, arguments);
        return result(this, func.apply(_, args));
      };
    });
  };

  // Add all of the Underscore functions to the wrapper object.
  _.mixin(_);

  // Add all mutator Array functions to the wrapper.
  _.each(['pop', 'push', 'reverse', 'shift', 'sort', 'splice', 'unshift'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      var obj = this._wrapped;
      method.apply(obj, arguments);
      if ((name === 'shift' || name === 'splice') && obj.length === 0) delete obj[0];
      return result(this, obj);
    };
  });

  // Add all accessor Array functions to the wrapper.
  _.each(['concat', 'join', 'slice'], function(name) {
    var method = ArrayProto[name];
    _.prototype[name] = function() {
      return result(this, method.apply(this._wrapped, arguments));
    };
  });

  // Extracts the result from a wrapped and chained object.
  _.prototype.value = function() {
    return this._wrapped;
  };

  // Provide unwrapping proxy for some methods used in engine operations
  // such as arithmetic and JSON stringification.
  _.prototype.valueOf = _.prototype.toJSON = _.prototype.value;

  _.prototype.toString = function() {
    return '' + this._wrapped;
  };

  // AMD registration happens at the end for compatibility with AMD loaders
  // that may not enforce next-turn semantics on modules. Even though general
  // practice for AMD registration is to be anonymous, underscore registers
  // as a named module because, like jQuery, it is a base library that is
  // popular enough to be bundled in a third party lib, but not be part of
  // an AMD load request. Those cases could generate an error when an
  // anonymous define() is called outside of a loader request.
  if (typeof define === 'function' && define.amd) {
    define('underscore', [], function() {
      return _;
    });
  }
}.call(this));