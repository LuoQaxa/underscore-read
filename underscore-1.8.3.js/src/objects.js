// Object Functions
// ----------------

// Keys in IE < 9 that won't be iterated by `for key in ...` and thus missed.
// Object.prototype.propertyIsEnumerable 是Object对象原型上的方法，除此之外比较熟悉的还有
// Object.prototype.hasOwnProperty以及下面被重写的toString方法 Object.prototype.toString
// mdn-propertyIsEnumerable：
//    This method can determine whether the specified property in an object can be enumerated by a for...in loop,
//    with the exception of properties inherited through the prototype chain. If the object does not have the specified property, 
//    this method returns false.
// mdn-for in:
//    A for...in loop only iterates over enumerable properties. Objects created from built–in constructors like Array and Object
//    have inherited non–enumerable properties from Object.prototype and String.prototype, such as String's indexOf() method or 
//    Object's toString() method. The loop will iterate over all enumerable properties of the object itself and those the object 
//    inherits from its constructor's prototype (properties closer to the object in the prototype chain override prototypes' properties).
// 原来由Object的内置构造函数创建的对象都会继承Object.prototype上的不可枚举属性，这对for in来说是不可迭代的，但是如果重写了这个属性，
// 这个属性按道理说是可枚举的。但是由于万恶的IE的for in兼容性，并且很傲娇的是for in的兼容性问题出现必须满足两个条件，分别是其一是在
// IE < 9 浏览器中，其二是被枚举的对象重写了某些键，比如 toString。
// 利用这点，就可以判定出是在 IE < 9 的环境中了
var hasEnumBug = !{toString: null}.propertyIsEnumerable('toString');
// 除了toString之外，还有以下属性在 IE < 9 是不能被枚举到的。
var nonEnumerableProps = ['valueOf', 'isPrototypeOf', 'toString',
                    'propertyIsEnumerable', 'hasOwnProperty', 'toLocaleString'];

function collectNonEnumProps(obj, keys) {
  var nonEnumIdx = nonEnumerableProps.length;
  var constructor = obj.constructor;
  // 获取obj的原型对象
  // 如果constructor是函数，说明constructor属性没有被重写，那么obj的原型就是
  // obj.constructor.prototype。否则它的原型就是Object.prototype 即objProto
  var proto = (_.isFunction(constructor) && constructor.prototype) || ObjProto;

  // Constructor is a special case.
  // 这里没怎么看懂
  var prop = 'constructor';
  if (_.has(obj, prop) && !_.contains(keys, prop)) keys.push(prop);

  while (nonEnumIdx--) {
    prop = nonEnumerableProps[nonEnumIdx];
    if (prop in obj && obj[prop] !== proto[prop] && !_.contains(keys, prop)) {
      keys.push(prop);
    }
  }
}

// Retrieve the names of an object's own properties.
// Delegates to **ECMAScript 5**'s native `Object.keys`
// 传人一个对象，返回的是对象可枚举属性的数组
_.keys = function(obj) {
  // 容错处理，如果传入的参数不是对象，则返回一个空的数组
  if (!_.isObject(obj)) return [];
  // mdn-Object.keys:
  //    The Object.keys() method returns an array of a given object's own enumerable properties, in the same order as that provided by a 
  //    for...in loop (the difference being that a for-in loop enumerates properties in the prototype chain as well).
  // 如果有ES5的原生Object.keys()方法就使用这个方法
  if (nativeKeys) return nativeKeys(obj);
  // 如果没有
  var keys = [];
  // 遍历obj的可枚举属性（包括了原型链上的属性）
  for (var key in obj)
   //   hasOwnProperty 
    if (_.has(obj, key)) keys.push(key);
  // Ahem, IE < 9.
  // ie9以下的for in遍历不到重写的一些方法
  // 加上重写的方法
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
};

// Retrieve all the property names of an object.
// 所有属性包括own enumable还要原型上的属性
_.allKeys = function(obj) {
  if (!_.isObject(obj)) return [];
  var keys = [];
  for (var key in obj) keys.push(key);
  // Ahem, IE < 9.
  if (hasEnumBug) collectNonEnumProps(obj, keys);
  return keys;
};

// Retrieve the values of an object's properties.
// obj的可枚举属性值组成的数组
_.values = function(obj) {
  var keys = _.keys(obj);
  var length = keys.length;
  var values = Array(length);
  for (var i = 0; i < length; i++) {
    values[i] = obj[keys[i]];
  }
  return values;
};

// Returns the results of applying the iteratee to each element of the object
// In contrast to _.map it returns an object
_.mapObject = function(obj, iteratee, context) {
  // 传入得iteratee是迭代函数，将这个迭代函数当做生成回调函数的内部函数cb(value, context, argCount)，在cb函数里面当传入得iteratee是函数，又会将iteratee作为参数传递给
  // 另外一个内部函数optimizeCb(func, context, argCount)，在optimizeCb中首先判断context参数是不是空的，判断方法是使用if (context === void 0)
  // 而不是if (context === undefined)，void 0的好处是什么呢？
  // 首先undefined不是reserved word，，只是全局对象的一个属性，在低版本浏览器中可以被重写
  // 然后void它是The void operator evaluates the given expression and then returns undefined.
  iteratee = cb(iteratee, context);
  var keys =  _.keys(obj),
        length = keys.length,
        results = {},
        currentKey;
    for (var index = 0; index < length; index++) {
      currentKey = keys[index];
      results[currentKey] = iteratee(obj[currentKey], currentKey, obj);
    }
    return results;
};

// Convert an object into a list of `[key, value]` pairs.
_.pairs = function(obj) {
  var keys = _.keys(obj);
  var length = keys.length;
  var pairs = Array(length);
  for (var i = 0; i < length; i++) {
    pairs[i] = [keys[i], obj[keys[i]]];
  }
  return pairs;
};

// Invert the keys and values of an object. The values must be serializable.
_.invert = function(obj) {
  var result = {};
  var keys = _.keys(obj);
  for (var i = 0, length = keys.length; i < length; i++) {
    result[obj[keys[i]]] = keys[i];
  }
  return result;
};

// Return a sorted list of the function names available on the object.
// Aliased as `methods`
_.functions = _.methods = function(obj) {
  var names = [];
  for (var key in obj) {
    if (_.isFunction(obj[key])) names.push(key);
  }
  return names.sort();
};

// Extend a given object with all the properties in passed-in object(s).
_.extend = createAssigner(_.allKeys);

// Assigns a given object with all the own properties in the passed-in object(s)
// (https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)
_.extendOwn = _.assign = createAssigner(_.keys);

// Returns the first key on an object that passes a predicate test
_.findKey = function(obj, predicate, context) {
  predicate = cb(predicate, context);
  var keys = _.keys(obj), key;
  for (var i = 0, length = keys.length; i < length; i++) {
    key = keys[i];
    if (predicate(obj[key], key, obj)) return key;
  }
};

// Return a copy of the object only containing the whitelisted properties.
_.pick = function(object, oiteratee, context) {
  var result = {}, obj = object, iteratee, keys;
  if (obj == null) return result;
  if (_.isFunction(oiteratee)) {
    keys = _.allKeys(obj);
    iteratee = optimizeCb(oiteratee, context);
  } else {
    keys = flatten(arguments, false, false, 1);
    iteratee = function(value, key, obj) { return key in obj; };
    obj = Object(obj);
  }
  for (var i = 0, length = keys.length; i < length; i++) {
    var key = keys[i];
    var value = obj[key];
    if (iteratee(value, key, obj)) result[key] = value;
  }
  return result;
};

 // Return a copy of the object without the blacklisted properties.
_.omit = function(obj, iteratee, context) {
  if (_.isFunction(iteratee)) {
    iteratee = _.negate(iteratee);
  } else {
    var keys = _.map(flatten(arguments, false, false, 1), String);
    iteratee = function(value, key) {
      return !_.contains(keys, key);
    };
  }
  return _.pick(obj, iteratee, context);
};

// Fill in a given object with default properties.
_.defaults = createAssigner(_.allKeys, true);

// Creates an object that inherits from the given prototype object.
// If additional properties are provided then they will be added to the
// created object.
_.create = function(prototype, props) {
  var result = baseCreate(prototype);
  if (props) _.extendOwn(result, props);
  return result;
};

// Create a (shallow-cloned) duplicate of an object.
_.clone = function(obj) {
  if (!_.isObject(obj)) return obj;
  return _.isArray(obj) ? obj.slice() : _.extend({}, obj);
};

// Invokes interceptor with the obj, and then returns obj.
// The primary purpose of this method is to "tap into" a method chain, in
// order to perform operations on intermediate results within the chain.
_.tap = function(obj, interceptor) {
  interceptor(obj);
  return obj;
};

// Returns whether an object has a given set of `key:value` pairs.
_.isMatch = function(object, attrs) {
  var keys = _.keys(attrs), length = keys.length;
  if (object == null) return !length;
  var obj = Object(object);
  for (var i = 0; i < length; i++) {
    var key = keys[i];
    if (attrs[key] !== obj[key] || !(key in obj)) return false;
  }
  return true;
};


// Internal recursive comparison function for `isEqual`.
var eq = function(a, b, aStack, bStack) {
  // Identical objects are equal. `0 === -0`, but they aren't identical.
  // See the [Harmony `egal` proposal](http://wiki.ecmascript.org/doku.php?id=harmony:egal).
  if (a === b) return a !== 0 || 1 / a === 1 / b;
  // A strict comparison is necessary because `null == undefined`.
  if (a == null || b == null) return a === b;
  // Unwrap any wrapped objects.
  if (a instanceof _) a = a._wrapped;
  if (b instanceof _) b = b._wrapped;
  // Compare `[[Class]]` names.
  var className = toString.call(a);
  if (className !== toString.call(b)) return false;
  switch (className) {
    // Strings, numbers, regular expressions, dates, and booleans are compared by value.
    case '[object RegExp]':
    // RegExps are coerced to strings for comparison (Note: '' + /a/i === '/a/i')
    case '[object String]':
      // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
      // equivalent to `new String("5")`.
      return '' + a === '' + b;
    case '[object Number]':
      // `NaN`s are equivalent, but non-reflexive.
      // Object(NaN) is equivalent to NaN
      if (+a !== +a) return +b !== +b;
      // An `egal` comparison is performed for other numeric values.
      return +a === 0 ? 1 / +a === 1 / b : +a === +b;
    case '[object Date]':
    case '[object Boolean]':
      // Coerce dates and booleans to numeric primitive values. Dates are compared by their
      // millisecond representations. Note that invalid dates with millisecond representations
      // of `NaN` are not equivalent.
      return +a === +b;
  }

  var areArrays = className === '[object Array]';
  if (!areArrays) {
    if (typeof a != 'object' || typeof b != 'object') return false;

    // Objects with different constructors are not equivalent, but `Object`s or `Array`s
    // from different frames are.
    var aCtor = a.constructor, bCtor = b.constructor;
    if (aCtor !== bCtor && !(_.isFunction(aCtor) && aCtor instanceof aCtor &&
                             _.isFunction(bCtor) && bCtor instanceof bCtor)
                        && ('constructor' in a && 'constructor' in b)) {
      return false;
    }
  }
  // Assume equality for cyclic structures. The algorithm for detecting cyclic
  // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

  // Initializing stack of traversed objects.
  // It's done here since we only need them for objects and arrays comparison.
  aStack = aStack || [];
  bStack = bStack || [];
  var length = aStack.length;
  while (length--) {
    // Linear search. Performance is inversely proportional to the number of
    // unique nested structures.
    if (aStack[length] === a) return bStack[length] === b;
  }

  // Add the first object to the stack of traversed objects.
  aStack.push(a);
  bStack.push(b);

  // Recursively compare objects and arrays.
  if (areArrays) {
    // Compare array lengths to determine if a deep comparison is necessary.
    length = a.length;
    if (length !== b.length) return false;
    // Deep compare the contents, ignoring non-numeric properties.
    while (length--) {
      if (!eq(a[length], b[length], aStack, bStack)) return false;
    }
  } else {
    // Deep compare objects.
    var keys = _.keys(a), key;
    length = keys.length;
    // Ensure that both objects contain the same number of properties before comparing deep equality.
    if (_.keys(b).length !== length) return false;
    while (length--) {
      // Deep compare each member
      key = keys[length];
      if (!(_.has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
    }
  }
  // Remove the first object from the stack of traversed objects.
  aStack.pop();
  bStack.pop();
  return true;
};

// Perform a deep comparison to check if two objects are equal.
_.isEqual = function(a, b) {
  return eq(a, b);
};

// Is a given array, string, or object empty?
// An "empty" object has no enumerable own-properties.
_.isEmpty = function(obj) {
  if (obj == null) return true;
  if (isArrayLike(obj) && (_.isArray(obj) || _.isString(obj) || _.isArguments(obj))) return obj.length === 0;
  return _.keys(obj).length === 0;
};

// Is a given value a DOM element?
_.isElement = function(obj) {
  return !!(obj && obj.nodeType === 1);
};

// Is a given value an array?
// Delegates to ECMA5's native Array.isArray
_.isArray = nativeIsArray || function(obj) {
  return toString.call(obj) === '[object Array]';
};

// Is a given variable an object?
_.isObject = function(obj) {
  var type = typeof obj;
  return type === 'function' || type === 'object' && !!obj;
};

// Add some isType methods: isArguments, isFunction, isString, isNumber, isDate, isRegExp, isError.
_.each(['Arguments', 'Function', 'String', 'Number', 'Date', 'RegExp', 'Error'], function(name) {
  _['is' + name] = function(obj) {
    return toString.call(obj) === '[object ' + name + ']';
  };
});

// Define a fallback version of the method in browsers (ahem, IE < 9), where
// there isn't any inspectable "Arguments" type.
if (!_.isArguments(arguments)) {
  _.isArguments = function(obj) {
    return _.has(obj, 'callee');
  };
}

// Optimize `isFunction` if appropriate. Work around some typeof bugs in old v8,
// IE 11 (#1621), and in Safari 8 (#1929).
if (typeof /./ != 'function' && typeof Int8Array != 'object') {
  _.isFunction = function(obj) {
    return typeof obj == 'function' || false;
  };
}

// Is a given object a finite number?
_.isFinite = function(obj) {
  return isFinite(obj) && !isNaN(parseFloat(obj));
};

// Is the given value `NaN`? (NaN is the only number which does not equal itself).
_.isNaN = function(obj) {
  return _.isNumber(obj) && obj !== +obj;
};

// Is a given value a boolean?
_.isBoolean = function(obj) {
  return obj === true || obj === false || toString.call(obj) === '[object Boolean]';
};

// Is a given value equal to null?
_.isNull = function(obj) {
  return obj === null;
};

// Is a given variable undefined?
_.isUndefined = function(obj) {
  return obj === void 0;
};

// Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).
_.has = function(obj, key) {
  return obj != null && hasOwnProperty.call(obj, key);
};