if (!window.define) {
    // AMD define
    var ownSrc = document.currentScript.getAttribute('src');
    var srcDir = ownSrc.split('/');
    srcDir.pop();
    srcDir = srcDir.join('/');

    var modules = {};

    var loadAsScript = function loadAsScript(id) {
        return new Promise(resolve => {
            var script = document.createElement('script');
            script.src = srcDir + '/' + id + '.js';
            script.dataset.id = id;
            script.onload = resolve;
            document.head.appendChild(script);
        });
    };

    var modLoad = function modLoad(id) {
        if (modules[id]) return Promise.resolve(modules[id]);
        return loadAsScript(id).then(function() {
            if (!modules[id]) throw new Error('Failed to load ' + id + ': no module defined?');
            return modules[id];
        });
    };

    var modLoadAll = function modLoadAll(ids) {
        var result = [];
        for (const id of ids) {
            result.push(modLoad(id));
        }
        return Promise.all(result);
    };

    var require = function require(ids, cb) {
        modLoadAll(ids).then(mods => {
            if (mods.length === 1) cb(mods[0]);
            else cb(mods);
        });
    };

    window.define = function(reqs, run) {
        var id = document.currentScript.dataset.id;
        if (modules[id]) return;
        var exports = {};
        modules[id] = Promise.resolve().then(function() {
            var toLoad = [];
            for (var i = 0; i < reqs.length; i++) {
                var id = reqs[i];
                if (id === 'require') toLoad.push(Promise.resolve(require));
                else if (id === 'exports') toLoad.push(Promise.resolve(exports));
                else toLoad.push(modLoad(id));
            }
            return Promise.all(toLoad);
        }).then(function(loaded) {
            var result = run.apply(window, loaded);
            if (!exports.default) exports.default = result;
            return exports;
        });
    };
}
define(['require', 'exports'], function (require, exports) { 'use strict';

  function _classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function _unsupportedIterableToArray(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
  }

  function _arrayLikeToArray(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _createForOfIteratorHelper(o, allowArrayLike) {
    var it;

    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = o[Symbol.iterator]();
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function createCommonjsModule(fn, basedir, module) {
  	return module = {
  		path: basedir,
  		exports: {},
  		require: function (path, base) {
  			return commonjsRequire(path, (base === undefined || base === null) ? module.path : base);
  		}
  	}, fn(module, module.exports), module.exports;
  }

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
  }

  var check = function (it) {
    return it && it.Math == Math && it;
  };

  // https://github.com/zloirock/core-js/issues/86#issuecomment-115759028
  var global_1 =
    // eslint-disable-next-line no-undef
    check(typeof globalThis == 'object' && globalThis) ||
    check(typeof window == 'object' && window) ||
    check(typeof self == 'object' && self) ||
    check(typeof commonjsGlobal == 'object' && commonjsGlobal) ||
    // eslint-disable-next-line no-new-func
    Function('return this')();

  var fails = function (exec) {
    try {
      return !!exec();
    } catch (error) {
      return true;
    }
  };

  // Thank's IE8 for his funny defineProperty
  var descriptors = !fails(function () {
    return Object.defineProperty({}, 1, { get: function () { return 7; } })[1] != 7;
  });

  var isObject = function (it) {
    return typeof it === 'object' ? it !== null : typeof it === 'function';
  };

  var document$1 = global_1.document;
  // typeof document.createElement is 'object' in old IE
  var EXISTS = isObject(document$1) && isObject(document$1.createElement);

  var documentCreateElement = function (it) {
    return EXISTS ? document$1.createElement(it) : {};
  };

  // Thank's IE8 for his funny defineProperty
  var ie8DomDefine = !descriptors && !fails(function () {
    return Object.defineProperty(documentCreateElement('div'), 'a', {
      get: function () { return 7; }
    }).a != 7;
  });

  var anObject = function (it) {
    if (!isObject(it)) {
      throw TypeError(String(it) + ' is not an object');
    } return it;
  };

  // `ToPrimitive` abstract operation
  // https://tc39.github.io/ecma262/#sec-toprimitive
  // instead of the ES6 spec version, we didn't implement @@toPrimitive case
  // and the second argument - flag - preferred type is a string
  var toPrimitive = function (input, PREFERRED_STRING) {
    if (!isObject(input)) return input;
    var fn, val;
    if (PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    if (typeof (fn = input.valueOf) == 'function' && !isObject(val = fn.call(input))) return val;
    if (!PREFERRED_STRING && typeof (fn = input.toString) == 'function' && !isObject(val = fn.call(input))) return val;
    throw TypeError("Can't convert object to primitive value");
  };

  var nativeDefineProperty = Object.defineProperty;

  // `Object.defineProperty` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperty
  var f = descriptors ? nativeDefineProperty : function defineProperty(O, P, Attributes) {
    anObject(O);
    P = toPrimitive(P, true);
    anObject(Attributes);
    if (ie8DomDefine) try {
      return nativeDefineProperty(O, P, Attributes);
    } catch (error) { /* empty */ }
    if ('get' in Attributes || 'set' in Attributes) throw TypeError('Accessors not supported');
    if ('value' in Attributes) O[P] = Attributes.value;
    return O;
  };

  var objectDefineProperty = {
  	f: f
  };

  var createPropertyDescriptor = function (bitmap, value) {
    return {
      enumerable: !(bitmap & 1),
      configurable: !(bitmap & 2),
      writable: !(bitmap & 4),
      value: value
    };
  };

  var createNonEnumerableProperty = descriptors ? function (object, key, value) {
    return objectDefineProperty.f(object, key, createPropertyDescriptor(1, value));
  } : function (object, key, value) {
    object[key] = value;
    return object;
  };

  var setGlobal = function (key, value) {
    try {
      createNonEnumerableProperty(global_1, key, value);
    } catch (error) {
      global_1[key] = value;
    } return value;
  };

  var SHARED = '__core-js_shared__';
  var store = global_1[SHARED] || setGlobal(SHARED, {});

  var sharedStore = store;

  var shared = createCommonjsModule(function (module) {
  (module.exports = function (key, value) {
    return sharedStore[key] || (sharedStore[key] = value !== undefined ? value : {});
  })('versions', []).push({
    version: '3.6.5',
    mode:  'global',
    copyright: '© 2020 Denis Pushkarev (zloirock.ru)'
  });
  });

  var hasOwnProperty = {}.hasOwnProperty;

  var has = function (it, key) {
    return hasOwnProperty.call(it, key);
  };

  var id = 0;
  var postfix = Math.random();

  var uid = function (key) {
    return 'Symbol(' + String(key === undefined ? '' : key) + ')_' + (++id + postfix).toString(36);
  };

  var nativeSymbol = !!Object.getOwnPropertySymbols && !fails(function () {
    // Chrome 38 Symbol has incorrect toString conversion
    // eslint-disable-next-line no-undef
    return !String(Symbol());
  });

  var useSymbolAsUid = nativeSymbol
    // eslint-disable-next-line no-undef
    && !Symbol.sham
    // eslint-disable-next-line no-undef
    && typeof Symbol.iterator == 'symbol';

  var WellKnownSymbolsStore = shared('wks');
  var Symbol$1 = global_1.Symbol;
  var createWellKnownSymbol = useSymbolAsUid ? Symbol$1 : Symbol$1 && Symbol$1.withoutSetter || uid;

  var wellKnownSymbol = function (name) {
    if (!has(WellKnownSymbolsStore, name)) {
      if (nativeSymbol && has(Symbol$1, name)) WellKnownSymbolsStore[name] = Symbol$1[name];
      else WellKnownSymbolsStore[name] = createWellKnownSymbol('Symbol.' + name);
    } return WellKnownSymbolsStore[name];
  };

  var TO_STRING_TAG = wellKnownSymbol('toStringTag');
  var test = {};

  test[TO_STRING_TAG] = 'z';

  var toStringTagSupport = String(test) === '[object z]';

  var functionToString = Function.toString;

  // this helper broken in `3.4.1-3.4.4`, so we can't use `shared` helper
  if (typeof sharedStore.inspectSource != 'function') {
    sharedStore.inspectSource = function (it) {
      return functionToString.call(it);
    };
  }

  var inspectSource = sharedStore.inspectSource;

  var WeakMap$1 = global_1.WeakMap;

  var nativeWeakMap = typeof WeakMap$1 === 'function' && /native code/.test(inspectSource(WeakMap$1));

  var keys = shared('keys');

  var sharedKey = function (key) {
    return keys[key] || (keys[key] = uid(key));
  };

  var hiddenKeys = {};

  var WeakMap$2 = global_1.WeakMap;
  var set, get, has$1;

  var enforce = function (it) {
    return has$1(it) ? get(it) : set(it, {});
  };

  var getterFor = function (TYPE) {
    return function (it) {
      var state;
      if (!isObject(it) || (state = get(it)).type !== TYPE) {
        throw TypeError('Incompatible receiver, ' + TYPE + ' required');
      } return state;
    };
  };

  if (nativeWeakMap) {
    var store$1 = new WeakMap$2();
    var wmget = store$1.get;
    var wmhas = store$1.has;
    var wmset = store$1.set;
    set = function (it, metadata) {
      wmset.call(store$1, it, metadata);
      return metadata;
    };
    get = function (it) {
      return wmget.call(store$1, it) || {};
    };
    has$1 = function (it) {
      return wmhas.call(store$1, it);
    };
  } else {
    var STATE = sharedKey('state');
    hiddenKeys[STATE] = true;
    set = function (it, metadata) {
      createNonEnumerableProperty(it, STATE, metadata);
      return metadata;
    };
    get = function (it) {
      return has(it, STATE) ? it[STATE] : {};
    };
    has$1 = function (it) {
      return has(it, STATE);
    };
  }

  var internalState = {
    set: set,
    get: get,
    has: has$1,
    enforce: enforce,
    getterFor: getterFor
  };

  var redefine = createCommonjsModule(function (module) {
  var getInternalState = internalState.get;
  var enforceInternalState = internalState.enforce;
  var TEMPLATE = String(String).split('String');

  (module.exports = function (O, key, value, options) {
    var unsafe = options ? !!options.unsafe : false;
    var simple = options ? !!options.enumerable : false;
    var noTargetGet = options ? !!options.noTargetGet : false;
    if (typeof value == 'function') {
      if (typeof key == 'string' && !has(value, 'name')) createNonEnumerableProperty(value, 'name', key);
      enforceInternalState(value).source = TEMPLATE.join(typeof key == 'string' ? key : '');
    }
    if (O === global_1) {
      if (simple) O[key] = value;
      else setGlobal(key, value);
      return;
    } else if (!unsafe) {
      delete O[key];
    } else if (!noTargetGet && O[key]) {
      simple = true;
    }
    if (simple) O[key] = value;
    else createNonEnumerableProperty(O, key, value);
  // add fake Function#toString for correct work wrapped methods / constructors with methods like LoDash isNative
  })(Function.prototype, 'toString', function toString() {
    return typeof this == 'function' && getInternalState(this).source || inspectSource(this);
  });
  });

  var toString = {}.toString;

  var classofRaw = function (it) {
    return toString.call(it).slice(8, -1);
  };

  var TO_STRING_TAG$1 = wellKnownSymbol('toStringTag');
  // ES3 wrong here
  var CORRECT_ARGUMENTS = classofRaw(function () { return arguments; }()) == 'Arguments';

  // fallback for IE11 Script Access Denied error
  var tryGet = function (it, key) {
    try {
      return it[key];
    } catch (error) { /* empty */ }
  };

  // getting tag from ES6+ `Object.prototype.toString`
  var classof = toStringTagSupport ? classofRaw : function (it) {
    var O, tag, result;
    return it === undefined ? 'Undefined' : it === null ? 'Null'
      // @@toStringTag case
      : typeof (tag = tryGet(O = Object(it), TO_STRING_TAG$1)) == 'string' ? tag
      // builtinTag case
      : CORRECT_ARGUMENTS ? classofRaw(O)
      // ES3 arguments fallback
      : (result = classofRaw(O)) == 'Object' && typeof O.callee == 'function' ? 'Arguments' : result;
  };

  // `Object.prototype.toString` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  var objectToString = toStringTagSupport ? {}.toString : function toString() {
    return '[object ' + classof(this) + ']';
  };

  // `Object.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-object.prototype.tostring
  if (!toStringTagSupport) {
    redefine(Object.prototype, 'toString', objectToString, { unsafe: true });
  }

  var nativePropertyIsEnumerable = {}.propertyIsEnumerable;
  var getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // Nashorn ~ JDK8 bug
  var NASHORN_BUG = getOwnPropertyDescriptor && !nativePropertyIsEnumerable.call({ 1: 2 }, 1);

  // `Object.prototype.propertyIsEnumerable` method implementation
  // https://tc39.github.io/ecma262/#sec-object.prototype.propertyisenumerable
  var f$1 = NASHORN_BUG ? function propertyIsEnumerable(V) {
    var descriptor = getOwnPropertyDescriptor(this, V);
    return !!descriptor && descriptor.enumerable;
  } : nativePropertyIsEnumerable;

  var objectPropertyIsEnumerable = {
  	f: f$1
  };

  var split = ''.split;

  // fallback for non-array-like ES3 and non-enumerable old V8 strings
  var indexedObject = fails(function () {
    // throws an error in rhino, see https://github.com/mozilla/rhino/issues/346
    // eslint-disable-next-line no-prototype-builtins
    return !Object('z').propertyIsEnumerable(0);
  }) ? function (it) {
    return classofRaw(it) == 'String' ? split.call(it, '') : Object(it);
  } : Object;

  // `RequireObjectCoercible` abstract operation
  // https://tc39.github.io/ecma262/#sec-requireobjectcoercible
  var requireObjectCoercible = function (it) {
    if (it == undefined) throw TypeError("Can't call method on " + it);
    return it;
  };

  // toObject with fallback for non-array-like ES3 strings



  var toIndexedObject = function (it) {
    return indexedObject(requireObjectCoercible(it));
  };

  var nativeGetOwnPropertyDescriptor = Object.getOwnPropertyDescriptor;

  // `Object.getOwnPropertyDescriptor` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptor
  var f$2 = descriptors ? nativeGetOwnPropertyDescriptor : function getOwnPropertyDescriptor(O, P) {
    O = toIndexedObject(O);
    P = toPrimitive(P, true);
    if (ie8DomDefine) try {
      return nativeGetOwnPropertyDescriptor(O, P);
    } catch (error) { /* empty */ }
    if (has(O, P)) return createPropertyDescriptor(!objectPropertyIsEnumerable.f.call(O, P), O[P]);
  };

  var objectGetOwnPropertyDescriptor = {
  	f: f$2
  };

  var path = global_1;

  var aFunction = function (variable) {
    return typeof variable == 'function' ? variable : undefined;
  };

  var getBuiltIn = function (namespace, method) {
    return arguments.length < 2 ? aFunction(path[namespace]) || aFunction(global_1[namespace])
      : path[namespace] && path[namespace][method] || global_1[namespace] && global_1[namespace][method];
  };

  var ceil = Math.ceil;
  var floor = Math.floor;

  // `ToInteger` abstract operation
  // https://tc39.github.io/ecma262/#sec-tointeger
  var toInteger = function (argument) {
    return isNaN(argument = +argument) ? 0 : (argument > 0 ? floor : ceil)(argument);
  };

  var min = Math.min;

  // `ToLength` abstract operation
  // https://tc39.github.io/ecma262/#sec-tolength
  var toLength = function (argument) {
    return argument > 0 ? min(toInteger(argument), 0x1FFFFFFFFFFFFF) : 0; // 2 ** 53 - 1 == 9007199254740991
  };

  var max = Math.max;
  var min$1 = Math.min;

  // Helper for a popular repeating case of the spec:
  // Let integer be ? ToInteger(index).
  // If integer < 0, let result be max((length + integer), 0); else let result be min(integer, length).
  var toAbsoluteIndex = function (index, length) {
    var integer = toInteger(index);
    return integer < 0 ? max(integer + length, 0) : min$1(integer, length);
  };

  // `Array.prototype.{ indexOf, includes }` methods implementation
  var createMethod = function (IS_INCLUDES) {
    return function ($this, el, fromIndex) {
      var O = toIndexedObject($this);
      var length = toLength(O.length);
      var index = toAbsoluteIndex(fromIndex, length);
      var value;
      // Array#includes uses SameValueZero equality algorithm
      // eslint-disable-next-line no-self-compare
      if (IS_INCLUDES && el != el) while (length > index) {
        value = O[index++];
        // eslint-disable-next-line no-self-compare
        if (value != value) return true;
      // Array#indexOf ignores holes, Array#includes - not
      } else for (;length > index; index++) {
        if ((IS_INCLUDES || index in O) && O[index] === el) return IS_INCLUDES || index || 0;
      } return !IS_INCLUDES && -1;
    };
  };

  var arrayIncludes = {
    // `Array.prototype.includes` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.includes
    includes: createMethod(true),
    // `Array.prototype.indexOf` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.indexof
    indexOf: createMethod(false)
  };

  var indexOf = arrayIncludes.indexOf;


  var objectKeysInternal = function (object, names) {
    var O = toIndexedObject(object);
    var i = 0;
    var result = [];
    var key;
    for (key in O) !has(hiddenKeys, key) && has(O, key) && result.push(key);
    // Don't enum bug & hidden keys
    while (names.length > i) if (has(O, key = names[i++])) {
      ~indexOf(result, key) || result.push(key);
    }
    return result;
  };

  // IE8- don't enum bug keys
  var enumBugKeys = [
    'constructor',
    'hasOwnProperty',
    'isPrototypeOf',
    'propertyIsEnumerable',
    'toLocaleString',
    'toString',
    'valueOf'
  ];

  var hiddenKeys$1 = enumBugKeys.concat('length', 'prototype');

  // `Object.getOwnPropertyNames` method
  // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
  var f$3 = Object.getOwnPropertyNames || function getOwnPropertyNames(O) {
    return objectKeysInternal(O, hiddenKeys$1);
  };

  var objectGetOwnPropertyNames = {
  	f: f$3
  };

  var f$4 = Object.getOwnPropertySymbols;

  var objectGetOwnPropertySymbols = {
  	f: f$4
  };

  // all object keys, includes non-enumerable and symbols
  var ownKeys = getBuiltIn('Reflect', 'ownKeys') || function ownKeys(it) {
    var keys = objectGetOwnPropertyNames.f(anObject(it));
    var getOwnPropertySymbols = objectGetOwnPropertySymbols.f;
    return getOwnPropertySymbols ? keys.concat(getOwnPropertySymbols(it)) : keys;
  };

  var copyConstructorProperties = function (target, source) {
    var keys = ownKeys(source);
    var defineProperty = objectDefineProperty.f;
    var getOwnPropertyDescriptor = objectGetOwnPropertyDescriptor.f;
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      if (!has(target, key)) defineProperty(target, key, getOwnPropertyDescriptor(source, key));
    }
  };

  var replacement = /#|\.prototype\./;

  var isForced = function (feature, detection) {
    var value = data[normalize(feature)];
    return value == POLYFILL ? true
      : value == NATIVE ? false
      : typeof detection == 'function' ? fails(detection)
      : !!detection;
  };

  var normalize = isForced.normalize = function (string) {
    return String(string).replace(replacement, '.').toLowerCase();
  };

  var data = isForced.data = {};
  var NATIVE = isForced.NATIVE = 'N';
  var POLYFILL = isForced.POLYFILL = 'P';

  var isForced_1 = isForced;

  var getOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;






  /*
    options.target      - name of the target object
    options.global      - target is the global object
    options.stat        - export as static methods of target
    options.proto       - export as prototype methods of target
    options.real        - real prototype method for the `pure` version
    options.forced      - export even if the native feature is available
    options.bind        - bind methods to the target, required for the `pure` version
    options.wrap        - wrap constructors to preventing global pollution, required for the `pure` version
    options.unsafe      - use the simple assignment of property instead of delete + defineProperty
    options.sham        - add a flag to not completely full polyfills
    options.enumerable  - export as enumerable property
    options.noTargetGet - prevent calling a getter on target
  */
  var _export = function (options, source) {
    var TARGET = options.target;
    var GLOBAL = options.global;
    var STATIC = options.stat;
    var FORCED, target, key, targetProperty, sourceProperty, descriptor;
    if (GLOBAL) {
      target = global_1;
    } else if (STATIC) {
      target = global_1[TARGET] || setGlobal(TARGET, {});
    } else {
      target = (global_1[TARGET] || {}).prototype;
    }
    if (target) for (key in source) {
      sourceProperty = source[key];
      if (options.noTargetGet) {
        descriptor = getOwnPropertyDescriptor$1(target, key);
        targetProperty = descriptor && descriptor.value;
      } else targetProperty = target[key];
      FORCED = isForced_1(GLOBAL ? key : TARGET + (STATIC ? '.' : '#') + key, options.forced);
      // contained in target
      if (!FORCED && targetProperty !== undefined) {
        if (typeof sourceProperty === typeof targetProperty) continue;
        copyConstructorProperties(sourceProperty, targetProperty);
      }
      // add a flag to not completely full polyfills
      if (options.sham || (targetProperty && targetProperty.sham)) {
        createNonEnumerableProperty(sourceProperty, 'sham', true);
      }
      // extend global
      redefine(target, key, sourceProperty, options);
    }
  };

  var nativePromiseConstructor = global_1.Promise;

  var redefineAll = function (target, src, options) {
    for (var key in src) redefine(target, key, src[key], options);
    return target;
  };

  var defineProperty = objectDefineProperty.f;



  var TO_STRING_TAG$2 = wellKnownSymbol('toStringTag');

  var setToStringTag = function (it, TAG, STATIC) {
    if (it && !has(it = STATIC ? it : it.prototype, TO_STRING_TAG$2)) {
      defineProperty(it, TO_STRING_TAG$2, { configurable: true, value: TAG });
    }
  };

  var SPECIES = wellKnownSymbol('species');

  var setSpecies = function (CONSTRUCTOR_NAME) {
    var Constructor = getBuiltIn(CONSTRUCTOR_NAME);
    var defineProperty = objectDefineProperty.f;

    if (descriptors && Constructor && !Constructor[SPECIES]) {
      defineProperty(Constructor, SPECIES, {
        configurable: true,
        get: function () { return this; }
      });
    }
  };

  var aFunction$1 = function (it) {
    if (typeof it != 'function') {
      throw TypeError(String(it) + ' is not a function');
    } return it;
  };

  var anInstance = function (it, Constructor, name) {
    if (!(it instanceof Constructor)) {
      throw TypeError('Incorrect ' + (name ? name + ' ' : '') + 'invocation');
    } return it;
  };

  var iterators = {};

  var ITERATOR = wellKnownSymbol('iterator');
  var ArrayPrototype = Array.prototype;

  // check on default Array iterator
  var isArrayIteratorMethod = function (it) {
    return it !== undefined && (iterators.Array === it || ArrayPrototype[ITERATOR] === it);
  };

  // optional / simple context binding
  var functionBindContext = function (fn, that, length) {
    aFunction$1(fn);
    if (that === undefined) return fn;
    switch (length) {
      case 0: return function () {
        return fn.call(that);
      };
      case 1: return function (a) {
        return fn.call(that, a);
      };
      case 2: return function (a, b) {
        return fn.call(that, a, b);
      };
      case 3: return function (a, b, c) {
        return fn.call(that, a, b, c);
      };
    }
    return function (/* ...args */) {
      return fn.apply(that, arguments);
    };
  };

  var ITERATOR$1 = wellKnownSymbol('iterator');

  var getIteratorMethod = function (it) {
    if (it != undefined) return it[ITERATOR$1]
      || it['@@iterator']
      || iterators[classof(it)];
  };

  // call something on iterator step with safe closing on error
  var callWithSafeIterationClosing = function (iterator, fn, value, ENTRIES) {
    try {
      return ENTRIES ? fn(anObject(value)[0], value[1]) : fn(value);
    // 7.4.6 IteratorClose(iterator, completion)
    } catch (error) {
      var returnMethod = iterator['return'];
      if (returnMethod !== undefined) anObject(returnMethod.call(iterator));
      throw error;
    }
  };

  var iterate_1 = createCommonjsModule(function (module) {
  var Result = function (stopped, result) {
    this.stopped = stopped;
    this.result = result;
  };

  var iterate = module.exports = function (iterable, fn, that, AS_ENTRIES, IS_ITERATOR) {
    var boundFunction = functionBindContext(fn, that, AS_ENTRIES ? 2 : 1);
    var iterator, iterFn, index, length, result, next, step;

    if (IS_ITERATOR) {
      iterator = iterable;
    } else {
      iterFn = getIteratorMethod(iterable);
      if (typeof iterFn != 'function') throw TypeError('Target is not iterable');
      // optimisation for array iterators
      if (isArrayIteratorMethod(iterFn)) {
        for (index = 0, length = toLength(iterable.length); length > index; index++) {
          result = AS_ENTRIES
            ? boundFunction(anObject(step = iterable[index])[0], step[1])
            : boundFunction(iterable[index]);
          if (result && result instanceof Result) return result;
        } return new Result(false);
      }
      iterator = iterFn.call(iterable);
    }

    next = iterator.next;
    while (!(step = next.call(iterator)).done) {
      result = callWithSafeIterationClosing(iterator, boundFunction, step.value, AS_ENTRIES);
      if (typeof result == 'object' && result && result instanceof Result) return result;
    } return new Result(false);
  };

  iterate.stop = function (result) {
    return new Result(true, result);
  };
  });

  var ITERATOR$2 = wellKnownSymbol('iterator');
  var SAFE_CLOSING = false;

  try {
    var called = 0;
    var iteratorWithReturn = {
      next: function () {
        return { done: !!called++ };
      },
      'return': function () {
        SAFE_CLOSING = true;
      }
    };
    iteratorWithReturn[ITERATOR$2] = function () {
      return this;
    };
    // eslint-disable-next-line no-throw-literal
    Array.from(iteratorWithReturn, function () { throw 2; });
  } catch (error) { /* empty */ }

  var checkCorrectnessOfIteration = function (exec, SKIP_CLOSING) {
    if (!SKIP_CLOSING && !SAFE_CLOSING) return false;
    var ITERATION_SUPPORT = false;
    try {
      var object = {};
      object[ITERATOR$2] = function () {
        return {
          next: function () {
            return { done: ITERATION_SUPPORT = true };
          }
        };
      };
      exec(object);
    } catch (error) { /* empty */ }
    return ITERATION_SUPPORT;
  };

  var SPECIES$1 = wellKnownSymbol('species');

  // `SpeciesConstructor` abstract operation
  // https://tc39.github.io/ecma262/#sec-speciesconstructor
  var speciesConstructor = function (O, defaultConstructor) {
    var C = anObject(O).constructor;
    var S;
    return C === undefined || (S = anObject(C)[SPECIES$1]) == undefined ? defaultConstructor : aFunction$1(S);
  };

  var html = getBuiltIn('document', 'documentElement');

  var engineUserAgent = getBuiltIn('navigator', 'userAgent') || '';

  var engineIsIos = /(iphone|ipod|ipad).*applewebkit/i.test(engineUserAgent);

  var location = global_1.location;
  var set$1 = global_1.setImmediate;
  var clear = global_1.clearImmediate;
  var process = global_1.process;
  var MessageChannel = global_1.MessageChannel;
  var Dispatch = global_1.Dispatch;
  var counter = 0;
  var queue = {};
  var ONREADYSTATECHANGE = 'onreadystatechange';
  var defer, channel, port;

  var run = function (id) {
    // eslint-disable-next-line no-prototype-builtins
    if (queue.hasOwnProperty(id)) {
      var fn = queue[id];
      delete queue[id];
      fn();
    }
  };

  var runner = function (id) {
    return function () {
      run(id);
    };
  };

  var listener = function (event) {
    run(event.data);
  };

  var post = function (id) {
    // old engines have not location.origin
    global_1.postMessage(id + '', location.protocol + '//' + location.host);
  };

  // Node.js 0.9+ & IE10+ has setImmediate, otherwise:
  if (!set$1 || !clear) {
    set$1 = function setImmediate(fn) {
      var args = [];
      var i = 1;
      while (arguments.length > i) args.push(arguments[i++]);
      queue[++counter] = function () {
        // eslint-disable-next-line no-new-func
        (typeof fn == 'function' ? fn : Function(fn)).apply(undefined, args);
      };
      defer(counter);
      return counter;
    };
    clear = function clearImmediate(id) {
      delete queue[id];
    };
    // Node.js 0.8-
    if (classofRaw(process) == 'process') {
      defer = function (id) {
        process.nextTick(runner(id));
      };
    // Sphere (JS game engine) Dispatch API
    } else if (Dispatch && Dispatch.now) {
      defer = function (id) {
        Dispatch.now(runner(id));
      };
    // Browsers with MessageChannel, includes WebWorkers
    // except iOS - https://github.com/zloirock/core-js/issues/624
    } else if (MessageChannel && !engineIsIos) {
      channel = new MessageChannel();
      port = channel.port2;
      channel.port1.onmessage = listener;
      defer = functionBindContext(port.postMessage, port, 1);
    // Browsers with postMessage, skip WebWorkers
    // IE8 has postMessage, but it's sync & typeof its postMessage is 'object'
    } else if (
      global_1.addEventListener &&
      typeof postMessage == 'function' &&
      !global_1.importScripts &&
      !fails(post) &&
      location.protocol !== 'file:'
    ) {
      defer = post;
      global_1.addEventListener('message', listener, false);
    // IE8-
    } else if (ONREADYSTATECHANGE in documentCreateElement('script')) {
      defer = function (id) {
        html.appendChild(documentCreateElement('script'))[ONREADYSTATECHANGE] = function () {
          html.removeChild(this);
          run(id);
        };
      };
    // Rest old browsers
    } else {
      defer = function (id) {
        setTimeout(runner(id), 0);
      };
    }
  }

  var task = {
    set: set$1,
    clear: clear
  };

  var getOwnPropertyDescriptor$2 = objectGetOwnPropertyDescriptor.f;

  var macrotask = task.set;


  var MutationObserver = global_1.MutationObserver || global_1.WebKitMutationObserver;
  var process$1 = global_1.process;
  var Promise = global_1.Promise;
  var IS_NODE = classofRaw(process$1) == 'process';
  // Node.js 11 shows ExperimentalWarning on getting `queueMicrotask`
  var queueMicrotaskDescriptor = getOwnPropertyDescriptor$2(global_1, 'queueMicrotask');
  var queueMicrotask = queueMicrotaskDescriptor && queueMicrotaskDescriptor.value;

  var flush, head, last, notify, toggle, node, promise, then;

  // modern engines have queueMicrotask method
  if (!queueMicrotask) {
    flush = function () {
      var parent, fn;
      if (IS_NODE && (parent = process$1.domain)) parent.exit();
      while (head) {
        fn = head.fn;
        head = head.next;
        try {
          fn();
        } catch (error) {
          if (head) notify();
          else last = undefined;
          throw error;
        }
      } last = undefined;
      if (parent) parent.enter();
    };

    // Node.js
    if (IS_NODE) {
      notify = function () {
        process$1.nextTick(flush);
      };
    // browsers with MutationObserver, except iOS - https://github.com/zloirock/core-js/issues/339
    } else if (MutationObserver && !engineIsIos) {
      toggle = true;
      node = document.createTextNode('');
      new MutationObserver(flush).observe(node, { characterData: true });
      notify = function () {
        node.data = toggle = !toggle;
      };
    // environments with maybe non-completely correct, but existent Promise
    } else if (Promise && Promise.resolve) {
      // Promise.resolve without an argument throws an error in LG WebOS 2
      promise = Promise.resolve(undefined);
      then = promise.then;
      notify = function () {
        then.call(promise, flush);
      };
    // for other environments - macrotask based on:
    // - setImmediate
    // - MessageChannel
    // - window.postMessag
    // - onreadystatechange
    // - setTimeout
    } else {
      notify = function () {
        // strange IE + webpack dev server bug - use .call(global)
        macrotask.call(global_1, flush);
      };
    }
  }

  var microtask = queueMicrotask || function (fn) {
    var task = { fn: fn, next: undefined };
    if (last) last.next = task;
    if (!head) {
      head = task;
      notify();
    } last = task;
  };

  var PromiseCapability = function (C) {
    var resolve, reject;
    this.promise = new C(function ($$resolve, $$reject) {
      if (resolve !== undefined || reject !== undefined) throw TypeError('Bad Promise constructor');
      resolve = $$resolve;
      reject = $$reject;
    });
    this.resolve = aFunction$1(resolve);
    this.reject = aFunction$1(reject);
  };

  // 25.4.1.5 NewPromiseCapability(C)
  var f$5 = function (C) {
    return new PromiseCapability(C);
  };

  var newPromiseCapability = {
  	f: f$5
  };

  var promiseResolve = function (C, x) {
    anObject(C);
    if (isObject(x) && x.constructor === C) return x;
    var promiseCapability = newPromiseCapability.f(C);
    var resolve = promiseCapability.resolve;
    resolve(x);
    return promiseCapability.promise;
  };

  var hostReportErrors = function (a, b) {
    var console = global_1.console;
    if (console && console.error) {
      arguments.length === 1 ? console.error(a) : console.error(a, b);
    }
  };

  var perform = function (exec) {
    try {
      return { error: false, value: exec() };
    } catch (error) {
      return { error: true, value: error };
    }
  };

  var process$2 = global_1.process;
  var versions = process$2 && process$2.versions;
  var v8 = versions && versions.v8;
  var match, version;

  if (v8) {
    match = v8.split('.');
    version = match[0] + match[1];
  } else if (engineUserAgent) {
    match = engineUserAgent.match(/Edge\/(\d+)/);
    if (!match || match[1] >= 74) {
      match = engineUserAgent.match(/Chrome\/(\d+)/);
      if (match) version = match[1];
    }
  }

  var engineV8Version = version && +version;

  var task$1 = task.set;










  var SPECIES$2 = wellKnownSymbol('species');
  var PROMISE = 'Promise';
  var getInternalState = internalState.get;
  var setInternalState = internalState.set;
  var getInternalPromiseState = internalState.getterFor(PROMISE);
  var PromiseConstructor = nativePromiseConstructor;
  var TypeError$1 = global_1.TypeError;
  var document$2 = global_1.document;
  var process$3 = global_1.process;
  var $fetch = getBuiltIn('fetch');
  var newPromiseCapability$1 = newPromiseCapability.f;
  var newGenericPromiseCapability = newPromiseCapability$1;
  var IS_NODE$1 = classofRaw(process$3) == 'process';
  var DISPATCH_EVENT = !!(document$2 && document$2.createEvent && global_1.dispatchEvent);
  var UNHANDLED_REJECTION = 'unhandledrejection';
  var REJECTION_HANDLED = 'rejectionhandled';
  var PENDING = 0;
  var FULFILLED = 1;
  var REJECTED = 2;
  var HANDLED = 1;
  var UNHANDLED = 2;
  var Internal, OwnPromiseCapability, PromiseWrapper, nativeThen;

  var FORCED = isForced_1(PROMISE, function () {
    var GLOBAL_CORE_JS_PROMISE = inspectSource(PromiseConstructor) !== String(PromiseConstructor);
    if (!GLOBAL_CORE_JS_PROMISE) {
      // V8 6.6 (Node 10 and Chrome 66) have a bug with resolving custom thenables
      // https://bugs.chromium.org/p/chromium/issues/detail?id=830565
      // We can't detect it synchronously, so just check versions
      if (engineV8Version === 66) return true;
      // Unhandled rejections tracking support, NodeJS Promise without it fails @@species test
      if (!IS_NODE$1 && typeof PromiseRejectionEvent != 'function') return true;
    }
    // We can't use @@species feature detection in V8 since it causes
    // deoptimization and performance degradation
    // https://github.com/zloirock/core-js/issues/679
    if (engineV8Version >= 51 && /native code/.test(PromiseConstructor)) return false;
    // Detect correctness of subclassing with @@species support
    var promise = PromiseConstructor.resolve(1);
    var FakePromise = function (exec) {
      exec(function () { /* empty */ }, function () { /* empty */ });
    };
    var constructor = promise.constructor = {};
    constructor[SPECIES$2] = FakePromise;
    return !(promise.then(function () { /* empty */ }) instanceof FakePromise);
  });

  var INCORRECT_ITERATION = FORCED || !checkCorrectnessOfIteration(function (iterable) {
    PromiseConstructor.all(iterable)['catch'](function () { /* empty */ });
  });

  // helpers
  var isThenable = function (it) {
    var then;
    return isObject(it) && typeof (then = it.then) == 'function' ? then : false;
  };

  var notify$1 = function (promise, state, isReject) {
    if (state.notified) return;
    state.notified = true;
    var chain = state.reactions;
    microtask(function () {
      var value = state.value;
      var ok = state.state == FULFILLED;
      var index = 0;
      // variable length - can't use forEach
      while (chain.length > index) {
        var reaction = chain[index++];
        var handler = ok ? reaction.ok : reaction.fail;
        var resolve = reaction.resolve;
        var reject = reaction.reject;
        var domain = reaction.domain;
        var result, then, exited;
        try {
          if (handler) {
            if (!ok) {
              if (state.rejection === UNHANDLED) onHandleUnhandled(promise, state);
              state.rejection = HANDLED;
            }
            if (handler === true) result = value;
            else {
              if (domain) domain.enter();
              result = handler(value); // can throw
              if (domain) {
                domain.exit();
                exited = true;
              }
            }
            if (result === reaction.promise) {
              reject(TypeError$1('Promise-chain cycle'));
            } else if (then = isThenable(result)) {
              then.call(result, resolve, reject);
            } else resolve(result);
          } else reject(value);
        } catch (error) {
          if (domain && !exited) domain.exit();
          reject(error);
        }
      }
      state.reactions = [];
      state.notified = false;
      if (isReject && !state.rejection) onUnhandled(promise, state);
    });
  };

  var dispatchEvent = function (name, promise, reason) {
    var event, handler;
    if (DISPATCH_EVENT) {
      event = document$2.createEvent('Event');
      event.promise = promise;
      event.reason = reason;
      event.initEvent(name, false, true);
      global_1.dispatchEvent(event);
    } else event = { promise: promise, reason: reason };
    if (handler = global_1['on' + name]) handler(event);
    else if (name === UNHANDLED_REJECTION) hostReportErrors('Unhandled promise rejection', reason);
  };

  var onUnhandled = function (promise, state) {
    task$1.call(global_1, function () {
      var value = state.value;
      var IS_UNHANDLED = isUnhandled(state);
      var result;
      if (IS_UNHANDLED) {
        result = perform(function () {
          if (IS_NODE$1) {
            process$3.emit('unhandledRejection', value, promise);
          } else dispatchEvent(UNHANDLED_REJECTION, promise, value);
        });
        // Browsers should not trigger `rejectionHandled` event if it was handled here, NodeJS - should
        state.rejection = IS_NODE$1 || isUnhandled(state) ? UNHANDLED : HANDLED;
        if (result.error) throw result.value;
      }
    });
  };

  var isUnhandled = function (state) {
    return state.rejection !== HANDLED && !state.parent;
  };

  var onHandleUnhandled = function (promise, state) {
    task$1.call(global_1, function () {
      if (IS_NODE$1) {
        process$3.emit('rejectionHandled', promise);
      } else dispatchEvent(REJECTION_HANDLED, promise, state.value);
    });
  };

  var bind = function (fn, promise, state, unwrap) {
    return function (value) {
      fn(promise, state, value, unwrap);
    };
  };

  var internalReject = function (promise, state, value, unwrap) {
    if (state.done) return;
    state.done = true;
    if (unwrap) state = unwrap;
    state.value = value;
    state.state = REJECTED;
    notify$1(promise, state, true);
  };

  var internalResolve = function (promise, state, value, unwrap) {
    if (state.done) return;
    state.done = true;
    if (unwrap) state = unwrap;
    try {
      if (promise === value) throw TypeError$1("Promise can't be resolved itself");
      var then = isThenable(value);
      if (then) {
        microtask(function () {
          var wrapper = { done: false };
          try {
            then.call(value,
              bind(internalResolve, promise, wrapper, state),
              bind(internalReject, promise, wrapper, state)
            );
          } catch (error) {
            internalReject(promise, wrapper, error, state);
          }
        });
      } else {
        state.value = value;
        state.state = FULFILLED;
        notify$1(promise, state, false);
      }
    } catch (error) {
      internalReject(promise, { done: false }, error, state);
    }
  };

  // constructor polyfill
  if (FORCED) {
    // 25.4.3.1 Promise(executor)
    PromiseConstructor = function Promise(executor) {
      anInstance(this, PromiseConstructor, PROMISE);
      aFunction$1(executor);
      Internal.call(this);
      var state = getInternalState(this);
      try {
        executor(bind(internalResolve, this, state), bind(internalReject, this, state));
      } catch (error) {
        internalReject(this, state, error);
      }
    };
    // eslint-disable-next-line no-unused-vars
    Internal = function Promise(executor) {
      setInternalState(this, {
        type: PROMISE,
        done: false,
        notified: false,
        parent: false,
        reactions: [],
        rejection: false,
        state: PENDING,
        value: undefined
      });
    };
    Internal.prototype = redefineAll(PromiseConstructor.prototype, {
      // `Promise.prototype.then` method
      // https://tc39.github.io/ecma262/#sec-promise.prototype.then
      then: function then(onFulfilled, onRejected) {
        var state = getInternalPromiseState(this);
        var reaction = newPromiseCapability$1(speciesConstructor(this, PromiseConstructor));
        reaction.ok = typeof onFulfilled == 'function' ? onFulfilled : true;
        reaction.fail = typeof onRejected == 'function' && onRejected;
        reaction.domain = IS_NODE$1 ? process$3.domain : undefined;
        state.parent = true;
        state.reactions.push(reaction);
        if (state.state != PENDING) notify$1(this, state, false);
        return reaction.promise;
      },
      // `Promise.prototype.catch` method
      // https://tc39.github.io/ecma262/#sec-promise.prototype.catch
      'catch': function (onRejected) {
        return this.then(undefined, onRejected);
      }
    });
    OwnPromiseCapability = function () {
      var promise = new Internal();
      var state = getInternalState(promise);
      this.promise = promise;
      this.resolve = bind(internalResolve, promise, state);
      this.reject = bind(internalReject, promise, state);
    };
    newPromiseCapability.f = newPromiseCapability$1 = function (C) {
      return C === PromiseConstructor || C === PromiseWrapper
        ? new OwnPromiseCapability(C)
        : newGenericPromiseCapability(C);
    };

    if ( typeof nativePromiseConstructor == 'function') {
      nativeThen = nativePromiseConstructor.prototype.then;

      // wrap native Promise#then for native async functions
      redefine(nativePromiseConstructor.prototype, 'then', function then(onFulfilled, onRejected) {
        var that = this;
        return new PromiseConstructor(function (resolve, reject) {
          nativeThen.call(that, resolve, reject);
        }).then(onFulfilled, onRejected);
      // https://github.com/zloirock/core-js/issues/640
      }, { unsafe: true });

      // wrap fetch result
      if (typeof $fetch == 'function') _export({ global: true, enumerable: true, forced: true }, {
        // eslint-disable-next-line no-unused-vars
        fetch: function fetch(input /* , init */) {
          return promiseResolve(PromiseConstructor, $fetch.apply(global_1, arguments));
        }
      });
    }
  }

  _export({ global: true, wrap: true, forced: FORCED }, {
    Promise: PromiseConstructor
  });

  setToStringTag(PromiseConstructor, PROMISE, false);
  setSpecies(PROMISE);

  PromiseWrapper = getBuiltIn(PROMISE);

  // statics
  _export({ target: PROMISE, stat: true, forced: FORCED }, {
    // `Promise.reject` method
    // https://tc39.github.io/ecma262/#sec-promise.reject
    reject: function reject(r) {
      var capability = newPromiseCapability$1(this);
      capability.reject.call(undefined, r);
      return capability.promise;
    }
  });

  _export({ target: PROMISE, stat: true, forced:  FORCED }, {
    // `Promise.resolve` method
    // https://tc39.github.io/ecma262/#sec-promise.resolve
    resolve: function resolve(x) {
      return promiseResolve( this, x);
    }
  });

  _export({ target: PROMISE, stat: true, forced: INCORRECT_ITERATION }, {
    // `Promise.all` method
    // https://tc39.github.io/ecma262/#sec-promise.all
    all: function all(iterable) {
      var C = this;
      var capability = newPromiseCapability$1(C);
      var resolve = capability.resolve;
      var reject = capability.reject;
      var result = perform(function () {
        var $promiseResolve = aFunction$1(C.resolve);
        var values = [];
        var counter = 0;
        var remaining = 1;
        iterate_1(iterable, function (promise) {
          var index = counter++;
          var alreadyCalled = false;
          values.push(undefined);
          remaining++;
          $promiseResolve.call(C, promise).then(function (value) {
            if (alreadyCalled) return;
            alreadyCalled = true;
            values[index] = value;
            --remaining || resolve(values);
          }, reject);
        });
        --remaining || resolve(values);
      });
      if (result.error) reject(result.value);
      return capability.promise;
    },
    // `Promise.race` method
    // https://tc39.github.io/ecma262/#sec-promise.race
    race: function race(iterable) {
      var C = this;
      var capability = newPromiseCapability$1(C);
      var reject = capability.reject;
      var result = perform(function () {
        var $promiseResolve = aFunction$1(C.resolve);
        iterate_1(iterable, function (promise) {
          $promiseResolve.call(C, promise).then(capability.resolve, reject);
        });
      });
      if (result.error) reject(result.value);
      return capability.promise;
    }
  });

  // `IsArray` abstract operation
  // https://tc39.github.io/ecma262/#sec-isarray
  var isArray = Array.isArray || function isArray(arg) {
    return classofRaw(arg) == 'Array';
  };

  // `ToObject` abstract operation
  // https://tc39.github.io/ecma262/#sec-toobject
  var toObject = function (argument) {
    return Object(requireObjectCoercible(argument));
  };

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  var objectKeys = Object.keys || function keys(O) {
    return objectKeysInternal(O, enumBugKeys);
  };

  // `Object.defineProperties` method
  // https://tc39.github.io/ecma262/#sec-object.defineproperties
  var objectDefineProperties = descriptors ? Object.defineProperties : function defineProperties(O, Properties) {
    anObject(O);
    var keys = objectKeys(Properties);
    var length = keys.length;
    var index = 0;
    var key;
    while (length > index) objectDefineProperty.f(O, key = keys[index++], Properties[key]);
    return O;
  };

  var GT = '>';
  var LT = '<';
  var PROTOTYPE = 'prototype';
  var SCRIPT = 'script';
  var IE_PROTO = sharedKey('IE_PROTO');

  var EmptyConstructor = function () { /* empty */ };

  var scriptTag = function (content) {
    return LT + SCRIPT + GT + content + LT + '/' + SCRIPT + GT;
  };

  // Create object with fake `null` prototype: use ActiveX Object with cleared prototype
  var NullProtoObjectViaActiveX = function (activeXDocument) {
    activeXDocument.write(scriptTag(''));
    activeXDocument.close();
    var temp = activeXDocument.parentWindow.Object;
    activeXDocument = null; // avoid memory leak
    return temp;
  };

  // Create object with fake `null` prototype: use iframe Object with cleared prototype
  var NullProtoObjectViaIFrame = function () {
    // Thrash, waste and sodomy: IE GC bug
    var iframe = documentCreateElement('iframe');
    var JS = 'java' + SCRIPT + ':';
    var iframeDocument;
    iframe.style.display = 'none';
    html.appendChild(iframe);
    // https://github.com/zloirock/core-js/issues/475
    iframe.src = String(JS);
    iframeDocument = iframe.contentWindow.document;
    iframeDocument.open();
    iframeDocument.write(scriptTag('document.F=Object'));
    iframeDocument.close();
    return iframeDocument.F;
  };

  // Check for document.domain and active x support
  // No need to use active x approach when document.domain is not set
  // see https://github.com/es-shims/es5-shim/issues/150
  // variation of https://github.com/kitcambridge/es5-shim/commit/4f738ac066346
  // avoid IE GC bug
  var activeXDocument;
  var NullProtoObject = function () {
    try {
      /* global ActiveXObject */
      activeXDocument = document.domain && new ActiveXObject('htmlfile');
    } catch (error) { /* ignore */ }
    NullProtoObject = activeXDocument ? NullProtoObjectViaActiveX(activeXDocument) : NullProtoObjectViaIFrame();
    var length = enumBugKeys.length;
    while (length--) delete NullProtoObject[PROTOTYPE][enumBugKeys[length]];
    return NullProtoObject();
  };

  hiddenKeys[IE_PROTO] = true;

  // `Object.create` method
  // https://tc39.github.io/ecma262/#sec-object.create
  var objectCreate = Object.create || function create(O, Properties) {
    var result;
    if (O !== null) {
      EmptyConstructor[PROTOTYPE] = anObject(O);
      result = new EmptyConstructor();
      EmptyConstructor[PROTOTYPE] = null;
      // add "__proto__" for Object.getPrototypeOf polyfill
      result[IE_PROTO] = O;
    } else result = NullProtoObject();
    return Properties === undefined ? result : objectDefineProperties(result, Properties);
  };

  var nativeGetOwnPropertyNames = objectGetOwnPropertyNames.f;

  var toString$1 = {}.toString;

  var windowNames = typeof window == 'object' && window && Object.getOwnPropertyNames
    ? Object.getOwnPropertyNames(window) : [];

  var getWindowNames = function (it) {
    try {
      return nativeGetOwnPropertyNames(it);
    } catch (error) {
      return windowNames.slice();
    }
  };

  // fallback for IE11 buggy Object.getOwnPropertyNames with iframe and window
  var f$6 = function getOwnPropertyNames(it) {
    return windowNames && toString$1.call(it) == '[object Window]'
      ? getWindowNames(it)
      : nativeGetOwnPropertyNames(toIndexedObject(it));
  };

  var objectGetOwnPropertyNamesExternal = {
  	f: f$6
  };

  var f$7 = wellKnownSymbol;

  var wellKnownSymbolWrapped = {
  	f: f$7
  };

  var defineProperty$1 = objectDefineProperty.f;

  var defineWellKnownSymbol = function (NAME) {
    var Symbol = path.Symbol || (path.Symbol = {});
    if (!has(Symbol, NAME)) defineProperty$1(Symbol, NAME, {
      value: wellKnownSymbolWrapped.f(NAME)
    });
  };

  var SPECIES$3 = wellKnownSymbol('species');

  // `ArraySpeciesCreate` abstract operation
  // https://tc39.github.io/ecma262/#sec-arrayspeciescreate
  var arraySpeciesCreate = function (originalArray, length) {
    var C;
    if (isArray(originalArray)) {
      C = originalArray.constructor;
      // cross-realm fallback
      if (typeof C == 'function' && (C === Array || isArray(C.prototype))) C = undefined;
      else if (isObject(C)) {
        C = C[SPECIES$3];
        if (C === null) C = undefined;
      }
    } return new (C === undefined ? Array : C)(length === 0 ? 0 : length);
  };

  var push = [].push;

  // `Array.prototype.{ forEach, map, filter, some, every, find, findIndex }` methods implementation
  var createMethod$1 = function (TYPE) {
    var IS_MAP = TYPE == 1;
    var IS_FILTER = TYPE == 2;
    var IS_SOME = TYPE == 3;
    var IS_EVERY = TYPE == 4;
    var IS_FIND_INDEX = TYPE == 6;
    var NO_HOLES = TYPE == 5 || IS_FIND_INDEX;
    return function ($this, callbackfn, that, specificCreate) {
      var O = toObject($this);
      var self = indexedObject(O);
      var boundFunction = functionBindContext(callbackfn, that, 3);
      var length = toLength(self.length);
      var index = 0;
      var create = specificCreate || arraySpeciesCreate;
      var target = IS_MAP ? create($this, length) : IS_FILTER ? create($this, 0) : undefined;
      var value, result;
      for (;length > index; index++) if (NO_HOLES || index in self) {
        value = self[index];
        result = boundFunction(value, index, O);
        if (TYPE) {
          if (IS_MAP) target[index] = result; // map
          else if (result) switch (TYPE) {
            case 3: return true;              // some
            case 5: return value;             // find
            case 6: return index;             // findIndex
            case 2: push.call(target, value); // filter
          } else if (IS_EVERY) return false;  // every
        }
      }
      return IS_FIND_INDEX ? -1 : IS_SOME || IS_EVERY ? IS_EVERY : target;
    };
  };

  var arrayIteration = {
    // `Array.prototype.forEach` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.foreach
    forEach: createMethod$1(0),
    // `Array.prototype.map` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.map
    map: createMethod$1(1),
    // `Array.prototype.filter` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.filter
    filter: createMethod$1(2),
    // `Array.prototype.some` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.some
    some: createMethod$1(3),
    // `Array.prototype.every` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.every
    every: createMethod$1(4),
    // `Array.prototype.find` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.find
    find: createMethod$1(5),
    // `Array.prototype.findIndex` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.findIndex
    findIndex: createMethod$1(6)
  };

  var $forEach = arrayIteration.forEach;

  var HIDDEN = sharedKey('hidden');
  var SYMBOL = 'Symbol';
  var PROTOTYPE$1 = 'prototype';
  var TO_PRIMITIVE = wellKnownSymbol('toPrimitive');
  var setInternalState$1 = internalState.set;
  var getInternalState$1 = internalState.getterFor(SYMBOL);
  var ObjectPrototype = Object[PROTOTYPE$1];
  var $Symbol = global_1.Symbol;
  var $stringify = getBuiltIn('JSON', 'stringify');
  var nativeGetOwnPropertyDescriptor$1 = objectGetOwnPropertyDescriptor.f;
  var nativeDefineProperty$1 = objectDefineProperty.f;
  var nativeGetOwnPropertyNames$1 = objectGetOwnPropertyNamesExternal.f;
  var nativePropertyIsEnumerable$1 = objectPropertyIsEnumerable.f;
  var AllSymbols = shared('symbols');
  var ObjectPrototypeSymbols = shared('op-symbols');
  var StringToSymbolRegistry = shared('string-to-symbol-registry');
  var SymbolToStringRegistry = shared('symbol-to-string-registry');
  var WellKnownSymbolsStore$1 = shared('wks');
  var QObject = global_1.QObject;
  // Don't use setters in Qt Script, https://github.com/zloirock/core-js/issues/173
  var USE_SETTER = !QObject || !QObject[PROTOTYPE$1] || !QObject[PROTOTYPE$1].findChild;

  // fallback for old Android, https://code.google.com/p/v8/issues/detail?id=687
  var setSymbolDescriptor = descriptors && fails(function () {
    return objectCreate(nativeDefineProperty$1({}, 'a', {
      get: function () { return nativeDefineProperty$1(this, 'a', { value: 7 }).a; }
    })).a != 7;
  }) ? function (O, P, Attributes) {
    var ObjectPrototypeDescriptor = nativeGetOwnPropertyDescriptor$1(ObjectPrototype, P);
    if (ObjectPrototypeDescriptor) delete ObjectPrototype[P];
    nativeDefineProperty$1(O, P, Attributes);
    if (ObjectPrototypeDescriptor && O !== ObjectPrototype) {
      nativeDefineProperty$1(ObjectPrototype, P, ObjectPrototypeDescriptor);
    }
  } : nativeDefineProperty$1;

  var wrap = function (tag, description) {
    var symbol = AllSymbols[tag] = objectCreate($Symbol[PROTOTYPE$1]);
    setInternalState$1(symbol, {
      type: SYMBOL,
      tag: tag,
      description: description
    });
    if (!descriptors) symbol.description = description;
    return symbol;
  };

  var isSymbol = useSymbolAsUid ? function (it) {
    return typeof it == 'symbol';
  } : function (it) {
    return Object(it) instanceof $Symbol;
  };

  var $defineProperty = function defineProperty(O, P, Attributes) {
    if (O === ObjectPrototype) $defineProperty(ObjectPrototypeSymbols, P, Attributes);
    anObject(O);
    var key = toPrimitive(P, true);
    anObject(Attributes);
    if (has(AllSymbols, key)) {
      if (!Attributes.enumerable) {
        if (!has(O, HIDDEN)) nativeDefineProperty$1(O, HIDDEN, createPropertyDescriptor(1, {}));
        O[HIDDEN][key] = true;
      } else {
        if (has(O, HIDDEN) && O[HIDDEN][key]) O[HIDDEN][key] = false;
        Attributes = objectCreate(Attributes, { enumerable: createPropertyDescriptor(0, false) });
      } return setSymbolDescriptor(O, key, Attributes);
    } return nativeDefineProperty$1(O, key, Attributes);
  };

  var $defineProperties = function defineProperties(O, Properties) {
    anObject(O);
    var properties = toIndexedObject(Properties);
    var keys = objectKeys(properties).concat($getOwnPropertySymbols(properties));
    $forEach(keys, function (key) {
      if (!descriptors || $propertyIsEnumerable.call(properties, key)) $defineProperty(O, key, properties[key]);
    });
    return O;
  };

  var $create = function create(O, Properties) {
    return Properties === undefined ? objectCreate(O) : $defineProperties(objectCreate(O), Properties);
  };

  var $propertyIsEnumerable = function propertyIsEnumerable(V) {
    var P = toPrimitive(V, true);
    var enumerable = nativePropertyIsEnumerable$1.call(this, P);
    if (this === ObjectPrototype && has(AllSymbols, P) && !has(ObjectPrototypeSymbols, P)) return false;
    return enumerable || !has(this, P) || !has(AllSymbols, P) || has(this, HIDDEN) && this[HIDDEN][P] ? enumerable : true;
  };

  var $getOwnPropertyDescriptor = function getOwnPropertyDescriptor(O, P) {
    var it = toIndexedObject(O);
    var key = toPrimitive(P, true);
    if (it === ObjectPrototype && has(AllSymbols, key) && !has(ObjectPrototypeSymbols, key)) return;
    var descriptor = nativeGetOwnPropertyDescriptor$1(it, key);
    if (descriptor && has(AllSymbols, key) && !(has(it, HIDDEN) && it[HIDDEN][key])) {
      descriptor.enumerable = true;
    }
    return descriptor;
  };

  var $getOwnPropertyNames = function getOwnPropertyNames(O) {
    var names = nativeGetOwnPropertyNames$1(toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (!has(AllSymbols, key) && !has(hiddenKeys, key)) result.push(key);
    });
    return result;
  };

  var $getOwnPropertySymbols = function getOwnPropertySymbols(O) {
    var IS_OBJECT_PROTOTYPE = O === ObjectPrototype;
    var names = nativeGetOwnPropertyNames$1(IS_OBJECT_PROTOTYPE ? ObjectPrototypeSymbols : toIndexedObject(O));
    var result = [];
    $forEach(names, function (key) {
      if (has(AllSymbols, key) && (!IS_OBJECT_PROTOTYPE || has(ObjectPrototype, key))) {
        result.push(AllSymbols[key]);
      }
    });
    return result;
  };

  // `Symbol` constructor
  // https://tc39.github.io/ecma262/#sec-symbol-constructor
  if (!nativeSymbol) {
    $Symbol = function Symbol() {
      if (this instanceof $Symbol) throw TypeError('Symbol is not a constructor');
      var description = !arguments.length || arguments[0] === undefined ? undefined : String(arguments[0]);
      var tag = uid(description);
      var setter = function (value) {
        if (this === ObjectPrototype) setter.call(ObjectPrototypeSymbols, value);
        if (has(this, HIDDEN) && has(this[HIDDEN], tag)) this[HIDDEN][tag] = false;
        setSymbolDescriptor(this, tag, createPropertyDescriptor(1, value));
      };
      if (descriptors && USE_SETTER) setSymbolDescriptor(ObjectPrototype, tag, { configurable: true, set: setter });
      return wrap(tag, description);
    };

    redefine($Symbol[PROTOTYPE$1], 'toString', function toString() {
      return getInternalState$1(this).tag;
    });

    redefine($Symbol, 'withoutSetter', function (description) {
      return wrap(uid(description), description);
    });

    objectPropertyIsEnumerable.f = $propertyIsEnumerable;
    objectDefineProperty.f = $defineProperty;
    objectGetOwnPropertyDescriptor.f = $getOwnPropertyDescriptor;
    objectGetOwnPropertyNames.f = objectGetOwnPropertyNamesExternal.f = $getOwnPropertyNames;
    objectGetOwnPropertySymbols.f = $getOwnPropertySymbols;

    wellKnownSymbolWrapped.f = function (name) {
      return wrap(wellKnownSymbol(name), name);
    };

    if (descriptors) {
      // https://github.com/tc39/proposal-Symbol-description
      nativeDefineProperty$1($Symbol[PROTOTYPE$1], 'description', {
        configurable: true,
        get: function description() {
          return getInternalState$1(this).description;
        }
      });
      {
        redefine(ObjectPrototype, 'propertyIsEnumerable', $propertyIsEnumerable, { unsafe: true });
      }
    }
  }

  _export({ global: true, wrap: true, forced: !nativeSymbol, sham: !nativeSymbol }, {
    Symbol: $Symbol
  });

  $forEach(objectKeys(WellKnownSymbolsStore$1), function (name) {
    defineWellKnownSymbol(name);
  });

  _export({ target: SYMBOL, stat: true, forced: !nativeSymbol }, {
    // `Symbol.for` method
    // https://tc39.github.io/ecma262/#sec-symbol.for
    'for': function (key) {
      var string = String(key);
      if (has(StringToSymbolRegistry, string)) return StringToSymbolRegistry[string];
      var symbol = $Symbol(string);
      StringToSymbolRegistry[string] = symbol;
      SymbolToStringRegistry[symbol] = string;
      return symbol;
    },
    // `Symbol.keyFor` method
    // https://tc39.github.io/ecma262/#sec-symbol.keyfor
    keyFor: function keyFor(sym) {
      if (!isSymbol(sym)) throw TypeError(sym + ' is not a symbol');
      if (has(SymbolToStringRegistry, sym)) return SymbolToStringRegistry[sym];
    },
    useSetter: function () { USE_SETTER = true; },
    useSimple: function () { USE_SETTER = false; }
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol, sham: !descriptors }, {
    // `Object.create` method
    // https://tc39.github.io/ecma262/#sec-object.create
    create: $create,
    // `Object.defineProperty` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperty
    defineProperty: $defineProperty,
    // `Object.defineProperties` method
    // https://tc39.github.io/ecma262/#sec-object.defineproperties
    defineProperties: $defineProperties,
    // `Object.getOwnPropertyDescriptor` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertydescriptors
    getOwnPropertyDescriptor: $getOwnPropertyDescriptor
  });

  _export({ target: 'Object', stat: true, forced: !nativeSymbol }, {
    // `Object.getOwnPropertyNames` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertynames
    getOwnPropertyNames: $getOwnPropertyNames,
    // `Object.getOwnPropertySymbols` method
    // https://tc39.github.io/ecma262/#sec-object.getownpropertysymbols
    getOwnPropertySymbols: $getOwnPropertySymbols
  });

  // Chrome 38 and 39 `Object.getOwnPropertySymbols` fails on primitives
  // https://bugs.chromium.org/p/v8/issues/detail?id=3443
  _export({ target: 'Object', stat: true, forced: fails(function () { objectGetOwnPropertySymbols.f(1); }) }, {
    getOwnPropertySymbols: function getOwnPropertySymbols(it) {
      return objectGetOwnPropertySymbols.f(toObject(it));
    }
  });

  // `JSON.stringify` method behavior with symbols
  // https://tc39.github.io/ecma262/#sec-json.stringify
  if ($stringify) {
    var FORCED_JSON_STRINGIFY = !nativeSymbol || fails(function () {
      var symbol = $Symbol();
      // MS Edge converts symbol values to JSON as {}
      return $stringify([symbol]) != '[null]'
        // WebKit converts symbol values to JSON as null
        || $stringify({ a: symbol }) != '{}'
        // V8 throws on boxed symbols
        || $stringify(Object(symbol)) != '{}';
    });

    _export({ target: 'JSON', stat: true, forced: FORCED_JSON_STRINGIFY }, {
      // eslint-disable-next-line no-unused-vars
      stringify: function stringify(it, replacer, space) {
        var args = [it];
        var index = 1;
        var $replacer;
        while (arguments.length > index) args.push(arguments[index++]);
        $replacer = replacer;
        if (!isObject(replacer) && it === undefined || isSymbol(it)) return; // IE8 returns string on undefined
        if (!isArray(replacer)) replacer = function (key, value) {
          if (typeof $replacer == 'function') value = $replacer.call(this, key, value);
          if (!isSymbol(value)) return value;
        };
        args[1] = replacer;
        return $stringify.apply(null, args);
      }
    });
  }

  // `Symbol.prototype[@@toPrimitive]` method
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@toprimitive
  if (!$Symbol[PROTOTYPE$1][TO_PRIMITIVE]) {
    createNonEnumerableProperty($Symbol[PROTOTYPE$1], TO_PRIMITIVE, $Symbol[PROTOTYPE$1].valueOf);
  }
  // `Symbol.prototype[@@toStringTag]` property
  // https://tc39.github.io/ecma262/#sec-symbol.prototype-@@tostringtag
  setToStringTag($Symbol, SYMBOL);

  hiddenKeys[HIDDEN] = true;

  var defineProperty$2 = objectDefineProperty.f;


  var NativeSymbol = global_1.Symbol;

  if (descriptors && typeof NativeSymbol == 'function' && (!('description' in NativeSymbol.prototype) ||
    // Safari 12 bug
    NativeSymbol().description !== undefined
  )) {
    var EmptyStringDescriptionStore = {};
    // wrap Symbol constructor for correct work with undefined description
    var SymbolWrapper = function Symbol() {
      var description = arguments.length < 1 || arguments[0] === undefined ? undefined : String(arguments[0]);
      var result = this instanceof SymbolWrapper
        ? new NativeSymbol(description)
        // in Edge 13, String(Symbol(undefined)) === 'Symbol(undefined)'
        : description === undefined ? NativeSymbol() : NativeSymbol(description);
      if (description === '') EmptyStringDescriptionStore[result] = true;
      return result;
    };
    copyConstructorProperties(SymbolWrapper, NativeSymbol);
    var symbolPrototype = SymbolWrapper.prototype = NativeSymbol.prototype;
    symbolPrototype.constructor = SymbolWrapper;

    var symbolToString = symbolPrototype.toString;
    var native = String(NativeSymbol('test')) == 'Symbol(test)';
    var regexp = /^Symbol\((.*)\)[^)]+$/;
    defineProperty$2(symbolPrototype, 'description', {
      configurable: true,
      get: function description() {
        var symbol = isObject(this) ? this.valueOf() : this;
        var string = symbolToString.call(symbol);
        if (has(EmptyStringDescriptionStore, symbol)) return '';
        var desc = native ? string.slice(7, -1) : string.replace(regexp, '$1');
        return desc === '' ? undefined : desc;
      }
    });

    _export({ global: true, forced: true }, {
      Symbol: SymbolWrapper
    });
  }

  var createProperty = function (object, key, value) {
    var propertyKey = toPrimitive(key);
    if (propertyKey in object) objectDefineProperty.f(object, propertyKey, createPropertyDescriptor(0, value));
    else object[propertyKey] = value;
  };

  var SPECIES$4 = wellKnownSymbol('species');

  var arrayMethodHasSpeciesSupport = function (METHOD_NAME) {
    // We can't use this feature detection in V8 since it causes
    // deoptimization and serious performance degradation
    // https://github.com/zloirock/core-js/issues/677
    return engineV8Version >= 51 || !fails(function () {
      var array = [];
      var constructor = array.constructor = {};
      constructor[SPECIES$4] = function () {
        return { foo: 1 };
      };
      return array[METHOD_NAME](Boolean).foo !== 1;
    });
  };

  var IS_CONCAT_SPREADABLE = wellKnownSymbol('isConcatSpreadable');
  var MAX_SAFE_INTEGER = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_INDEX_EXCEEDED = 'Maximum allowed index exceeded';

  // We can't use this feature detection in V8 since it causes
  // deoptimization and serious performance degradation
  // https://github.com/zloirock/core-js/issues/679
  var IS_CONCAT_SPREADABLE_SUPPORT = engineV8Version >= 51 || !fails(function () {
    var array = [];
    array[IS_CONCAT_SPREADABLE] = false;
    return array.concat()[0] !== array;
  });

  var SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('concat');

  var isConcatSpreadable = function (O) {
    if (!isObject(O)) return false;
    var spreadable = O[IS_CONCAT_SPREADABLE];
    return spreadable !== undefined ? !!spreadable : isArray(O);
  };

  var FORCED$1 = !IS_CONCAT_SPREADABLE_SUPPORT || !SPECIES_SUPPORT;

  // `Array.prototype.concat` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.concat
  // with adding support of @@isConcatSpreadable and @@species
  _export({ target: 'Array', proto: true, forced: FORCED$1 }, {
    concat: function concat(arg) { // eslint-disable-line no-unused-vars
      var O = toObject(this);
      var A = arraySpeciesCreate(O, 0);
      var n = 0;
      var i, k, length, len, E;
      for (i = -1, length = arguments.length; i < length; i++) {
        E = i === -1 ? O : arguments[i];
        if (isConcatSpreadable(E)) {
          len = toLength(E.length);
          if (n + len > MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          for (k = 0; k < len; k++, n++) if (k in E) createProperty(A, n, E[k]);
        } else {
          if (n >= MAX_SAFE_INTEGER) throw TypeError(MAXIMUM_ALLOWED_INDEX_EXCEEDED);
          createProperty(A, n++, E);
        }
      }
      A.length = n;
      return A;
    }
  });

  var UNSCOPABLES = wellKnownSymbol('unscopables');
  var ArrayPrototype$1 = Array.prototype;

  // Array.prototype[@@unscopables]
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  if (ArrayPrototype$1[UNSCOPABLES] == undefined) {
    objectDefineProperty.f(ArrayPrototype$1, UNSCOPABLES, {
      configurable: true,
      value: objectCreate(null)
    });
  }

  // add a key to Array.prototype[@@unscopables]
  var addToUnscopables = function (key) {
    ArrayPrototype$1[UNSCOPABLES][key] = true;
  };

  var correctPrototypeGetter = !fails(function () {
    function F() { /* empty */ }
    F.prototype.constructor = null;
    return Object.getPrototypeOf(new F()) !== F.prototype;
  });

  var IE_PROTO$1 = sharedKey('IE_PROTO');
  var ObjectPrototype$1 = Object.prototype;

  // `Object.getPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.getprototypeof
  var objectGetPrototypeOf = correctPrototypeGetter ? Object.getPrototypeOf : function (O) {
    O = toObject(O);
    if (has(O, IE_PROTO$1)) return O[IE_PROTO$1];
    if (typeof O.constructor == 'function' && O instanceof O.constructor) {
      return O.constructor.prototype;
    } return O instanceof Object ? ObjectPrototype$1 : null;
  };

  var ITERATOR$3 = wellKnownSymbol('iterator');
  var BUGGY_SAFARI_ITERATORS = false;

  var returnThis = function () { return this; };

  // `%IteratorPrototype%` object
  // https://tc39.github.io/ecma262/#sec-%iteratorprototype%-object
  var IteratorPrototype, PrototypeOfArrayIteratorPrototype, arrayIterator;

  if ([].keys) {
    arrayIterator = [].keys();
    // Safari 8 has buggy iterators w/o `next`
    if (!('next' in arrayIterator)) BUGGY_SAFARI_ITERATORS = true;
    else {
      PrototypeOfArrayIteratorPrototype = objectGetPrototypeOf(objectGetPrototypeOf(arrayIterator));
      if (PrototypeOfArrayIteratorPrototype !== Object.prototype) IteratorPrototype = PrototypeOfArrayIteratorPrototype;
    }
  }

  if (IteratorPrototype == undefined) IteratorPrototype = {};

  // 25.1.2.1.1 %IteratorPrototype%[@@iterator]()
  if ( !has(IteratorPrototype, ITERATOR$3)) {
    createNonEnumerableProperty(IteratorPrototype, ITERATOR$3, returnThis);
  }

  var iteratorsCore = {
    IteratorPrototype: IteratorPrototype,
    BUGGY_SAFARI_ITERATORS: BUGGY_SAFARI_ITERATORS
  };

  var IteratorPrototype$1 = iteratorsCore.IteratorPrototype;





  var returnThis$1 = function () { return this; };

  var createIteratorConstructor = function (IteratorConstructor, NAME, next) {
    var TO_STRING_TAG = NAME + ' Iterator';
    IteratorConstructor.prototype = objectCreate(IteratorPrototype$1, { next: createPropertyDescriptor(1, next) });
    setToStringTag(IteratorConstructor, TO_STRING_TAG, false);
    iterators[TO_STRING_TAG] = returnThis$1;
    return IteratorConstructor;
  };

  var aPossiblePrototype = function (it) {
    if (!isObject(it) && it !== null) {
      throw TypeError("Can't set " + String(it) + ' as a prototype');
    } return it;
  };

  // `Object.setPrototypeOf` method
  // https://tc39.github.io/ecma262/#sec-object.setprototypeof
  // Works with __proto__ only. Old v8 can't work with null proto objects.
  /* eslint-disable no-proto */
  var objectSetPrototypeOf = Object.setPrototypeOf || ('__proto__' in {} ? function () {
    var CORRECT_SETTER = false;
    var test = {};
    var setter;
    try {
      setter = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__').set;
      setter.call(test, []);
      CORRECT_SETTER = test instanceof Array;
    } catch (error) { /* empty */ }
    return function setPrototypeOf(O, proto) {
      anObject(O);
      aPossiblePrototype(proto);
      if (CORRECT_SETTER) setter.call(O, proto);
      else O.__proto__ = proto;
      return O;
    };
  }() : undefined);

  var IteratorPrototype$2 = iteratorsCore.IteratorPrototype;
  var BUGGY_SAFARI_ITERATORS$1 = iteratorsCore.BUGGY_SAFARI_ITERATORS;
  var ITERATOR$4 = wellKnownSymbol('iterator');
  var KEYS = 'keys';
  var VALUES = 'values';
  var ENTRIES = 'entries';

  var returnThis$2 = function () { return this; };

  var defineIterator = function (Iterable, NAME, IteratorConstructor, next, DEFAULT, IS_SET, FORCED) {
    createIteratorConstructor(IteratorConstructor, NAME, next);

    var getIterationMethod = function (KIND) {
      if (KIND === DEFAULT && defaultIterator) return defaultIterator;
      if (!BUGGY_SAFARI_ITERATORS$1 && KIND in IterablePrototype) return IterablePrototype[KIND];
      switch (KIND) {
        case KEYS: return function keys() { return new IteratorConstructor(this, KIND); };
        case VALUES: return function values() { return new IteratorConstructor(this, KIND); };
        case ENTRIES: return function entries() { return new IteratorConstructor(this, KIND); };
      } return function () { return new IteratorConstructor(this); };
    };

    var TO_STRING_TAG = NAME + ' Iterator';
    var INCORRECT_VALUES_NAME = false;
    var IterablePrototype = Iterable.prototype;
    var nativeIterator = IterablePrototype[ITERATOR$4]
      || IterablePrototype['@@iterator']
      || DEFAULT && IterablePrototype[DEFAULT];
    var defaultIterator = !BUGGY_SAFARI_ITERATORS$1 && nativeIterator || getIterationMethod(DEFAULT);
    var anyNativeIterator = NAME == 'Array' ? IterablePrototype.entries || nativeIterator : nativeIterator;
    var CurrentIteratorPrototype, methods, KEY;

    // fix native
    if (anyNativeIterator) {
      CurrentIteratorPrototype = objectGetPrototypeOf(anyNativeIterator.call(new Iterable()));
      if (IteratorPrototype$2 !== Object.prototype && CurrentIteratorPrototype.next) {
        if ( objectGetPrototypeOf(CurrentIteratorPrototype) !== IteratorPrototype$2) {
          if (objectSetPrototypeOf) {
            objectSetPrototypeOf(CurrentIteratorPrototype, IteratorPrototype$2);
          } else if (typeof CurrentIteratorPrototype[ITERATOR$4] != 'function') {
            createNonEnumerableProperty(CurrentIteratorPrototype, ITERATOR$4, returnThis$2);
          }
        }
        // Set @@toStringTag to native iterators
        setToStringTag(CurrentIteratorPrototype, TO_STRING_TAG, true);
      }
    }

    // fix Array#{values, @@iterator}.name in V8 / FF
    if (DEFAULT == VALUES && nativeIterator && nativeIterator.name !== VALUES) {
      INCORRECT_VALUES_NAME = true;
      defaultIterator = function values() { return nativeIterator.call(this); };
    }

    // define iterator
    if ( IterablePrototype[ITERATOR$4] !== defaultIterator) {
      createNonEnumerableProperty(IterablePrototype, ITERATOR$4, defaultIterator);
    }
    iterators[NAME] = defaultIterator;

    // export additional methods
    if (DEFAULT) {
      methods = {
        values: getIterationMethod(VALUES),
        keys: IS_SET ? defaultIterator : getIterationMethod(KEYS),
        entries: getIterationMethod(ENTRIES)
      };
      if (FORCED) for (KEY in methods) {
        if (BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME || !(KEY in IterablePrototype)) {
          redefine(IterablePrototype, KEY, methods[KEY]);
        }
      } else _export({ target: NAME, proto: true, forced: BUGGY_SAFARI_ITERATORS$1 || INCORRECT_VALUES_NAME }, methods);
    }

    return methods;
  };

  var ARRAY_ITERATOR = 'Array Iterator';
  var setInternalState$2 = internalState.set;
  var getInternalState$2 = internalState.getterFor(ARRAY_ITERATOR);

  // `Array.prototype.entries` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.entries
  // `Array.prototype.keys` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.keys
  // `Array.prototype.values` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.values
  // `Array.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-array.prototype-@@iterator
  // `CreateArrayIterator` internal method
  // https://tc39.github.io/ecma262/#sec-createarrayiterator
  var es_array_iterator = defineIterator(Array, 'Array', function (iterated, kind) {
    setInternalState$2(this, {
      type: ARRAY_ITERATOR,
      target: toIndexedObject(iterated), // target
      index: 0,                          // next index
      kind: kind                         // kind
    });
  // `%ArrayIteratorPrototype%.next` method
  // https://tc39.github.io/ecma262/#sec-%arrayiteratorprototype%.next
  }, function () {
    var state = getInternalState$2(this);
    var target = state.target;
    var kind = state.kind;
    var index = state.index++;
    if (!target || index >= target.length) {
      state.target = undefined;
      return { value: undefined, done: true };
    }
    if (kind == 'keys') return { value: index, done: false };
    if (kind == 'values') return { value: target[index], done: false };
    return { value: [index, target[index]], done: false };
  }, 'values');

  // argumentsList[@@iterator] is %ArrayProto_values%
  // https://tc39.github.io/ecma262/#sec-createunmappedargumentsobject
  // https://tc39.github.io/ecma262/#sec-createmappedargumentsobject
  iterators.Arguments = iterators.Array;

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('keys');
  addToUnscopables('values');
  addToUnscopables('entries');

  var defineProperty$3 = Object.defineProperty;
  var cache = {};

  var thrower = function (it) { throw it; };

  var arrayMethodUsesToLength = function (METHOD_NAME, options) {
    if (has(cache, METHOD_NAME)) return cache[METHOD_NAME];
    if (!options) options = {};
    var method = [][METHOD_NAME];
    var ACCESSORS = has(options, 'ACCESSORS') ? options.ACCESSORS : false;
    var argument0 = has(options, 0) ? options[0] : thrower;
    var argument1 = has(options, 1) ? options[1] : undefined;

    return cache[METHOD_NAME] = !!method && !fails(function () {
      if (ACCESSORS && !descriptors) return true;
      var O = { length: -1 };

      if (ACCESSORS) defineProperty$3(O, 1, { enumerable: true, get: thrower });
      else O[1] = 1;

      method.call(O, argument0, argument1);
    });
  };

  var $map = arrayIteration.map;



  var HAS_SPECIES_SUPPORT = arrayMethodHasSpeciesSupport('map');
  // FF49- issue
  var USES_TO_LENGTH = arrayMethodUsesToLength('map');

  // `Array.prototype.map` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.map
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT || !USES_TO_LENGTH }, {
    map: function map(callbackfn /* , thisArg */) {
      return $map(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var HAS_SPECIES_SUPPORT$1 = arrayMethodHasSpeciesSupport('slice');
  var USES_TO_LENGTH$1 = arrayMethodUsesToLength('slice', { ACCESSORS: true, 0: 0, 1: 2 });

  var SPECIES$5 = wellKnownSymbol('species');
  var nativeSlice = [].slice;
  var max$1 = Math.max;

  // `Array.prototype.slice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.slice
  // fallback for not array-like ES3 strings and DOM objects
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$1 || !USES_TO_LENGTH$1 }, {
    slice: function slice(start, end) {
      var O = toIndexedObject(this);
      var length = toLength(O.length);
      var k = toAbsoluteIndex(start, length);
      var fin = toAbsoluteIndex(end === undefined ? length : end, length);
      // inline `ArraySpeciesCreate` for usage native `Array#slice` where it's possible
      var Constructor, result, n;
      if (isArray(O)) {
        Constructor = O.constructor;
        // cross-realm fallback
        if (typeof Constructor == 'function' && (Constructor === Array || isArray(Constructor.prototype))) {
          Constructor = undefined;
        } else if (isObject(Constructor)) {
          Constructor = Constructor[SPECIES$5];
          if (Constructor === null) Constructor = undefined;
        }
        if (Constructor === Array || Constructor === undefined) {
          return nativeSlice.call(O, k, fin);
        }
      }
      result = new (Constructor === undefined ? Array : Constructor)(max$1(fin - k, 0));
      for (n = 0; k < fin; k++, n++) if (k in O) createProperty(result, n, O[k]);
      result.length = n;
      return result;
    }
  });

  var DatePrototype = Date.prototype;
  var INVALID_DATE = 'Invalid Date';
  var TO_STRING = 'toString';
  var nativeDateToString = DatePrototype[TO_STRING];
  var getTime = DatePrototype.getTime;

  // `Date.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.tostring
  if (new Date(NaN) + '' != INVALID_DATE) {
    redefine(DatePrototype, TO_STRING, function toString() {
      var value = getTime.call(this);
      // eslint-disable-next-line no-self-compare
      return value === value ? nativeDateToString.call(this) : INVALID_DATE;
    });
  }

  // `RegExp.prototype.flags` getter implementation
  // https://tc39.github.io/ecma262/#sec-get-regexp.prototype.flags
  var regexpFlags = function () {
    var that = anObject(this);
    var result = '';
    if (that.global) result += 'g';
    if (that.ignoreCase) result += 'i';
    if (that.multiline) result += 'm';
    if (that.dotAll) result += 's';
    if (that.unicode) result += 'u';
    if (that.sticky) result += 'y';
    return result;
  };

  var TO_STRING$1 = 'toString';
  var RegExpPrototype = RegExp.prototype;
  var nativeToString = RegExpPrototype[TO_STRING$1];

  var NOT_GENERIC = fails(function () { return nativeToString.call({ source: 'a', flags: 'b' }) != '/a/b'; });
  // FF44- RegExp#toString has a wrong name
  var INCORRECT_NAME = nativeToString.name != TO_STRING$1;

  // `RegExp.prototype.toString` method
  // https://tc39.github.io/ecma262/#sec-regexp.prototype.tostring
  if (NOT_GENERIC || INCORRECT_NAME) {
    redefine(RegExp.prototype, TO_STRING$1, function toString() {
      var R = anObject(this);
      var p = String(R.source);
      var rf = R.flags;
      var f = String(rf === undefined && R instanceof RegExp && !('flags' in RegExpPrototype) ? regexpFlags.call(R) : rf);
      return '/' + p + '/' + f;
    }, { unsafe: true });
  }

  // `String.prototype.{ codePointAt, at }` methods implementation
  var createMethod$2 = function (CONVERT_TO_STRING) {
    return function ($this, pos) {
      var S = String(requireObjectCoercible($this));
      var position = toInteger(pos);
      var size = S.length;
      var first, second;
      if (position < 0 || position >= size) return CONVERT_TO_STRING ? '' : undefined;
      first = S.charCodeAt(position);
      return first < 0xD800 || first > 0xDBFF || position + 1 === size
        || (second = S.charCodeAt(position + 1)) < 0xDC00 || second > 0xDFFF
          ? CONVERT_TO_STRING ? S.charAt(position) : first
          : CONVERT_TO_STRING ? S.slice(position, position + 2) : (first - 0xD800 << 10) + (second - 0xDC00) + 0x10000;
    };
  };

  var stringMultibyte = {
    // `String.prototype.codePointAt` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.codepointat
    codeAt: createMethod$2(false),
    // `String.prototype.at` method
    // https://github.com/mathiasbynens/String.prototype.at
    charAt: createMethod$2(true)
  };

  var charAt = stringMultibyte.charAt;



  var STRING_ITERATOR = 'String Iterator';
  var setInternalState$3 = internalState.set;
  var getInternalState$3 = internalState.getterFor(STRING_ITERATOR);

  // `String.prototype[@@iterator]` method
  // https://tc39.github.io/ecma262/#sec-string.prototype-@@iterator
  defineIterator(String, 'String', function (iterated) {
    setInternalState$3(this, {
      type: STRING_ITERATOR,
      string: String(iterated),
      index: 0
    });
  // `%StringIteratorPrototype%.next` method
  // https://tc39.github.io/ecma262/#sec-%stringiteratorprototype%.next
  }, function next() {
    var state = getInternalState$3(this);
    var string = state.string;
    var index = state.index;
    var point;
    if (index >= string.length) return { value: undefined, done: true };
    point = charAt(string, index);
    state.index += point.length;
    return { value: point, done: false };
  });

  var MATCH = wellKnownSymbol('match');

  // `IsRegExp` abstract operation
  // https://tc39.github.io/ecma262/#sec-isregexp
  var isRegexp = function (it) {
    var isRegExp;
    return isObject(it) && ((isRegExp = it[MATCH]) !== undefined ? !!isRegExp : classofRaw(it) == 'RegExp');
  };

  var notARegexp = function (it) {
    if (isRegexp(it)) {
      throw TypeError("The method doesn't accept regular expressions");
    } return it;
  };

  var MATCH$1 = wellKnownSymbol('match');

  var correctIsRegexpLogic = function (METHOD_NAME) {
    var regexp = /./;
    try {
      '/./'[METHOD_NAME](regexp);
    } catch (e) {
      try {
        regexp[MATCH$1] = false;
        return '/./'[METHOD_NAME](regexp);
      } catch (f) { /* empty */ }
    } return false;
  };

  var getOwnPropertyDescriptor$3 = objectGetOwnPropertyDescriptor.f;






  var nativeStartsWith = ''.startsWith;
  var min$2 = Math.min;

  var CORRECT_IS_REGEXP_LOGIC = correctIsRegexpLogic('startsWith');
  // https://github.com/zloirock/core-js/pull/702
  var MDN_POLYFILL_BUG =  !CORRECT_IS_REGEXP_LOGIC && !!function () {
    var descriptor = getOwnPropertyDescriptor$3(String.prototype, 'startsWith');
    return descriptor && !descriptor.writable;
  }();

  // `String.prototype.startsWith` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.startswith
  _export({ target: 'String', proto: true, forced: !MDN_POLYFILL_BUG && !CORRECT_IS_REGEXP_LOGIC }, {
    startsWith: function startsWith(searchString /* , position = 0 */) {
      var that = String(requireObjectCoercible(this));
      notARegexp(searchString);
      var index = toLength(min$2(arguments.length > 1 ? arguments[1] : undefined, that.length));
      var search = String(searchString);
      return nativeStartsWith
        ? nativeStartsWith.call(that, search, index)
        : that.slice(index, index + search.length) === search;
    }
  });

  var freezing = !fails(function () {
    return Object.isExtensible(Object.preventExtensions({}));
  });

  var internalMetadata = createCommonjsModule(function (module) {
  var defineProperty = objectDefineProperty.f;



  var METADATA = uid('meta');
  var id = 0;

  var isExtensible = Object.isExtensible || function () {
    return true;
  };

  var setMetadata = function (it) {
    defineProperty(it, METADATA, { value: {
      objectID: 'O' + ++id, // object ID
      weakData: {}          // weak collections IDs
    } });
  };

  var fastKey = function (it, create) {
    // return a primitive with prefix
    if (!isObject(it)) return typeof it == 'symbol' ? it : (typeof it == 'string' ? 'S' : 'P') + it;
    if (!has(it, METADATA)) {
      // can't set metadata to uncaught frozen object
      if (!isExtensible(it)) return 'F';
      // not necessary to add metadata
      if (!create) return 'E';
      // add missing metadata
      setMetadata(it);
    // return object ID
    } return it[METADATA].objectID;
  };

  var getWeakData = function (it, create) {
    if (!has(it, METADATA)) {
      // can't set metadata to uncaught frozen object
      if (!isExtensible(it)) return true;
      // not necessary to add metadata
      if (!create) return false;
      // add missing metadata
      setMetadata(it);
    // return the store of weak collections IDs
    } return it[METADATA].weakData;
  };

  // add metadata on freeze-family methods calling
  var onFreeze = function (it) {
    if (freezing && meta.REQUIRED && isExtensible(it) && !has(it, METADATA)) setMetadata(it);
    return it;
  };

  var meta = module.exports = {
    REQUIRED: false,
    fastKey: fastKey,
    getWeakData: getWeakData,
    onFreeze: onFreeze
  };

  hiddenKeys[METADATA] = true;
  });

  // makes subclassing work correct for wrapped built-ins
  var inheritIfRequired = function ($this, dummy, Wrapper) {
    var NewTarget, NewTargetPrototype;
    if (
      // it can work only with native `setPrototypeOf`
      objectSetPrototypeOf &&
      // we haven't completely correct pre-ES6 way for getting `new.target`, so use this
      typeof (NewTarget = dummy.constructor) == 'function' &&
      NewTarget !== Wrapper &&
      isObject(NewTargetPrototype = NewTarget.prototype) &&
      NewTargetPrototype !== Wrapper.prototype
    ) objectSetPrototypeOf($this, NewTargetPrototype);
    return $this;
  };

  var collection = function (CONSTRUCTOR_NAME, wrapper, common) {
    var IS_MAP = CONSTRUCTOR_NAME.indexOf('Map') !== -1;
    var IS_WEAK = CONSTRUCTOR_NAME.indexOf('Weak') !== -1;
    var ADDER = IS_MAP ? 'set' : 'add';
    var NativeConstructor = global_1[CONSTRUCTOR_NAME];
    var NativePrototype = NativeConstructor && NativeConstructor.prototype;
    var Constructor = NativeConstructor;
    var exported = {};

    var fixMethod = function (KEY) {
      var nativeMethod = NativePrototype[KEY];
      redefine(NativePrototype, KEY,
        KEY == 'add' ? function add(value) {
          nativeMethod.call(this, value === 0 ? 0 : value);
          return this;
        } : KEY == 'delete' ? function (key) {
          return IS_WEAK && !isObject(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
        } : KEY == 'get' ? function get(key) {
          return IS_WEAK && !isObject(key) ? undefined : nativeMethod.call(this, key === 0 ? 0 : key);
        } : KEY == 'has' ? function has(key) {
          return IS_WEAK && !isObject(key) ? false : nativeMethod.call(this, key === 0 ? 0 : key);
        } : function set(key, value) {
          nativeMethod.call(this, key === 0 ? 0 : key, value);
          return this;
        }
      );
    };

    // eslint-disable-next-line max-len
    if (isForced_1(CONSTRUCTOR_NAME, typeof NativeConstructor != 'function' || !(IS_WEAK || NativePrototype.forEach && !fails(function () {
      new NativeConstructor().entries().next();
    })))) {
      // create collection constructor
      Constructor = common.getConstructor(wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER);
      internalMetadata.REQUIRED = true;
    } else if (isForced_1(CONSTRUCTOR_NAME, true)) {
      var instance = new Constructor();
      // early implementations not supports chaining
      var HASNT_CHAINING = instance[ADDER](IS_WEAK ? {} : -0, 1) != instance;
      // V8 ~ Chromium 40- weak-collections throws on primitives, but should return false
      var THROWS_ON_PRIMITIVES = fails(function () { instance.has(1); });
      // most early implementations doesn't supports iterables, most modern - not close it correctly
      // eslint-disable-next-line no-new
      var ACCEPT_ITERABLES = checkCorrectnessOfIteration(function (iterable) { new NativeConstructor(iterable); });
      // for early implementations -0 and +0 not the same
      var BUGGY_ZERO = !IS_WEAK && fails(function () {
        // V8 ~ Chromium 42- fails only with 5+ elements
        var $instance = new NativeConstructor();
        var index = 5;
        while (index--) $instance[ADDER](index, index);
        return !$instance.has(-0);
      });

      if (!ACCEPT_ITERABLES) {
        Constructor = wrapper(function (dummy, iterable) {
          anInstance(dummy, Constructor, CONSTRUCTOR_NAME);
          var that = inheritIfRequired(new NativeConstructor(), dummy, Constructor);
          if (iterable != undefined) iterate_1(iterable, that[ADDER], that, IS_MAP);
          return that;
        });
        Constructor.prototype = NativePrototype;
        NativePrototype.constructor = Constructor;
      }

      if (THROWS_ON_PRIMITIVES || BUGGY_ZERO) {
        fixMethod('delete');
        fixMethod('has');
        IS_MAP && fixMethod('get');
      }

      if (BUGGY_ZERO || HASNT_CHAINING) fixMethod(ADDER);

      // weak collections should not contains .clear method
      if (IS_WEAK && NativePrototype.clear) delete NativePrototype.clear;
    }

    exported[CONSTRUCTOR_NAME] = Constructor;
    _export({ global: true, forced: Constructor != NativeConstructor }, exported);

    setToStringTag(Constructor, CONSTRUCTOR_NAME);

    if (!IS_WEAK) common.setStrong(Constructor, CONSTRUCTOR_NAME, IS_MAP);

    return Constructor;
  };

  var getWeakData = internalMetadata.getWeakData;








  var setInternalState$4 = internalState.set;
  var internalStateGetterFor = internalState.getterFor;
  var find = arrayIteration.find;
  var findIndex = arrayIteration.findIndex;
  var id$1 = 0;

  // fallback for uncaught frozen keys
  var uncaughtFrozenStore = function (store) {
    return store.frozen || (store.frozen = new UncaughtFrozenStore());
  };

  var UncaughtFrozenStore = function () {
    this.entries = [];
  };

  var findUncaughtFrozen = function (store, key) {
    return find(store.entries, function (it) {
      return it[0] === key;
    });
  };

  UncaughtFrozenStore.prototype = {
    get: function (key) {
      var entry = findUncaughtFrozen(this, key);
      if (entry) return entry[1];
    },
    has: function (key) {
      return !!findUncaughtFrozen(this, key);
    },
    set: function (key, value) {
      var entry = findUncaughtFrozen(this, key);
      if (entry) entry[1] = value;
      else this.entries.push([key, value]);
    },
    'delete': function (key) {
      var index = findIndex(this.entries, function (it) {
        return it[0] === key;
      });
      if (~index) this.entries.splice(index, 1);
      return !!~index;
    }
  };

  var collectionWeak = {
    getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
      var C = wrapper(function (that, iterable) {
        anInstance(that, C, CONSTRUCTOR_NAME);
        setInternalState$4(that, {
          type: CONSTRUCTOR_NAME,
          id: id$1++,
          frozen: undefined
        });
        if (iterable != undefined) iterate_1(iterable, that[ADDER], that, IS_MAP);
      });

      var getInternalState = internalStateGetterFor(CONSTRUCTOR_NAME);

      var define = function (that, key, value) {
        var state = getInternalState(that);
        var data = getWeakData(anObject(key), true);
        if (data === true) uncaughtFrozenStore(state).set(key, value);
        else data[state.id] = value;
        return that;
      };

      redefineAll(C.prototype, {
        // 23.3.3.2 WeakMap.prototype.delete(key)
        // 23.4.3.3 WeakSet.prototype.delete(value)
        'delete': function (key) {
          var state = getInternalState(this);
          if (!isObject(key)) return false;
          var data = getWeakData(key);
          if (data === true) return uncaughtFrozenStore(state)['delete'](key);
          return data && has(data, state.id) && delete data[state.id];
        },
        // 23.3.3.4 WeakMap.prototype.has(key)
        // 23.4.3.4 WeakSet.prototype.has(value)
        has: function has$1(key) {
          var state = getInternalState(this);
          if (!isObject(key)) return false;
          var data = getWeakData(key);
          if (data === true) return uncaughtFrozenStore(state).has(key);
          return data && has(data, state.id);
        }
      });

      redefineAll(C.prototype, IS_MAP ? {
        // 23.3.3.3 WeakMap.prototype.get(key)
        get: function get(key) {
          var state = getInternalState(this);
          if (isObject(key)) {
            var data = getWeakData(key);
            if (data === true) return uncaughtFrozenStore(state).get(key);
            return data ? data[state.id] : undefined;
          }
        },
        // 23.3.3.5 WeakMap.prototype.set(key, value)
        set: function set(key, value) {
          return define(this, key, value);
        }
      } : {
        // 23.4.3.1 WeakSet.prototype.add(value)
        add: function add(value) {
          return define(this, value, true);
        }
      });

      return C;
    }
  };

  var es_weakMap = createCommonjsModule(function (module) {






  var enforceIternalState = internalState.enforce;


  var IS_IE11 = !global_1.ActiveXObject && 'ActiveXObject' in global_1;
  var isExtensible = Object.isExtensible;
  var InternalWeakMap;

  var wrapper = function (init) {
    return function WeakMap() {
      return init(this, arguments.length ? arguments[0] : undefined);
    };
  };

  // `WeakMap` constructor
  // https://tc39.github.io/ecma262/#sec-weakmap-constructor
  var $WeakMap = module.exports = collection('WeakMap', wrapper, collectionWeak);

  // IE11 WeakMap frozen keys fix
  // We can't use feature detection because it crash some old IE builds
  // https://github.com/zloirock/core-js/issues/485
  if (nativeWeakMap && IS_IE11) {
    InternalWeakMap = collectionWeak.getConstructor(wrapper, 'WeakMap', true);
    internalMetadata.REQUIRED = true;
    var WeakMapPrototype = $WeakMap.prototype;
    var nativeDelete = WeakMapPrototype['delete'];
    var nativeHas = WeakMapPrototype.has;
    var nativeGet = WeakMapPrototype.get;
    var nativeSet = WeakMapPrototype.set;
    redefineAll(WeakMapPrototype, {
      'delete': function (key) {
        if (isObject(key) && !isExtensible(key)) {
          var state = enforceIternalState(this);
          if (!state.frozen) state.frozen = new InternalWeakMap();
          return nativeDelete.call(this, key) || state.frozen['delete'](key);
        } return nativeDelete.call(this, key);
      },
      has: function has(key) {
        if (isObject(key) && !isExtensible(key)) {
          var state = enforceIternalState(this);
          if (!state.frozen) state.frozen = new InternalWeakMap();
          return nativeHas.call(this, key) || state.frozen.has(key);
        } return nativeHas.call(this, key);
      },
      get: function get(key) {
        if (isObject(key) && !isExtensible(key)) {
          var state = enforceIternalState(this);
          if (!state.frozen) state.frozen = new InternalWeakMap();
          return nativeHas.call(this, key) ? nativeGet.call(this, key) : state.frozen.get(key);
        } return nativeGet.call(this, key);
      },
      set: function set(key, value) {
        if (isObject(key) && !isExtensible(key)) {
          var state = enforceIternalState(this);
          if (!state.frozen) state.frozen = new InternalWeakMap();
          nativeHas.call(this, key) ? nativeSet.call(this, key, value) : state.frozen.set(key, value);
        } else nativeSet.call(this, key, value);
        return this;
      }
    });
  }
  });

  // iterable DOM collections
  // flag - `iterable` interface - 'entries', 'keys', 'values', 'forEach' methods
  var domIterables = {
    CSSRuleList: 0,
    CSSStyleDeclaration: 0,
    CSSValueList: 0,
    ClientRectList: 0,
    DOMRectList: 0,
    DOMStringList: 0,
    DOMTokenList: 1,
    DataTransferItemList: 0,
    FileList: 0,
    HTMLAllCollection: 0,
    HTMLCollection: 0,
    HTMLFormElement: 0,
    HTMLSelectElement: 0,
    MediaList: 0,
    MimeTypeArray: 0,
    NamedNodeMap: 0,
    NodeList: 1,
    PaintRequestList: 0,
    Plugin: 0,
    PluginArray: 0,
    SVGLengthList: 0,
    SVGNumberList: 0,
    SVGPathSegList: 0,
    SVGPointList: 0,
    SVGStringList: 0,
    SVGTransformList: 0,
    SourceBufferList: 0,
    StyleSheetList: 0,
    TextTrackCueList: 0,
    TextTrackList: 0,
    TouchList: 0
  };

  var ITERATOR$5 = wellKnownSymbol('iterator');
  var TO_STRING_TAG$3 = wellKnownSymbol('toStringTag');
  var ArrayValues = es_array_iterator.values;

  for (var COLLECTION_NAME in domIterables) {
    var Collection = global_1[COLLECTION_NAME];
    var CollectionPrototype = Collection && Collection.prototype;
    if (CollectionPrototype) {
      // some Chrome versions have non-configurable methods on DOMTokenList
      if (CollectionPrototype[ITERATOR$5] !== ArrayValues) try {
        createNonEnumerableProperty(CollectionPrototype, ITERATOR$5, ArrayValues);
      } catch (error) {
        CollectionPrototype[ITERATOR$5] = ArrayValues;
      }
      if (!CollectionPrototype[TO_STRING_TAG$3]) {
        createNonEnumerableProperty(CollectionPrototype, TO_STRING_TAG$3, COLLECTION_NAME);
      }
      if (domIterables[COLLECTION_NAME]) for (var METHOD_NAME in es_array_iterator) {
        // some Chrome versions have non-configurable methods on DOMTokenList
        if (CollectionPrototype[METHOD_NAME] !== es_array_iterator[METHOD_NAME]) try {
          createNonEnumerableProperty(CollectionPrototype, METHOD_NAME, es_array_iterator[METHOD_NAME]);
        } catch (error) {
          CollectionPrototype[METHOD_NAME] = es_array_iterator[METHOD_NAME];
        }
      }
    }
  }

  // `Symbol.iterator` well-known symbol
  // https://tc39.github.io/ecma262/#sec-symbol.iterator
  defineWellKnownSymbol('iterator');

  var $filter = arrayIteration.filter;



  var HAS_SPECIES_SUPPORT$2 = arrayMethodHasSpeciesSupport('filter');
  // Edge 14- issue
  var USES_TO_LENGTH$2 = arrayMethodUsesToLength('filter');

  // `Array.prototype.filter` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.filter
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$2 || !USES_TO_LENGTH$2 }, {
    filter: function filter(callbackfn /* , thisArg */) {
      return $filter(this, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var $includes = arrayIncludes.includes;



  var USES_TO_LENGTH$3 = arrayMethodUsesToLength('indexOf', { ACCESSORS: true, 1: 0 });

  // `Array.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.includes
  _export({ target: 'Array', proto: true, forced: !USES_TO_LENGTH$3 }, {
    includes: function includes(el /* , fromIndex = 0 */) {
      return $includes(this, el, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // https://tc39.github.io/ecma262/#sec-array.prototype-@@unscopables
  addToUnscopables('includes');

  // `Array.isArray` method
  // https://tc39.github.io/ecma262/#sec-array.isarray
  _export({ target: 'Array', stat: true }, {
    isArray: isArray
  });

  var arrayMethodIsStrict = function (METHOD_NAME, argument) {
    var method = [][METHOD_NAME];
    return !!method && fails(function () {
      // eslint-disable-next-line no-useless-call,no-throw-literal
      method.call(null, argument || function () { throw 1; }, 1);
    });
  };

  var nativeJoin = [].join;

  var ES3_STRINGS = indexedObject != Object;
  var STRICT_METHOD = arrayMethodIsStrict('join', ',');

  // `Array.prototype.join` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.join
  _export({ target: 'Array', proto: true, forced: ES3_STRINGS || !STRICT_METHOD }, {
    join: function join(separator) {
      return nativeJoin.call(toIndexedObject(this), separator === undefined ? ',' : separator);
    }
  });

  // `Array.prototype.{ reduce, reduceRight }` methods implementation
  var createMethod$3 = function (IS_RIGHT) {
    return function (that, callbackfn, argumentsLength, memo) {
      aFunction$1(callbackfn);
      var O = toObject(that);
      var self = indexedObject(O);
      var length = toLength(O.length);
      var index = IS_RIGHT ? length - 1 : 0;
      var i = IS_RIGHT ? -1 : 1;
      if (argumentsLength < 2) while (true) {
        if (index in self) {
          memo = self[index];
          index += i;
          break;
        }
        index += i;
        if (IS_RIGHT ? index < 0 : length <= index) {
          throw TypeError('Reduce of empty array with no initial value');
        }
      }
      for (;IS_RIGHT ? index >= 0 : length > index; index += i) if (index in self) {
        memo = callbackfn(memo, self[index], index, O);
      }
      return memo;
    };
  };

  var arrayReduce = {
    // `Array.prototype.reduce` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
    left: createMethod$3(false),
    // `Array.prototype.reduceRight` method
    // https://tc39.github.io/ecma262/#sec-array.prototype.reduceright
    right: createMethod$3(true)
  };

  var $reduce = arrayReduce.left;



  var STRICT_METHOD$1 = arrayMethodIsStrict('reduce');
  var USES_TO_LENGTH$4 = arrayMethodUsesToLength('reduce', { 1: 0 });

  // `Array.prototype.reduce` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.reduce
  _export({ target: 'Array', proto: true, forced: !STRICT_METHOD$1 || !USES_TO_LENGTH$4 }, {
    reduce: function reduce(callbackfn /* , initialValue */) {
      return $reduce(this, callbackfn, arguments.length, arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  var test$1 = [];
  var nativeSort = test$1.sort;

  // IE8-
  var FAILS_ON_UNDEFINED = fails(function () {
    test$1.sort(undefined);
  });
  // V8 bug
  var FAILS_ON_NULL = fails(function () {
    test$1.sort(null);
  });
  // Old WebKit
  var STRICT_METHOD$2 = arrayMethodIsStrict('sort');

  var FORCED$2 = FAILS_ON_UNDEFINED || !FAILS_ON_NULL || !STRICT_METHOD$2;

  // `Array.prototype.sort` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.sort
  _export({ target: 'Array', proto: true, forced: FORCED$2 }, {
    sort: function sort(comparefn) {
      return comparefn === undefined
        ? nativeSort.call(toObject(this))
        : nativeSort.call(toObject(this), aFunction$1(comparefn));
    }
  });

  var HAS_SPECIES_SUPPORT$3 = arrayMethodHasSpeciesSupport('splice');
  var USES_TO_LENGTH$5 = arrayMethodUsesToLength('splice', { ACCESSORS: true, 0: 0, 1: 2 });

  var max$2 = Math.max;
  var min$3 = Math.min;
  var MAX_SAFE_INTEGER$1 = 0x1FFFFFFFFFFFFF;
  var MAXIMUM_ALLOWED_LENGTH_EXCEEDED = 'Maximum allowed length exceeded';

  // `Array.prototype.splice` method
  // https://tc39.github.io/ecma262/#sec-array.prototype.splice
  // with adding support of @@species
  _export({ target: 'Array', proto: true, forced: !HAS_SPECIES_SUPPORT$3 || !USES_TO_LENGTH$5 }, {
    splice: function splice(start, deleteCount /* , ...items */) {
      var O = toObject(this);
      var len = toLength(O.length);
      var actualStart = toAbsoluteIndex(start, len);
      var argumentsLength = arguments.length;
      var insertCount, actualDeleteCount, A, k, from, to;
      if (argumentsLength === 0) {
        insertCount = actualDeleteCount = 0;
      } else if (argumentsLength === 1) {
        insertCount = 0;
        actualDeleteCount = len - actualStart;
      } else {
        insertCount = argumentsLength - 2;
        actualDeleteCount = min$3(max$2(toInteger(deleteCount), 0), len - actualStart);
      }
      if (len + insertCount - actualDeleteCount > MAX_SAFE_INTEGER$1) {
        throw TypeError(MAXIMUM_ALLOWED_LENGTH_EXCEEDED);
      }
      A = arraySpeciesCreate(O, actualDeleteCount);
      for (k = 0; k < actualDeleteCount; k++) {
        from = actualStart + k;
        if (from in O) createProperty(A, k, O[from]);
      }
      A.length = actualDeleteCount;
      if (insertCount < actualDeleteCount) {
        for (k = actualStart; k < len - actualDeleteCount; k++) {
          from = k + actualDeleteCount;
          to = k + insertCount;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
        for (k = len; k > len - actualDeleteCount + insertCount; k--) delete O[k - 1];
      } else if (insertCount > actualDeleteCount) {
        for (k = len - actualDeleteCount; k > actualStart; k--) {
          from = k + actualDeleteCount - 1;
          to = k + insertCount - 1;
          if (from in O) O[to] = O[from];
          else delete O[to];
        }
      }
      for (k = 0; k < insertCount; k++) {
        O[k + actualStart] = arguments[k + 2];
      }
      O.length = len - actualDeleteCount + insertCount;
      return A;
    }
  });

  // `String.prototype.repeat` method implementation
  // https://tc39.github.io/ecma262/#sec-string.prototype.repeat
  var stringRepeat = ''.repeat || function repeat(count) {
    var str = String(requireObjectCoercible(this));
    var result = '';
    var n = toInteger(count);
    if (n < 0 || n == Infinity) throw RangeError('Wrong number of repetitions');
    for (;n > 0; (n >>>= 1) && (str += str)) if (n & 1) result += str;
    return result;
  };

  // https://github.com/tc39/proposal-string-pad-start-end




  var ceil$1 = Math.ceil;

  // `String.prototype.{ padStart, padEnd }` methods implementation
  var createMethod$4 = function (IS_END) {
    return function ($this, maxLength, fillString) {
      var S = String(requireObjectCoercible($this));
      var stringLength = S.length;
      var fillStr = fillString === undefined ? ' ' : String(fillString);
      var intMaxLength = toLength(maxLength);
      var fillLen, stringFiller;
      if (intMaxLength <= stringLength || fillStr == '') return S;
      fillLen = intMaxLength - stringLength;
      stringFiller = stringRepeat.call(fillStr, ceil$1(fillLen / fillStr.length));
      if (stringFiller.length > fillLen) stringFiller = stringFiller.slice(0, fillLen);
      return IS_END ? S + stringFiller : stringFiller + S;
    };
  };

  var stringPad = {
    // `String.prototype.padStart` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.padstart
    start: createMethod$4(false),
    // `String.prototype.padEnd` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.padend
    end: createMethod$4(true)
  };

  var padStart = stringPad.start;

  var abs = Math.abs;
  var DatePrototype$1 = Date.prototype;
  var getTime$1 = DatePrototype$1.getTime;
  var nativeDateToISOString = DatePrototype$1.toISOString;

  // `Date.prototype.toISOString` method implementation
  // https://tc39.github.io/ecma262/#sec-date.prototype.toisostring
  // PhantomJS / old WebKit fails here:
  var dateToIsoString = (fails(function () {
    return nativeDateToISOString.call(new Date(-5e13 - 1)) != '0385-07-25T07:06:39.999Z';
  }) || !fails(function () {
    nativeDateToISOString.call(new Date(NaN));
  })) ? function toISOString() {
    if (!isFinite(getTime$1.call(this))) throw RangeError('Invalid time value');
    var date = this;
    var year = date.getUTCFullYear();
    var milliseconds = date.getUTCMilliseconds();
    var sign = year < 0 ? '-' : year > 9999 ? '+' : '';
    return sign + padStart(abs(year), sign ? 6 : 4, 0) +
      '-' + padStart(date.getUTCMonth() + 1, 2, 0) +
      '-' + padStart(date.getUTCDate(), 2, 0) +
      'T' + padStart(date.getUTCHours(), 2, 0) +
      ':' + padStart(date.getUTCMinutes(), 2, 0) +
      ':' + padStart(date.getUTCSeconds(), 2, 0) +
      '.' + padStart(milliseconds, 3, 0) +
      'Z';
  } : nativeDateToISOString;

  // `Date.prototype.toISOString` method
  // https://tc39.github.io/ecma262/#sec-date.prototype.toisostring
  // PhantomJS / old WebKit has a broken implementations
  _export({ target: 'Date', proto: true, forced: Date.prototype.toISOString !== dateToIsoString }, {
    toISOString: dateToIsoString
  });

  var log = Math.log;
  var LOG10E = Math.LOG10E;

  // `Math.log10` method
  // https://tc39.github.io/ecma262/#sec-math.log10
  _export({ target: 'Math', stat: true }, {
    log10: function log10(x) {
      return log(x) * LOG10E;
    }
  });

  // `Math.sign` method implementation
  // https://tc39.github.io/ecma262/#sec-math.sign
  var mathSign = Math.sign || function sign(x) {
    // eslint-disable-next-line no-self-compare
    return (x = +x) == 0 || x != x ? x : x < 0 ? -1 : 1;
  };

  // `Math.sign` method
  // https://tc39.github.io/ecma262/#sec-math.sign
  _export({ target: 'Math', stat: true }, {
    sign: mathSign
  });

  var ceil$2 = Math.ceil;
  var floor$1 = Math.floor;

  // `Math.trunc` method
  // https://tc39.github.io/ecma262/#sec-math.trunc
  _export({ target: 'Math', stat: true }, {
    trunc: function trunc(it) {
      return (it > 0 ? floor$1 : ceil$2)(it);
    }
  });

  // a string of all valid unicode whitespaces
  // eslint-disable-next-line max-len
  var whitespaces = '\u0009\u000A\u000B\u000C\u000D\u0020\u00A0\u1680\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF';

  var whitespace = '[' + whitespaces + ']';
  var ltrim = RegExp('^' + whitespace + whitespace + '*');
  var rtrim = RegExp(whitespace + whitespace + '*$');

  // `String.prototype.{ trim, trimStart, trimEnd, trimLeft, trimRight }` methods implementation
  var createMethod$5 = function (TYPE) {
    return function ($this) {
      var string = String(requireObjectCoercible($this));
      if (TYPE & 1) string = string.replace(ltrim, '');
      if (TYPE & 2) string = string.replace(rtrim, '');
      return string;
    };
  };

  var stringTrim = {
    // `String.prototype.{ trimLeft, trimStart }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimstart
    start: createMethod$5(1),
    // `String.prototype.{ trimRight, trimEnd }` methods
    // https://tc39.github.io/ecma262/#sec-string.prototype.trimend
    end: createMethod$5(2),
    // `String.prototype.trim` method
    // https://tc39.github.io/ecma262/#sec-string.prototype.trim
    trim: createMethod$5(3)
  };

  var getOwnPropertyNames = objectGetOwnPropertyNames.f;
  var getOwnPropertyDescriptor$4 = objectGetOwnPropertyDescriptor.f;
  var defineProperty$4 = objectDefineProperty.f;
  var trim = stringTrim.trim;

  var NUMBER = 'Number';
  var NativeNumber = global_1[NUMBER];
  var NumberPrototype = NativeNumber.prototype;

  // Opera ~12 has broken Object#toString
  var BROKEN_CLASSOF = classofRaw(objectCreate(NumberPrototype)) == NUMBER;

  // `ToNumber` abstract operation
  // https://tc39.github.io/ecma262/#sec-tonumber
  var toNumber = function (argument) {
    var it = toPrimitive(argument, false);
    var first, third, radix, maxCode, digits, length, index, code;
    if (typeof it == 'string' && it.length > 2) {
      it = trim(it);
      first = it.charCodeAt(0);
      if (first === 43 || first === 45) {
        third = it.charCodeAt(2);
        if (third === 88 || third === 120) return NaN; // Number('+0x1') should be NaN, old V8 fix
      } else if (first === 48) {
        switch (it.charCodeAt(1)) {
          case 66: case 98: radix = 2; maxCode = 49; break; // fast equal of /^0b[01]+$/i
          case 79: case 111: radix = 8; maxCode = 55; break; // fast equal of /^0o[0-7]+$/i
          default: return +it;
        }
        digits = it.slice(2);
        length = digits.length;
        for (index = 0; index < length; index++) {
          code = digits.charCodeAt(index);
          // parseInt parses a string to a first unavailable symbol
          // but ToNumber should return NaN if a string contains unavailable symbols
          if (code < 48 || code > maxCode) return NaN;
        } return parseInt(digits, radix);
      }
    } return +it;
  };

  // `Number` constructor
  // https://tc39.github.io/ecma262/#sec-number-constructor
  if (isForced_1(NUMBER, !NativeNumber(' 0o1') || !NativeNumber('0b1') || NativeNumber('+0x1'))) {
    var NumberWrapper = function Number(value) {
      var it = arguments.length < 1 ? 0 : value;
      var dummy = this;
      return dummy instanceof NumberWrapper
        // check on 1..constructor(foo) case
        && (BROKEN_CLASSOF ? fails(function () { NumberPrototype.valueOf.call(dummy); }) : classofRaw(dummy) != NUMBER)
          ? inheritIfRequired(new NativeNumber(toNumber(it)), dummy, NumberWrapper) : toNumber(it);
    };
    for (var keys$1 = descriptors ? getOwnPropertyNames(NativeNumber) : (
      // ES3:
      'MAX_VALUE,MIN_VALUE,NaN,NEGATIVE_INFINITY,POSITIVE_INFINITY,' +
      // ES2015 (in case, if modules with ES2015 Number statics required before):
      'EPSILON,isFinite,isInteger,isNaN,isSafeInteger,MAX_SAFE_INTEGER,' +
      'MIN_SAFE_INTEGER,parseFloat,parseInt,isInteger'
    ).split(','), j = 0, key; keys$1.length > j; j++) {
      if (has(NativeNumber, key = keys$1[j]) && !has(NumberWrapper, key)) {
        defineProperty$4(NumberWrapper, key, getOwnPropertyDescriptor$4(NativeNumber, key));
      }
    }
    NumberWrapper.prototype = NumberPrototype;
    NumberPrototype.constructor = NumberWrapper;
    redefine(global_1, NUMBER, NumberWrapper);
  }

  var globalIsFinite = global_1.isFinite;

  // `Number.isFinite` method
  // https://tc39.github.io/ecma262/#sec-number.isfinite
  var numberIsFinite = Number.isFinite || function isFinite(it) {
    return typeof it == 'number' && globalIsFinite(it);
  };

  // `Number.isFinite` method
  // https://tc39.github.io/ecma262/#sec-number.isfinite
  _export({ target: 'Number', stat: true }, { isFinite: numberIsFinite });

  var FAILS_ON_PRIMITIVES = fails(function () { objectKeys(1); });

  // `Object.keys` method
  // https://tc39.github.io/ecma262/#sec-object.keys
  _export({ target: 'Object', stat: true, forced: FAILS_ON_PRIMITIVES }, {
    keys: function keys(it) {
      return objectKeys(toObject(it));
    }
  });

  // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError,
  // so we use an intermediate function.
  function RE(s, f) {
    return RegExp(s, f);
  }

  var UNSUPPORTED_Y = fails(function () {
    // babel-minify transpiles RegExp('a', 'y') -> /a/y and it causes SyntaxError
    var re = RE('a', 'y');
    re.lastIndex = 2;
    return re.exec('abcd') != null;
  });

  var BROKEN_CARET = fails(function () {
    // https://bugzilla.mozilla.org/show_bug.cgi?id=773687
    var re = RE('^r', 'gy');
    re.lastIndex = 2;
    return re.exec('str') != null;
  });

  var regexpStickyHelpers = {
  	UNSUPPORTED_Y: UNSUPPORTED_Y,
  	BROKEN_CARET: BROKEN_CARET
  };

  var nativeExec = RegExp.prototype.exec;
  // This always refers to the native implementation, because the
  // String#replace polyfill uses ./fix-regexp-well-known-symbol-logic.js,
  // which loads this file before patching the method.
  var nativeReplace = String.prototype.replace;

  var patchedExec = nativeExec;

  var UPDATES_LAST_INDEX_WRONG = (function () {
    var re1 = /a/;
    var re2 = /b*/g;
    nativeExec.call(re1, 'a');
    nativeExec.call(re2, 'a');
    return re1.lastIndex !== 0 || re2.lastIndex !== 0;
  })();

  var UNSUPPORTED_Y$1 = regexpStickyHelpers.UNSUPPORTED_Y || regexpStickyHelpers.BROKEN_CARET;

  // nonparticipating capturing group, copied from es5-shim's String#split patch.
  var NPCG_INCLUDED = /()??/.exec('')[1] !== undefined;

  var PATCH = UPDATES_LAST_INDEX_WRONG || NPCG_INCLUDED || UNSUPPORTED_Y$1;

  if (PATCH) {
    patchedExec = function exec(str) {
      var re = this;
      var lastIndex, reCopy, match, i;
      var sticky = UNSUPPORTED_Y$1 && re.sticky;
      var flags = regexpFlags.call(re);
      var source = re.source;
      var charsAdded = 0;
      var strCopy = str;

      if (sticky) {
        flags = flags.replace('y', '');
        if (flags.indexOf('g') === -1) {
          flags += 'g';
        }

        strCopy = String(str).slice(re.lastIndex);
        // Support anchored sticky behavior.
        if (re.lastIndex > 0 && (!re.multiline || re.multiline && str[re.lastIndex - 1] !== '\n')) {
          source = '(?: ' + source + ')';
          strCopy = ' ' + strCopy;
          charsAdded++;
        }
        // ^(? + rx + ) is needed, in combination with some str slicing, to
        // simulate the 'y' flag.
        reCopy = new RegExp('^(?:' + source + ')', flags);
      }

      if (NPCG_INCLUDED) {
        reCopy = new RegExp('^' + source + '$(?!\\s)', flags);
      }
      if (UPDATES_LAST_INDEX_WRONG) lastIndex = re.lastIndex;

      match = nativeExec.call(sticky ? reCopy : re, strCopy);

      if (sticky) {
        if (match) {
          match.input = match.input.slice(charsAdded);
          match[0] = match[0].slice(charsAdded);
          match.index = re.lastIndex;
          re.lastIndex += match[0].length;
        } else re.lastIndex = 0;
      } else if (UPDATES_LAST_INDEX_WRONG && match) {
        re.lastIndex = re.global ? match.index + match[0].length : lastIndex;
      }
      if (NPCG_INCLUDED && match && match.length > 1) {
        // Fix browsers whose `exec` methods don't consistently return `undefined`
        // for NPCG, like IE8. NOTE: This doesn' work for /(.?)?/
        nativeReplace.call(match[0], reCopy, function () {
          for (i = 1; i < arguments.length - 2; i++) {
            if (arguments[i] === undefined) match[i] = undefined;
          }
        });
      }

      return match;
    };
  }

  var regexpExec = patchedExec;

  _export({ target: 'RegExp', proto: true, forced: /./.exec !== regexpExec }, {
    exec: regexpExec
  });

  // `String.prototype.includes` method
  // https://tc39.github.io/ecma262/#sec-string.prototype.includes
  _export({ target: 'String', proto: true, forced: !correctIsRegexpLogic('includes') }, {
    includes: function includes(searchString /* , position = 0 */) {
      return !!~String(requireObjectCoercible(this))
        .indexOf(notARegexp(searchString), arguments.length > 1 ? arguments[1] : undefined);
    }
  });

  // TODO: Remove from `core-js@4` since it's moved to entry points







  var SPECIES$6 = wellKnownSymbol('species');

  var REPLACE_SUPPORTS_NAMED_GROUPS = !fails(function () {
    // #replace needs built-in support for named groups.
    // #match works fine because it just return the exec results, even if it has
    // a "grops" property.
    var re = /./;
    re.exec = function () {
      var result = [];
      result.groups = { a: '7' };
      return result;
    };
    return ''.replace(re, '$<a>') !== '7';
  });

  // IE <= 11 replaces $0 with the whole match, as if it was $&
  // https://stackoverflow.com/questions/6024666/getting-ie-to-replace-a-regex-with-the-literal-string-0
  var REPLACE_KEEPS_$0 = (function () {
    return 'a'.replace(/./, '$0') === '$0';
  })();

  var REPLACE = wellKnownSymbol('replace');
  // Safari <= 13.0.3(?) substitutes nth capture where n>m with an empty string
  var REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE = (function () {
    if (/./[REPLACE]) {
      return /./[REPLACE]('a', '$0') === '';
    }
    return false;
  })();

  // Chrome 51 has a buggy "split" implementation when RegExp#exec !== nativeExec
  // Weex JS has frozen built-in prototypes, so use try / catch wrapper
  var SPLIT_WORKS_WITH_OVERWRITTEN_EXEC = !fails(function () {
    var re = /(?:)/;
    var originalExec = re.exec;
    re.exec = function () { return originalExec.apply(this, arguments); };
    var result = 'ab'.split(re);
    return result.length !== 2 || result[0] !== 'a' || result[1] !== 'b';
  });

  var fixRegexpWellKnownSymbolLogic = function (KEY, length, exec, sham) {
    var SYMBOL = wellKnownSymbol(KEY);

    var DELEGATES_TO_SYMBOL = !fails(function () {
      // String methods call symbol-named RegEp methods
      var O = {};
      O[SYMBOL] = function () { return 7; };
      return ''[KEY](O) != 7;
    });

    var DELEGATES_TO_EXEC = DELEGATES_TO_SYMBOL && !fails(function () {
      // Symbol-named RegExp methods call .exec
      var execCalled = false;
      var re = /a/;

      if (KEY === 'split') {
        // We can't use real regex here since it causes deoptimization
        // and serious performance degradation in V8
        // https://github.com/zloirock/core-js/issues/306
        re = {};
        // RegExp[@@split] doesn't call the regex's exec method, but first creates
        // a new one. We need to return the patched regex when creating the new one.
        re.constructor = {};
        re.constructor[SPECIES$6] = function () { return re; };
        re.flags = '';
        re[SYMBOL] = /./[SYMBOL];
      }

      re.exec = function () { execCalled = true; return null; };

      re[SYMBOL]('');
      return !execCalled;
    });

    if (
      !DELEGATES_TO_SYMBOL ||
      !DELEGATES_TO_EXEC ||
      (KEY === 'replace' && !(
        REPLACE_SUPPORTS_NAMED_GROUPS &&
        REPLACE_KEEPS_$0 &&
        !REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
      )) ||
      (KEY === 'split' && !SPLIT_WORKS_WITH_OVERWRITTEN_EXEC)
    ) {
      var nativeRegExpMethod = /./[SYMBOL];
      var methods = exec(SYMBOL, ''[KEY], function (nativeMethod, regexp, str, arg2, forceStringMethod) {
        if (regexp.exec === regexpExec) {
          if (DELEGATES_TO_SYMBOL && !forceStringMethod) {
            // The native String method already delegates to @@method (this
            // polyfilled function), leasing to infinite recursion.
            // We avoid it by directly calling the native @@method method.
            return { done: true, value: nativeRegExpMethod.call(regexp, str, arg2) };
          }
          return { done: true, value: nativeMethod.call(str, regexp, arg2) };
        }
        return { done: false };
      }, {
        REPLACE_KEEPS_$0: REPLACE_KEEPS_$0,
        REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE: REGEXP_REPLACE_SUBSTITUTES_UNDEFINED_CAPTURE
      });
      var stringMethod = methods[0];
      var regexMethod = methods[1];

      redefine(String.prototype, KEY, stringMethod);
      redefine(RegExp.prototype, SYMBOL, length == 2
        // 21.2.5.8 RegExp.prototype[@@replace](string, replaceValue)
        // 21.2.5.11 RegExp.prototype[@@split](string, limit)
        ? function (string, arg) { return regexMethod.call(string, this, arg); }
        // 21.2.5.6 RegExp.prototype[@@match](string)
        // 21.2.5.9 RegExp.prototype[@@search](string)
        : function (string) { return regexMethod.call(string, this); }
      );
    }

    if (sham) createNonEnumerableProperty(RegExp.prototype[SYMBOL], 'sham', true);
  };

  var charAt$1 = stringMultibyte.charAt;

  // `AdvanceStringIndex` abstract operation
  // https://tc39.github.io/ecma262/#sec-advancestringindex
  var advanceStringIndex = function (S, index, unicode) {
    return index + (unicode ? charAt$1(S, index).length : 1);
  };

  // `RegExpExec` abstract operation
  // https://tc39.github.io/ecma262/#sec-regexpexec
  var regexpExecAbstract = function (R, S) {
    var exec = R.exec;
    if (typeof exec === 'function') {
      var result = exec.call(R, S);
      if (typeof result !== 'object') {
        throw TypeError('RegExp exec method returned something other than an Object or null');
      }
      return result;
    }

    if (classofRaw(R) !== 'RegExp') {
      throw TypeError('RegExp#exec called on incompatible receiver');
    }

    return regexpExec.call(R, S);
  };

  // @@match logic
  fixRegexpWellKnownSymbolLogic('match', 1, function (MATCH, nativeMatch, maybeCallNative) {
    return [
      // `String.prototype.match` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.match
      function match(regexp) {
        var O = requireObjectCoercible(this);
        var matcher = regexp == undefined ? undefined : regexp[MATCH];
        return matcher !== undefined ? matcher.call(regexp, O) : new RegExp(regexp)[MATCH](String(O));
      },
      // `RegExp.prototype[@@match]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@match
      function (regexp) {
        var res = maybeCallNative(nativeMatch, regexp, this);
        if (res.done) return res.value;

        var rx = anObject(regexp);
        var S = String(this);

        if (!rx.global) return regexpExecAbstract(rx, S);

        var fullUnicode = rx.unicode;
        rx.lastIndex = 0;
        var A = [];
        var n = 0;
        var result;
        while ((result = regexpExecAbstract(rx, S)) !== null) {
          var matchStr = String(result[0]);
          A[n] = matchStr;
          if (matchStr === '') rx.lastIndex = advanceStringIndex(S, toLength(rx.lastIndex), fullUnicode);
          n++;
        }
        return n === 0 ? null : A;
      }
    ];
  });

  var arrayPush = [].push;
  var min$4 = Math.min;
  var MAX_UINT32 = 0xFFFFFFFF;

  // babel-minify transpiles RegExp('x', 'y') -> /x/y and it causes SyntaxError
  var SUPPORTS_Y = !fails(function () { return !RegExp(MAX_UINT32, 'y'); });

  // @@split logic
  fixRegexpWellKnownSymbolLogic('split', 2, function (SPLIT, nativeSplit, maybeCallNative) {
    var internalSplit;
    if (
      'abbc'.split(/(b)*/)[1] == 'c' ||
      'test'.split(/(?:)/, -1).length != 4 ||
      'ab'.split(/(?:ab)*/).length != 2 ||
      '.'.split(/(.?)(.?)/).length != 4 ||
      '.'.split(/()()/).length > 1 ||
      ''.split(/.?/).length
    ) {
      // based on es5-shim implementation, need to rework it
      internalSplit = function (separator, limit) {
        var string = String(requireObjectCoercible(this));
        var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
        if (lim === 0) return [];
        if (separator === undefined) return [string];
        // If `separator` is not a regex, use native split
        if (!isRegexp(separator)) {
          return nativeSplit.call(string, separator, lim);
        }
        var output = [];
        var flags = (separator.ignoreCase ? 'i' : '') +
                    (separator.multiline ? 'm' : '') +
                    (separator.unicode ? 'u' : '') +
                    (separator.sticky ? 'y' : '');
        var lastLastIndex = 0;
        // Make `global` and avoid `lastIndex` issues by working with a copy
        var separatorCopy = new RegExp(separator.source, flags + 'g');
        var match, lastIndex, lastLength;
        while (match = regexpExec.call(separatorCopy, string)) {
          lastIndex = separatorCopy.lastIndex;
          if (lastIndex > lastLastIndex) {
            output.push(string.slice(lastLastIndex, match.index));
            if (match.length > 1 && match.index < string.length) arrayPush.apply(output, match.slice(1));
            lastLength = match[0].length;
            lastLastIndex = lastIndex;
            if (output.length >= lim) break;
          }
          if (separatorCopy.lastIndex === match.index) separatorCopy.lastIndex++; // Avoid an infinite loop
        }
        if (lastLastIndex === string.length) {
          if (lastLength || !separatorCopy.test('')) output.push('');
        } else output.push(string.slice(lastLastIndex));
        return output.length > lim ? output.slice(0, lim) : output;
      };
    // Chakra, V8
    } else if ('0'.split(undefined, 0).length) {
      internalSplit = function (separator, limit) {
        return separator === undefined && limit === 0 ? [] : nativeSplit.call(this, separator, limit);
      };
    } else internalSplit = nativeSplit;

    return [
      // `String.prototype.split` method
      // https://tc39.github.io/ecma262/#sec-string.prototype.split
      function split(separator, limit) {
        var O = requireObjectCoercible(this);
        var splitter = separator == undefined ? undefined : separator[SPLIT];
        return splitter !== undefined
          ? splitter.call(separator, O, limit)
          : internalSplit.call(String(O), separator, limit);
      },
      // `RegExp.prototype[@@split]` method
      // https://tc39.github.io/ecma262/#sec-regexp.prototype-@@split
      //
      // NOTE: This cannot be properly polyfilled in engines that don't support
      // the 'y' flag.
      function (regexp, limit) {
        var res = maybeCallNative(internalSplit, regexp, this, limit, internalSplit !== nativeSplit);
        if (res.done) return res.value;

        var rx = anObject(regexp);
        var S = String(this);
        var C = speciesConstructor(rx, RegExp);

        var unicodeMatching = rx.unicode;
        var flags = (rx.ignoreCase ? 'i' : '') +
                    (rx.multiline ? 'm' : '') +
                    (rx.unicode ? 'u' : '') +
                    (SUPPORTS_Y ? 'y' : 'g');

        // ^(? + rx + ) is needed, in combination with some S slicing, to
        // simulate the 'y' flag.
        var splitter = new C(SUPPORTS_Y ? rx : '^(?:' + rx.source + ')', flags);
        var lim = limit === undefined ? MAX_UINT32 : limit >>> 0;
        if (lim === 0) return [];
        if (S.length === 0) return regexpExecAbstract(splitter, S) === null ? [S] : [];
        var p = 0;
        var q = 0;
        var A = [];
        while (q < S.length) {
          splitter.lastIndex = SUPPORTS_Y ? q : 0;
          var z = regexpExecAbstract(splitter, SUPPORTS_Y ? S : S.slice(q));
          var e;
          if (
            z === null ||
            (e = min$4(toLength(splitter.lastIndex + (SUPPORTS_Y ? 0 : q)), S.length)) === p
          ) {
            q = advanceStringIndex(S, q, unicodeMatching);
          } else {
            A.push(S.slice(p, q));
            if (A.length === lim) return A;
            for (var i = 1; i <= z.length - 1; i++) {
              A.push(z[i]);
              if (A.length === lim) return A;
            }
            q = p = e;
          }
        }
        A.push(S.slice(p));
        return A;
      }
    ];
  }, !SUPPORTS_Y);

  var defineProperty$5 = objectDefineProperty.f;








  var fastKey = internalMetadata.fastKey;


  var setInternalState$5 = internalState.set;
  var internalStateGetterFor$1 = internalState.getterFor;

  var collectionStrong = {
    getConstructor: function (wrapper, CONSTRUCTOR_NAME, IS_MAP, ADDER) {
      var C = wrapper(function (that, iterable) {
        anInstance(that, C, CONSTRUCTOR_NAME);
        setInternalState$5(that, {
          type: CONSTRUCTOR_NAME,
          index: objectCreate(null),
          first: undefined,
          last: undefined,
          size: 0
        });
        if (!descriptors) that.size = 0;
        if (iterable != undefined) iterate_1(iterable, that[ADDER], that, IS_MAP);
      });

      var getInternalState = internalStateGetterFor$1(CONSTRUCTOR_NAME);

      var define = function (that, key, value) {
        var state = getInternalState(that);
        var entry = getEntry(that, key);
        var previous, index;
        // change existing entry
        if (entry) {
          entry.value = value;
        // create new entry
        } else {
          state.last = entry = {
            index: index = fastKey(key, true),
            key: key,
            value: value,
            previous: previous = state.last,
            next: undefined,
            removed: false
          };
          if (!state.first) state.first = entry;
          if (previous) previous.next = entry;
          if (descriptors) state.size++;
          else that.size++;
          // add to index
          if (index !== 'F') state.index[index] = entry;
        } return that;
      };

      var getEntry = function (that, key) {
        var state = getInternalState(that);
        // fast case
        var index = fastKey(key);
        var entry;
        if (index !== 'F') return state.index[index];
        // frozen object case
        for (entry = state.first; entry; entry = entry.next) {
          if (entry.key == key) return entry;
        }
      };

      redefineAll(C.prototype, {
        // 23.1.3.1 Map.prototype.clear()
        // 23.2.3.2 Set.prototype.clear()
        clear: function clear() {
          var that = this;
          var state = getInternalState(that);
          var data = state.index;
          var entry = state.first;
          while (entry) {
            entry.removed = true;
            if (entry.previous) entry.previous = entry.previous.next = undefined;
            delete data[entry.index];
            entry = entry.next;
          }
          state.first = state.last = undefined;
          if (descriptors) state.size = 0;
          else that.size = 0;
        },
        // 23.1.3.3 Map.prototype.delete(key)
        // 23.2.3.4 Set.prototype.delete(value)
        'delete': function (key) {
          var that = this;
          var state = getInternalState(that);
          var entry = getEntry(that, key);
          if (entry) {
            var next = entry.next;
            var prev = entry.previous;
            delete state.index[entry.index];
            entry.removed = true;
            if (prev) prev.next = next;
            if (next) next.previous = prev;
            if (state.first == entry) state.first = next;
            if (state.last == entry) state.last = prev;
            if (descriptors) state.size--;
            else that.size--;
          } return !!entry;
        },
        // 23.2.3.6 Set.prototype.forEach(callbackfn, thisArg = undefined)
        // 23.1.3.5 Map.prototype.forEach(callbackfn, thisArg = undefined)
        forEach: function forEach(callbackfn /* , that = undefined */) {
          var state = getInternalState(this);
          var boundFunction = functionBindContext(callbackfn, arguments.length > 1 ? arguments[1] : undefined, 3);
          var entry;
          while (entry = entry ? entry.next : state.first) {
            boundFunction(entry.value, entry.key, this);
            // revert to the last existing entry
            while (entry && entry.removed) entry = entry.previous;
          }
        },
        // 23.1.3.7 Map.prototype.has(key)
        // 23.2.3.7 Set.prototype.has(value)
        has: function has(key) {
          return !!getEntry(this, key);
        }
      });

      redefineAll(C.prototype, IS_MAP ? {
        // 23.1.3.6 Map.prototype.get(key)
        get: function get(key) {
          var entry = getEntry(this, key);
          return entry && entry.value;
        },
        // 23.1.3.9 Map.prototype.set(key, value)
        set: function set(key, value) {
          return define(this, key === 0 ? 0 : key, value);
        }
      } : {
        // 23.2.3.1 Set.prototype.add(value)
        add: function add(value) {
          return define(this, value = value === 0 ? 0 : value, value);
        }
      });
      if (descriptors) defineProperty$5(C.prototype, 'size', {
        get: function () {
          return getInternalState(this).size;
        }
      });
      return C;
    },
    setStrong: function (C, CONSTRUCTOR_NAME, IS_MAP) {
      var ITERATOR_NAME = CONSTRUCTOR_NAME + ' Iterator';
      var getInternalCollectionState = internalStateGetterFor$1(CONSTRUCTOR_NAME);
      var getInternalIteratorState = internalStateGetterFor$1(ITERATOR_NAME);
      // add .keys, .values, .entries, [@@iterator]
      // 23.1.3.4, 23.1.3.8, 23.1.3.11, 23.1.3.12, 23.2.3.5, 23.2.3.8, 23.2.3.10, 23.2.3.11
      defineIterator(C, CONSTRUCTOR_NAME, function (iterated, kind) {
        setInternalState$5(this, {
          type: ITERATOR_NAME,
          target: iterated,
          state: getInternalCollectionState(iterated),
          kind: kind,
          last: undefined
        });
      }, function () {
        var state = getInternalIteratorState(this);
        var kind = state.kind;
        var entry = state.last;
        // revert to the last existing entry
        while (entry && entry.removed) entry = entry.previous;
        // get next entry
        if (!state.target || !(state.last = entry = entry ? entry.next : state.state.first)) {
          // or finish the iteration
          state.target = undefined;
          return { value: undefined, done: true };
        }
        // return step by kind
        if (kind == 'keys') return { value: entry.key, done: false };
        if (kind == 'values') return { value: entry.value, done: false };
        return { value: [entry.key, entry.value], done: false };
      }, IS_MAP ? 'entries' : 'values', !IS_MAP, true);

      // add [@@species], 23.1.2.2, 23.2.2.2
      setSpecies(CONSTRUCTOR_NAME);
    }
  };

  // `Map` constructor
  // https://tc39.github.io/ecma262/#sec-map-objects
  var es_map = collection('Map', function (init) {
    return function Map() { return init(this, arguments.length ? arguments[0] : undefined); };
  }, collectionStrong);

  // `Set` constructor
  // https://tc39.github.io/ecma262/#sec-set-objects
  var es_set = collection('Set', function (init) {
    return function Set() { return init(this, arguments.length ? arguments[0] : undefined); };
  }, collectionStrong);

  // `FlattenIntoArray` abstract operation
  // https://tc39.github.io/proposal-flatMap/#sec-FlattenIntoArray
  var flattenIntoArray = function (target, original, source, sourceLen, start, depth, mapper, thisArg) {
    var targetIndex = start;
    var sourceIndex = 0;
    var mapFn = mapper ? functionBindContext(mapper, thisArg, 3) : false;
    var element;

    while (sourceIndex < sourceLen) {
      if (sourceIndex in source) {
        element = mapFn ? mapFn(source[sourceIndex], sourceIndex, original) : source[sourceIndex];

        if (depth > 0 && isArray(element)) {
          targetIndex = flattenIntoArray(target, original, element, toLength(element.length), targetIndex, depth - 1) - 1;
        } else {
          if (targetIndex >= 0x1FFFFFFFFFFFFF) throw TypeError('Exceed the acceptable array length');
          target[targetIndex] = element;
        }

        targetIndex++;
      }
      sourceIndex++;
    }
    return targetIndex;
  };

  var flattenIntoArray_1 = flattenIntoArray;

  // `Array.prototype.flatMap` method
  // https://github.com/tc39/proposal-flatMap
  _export({ target: 'Array', proto: true }, {
    flatMap: function flatMap(callbackfn /* , thisArg */) {
      var O = toObject(this);
      var sourceLen = toLength(O.length);
      var A;
      aFunction$1(callbackfn);
      A = arraySpeciesCreate(O, 0);
      A.length = flattenIntoArray_1(A, O, O, sourceLen, 0, 1, callbackfn, arguments.length > 1 ? arguments[1] : undefined);
      return A;
    }
  });

  // this method was added to unscopables after implementation
  // in popular engines, so it's moved to a separate module


  addToUnscopables('flatMap');

  var defineProperty$6 = objectDefineProperty.f;

  var FunctionPrototype = Function.prototype;
  var FunctionPrototypeToString = FunctionPrototype.toString;
  var nameRE = /^\s*function ([^ (]*)/;
  var NAME = 'name';

  // Function instances `.name` property
  // https://tc39.github.io/ecma262/#sec-function-instances-name
  if (descriptors && !(NAME in FunctionPrototype)) {
    defineProperty$6(FunctionPrototype, NAME, {
      configurable: true,
      get: function () {
        try {
          return FunctionPrototypeToString.call(this).match(nameRE)[1];
        } catch (error) {
          return '';
        }
      }
    });
  }

  function _typeof(obj) {
    "@babel/helpers - typeof";

    if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") {
      _typeof = function (obj) {
        return typeof obj;
      };
    } else {
      _typeof = function (obj) {
        return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
      };
    }

    return _typeof(obj);
  }

  function _classCallCheck$1(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError("Cannot call a class as a function");
    }
  }

  function _defineProperties$1(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  function _createClass$1(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties$1(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties$1(Constructor, staticProps);
    return Constructor;
  }

  function _defineProperty$1(obj, key, value) {
    if (key in obj) {
      Object.defineProperty(obj, key, {
        value: value,
        enumerable: true,
        configurable: true,
        writable: true
      });
    } else {
      obj[key] = value;
    }

    return obj;
  }

  function ownKeys$1(object, enumerableOnly) {
    var keys = Object.keys(object);

    if (Object.getOwnPropertySymbols) {
      var symbols = Object.getOwnPropertySymbols(object);
      if (enumerableOnly) symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
      keys.push.apply(keys, symbols);
    }

    return keys;
  }

  function _objectSpread2(target) {
    for (var i = 1; i < arguments.length; i++) {
      var source = arguments[i] != null ? arguments[i] : {};

      if (i % 2) {
        ownKeys$1(Object(source), true).forEach(function (key) {
          _defineProperty$1(target, key, source[key]);
        });
      } else if (Object.getOwnPropertyDescriptors) {
        Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
      } else {
        ownKeys$1(Object(source)).forEach(function (key) {
          Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
        });
      }
    }

    return target;
  }

  function _inherits(subClass, superClass) {
    if (typeof superClass !== "function" && superClass !== null) {
      throw new TypeError("Super expression must either be null or a function");
    }

    subClass.prototype = Object.create(superClass && superClass.prototype, {
      constructor: {
        value: subClass,
        writable: true,
        configurable: true
      }
    });
    if (superClass) _setPrototypeOf(subClass, superClass);
  }

  function _getPrototypeOf(o) {
    _getPrototypeOf = Object.setPrototypeOf ? Object.getPrototypeOf : function _getPrototypeOf(o) {
      return o.__proto__ || Object.getPrototypeOf(o);
    };
    return _getPrototypeOf(o);
  }

  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf || function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };

    return _setPrototypeOf(o, p);
  }

  function _isNativeReflectConstruct() {
    if (typeof Reflect === "undefined" || !Reflect.construct) return false;
    if (Reflect.construct.sham) return false;
    if (typeof Proxy === "function") return true;

    try {
      Date.prototype.toString.call(Reflect.construct(Date, [], function () {}));
      return true;
    } catch (e) {
      return false;
    }
  }

  function _assertThisInitialized(self) {
    if (self === void 0) {
      throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
    }

    return self;
  }

  function _possibleConstructorReturn(self, call) {
    if (call && (typeof call === "object" || typeof call === "function")) {
      return call;
    }

    return _assertThisInitialized(self);
  }

  function _createSuper(Derived) {
    var hasNativeReflectConstruct = _isNativeReflectConstruct();

    return function _createSuperInternal() {
      var Super = _getPrototypeOf(Derived),
          result;

      if (hasNativeReflectConstruct) {
        var NewTarget = _getPrototypeOf(this).constructor;

        result = Reflect.construct(Super, arguments, NewTarget);
      } else {
        result = Super.apply(this, arguments);
      }

      return _possibleConstructorReturn(this, result);
    };
  }

  function _slicedToArray(arr, i) {
    return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray$1(arr, i) || _nonIterableRest();
  }

  function _toConsumableArray(arr) {
    return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray$1(arr) || _nonIterableSpread();
  }

  function _arrayWithoutHoles(arr) {
    if (Array.isArray(arr)) return _arrayLikeToArray$1(arr);
  }

  function _arrayWithHoles(arr) {
    if (Array.isArray(arr)) return arr;
  }

  function _iterableToArray(iter) {
    if (typeof Symbol !== "undefined" && Symbol.iterator in Object(iter)) return Array.from(iter);
  }

  function _iterableToArrayLimit(arr, i) {
    if (typeof Symbol === "undefined" || !(Symbol.iterator in Object(arr))) return;
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"] != null) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  function _unsupportedIterableToArray$1(o, minLen) {
    if (!o) return;
    if (typeof o === "string") return _arrayLikeToArray$1(o, minLen);
    var n = Object.prototype.toString.call(o).slice(8, -1);
    if (n === "Object" && o.constructor) n = o.constructor.name;
    if (n === "Map" || n === "Set") return Array.from(o);
    if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray$1(o, minLen);
  }

  function _arrayLikeToArray$1(arr, len) {
    if (len == null || len > arr.length) len = arr.length;

    for (var i = 0, arr2 = new Array(len); i < len; i++) arr2[i] = arr[i];

    return arr2;
  }

  function _nonIterableSpread() {
    throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _nonIterableRest() {
    throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
  }

  function _createForOfIteratorHelper$1(o, allowArrayLike) {
    var it;

    if (typeof Symbol === "undefined" || o[Symbol.iterator] == null) {
      if (Array.isArray(o) || (it = _unsupportedIterableToArray$1(o)) || allowArrayLike && o && typeof o.length === "number") {
        if (it) o = it;
        var i = 0;

        var F = function () {};

        return {
          s: F,
          n: function () {
            if (i >= o.length) return {
              done: true
            };
            return {
              done: false,
              value: o[i++]
            };
          },
          e: function (e) {
            throw e;
          },
          f: F
        };
      }

      throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
    }

    var normalCompletion = true,
        didErr = false,
        err;
    return {
      s: function () {
        it = o[Symbol.iterator]();
      },
      n: function () {
        var step = it.next();
        normalCompletion = step.done;
        return step;
      },
      e: function (e) {
        didErr = true;
        err = e;
      },
      f: function () {
        try {
          if (!normalCompletion && it.return != null) it.return();
        } finally {
          if (didErr) throw err;
        }
      }
    };
  }

  var VM_FN_PARAM = Symbol('param');

  var vmError = function vmError(a) {
    throw new Error(a);
  };

  var ERRS = ' (error)';
  var VMFun = /*#__PURE__*/function () {
    function VMFun(body, params, bodyName) {
      _classCallCheck$1(this, VMFun);

      this.params = params; // we rename the function the body is bound to for better debug info

      this.bodyName = bodyName.toString();

      if (this.bodyName in this) {
        // prevent overriding intrinsics
        this.bodyName += '~';
      }

      this[this.bodyName] = body;
      this[this.bodyName + ERRS] = vmError;
    }

    _createClass$1(VMFun, [{
      key: "apply",
      value: function apply(_, args) {
        if (args.length !== this.params.length) {
          this[this.bodyName + ERRS]("Function expected ".concat(this.params.length, " argument(s), got ").concat(args.length, " argument(s)"));
        }

        var params = {};

        for (var i = 0; i < this.params.length; i++) {
          var arg = args[i];
          if (arg === undefined) this[this.bodyName + ERRS]("Undefined argument at index ".concat(i));
          params[this.params[i]] = {
            t: VM_FN_PARAM,
            v: arg
          };
        }

        return this[this.bodyName](params);
      }
    }, {
      key: "length",
      get: function get() {
        return this.params.length;
      }
    }, {
      key: "body",
      get: function get() {
        return this[this.bodyName];
      }
    }]);

    return VMFun;
  }(); // vm function with native body, for use in stdlib

  var NVMFun = /*#__PURE__*/function (_VMFun) {
    _inherits(NVMFun, _VMFun);

    var _super = _createSuper(NVMFun);

    function NVMFun(body, name) {
      _classCallCheck$1(this, NVMFun);

      return _super.call(this, body, 'abcdefghijklmnopqrstuvwxyz'.split('').slice(0, body.length), name);
    }

    _createClass$1(NVMFun, [{
      key: "apply",
      value: function apply(_, args) {
        if (args.length !== this.body.length) {
          this[this.bodyName + ERRS]("Function expected ".concat(this.params.length, " argument(s), got ").concat(args.length, " argument(s)"));
        }

        for (var i = 0; i < this.body.length; i++) {
          var arg = args[i];
          if (arg === undefined) this[this.bodyName + ERRS]("Undefined argument at index ".concat(i));
        }

        return this.body.apply(this, _toConsumableArray(args));
      }
    }, {
      key: "length",
      get: function get() {
        return this.body.length;
      }
    }]);

    return NVMFun;
  }(VMFun);

  var currencies = {
    USD: 100,
    AUD: 100,
    CAD: 100,
    CHF: 100,
    DKK: 100,
    EUR: 100,
    GBP: 100,
    HKD: 100,
    JPY: 1,
    MXN: 100,
    MYR: 100,
    NOK: 100,
    NZD: 100,
    PLN: 100,
    SEK: 100,
    SGD: 100
  };
  var months = ['januaro', 'februaro', 'marto', 'aprilo', 'majo', 'junio', 'julio', 'aŭgusto', 'septembro', 'oktobro', 'novembro', 'decembro']; /// Compares a with b. Will deep-compare objects and arrays and return false for type mismatches.

  function eq(a, b) {
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;

      for (var i = 0; i < a.length; i++) {
        if (!eq(a[i], b[i])) return false;
      }

      return true;
    } else if (_typeof(a) === 'object' && _typeof(b) === 'object' && a !== null && b !== null) {
      var ka = Object.keys(a);
      var kb = Object.keys(b);
      if (!eq(ka, kb)) return false;

      for (var _i = 0, _ka = ka; _i < _ka.length; _i++) {
        var k = _ka[_i];
        if (!eq(a[k], b[k])) return false;
      }

      return true;
    } else return a === b;
  } /// “mapifies” a value so that it is guaranteed to be callable.
  /// also handles lazy parameters


  var mapify = function mapify(f) {
    return typeof f === 'function' || f instanceof VMFun ? function () {
      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      return f.apply(null, args);
    } : function (_) {
      return f;
    };
  }; /// “flatmapifies” a value so that it is guaranteed to be callable and return an array


  var flatmapify = function flatmapify(f) {
    var df = mapify(f);
    return function (a) {
      var res = df(a);
      if (Array.isArray(res) || typeof res === 'string') return res;
      return [res];
    };
  }; /// Defines a binary operation taking two parameters


  function defBin(ty) {
    return function defBinInner(f) {
      var z = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;
      return function (a, b) {
        if (_typeof(a) !== ty) return z;
        if (_typeof(b) !== ty) return z;
        return f(a, b);
      };
    };
  }

  var defBinMath = defBin('number');
  var defBinBin = defBin('boolean');

  function defCmp(f) {
    return function (a, b) {
      if (typeof a === 'string' && typeof b === 'string') return f(a > b ? 1 : a < b ? -1 : 0);
      if (typeof a === 'number' && typeof b === 'number') return f(a - b);
      return false;
    };
  } /// Defines a unary operation taking one parameter


  function defUn(f, ty) {
    var z = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    return function (a) {
      return _typeof(a) === ty ? f(a) : z;
    };
  }

  var defUnMath = function defUnMath(f) {
    return defUn(f, 'number');
  };

  function concatenate(a, b) {
    if (typeof a === 'string' && typeof b === 'string') return a + b; // turn it into arrays!

    if (Array.isArray(a)) ;else if (typeof a === 'string') a = a.split('');else a = [a];
    if (Array.isArray(b)) ;else if (typeof b === 'string') b = b.split('');else b = [b];
    return a.concat(b);
  }

  var stdlibExt = {
    getCountryName: null,
    formatCurrency: null,
    libphonenumber: null
  };
  var extras = {
    // sum a = fold (+) 0 a
    sum: {
      t: 'f',
      p: ['a'],
      b: {
        _0: {
          t: 'n',
          v: 0
        },
        '=': {
          t: 'c',
          f: 'fold',
          a: ['+', '_0', 'a']
        }
      }
    },
    // min a = fold1 (\a b -> if (a < b) a b) a
    min: {
      t: 'f',
      p: ['a'],
      b: {
        'm': {
          t: 'f',
          p: ['a', 'b'],
          b: {
            c: {
              t: 'c',
              f: '<',
              a: ['a', 'b']
            },
            '=': {
              t: 'w',
              m: [{
                c: 'c',
                v: 'a'
              }, {
                v: 'b'
              }]
            }
          }
        },
        '=': {
          t: 'c',
          f: 'fold1',
          a: ['m', 'a']
        }
      }
    },
    // max a = fold1 (\a b -> if (a > b) a b) a
    max: {
      t: 'f',
      p: ['a'],
      b: {
        'm': {
          t: 'f',
          p: ['a', 'b'],
          b: {
            c: {
              t: 'c',
              f: '>',
              a: ['a', 'b']
            },
            '=': {
              t: 'w',
              m: [{
                c: 'c',
                v: 'a'
              }, {
                v: 'b'
              }]
            }
          }
        },
        '=': {
          t: 'c',
          f: 'fold1',
          a: ['m', 'a']
        }
      }
    },
    // avg a = (sum a) / (length a)
    avg: {
      t: 'f',
      p: ['a'],
      b: {
        s: {
          t: 'c',
          f: 'sum',
          a: ['a']
        },
        l: {
          t: 'c',
          f: 'length',
          a: ['a']
        },
        '=': {
          t: 'c',
          f: '/',
          a: ['s', 'l']
        }
      }
    },
    // med a = let b = sort a, l = length a in
    //     if (l `mod` 2 == 0) {
    //         avg (map (index b) [l / 2 - 1, l / 2])
    //     } {
    //         index b (floor (l / 2))
    //     }
    med: {
      t: 'f',
      p: ['a'],
      b: {
        _0: {
          t: 'n',
          v: 0
        },
        _1: {
          t: 'n',
          v: 1
        },
        _2: {
          t: 'n',
          v: 2
        },
        // if (length is mod 2) (_ifmod2) (_else)
        '=': {
          t: 'w',
          m: [{
            c: '_ismod2',
            v: '_ifmod2'
          }, {
            v: '_else'
          }]
        },
        // length of input
        _l: {
          t: 'c',
          f: 'length',
          a: ['a']
        },
        // sorted input
        _b: {
          t: 'c',
          f: 'sort',
          a: ['a']
        },
        // length is mod 2?
        _ismod2: {
          t: 'c',
          f: '==',
          a: ['_lmod2', '_0']
        },
        // length mod 2
        _lmod2: {
          t: 'c',
          f: 'mod',
          a: ['_l', '_2']
        },
        // function that indexes sorted input
        _indexb: {
          t: 'c',
          f: 'index',
          a: ['_b']
        },
        // if mod 2, average center values
        _ifmod2: {
          t: 'c',
          f: 'avg',
          a: ['_avgmap']
        },
        // map indices to values
        _avgmap: {
          t: 'c',
          f: 'map',
          'a': ['_indexb', '_avglist']
        },
        // indices l/2 - 1 and l/2
        _avglist: {
          t: 'l',
          v: ['_l/2-1', '_l/2']
        },
        '_l/2': {
          t: 'c',
          f: '/',
          a: ['_l', '_2']
        },
        '_l/2-1': {
          t: 'c',
          f: '-',
          'a': ['_l/2', '_1']
        },
        // else index at floor (l / 2)
        _else: {
          t: 'c',
          f: '_indexb',
          a: ['_fl/2']
        },
        '_fl/2': {
          t: 'c',
          f: 'floor',
          a: ['_l/2']
        }
      }
    }
  };

  var nvmify = function nvmify(a) {
    var out = {};

    for (var k in a) {
      if (typeof a[k] === 'function') out[k] = new NVMFun(a[k], k);else out[k] = a[k];
    }

    return out;
  };

  var stdlib = nvmify(_objectSpread2({
    '+': defBinMath(function (a, b) {
      return a + b;
    }),
    '-': defBinMath(function (a, b) {
      return a - b;
    }),
    '*': defBinMath(function (a, b) {
      return a * b;
    }),
    '/': defBinMath(function (a, b) {
      return b === 0 ? 0 : a / b;
    }),
    '^': defBinMath(function (a, b) {
      return Math.pow(a, b);
    }),
    mod: defBinMath(function (a, b) {
      if (b === 0) return 0;
      var pa = Math.sign(b) * a;
      var pb = Math.abs(b);
      return (pa % pb + pb) % pb;
    }),
    floor: defUnMath(Math.floor),
    ceil: defUnMath(Math.ceil),
    round: defUnMath(Math.round),
    trunc: defUnMath(Math.trunc),
    sign: defUnMath(Math.sign),
    abs: defUnMath(Math.abs),
    '==': function _(a, b) {
      return eq(a, b);
    },
    '!=': function _(a, b) {
      return !eq(a, b);
    },
    '>': defCmp(function (a) {
      return a > 0;
    }),
    '<': defCmp(function (a) {
      return a < 0;
    }),
    '>=': defCmp(function (a) {
      return a >= 0;
    }),
    '<=': defCmp(function (a) {
      return a <= 0;
    }),
    and: defBinBin(function (a, b) {
      return a && b;
    }, false),
    or: defBinBin(function (a, b) {
      return a || b;
    }, false),
    not: defUn(function (a) {
      return !a;
    }, 'boolean', false),
    xor: defBinBin(function (a, b) {
      return !!(a ^ b);
    }, false),
    '++': function _(a, b) {
      return concatenate(a, b);
    },
    map: function map(f, a) {
      if (a === null) return null;

      if (a[Symbol.iterator]) {
        // iterable type (string or array)
        var items = _toConsumableArray(a);

        if (!items.length) return a;
        var df = mapify(f);
        return items.map(function (item) {
          return df(item);
        });
      } // not an iterable; just map directly


      return mapify(f)(a);
    },
    flat_map: function flat_map(f, a) {
      if (a === null) return null;

      if (a[Symbol.iterator]) {
        var items = _toConsumableArray(a);

        if (!items.length) return a;
        var df = flatmapify(f);

        var _mapped = items.map(function (item) {
          return df(item);
        });

        return _mapped.length ? _mapped.reduce(concatenate) : typeof a === 'string' ? '' : [];
      }

      var mapped = flatmapify(f)(a);
      return mapped.length ? mapped.reduce(concatenate) : typeof a === 'string' ? '' : [];
    },
    fold: function fold(f, r, a) {
      if (a === null) return null;
      var df = mapify(f);
      var ac = r;

      if (a[Symbol.iterator]) {
        var _iterator = _createForOfIteratorHelper$1(a),
            _step;

        try {
          for (_iterator.s(); !(_step = _iterator.n()).done;) {
            var item = _step.value;
            ac = df(ac, item);
          }
        } catch (err) {
          _iterator.e(err);
        } finally {
          _iterator.f();
        }
      } else {
        ac = df(ac, a);
      }

      return ac;
    },
    fold1: function fold1(f, a) {
      if (a === null || !a[Symbol.iterator]) return null;

      var items = _toConsumableArray(a);

      if (!items.length) return null;
      var df = mapify(f);
      var ac = items[0];

      for (var i = 1; i < items.length; i++) {
        ac = df(ac, items[i]);
      }

      return ac;
    },
    filter: function filter(f, a) {
      if (a === null || !a[Symbol.iterator]) return null;

      var items = _toConsumableArray(a);

      if (!items.length) return a;
      var df = mapify(f);
      var filtered = items.filter(function (a) {
        return df(a) === true;
      });

      if (typeof a === 'string') {
        // turn it back into a string
        return filtered.join('');
      }

      return filtered;
    },
    index: function index(a, b) {
      if (typeof a !== 'string' && !Array.isArray(a) || !a.length) return null;
      if (b === null || typeof b !== 'number' || (b | 0) !== b || b < 0 || b >= a.length) return null;
      return a[b];
    },
    length: function length(a) {
      if (typeof a !== 'string' && !Array.isArray(a)) return null;
      return a.length;
    },
    contains: function contains(a, b) {
      if (typeof a === 'string') {
        if (typeof b !== 'string') return false;
        return a.includes(b);
      } else if (Array.isArray(a)) {
        if (!a.length) return false;

        var _iterator2 = _createForOfIteratorHelper$1(a),
            _step2;

        try {
          for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
            var item = _step2.value;
            if (eq(item, b)) return true;
          }
        } catch (err) {
          _iterator2.e(err);
        } finally {
          _iterator2.f();
        }

        return false;
      }

      return false;
    },
    head: function head(a, b) {
      if (a === null || !a[Symbol.iterator]) return null;
      if (typeof b !== 'number') return null;

      var items = _toConsumableArray(a);

      items.splice(b);
      if (typeof a === 'string') return items.join('');
      return items;
    },
    tail: function tail(a, b) {
      if (a === null || !a[Symbol.iterator]) return null;
      if (typeof b !== 'number') return null;

      var items = _toConsumableArray(a);

      items = items.splice(b);
      if (typeof a === 'string') return items.join('');
      return items;
    },
    sort: function sort(a) {
      if (a === null || !a[Symbol.iterator]) return null;

      var items = _toConsumableArray(a);

      items.sort(function (a, b) {
        if (typeof a === 'number' && typeof b === 'number') return a - b;
        if (typeof a === 'string' && typeof b === 'string') return a > b ? 1 : a < b ? -1 : 0;
        return 0;
      });
      if (typeof a === 'string') return items.join('');
      return items;
    },
    date_sub: function date_sub(t, a, b) {
      if (t !== 'years' && t !== 'months' && t !== 'weeks' && t !== 'days') return null;
      var da = parseDateString(a);
      var db = parseDateString(b);
      if (da === null || db === null) return null;
      if (t === 'years') return subMonths(da, db) / 12;else if (t === 'months') return subMonths(da, db);else if (t === 'weeks') return (da - db) / (1000 * 86400 * 7);else if (t === 'days') return (da - db) / (1000 * 86400);
    },
    date_add: function date_add(t, a, b) {
      if (t !== 'years' && t !== 'months' && t !== 'weeks' && t !== 'days') return null;
      var da = parseDateString(a);
      if (da === null) return null;
      if (typeof b !== 'number') return null;
      if (t === 'years') da.setFullYear(da.getFullYear() + b);else if (t === 'months') da.setMonth(da.getMonth() + b);else if (t === 'weeks') da.setDate(da.getDate() + b * 7);else if (t === 'days') da.setDate(da.getDate() + b);
      return dateToString(da);
    },
    date_get: function date_get(t, a) {
      var da = parseDateString(a);
      if (da === null) return null;
      if (t === 'y') return da.getFullYear();else if (t === 'M') return da.getMonth() + 1;else if (t === 'd') return da.getDate();
      return null;
    },
    date_set: function date_set(t, a, b) {
      if (t !== 'y' && t !== 'M' && t !== 'd') return null;
      var da = parseDateString(a);
      if (da === null) return null;
      if (t === 'y') da.setFullYear(b);else if (t === 'M') da.setMonth(b - 1);else if (t === 'd') da.setDate(b);
      return dateToString(da);
    },

    get date_today() {
      return {
        t: 's',
        v: dateToString(new Date())
      };
    },

    date_fmt: function date_fmt(a) {
      var da = parseDateString(a);
      if (da === null) return null;
      return formatDate(da);
    },
    ts_now: function ts_now() {
      return new Date();
    },
    tz_utc: {
      t: 'n',
      v: 0
    },
    tz_local: function tz_local() {
      return new Date().getTimezoneOffset();
    },
    ts_from_unix: function ts_from_unix(a) {
      if (typeof a !== 'number') return null;
      return new Date(Math.floor(a * 1000));
    },
    ts_to_unix: function ts_to_unix(a) {
      if (!a || !(a instanceof Date)) return null;
      return Math.floor(a.getTime() / 1000);
    },
    ts_from_date: function ts_from_date(a, tz, h, m, s) {
      if (typeof tz !== 'number' || typeof h !== 'number' || typeof m !== 'number' || typeof s !== 'number') return null;
      if (parseDateString(a) === null) return null;
      var da = new Date("".concat(a, "T00:00:00").concat(timezoneOffsetString(tz)));
      da.setHours(da.getHours() + h);
      da.setMinutes(da.getMinutes() + m);
      da.setSeconds(da.getSeconds() + s);
      return da;
    },
    ts_to_date: function ts_to_date(a, tz) {
      if (!a || !(a instanceof Date) || typeof tz !== 'number') return null; // add the time zone offset to a such that we're basically rotating the desired time zone
      // to UTC

      var da = new Date(+a + tz * 60000);
      return da.toISOString().split('T')[0];
    },
    ts_parse: function ts_parse(a) {
      if (typeof a !== 'string') return null;
      var da = new Date(a);
      if (!Number.isFinite(da.getFullYear())) return null;
      return da;
    },
    ts_to_string: function ts_to_string(a) {
      if (!a || !(a instanceof Date)) return null;
      return a.toISOString();
    },
    ts_fmt: function ts_fmt(a) {
      if (!a || !(a instanceof Date)) return null;
      return formatDate(a) + ' ' + formatTime(a);
    },
    ts_add: function ts_add(t, a, b) {
      if (!'smhdwMy'.includes(t) || !a || !(a instanceof Date) || typeof b !== 'number') return null;
      var da = new Date(a);
      if (t === 's') da.setSeconds(da.getSeconds() + b);
      if (t === 'm') da.setMinutes(da.getMinutes() + b);
      if (t === 'h') da.setHours(da.getHours() + b);
      if (t === 'd') da.setDate(da.getDate() + b);
      if (t === 'w') da.setDate(da.getDate() + b * 7);
      if (t === 'M') da.setMonth(da.getMonth() + b);
      if (t === 'y') da.setFullYear(da.getFullYear() + b);
      return da;
    },
    ts_sub: function ts_sub(t, a, b) {
      if (!'smhdwMy'.includes(t) || !a || !(a instanceof Date) || !b || !(b instanceof Date)) return null;
      if (t === 's') return (a - b) / 1000;
      if (t === 'm') return (a - b) / (60 * 1000);
      if (t === 'h') return (a - b) / (3600 * 1000);
      if (t === 'd') return (a - b) / (86400 * 1000);
      if (t === 'w') return (a - b) / (7 * 86400 * 1000);
      if (t === 'M') return subMonths(a, b);
      if (t === 'y') return subMonths(a, b) / 12;
    },
    ts_get: function ts_get(t, tz, a) {
      if (!'smhdMy'.includes(t) || !a || !(a instanceof Date) || typeof tz !== 'number') return null; // add the time zone offset to a such that we're basically rotating the desired time zone
      // to UTC

      var da = new Date(+a + tz * 60000);
      if (t === 's') return da.getUTCSeconds();
      if (t === 'm') return da.getUTCMinutes();
      if (t === 'h') return da.getUTCHours();
      if (t === 'd') return da.getUTCDate();
      if (t === 'M') return da.getUTCMonth() + 1;
      if (t === 'y') return da.getUTCFullYear();
      return null;
    },
    ts_set: function ts_set(t, tz, a, b) {
      if (!'smhdMy'.includes(t) || !a || !(a instanceof Date) || typeof tz !== 'number' || typeof b !== 'number') return null; // add the time zone offset to a such that we're basically rotating the desired time zone
      // to UTC

      var da = new Date(+a + tz * 60000);
      if (t === 's') da.setUTCSeconds(b);
      if (t === 'm') da.setUTCMinutes(b);
      if (t === 'h') da.setUTCHours(b);
      if (t === 'd') da.setUTCDate(b);
      if (t === 'M') da.setUTCMonth(b - 1);
      if (t === 'y') da.setUTCFullYear(b); // rotate back

      return new Date(+da - tz * 60000);
    },
    currency_fmt: function currency_fmt(a, b) {
      if (!(a in currencies)) return null;
      if (typeof b !== 'number') return null;
      var number = b / currencies[a];
      var minFractionDigits = Math.floor(Math.log10(currencies[a]));
      if (stdlibExt.formatCurrency) return stdlibExt.formatCurrency(a, b, number);
      return number.toLocaleString('fr-FR', {
        style: 'currency',
        currency: a,
        currencyDisplay: 'code',
        minimumFractionDigits: minFractionDigits
      });
    },
    country_fmt: function country_fmt(a) {
      if (typeof a !== 'string') return null;
      if (!a.match(/^[a-z]{2}$/i)) return null;
      if (!stdlibExt.getCountryName) return null;
      return stdlibExt.getCountryName(a);
    },
    phone_fmt: function phone_fmt(a) {
      if (typeof a !== 'string') return null;
      if (!stdlibExt.libphonenumber) return null;

      try {
        var phoneUtil = stdlibExt.libphonenumber.PhoneNumberUtil.getInstance();
        var number = phoneUtil.parse(a);
        return phoneUtil.format(number, stdlibExt.libphonenumber.PhoneNumberFormat.INTERNATIONAL);
      } catch (_unused) {
        return null;
      }
    },
    id: function id(a) {
      return a;
    }
  }, extras));

  function parseDateString(s) {
    if (typeof s !== 'string') return null;
    var match = s.match(/^\d{4}-\d{2}-\d{2}$/);
    if (!match) return null;
    return new Date(s);
  }

  function padz(s, n) {
    return (s + n).substr(-s.length);
  }

  function dateToString(d) {
    return padz('0000', d.getUTCFullYear()) + '-' + padz('00', d.getUTCMonth() + 1) + '-' + padz('00', d.getUTCDate());
  }

  function timezoneOffsetString(tz) {
    tz = Math.round(tz % (12 * 60));
    if (!tz) return 'Z';
    var sign = tz > 0 ? '+' : '-';
    var atz = Math.abs(tz);
    var hours = Math.floor(atz / 60);
    var minutes = Math.floor(atz % 60);
    return sign + padz('00', hours) + padz('00', minutes);
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function subMonths(a, b) {
    var delta = (a.getFullYear() - b.getFullYear()) * 12 + (a.getMonth() - b.getMonth());
    var offsetB = new Date(b);
    offsetB.setMonth(offsetB.getMonth() + delta);

    if (a > offsetB) {
      // inside month: offsetB ----- a ----> time
      // need to add a->date - offsetB->date but normalized to the month
      var dayDiff = a.getDate() - offsetB.getDate();
      var totalDays = daysInMonth(a.getFullYear(), a.getMonth());
      delta += dayDiff / totalDays;
    } else {
      // inside month: a ----- offsetB ----> time
      // need to subtract offsetB->date - a->date but normalized to the month
      var _dayDiff = offsetB.getDate() - a.getDate();

      var _totalDays = daysInMonth(a.getFullYear(), a.getMonth());

      delta -= _dayDiff / _totalDays;
    }

    return delta;
  }

  function formatDate(d) {
    return d.getUTCDate() + '-a de ' + months[d.getUTCMonth()] + ', ' + d.getUTCFullYear();
  }

  function formatTime(date) {
    return padz('00', date.getUTCHours()) + ':' + padz('00', date.getUTCMinutes());
  }

  ///
  /// # Parameters
  /// - definitions: array of definitions objects. This is treated as a stack of definitions, and
  ///   any stack item may reference defs that come in stack items before it.
  ///   While this property does hold for underscore defs too in this implementation, this behavior
  ///   should not be relied upon.
  ///   There is an invisible bottommost stack item with the standard library.
  /// - id: definition name to evaluate (may refer to any stack item)
  /// - getFormValue: (name: string) => value:
  ///   will be used to get the value of @-prefixed identifiers.
  ///   value must be one of: null, bool, number, string, Date, or an array of any of these values
  ///   (including arrays, excluding Dates).
  /// - options: additional options (all optional)
  ///     - debug: set to 1 to print warnings
  ///     - shouldHalt: pass a closure that returns a boolean when called to limit the allowed time
  ///       for which the script may run. Note that this will be called very often and should hence
  ///       be fast to compute. Halting this way will throw an error.
  ///
  /// This function will throw if it encounters unknown definitions.
  ///
  /// NOTE: to use country_fmt and phone_fmt, also load akso-script/country_fmt and
  /// akso-script/phone_fmt. The stdlib functions will always return null otherwise.
  ///
  /// Browser-compatible variant: use loadCountryFmt/loadPhoneFmt from this module.

  function evaluate(definitions, id, getFormValue) {
    var options = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : {};
    var context = {
      getFormValue: getFormValue,
      debug: options.debug,
      shouldHalt: options.shouldHalt || function () {
        return false;
      },
      caches: [new WeakMap()]
    };
    var stack = [stdlib].concat(definitions);
    return evaluateScoped(stack, stack.length - 1, id, context);
  } // Sentinel value

  var NOT_CACHED = Symbol();

  function getCached(caches, key) {
    for (var i = caches.length - 1; i >= 0; i--) {
      if (caches[i].has(key)) return caches[i].get(key);
    }

    return NOT_CACHED;
  }

  function insertCached(caches, key, value) {
    caches[caches.length - 1].set(key, value);
  } /// # Parameters
  /// - definitions: def stack
  /// - index: which stack item are we in right now?
  /// - id: id of the def to evaluate
  /// - context: see above in evaluate(...)


  function evaluateScoped(definitions, index, id, context) {
    if (context.shouldHalt()) throw new Error('Terminated by shouldHalt');

    if (typeof id === 'string' && id.startsWith('@')) {
      // this is a form variable
      return context.getFormValue(id.substr(1));
    } // resolve definition in stack. Prefer later items


    var item, itemIndex;

    for (var i = index; i >= 0; i--) {
      if (id in definitions[i]) {
        item = definitions[i][id];
        itemIndex = i;
        break;
      }
    }

    if (!item) throw new Error("Unknown definition ".concat(id.toString()));

    if (item.t === 'c') {
      // call a declaration
      // see if we have it cached
      var cached = getCached(context.caches, item);
      if (cached !== NOT_CACHED) return cached; // resolve it from definitions otherwise

      var callee = evaluateScoped(definitions, itemIndex, item.f, context);
      var args = item.a || [];
      var value;

      if (callee instanceof VMFun) {
        // this is an actual function
        var expectedArgCount = callee.length;
        if (args.length !== expectedArgCount) throw new Error("Incorrect number of arguments in ".concat(id.toString(), " (expected ").concat(expectedArgCount, ")"));
        var argValues = args.map(function (arg) {
          return evaluateScoped(definitions, itemIndex, arg, context);
        });
        value = callee.apply(null, argValues);
      } else {
        // this is not an actual function so we just copy the value
        if (args.length) throw new Error("Incorrect number of arguments in ".concat(id.toString(), " (expected 0)"));
        value = callee;
      }

      insertCached(context.caches, item, value);
      return value;
    } else if (item.t === 'f') {
      // define a function
      // see if we have it cached
      var _cached = getCached(context.caches, item);

      if (_cached !== NOT_CACHED) return _cached; // define an inner function that contains the body

      var f = function f(params) {
        // definitions from the parent scope
        var functionStack = definitions.slice(0, itemIndex + 1);
        functionStack.push(params); // parameters

        functionStack.push(item.b); // and the function body
        // (parameters come before the body because the body needs to access them)

        var functionContext = _objectSpread2(_objectSpread2({}, context), {}, {
          caches: context.caches.concat([new WeakMap()])
        });

        return evaluateScoped(functionStack, functionStack.length - 1, '=', functionContext);
      };

      var _value = new VMFun(f, item.p, id);

      insertCached(context.caches, item, _value);
      return _value;
    } else if (item.t === 'l') {
      // construct a list
      var _cached2 = getCached(context.caches, item);

      if (_cached2 !== NOT_CACHED) return _cached2;

      var _value2 = item.v.map(function (name) {
        return evaluateScoped(definitions, itemIndex, name, context);
      });

      insertCached(context.caches, item, _value2);
      return _value2;
    } else if (item.t === 'w') {
      // switch
      var _cached3 = getCached(context.caches, item);

      if (_cached3 !== NOT_CACHED) return _cached3;

      var _iterator = _createForOfIteratorHelper$1(item.m),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var _step$value = _step.value,
              c = _step$value.c,
              v = _step$value.v;
          var cond = true;
          if (typeof c === 'string' || _typeof(c) === 'symbol') cond = evaluateScoped(definitions, itemIndex, c, context);

          if (cond === true) {
            return evaluateScoped(definitions, itemIndex, v, context);
          }
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      return null;
    } else if (item.t === 'n' || item.t === 'm' || item.t === 's' || item.t === 'b') {
      // constant types
      return item.v;
    } else if (item.t === 'u') {
      // null type
      return null;
    } else if (item.t === VM_FN_PARAM) {
      return item.v;
    } else if (item instanceof VMFun) {
      // stdlib function
      return item;
    } else {
      // unknown definition type
      throw new Error("Unknown definition type ".concat(item.t));
    }
  }

  /// The never type. An empty set.
  /// This type indicates that the definition which has this type will never return a value, such as
  /// by getting stuck in an infinite loop.
  /// For correct programs, this type will most likely appear in a union with other types as a return
  /// type of a function to indicate that a function *might* not halt.
  var NEVER = Symbol('⊥'); /// The null type. Has a single value: null itself.

  var NULL = Symbol('null'); /// The boolean type. Has two values: true and false.

  var BOOL = Symbol('bool'); /// The number type. Represents a finite Javascript number and must not be NaN, Infinity, or
  /// -Infinity.

  var NUMBER$1 = Symbol('num'); /// The string type. Can be any sort of Javascript string.

  var STRING = Symbol('str'); /// The array type. This should not be used directly but should instead be considered an irreducible
  /// type function. Apply a type to this to indicate an actual array (such as apply(ARRAY, NUMBER)),
  /// or just use the array(…) convenience function.

  var ARRAY = Symbol('array'); /// Converts a type to a string, deterministically. Can be used for comparison of identical types.
  ///
  /// (However, types may still be equal since they can be reduced)

  function signature(type) {
    if (type === NEVER) return '!';else if (type === NULL) return '()';else if (type === BOOL) return 'bool';else if (type === NUMBER$1) return 'num';else if (type === STRING) return 'str';else if (type === ARRAY) return '[]';else return type.signature;
  } /// Applies an ordered set of types to another type. May create a reducible type.
  /// If the number of arguments is incorrect, will return an abnormal type.

  function _apply(recv, args) {
    if (!Array.isArray(args)) throw new Error('args must be an array');

    var _iterator = _createForOfIteratorHelper$1(args),
        _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done;) {
        var arg = _step.value;
        if (doesHalt(arg) === false) return NEVER;
      } // never is poison

    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    if (recv === NEVER) return NEVER;
    if (_typeof(recv) === 'symbol') return new AppliedType(recv, args, SECRET);
    return recv.apply(args);
  } /// Substitutes a type [variable] for another (alpha?).

  function _subst(type, key, value) {
    if (_typeof(type) === 'symbol') return key === type ? value : type;
    return type.subst(key, value);
  } /// Reduces a type (beta?).

  function _reduce(type) {
    if (_typeof(type) === 'symbol') return type;
    return type.reduce();
  } /// Matches a type on a pattern.


  function isConcrete(type) {
    if (_typeof(type) === 'symbol') return true;
    return type.isConcrete;
  } /// Resolves all instances of the given unresolved type with the given partially resolved type.
  /// Returns false if an expression of the given type will never halt.
  /// Returns null if it *might* halt.

  function doesHalt(type) {
    if (type === NEVER) return false;
    if (_typeof(type) === 'symbol') return true;
    return type.doesHalt;
  } /// Returns false if the type is not valid.

  function isValid(type) {
    if (_typeof(type) === 'symbol') return true;
    return type.isValid;
  } /// Merges multiple Maps by key. Will pick one of the available options if keys overlap.
  ///
  /// - a union of zero types is the never type.
  /// - a union of one type is the one type itself and won’t be put into a UnionType wrapper
  ///
  /// # Parameters
  /// - types: an array of types


  function union(types) {
    var union = new UnionType(types, SECRET);
    if (union.isNever) return NEVER;
    if (union.isSingular) return _toConsumableArray(union.signatures.values())[0];
    return union;
  } /// Creates an array type.

  function array(type) {
    return _apply(ARRAY, [type]);
  }
  var SECRET = Symbol('secret'); /// A union of types.
  /// Use the `union` function to construct a valid union.

  var UnionType = /*#__PURE__*/function () {
    function UnionType(types, secret) {
      _classCallCheck$1(this, UnionType);

      if (secret !== SECRET) console.trace('Warning: private constructor; use union()');
      this.signatures = new Map();

      var _iterator2 = _createForOfIteratorHelper$1(types),
          _step2;

      try {
        for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
          var ty = _step2.value;
          this.add(ty);
        }
      } catch (err) {
        _iterator2.e(err);
      } finally {
        _iterator2.f();
      }
    }

    _createClass$1(UnionType, [{
      key: "add",
      value: function add(ty) {
        var ts = signature(ty);
        if (this.signatures.has(ts)) return;
        this.signatures.set(ts, ty);
      }
    }, {
      key: "delete",
      value: function _delete(ty) {
        this.signatures["delete"](signature(ty));
      }
    }, {
      key: "intersect",
      value: function intersect(union) {
        var intersection = [];

        var _iterator3 = _createForOfIteratorHelper$1(this.signatures),
            _step3;

        try {
          for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
            var _step3$value = _slicedToArray(_step3.value, 2),
                k = _step3$value[0],
                v = _step3$value[1];

            if (!union.signatures.has(k)) continue;
            intersection.push(v);
          }
        } catch (err) {
          _iterator3.e(err);
        } finally {
          _iterator3.f();
        }

        return union(intersection);
      }
    }, {
      key: "subst",
      value: function subst(k, v) {
        return union(_toConsumableArray(this.signatures.values()).map(function (x) {
          return _subst(x, k, v);
        }));
      }
    }, {
      key: "apply",
      value: function apply(ty) {
        return union(_toConsumableArray(this.signatures.values()).map(function (x) {
          return _apply(x, ty);
        }));
      }
    }, {
      key: "reduce",
      value: function reduce() {
        return union(_toConsumableArray(this.signatures.values()).map(_reduce).flatMap(function (item) {
          if (item instanceof UnionType) return _toConsumableArray(item.signatures.values());
          return [item];
        }));
      }
    }, {
      key: "isNever",
      get: function get() {
        return this.signatures.size === 0;
      }
    }, {
      key: "isSingular",
      get: function get() {
        return this.signatures.size === 1;
      }
    }, {
      key: "signature",
      get: function get() {
        return '(' + _toConsumableArray(this.signatures.keys()).sort().join(' | ') + ')';
      }
    }, {
      key: "isConcrete",
      get: function get() {
        return _toConsumableArray(this.signatures.values()).map(isConcrete).reduce(function (a, b) {
          return a && b;
        }, true);
      }
    }, {
      key: "doesHalt",
      get: function get() {
        return _toConsumableArray(this.signatures.values()).map(doesHalt).reduce(function (a, b) {
          if (b === false) return null;
          if (a === null || b === null) return null;
          return true;
        }, true);
      }
    }, {
      key: "isValid",
      get: function get() {
        return _toConsumableArray(this.signatures.values()).map(isValid).reduce(function (a, b) {
          return a && b;
        }, true);
      }
    }]);

    return UnionType;
  }();
  var typeVarCounter = 0; /// A type variable.

  var TypeVar = /*#__PURE__*/function () {
    function TypeVar() {
      _classCallCheck$1(this, TypeVar);

      this.name = '';
      var remaining = typeVarCounter++;

      do {
        this.name += String.fromCharCode(remaining % 26 + 0x61);
        remaining = Math.floor(remaining / 26);
      } while (remaining);
    }

    _createClass$1(TypeVar, [{
      key: "subst",
      value: function subst(k, v) {
        return k === this ? v : this;
      }
    }, {
      key: "apply",
      value: function apply(tys) {
        return new AppliedType(this, tys, SECRET);
      }
    }, {
      key: "reduce",
      value: function reduce() {
        return this;
      }
    }, {
      key: "signature",
      get: function get() {
        return '$' + this.name;
      }
    }, {
      key: "isConcrete",
      get: function get() {
        return false;
      }
    }, {
      key: "doesHalt",
      get: function get() {
        return true;
      }
    }, {
      key: "isValid",
      get: function get() {
        return true;
      }
    }]);

    return TypeVar;
  }(); /// Type application on a type variable.

  var AppliedType = /*#__PURE__*/function () {
    function AppliedType(recv, args, secret) {
      _classCallCheck$1(this, AppliedType);

      if (secret !== SECRET) console.trace('Warning: private constructor; use apply()');
      this.recv = recv;
      this.args = args;
    }

    _createClass$1(AppliedType, [{
      key: "subst",
      value: function subst(k, v) {
        return new AppliedType(_subst(this.recv, k, v), this.args.map(function (arg) {
          return _subst(arg, k, v);
        }), SECRET);
      }
    }, {
      key: "apply",
      value: function apply(tys) {
        return new AppliedType(this, tys, SECRET);
      }
    }, {
      key: "reduce",
      value: function reduce() {
        var args = this.args.map(_reduce);

        var recv = _reduce(this.recv);

        return _apply(recv, args);
      }
    }, {
      key: "signature",
      get: function get() {
        return '(' + signature(this.recv) + ' ' + this.args.map(signature).join(' ') + ')';
      }
    }, {
      key: "isConcrete",
      get: function get() {
        return isConcrete(this.recv) && this.args.map(isConcrete).reduce(function (a, b) {
          return a && b;
        }, true);
      }
    }, {
      key: "doesHalt",
      get: function get() {
        var a = [doesHalt(this.recv)];

        var _iterator4 = _createForOfIteratorHelper$1(this.args),
            _step4;

        try {
          for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
            var arg = _step4.value;
            a.push(doesHalt(arg));
          }
        } catch (err) {
          _iterator4.e(err);
        } finally {
          _iterator4.f();
        }

        for (var _i = 0, _a = a; _i < _a.length; _i++) {
          var item = _a[_i];
          if (item === false) return false;
        }

        for (var _i2 = 0, _a2 = a; _i2 < _a2.length; _i2++) {
          var _item = _a2[_i2];
          if (_item === null) return null;
        }

        return true;
      }
    }, {
      key: "isValid",
      get: function get() {
        return isValid(this.recv) && this.args.map(isValid).reduce(function (a, b) {
          return a && b;
        }, true);
      }
    }]);

    return AppliedType;
  }(); /// The type of a function.

  var FuncType = /*#__PURE__*/function () {
    function FuncType(mappings) {
      _classCallCheck$1(this, FuncType);

      if (!Array.isArray(mappings)) throw new Error('mappings must be an array');
      if (!mappings.length) throw new Error('Function can’t have zero mappings');
      var arity = mappings[0].arity;

      var _iterator5 = _createForOfIteratorHelper$1(mappings),
          _step5;

      try {
        for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
          var mapping = _step5.value;
          if (mapping.arity !== arity) throw new Error('Function can’t have mappings with different arity');
        }
      } catch (err) {
        _iterator5.e(err);
      } finally {
        _iterator5.f();
      }

      this.mappings = mappings;
    }

    _createClass$1(FuncType, [{
      key: "subst",
      value: function subst(k, v) {
        if (k instanceof UnresolvedType) {
          var newMappings = [];

          var _iterator6 = _createForOfIteratorHelper$1(this.mappings),
              _step6;

          try {
            for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
              var mapping = _step6.value;
              newMappings.push(mapping.subst(k, v));
            }
          } catch (err) {
            _iterator6.e(err);
          } finally {
            _iterator6.f();
          }

          return new FuncType(newMappings);
        } // substitutions can't touch the function body, because:
        // (1) type reductions will never need to use this since they will always apply beforehand
        // (2) this would cause namespacing issues with type variables


        return this;
      }
    }, {
      key: "apply",
      value: function apply(tys) {
        // TODO: handle case where there's union type args
        // (need to match each combination individually and union at the end)
        // substitute bindings for the concrete values that were passed
        var _iterator7 = _createForOfIteratorHelper$1(this.mappings),
            _step7;

        try {
          for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
            var mapping = _step7.value;
            var applied = mapping.matchApply(tys);
            if (applied) return _reduce(_reduce(applied)); // reducing twice gives better results
            else if (applied === null) return new AppliedType(this, tys, SECRET); // can't apply type var
          } // no applicable mapping could be found; the function is undefined at these inputs

        } catch (err) {
          _iterator7.e(err);
        } finally {
          _iterator7.f();
        }

        return new ErrorType('undefined');
      }
    }, {
      key: "reduce",
      value: function reduce() {
        var newMappings = [];

        var _iterator8 = _createForOfIteratorHelper$1(this.mappings),
            _step8;

        try {
          for (_iterator8.s(); !(_step8 = _iterator8.n()).done;) {
            var mapping = _step8.value;
            newMappings.push(mapping.reduce());
          } // TODO: flatten function in case a -> (fn) a by matching a against inner fn and extracting
          // cases

        } catch (err) {
          _iterator8.e(err);
        } finally {
          _iterator8.f();
        }

        return new FuncType(newMappings);
      }
    }, {
      key: "arity",
      get: function get() {
        return this.mappings[0].arity;
      }
    }, {
      key: "signature",
      get: function get() {
        return 'f(' + this.mappings.map(function (m) {
          return m.signature;
        }).join(',') + ')';
      }
    }, {
      key: "isConcrete",
      get: function get() {
        var _iterator9 = _createForOfIteratorHelper$1(this.mappings),
            _step9;

        try {
          for (_iterator9.s(); !(_step9 = _iterator9.n()).done;) {
            var mapping = _step9.value;
            if (!mapping.isConcrete) return false;
            if (mapping.isTautology) break;
          }
        } catch (err) {
          _iterator9.e(err);
        } finally {
          _iterator9.f();
        }

        return true;
      }
    }, {
      key: "doesHalt",
      get: function get() {
        var _iterator10 = _createForOfIteratorHelper$1(this.mappings),
            _step10;

        try {
          for (_iterator10.s(); !(_step10 = _iterator10.n()).done;) {
            var mapping = _step10.value;
            if (!mapping.doesHalt) return false;
            if (mapping.isTautology) break;
          }
        } catch (err) {
          _iterator10.e(err);
        } finally {
          _iterator10.f();
        }

        return true;
      }
    }, {
      key: "isValid",
      get: function get() {
        var _iterator11 = _createForOfIteratorHelper$1(this.mappings),
            _step11;

        try {
          for (_iterator11.s(); !(_step11 = _iterator11.n()).done;) {
            var mapping = _step11.value;
            if (!mapping.isValid) return false;
            if (mapping.isTautology) break;
          }
        } catch (err) {
          _iterator11.e(err);
        } finally {
          _iterator11.f();
        }

        return true;
      }
    }]);

    return FuncType;
  }(); /// A function pattern. Matches any function of the given arity and associates it with the given
  /// binding.

  var FunctionPattern = /*#__PURE__*/function () {
    function FunctionPattern(binding, arity) {
      _classCallCheck$1(this, FunctionPattern);

      this.binding = binding;
      this.arity = arity;
    }

    _createClass$1(FunctionPattern, [{
      key: "signature",
      get: function get() {
        return "".concat(signature(this.binding), ":(").concat(_toConsumableArray(new Array(this.arity)).map(function (x) {
          return '·';
        }).join(','), ")->\xB7");
      }
    }]);

    return FunctionPattern;
  }(); /// Maps a pattern to a type. May bind type variables.
  ///
  /// Patterns may be one of:
  /// - primitive types
  /// - apply(pattern, pattern)
  /// - a function pattern
  /// - a type variable binding
  ///
  /// All variable bindings in patterns must be present in the bindings set.

  var TypeMapping = /*#__PURE__*/function () {
    function TypeMapping(bindings, patterns, type) {
      _classCallCheck$1(this, TypeMapping);

      this.bindings = bindings;
      this.patterns = patterns;
      this.type = type;
    }

    _createClass$1(TypeMapping, [{
      key: "subst",
      value: function subst(k, v) {
        return new TypeMapping(this.bindings, this.patterns, _subst(this.type, k, v));
      } /// Tries to match and apply the given arguments to this mapping.
      ///
      /// - returns a type if successful
      /// - returns null if there is a type variable argument
      /// - returns false if it doesn't match

    }, {
      key: "matchApply",
      value: function matchApply(tys) {
        if (tys.length !== this.patterns.length) return new ErrorType('argc');
        var hasVarArg = false; // Bindings. Mapping our own type variables (found in this.bindings) to types from `tys`.

        var bindings = new Map(); // Matches a type pattern.

        var matchPattern = function matchPattern(pat, ty) {
          if (ty instanceof TypeVar) {
            hasVarArg = true;
            return false;
          } // concrete types can just be matched directly


          if (_typeof(pat) === 'symbol') return pat === ty;else if (pat instanceof AppliedType) {
            // applications must match their receiver and their arguments
            if (!(ty instanceof AppliedType)) return false;
            if (pat.args.length !== ty.args.length) return false;
            if (!matchPattern(pat.recv, ty.recv)) return false;

            for (var i = 0; i < pat.args.length; i++) {
              if (!matchPattern(pat.args[i], ty.args[i])) return false;
            }

            return true;
          } else if (pat instanceof FunctionPattern) {
            // a function pattern matches any function of the same arity
            if (!(ty instanceof FuncType)) return false;
            if (pat.arity !== ty.arity) return false; // it matched; so the function type can be bound

            bindings.set(pat.binding, ty);
            return true;
          } else if (pat instanceof TypeVar) {
            // a type variable matches anything
            bindings.set(pat, ty);
            return true;
          } // there are no other types of patterns

          return false;
        };

        for (var i = 0; i < this.patterns.length; i++) {
          if (!matchPattern(this.patterns[i], tys[i])) {
            if (hasVarArg) return null; // can't apply a type var!

            return false;
          }
        } // all patterns matched!


        var type = this.type;

        var _iterator12 = _createForOfIteratorHelper$1(bindings),
            _step12;

        try {
          for (_iterator12.s(); !(_step12 = _iterator12.n()).done;) {
            var _step12$value = _slicedToArray(_step12.value, 2),
                k = _step12$value[0],
                v = _step12$value[1];

            type = _subst(type, k, v);
          }
        } catch (err) {
          _iterator12.e(err);
        } finally {
          _iterator12.f();
        }

        return type;
      }
    }, {
      key: "reduce",
      value: function reduce() {
        return new TypeMapping(this.bindings, this.patterns, _reduce(this.type));
      }
    }, {
      key: "arity",
      get: function get() {
        return this.patterns.length;
      }
    }, {
      key: "signature",
      get: function get() {
        return '(' + this.patterns.map(signature).join(',') + ')->' + signature(this.type);
      }
    }, {
      key: "isTautology",
      get: function get() {
        var _iterator13 = _createForOfIteratorHelper$1(this.patterns),
            _step13;

        try {
          for (_iterator13.s(); !(_step13 = _iterator13.n()).done;) {
            var pat = _step13.value;
            if (!(pat instanceof TypeVar)) return false;
          }
        } catch (err) {
          _iterator13.e(err);
        } finally {
          _iterator13.f();
        }

        return true;
      }
    }, {
      key: "isConcrete",
      get: function get() {
        var constBody = this.type;

        var _iterator14 = _createForOfIteratorHelper$1(this.bindings),
            _step14;

        try {
          for (_iterator14.s(); !(_step14 = _iterator14.n()).done;) {
            var b = _step14.value;
            constBody = _subst(constBody, b, NEVER);
          }
        } catch (err) {
          _iterator14.e(err);
        } finally {
          _iterator14.f();
        }

        return isConcrete(constBody);
      }
    }, {
      key: "doesHalt",
      get: function get() {
        return doesHalt(this.type);
      }
    }, {
      key: "isValid",
      get: function get() {
        return isValid(this.type);
      }
    }]);

    return TypeMapping;
  }(); /// An unresolved type.

  var UnresolvedType = /*#__PURE__*/function (_TypeVar) {
    _inherits(UnresolvedType, _TypeVar);

    var _super = _createSuper(UnresolvedType);

    function UnresolvedType(node) {
      var _this;

      _classCallCheck$1(this, UnresolvedType);

      _this = _super.call(this);
      _this.node = node;
      return _this;
    }

    _createClass$1(UnresolvedType, [{
      key: "match",
      value: function match(ty) {
        return ty === this ? new Map() : null;
      }
    }, {
      key: "signature",
      get: function get() {
        return '?' + this.name;
      }
    }]);

    return UnresolvedType;
  }(TypeVar); /// The error type. Not a real type but rather the absence of a type.

  var ErrorType = /*#__PURE__*/function () {
    function ErrorType(type) {
      _classCallCheck$1(this, ErrorType);

      this.type = type;
    }

    _createClass$1(ErrorType, [{
      key: "subst",
      value: function subst(k, v) {
        return this;
      }
    }, {
      key: "apply",
      value: function apply(tys) {
        return this;
      }
    }, {
      key: "reduce",
      value: function reduce() {
        return this;
      }
    }, {
      key: "signature",
      get: function get() {
        return "ERROR!(".concat(this.type, ")");
      }
    }, {
      key: "isConcrete",
      get: function get() {
        return false;
      }
    }, {
      key: "doesHalt",
      get: function get() {
        return null;
      }
    }, {
      key: "isValid",
      get: function get() {
        return false;
      }
    }]);

    return ErrorType;
  }();
  function createPrimitiveType(name) {
    var classContainer = {};

    classContainer[name] = /*#__PURE__*/function () {
      function _class() {
        _classCallCheck$1(this, _class);
      }

      _createClass$1(_class, [{
        key: "subst",
        value: function subst(k, v) {
          return signature(k) === this.signature ? v : this;
        }
      }, {
        key: "apply",
        value: function apply(tys) {
          return new AppliedType(this, tys, SECRET);
        }
      }, {
        key: "reduce",
        value: function reduce() {
          return this;
        }
      }, {
        key: "signature",
        get: function get() {
          return name;
        }
      }, {
        key: "isConcrete",
        get: function get() {
          return true;
        }
      }, {
        key: "doesHalt",
        get: function get() {
          return true;
        }
      }, {
        key: "isValid",
        get: function get() {
          return true;
        }
      }]);

      return _class;
    }();

    return new classContainer[name]();
  }
  var Timestamp = createPrimitiveType('timestamp');

  var createPolyFn = function createPolyFn(mappings) {
    var fnMappings = [];

    var _iterator15 = _createForOfIteratorHelper$1(mappings),
        _step15;

    try {
      for (_iterator15.s(); !(_step15 = _iterator15.n()).done;) {
        var m = _step15.value;
        var margs = m.slice();
        var mret = margs.pop();
        var bindings = [];
        var args = [];

        var _iterator16 = _createForOfIteratorHelper$1(margs),
            _step16;

        try {
          for (_iterator16.s(); !(_step16 = _iterator16.n()).done;) {
            var marg = _step16.value;
            if (marg instanceof TypeVar) bindings.push(marg);
            args.push(marg);
          }
        } catch (err) {
          _iterator16.e(err);
        } finally {
          _iterator16.f();
        }

        fnMappings.push(new TypeMapping(bindings, args, mret));
      }
    } catch (err) {
      _iterator15.e(err);
    } finally {
      _iterator15.f();
    }

    return new FuncType(fnMappings);
  };

  var withVar = function withVar(a) {
    var v = new TypeVar();
    return a(v);
  };

  var U = NULL;
  var B = BOOL;
  var N = NUMBER$1;
  var S = STRING;

  var any = function any() {
    return new TypeVar();
  };

  var binaryMathOp = createPolyFn([[N, N, N], [any(), any(), U]]);
  var unaryMathOp = createPolyFn([[N, N], [any(), U]]);
  var mathCmpOp = createPolyFn([[any(), any(), B]]);
  var binaryBoolOp = createPolyFn([[any(), any(), B]]);
  var mapType = withVar(function (a) {
    return withVar(function (b) {
      return createPolyFn([[a, S, S], [a, array(b), array(_apply(a, [b]))], [a, b, _apply(a, [b])]]);
    });
  });
  var flatMapType = withVar(function (a) {
    return withVar(function (b) {
      return createPolyFn([[a, S, S], [a, array(b), _apply(a, [b])], [a, b, array(_apply(a, [b]))]]);
    });
  });
  var fold1Type = withVar(function (a) {
    return withVar(function (b) {
      return createPolyFn([[a, S, _apply(a, [S, S])], [a, array(b), _apply(a, [b, b])], [a, b, a]]);
    });
  });
  var foldType = withVar(function (a) {
    return withVar(function (b) {
      return withVar(function (c) {
        return createPolyFn([[a, b, S, _apply(a, [b, S])], [a, b, array(c), _apply(a, [b, c])], [a, b, c, _apply(a, [b, c])]]);
      });
    });
  });
  var filterType = withVar(function (a) {
    return withVar(function (b) {
      return createPolyFn([// we do not need to distinguish between any and bool here because the outcome
      // will be the same
      [a, array(b), array(b)], [a, b, b]]);
    });
  }); /// The types of standard library functions.

  var stdlibTypes = {
    '+': binaryMathOp,
    '-': binaryMathOp,
    '*': binaryMathOp,
    '/': binaryMathOp,
    '^': binaryMathOp,
    mod: binaryMathOp,
    floor: unaryMathOp,
    ceil: unaryMathOp,
    round: unaryMathOp,
    trunc: unaryMathOp,
    sign: unaryMathOp,
    abs: unaryMathOp,
    '==': createPolyFn([[any(), any(), B]]),
    '!=': createPolyFn([[any(), any(), B]]),
    '>': mathCmpOp,
    '<': mathCmpOp,
    '>=': mathCmpOp,
    '<=': mathCmpOp,
    and: binaryBoolOp,
    or: binaryBoolOp,
    not: binaryBoolOp,
    xor: binaryBoolOp,
    '++': withVar(function (a) {
      return withVar(function (b) {
        return createPolyFn([[array(a), array(b), array(union([a, b]))], [a, array(b), array(union([a, b]))], [array(a), b, array(union([a, b]))], [a, b, array(union([a, b]))]]);
      });
    }),
    map: mapType,
    flat_map: flatMapType,
    fold: foldType,
    fold1: fold1Type,
    filter: filterType,
    index: withVar(function (a) {
      return createPolyFn([[array(a), N, union([U, a])], [S, N, union([U, S])], [any(), any(), U]]);
    }),
    length: createPolyFn([[array(any()), N], [S, N], [any(), U]]),
    contains: createPolyFn([[0, 1, B]]),
    sort: withVar(function (a) {
      return createPolyFn([[array(a), array(a)], [S, S], [any(), U]]);
    }),
    sum: createPolyFn([[array(N), N], [any(), U]]),
    min: createPolyFn([[array(N), N], [any(), U]]),
    max: createPolyFn([[array(N), N], [any(), U]]),
    avg: createPolyFn([[array(N), N], [any(), U]]),
    med: createPolyFn([[array(N), N], [any(), U]]),
    date_sub: createPolyFn([[S, S, S, union([S, U])], [any(), any(), any(), U]]),
    date_add: createPolyFn([[S, S, N, union([S, U])], [any(), any(), any(), U]]),
    date_today: S,
    date_fmt: createPolyFn([[S, union([S, U])], [any(), U]]),
    date_get: createPolyFn([[S, S, union([N, U])], [any(), any(), U]]),
    date_set: createPolyFn([[S, S, N, union([S, U])], [any(), any(), any(), U]]),
    ts_now: Timestamp,
    tz_utc: N,
    tz_local: N,
    ts_from_unix: createPolyFn([[N, Timestamp], [any(), U]]),
    ts_to_unix: createPolyFn([[Timestamp, N], [any(), U]]),
    ts_from_date: createPolyFn([[S, N, N, N, N, union([Timestamp, U])], [any(), any(), any(), any(), any(), U]]),
    ts_to_date: createPolyFn([[Timestamp, N, S], [any(), any(), U]]),
    ts_parse: createPolyFn([[S, union([Timestamp, U])], [any(), U]]),
    ts_to_string: createPolyFn([[Timestamp, S], [any(), U]]),
    ts_fmt: createPolyFn([[Timestamp, S], [any(), U]]),
    ts_add: createPolyFn([[S, Timestamp, N, union([Timestamp, U])], [any(), any(), any(), U]]),
    ts_sub: createPolyFn([[S, Timestamp, Timestamp, union([N, U])], [any(), any(), any(), U]]),
    ts_get: createPolyFn([[S, N, Timestamp, union([N, U])], [any(), any(), any(), U]]),
    ts_set: createPolyFn([[S, N, Timestamp, N, union([Timestamp, U])], [any(), any(), any(), any(), U]]),
    datetime_fmt: createPolyFn([[N, S], [any(), U]]),
    currency_fmt: createPolyFn([[S, N, union([S, U])], [any(), any(), U]]),
    country_fmt: createPolyFn([[S, union([S, U])], [any(), U]]),
    phone_fmt: createPolyFn([[S, union([S, U])], [any(), U]]),
    id: withVar(function (a) {
      return createPolyFn([[a, a]]);
    })
  };

  function loadCountryFmt() {
    return new Promise(function (resolve, reject) { require(['./country_fmt'], resolve, reject) });
  }
  function loadPhoneFmt() {
    return new Promise(function (resolve, reject) { require(['./phone_fmt'], resolve, reject) });
  }

  var date_picker = {
  	year: "[[Year]]"
  };
  var registration_form = {
  	noscript_note: "JavaScript estas malŝaltita en via retumilo [[or maybe it just doesn’t support JS features we use, or the script failed to load, etc.]]. Kelkaj elementoj de formularoj eble ne funkcios laŭ intenco. Vi povas premi la butonon “Validigi” ĉe la subo por ĝisdatigi la formularon sen sendi ĝin.",
  	validate_valid: "[[Form input appears to be valid]]",
  	validate: "Validigi",
  	cancel: "Nuligi aliĝon",
  	post: "Sendi",
  	patch: "Konservi ŝanĝojn",
  	user_data_not_found: "Ne sukcesis trovi la indikitan aliĝon",
  	user_data_generic_error: "Okazis eraro dum trovado de la aliĝo",
  	msg_patch_success: "Sukcese ĝisdatigis aliĝon",
  	err_submit_invalid: "Okazis eraro dum validigo de viaj datumoj; eventuale rigardu la subajn erarojn",
  	err_submit_generic: "Okazis interna eraro",
  	err_submit_already_registered: "Vi jam aliĝis al tiu ĉi kongreso",
  	err_cancel_generic: "[[Failed to cancel registration for some reason]]",
  	err_field_is_required: "Tiu ĉi kampo estas deviga",
  	err_number_min_0: "Devas esti minimume ",
  	err_number_min_1: "",
  	err_number_range_0: "Devas esti inter ",
  	err_number_range_1: " kaj ",
  	err_number_range_2: "",
  	err_number_max_0: "Devas esti maksimume ",
  	err_number_max_1: "",
  	err_number_step_0: "Devas esti oblo de ",
  	err_number_step_1: "",
  	err_text_pattern_generic: "La enmetita valoro ne estas valida",
  	err_text_len_min_0: "La teksto devas esti minimume ",
  	err_text_len_min_1: " signojn longa",
  	err_text_len_range_0: "La teksto devas esti inter ",
  	err_text_len_range_1: " kaj ",
  	err_text_len_range_2: "signojn longa",
  	err_text_len_max_0: "La teksto devas esti maksimume ",
  	err_text_len_max_1: " signojn longa",
  	err_money_min_0: "Devas esti minimume ",
  	err_money_min_1: "",
  	err_money_range_0: "Devas esti inter ",
  	err_money_range_1: " kaj ",
  	err_money_range_2: "",
  	err_money_max_0: "Devas esti maksimume ",
  	err_money_max_1: "",
  	err_money_step_0: "Devas esti oblo de ",
  	err_money_step_1: "",
  	err_enum_not_in_set: "Nevalida opcio estis elektita",
  	err_country_not_in_set: "Nevalida opcio estis elektita",
  	err_date_fmt: "La dato estu en la formato JJJJ-MM-TT",
  	err_time_fmt: "La horo estu en la formato HH:MM",
  	err_datetime_fmt: "La dato kaj horo estu en la formato JJJJ-MM-TT[T]hh:mm (ekz. 2020-01-31T14:01)",
  	err_datetime_min_0: "Ne estu antaŭ ",
  	err_datetime_min_1: "",
  	err_datetime_range_0: "Estu inter ",
  	err_datetime_range_1: " kaj ",
  	err_datetime_range_2: "",
  	err_datetime_max_0: "Ne estu post ",
  	err_datetime_max_1: "",
  	err_bool_table_select_min_0: "Elektu almenaŭ ",
  	err_bool_table_select_min_1: " ĉelojn",
  	err_bool_table_select_range_0: "Elektu inter ",
  	err_bool_table_select_range_1: " kaj ",
  	err_bool_table_select_range_2: " ĉelojn",
  	err_bool_table_select_max_0: "Elektu ne pli ol ",
  	err_bool_table_select_max_1: " ĉelojn",
  	editing_title: "Via aliĝo",
  	confirmation_title: "Via aliĝo estis sukcese ricevita",
  	confirmation_view_registration: "Vidi mian aliĝon",
  	confirmation_back_to_congress: "Reveni al la kongresa paĝaro",
  	cancellation_title: "Ĉu vi certas ke vi volas nuligi vian aliĝon?",
  	cancellation_back: "Reen",
  	cancellation_cancel: "Nuligi la aliĝon",
  	canceled_title: "[[This registration has been canceled]]",
  	payment_box_title: "[[Outstanding payment]]",
  	payment_box_create_intent: "[[Pay]]",
  	payment_title: "[[Registration Payment]]",
  	payment_all_paid: "[[No outstanding payment]]",
  	payment_all_paid_back: "[[Back]]",
  	payment_methods_none: "[[No payment methods available]]",
  	payment_method_pay: "[[Use this method]]",
  	payment_outstanding: "[[Outstanding payment:]]",
  	payment_back_to_edit: "[[Back]]",
  	payment_amount_to_pay: "[[Amount to pay]]",
  	payment_notes: "[[Notes]]",
  	payment_currency: "[[Pay in currency]]",
  	payment_notes_placeholder: "[[If you would like to add any notes about this payment, write them here. I don’t know who will read them though (especially for stripe intents)]]",
  	payment_intent_create: "[[Pay]]",
  	payment_intent_purpose_title: "[[Congress registration]]",
  	payment_intent_redirect: "[[Redirecting you to the payment page. If this does not happen automatically, you can use this link.]]",
  	payment_intent_redirect_open: "[[Open]]"
  };
  var locale = {
  	date_picker: date_picker,
  	registration_form: registration_form
  };

  var Aacute = "Á";
  var aacute = "á";
  var Abreve = "Ă";
  var abreve = "ă";
  var ac = "∾";
  var acd = "∿";
  var acE = "∾̳";
  var Acirc = "Â";
  var acirc = "â";
  var acute = "´";
  var Acy = "А";
  var acy = "а";
  var AElig = "Æ";
  var aelig = "æ";
  var af = "⁡";
  var Afr = "𝔄";
  var afr = "𝔞";
  var Agrave = "À";
  var agrave = "à";
  var alefsym = "ℵ";
  var aleph = "ℵ";
  var Alpha = "Α";
  var alpha = "α";
  var Amacr = "Ā";
  var amacr = "ā";
  var amalg = "⨿";
  var amp = "&";
  var AMP = "&";
  var andand = "⩕";
  var And = "⩓";
  var and = "∧";
  var andd = "⩜";
  var andslope = "⩘";
  var andv = "⩚";
  var ang = "∠";
  var ange = "⦤";
  var angle = "∠";
  var angmsdaa = "⦨";
  var angmsdab = "⦩";
  var angmsdac = "⦪";
  var angmsdad = "⦫";
  var angmsdae = "⦬";
  var angmsdaf = "⦭";
  var angmsdag = "⦮";
  var angmsdah = "⦯";
  var angmsd = "∡";
  var angrt = "∟";
  var angrtvb = "⊾";
  var angrtvbd = "⦝";
  var angsph = "∢";
  var angst = "Å";
  var angzarr = "⍼";
  var Aogon = "Ą";
  var aogon = "ą";
  var Aopf = "𝔸";
  var aopf = "𝕒";
  var apacir = "⩯";
  var ap = "≈";
  var apE = "⩰";
  var ape = "≊";
  var apid = "≋";
  var apos = "'";
  var ApplyFunction = "⁡";
  var approx = "≈";
  var approxeq = "≊";
  var Aring = "Å";
  var aring = "å";
  var Ascr = "𝒜";
  var ascr = "𝒶";
  var Assign = "≔";
  var ast = "*";
  var asymp = "≈";
  var asympeq = "≍";
  var Atilde = "Ã";
  var atilde = "ã";
  var Auml = "Ä";
  var auml = "ä";
  var awconint = "∳";
  var awint = "⨑";
  var backcong = "≌";
  var backepsilon = "϶";
  var backprime = "‵";
  var backsim = "∽";
  var backsimeq = "⋍";
  var Backslash = "∖";
  var Barv = "⫧";
  var barvee = "⊽";
  var barwed = "⌅";
  var Barwed = "⌆";
  var barwedge = "⌅";
  var bbrk = "⎵";
  var bbrktbrk = "⎶";
  var bcong = "≌";
  var Bcy = "Б";
  var bcy = "б";
  var bdquo = "„";
  var becaus = "∵";
  var because = "∵";
  var Because = "∵";
  var bemptyv = "⦰";
  var bepsi = "϶";
  var bernou = "ℬ";
  var Bernoullis = "ℬ";
  var Beta = "Β";
  var beta = "β";
  var beth = "ℶ";
  var between = "≬";
  var Bfr = "𝔅";
  var bfr = "𝔟";
  var bigcap = "⋂";
  var bigcirc = "◯";
  var bigcup = "⋃";
  var bigodot = "⨀";
  var bigoplus = "⨁";
  var bigotimes = "⨂";
  var bigsqcup = "⨆";
  var bigstar = "★";
  var bigtriangledown = "▽";
  var bigtriangleup = "△";
  var biguplus = "⨄";
  var bigvee = "⋁";
  var bigwedge = "⋀";
  var bkarow = "⤍";
  var blacklozenge = "⧫";
  var blacksquare = "▪";
  var blacktriangle = "▴";
  var blacktriangledown = "▾";
  var blacktriangleleft = "◂";
  var blacktriangleright = "▸";
  var blank = "␣";
  var blk12 = "▒";
  var blk14 = "░";
  var blk34 = "▓";
  var block = "█";
  var bne = "=⃥";
  var bnequiv = "≡⃥";
  var bNot = "⫭";
  var bnot = "⌐";
  var Bopf = "𝔹";
  var bopf = "𝕓";
  var bot = "⊥";
  var bottom = "⊥";
  var bowtie = "⋈";
  var boxbox = "⧉";
  var boxdl = "┐";
  var boxdL = "╕";
  var boxDl = "╖";
  var boxDL = "╗";
  var boxdr = "┌";
  var boxdR = "╒";
  var boxDr = "╓";
  var boxDR = "╔";
  var boxh = "─";
  var boxH = "═";
  var boxhd = "┬";
  var boxHd = "╤";
  var boxhD = "╥";
  var boxHD = "╦";
  var boxhu = "┴";
  var boxHu = "╧";
  var boxhU = "╨";
  var boxHU = "╩";
  var boxminus = "⊟";
  var boxplus = "⊞";
  var boxtimes = "⊠";
  var boxul = "┘";
  var boxuL = "╛";
  var boxUl = "╜";
  var boxUL = "╝";
  var boxur = "└";
  var boxuR = "╘";
  var boxUr = "╙";
  var boxUR = "╚";
  var boxv = "│";
  var boxV = "║";
  var boxvh = "┼";
  var boxvH = "╪";
  var boxVh = "╫";
  var boxVH = "╬";
  var boxvl = "┤";
  var boxvL = "╡";
  var boxVl = "╢";
  var boxVL = "╣";
  var boxvr = "├";
  var boxvR = "╞";
  var boxVr = "╟";
  var boxVR = "╠";
  var bprime = "‵";
  var breve = "˘";
  var Breve = "˘";
  var brvbar = "¦";
  var bscr = "𝒷";
  var Bscr = "ℬ";
  var bsemi = "⁏";
  var bsim = "∽";
  var bsime = "⋍";
  var bsolb = "⧅";
  var bsol = "\\";
  var bsolhsub = "⟈";
  var bull = "•";
  var bullet = "•";
  var bump = "≎";
  var bumpE = "⪮";
  var bumpe = "≏";
  var Bumpeq = "≎";
  var bumpeq = "≏";
  var Cacute = "Ć";
  var cacute = "ć";
  var capand = "⩄";
  var capbrcup = "⩉";
  var capcap = "⩋";
  var cap = "∩";
  var Cap = "⋒";
  var capcup = "⩇";
  var capdot = "⩀";
  var CapitalDifferentialD = "ⅅ";
  var caps = "∩︀";
  var caret = "⁁";
  var caron = "ˇ";
  var Cayleys = "ℭ";
  var ccaps = "⩍";
  var Ccaron = "Č";
  var ccaron = "č";
  var Ccedil = "Ç";
  var ccedil = "ç";
  var Ccirc = "Ĉ";
  var ccirc = "ĉ";
  var Cconint = "∰";
  var ccups = "⩌";
  var ccupssm = "⩐";
  var Cdot = "Ċ";
  var cdot = "ċ";
  var cedil = "¸";
  var Cedilla = "¸";
  var cemptyv = "⦲";
  var cent = "¢";
  var centerdot = "·";
  var CenterDot = "·";
  var cfr = "𝔠";
  var Cfr = "ℭ";
  var CHcy = "Ч";
  var chcy = "ч";
  var check$1 = "✓";
  var checkmark = "✓";
  var Chi = "Χ";
  var chi = "χ";
  var circ = "ˆ";
  var circeq = "≗";
  var circlearrowleft = "↺";
  var circlearrowright = "↻";
  var circledast = "⊛";
  var circledcirc = "⊚";
  var circleddash = "⊝";
  var CircleDot = "⊙";
  var circledR = "®";
  var circledS = "Ⓢ";
  var CircleMinus = "⊖";
  var CirclePlus = "⊕";
  var CircleTimes = "⊗";
  var cir = "○";
  var cirE = "⧃";
  var cire = "≗";
  var cirfnint = "⨐";
  var cirmid = "⫯";
  var cirscir = "⧂";
  var ClockwiseContourIntegral = "∲";
  var CloseCurlyDoubleQuote = "”";
  var CloseCurlyQuote = "’";
  var clubs = "♣";
  var clubsuit = "♣";
  var colon = ":";
  var Colon = "∷";
  var Colone = "⩴";
  var colone = "≔";
  var coloneq = "≔";
  var comma = ",";
  var commat = "@";
  var comp = "∁";
  var compfn = "∘";
  var complement = "∁";
  var complexes = "ℂ";
  var cong = "≅";
  var congdot = "⩭";
  var Congruent = "≡";
  var conint = "∮";
  var Conint = "∯";
  var ContourIntegral = "∮";
  var copf = "𝕔";
  var Copf = "ℂ";
  var coprod = "∐";
  var Coproduct = "∐";
  var copy = "©";
  var COPY = "©";
  var copysr = "℗";
  var CounterClockwiseContourIntegral = "∳";
  var crarr = "↵";
  var cross = "✗";
  var Cross = "⨯";
  var Cscr = "𝒞";
  var cscr = "𝒸";
  var csub = "⫏";
  var csube = "⫑";
  var csup = "⫐";
  var csupe = "⫒";
  var ctdot = "⋯";
  var cudarrl = "⤸";
  var cudarrr = "⤵";
  var cuepr = "⋞";
  var cuesc = "⋟";
  var cularr = "↶";
  var cularrp = "⤽";
  var cupbrcap = "⩈";
  var cupcap = "⩆";
  var CupCap = "≍";
  var cup = "∪";
  var Cup = "⋓";
  var cupcup = "⩊";
  var cupdot = "⊍";
  var cupor = "⩅";
  var cups = "∪︀";
  var curarr = "↷";
  var curarrm = "⤼";
  var curlyeqprec = "⋞";
  var curlyeqsucc = "⋟";
  var curlyvee = "⋎";
  var curlywedge = "⋏";
  var curren = "¤";
  var curvearrowleft = "↶";
  var curvearrowright = "↷";
  var cuvee = "⋎";
  var cuwed = "⋏";
  var cwconint = "∲";
  var cwint = "∱";
  var cylcty = "⌭";
  var dagger = "†";
  var Dagger = "‡";
  var daleth = "ℸ";
  var darr = "↓";
  var Darr = "↡";
  var dArr = "⇓";
  var dash = "‐";
  var Dashv = "⫤";
  var dashv = "⊣";
  var dbkarow = "⤏";
  var dblac = "˝";
  var Dcaron = "Ď";
  var dcaron = "ď";
  var Dcy = "Д";
  var dcy = "д";
  var ddagger = "‡";
  var ddarr = "⇊";
  var DD = "ⅅ";
  var dd = "ⅆ";
  var DDotrahd = "⤑";
  var ddotseq = "⩷";
  var deg = "°";
  var Del = "∇";
  var Delta = "Δ";
  var delta = "δ";
  var demptyv = "⦱";
  var dfisht = "⥿";
  var Dfr = "𝔇";
  var dfr = "𝔡";
  var dHar = "⥥";
  var dharl = "⇃";
  var dharr = "⇂";
  var DiacriticalAcute = "´";
  var DiacriticalDot = "˙";
  var DiacriticalDoubleAcute = "˝";
  var DiacriticalGrave = "`";
  var DiacriticalTilde = "˜";
  var diam = "⋄";
  var diamond = "⋄";
  var Diamond = "⋄";
  var diamondsuit = "♦";
  var diams = "♦";
  var die = "¨";
  var DifferentialD = "ⅆ";
  var digamma = "ϝ";
  var disin = "⋲";
  var div = "÷";
  var divide = "÷";
  var divideontimes = "⋇";
  var divonx = "⋇";
  var DJcy = "Ђ";
  var djcy = "ђ";
  var dlcorn = "⌞";
  var dlcrop = "⌍";
  var dollar = "$";
  var Dopf = "𝔻";
  var dopf = "𝕕";
  var Dot = "¨";
  var dot = "˙";
  var DotDot = "⃜";
  var doteq = "≐";
  var doteqdot = "≑";
  var DotEqual = "≐";
  var dotminus = "∸";
  var dotplus = "∔";
  var dotsquare = "⊡";
  var doublebarwedge = "⌆";
  var DoubleContourIntegral = "∯";
  var DoubleDot = "¨";
  var DoubleDownArrow = "⇓";
  var DoubleLeftArrow = "⇐";
  var DoubleLeftRightArrow = "⇔";
  var DoubleLeftTee = "⫤";
  var DoubleLongLeftArrow = "⟸";
  var DoubleLongLeftRightArrow = "⟺";
  var DoubleLongRightArrow = "⟹";
  var DoubleRightArrow = "⇒";
  var DoubleRightTee = "⊨";
  var DoubleUpArrow = "⇑";
  var DoubleUpDownArrow = "⇕";
  var DoubleVerticalBar = "∥";
  var DownArrowBar = "⤓";
  var downarrow = "↓";
  var DownArrow = "↓";
  var Downarrow = "⇓";
  var DownArrowUpArrow = "⇵";
  var DownBreve = "̑";
  var downdownarrows = "⇊";
  var downharpoonleft = "⇃";
  var downharpoonright = "⇂";
  var DownLeftRightVector = "⥐";
  var DownLeftTeeVector = "⥞";
  var DownLeftVectorBar = "⥖";
  var DownLeftVector = "↽";
  var DownRightTeeVector = "⥟";
  var DownRightVectorBar = "⥗";
  var DownRightVector = "⇁";
  var DownTeeArrow = "↧";
  var DownTee = "⊤";
  var drbkarow = "⤐";
  var drcorn = "⌟";
  var drcrop = "⌌";
  var Dscr = "𝒟";
  var dscr = "𝒹";
  var DScy = "Ѕ";
  var dscy = "ѕ";
  var dsol = "⧶";
  var Dstrok = "Đ";
  var dstrok = "đ";
  var dtdot = "⋱";
  var dtri = "▿";
  var dtrif = "▾";
  var duarr = "⇵";
  var duhar = "⥯";
  var dwangle = "⦦";
  var DZcy = "Џ";
  var dzcy = "џ";
  var dzigrarr = "⟿";
  var Eacute = "É";
  var eacute = "é";
  var easter = "⩮";
  var Ecaron = "Ě";
  var ecaron = "ě";
  var Ecirc = "Ê";
  var ecirc = "ê";
  var ecir = "≖";
  var ecolon = "≕";
  var Ecy = "Э";
  var ecy = "э";
  var eDDot = "⩷";
  var Edot = "Ė";
  var edot = "ė";
  var eDot = "≑";
  var ee = "ⅇ";
  var efDot = "≒";
  var Efr = "𝔈";
  var efr = "𝔢";
  var eg = "⪚";
  var Egrave = "È";
  var egrave = "è";
  var egs = "⪖";
  var egsdot = "⪘";
  var el = "⪙";
  var Element = "∈";
  var elinters = "⏧";
  var ell = "ℓ";
  var els = "⪕";
  var elsdot = "⪗";
  var Emacr = "Ē";
  var emacr = "ē";
  var empty = "∅";
  var emptyset = "∅";
  var EmptySmallSquare = "◻";
  var emptyv = "∅";
  var EmptyVerySmallSquare = "▫";
  var emsp13 = " ";
  var emsp14 = " ";
  var emsp = " ";
  var ENG = "Ŋ";
  var eng = "ŋ";
  var ensp = " ";
  var Eogon = "Ę";
  var eogon = "ę";
  var Eopf = "𝔼";
  var eopf = "𝕖";
  var epar = "⋕";
  var eparsl = "⧣";
  var eplus = "⩱";
  var epsi = "ε";
  var Epsilon = "Ε";
  var epsilon = "ε";
  var epsiv = "ϵ";
  var eqcirc = "≖";
  var eqcolon = "≕";
  var eqsim = "≂";
  var eqslantgtr = "⪖";
  var eqslantless = "⪕";
  var Equal = "⩵";
  var equals = "=";
  var EqualTilde = "≂";
  var equest = "≟";
  var Equilibrium = "⇌";
  var equiv = "≡";
  var equivDD = "⩸";
  var eqvparsl = "⧥";
  var erarr = "⥱";
  var erDot = "≓";
  var escr = "ℯ";
  var Escr = "ℰ";
  var esdot = "≐";
  var Esim = "⩳";
  var esim = "≂";
  var Eta = "Η";
  var eta = "η";
  var ETH = "Ð";
  var eth = "ð";
  var Euml = "Ë";
  var euml = "ë";
  var euro = "€";
  var excl = "!";
  var exist = "∃";
  var Exists = "∃";
  var expectation = "ℰ";
  var exponentiale = "ⅇ";
  var ExponentialE = "ⅇ";
  var fallingdotseq = "≒";
  var Fcy = "Ф";
  var fcy = "ф";
  var female = "♀";
  var ffilig = "ﬃ";
  var fflig = "ﬀ";
  var ffllig = "ﬄ";
  var Ffr = "𝔉";
  var ffr = "𝔣";
  var filig = "ﬁ";
  var FilledSmallSquare = "◼";
  var FilledVerySmallSquare = "▪";
  var fjlig = "fj";
  var flat = "♭";
  var fllig = "ﬂ";
  var fltns = "▱";
  var fnof = "ƒ";
  var Fopf = "𝔽";
  var fopf = "𝕗";
  var forall = "∀";
  var ForAll = "∀";
  var fork = "⋔";
  var forkv = "⫙";
  var Fouriertrf = "ℱ";
  var fpartint = "⨍";
  var frac12 = "½";
  var frac13 = "⅓";
  var frac14 = "¼";
  var frac15 = "⅕";
  var frac16 = "⅙";
  var frac18 = "⅛";
  var frac23 = "⅔";
  var frac25 = "⅖";
  var frac34 = "¾";
  var frac35 = "⅗";
  var frac38 = "⅜";
  var frac45 = "⅘";
  var frac56 = "⅚";
  var frac58 = "⅝";
  var frac78 = "⅞";
  var frasl = "⁄";
  var frown = "⌢";
  var fscr = "𝒻";
  var Fscr = "ℱ";
  var gacute = "ǵ";
  var Gamma = "Γ";
  var gamma = "γ";
  var Gammad = "Ϝ";
  var gammad = "ϝ";
  var gap = "⪆";
  var Gbreve = "Ğ";
  var gbreve = "ğ";
  var Gcedil = "Ģ";
  var Gcirc = "Ĝ";
  var gcirc = "ĝ";
  var Gcy = "Г";
  var gcy = "г";
  var Gdot = "Ġ";
  var gdot = "ġ";
  var ge = "≥";
  var gE = "≧";
  var gEl = "⪌";
  var gel = "⋛";
  var geq = "≥";
  var geqq = "≧";
  var geqslant = "⩾";
  var gescc = "⪩";
  var ges = "⩾";
  var gesdot = "⪀";
  var gesdoto = "⪂";
  var gesdotol = "⪄";
  var gesl = "⋛︀";
  var gesles = "⪔";
  var Gfr = "𝔊";
  var gfr = "𝔤";
  var gg = "≫";
  var Gg = "⋙";
  var ggg = "⋙";
  var gimel = "ℷ";
  var GJcy = "Ѓ";
  var gjcy = "ѓ";
  var gla = "⪥";
  var gl = "≷";
  var glE = "⪒";
  var glj = "⪤";
  var gnap = "⪊";
  var gnapprox = "⪊";
  var gne = "⪈";
  var gnE = "≩";
  var gneq = "⪈";
  var gneqq = "≩";
  var gnsim = "⋧";
  var Gopf = "𝔾";
  var gopf = "𝕘";
  var grave = "`";
  var GreaterEqual = "≥";
  var GreaterEqualLess = "⋛";
  var GreaterFullEqual = "≧";
  var GreaterGreater = "⪢";
  var GreaterLess = "≷";
  var GreaterSlantEqual = "⩾";
  var GreaterTilde = "≳";
  var Gscr = "𝒢";
  var gscr = "ℊ";
  var gsim = "≳";
  var gsime = "⪎";
  var gsiml = "⪐";
  var gtcc = "⪧";
  var gtcir = "⩺";
  var gt = ">";
  var GT$1 = ">";
  var Gt = "≫";
  var gtdot = "⋗";
  var gtlPar = "⦕";
  var gtquest = "⩼";
  var gtrapprox = "⪆";
  var gtrarr = "⥸";
  var gtrdot = "⋗";
  var gtreqless = "⋛";
  var gtreqqless = "⪌";
  var gtrless = "≷";
  var gtrsim = "≳";
  var gvertneqq = "≩︀";
  var gvnE = "≩︀";
  var Hacek = "ˇ";
  var hairsp = " ";
  var half = "½";
  var hamilt = "ℋ";
  var HARDcy = "Ъ";
  var hardcy = "ъ";
  var harrcir = "⥈";
  var harr = "↔";
  var hArr = "⇔";
  var harrw = "↭";
  var Hat = "^";
  var hbar = "ℏ";
  var Hcirc = "Ĥ";
  var hcirc = "ĥ";
  var hearts = "♥";
  var heartsuit = "♥";
  var hellip = "…";
  var hercon = "⊹";
  var hfr = "𝔥";
  var Hfr = "ℌ";
  var HilbertSpace = "ℋ";
  var hksearow = "⤥";
  var hkswarow = "⤦";
  var hoarr = "⇿";
  var homtht = "∻";
  var hookleftarrow = "↩";
  var hookrightarrow = "↪";
  var hopf = "𝕙";
  var Hopf = "ℍ";
  var horbar = "―";
  var HorizontalLine = "─";
  var hscr = "𝒽";
  var Hscr = "ℋ";
  var hslash = "ℏ";
  var Hstrok = "Ħ";
  var hstrok = "ħ";
  var HumpDownHump = "≎";
  var HumpEqual = "≏";
  var hybull = "⁃";
  var hyphen = "‐";
  var Iacute = "Í";
  var iacute = "í";
  var ic = "⁣";
  var Icirc = "Î";
  var icirc = "î";
  var Icy = "И";
  var icy = "и";
  var Idot = "İ";
  var IEcy = "Е";
  var iecy = "е";
  var iexcl = "¡";
  var iff = "⇔";
  var ifr = "𝔦";
  var Ifr = "ℑ";
  var Igrave = "Ì";
  var igrave = "ì";
  var ii = "ⅈ";
  var iiiint = "⨌";
  var iiint = "∭";
  var iinfin = "⧜";
  var iiota = "℩";
  var IJlig = "Ĳ";
  var ijlig = "ĳ";
  var Imacr = "Ī";
  var imacr = "ī";
  var image = "ℑ";
  var ImaginaryI = "ⅈ";
  var imagline = "ℐ";
  var imagpart = "ℑ";
  var imath = "ı";
  var Im = "ℑ";
  var imof = "⊷";
  var imped = "Ƶ";
  var Implies = "⇒";
  var incare = "℅";
  var infin = "∞";
  var infintie = "⧝";
  var inodot = "ı";
  var intcal = "⊺";
  var int = "∫";
  var Int = "∬";
  var integers = "ℤ";
  var Integral = "∫";
  var intercal = "⊺";
  var Intersection = "⋂";
  var intlarhk = "⨗";
  var intprod = "⨼";
  var InvisibleComma = "⁣";
  var InvisibleTimes = "⁢";
  var IOcy = "Ё";
  var iocy = "ё";
  var Iogon = "Į";
  var iogon = "į";
  var Iopf = "𝕀";
  var iopf = "𝕚";
  var Iota = "Ι";
  var iota = "ι";
  var iprod = "⨼";
  var iquest = "¿";
  var iscr = "𝒾";
  var Iscr = "ℐ";
  var isin = "∈";
  var isindot = "⋵";
  var isinE = "⋹";
  var isins = "⋴";
  var isinsv = "⋳";
  var isinv = "∈";
  var it = "⁢";
  var Itilde = "Ĩ";
  var itilde = "ĩ";
  var Iukcy = "І";
  var iukcy = "і";
  var Iuml = "Ï";
  var iuml = "ï";
  var Jcirc = "Ĵ";
  var jcirc = "ĵ";
  var Jcy = "Й";
  var jcy = "й";
  var Jfr = "𝔍";
  var jfr = "𝔧";
  var jmath = "ȷ";
  var Jopf = "𝕁";
  var jopf = "𝕛";
  var Jscr = "𝒥";
  var jscr = "𝒿";
  var Jsercy = "Ј";
  var jsercy = "ј";
  var Jukcy = "Є";
  var jukcy = "є";
  var Kappa = "Κ";
  var kappa = "κ";
  var kappav = "ϰ";
  var Kcedil = "Ķ";
  var kcedil = "ķ";
  var Kcy = "К";
  var kcy = "к";
  var Kfr = "𝔎";
  var kfr = "𝔨";
  var kgreen = "ĸ";
  var KHcy = "Х";
  var khcy = "х";
  var KJcy = "Ќ";
  var kjcy = "ќ";
  var Kopf = "𝕂";
  var kopf = "𝕜";
  var Kscr = "𝒦";
  var kscr = "𝓀";
  var lAarr = "⇚";
  var Lacute = "Ĺ";
  var lacute = "ĺ";
  var laemptyv = "⦴";
  var lagran = "ℒ";
  var Lambda = "Λ";
  var lambda = "λ";
  var lang = "⟨";
  var Lang = "⟪";
  var langd = "⦑";
  var langle = "⟨";
  var lap = "⪅";
  var Laplacetrf = "ℒ";
  var laquo = "«";
  var larrb = "⇤";
  var larrbfs = "⤟";
  var larr = "←";
  var Larr = "↞";
  var lArr = "⇐";
  var larrfs = "⤝";
  var larrhk = "↩";
  var larrlp = "↫";
  var larrpl = "⤹";
  var larrsim = "⥳";
  var larrtl = "↢";
  var latail = "⤙";
  var lAtail = "⤛";
  var lat = "⪫";
  var late = "⪭";
  var lates = "⪭︀";
  var lbarr = "⤌";
  var lBarr = "⤎";
  var lbbrk = "❲";
  var lbrace = "{";
  var lbrack = "[";
  var lbrke = "⦋";
  var lbrksld = "⦏";
  var lbrkslu = "⦍";
  var Lcaron = "Ľ";
  var lcaron = "ľ";
  var Lcedil = "Ļ";
  var lcedil = "ļ";
  var lceil = "⌈";
  var lcub = "{";
  var Lcy = "Л";
  var lcy = "л";
  var ldca = "⤶";
  var ldquo = "“";
  var ldquor = "„";
  var ldrdhar = "⥧";
  var ldrushar = "⥋";
  var ldsh = "↲";
  var le = "≤";
  var lE = "≦";
  var LeftAngleBracket = "⟨";
  var LeftArrowBar = "⇤";
  var leftarrow = "←";
  var LeftArrow = "←";
  var Leftarrow = "⇐";
  var LeftArrowRightArrow = "⇆";
  var leftarrowtail = "↢";
  var LeftCeiling = "⌈";
  var LeftDoubleBracket = "⟦";
  var LeftDownTeeVector = "⥡";
  var LeftDownVectorBar = "⥙";
  var LeftDownVector = "⇃";
  var LeftFloor = "⌊";
  var leftharpoondown = "↽";
  var leftharpoonup = "↼";
  var leftleftarrows = "⇇";
  var leftrightarrow = "↔";
  var LeftRightArrow = "↔";
  var Leftrightarrow = "⇔";
  var leftrightarrows = "⇆";
  var leftrightharpoons = "⇋";
  var leftrightsquigarrow = "↭";
  var LeftRightVector = "⥎";
  var LeftTeeArrow = "↤";
  var LeftTee = "⊣";
  var LeftTeeVector = "⥚";
  var leftthreetimes = "⋋";
  var LeftTriangleBar = "⧏";
  var LeftTriangle = "⊲";
  var LeftTriangleEqual = "⊴";
  var LeftUpDownVector = "⥑";
  var LeftUpTeeVector = "⥠";
  var LeftUpVectorBar = "⥘";
  var LeftUpVector = "↿";
  var LeftVectorBar = "⥒";
  var LeftVector = "↼";
  var lEg = "⪋";
  var leg = "⋚";
  var leq = "≤";
  var leqq = "≦";
  var leqslant = "⩽";
  var lescc = "⪨";
  var les = "⩽";
  var lesdot = "⩿";
  var lesdoto = "⪁";
  var lesdotor = "⪃";
  var lesg = "⋚︀";
  var lesges = "⪓";
  var lessapprox = "⪅";
  var lessdot = "⋖";
  var lesseqgtr = "⋚";
  var lesseqqgtr = "⪋";
  var LessEqualGreater = "⋚";
  var LessFullEqual = "≦";
  var LessGreater = "≶";
  var lessgtr = "≶";
  var LessLess = "⪡";
  var lesssim = "≲";
  var LessSlantEqual = "⩽";
  var LessTilde = "≲";
  var lfisht = "⥼";
  var lfloor = "⌊";
  var Lfr = "𝔏";
  var lfr = "𝔩";
  var lg = "≶";
  var lgE = "⪑";
  var lHar = "⥢";
  var lhard = "↽";
  var lharu = "↼";
  var lharul = "⥪";
  var lhblk = "▄";
  var LJcy = "Љ";
  var ljcy = "љ";
  var llarr = "⇇";
  var ll = "≪";
  var Ll = "⋘";
  var llcorner = "⌞";
  var Lleftarrow = "⇚";
  var llhard = "⥫";
  var lltri = "◺";
  var Lmidot = "Ŀ";
  var lmidot = "ŀ";
  var lmoustache = "⎰";
  var lmoust = "⎰";
  var lnap = "⪉";
  var lnapprox = "⪉";
  var lne = "⪇";
  var lnE = "≨";
  var lneq = "⪇";
  var lneqq = "≨";
  var lnsim = "⋦";
  var loang = "⟬";
  var loarr = "⇽";
  var lobrk = "⟦";
  var longleftarrow = "⟵";
  var LongLeftArrow = "⟵";
  var Longleftarrow = "⟸";
  var longleftrightarrow = "⟷";
  var LongLeftRightArrow = "⟷";
  var Longleftrightarrow = "⟺";
  var longmapsto = "⟼";
  var longrightarrow = "⟶";
  var LongRightArrow = "⟶";
  var Longrightarrow = "⟹";
  var looparrowleft = "↫";
  var looparrowright = "↬";
  var lopar = "⦅";
  var Lopf = "𝕃";
  var lopf = "𝕝";
  var loplus = "⨭";
  var lotimes = "⨴";
  var lowast = "∗";
  var lowbar = "_";
  var LowerLeftArrow = "↙";
  var LowerRightArrow = "↘";
  var loz = "◊";
  var lozenge = "◊";
  var lozf = "⧫";
  var lpar = "(";
  var lparlt = "⦓";
  var lrarr = "⇆";
  var lrcorner = "⌟";
  var lrhar = "⇋";
  var lrhard = "⥭";
  var lrm = "‎";
  var lrtri = "⊿";
  var lsaquo = "‹";
  var lscr = "𝓁";
  var Lscr = "ℒ";
  var lsh = "↰";
  var Lsh = "↰";
  var lsim = "≲";
  var lsime = "⪍";
  var lsimg = "⪏";
  var lsqb = "[";
  var lsquo = "‘";
  var lsquor = "‚";
  var Lstrok = "Ł";
  var lstrok = "ł";
  var ltcc = "⪦";
  var ltcir = "⩹";
  var lt = "<";
  var LT$1 = "<";
  var Lt = "≪";
  var ltdot = "⋖";
  var lthree = "⋋";
  var ltimes = "⋉";
  var ltlarr = "⥶";
  var ltquest = "⩻";
  var ltri = "◃";
  var ltrie = "⊴";
  var ltrif = "◂";
  var ltrPar = "⦖";
  var lurdshar = "⥊";
  var luruhar = "⥦";
  var lvertneqq = "≨︀";
  var lvnE = "≨︀";
  var macr = "¯";
  var male = "♂";
  var malt = "✠";
  var maltese = "✠";
  var map = "↦";
  var mapsto = "↦";
  var mapstodown = "↧";
  var mapstoleft = "↤";
  var mapstoup = "↥";
  var marker = "▮";
  var mcomma = "⨩";
  var Mcy = "М";
  var mcy = "м";
  var mdash = "—";
  var mDDot = "∺";
  var measuredangle = "∡";
  var MediumSpace = " ";
  var Mellintrf = "ℳ";
  var Mfr = "𝔐";
  var mfr = "𝔪";
  var mho = "℧";
  var micro = "µ";
  var midast = "*";
  var midcir = "⫰";
  var mid = "∣";
  var middot = "·";
  var minusb = "⊟";
  var minus = "−";
  var minusd = "∸";
  var minusdu = "⨪";
  var MinusPlus = "∓";
  var mlcp = "⫛";
  var mldr = "…";
  var mnplus = "∓";
  var models = "⊧";
  var Mopf = "𝕄";
  var mopf = "𝕞";
  var mp = "∓";
  var mscr = "𝓂";
  var Mscr = "ℳ";
  var mstpos = "∾";
  var Mu = "Μ";
  var mu = "μ";
  var multimap = "⊸";
  var mumap = "⊸";
  var nabla = "∇";
  var Nacute = "Ń";
  var nacute = "ń";
  var nang = "∠⃒";
  var nap = "≉";
  var napE = "⩰̸";
  var napid = "≋̸";
  var napos = "ŉ";
  var napprox = "≉";
  var natural = "♮";
  var naturals = "ℕ";
  var natur = "♮";
  var nbsp = " ";
  var nbump = "≎̸";
  var nbumpe = "≏̸";
  var ncap = "⩃";
  var Ncaron = "Ň";
  var ncaron = "ň";
  var Ncedil = "Ņ";
  var ncedil = "ņ";
  var ncong = "≇";
  var ncongdot = "⩭̸";
  var ncup = "⩂";
  var Ncy = "Н";
  var ncy = "н";
  var ndash = "–";
  var nearhk = "⤤";
  var nearr = "↗";
  var neArr = "⇗";
  var nearrow = "↗";
  var ne = "≠";
  var nedot = "≐̸";
  var NegativeMediumSpace = "​";
  var NegativeThickSpace = "​";
  var NegativeThinSpace = "​";
  var NegativeVeryThinSpace = "​";
  var nequiv = "≢";
  var nesear = "⤨";
  var nesim = "≂̸";
  var NestedGreaterGreater = "≫";
  var NestedLessLess = "≪";
  var NewLine = "\n";
  var nexist = "∄";
  var nexists = "∄";
  var Nfr = "𝔑";
  var nfr = "𝔫";
  var ngE = "≧̸";
  var nge = "≱";
  var ngeq = "≱";
  var ngeqq = "≧̸";
  var ngeqslant = "⩾̸";
  var nges = "⩾̸";
  var nGg = "⋙̸";
  var ngsim = "≵";
  var nGt = "≫⃒";
  var ngt = "≯";
  var ngtr = "≯";
  var nGtv = "≫̸";
  var nharr = "↮";
  var nhArr = "⇎";
  var nhpar = "⫲";
  var ni = "∋";
  var nis = "⋼";
  var nisd = "⋺";
  var niv = "∋";
  var NJcy = "Њ";
  var njcy = "њ";
  var nlarr = "↚";
  var nlArr = "⇍";
  var nldr = "‥";
  var nlE = "≦̸";
  var nle = "≰";
  var nleftarrow = "↚";
  var nLeftarrow = "⇍";
  var nleftrightarrow = "↮";
  var nLeftrightarrow = "⇎";
  var nleq = "≰";
  var nleqq = "≦̸";
  var nleqslant = "⩽̸";
  var nles = "⩽̸";
  var nless = "≮";
  var nLl = "⋘̸";
  var nlsim = "≴";
  var nLt = "≪⃒";
  var nlt = "≮";
  var nltri = "⋪";
  var nltrie = "⋬";
  var nLtv = "≪̸";
  var nmid = "∤";
  var NoBreak = "⁠";
  var NonBreakingSpace = " ";
  var nopf = "𝕟";
  var Nopf = "ℕ";
  var Not = "⫬";
  var not = "¬";
  var NotCongruent = "≢";
  var NotCupCap = "≭";
  var NotDoubleVerticalBar = "∦";
  var NotElement = "∉";
  var NotEqual = "≠";
  var NotEqualTilde = "≂̸";
  var NotExists = "∄";
  var NotGreater = "≯";
  var NotGreaterEqual = "≱";
  var NotGreaterFullEqual = "≧̸";
  var NotGreaterGreater = "≫̸";
  var NotGreaterLess = "≹";
  var NotGreaterSlantEqual = "⩾̸";
  var NotGreaterTilde = "≵";
  var NotHumpDownHump = "≎̸";
  var NotHumpEqual = "≏̸";
  var notin = "∉";
  var notindot = "⋵̸";
  var notinE = "⋹̸";
  var notinva = "∉";
  var notinvb = "⋷";
  var notinvc = "⋶";
  var NotLeftTriangleBar = "⧏̸";
  var NotLeftTriangle = "⋪";
  var NotLeftTriangleEqual = "⋬";
  var NotLess = "≮";
  var NotLessEqual = "≰";
  var NotLessGreater = "≸";
  var NotLessLess = "≪̸";
  var NotLessSlantEqual = "⩽̸";
  var NotLessTilde = "≴";
  var NotNestedGreaterGreater = "⪢̸";
  var NotNestedLessLess = "⪡̸";
  var notni = "∌";
  var notniva = "∌";
  var notnivb = "⋾";
  var notnivc = "⋽";
  var NotPrecedes = "⊀";
  var NotPrecedesEqual = "⪯̸";
  var NotPrecedesSlantEqual = "⋠";
  var NotReverseElement = "∌";
  var NotRightTriangleBar = "⧐̸";
  var NotRightTriangle = "⋫";
  var NotRightTriangleEqual = "⋭";
  var NotSquareSubset = "⊏̸";
  var NotSquareSubsetEqual = "⋢";
  var NotSquareSuperset = "⊐̸";
  var NotSquareSupersetEqual = "⋣";
  var NotSubset = "⊂⃒";
  var NotSubsetEqual = "⊈";
  var NotSucceeds = "⊁";
  var NotSucceedsEqual = "⪰̸";
  var NotSucceedsSlantEqual = "⋡";
  var NotSucceedsTilde = "≿̸";
  var NotSuperset = "⊃⃒";
  var NotSupersetEqual = "⊉";
  var NotTilde = "≁";
  var NotTildeEqual = "≄";
  var NotTildeFullEqual = "≇";
  var NotTildeTilde = "≉";
  var NotVerticalBar = "∤";
  var nparallel = "∦";
  var npar = "∦";
  var nparsl = "⫽⃥";
  var npart = "∂̸";
  var npolint = "⨔";
  var npr = "⊀";
  var nprcue = "⋠";
  var nprec = "⊀";
  var npreceq = "⪯̸";
  var npre = "⪯̸";
  var nrarrc = "⤳̸";
  var nrarr = "↛";
  var nrArr = "⇏";
  var nrarrw = "↝̸";
  var nrightarrow = "↛";
  var nRightarrow = "⇏";
  var nrtri = "⋫";
  var nrtrie = "⋭";
  var nsc = "⊁";
  var nsccue = "⋡";
  var nsce = "⪰̸";
  var Nscr = "𝒩";
  var nscr = "𝓃";
  var nshortmid = "∤";
  var nshortparallel = "∦";
  var nsim = "≁";
  var nsime = "≄";
  var nsimeq = "≄";
  var nsmid = "∤";
  var nspar = "∦";
  var nsqsube = "⋢";
  var nsqsupe = "⋣";
  var nsub = "⊄";
  var nsubE = "⫅̸";
  var nsube = "⊈";
  var nsubset = "⊂⃒";
  var nsubseteq = "⊈";
  var nsubseteqq = "⫅̸";
  var nsucc = "⊁";
  var nsucceq = "⪰̸";
  var nsup = "⊅";
  var nsupE = "⫆̸";
  var nsupe = "⊉";
  var nsupset = "⊃⃒";
  var nsupseteq = "⊉";
  var nsupseteqq = "⫆̸";
  var ntgl = "≹";
  var Ntilde = "Ñ";
  var ntilde = "ñ";
  var ntlg = "≸";
  var ntriangleleft = "⋪";
  var ntrianglelefteq = "⋬";
  var ntriangleright = "⋫";
  var ntrianglerighteq = "⋭";
  var Nu = "Ν";
  var nu = "ν";
  var num = "#";
  var numero = "№";
  var numsp = " ";
  var nvap = "≍⃒";
  var nvdash = "⊬";
  var nvDash = "⊭";
  var nVdash = "⊮";
  var nVDash = "⊯";
  var nvge = "≥⃒";
  var nvgt = ">⃒";
  var nvHarr = "⤄";
  var nvinfin = "⧞";
  var nvlArr = "⤂";
  var nvle = "≤⃒";
  var nvlt = "<⃒";
  var nvltrie = "⊴⃒";
  var nvrArr = "⤃";
  var nvrtrie = "⊵⃒";
  var nvsim = "∼⃒";
  var nwarhk = "⤣";
  var nwarr = "↖";
  var nwArr = "⇖";
  var nwarrow = "↖";
  var nwnear = "⤧";
  var Oacute = "Ó";
  var oacute = "ó";
  var oast = "⊛";
  var Ocirc = "Ô";
  var ocirc = "ô";
  var ocir = "⊚";
  var Ocy = "О";
  var ocy = "о";
  var odash = "⊝";
  var Odblac = "Ő";
  var odblac = "ő";
  var odiv = "⨸";
  var odot = "⊙";
  var odsold = "⦼";
  var OElig = "Œ";
  var oelig = "œ";
  var ofcir = "⦿";
  var Ofr = "𝔒";
  var ofr = "𝔬";
  var ogon = "˛";
  var Ograve = "Ò";
  var ograve = "ò";
  var ogt = "⧁";
  var ohbar = "⦵";
  var ohm = "Ω";
  var oint = "∮";
  var olarr = "↺";
  var olcir = "⦾";
  var olcross = "⦻";
  var oline = "‾";
  var olt = "⧀";
  var Omacr = "Ō";
  var omacr = "ō";
  var Omega = "Ω";
  var omega = "ω";
  var Omicron = "Ο";
  var omicron = "ο";
  var omid = "⦶";
  var ominus = "⊖";
  var Oopf = "𝕆";
  var oopf = "𝕠";
  var opar = "⦷";
  var OpenCurlyDoubleQuote = "“";
  var OpenCurlyQuote = "‘";
  var operp = "⦹";
  var oplus = "⊕";
  var orarr = "↻";
  var Or = "⩔";
  var or = "∨";
  var ord = "⩝";
  var order = "ℴ";
  var orderof = "ℴ";
  var ordf = "ª";
  var ordm = "º";
  var origof = "⊶";
  var oror = "⩖";
  var orslope = "⩗";
  var orv = "⩛";
  var oS = "Ⓢ";
  var Oscr = "𝒪";
  var oscr = "ℴ";
  var Oslash = "Ø";
  var oslash = "ø";
  var osol = "⊘";
  var Otilde = "Õ";
  var otilde = "õ";
  var otimesas = "⨶";
  var Otimes = "⨷";
  var otimes = "⊗";
  var Ouml = "Ö";
  var ouml = "ö";
  var ovbar = "⌽";
  var OverBar = "‾";
  var OverBrace = "⏞";
  var OverBracket = "⎴";
  var OverParenthesis = "⏜";
  var para = "¶";
  var parallel = "∥";
  var par = "∥";
  var parsim = "⫳";
  var parsl = "⫽";
  var part = "∂";
  var PartialD = "∂";
  var Pcy = "П";
  var pcy = "п";
  var percnt = "%";
  var period = ".";
  var permil = "‰";
  var perp = "⊥";
  var pertenk = "‱";
  var Pfr = "𝔓";
  var pfr = "𝔭";
  var Phi = "Φ";
  var phi = "φ";
  var phiv = "ϕ";
  var phmmat = "ℳ";
  var phone = "☎";
  var Pi = "Π";
  var pi = "π";
  var pitchfork = "⋔";
  var piv = "ϖ";
  var planck = "ℏ";
  var planckh = "ℎ";
  var plankv = "ℏ";
  var plusacir = "⨣";
  var plusb = "⊞";
  var pluscir = "⨢";
  var plus = "+";
  var plusdo = "∔";
  var plusdu = "⨥";
  var pluse = "⩲";
  var PlusMinus = "±";
  var plusmn = "±";
  var plussim = "⨦";
  var plustwo = "⨧";
  var pm = "±";
  var Poincareplane = "ℌ";
  var pointint = "⨕";
  var popf = "𝕡";
  var Popf = "ℙ";
  var pound = "£";
  var prap = "⪷";
  var Pr = "⪻";
  var pr = "≺";
  var prcue = "≼";
  var precapprox = "⪷";
  var prec = "≺";
  var preccurlyeq = "≼";
  var Precedes = "≺";
  var PrecedesEqual = "⪯";
  var PrecedesSlantEqual = "≼";
  var PrecedesTilde = "≾";
  var preceq = "⪯";
  var precnapprox = "⪹";
  var precneqq = "⪵";
  var precnsim = "⋨";
  var pre = "⪯";
  var prE = "⪳";
  var precsim = "≾";
  var prime = "′";
  var Prime = "″";
  var primes = "ℙ";
  var prnap = "⪹";
  var prnE = "⪵";
  var prnsim = "⋨";
  var prod = "∏";
  var Product = "∏";
  var profalar = "⌮";
  var profline = "⌒";
  var profsurf = "⌓";
  var prop = "∝";
  var Proportional = "∝";
  var Proportion = "∷";
  var propto = "∝";
  var prsim = "≾";
  var prurel = "⊰";
  var Pscr = "𝒫";
  var pscr = "𝓅";
  var Psi = "Ψ";
  var psi = "ψ";
  var puncsp = " ";
  var Qfr = "𝔔";
  var qfr = "𝔮";
  var qint = "⨌";
  var qopf = "𝕢";
  var Qopf = "ℚ";
  var qprime = "⁗";
  var Qscr = "𝒬";
  var qscr = "𝓆";
  var quaternions = "ℍ";
  var quatint = "⨖";
  var quest = "?";
  var questeq = "≟";
  var quot = "\"";
  var QUOT = "\"";
  var rAarr = "⇛";
  var race = "∽̱";
  var Racute = "Ŕ";
  var racute = "ŕ";
  var radic = "√";
  var raemptyv = "⦳";
  var rang = "⟩";
  var Rang = "⟫";
  var rangd = "⦒";
  var range = "⦥";
  var rangle = "⟩";
  var raquo = "»";
  var rarrap = "⥵";
  var rarrb = "⇥";
  var rarrbfs = "⤠";
  var rarrc = "⤳";
  var rarr = "→";
  var Rarr = "↠";
  var rArr = "⇒";
  var rarrfs = "⤞";
  var rarrhk = "↪";
  var rarrlp = "↬";
  var rarrpl = "⥅";
  var rarrsim = "⥴";
  var Rarrtl = "⤖";
  var rarrtl = "↣";
  var rarrw = "↝";
  var ratail = "⤚";
  var rAtail = "⤜";
  var ratio = "∶";
  var rationals = "ℚ";
  var rbarr = "⤍";
  var rBarr = "⤏";
  var RBarr = "⤐";
  var rbbrk = "❳";
  var rbrace = "}";
  var rbrack = "]";
  var rbrke = "⦌";
  var rbrksld = "⦎";
  var rbrkslu = "⦐";
  var Rcaron = "Ř";
  var rcaron = "ř";
  var Rcedil = "Ŗ";
  var rcedil = "ŗ";
  var rceil = "⌉";
  var rcub = "}";
  var Rcy = "Р";
  var rcy = "р";
  var rdca = "⤷";
  var rdldhar = "⥩";
  var rdquo = "”";
  var rdquor = "”";
  var rdsh = "↳";
  var real = "ℜ";
  var realine = "ℛ";
  var realpart = "ℜ";
  var reals = "ℝ";
  var Re = "ℜ";
  var rect = "▭";
  var reg = "®";
  var REG = "®";
  var ReverseElement = "∋";
  var ReverseEquilibrium = "⇋";
  var ReverseUpEquilibrium = "⥯";
  var rfisht = "⥽";
  var rfloor = "⌋";
  var rfr = "𝔯";
  var Rfr = "ℜ";
  var rHar = "⥤";
  var rhard = "⇁";
  var rharu = "⇀";
  var rharul = "⥬";
  var Rho = "Ρ";
  var rho = "ρ";
  var rhov = "ϱ";
  var RightAngleBracket = "⟩";
  var RightArrowBar = "⇥";
  var rightarrow = "→";
  var RightArrow = "→";
  var Rightarrow = "⇒";
  var RightArrowLeftArrow = "⇄";
  var rightarrowtail = "↣";
  var RightCeiling = "⌉";
  var RightDoubleBracket = "⟧";
  var RightDownTeeVector = "⥝";
  var RightDownVectorBar = "⥕";
  var RightDownVector = "⇂";
  var RightFloor = "⌋";
  var rightharpoondown = "⇁";
  var rightharpoonup = "⇀";
  var rightleftarrows = "⇄";
  var rightleftharpoons = "⇌";
  var rightrightarrows = "⇉";
  var rightsquigarrow = "↝";
  var RightTeeArrow = "↦";
  var RightTee = "⊢";
  var RightTeeVector = "⥛";
  var rightthreetimes = "⋌";
  var RightTriangleBar = "⧐";
  var RightTriangle = "⊳";
  var RightTriangleEqual = "⊵";
  var RightUpDownVector = "⥏";
  var RightUpTeeVector = "⥜";
  var RightUpVectorBar = "⥔";
  var RightUpVector = "↾";
  var RightVectorBar = "⥓";
  var RightVector = "⇀";
  var ring = "˚";
  var risingdotseq = "≓";
  var rlarr = "⇄";
  var rlhar = "⇌";
  var rlm = "‏";
  var rmoustache = "⎱";
  var rmoust = "⎱";
  var rnmid = "⫮";
  var roang = "⟭";
  var roarr = "⇾";
  var robrk = "⟧";
  var ropar = "⦆";
  var ropf = "𝕣";
  var Ropf = "ℝ";
  var roplus = "⨮";
  var rotimes = "⨵";
  var RoundImplies = "⥰";
  var rpar = ")";
  var rpargt = "⦔";
  var rppolint = "⨒";
  var rrarr = "⇉";
  var Rrightarrow = "⇛";
  var rsaquo = "›";
  var rscr = "𝓇";
  var Rscr = "ℛ";
  var rsh = "↱";
  var Rsh = "↱";
  var rsqb = "]";
  var rsquo = "’";
  var rsquor = "’";
  var rthree = "⋌";
  var rtimes = "⋊";
  var rtri = "▹";
  var rtrie = "⊵";
  var rtrif = "▸";
  var rtriltri = "⧎";
  var RuleDelayed = "⧴";
  var ruluhar = "⥨";
  var rx = "℞";
  var Sacute = "Ś";
  var sacute = "ś";
  var sbquo = "‚";
  var scap = "⪸";
  var Scaron = "Š";
  var scaron = "š";
  var Sc = "⪼";
  var sc = "≻";
  var sccue = "≽";
  var sce = "⪰";
  var scE = "⪴";
  var Scedil = "Ş";
  var scedil = "ş";
  var Scirc = "Ŝ";
  var scirc = "ŝ";
  var scnap = "⪺";
  var scnE = "⪶";
  var scnsim = "⋩";
  var scpolint = "⨓";
  var scsim = "≿";
  var Scy = "С";
  var scy = "с";
  var sdotb = "⊡";
  var sdot = "⋅";
  var sdote = "⩦";
  var searhk = "⤥";
  var searr = "↘";
  var seArr = "⇘";
  var searrow = "↘";
  var sect = "§";
  var semi = ";";
  var seswar = "⤩";
  var setminus = "∖";
  var setmn = "∖";
  var sext = "✶";
  var Sfr = "𝔖";
  var sfr = "𝔰";
  var sfrown = "⌢";
  var sharp = "♯";
  var SHCHcy = "Щ";
  var shchcy = "щ";
  var SHcy = "Ш";
  var shcy = "ш";
  var ShortDownArrow = "↓";
  var ShortLeftArrow = "←";
  var shortmid = "∣";
  var shortparallel = "∥";
  var ShortRightArrow = "→";
  var ShortUpArrow = "↑";
  var shy = "­";
  var Sigma = "Σ";
  var sigma = "σ";
  var sigmaf = "ς";
  var sigmav = "ς";
  var sim = "∼";
  var simdot = "⩪";
  var sime = "≃";
  var simeq = "≃";
  var simg = "⪞";
  var simgE = "⪠";
  var siml = "⪝";
  var simlE = "⪟";
  var simne = "≆";
  var simplus = "⨤";
  var simrarr = "⥲";
  var slarr = "←";
  var SmallCircle = "∘";
  var smallsetminus = "∖";
  var smashp = "⨳";
  var smeparsl = "⧤";
  var smid = "∣";
  var smile = "⌣";
  var smt = "⪪";
  var smte = "⪬";
  var smtes = "⪬︀";
  var SOFTcy = "Ь";
  var softcy = "ь";
  var solbar = "⌿";
  var solb = "⧄";
  var sol = "/";
  var Sopf = "𝕊";
  var sopf = "𝕤";
  var spades = "♠";
  var spadesuit = "♠";
  var spar = "∥";
  var sqcap = "⊓";
  var sqcaps = "⊓︀";
  var sqcup = "⊔";
  var sqcups = "⊔︀";
  var Sqrt = "√";
  var sqsub = "⊏";
  var sqsube = "⊑";
  var sqsubset = "⊏";
  var sqsubseteq = "⊑";
  var sqsup = "⊐";
  var sqsupe = "⊒";
  var sqsupset = "⊐";
  var sqsupseteq = "⊒";
  var square = "□";
  var Square = "□";
  var SquareIntersection = "⊓";
  var SquareSubset = "⊏";
  var SquareSubsetEqual = "⊑";
  var SquareSuperset = "⊐";
  var SquareSupersetEqual = "⊒";
  var SquareUnion = "⊔";
  var squarf = "▪";
  var squ = "□";
  var squf = "▪";
  var srarr = "→";
  var Sscr = "𝒮";
  var sscr = "𝓈";
  var ssetmn = "∖";
  var ssmile = "⌣";
  var sstarf = "⋆";
  var Star = "⋆";
  var star = "☆";
  var starf = "★";
  var straightepsilon = "ϵ";
  var straightphi = "ϕ";
  var strns = "¯";
  var sub = "⊂";
  var Sub = "⋐";
  var subdot = "⪽";
  var subE = "⫅";
  var sube = "⊆";
  var subedot = "⫃";
  var submult = "⫁";
  var subnE = "⫋";
  var subne = "⊊";
  var subplus = "⪿";
  var subrarr = "⥹";
  var subset = "⊂";
  var Subset = "⋐";
  var subseteq = "⊆";
  var subseteqq = "⫅";
  var SubsetEqual = "⊆";
  var subsetneq = "⊊";
  var subsetneqq = "⫋";
  var subsim = "⫇";
  var subsub = "⫕";
  var subsup = "⫓";
  var succapprox = "⪸";
  var succ = "≻";
  var succcurlyeq = "≽";
  var Succeeds = "≻";
  var SucceedsEqual = "⪰";
  var SucceedsSlantEqual = "≽";
  var SucceedsTilde = "≿";
  var succeq = "⪰";
  var succnapprox = "⪺";
  var succneqq = "⪶";
  var succnsim = "⋩";
  var succsim = "≿";
  var SuchThat = "∋";
  var sum = "∑";
  var Sum = "∑";
  var sung = "♪";
  var sup1 = "¹";
  var sup2 = "²";
  var sup3 = "³";
  var sup = "⊃";
  var Sup = "⋑";
  var supdot = "⪾";
  var supdsub = "⫘";
  var supE = "⫆";
  var supe = "⊇";
  var supedot = "⫄";
  var Superset = "⊃";
  var SupersetEqual = "⊇";
  var suphsol = "⟉";
  var suphsub = "⫗";
  var suplarr = "⥻";
  var supmult = "⫂";
  var supnE = "⫌";
  var supne = "⊋";
  var supplus = "⫀";
  var supset = "⊃";
  var Supset = "⋑";
  var supseteq = "⊇";
  var supseteqq = "⫆";
  var supsetneq = "⊋";
  var supsetneqq = "⫌";
  var supsim = "⫈";
  var supsub = "⫔";
  var supsup = "⫖";
  var swarhk = "⤦";
  var swarr = "↙";
  var swArr = "⇙";
  var swarrow = "↙";
  var swnwar = "⤪";
  var szlig = "ß";
  var Tab = "\t";
  var target = "⌖";
  var Tau = "Τ";
  var tau = "τ";
  var tbrk = "⎴";
  var Tcaron = "Ť";
  var tcaron = "ť";
  var Tcedil = "Ţ";
  var tcedil = "ţ";
  var Tcy = "Т";
  var tcy = "т";
  var tdot = "⃛";
  var telrec = "⌕";
  var Tfr = "𝔗";
  var tfr = "𝔱";
  var there4 = "∴";
  var therefore = "∴";
  var Therefore = "∴";
  var Theta = "Θ";
  var theta = "θ";
  var thetasym = "ϑ";
  var thetav = "ϑ";
  var thickapprox = "≈";
  var thicksim = "∼";
  var ThickSpace = "  ";
  var ThinSpace = " ";
  var thinsp = " ";
  var thkap = "≈";
  var thksim = "∼";
  var THORN = "Þ";
  var thorn = "þ";
  var tilde = "˜";
  var Tilde = "∼";
  var TildeEqual = "≃";
  var TildeFullEqual = "≅";
  var TildeTilde = "≈";
  var timesbar = "⨱";
  var timesb = "⊠";
  var times = "×";
  var timesd = "⨰";
  var tint = "∭";
  var toea = "⤨";
  var topbot = "⌶";
  var topcir = "⫱";
  var top = "⊤";
  var Topf = "𝕋";
  var topf = "𝕥";
  var topfork = "⫚";
  var tosa = "⤩";
  var tprime = "‴";
  var trade = "™";
  var TRADE = "™";
  var triangle = "▵";
  var triangledown = "▿";
  var triangleleft = "◃";
  var trianglelefteq = "⊴";
  var triangleq = "≜";
  var triangleright = "▹";
  var trianglerighteq = "⊵";
  var tridot = "◬";
  var trie = "≜";
  var triminus = "⨺";
  var TripleDot = "⃛";
  var triplus = "⨹";
  var trisb = "⧍";
  var tritime = "⨻";
  var trpezium = "⏢";
  var Tscr = "𝒯";
  var tscr = "𝓉";
  var TScy = "Ц";
  var tscy = "ц";
  var TSHcy = "Ћ";
  var tshcy = "ћ";
  var Tstrok = "Ŧ";
  var tstrok = "ŧ";
  var twixt = "≬";
  var twoheadleftarrow = "↞";
  var twoheadrightarrow = "↠";
  var Uacute = "Ú";
  var uacute = "ú";
  var uarr = "↑";
  var Uarr = "↟";
  var uArr = "⇑";
  var Uarrocir = "⥉";
  var Ubrcy = "Ў";
  var ubrcy = "ў";
  var Ubreve = "Ŭ";
  var ubreve = "ŭ";
  var Ucirc = "Û";
  var ucirc = "û";
  var Ucy = "У";
  var ucy = "у";
  var udarr = "⇅";
  var Udblac = "Ű";
  var udblac = "ű";
  var udhar = "⥮";
  var ufisht = "⥾";
  var Ufr = "𝔘";
  var ufr = "𝔲";
  var Ugrave = "Ù";
  var ugrave = "ù";
  var uHar = "⥣";
  var uharl = "↿";
  var uharr = "↾";
  var uhblk = "▀";
  var ulcorn = "⌜";
  var ulcorner = "⌜";
  var ulcrop = "⌏";
  var ultri = "◸";
  var Umacr = "Ū";
  var umacr = "ū";
  var uml = "¨";
  var UnderBar = "_";
  var UnderBrace = "⏟";
  var UnderBracket = "⎵";
  var UnderParenthesis = "⏝";
  var Union = "⋃";
  var UnionPlus = "⊎";
  var Uogon = "Ų";
  var uogon = "ų";
  var Uopf = "𝕌";
  var uopf = "𝕦";
  var UpArrowBar = "⤒";
  var uparrow = "↑";
  var UpArrow = "↑";
  var Uparrow = "⇑";
  var UpArrowDownArrow = "⇅";
  var updownarrow = "↕";
  var UpDownArrow = "↕";
  var Updownarrow = "⇕";
  var UpEquilibrium = "⥮";
  var upharpoonleft = "↿";
  var upharpoonright = "↾";
  var uplus = "⊎";
  var UpperLeftArrow = "↖";
  var UpperRightArrow = "↗";
  var upsi = "υ";
  var Upsi = "ϒ";
  var upsih = "ϒ";
  var Upsilon = "Υ";
  var upsilon = "υ";
  var UpTeeArrow = "↥";
  var UpTee = "⊥";
  var upuparrows = "⇈";
  var urcorn = "⌝";
  var urcorner = "⌝";
  var urcrop = "⌎";
  var Uring = "Ů";
  var uring = "ů";
  var urtri = "◹";
  var Uscr = "𝒰";
  var uscr = "𝓊";
  var utdot = "⋰";
  var Utilde = "Ũ";
  var utilde = "ũ";
  var utri = "▵";
  var utrif = "▴";
  var uuarr = "⇈";
  var Uuml = "Ü";
  var uuml = "ü";
  var uwangle = "⦧";
  var vangrt = "⦜";
  var varepsilon = "ϵ";
  var varkappa = "ϰ";
  var varnothing = "∅";
  var varphi = "ϕ";
  var varpi = "ϖ";
  var varpropto = "∝";
  var varr = "↕";
  var vArr = "⇕";
  var varrho = "ϱ";
  var varsigma = "ς";
  var varsubsetneq = "⊊︀";
  var varsubsetneqq = "⫋︀";
  var varsupsetneq = "⊋︀";
  var varsupsetneqq = "⫌︀";
  var vartheta = "ϑ";
  var vartriangleleft = "⊲";
  var vartriangleright = "⊳";
  var vBar = "⫨";
  var Vbar = "⫫";
  var vBarv = "⫩";
  var Vcy = "В";
  var vcy = "в";
  var vdash = "⊢";
  var vDash = "⊨";
  var Vdash = "⊩";
  var VDash = "⊫";
  var Vdashl = "⫦";
  var veebar = "⊻";
  var vee = "∨";
  var Vee = "⋁";
  var veeeq = "≚";
  var vellip = "⋮";
  var verbar = "|";
  var Verbar = "‖";
  var vert = "|";
  var Vert = "‖";
  var VerticalBar = "∣";
  var VerticalLine = "|";
  var VerticalSeparator = "❘";
  var VerticalTilde = "≀";
  var VeryThinSpace = " ";
  var Vfr = "𝔙";
  var vfr = "𝔳";
  var vltri = "⊲";
  var vnsub = "⊂⃒";
  var vnsup = "⊃⃒";
  var Vopf = "𝕍";
  var vopf = "𝕧";
  var vprop = "∝";
  var vrtri = "⊳";
  var Vscr = "𝒱";
  var vscr = "𝓋";
  var vsubnE = "⫋︀";
  var vsubne = "⊊︀";
  var vsupnE = "⫌︀";
  var vsupne = "⊋︀";
  var Vvdash = "⊪";
  var vzigzag = "⦚";
  var Wcirc = "Ŵ";
  var wcirc = "ŵ";
  var wedbar = "⩟";
  var wedge = "∧";
  var Wedge = "⋀";
  var wedgeq = "≙";
  var weierp = "℘";
  var Wfr = "𝔚";
  var wfr = "𝔴";
  var Wopf = "𝕎";
  var wopf = "𝕨";
  var wp = "℘";
  var wr = "≀";
  var wreath = "≀";
  var Wscr = "𝒲";
  var wscr = "𝓌";
  var xcap = "⋂";
  var xcirc = "◯";
  var xcup = "⋃";
  var xdtri = "▽";
  var Xfr = "𝔛";
  var xfr = "𝔵";
  var xharr = "⟷";
  var xhArr = "⟺";
  var Xi = "Ξ";
  var xi = "ξ";
  var xlarr = "⟵";
  var xlArr = "⟸";
  var xmap = "⟼";
  var xnis = "⋻";
  var xodot = "⨀";
  var Xopf = "𝕏";
  var xopf = "𝕩";
  var xoplus = "⨁";
  var xotime = "⨂";
  var xrarr = "⟶";
  var xrArr = "⟹";
  var Xscr = "𝒳";
  var xscr = "𝓍";
  var xsqcup = "⨆";
  var xuplus = "⨄";
  var xutri = "△";
  var xvee = "⋁";
  var xwedge = "⋀";
  var Yacute = "Ý";
  var yacute = "ý";
  var YAcy = "Я";
  var yacy = "я";
  var Ycirc = "Ŷ";
  var ycirc = "ŷ";
  var Ycy = "Ы";
  var ycy = "ы";
  var yen = "¥";
  var Yfr = "𝔜";
  var yfr = "𝔶";
  var YIcy = "Ї";
  var yicy = "ї";
  var Yopf = "𝕐";
  var yopf = "𝕪";
  var Yscr = "𝒴";
  var yscr = "𝓎";
  var YUcy = "Ю";
  var yucy = "ю";
  var yuml = "ÿ";
  var Yuml = "Ÿ";
  var Zacute = "Ź";
  var zacute = "ź";
  var Zcaron = "Ž";
  var zcaron = "ž";
  var Zcy = "З";
  var zcy = "з";
  var Zdot = "Ż";
  var zdot = "ż";
  var zeetrf = "ℨ";
  var ZeroWidthSpace = "​";
  var Zeta = "Ζ";
  var zeta = "ζ";
  var zfr = "𝔷";
  var Zfr = "ℨ";
  var ZHcy = "Ж";
  var zhcy = "ж";
  var zigrarr = "⇝";
  var zopf = "𝕫";
  var Zopf = "ℤ";
  var Zscr = "𝒵";
  var zscr = "𝓏";
  var zwj = "‍";
  var zwnj = "‌";
  var require$$0 = {
  	Aacute: Aacute,
  	aacute: aacute,
  	Abreve: Abreve,
  	abreve: abreve,
  	ac: ac,
  	acd: acd,
  	acE: acE,
  	Acirc: Acirc,
  	acirc: acirc,
  	acute: acute,
  	Acy: Acy,
  	acy: acy,
  	AElig: AElig,
  	aelig: aelig,
  	af: af,
  	Afr: Afr,
  	afr: afr,
  	Agrave: Agrave,
  	agrave: agrave,
  	alefsym: alefsym,
  	aleph: aleph,
  	Alpha: Alpha,
  	alpha: alpha,
  	Amacr: Amacr,
  	amacr: amacr,
  	amalg: amalg,
  	amp: amp,
  	AMP: AMP,
  	andand: andand,
  	And: And,
  	and: and,
  	andd: andd,
  	andslope: andslope,
  	andv: andv,
  	ang: ang,
  	ange: ange,
  	angle: angle,
  	angmsdaa: angmsdaa,
  	angmsdab: angmsdab,
  	angmsdac: angmsdac,
  	angmsdad: angmsdad,
  	angmsdae: angmsdae,
  	angmsdaf: angmsdaf,
  	angmsdag: angmsdag,
  	angmsdah: angmsdah,
  	angmsd: angmsd,
  	angrt: angrt,
  	angrtvb: angrtvb,
  	angrtvbd: angrtvbd,
  	angsph: angsph,
  	angst: angst,
  	angzarr: angzarr,
  	Aogon: Aogon,
  	aogon: aogon,
  	Aopf: Aopf,
  	aopf: aopf,
  	apacir: apacir,
  	ap: ap,
  	apE: apE,
  	ape: ape,
  	apid: apid,
  	apos: apos,
  	ApplyFunction: ApplyFunction,
  	approx: approx,
  	approxeq: approxeq,
  	Aring: Aring,
  	aring: aring,
  	Ascr: Ascr,
  	ascr: ascr,
  	Assign: Assign,
  	ast: ast,
  	asymp: asymp,
  	asympeq: asympeq,
  	Atilde: Atilde,
  	atilde: atilde,
  	Auml: Auml,
  	auml: auml,
  	awconint: awconint,
  	awint: awint,
  	backcong: backcong,
  	backepsilon: backepsilon,
  	backprime: backprime,
  	backsim: backsim,
  	backsimeq: backsimeq,
  	Backslash: Backslash,
  	Barv: Barv,
  	barvee: barvee,
  	barwed: barwed,
  	Barwed: Barwed,
  	barwedge: barwedge,
  	bbrk: bbrk,
  	bbrktbrk: bbrktbrk,
  	bcong: bcong,
  	Bcy: Bcy,
  	bcy: bcy,
  	bdquo: bdquo,
  	becaus: becaus,
  	because: because,
  	Because: Because,
  	bemptyv: bemptyv,
  	bepsi: bepsi,
  	bernou: bernou,
  	Bernoullis: Bernoullis,
  	Beta: Beta,
  	beta: beta,
  	beth: beth,
  	between: between,
  	Bfr: Bfr,
  	bfr: bfr,
  	bigcap: bigcap,
  	bigcirc: bigcirc,
  	bigcup: bigcup,
  	bigodot: bigodot,
  	bigoplus: bigoplus,
  	bigotimes: bigotimes,
  	bigsqcup: bigsqcup,
  	bigstar: bigstar,
  	bigtriangledown: bigtriangledown,
  	bigtriangleup: bigtriangleup,
  	biguplus: biguplus,
  	bigvee: bigvee,
  	bigwedge: bigwedge,
  	bkarow: bkarow,
  	blacklozenge: blacklozenge,
  	blacksquare: blacksquare,
  	blacktriangle: blacktriangle,
  	blacktriangledown: blacktriangledown,
  	blacktriangleleft: blacktriangleleft,
  	blacktriangleright: blacktriangleright,
  	blank: blank,
  	blk12: blk12,
  	blk14: blk14,
  	blk34: blk34,
  	block: block,
  	bne: bne,
  	bnequiv: bnequiv,
  	bNot: bNot,
  	bnot: bnot,
  	Bopf: Bopf,
  	bopf: bopf,
  	bot: bot,
  	bottom: bottom,
  	bowtie: bowtie,
  	boxbox: boxbox,
  	boxdl: boxdl,
  	boxdL: boxdL,
  	boxDl: boxDl,
  	boxDL: boxDL,
  	boxdr: boxdr,
  	boxdR: boxdR,
  	boxDr: boxDr,
  	boxDR: boxDR,
  	boxh: boxh,
  	boxH: boxH,
  	boxhd: boxhd,
  	boxHd: boxHd,
  	boxhD: boxhD,
  	boxHD: boxHD,
  	boxhu: boxhu,
  	boxHu: boxHu,
  	boxhU: boxhU,
  	boxHU: boxHU,
  	boxminus: boxminus,
  	boxplus: boxplus,
  	boxtimes: boxtimes,
  	boxul: boxul,
  	boxuL: boxuL,
  	boxUl: boxUl,
  	boxUL: boxUL,
  	boxur: boxur,
  	boxuR: boxuR,
  	boxUr: boxUr,
  	boxUR: boxUR,
  	boxv: boxv,
  	boxV: boxV,
  	boxvh: boxvh,
  	boxvH: boxvH,
  	boxVh: boxVh,
  	boxVH: boxVH,
  	boxvl: boxvl,
  	boxvL: boxvL,
  	boxVl: boxVl,
  	boxVL: boxVL,
  	boxvr: boxvr,
  	boxvR: boxvR,
  	boxVr: boxVr,
  	boxVR: boxVR,
  	bprime: bprime,
  	breve: breve,
  	Breve: Breve,
  	brvbar: brvbar,
  	bscr: bscr,
  	Bscr: Bscr,
  	bsemi: bsemi,
  	bsim: bsim,
  	bsime: bsime,
  	bsolb: bsolb,
  	bsol: bsol,
  	bsolhsub: bsolhsub,
  	bull: bull,
  	bullet: bullet,
  	bump: bump,
  	bumpE: bumpE,
  	bumpe: bumpe,
  	Bumpeq: Bumpeq,
  	bumpeq: bumpeq,
  	Cacute: Cacute,
  	cacute: cacute,
  	capand: capand,
  	capbrcup: capbrcup,
  	capcap: capcap,
  	cap: cap,
  	Cap: Cap,
  	capcup: capcup,
  	capdot: capdot,
  	CapitalDifferentialD: CapitalDifferentialD,
  	caps: caps,
  	caret: caret,
  	caron: caron,
  	Cayleys: Cayleys,
  	ccaps: ccaps,
  	Ccaron: Ccaron,
  	ccaron: ccaron,
  	Ccedil: Ccedil,
  	ccedil: ccedil,
  	Ccirc: Ccirc,
  	ccirc: ccirc,
  	Cconint: Cconint,
  	ccups: ccups,
  	ccupssm: ccupssm,
  	Cdot: Cdot,
  	cdot: cdot,
  	cedil: cedil,
  	Cedilla: Cedilla,
  	cemptyv: cemptyv,
  	cent: cent,
  	centerdot: centerdot,
  	CenterDot: CenterDot,
  	cfr: cfr,
  	Cfr: Cfr,
  	CHcy: CHcy,
  	chcy: chcy,
  	check: check$1,
  	checkmark: checkmark,
  	Chi: Chi,
  	chi: chi,
  	circ: circ,
  	circeq: circeq,
  	circlearrowleft: circlearrowleft,
  	circlearrowright: circlearrowright,
  	circledast: circledast,
  	circledcirc: circledcirc,
  	circleddash: circleddash,
  	CircleDot: CircleDot,
  	circledR: circledR,
  	circledS: circledS,
  	CircleMinus: CircleMinus,
  	CirclePlus: CirclePlus,
  	CircleTimes: CircleTimes,
  	cir: cir,
  	cirE: cirE,
  	cire: cire,
  	cirfnint: cirfnint,
  	cirmid: cirmid,
  	cirscir: cirscir,
  	ClockwiseContourIntegral: ClockwiseContourIntegral,
  	CloseCurlyDoubleQuote: CloseCurlyDoubleQuote,
  	CloseCurlyQuote: CloseCurlyQuote,
  	clubs: clubs,
  	clubsuit: clubsuit,
  	colon: colon,
  	Colon: Colon,
  	Colone: Colone,
  	colone: colone,
  	coloneq: coloneq,
  	comma: comma,
  	commat: commat,
  	comp: comp,
  	compfn: compfn,
  	complement: complement,
  	complexes: complexes,
  	cong: cong,
  	congdot: congdot,
  	Congruent: Congruent,
  	conint: conint,
  	Conint: Conint,
  	ContourIntegral: ContourIntegral,
  	copf: copf,
  	Copf: Copf,
  	coprod: coprod,
  	Coproduct: Coproduct,
  	copy: copy,
  	COPY: COPY,
  	copysr: copysr,
  	CounterClockwiseContourIntegral: CounterClockwiseContourIntegral,
  	crarr: crarr,
  	cross: cross,
  	Cross: Cross,
  	Cscr: Cscr,
  	cscr: cscr,
  	csub: csub,
  	csube: csube,
  	csup: csup,
  	csupe: csupe,
  	ctdot: ctdot,
  	cudarrl: cudarrl,
  	cudarrr: cudarrr,
  	cuepr: cuepr,
  	cuesc: cuesc,
  	cularr: cularr,
  	cularrp: cularrp,
  	cupbrcap: cupbrcap,
  	cupcap: cupcap,
  	CupCap: CupCap,
  	cup: cup,
  	Cup: Cup,
  	cupcup: cupcup,
  	cupdot: cupdot,
  	cupor: cupor,
  	cups: cups,
  	curarr: curarr,
  	curarrm: curarrm,
  	curlyeqprec: curlyeqprec,
  	curlyeqsucc: curlyeqsucc,
  	curlyvee: curlyvee,
  	curlywedge: curlywedge,
  	curren: curren,
  	curvearrowleft: curvearrowleft,
  	curvearrowright: curvearrowright,
  	cuvee: cuvee,
  	cuwed: cuwed,
  	cwconint: cwconint,
  	cwint: cwint,
  	cylcty: cylcty,
  	dagger: dagger,
  	Dagger: Dagger,
  	daleth: daleth,
  	darr: darr,
  	Darr: Darr,
  	dArr: dArr,
  	dash: dash,
  	Dashv: Dashv,
  	dashv: dashv,
  	dbkarow: dbkarow,
  	dblac: dblac,
  	Dcaron: Dcaron,
  	dcaron: dcaron,
  	Dcy: Dcy,
  	dcy: dcy,
  	ddagger: ddagger,
  	ddarr: ddarr,
  	DD: DD,
  	dd: dd,
  	DDotrahd: DDotrahd,
  	ddotseq: ddotseq,
  	deg: deg,
  	Del: Del,
  	Delta: Delta,
  	delta: delta,
  	demptyv: demptyv,
  	dfisht: dfisht,
  	Dfr: Dfr,
  	dfr: dfr,
  	dHar: dHar,
  	dharl: dharl,
  	dharr: dharr,
  	DiacriticalAcute: DiacriticalAcute,
  	DiacriticalDot: DiacriticalDot,
  	DiacriticalDoubleAcute: DiacriticalDoubleAcute,
  	DiacriticalGrave: DiacriticalGrave,
  	DiacriticalTilde: DiacriticalTilde,
  	diam: diam,
  	diamond: diamond,
  	Diamond: Diamond,
  	diamondsuit: diamondsuit,
  	diams: diams,
  	die: die,
  	DifferentialD: DifferentialD,
  	digamma: digamma,
  	disin: disin,
  	div: div,
  	divide: divide,
  	divideontimes: divideontimes,
  	divonx: divonx,
  	DJcy: DJcy,
  	djcy: djcy,
  	dlcorn: dlcorn,
  	dlcrop: dlcrop,
  	dollar: dollar,
  	Dopf: Dopf,
  	dopf: dopf,
  	Dot: Dot,
  	dot: dot,
  	DotDot: DotDot,
  	doteq: doteq,
  	doteqdot: doteqdot,
  	DotEqual: DotEqual,
  	dotminus: dotminus,
  	dotplus: dotplus,
  	dotsquare: dotsquare,
  	doublebarwedge: doublebarwedge,
  	DoubleContourIntegral: DoubleContourIntegral,
  	DoubleDot: DoubleDot,
  	DoubleDownArrow: DoubleDownArrow,
  	DoubleLeftArrow: DoubleLeftArrow,
  	DoubleLeftRightArrow: DoubleLeftRightArrow,
  	DoubleLeftTee: DoubleLeftTee,
  	DoubleLongLeftArrow: DoubleLongLeftArrow,
  	DoubleLongLeftRightArrow: DoubleLongLeftRightArrow,
  	DoubleLongRightArrow: DoubleLongRightArrow,
  	DoubleRightArrow: DoubleRightArrow,
  	DoubleRightTee: DoubleRightTee,
  	DoubleUpArrow: DoubleUpArrow,
  	DoubleUpDownArrow: DoubleUpDownArrow,
  	DoubleVerticalBar: DoubleVerticalBar,
  	DownArrowBar: DownArrowBar,
  	downarrow: downarrow,
  	DownArrow: DownArrow,
  	Downarrow: Downarrow,
  	DownArrowUpArrow: DownArrowUpArrow,
  	DownBreve: DownBreve,
  	downdownarrows: downdownarrows,
  	downharpoonleft: downharpoonleft,
  	downharpoonright: downharpoonright,
  	DownLeftRightVector: DownLeftRightVector,
  	DownLeftTeeVector: DownLeftTeeVector,
  	DownLeftVectorBar: DownLeftVectorBar,
  	DownLeftVector: DownLeftVector,
  	DownRightTeeVector: DownRightTeeVector,
  	DownRightVectorBar: DownRightVectorBar,
  	DownRightVector: DownRightVector,
  	DownTeeArrow: DownTeeArrow,
  	DownTee: DownTee,
  	drbkarow: drbkarow,
  	drcorn: drcorn,
  	drcrop: drcrop,
  	Dscr: Dscr,
  	dscr: dscr,
  	DScy: DScy,
  	dscy: dscy,
  	dsol: dsol,
  	Dstrok: Dstrok,
  	dstrok: dstrok,
  	dtdot: dtdot,
  	dtri: dtri,
  	dtrif: dtrif,
  	duarr: duarr,
  	duhar: duhar,
  	dwangle: dwangle,
  	DZcy: DZcy,
  	dzcy: dzcy,
  	dzigrarr: dzigrarr,
  	Eacute: Eacute,
  	eacute: eacute,
  	easter: easter,
  	Ecaron: Ecaron,
  	ecaron: ecaron,
  	Ecirc: Ecirc,
  	ecirc: ecirc,
  	ecir: ecir,
  	ecolon: ecolon,
  	Ecy: Ecy,
  	ecy: ecy,
  	eDDot: eDDot,
  	Edot: Edot,
  	edot: edot,
  	eDot: eDot,
  	ee: ee,
  	efDot: efDot,
  	Efr: Efr,
  	efr: efr,
  	eg: eg,
  	Egrave: Egrave,
  	egrave: egrave,
  	egs: egs,
  	egsdot: egsdot,
  	el: el,
  	Element: Element,
  	elinters: elinters,
  	ell: ell,
  	els: els,
  	elsdot: elsdot,
  	Emacr: Emacr,
  	emacr: emacr,
  	empty: empty,
  	emptyset: emptyset,
  	EmptySmallSquare: EmptySmallSquare,
  	emptyv: emptyv,
  	EmptyVerySmallSquare: EmptyVerySmallSquare,
  	emsp13: emsp13,
  	emsp14: emsp14,
  	emsp: emsp,
  	ENG: ENG,
  	eng: eng,
  	ensp: ensp,
  	Eogon: Eogon,
  	eogon: eogon,
  	Eopf: Eopf,
  	eopf: eopf,
  	epar: epar,
  	eparsl: eparsl,
  	eplus: eplus,
  	epsi: epsi,
  	Epsilon: Epsilon,
  	epsilon: epsilon,
  	epsiv: epsiv,
  	eqcirc: eqcirc,
  	eqcolon: eqcolon,
  	eqsim: eqsim,
  	eqslantgtr: eqslantgtr,
  	eqslantless: eqslantless,
  	Equal: Equal,
  	equals: equals,
  	EqualTilde: EqualTilde,
  	equest: equest,
  	Equilibrium: Equilibrium,
  	equiv: equiv,
  	equivDD: equivDD,
  	eqvparsl: eqvparsl,
  	erarr: erarr,
  	erDot: erDot,
  	escr: escr,
  	Escr: Escr,
  	esdot: esdot,
  	Esim: Esim,
  	esim: esim,
  	Eta: Eta,
  	eta: eta,
  	ETH: ETH,
  	eth: eth,
  	Euml: Euml,
  	euml: euml,
  	euro: euro,
  	excl: excl,
  	exist: exist,
  	Exists: Exists,
  	expectation: expectation,
  	exponentiale: exponentiale,
  	ExponentialE: ExponentialE,
  	fallingdotseq: fallingdotseq,
  	Fcy: Fcy,
  	fcy: fcy,
  	female: female,
  	ffilig: ffilig,
  	fflig: fflig,
  	ffllig: ffllig,
  	Ffr: Ffr,
  	ffr: ffr,
  	filig: filig,
  	FilledSmallSquare: FilledSmallSquare,
  	FilledVerySmallSquare: FilledVerySmallSquare,
  	fjlig: fjlig,
  	flat: flat,
  	fllig: fllig,
  	fltns: fltns,
  	fnof: fnof,
  	Fopf: Fopf,
  	fopf: fopf,
  	forall: forall,
  	ForAll: ForAll,
  	fork: fork,
  	forkv: forkv,
  	Fouriertrf: Fouriertrf,
  	fpartint: fpartint,
  	frac12: frac12,
  	frac13: frac13,
  	frac14: frac14,
  	frac15: frac15,
  	frac16: frac16,
  	frac18: frac18,
  	frac23: frac23,
  	frac25: frac25,
  	frac34: frac34,
  	frac35: frac35,
  	frac38: frac38,
  	frac45: frac45,
  	frac56: frac56,
  	frac58: frac58,
  	frac78: frac78,
  	frasl: frasl,
  	frown: frown,
  	fscr: fscr,
  	Fscr: Fscr,
  	gacute: gacute,
  	Gamma: Gamma,
  	gamma: gamma,
  	Gammad: Gammad,
  	gammad: gammad,
  	gap: gap,
  	Gbreve: Gbreve,
  	gbreve: gbreve,
  	Gcedil: Gcedil,
  	Gcirc: Gcirc,
  	gcirc: gcirc,
  	Gcy: Gcy,
  	gcy: gcy,
  	Gdot: Gdot,
  	gdot: gdot,
  	ge: ge,
  	gE: gE,
  	gEl: gEl,
  	gel: gel,
  	geq: geq,
  	geqq: geqq,
  	geqslant: geqslant,
  	gescc: gescc,
  	ges: ges,
  	gesdot: gesdot,
  	gesdoto: gesdoto,
  	gesdotol: gesdotol,
  	gesl: gesl,
  	gesles: gesles,
  	Gfr: Gfr,
  	gfr: gfr,
  	gg: gg,
  	Gg: Gg,
  	ggg: ggg,
  	gimel: gimel,
  	GJcy: GJcy,
  	gjcy: gjcy,
  	gla: gla,
  	gl: gl,
  	glE: glE,
  	glj: glj,
  	gnap: gnap,
  	gnapprox: gnapprox,
  	gne: gne,
  	gnE: gnE,
  	gneq: gneq,
  	gneqq: gneqq,
  	gnsim: gnsim,
  	Gopf: Gopf,
  	gopf: gopf,
  	grave: grave,
  	GreaterEqual: GreaterEqual,
  	GreaterEqualLess: GreaterEqualLess,
  	GreaterFullEqual: GreaterFullEqual,
  	GreaterGreater: GreaterGreater,
  	GreaterLess: GreaterLess,
  	GreaterSlantEqual: GreaterSlantEqual,
  	GreaterTilde: GreaterTilde,
  	Gscr: Gscr,
  	gscr: gscr,
  	gsim: gsim,
  	gsime: gsime,
  	gsiml: gsiml,
  	gtcc: gtcc,
  	gtcir: gtcir,
  	gt: gt,
  	GT: GT$1,
  	Gt: Gt,
  	gtdot: gtdot,
  	gtlPar: gtlPar,
  	gtquest: gtquest,
  	gtrapprox: gtrapprox,
  	gtrarr: gtrarr,
  	gtrdot: gtrdot,
  	gtreqless: gtreqless,
  	gtreqqless: gtreqqless,
  	gtrless: gtrless,
  	gtrsim: gtrsim,
  	gvertneqq: gvertneqq,
  	gvnE: gvnE,
  	Hacek: Hacek,
  	hairsp: hairsp,
  	half: half,
  	hamilt: hamilt,
  	HARDcy: HARDcy,
  	hardcy: hardcy,
  	harrcir: harrcir,
  	harr: harr,
  	hArr: hArr,
  	harrw: harrw,
  	Hat: Hat,
  	hbar: hbar,
  	Hcirc: Hcirc,
  	hcirc: hcirc,
  	hearts: hearts,
  	heartsuit: heartsuit,
  	hellip: hellip,
  	hercon: hercon,
  	hfr: hfr,
  	Hfr: Hfr,
  	HilbertSpace: HilbertSpace,
  	hksearow: hksearow,
  	hkswarow: hkswarow,
  	hoarr: hoarr,
  	homtht: homtht,
  	hookleftarrow: hookleftarrow,
  	hookrightarrow: hookrightarrow,
  	hopf: hopf,
  	Hopf: Hopf,
  	horbar: horbar,
  	HorizontalLine: HorizontalLine,
  	hscr: hscr,
  	Hscr: Hscr,
  	hslash: hslash,
  	Hstrok: Hstrok,
  	hstrok: hstrok,
  	HumpDownHump: HumpDownHump,
  	HumpEqual: HumpEqual,
  	hybull: hybull,
  	hyphen: hyphen,
  	Iacute: Iacute,
  	iacute: iacute,
  	ic: ic,
  	Icirc: Icirc,
  	icirc: icirc,
  	Icy: Icy,
  	icy: icy,
  	Idot: Idot,
  	IEcy: IEcy,
  	iecy: iecy,
  	iexcl: iexcl,
  	iff: iff,
  	ifr: ifr,
  	Ifr: Ifr,
  	Igrave: Igrave,
  	igrave: igrave,
  	ii: ii,
  	iiiint: iiiint,
  	iiint: iiint,
  	iinfin: iinfin,
  	iiota: iiota,
  	IJlig: IJlig,
  	ijlig: ijlig,
  	Imacr: Imacr,
  	imacr: imacr,
  	image: image,
  	ImaginaryI: ImaginaryI,
  	imagline: imagline,
  	imagpart: imagpart,
  	imath: imath,
  	Im: Im,
  	imof: imof,
  	imped: imped,
  	Implies: Implies,
  	incare: incare,
  	"in": "∈",
  	infin: infin,
  	infintie: infintie,
  	inodot: inodot,
  	intcal: intcal,
  	int: int,
  	Int: Int,
  	integers: integers,
  	Integral: Integral,
  	intercal: intercal,
  	Intersection: Intersection,
  	intlarhk: intlarhk,
  	intprod: intprod,
  	InvisibleComma: InvisibleComma,
  	InvisibleTimes: InvisibleTimes,
  	IOcy: IOcy,
  	iocy: iocy,
  	Iogon: Iogon,
  	iogon: iogon,
  	Iopf: Iopf,
  	iopf: iopf,
  	Iota: Iota,
  	iota: iota,
  	iprod: iprod,
  	iquest: iquest,
  	iscr: iscr,
  	Iscr: Iscr,
  	isin: isin,
  	isindot: isindot,
  	isinE: isinE,
  	isins: isins,
  	isinsv: isinsv,
  	isinv: isinv,
  	it: it,
  	Itilde: Itilde,
  	itilde: itilde,
  	Iukcy: Iukcy,
  	iukcy: iukcy,
  	Iuml: Iuml,
  	iuml: iuml,
  	Jcirc: Jcirc,
  	jcirc: jcirc,
  	Jcy: Jcy,
  	jcy: jcy,
  	Jfr: Jfr,
  	jfr: jfr,
  	jmath: jmath,
  	Jopf: Jopf,
  	jopf: jopf,
  	Jscr: Jscr,
  	jscr: jscr,
  	Jsercy: Jsercy,
  	jsercy: jsercy,
  	Jukcy: Jukcy,
  	jukcy: jukcy,
  	Kappa: Kappa,
  	kappa: kappa,
  	kappav: kappav,
  	Kcedil: Kcedil,
  	kcedil: kcedil,
  	Kcy: Kcy,
  	kcy: kcy,
  	Kfr: Kfr,
  	kfr: kfr,
  	kgreen: kgreen,
  	KHcy: KHcy,
  	khcy: khcy,
  	KJcy: KJcy,
  	kjcy: kjcy,
  	Kopf: Kopf,
  	kopf: kopf,
  	Kscr: Kscr,
  	kscr: kscr,
  	lAarr: lAarr,
  	Lacute: Lacute,
  	lacute: lacute,
  	laemptyv: laemptyv,
  	lagran: lagran,
  	Lambda: Lambda,
  	lambda: lambda,
  	lang: lang,
  	Lang: Lang,
  	langd: langd,
  	langle: langle,
  	lap: lap,
  	Laplacetrf: Laplacetrf,
  	laquo: laquo,
  	larrb: larrb,
  	larrbfs: larrbfs,
  	larr: larr,
  	Larr: Larr,
  	lArr: lArr,
  	larrfs: larrfs,
  	larrhk: larrhk,
  	larrlp: larrlp,
  	larrpl: larrpl,
  	larrsim: larrsim,
  	larrtl: larrtl,
  	latail: latail,
  	lAtail: lAtail,
  	lat: lat,
  	late: late,
  	lates: lates,
  	lbarr: lbarr,
  	lBarr: lBarr,
  	lbbrk: lbbrk,
  	lbrace: lbrace,
  	lbrack: lbrack,
  	lbrke: lbrke,
  	lbrksld: lbrksld,
  	lbrkslu: lbrkslu,
  	Lcaron: Lcaron,
  	lcaron: lcaron,
  	Lcedil: Lcedil,
  	lcedil: lcedil,
  	lceil: lceil,
  	lcub: lcub,
  	Lcy: Lcy,
  	lcy: lcy,
  	ldca: ldca,
  	ldquo: ldquo,
  	ldquor: ldquor,
  	ldrdhar: ldrdhar,
  	ldrushar: ldrushar,
  	ldsh: ldsh,
  	le: le,
  	lE: lE,
  	LeftAngleBracket: LeftAngleBracket,
  	LeftArrowBar: LeftArrowBar,
  	leftarrow: leftarrow,
  	LeftArrow: LeftArrow,
  	Leftarrow: Leftarrow,
  	LeftArrowRightArrow: LeftArrowRightArrow,
  	leftarrowtail: leftarrowtail,
  	LeftCeiling: LeftCeiling,
  	LeftDoubleBracket: LeftDoubleBracket,
  	LeftDownTeeVector: LeftDownTeeVector,
  	LeftDownVectorBar: LeftDownVectorBar,
  	LeftDownVector: LeftDownVector,
  	LeftFloor: LeftFloor,
  	leftharpoondown: leftharpoondown,
  	leftharpoonup: leftharpoonup,
  	leftleftarrows: leftleftarrows,
  	leftrightarrow: leftrightarrow,
  	LeftRightArrow: LeftRightArrow,
  	Leftrightarrow: Leftrightarrow,
  	leftrightarrows: leftrightarrows,
  	leftrightharpoons: leftrightharpoons,
  	leftrightsquigarrow: leftrightsquigarrow,
  	LeftRightVector: LeftRightVector,
  	LeftTeeArrow: LeftTeeArrow,
  	LeftTee: LeftTee,
  	LeftTeeVector: LeftTeeVector,
  	leftthreetimes: leftthreetimes,
  	LeftTriangleBar: LeftTriangleBar,
  	LeftTriangle: LeftTriangle,
  	LeftTriangleEqual: LeftTriangleEqual,
  	LeftUpDownVector: LeftUpDownVector,
  	LeftUpTeeVector: LeftUpTeeVector,
  	LeftUpVectorBar: LeftUpVectorBar,
  	LeftUpVector: LeftUpVector,
  	LeftVectorBar: LeftVectorBar,
  	LeftVector: LeftVector,
  	lEg: lEg,
  	leg: leg,
  	leq: leq,
  	leqq: leqq,
  	leqslant: leqslant,
  	lescc: lescc,
  	les: les,
  	lesdot: lesdot,
  	lesdoto: lesdoto,
  	lesdotor: lesdotor,
  	lesg: lesg,
  	lesges: lesges,
  	lessapprox: lessapprox,
  	lessdot: lessdot,
  	lesseqgtr: lesseqgtr,
  	lesseqqgtr: lesseqqgtr,
  	LessEqualGreater: LessEqualGreater,
  	LessFullEqual: LessFullEqual,
  	LessGreater: LessGreater,
  	lessgtr: lessgtr,
  	LessLess: LessLess,
  	lesssim: lesssim,
  	LessSlantEqual: LessSlantEqual,
  	LessTilde: LessTilde,
  	lfisht: lfisht,
  	lfloor: lfloor,
  	Lfr: Lfr,
  	lfr: lfr,
  	lg: lg,
  	lgE: lgE,
  	lHar: lHar,
  	lhard: lhard,
  	lharu: lharu,
  	lharul: lharul,
  	lhblk: lhblk,
  	LJcy: LJcy,
  	ljcy: ljcy,
  	llarr: llarr,
  	ll: ll,
  	Ll: Ll,
  	llcorner: llcorner,
  	Lleftarrow: Lleftarrow,
  	llhard: llhard,
  	lltri: lltri,
  	Lmidot: Lmidot,
  	lmidot: lmidot,
  	lmoustache: lmoustache,
  	lmoust: lmoust,
  	lnap: lnap,
  	lnapprox: lnapprox,
  	lne: lne,
  	lnE: lnE,
  	lneq: lneq,
  	lneqq: lneqq,
  	lnsim: lnsim,
  	loang: loang,
  	loarr: loarr,
  	lobrk: lobrk,
  	longleftarrow: longleftarrow,
  	LongLeftArrow: LongLeftArrow,
  	Longleftarrow: Longleftarrow,
  	longleftrightarrow: longleftrightarrow,
  	LongLeftRightArrow: LongLeftRightArrow,
  	Longleftrightarrow: Longleftrightarrow,
  	longmapsto: longmapsto,
  	longrightarrow: longrightarrow,
  	LongRightArrow: LongRightArrow,
  	Longrightarrow: Longrightarrow,
  	looparrowleft: looparrowleft,
  	looparrowright: looparrowright,
  	lopar: lopar,
  	Lopf: Lopf,
  	lopf: lopf,
  	loplus: loplus,
  	lotimes: lotimes,
  	lowast: lowast,
  	lowbar: lowbar,
  	LowerLeftArrow: LowerLeftArrow,
  	LowerRightArrow: LowerRightArrow,
  	loz: loz,
  	lozenge: lozenge,
  	lozf: lozf,
  	lpar: lpar,
  	lparlt: lparlt,
  	lrarr: lrarr,
  	lrcorner: lrcorner,
  	lrhar: lrhar,
  	lrhard: lrhard,
  	lrm: lrm,
  	lrtri: lrtri,
  	lsaquo: lsaquo,
  	lscr: lscr,
  	Lscr: Lscr,
  	lsh: lsh,
  	Lsh: Lsh,
  	lsim: lsim,
  	lsime: lsime,
  	lsimg: lsimg,
  	lsqb: lsqb,
  	lsquo: lsquo,
  	lsquor: lsquor,
  	Lstrok: Lstrok,
  	lstrok: lstrok,
  	ltcc: ltcc,
  	ltcir: ltcir,
  	lt: lt,
  	LT: LT$1,
  	Lt: Lt,
  	ltdot: ltdot,
  	lthree: lthree,
  	ltimes: ltimes,
  	ltlarr: ltlarr,
  	ltquest: ltquest,
  	ltri: ltri,
  	ltrie: ltrie,
  	ltrif: ltrif,
  	ltrPar: ltrPar,
  	lurdshar: lurdshar,
  	luruhar: luruhar,
  	lvertneqq: lvertneqq,
  	lvnE: lvnE,
  	macr: macr,
  	male: male,
  	malt: malt,
  	maltese: maltese,
  	"Map": "⤅",
  	map: map,
  	mapsto: mapsto,
  	mapstodown: mapstodown,
  	mapstoleft: mapstoleft,
  	mapstoup: mapstoup,
  	marker: marker,
  	mcomma: mcomma,
  	Mcy: Mcy,
  	mcy: mcy,
  	mdash: mdash,
  	mDDot: mDDot,
  	measuredangle: measuredangle,
  	MediumSpace: MediumSpace,
  	Mellintrf: Mellintrf,
  	Mfr: Mfr,
  	mfr: mfr,
  	mho: mho,
  	micro: micro,
  	midast: midast,
  	midcir: midcir,
  	mid: mid,
  	middot: middot,
  	minusb: minusb,
  	minus: minus,
  	minusd: minusd,
  	minusdu: minusdu,
  	MinusPlus: MinusPlus,
  	mlcp: mlcp,
  	mldr: mldr,
  	mnplus: mnplus,
  	models: models,
  	Mopf: Mopf,
  	mopf: mopf,
  	mp: mp,
  	mscr: mscr,
  	Mscr: Mscr,
  	mstpos: mstpos,
  	Mu: Mu,
  	mu: mu,
  	multimap: multimap,
  	mumap: mumap,
  	nabla: nabla,
  	Nacute: Nacute,
  	nacute: nacute,
  	nang: nang,
  	nap: nap,
  	napE: napE,
  	napid: napid,
  	napos: napos,
  	napprox: napprox,
  	natural: natural,
  	naturals: naturals,
  	natur: natur,
  	nbsp: nbsp,
  	nbump: nbump,
  	nbumpe: nbumpe,
  	ncap: ncap,
  	Ncaron: Ncaron,
  	ncaron: ncaron,
  	Ncedil: Ncedil,
  	ncedil: ncedil,
  	ncong: ncong,
  	ncongdot: ncongdot,
  	ncup: ncup,
  	Ncy: Ncy,
  	ncy: ncy,
  	ndash: ndash,
  	nearhk: nearhk,
  	nearr: nearr,
  	neArr: neArr,
  	nearrow: nearrow,
  	ne: ne,
  	nedot: nedot,
  	NegativeMediumSpace: NegativeMediumSpace,
  	NegativeThickSpace: NegativeThickSpace,
  	NegativeThinSpace: NegativeThinSpace,
  	NegativeVeryThinSpace: NegativeVeryThinSpace,
  	nequiv: nequiv,
  	nesear: nesear,
  	nesim: nesim,
  	NestedGreaterGreater: NestedGreaterGreater,
  	NestedLessLess: NestedLessLess,
  	NewLine: NewLine,
  	nexist: nexist,
  	nexists: nexists,
  	Nfr: Nfr,
  	nfr: nfr,
  	ngE: ngE,
  	nge: nge,
  	ngeq: ngeq,
  	ngeqq: ngeqq,
  	ngeqslant: ngeqslant,
  	nges: nges,
  	nGg: nGg,
  	ngsim: ngsim,
  	nGt: nGt,
  	ngt: ngt,
  	ngtr: ngtr,
  	nGtv: nGtv,
  	nharr: nharr,
  	nhArr: nhArr,
  	nhpar: nhpar,
  	ni: ni,
  	nis: nis,
  	nisd: nisd,
  	niv: niv,
  	NJcy: NJcy,
  	njcy: njcy,
  	nlarr: nlarr,
  	nlArr: nlArr,
  	nldr: nldr,
  	nlE: nlE,
  	nle: nle,
  	nleftarrow: nleftarrow,
  	nLeftarrow: nLeftarrow,
  	nleftrightarrow: nleftrightarrow,
  	nLeftrightarrow: nLeftrightarrow,
  	nleq: nleq,
  	nleqq: nleqq,
  	nleqslant: nleqslant,
  	nles: nles,
  	nless: nless,
  	nLl: nLl,
  	nlsim: nlsim,
  	nLt: nLt,
  	nlt: nlt,
  	nltri: nltri,
  	nltrie: nltrie,
  	nLtv: nLtv,
  	nmid: nmid,
  	NoBreak: NoBreak,
  	NonBreakingSpace: NonBreakingSpace,
  	nopf: nopf,
  	Nopf: Nopf,
  	Not: Not,
  	not: not,
  	NotCongruent: NotCongruent,
  	NotCupCap: NotCupCap,
  	NotDoubleVerticalBar: NotDoubleVerticalBar,
  	NotElement: NotElement,
  	NotEqual: NotEqual,
  	NotEqualTilde: NotEqualTilde,
  	NotExists: NotExists,
  	NotGreater: NotGreater,
  	NotGreaterEqual: NotGreaterEqual,
  	NotGreaterFullEqual: NotGreaterFullEqual,
  	NotGreaterGreater: NotGreaterGreater,
  	NotGreaterLess: NotGreaterLess,
  	NotGreaterSlantEqual: NotGreaterSlantEqual,
  	NotGreaterTilde: NotGreaterTilde,
  	NotHumpDownHump: NotHumpDownHump,
  	NotHumpEqual: NotHumpEqual,
  	notin: notin,
  	notindot: notindot,
  	notinE: notinE,
  	notinva: notinva,
  	notinvb: notinvb,
  	notinvc: notinvc,
  	NotLeftTriangleBar: NotLeftTriangleBar,
  	NotLeftTriangle: NotLeftTriangle,
  	NotLeftTriangleEqual: NotLeftTriangleEqual,
  	NotLess: NotLess,
  	NotLessEqual: NotLessEqual,
  	NotLessGreater: NotLessGreater,
  	NotLessLess: NotLessLess,
  	NotLessSlantEqual: NotLessSlantEqual,
  	NotLessTilde: NotLessTilde,
  	NotNestedGreaterGreater: NotNestedGreaterGreater,
  	NotNestedLessLess: NotNestedLessLess,
  	notni: notni,
  	notniva: notniva,
  	notnivb: notnivb,
  	notnivc: notnivc,
  	NotPrecedes: NotPrecedes,
  	NotPrecedesEqual: NotPrecedesEqual,
  	NotPrecedesSlantEqual: NotPrecedesSlantEqual,
  	NotReverseElement: NotReverseElement,
  	NotRightTriangleBar: NotRightTriangleBar,
  	NotRightTriangle: NotRightTriangle,
  	NotRightTriangleEqual: NotRightTriangleEqual,
  	NotSquareSubset: NotSquareSubset,
  	NotSquareSubsetEqual: NotSquareSubsetEqual,
  	NotSquareSuperset: NotSquareSuperset,
  	NotSquareSupersetEqual: NotSquareSupersetEqual,
  	NotSubset: NotSubset,
  	NotSubsetEqual: NotSubsetEqual,
  	NotSucceeds: NotSucceeds,
  	NotSucceedsEqual: NotSucceedsEqual,
  	NotSucceedsSlantEqual: NotSucceedsSlantEqual,
  	NotSucceedsTilde: NotSucceedsTilde,
  	NotSuperset: NotSuperset,
  	NotSupersetEqual: NotSupersetEqual,
  	NotTilde: NotTilde,
  	NotTildeEqual: NotTildeEqual,
  	NotTildeFullEqual: NotTildeFullEqual,
  	NotTildeTilde: NotTildeTilde,
  	NotVerticalBar: NotVerticalBar,
  	nparallel: nparallel,
  	npar: npar,
  	nparsl: nparsl,
  	npart: npart,
  	npolint: npolint,
  	npr: npr,
  	nprcue: nprcue,
  	nprec: nprec,
  	npreceq: npreceq,
  	npre: npre,
  	nrarrc: nrarrc,
  	nrarr: nrarr,
  	nrArr: nrArr,
  	nrarrw: nrarrw,
  	nrightarrow: nrightarrow,
  	nRightarrow: nRightarrow,
  	nrtri: nrtri,
  	nrtrie: nrtrie,
  	nsc: nsc,
  	nsccue: nsccue,
  	nsce: nsce,
  	Nscr: Nscr,
  	nscr: nscr,
  	nshortmid: nshortmid,
  	nshortparallel: nshortparallel,
  	nsim: nsim,
  	nsime: nsime,
  	nsimeq: nsimeq,
  	nsmid: nsmid,
  	nspar: nspar,
  	nsqsube: nsqsube,
  	nsqsupe: nsqsupe,
  	nsub: nsub,
  	nsubE: nsubE,
  	nsube: nsube,
  	nsubset: nsubset,
  	nsubseteq: nsubseteq,
  	nsubseteqq: nsubseteqq,
  	nsucc: nsucc,
  	nsucceq: nsucceq,
  	nsup: nsup,
  	nsupE: nsupE,
  	nsupe: nsupe,
  	nsupset: nsupset,
  	nsupseteq: nsupseteq,
  	nsupseteqq: nsupseteqq,
  	ntgl: ntgl,
  	Ntilde: Ntilde,
  	ntilde: ntilde,
  	ntlg: ntlg,
  	ntriangleleft: ntriangleleft,
  	ntrianglelefteq: ntrianglelefteq,
  	ntriangleright: ntriangleright,
  	ntrianglerighteq: ntrianglerighteq,
  	Nu: Nu,
  	nu: nu,
  	num: num,
  	numero: numero,
  	numsp: numsp,
  	nvap: nvap,
  	nvdash: nvdash,
  	nvDash: nvDash,
  	nVdash: nVdash,
  	nVDash: nVDash,
  	nvge: nvge,
  	nvgt: nvgt,
  	nvHarr: nvHarr,
  	nvinfin: nvinfin,
  	nvlArr: nvlArr,
  	nvle: nvle,
  	nvlt: nvlt,
  	nvltrie: nvltrie,
  	nvrArr: nvrArr,
  	nvrtrie: nvrtrie,
  	nvsim: nvsim,
  	nwarhk: nwarhk,
  	nwarr: nwarr,
  	nwArr: nwArr,
  	nwarrow: nwarrow,
  	nwnear: nwnear,
  	Oacute: Oacute,
  	oacute: oacute,
  	oast: oast,
  	Ocirc: Ocirc,
  	ocirc: ocirc,
  	ocir: ocir,
  	Ocy: Ocy,
  	ocy: ocy,
  	odash: odash,
  	Odblac: Odblac,
  	odblac: odblac,
  	odiv: odiv,
  	odot: odot,
  	odsold: odsold,
  	OElig: OElig,
  	oelig: oelig,
  	ofcir: ofcir,
  	Ofr: Ofr,
  	ofr: ofr,
  	ogon: ogon,
  	Ograve: Ograve,
  	ograve: ograve,
  	ogt: ogt,
  	ohbar: ohbar,
  	ohm: ohm,
  	oint: oint,
  	olarr: olarr,
  	olcir: olcir,
  	olcross: olcross,
  	oline: oline,
  	olt: olt,
  	Omacr: Omacr,
  	omacr: omacr,
  	Omega: Omega,
  	omega: omega,
  	Omicron: Omicron,
  	omicron: omicron,
  	omid: omid,
  	ominus: ominus,
  	Oopf: Oopf,
  	oopf: oopf,
  	opar: opar,
  	OpenCurlyDoubleQuote: OpenCurlyDoubleQuote,
  	OpenCurlyQuote: OpenCurlyQuote,
  	operp: operp,
  	oplus: oplus,
  	orarr: orarr,
  	Or: Or,
  	or: or,
  	ord: ord,
  	order: order,
  	orderof: orderof,
  	ordf: ordf,
  	ordm: ordm,
  	origof: origof,
  	oror: oror,
  	orslope: orslope,
  	orv: orv,
  	oS: oS,
  	Oscr: Oscr,
  	oscr: oscr,
  	Oslash: Oslash,
  	oslash: oslash,
  	osol: osol,
  	Otilde: Otilde,
  	otilde: otilde,
  	otimesas: otimesas,
  	Otimes: Otimes,
  	otimes: otimes,
  	Ouml: Ouml,
  	ouml: ouml,
  	ovbar: ovbar,
  	OverBar: OverBar,
  	OverBrace: OverBrace,
  	OverBracket: OverBracket,
  	OverParenthesis: OverParenthesis,
  	para: para,
  	parallel: parallel,
  	par: par,
  	parsim: parsim,
  	parsl: parsl,
  	part: part,
  	PartialD: PartialD,
  	Pcy: Pcy,
  	pcy: pcy,
  	percnt: percnt,
  	period: period,
  	permil: permil,
  	perp: perp,
  	pertenk: pertenk,
  	Pfr: Pfr,
  	pfr: pfr,
  	Phi: Phi,
  	phi: phi,
  	phiv: phiv,
  	phmmat: phmmat,
  	phone: phone,
  	Pi: Pi,
  	pi: pi,
  	pitchfork: pitchfork,
  	piv: piv,
  	planck: planck,
  	planckh: planckh,
  	plankv: plankv,
  	plusacir: plusacir,
  	plusb: plusb,
  	pluscir: pluscir,
  	plus: plus,
  	plusdo: plusdo,
  	plusdu: plusdu,
  	pluse: pluse,
  	PlusMinus: PlusMinus,
  	plusmn: plusmn,
  	plussim: plussim,
  	plustwo: plustwo,
  	pm: pm,
  	Poincareplane: Poincareplane,
  	pointint: pointint,
  	popf: popf,
  	Popf: Popf,
  	pound: pound,
  	prap: prap,
  	Pr: Pr,
  	pr: pr,
  	prcue: prcue,
  	precapprox: precapprox,
  	prec: prec,
  	preccurlyeq: preccurlyeq,
  	Precedes: Precedes,
  	PrecedesEqual: PrecedesEqual,
  	PrecedesSlantEqual: PrecedesSlantEqual,
  	PrecedesTilde: PrecedesTilde,
  	preceq: preceq,
  	precnapprox: precnapprox,
  	precneqq: precneqq,
  	precnsim: precnsim,
  	pre: pre,
  	prE: prE,
  	precsim: precsim,
  	prime: prime,
  	Prime: Prime,
  	primes: primes,
  	prnap: prnap,
  	prnE: prnE,
  	prnsim: prnsim,
  	prod: prod,
  	Product: Product,
  	profalar: profalar,
  	profline: profline,
  	profsurf: profsurf,
  	prop: prop,
  	Proportional: Proportional,
  	Proportion: Proportion,
  	propto: propto,
  	prsim: prsim,
  	prurel: prurel,
  	Pscr: Pscr,
  	pscr: pscr,
  	Psi: Psi,
  	psi: psi,
  	puncsp: puncsp,
  	Qfr: Qfr,
  	qfr: qfr,
  	qint: qint,
  	qopf: qopf,
  	Qopf: Qopf,
  	qprime: qprime,
  	Qscr: Qscr,
  	qscr: qscr,
  	quaternions: quaternions,
  	quatint: quatint,
  	quest: quest,
  	questeq: questeq,
  	quot: quot,
  	QUOT: QUOT,
  	rAarr: rAarr,
  	race: race,
  	Racute: Racute,
  	racute: racute,
  	radic: radic,
  	raemptyv: raemptyv,
  	rang: rang,
  	Rang: Rang,
  	rangd: rangd,
  	range: range,
  	rangle: rangle,
  	raquo: raquo,
  	rarrap: rarrap,
  	rarrb: rarrb,
  	rarrbfs: rarrbfs,
  	rarrc: rarrc,
  	rarr: rarr,
  	Rarr: Rarr,
  	rArr: rArr,
  	rarrfs: rarrfs,
  	rarrhk: rarrhk,
  	rarrlp: rarrlp,
  	rarrpl: rarrpl,
  	rarrsim: rarrsim,
  	Rarrtl: Rarrtl,
  	rarrtl: rarrtl,
  	rarrw: rarrw,
  	ratail: ratail,
  	rAtail: rAtail,
  	ratio: ratio,
  	rationals: rationals,
  	rbarr: rbarr,
  	rBarr: rBarr,
  	RBarr: RBarr,
  	rbbrk: rbbrk,
  	rbrace: rbrace,
  	rbrack: rbrack,
  	rbrke: rbrke,
  	rbrksld: rbrksld,
  	rbrkslu: rbrkslu,
  	Rcaron: Rcaron,
  	rcaron: rcaron,
  	Rcedil: Rcedil,
  	rcedil: rcedil,
  	rceil: rceil,
  	rcub: rcub,
  	Rcy: Rcy,
  	rcy: rcy,
  	rdca: rdca,
  	rdldhar: rdldhar,
  	rdquo: rdquo,
  	rdquor: rdquor,
  	rdsh: rdsh,
  	real: real,
  	realine: realine,
  	realpart: realpart,
  	reals: reals,
  	Re: Re,
  	rect: rect,
  	reg: reg,
  	REG: REG,
  	ReverseElement: ReverseElement,
  	ReverseEquilibrium: ReverseEquilibrium,
  	ReverseUpEquilibrium: ReverseUpEquilibrium,
  	rfisht: rfisht,
  	rfloor: rfloor,
  	rfr: rfr,
  	Rfr: Rfr,
  	rHar: rHar,
  	rhard: rhard,
  	rharu: rharu,
  	rharul: rharul,
  	Rho: Rho,
  	rho: rho,
  	rhov: rhov,
  	RightAngleBracket: RightAngleBracket,
  	RightArrowBar: RightArrowBar,
  	rightarrow: rightarrow,
  	RightArrow: RightArrow,
  	Rightarrow: Rightarrow,
  	RightArrowLeftArrow: RightArrowLeftArrow,
  	rightarrowtail: rightarrowtail,
  	RightCeiling: RightCeiling,
  	RightDoubleBracket: RightDoubleBracket,
  	RightDownTeeVector: RightDownTeeVector,
  	RightDownVectorBar: RightDownVectorBar,
  	RightDownVector: RightDownVector,
  	RightFloor: RightFloor,
  	rightharpoondown: rightharpoondown,
  	rightharpoonup: rightharpoonup,
  	rightleftarrows: rightleftarrows,
  	rightleftharpoons: rightleftharpoons,
  	rightrightarrows: rightrightarrows,
  	rightsquigarrow: rightsquigarrow,
  	RightTeeArrow: RightTeeArrow,
  	RightTee: RightTee,
  	RightTeeVector: RightTeeVector,
  	rightthreetimes: rightthreetimes,
  	RightTriangleBar: RightTriangleBar,
  	RightTriangle: RightTriangle,
  	RightTriangleEqual: RightTriangleEqual,
  	RightUpDownVector: RightUpDownVector,
  	RightUpTeeVector: RightUpTeeVector,
  	RightUpVectorBar: RightUpVectorBar,
  	RightUpVector: RightUpVector,
  	RightVectorBar: RightVectorBar,
  	RightVector: RightVector,
  	ring: ring,
  	risingdotseq: risingdotseq,
  	rlarr: rlarr,
  	rlhar: rlhar,
  	rlm: rlm,
  	rmoustache: rmoustache,
  	rmoust: rmoust,
  	rnmid: rnmid,
  	roang: roang,
  	roarr: roarr,
  	robrk: robrk,
  	ropar: ropar,
  	ropf: ropf,
  	Ropf: Ropf,
  	roplus: roplus,
  	rotimes: rotimes,
  	RoundImplies: RoundImplies,
  	rpar: rpar,
  	rpargt: rpargt,
  	rppolint: rppolint,
  	rrarr: rrarr,
  	Rrightarrow: Rrightarrow,
  	rsaquo: rsaquo,
  	rscr: rscr,
  	Rscr: Rscr,
  	rsh: rsh,
  	Rsh: Rsh,
  	rsqb: rsqb,
  	rsquo: rsquo,
  	rsquor: rsquor,
  	rthree: rthree,
  	rtimes: rtimes,
  	rtri: rtri,
  	rtrie: rtrie,
  	rtrif: rtrif,
  	rtriltri: rtriltri,
  	RuleDelayed: RuleDelayed,
  	ruluhar: ruluhar,
  	rx: rx,
  	Sacute: Sacute,
  	sacute: sacute,
  	sbquo: sbquo,
  	scap: scap,
  	Scaron: Scaron,
  	scaron: scaron,
  	Sc: Sc,
  	sc: sc,
  	sccue: sccue,
  	sce: sce,
  	scE: scE,
  	Scedil: Scedil,
  	scedil: scedil,
  	Scirc: Scirc,
  	scirc: scirc,
  	scnap: scnap,
  	scnE: scnE,
  	scnsim: scnsim,
  	scpolint: scpolint,
  	scsim: scsim,
  	Scy: Scy,
  	scy: scy,
  	sdotb: sdotb,
  	sdot: sdot,
  	sdote: sdote,
  	searhk: searhk,
  	searr: searr,
  	seArr: seArr,
  	searrow: searrow,
  	sect: sect,
  	semi: semi,
  	seswar: seswar,
  	setminus: setminus,
  	setmn: setmn,
  	sext: sext,
  	Sfr: Sfr,
  	sfr: sfr,
  	sfrown: sfrown,
  	sharp: sharp,
  	SHCHcy: SHCHcy,
  	shchcy: shchcy,
  	SHcy: SHcy,
  	shcy: shcy,
  	ShortDownArrow: ShortDownArrow,
  	ShortLeftArrow: ShortLeftArrow,
  	shortmid: shortmid,
  	shortparallel: shortparallel,
  	ShortRightArrow: ShortRightArrow,
  	ShortUpArrow: ShortUpArrow,
  	shy: shy,
  	Sigma: Sigma,
  	sigma: sigma,
  	sigmaf: sigmaf,
  	sigmav: sigmav,
  	sim: sim,
  	simdot: simdot,
  	sime: sime,
  	simeq: simeq,
  	simg: simg,
  	simgE: simgE,
  	siml: siml,
  	simlE: simlE,
  	simne: simne,
  	simplus: simplus,
  	simrarr: simrarr,
  	slarr: slarr,
  	SmallCircle: SmallCircle,
  	smallsetminus: smallsetminus,
  	smashp: smashp,
  	smeparsl: smeparsl,
  	smid: smid,
  	smile: smile,
  	smt: smt,
  	smte: smte,
  	smtes: smtes,
  	SOFTcy: SOFTcy,
  	softcy: softcy,
  	solbar: solbar,
  	solb: solb,
  	sol: sol,
  	Sopf: Sopf,
  	sopf: sopf,
  	spades: spades,
  	spadesuit: spadesuit,
  	spar: spar,
  	sqcap: sqcap,
  	sqcaps: sqcaps,
  	sqcup: sqcup,
  	sqcups: sqcups,
  	Sqrt: Sqrt,
  	sqsub: sqsub,
  	sqsube: sqsube,
  	sqsubset: sqsubset,
  	sqsubseteq: sqsubseteq,
  	sqsup: sqsup,
  	sqsupe: sqsupe,
  	sqsupset: sqsupset,
  	sqsupseteq: sqsupseteq,
  	square: square,
  	Square: Square,
  	SquareIntersection: SquareIntersection,
  	SquareSubset: SquareSubset,
  	SquareSubsetEqual: SquareSubsetEqual,
  	SquareSuperset: SquareSuperset,
  	SquareSupersetEqual: SquareSupersetEqual,
  	SquareUnion: SquareUnion,
  	squarf: squarf,
  	squ: squ,
  	squf: squf,
  	srarr: srarr,
  	Sscr: Sscr,
  	sscr: sscr,
  	ssetmn: ssetmn,
  	ssmile: ssmile,
  	sstarf: sstarf,
  	Star: Star,
  	star: star,
  	starf: starf,
  	straightepsilon: straightepsilon,
  	straightphi: straightphi,
  	strns: strns,
  	sub: sub,
  	Sub: Sub,
  	subdot: subdot,
  	subE: subE,
  	sube: sube,
  	subedot: subedot,
  	submult: submult,
  	subnE: subnE,
  	subne: subne,
  	subplus: subplus,
  	subrarr: subrarr,
  	subset: subset,
  	Subset: Subset,
  	subseteq: subseteq,
  	subseteqq: subseteqq,
  	SubsetEqual: SubsetEqual,
  	subsetneq: subsetneq,
  	subsetneqq: subsetneqq,
  	subsim: subsim,
  	subsub: subsub,
  	subsup: subsup,
  	succapprox: succapprox,
  	succ: succ,
  	succcurlyeq: succcurlyeq,
  	Succeeds: Succeeds,
  	SucceedsEqual: SucceedsEqual,
  	SucceedsSlantEqual: SucceedsSlantEqual,
  	SucceedsTilde: SucceedsTilde,
  	succeq: succeq,
  	succnapprox: succnapprox,
  	succneqq: succneqq,
  	succnsim: succnsim,
  	succsim: succsim,
  	SuchThat: SuchThat,
  	sum: sum,
  	Sum: Sum,
  	sung: sung,
  	sup1: sup1,
  	sup2: sup2,
  	sup3: sup3,
  	sup: sup,
  	Sup: Sup,
  	supdot: supdot,
  	supdsub: supdsub,
  	supE: supE,
  	supe: supe,
  	supedot: supedot,
  	Superset: Superset,
  	SupersetEqual: SupersetEqual,
  	suphsol: suphsol,
  	suphsub: suphsub,
  	suplarr: suplarr,
  	supmult: supmult,
  	supnE: supnE,
  	supne: supne,
  	supplus: supplus,
  	supset: supset,
  	Supset: Supset,
  	supseteq: supseteq,
  	supseteqq: supseteqq,
  	supsetneq: supsetneq,
  	supsetneqq: supsetneqq,
  	supsim: supsim,
  	supsub: supsub,
  	supsup: supsup,
  	swarhk: swarhk,
  	swarr: swarr,
  	swArr: swArr,
  	swarrow: swarrow,
  	swnwar: swnwar,
  	szlig: szlig,
  	Tab: Tab,
  	target: target,
  	Tau: Tau,
  	tau: tau,
  	tbrk: tbrk,
  	Tcaron: Tcaron,
  	tcaron: tcaron,
  	Tcedil: Tcedil,
  	tcedil: tcedil,
  	Tcy: Tcy,
  	tcy: tcy,
  	tdot: tdot,
  	telrec: telrec,
  	Tfr: Tfr,
  	tfr: tfr,
  	there4: there4,
  	therefore: therefore,
  	Therefore: Therefore,
  	Theta: Theta,
  	theta: theta,
  	thetasym: thetasym,
  	thetav: thetav,
  	thickapprox: thickapprox,
  	thicksim: thicksim,
  	ThickSpace: ThickSpace,
  	ThinSpace: ThinSpace,
  	thinsp: thinsp,
  	thkap: thkap,
  	thksim: thksim,
  	THORN: THORN,
  	thorn: thorn,
  	tilde: tilde,
  	Tilde: Tilde,
  	TildeEqual: TildeEqual,
  	TildeFullEqual: TildeFullEqual,
  	TildeTilde: TildeTilde,
  	timesbar: timesbar,
  	timesb: timesb,
  	times: times,
  	timesd: timesd,
  	tint: tint,
  	toea: toea,
  	topbot: topbot,
  	topcir: topcir,
  	top: top,
  	Topf: Topf,
  	topf: topf,
  	topfork: topfork,
  	tosa: tosa,
  	tprime: tprime,
  	trade: trade,
  	TRADE: TRADE,
  	triangle: triangle,
  	triangledown: triangledown,
  	triangleleft: triangleleft,
  	trianglelefteq: trianglelefteq,
  	triangleq: triangleq,
  	triangleright: triangleright,
  	trianglerighteq: trianglerighteq,
  	tridot: tridot,
  	trie: trie,
  	triminus: triminus,
  	TripleDot: TripleDot,
  	triplus: triplus,
  	trisb: trisb,
  	tritime: tritime,
  	trpezium: trpezium,
  	Tscr: Tscr,
  	tscr: tscr,
  	TScy: TScy,
  	tscy: tscy,
  	TSHcy: TSHcy,
  	tshcy: tshcy,
  	Tstrok: Tstrok,
  	tstrok: tstrok,
  	twixt: twixt,
  	twoheadleftarrow: twoheadleftarrow,
  	twoheadrightarrow: twoheadrightarrow,
  	Uacute: Uacute,
  	uacute: uacute,
  	uarr: uarr,
  	Uarr: Uarr,
  	uArr: uArr,
  	Uarrocir: Uarrocir,
  	Ubrcy: Ubrcy,
  	ubrcy: ubrcy,
  	Ubreve: Ubreve,
  	ubreve: ubreve,
  	Ucirc: Ucirc,
  	ucirc: ucirc,
  	Ucy: Ucy,
  	ucy: ucy,
  	udarr: udarr,
  	Udblac: Udblac,
  	udblac: udblac,
  	udhar: udhar,
  	ufisht: ufisht,
  	Ufr: Ufr,
  	ufr: ufr,
  	Ugrave: Ugrave,
  	ugrave: ugrave,
  	uHar: uHar,
  	uharl: uharl,
  	uharr: uharr,
  	uhblk: uhblk,
  	ulcorn: ulcorn,
  	ulcorner: ulcorner,
  	ulcrop: ulcrop,
  	ultri: ultri,
  	Umacr: Umacr,
  	umacr: umacr,
  	uml: uml,
  	UnderBar: UnderBar,
  	UnderBrace: UnderBrace,
  	UnderBracket: UnderBracket,
  	UnderParenthesis: UnderParenthesis,
  	Union: Union,
  	UnionPlus: UnionPlus,
  	Uogon: Uogon,
  	uogon: uogon,
  	Uopf: Uopf,
  	uopf: uopf,
  	UpArrowBar: UpArrowBar,
  	uparrow: uparrow,
  	UpArrow: UpArrow,
  	Uparrow: Uparrow,
  	UpArrowDownArrow: UpArrowDownArrow,
  	updownarrow: updownarrow,
  	UpDownArrow: UpDownArrow,
  	Updownarrow: Updownarrow,
  	UpEquilibrium: UpEquilibrium,
  	upharpoonleft: upharpoonleft,
  	upharpoonright: upharpoonright,
  	uplus: uplus,
  	UpperLeftArrow: UpperLeftArrow,
  	UpperRightArrow: UpperRightArrow,
  	upsi: upsi,
  	Upsi: Upsi,
  	upsih: upsih,
  	Upsilon: Upsilon,
  	upsilon: upsilon,
  	UpTeeArrow: UpTeeArrow,
  	UpTee: UpTee,
  	upuparrows: upuparrows,
  	urcorn: urcorn,
  	urcorner: urcorner,
  	urcrop: urcrop,
  	Uring: Uring,
  	uring: uring,
  	urtri: urtri,
  	Uscr: Uscr,
  	uscr: uscr,
  	utdot: utdot,
  	Utilde: Utilde,
  	utilde: utilde,
  	utri: utri,
  	utrif: utrif,
  	uuarr: uuarr,
  	Uuml: Uuml,
  	uuml: uuml,
  	uwangle: uwangle,
  	vangrt: vangrt,
  	varepsilon: varepsilon,
  	varkappa: varkappa,
  	varnothing: varnothing,
  	varphi: varphi,
  	varpi: varpi,
  	varpropto: varpropto,
  	varr: varr,
  	vArr: vArr,
  	varrho: varrho,
  	varsigma: varsigma,
  	varsubsetneq: varsubsetneq,
  	varsubsetneqq: varsubsetneqq,
  	varsupsetneq: varsupsetneq,
  	varsupsetneqq: varsupsetneqq,
  	vartheta: vartheta,
  	vartriangleleft: vartriangleleft,
  	vartriangleright: vartriangleright,
  	vBar: vBar,
  	Vbar: Vbar,
  	vBarv: vBarv,
  	Vcy: Vcy,
  	vcy: vcy,
  	vdash: vdash,
  	vDash: vDash,
  	Vdash: Vdash,
  	VDash: VDash,
  	Vdashl: Vdashl,
  	veebar: veebar,
  	vee: vee,
  	Vee: Vee,
  	veeeq: veeeq,
  	vellip: vellip,
  	verbar: verbar,
  	Verbar: Verbar,
  	vert: vert,
  	Vert: Vert,
  	VerticalBar: VerticalBar,
  	VerticalLine: VerticalLine,
  	VerticalSeparator: VerticalSeparator,
  	VerticalTilde: VerticalTilde,
  	VeryThinSpace: VeryThinSpace,
  	Vfr: Vfr,
  	vfr: vfr,
  	vltri: vltri,
  	vnsub: vnsub,
  	vnsup: vnsup,
  	Vopf: Vopf,
  	vopf: vopf,
  	vprop: vprop,
  	vrtri: vrtri,
  	Vscr: Vscr,
  	vscr: vscr,
  	vsubnE: vsubnE,
  	vsubne: vsubne,
  	vsupnE: vsupnE,
  	vsupne: vsupne,
  	Vvdash: Vvdash,
  	vzigzag: vzigzag,
  	Wcirc: Wcirc,
  	wcirc: wcirc,
  	wedbar: wedbar,
  	wedge: wedge,
  	Wedge: Wedge,
  	wedgeq: wedgeq,
  	weierp: weierp,
  	Wfr: Wfr,
  	wfr: wfr,
  	Wopf: Wopf,
  	wopf: wopf,
  	wp: wp,
  	wr: wr,
  	wreath: wreath,
  	Wscr: Wscr,
  	wscr: wscr,
  	xcap: xcap,
  	xcirc: xcirc,
  	xcup: xcup,
  	xdtri: xdtri,
  	Xfr: Xfr,
  	xfr: xfr,
  	xharr: xharr,
  	xhArr: xhArr,
  	Xi: Xi,
  	xi: xi,
  	xlarr: xlarr,
  	xlArr: xlArr,
  	xmap: xmap,
  	xnis: xnis,
  	xodot: xodot,
  	Xopf: Xopf,
  	xopf: xopf,
  	xoplus: xoplus,
  	xotime: xotime,
  	xrarr: xrarr,
  	xrArr: xrArr,
  	Xscr: Xscr,
  	xscr: xscr,
  	xsqcup: xsqcup,
  	xuplus: xuplus,
  	xutri: xutri,
  	xvee: xvee,
  	xwedge: xwedge,
  	Yacute: Yacute,
  	yacute: yacute,
  	YAcy: YAcy,
  	yacy: yacy,
  	Ycirc: Ycirc,
  	ycirc: ycirc,
  	Ycy: Ycy,
  	ycy: ycy,
  	yen: yen,
  	Yfr: Yfr,
  	yfr: yfr,
  	YIcy: YIcy,
  	yicy: yicy,
  	Yopf: Yopf,
  	yopf: yopf,
  	Yscr: Yscr,
  	yscr: yscr,
  	YUcy: YUcy,
  	yucy: yucy,
  	yuml: yuml,
  	Yuml: Yuml,
  	Zacute: Zacute,
  	zacute: zacute,
  	Zcaron: Zcaron,
  	zcaron: zcaron,
  	Zcy: Zcy,
  	zcy: zcy,
  	Zdot: Zdot,
  	zdot: zdot,
  	zeetrf: zeetrf,
  	ZeroWidthSpace: ZeroWidthSpace,
  	Zeta: Zeta,
  	zeta: zeta,
  	zfr: zfr,
  	Zfr: Zfr,
  	ZHcy: ZHcy,
  	zhcy: zhcy,
  	zigrarr: zigrarr,
  	zopf: zopf,
  	Zopf: Zopf,
  	Zscr: Zscr,
  	zscr: zscr,
  	zwj: zwj,
  	zwnj: zwnj
  };

  /*eslint quotes:0*/
  var entities = require$$0;

  var regex=/[!-#%-\*,-\/:;\?@\[-\]_\{\}\xA1\xA7\xAB\xB6\xB7\xBB\xBF\u037E\u0387\u055A-\u055F\u0589\u058A\u05BE\u05C0\u05C3\u05C6\u05F3\u05F4\u0609\u060A\u060C\u060D\u061B\u061E\u061F\u066A-\u066D\u06D4\u0700-\u070D\u07F7-\u07F9\u0830-\u083E\u085E\u0964\u0965\u0970\u09FD\u0A76\u0AF0\u0C84\u0DF4\u0E4F\u0E5A\u0E5B\u0F04-\u0F12\u0F14\u0F3A-\u0F3D\u0F85\u0FD0-\u0FD4\u0FD9\u0FDA\u104A-\u104F\u10FB\u1360-\u1368\u1400\u166D\u166E\u169B\u169C\u16EB-\u16ED\u1735\u1736\u17D4-\u17D6\u17D8-\u17DA\u1800-\u180A\u1944\u1945\u1A1E\u1A1F\u1AA0-\u1AA6\u1AA8-\u1AAD\u1B5A-\u1B60\u1BFC-\u1BFF\u1C3B-\u1C3F\u1C7E\u1C7F\u1CC0-\u1CC7\u1CD3\u2010-\u2027\u2030-\u2043\u2045-\u2051\u2053-\u205E\u207D\u207E\u208D\u208E\u2308-\u230B\u2329\u232A\u2768-\u2775\u27C5\u27C6\u27E6-\u27EF\u2983-\u2998\u29D8-\u29DB\u29FC\u29FD\u2CF9-\u2CFC\u2CFE\u2CFF\u2D70\u2E00-\u2E2E\u2E30-\u2E4E\u3001-\u3003\u3008-\u3011\u3014-\u301F\u3030\u303D\u30A0\u30FB\uA4FE\uA4FF\uA60D-\uA60F\uA673\uA67E\uA6F2-\uA6F7\uA874-\uA877\uA8CE\uA8CF\uA8F8-\uA8FA\uA8FC\uA92E\uA92F\uA95F\uA9C1-\uA9CD\uA9DE\uA9DF\uAA5C-\uAA5F\uAADE\uAADF\uAAF0\uAAF1\uABEB\uFD3E\uFD3F\uFE10-\uFE19\uFE30-\uFE52\uFE54-\uFE61\uFE63\uFE68\uFE6A\uFE6B\uFF01-\uFF03\uFF05-\uFF0A\uFF0C-\uFF0F\uFF1A\uFF1B\uFF1F\uFF20\uFF3B-\uFF3D\uFF3F\uFF5B\uFF5D\uFF5F-\uFF65]|\uD800[\uDD00-\uDD02\uDF9F\uDFD0]|\uD801\uDD6F|\uD802[\uDC57\uDD1F\uDD3F\uDE50-\uDE58\uDE7F\uDEF0-\uDEF6\uDF39-\uDF3F\uDF99-\uDF9C]|\uD803[\uDF55-\uDF59]|\uD804[\uDC47-\uDC4D\uDCBB\uDCBC\uDCBE-\uDCC1\uDD40-\uDD43\uDD74\uDD75\uDDC5-\uDDC8\uDDCD\uDDDB\uDDDD-\uDDDF\uDE38-\uDE3D\uDEA9]|\uD805[\uDC4B-\uDC4F\uDC5B\uDC5D\uDCC6\uDDC1-\uDDD7\uDE41-\uDE43\uDE60-\uDE6C\uDF3C-\uDF3E]|\uD806[\uDC3B\uDE3F-\uDE46\uDE9A-\uDE9C\uDE9E-\uDEA2]|\uD807[\uDC41-\uDC45\uDC70\uDC71\uDEF7\uDEF8]|\uD809[\uDC70-\uDC74]|\uD81A[\uDE6E\uDE6F\uDEF5\uDF37-\uDF3B\uDF44]|\uD81B[\uDE97-\uDE9A]|\uD82F\uDC9F|\uD836[\uDE87-\uDE8B]|\uD83A[\uDD5E\uDD5F]/;

  var encodeCache = {};


  // Create a lookup array where anything but characters in `chars` string
  // and alphanumeric chars is percent-encoded.
  //
  function getEncodeCache(exclude) {
    var i, ch, cache = encodeCache[exclude];
    if (cache) { return cache; }

    cache = encodeCache[exclude] = [];

    for (i = 0; i < 128; i++) {
      ch = String.fromCharCode(i);

      if (/^[0-9a-z]$/i.test(ch)) {
        // always allow unencoded alphanumeric characters
        cache.push(ch);
      } else {
        cache.push('%' + ('0' + i.toString(16).toUpperCase()).slice(-2));
      }
    }

    for (i = 0; i < exclude.length; i++) {
      cache[exclude.charCodeAt(i)] = exclude[i];
    }

    return cache;
  }


  // Encode unsafe characters with percent-encoding, skipping already
  // encoded sequences.
  //
  //  - string       - string to encode
  //  - exclude      - list of characters to ignore (in addition to a-zA-Z0-9)
  //  - keepEscaped  - don't encode '%' in a correct escape sequence (default: true)
  //
  function encode(string, exclude, keepEscaped) {
    var i, l, code, nextCode, cache,
        result = '';

    if (typeof exclude !== 'string') {
      // encode(string, keepEscaped)
      keepEscaped  = exclude;
      exclude = encode.defaultChars;
    }

    if (typeof keepEscaped === 'undefined') {
      keepEscaped = true;
    }

    cache = getEncodeCache(exclude);

    for (i = 0, l = string.length; i < l; i++) {
      code = string.charCodeAt(i);

      if (keepEscaped && code === 0x25 /* % */ && i + 2 < l) {
        if (/^[0-9a-f]{2}$/i.test(string.slice(i + 1, i + 3))) {
          result += string.slice(i, i + 3);
          i += 2;
          continue;
        }
      }

      if (code < 128) {
        result += cache[code];
        continue;
      }

      if (code >= 0xD800 && code <= 0xDFFF) {
        if (code >= 0xD800 && code <= 0xDBFF && i + 1 < l) {
          nextCode = string.charCodeAt(i + 1);
          if (nextCode >= 0xDC00 && nextCode <= 0xDFFF) {
            result += encodeURIComponent(string[i] + string[i + 1]);
            i++;
            continue;
          }
        }
        result += '%EF%BF%BD';
        continue;
      }

      result += encodeURIComponent(string[i]);
    }

    return result;
  }

  encode.defaultChars   = ";/?:@&=+$,-_.!~*'()#";
  encode.componentChars = "-_.!~*'()";


  var encode_1 = encode;

  /* eslint-disable no-bitwise */

  var decodeCache = {};

  function getDecodeCache(exclude) {
    var i, ch, cache = decodeCache[exclude];
    if (cache) { return cache; }

    cache = decodeCache[exclude] = [];

    for (i = 0; i < 128; i++) {
      ch = String.fromCharCode(i);
      cache.push(ch);
    }

    for (i = 0; i < exclude.length; i++) {
      ch = exclude.charCodeAt(i);
      cache[ch] = '%' + ('0' + ch.toString(16).toUpperCase()).slice(-2);
    }

    return cache;
  }


  // Decode percent-encoded string.
  //
  function decode(string, exclude) {
    var cache;

    if (typeof exclude !== 'string') {
      exclude = decode.defaultChars;
    }

    cache = getDecodeCache(exclude);

    return string.replace(/(%[a-f0-9]{2})+/gi, function(seq) {
      var i, l, b1, b2, b3, b4, chr,
          result = '';

      for (i = 0, l = seq.length; i < l; i += 3) {
        b1 = parseInt(seq.slice(i + 1, i + 3), 16);

        if (b1 < 0x80) {
          result += cache[b1];
          continue;
        }

        if ((b1 & 0xE0) === 0xC0 && (i + 3 < l)) {
          // 110xxxxx 10xxxxxx
          b2 = parseInt(seq.slice(i + 4, i + 6), 16);

          if ((b2 & 0xC0) === 0x80) {
            chr = ((b1 << 6) & 0x7C0) | (b2 & 0x3F);

            if (chr < 0x80) {
              result += '\ufffd\ufffd';
            } else {
              result += String.fromCharCode(chr);
            }

            i += 3;
            continue;
          }
        }

        if ((b1 & 0xF0) === 0xE0 && (i + 6 < l)) {
          // 1110xxxx 10xxxxxx 10xxxxxx
          b2 = parseInt(seq.slice(i + 4, i + 6), 16);
          b3 = parseInt(seq.slice(i + 7, i + 9), 16);

          if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80) {
            chr = ((b1 << 12) & 0xF000) | ((b2 << 6) & 0xFC0) | (b3 & 0x3F);

            if (chr < 0x800 || (chr >= 0xD800 && chr <= 0xDFFF)) {
              result += '\ufffd\ufffd\ufffd';
            } else {
              result += String.fromCharCode(chr);
            }

            i += 6;
            continue;
          }
        }

        if ((b1 & 0xF8) === 0xF0 && (i + 9 < l)) {
          // 111110xx 10xxxxxx 10xxxxxx 10xxxxxx
          b2 = parseInt(seq.slice(i + 4, i + 6), 16);
          b3 = parseInt(seq.slice(i + 7, i + 9), 16);
          b4 = parseInt(seq.slice(i + 10, i + 12), 16);

          if ((b2 & 0xC0) === 0x80 && (b3 & 0xC0) === 0x80 && (b4 & 0xC0) === 0x80) {
            chr = ((b1 << 18) & 0x1C0000) | ((b2 << 12) & 0x3F000) | ((b3 << 6) & 0xFC0) | (b4 & 0x3F);

            if (chr < 0x10000 || chr > 0x10FFFF) {
              result += '\ufffd\ufffd\ufffd\ufffd';
            } else {
              chr -= 0x10000;
              result += String.fromCharCode(0xD800 + (chr >> 10), 0xDC00 + (chr & 0x3FF));
            }

            i += 9;
            continue;
          }
        }

        result += '\ufffd';
      }

      return result;
    });
  }


  decode.defaultChars   = ';/?:@&=+$,#';
  decode.componentChars = '';


  var decode_1 = decode;

  var format = function format(url) {
    var result = '';

    result += url.protocol || '';
    result += url.slashes ? '//' : '';
    result += url.auth ? url.auth + '@' : '';

    if (url.hostname && url.hostname.indexOf(':') !== -1) {
      // ipv6 address
      result += '[' + url.hostname + ']';
    } else {
      result += url.hostname || '';
    }

    result += url.port ? ':' + url.port : '';
    result += url.pathname || '';
    result += url.search || '';
    result += url.hash || '';

    return result;
  };

  // Copyright Joyent, Inc. and other Node contributors.

  //
  // Changes from joyent/node:
  //
  // 1. No leading slash in paths,
  //    e.g. in `url.parse('http://foo?bar')` pathname is ``, not `/`
  //
  // 2. Backslashes are not replaced with slashes,
  //    so `http:\\example.org\` is treated like a relative path
  //
  // 3. Trailing colon is treated like a part of the path,
  //    i.e. in `http://example.org:foo` pathname is `:foo`
  //
  // 4. Nothing is URL-encoded in the resulting object,
  //    (in joyent/node some chars in auth and paths are encoded)
  //
  // 5. `url.parse()` does not have `parseQueryString` argument
  //
  // 6. Removed extraneous result properties: `host`, `path`, `query`, etc.,
  //    which can be constructed using other parts of the url.
  //


  function Url() {
    this.protocol = null;
    this.slashes = null;
    this.auth = null;
    this.port = null;
    this.hostname = null;
    this.hash = null;
    this.search = null;
    this.pathname = null;
  }

  // Reference: RFC 3986, RFC 1808, RFC 2396

  // define these here so at least they only have to be
  // compiled once on the first module load.
  var protocolPattern = /^([a-z0-9.+-]+:)/i,
      portPattern = /:[0-9]*$/,

      // Special case for a simple path URL
      simplePathPattern = /^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,

      // RFC 2396: characters reserved for delimiting URLs.
      // We actually just auto-escape these.
      delims = [ '<', '>', '"', '`', ' ', '\r', '\n', '\t' ],

      // RFC 2396: characters not allowed for various reasons.
      unwise = [ '{', '}', '|', '\\', '^', '`' ].concat(delims),

      // Allowed by RFCs, but cause of XSS attacks.  Always escape these.
      autoEscape = [ '\'' ].concat(unwise),
      // Characters that are never ever allowed in a hostname.
      // Note that any invalid chars are also handled, but these
      // are the ones that are *expected* to be seen, so we fast-path
      // them.
      nonHostChars = [ '%', '/', '?', ';', '#' ].concat(autoEscape),
      hostEndingChars = [ '/', '?', '#' ],
      hostnameMaxLen = 255,
      hostnamePartPattern = /^[+a-z0-9A-Z_-]{0,63}$/,
      hostnamePartStart = /^([+a-z0-9A-Z_-]{0,63})(.*)$/,
      // protocols that can allow "unsafe" and "unwise" chars.
      /* eslint-disable no-script-url */
      // protocols that never have a hostname.
      hostlessProtocol = {
        'javascript': true,
        'javascript:': true
      },
      // protocols that always contain a // bit.
      slashedProtocol = {
        'http': true,
        'https': true,
        'ftp': true,
        'gopher': true,
        'file': true,
        'http:': true,
        'https:': true,
        'ftp:': true,
        'gopher:': true,
        'file:': true
      };
      /* eslint-enable no-script-url */

  function urlParse(url, slashesDenoteHost) {
    if (url && url instanceof Url) { return url; }

    var u = new Url();
    u.parse(url, slashesDenoteHost);
    return u;
  }

  Url.prototype.parse = function(url, slashesDenoteHost) {
    var i, l, lowerProto, hec, slashes,
        rest = url;

    // trim before proceeding.
    // This is to support parse stuff like "  http://foo.com  \n"
    rest = rest.trim();

    if (!slashesDenoteHost && url.split('#').length === 1) {
      // Try fast path regexp
      var simplePath = simplePathPattern.exec(rest);
      if (simplePath) {
        this.pathname = simplePath[1];
        if (simplePath[2]) {
          this.search = simplePath[2];
        }
        return this;
      }
    }

    var proto = protocolPattern.exec(rest);
    if (proto) {
      proto = proto[0];
      lowerProto = proto.toLowerCase();
      this.protocol = proto;
      rest = rest.substr(proto.length);
    }

    // figure out if it's got a host
    // user@server is *always* interpreted as a hostname, and url
    // resolution will treat //foo/bar as host=foo,path=bar because that's
    // how the browser resolves relative URLs.
    if (slashesDenoteHost || proto || rest.match(/^\/\/[^@\/]+@[^@\/]+/)) {
      slashes = rest.substr(0, 2) === '//';
      if (slashes && !(proto && hostlessProtocol[proto])) {
        rest = rest.substr(2);
        this.slashes = true;
      }
    }

    if (!hostlessProtocol[proto] &&
        (slashes || (proto && !slashedProtocol[proto]))) {

      // there's a hostname.
      // the first instance of /, ?, ;, or # ends the host.
      //
      // If there is an @ in the hostname, then non-host chars *are* allowed
      // to the left of the last @ sign, unless some host-ending character
      // comes *before* the @-sign.
      // URLs are obnoxious.
      //
      // ex:
      // http://a@b@c/ => user:a@b host:c
      // http://a@b?@c => user:a host:c path:/?@c

      // v0.12 TODO(isaacs): This is not quite how Chrome does things.
      // Review our test case against browsers more comprehensively.

      // find the first instance of any hostEndingChars
      var hostEnd = -1;
      for (i = 0; i < hostEndingChars.length; i++) {
        hec = rest.indexOf(hostEndingChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
          hostEnd = hec;
        }
      }

      // at this point, either we have an explicit point where the
      // auth portion cannot go past, or the last @ char is the decider.
      var auth, atSign;
      if (hostEnd === -1) {
        // atSign can be anywhere.
        atSign = rest.lastIndexOf('@');
      } else {
        // atSign must be in auth portion.
        // http://a@b/c@d => host:b auth:a path:/c@d
        atSign = rest.lastIndexOf('@', hostEnd);
      }

      // Now we have a portion which is definitely the auth.
      // Pull that off.
      if (atSign !== -1) {
        auth = rest.slice(0, atSign);
        rest = rest.slice(atSign + 1);
        this.auth = auth;
      }

      // the host is the remaining to the left of the first non-host char
      hostEnd = -1;
      for (i = 0; i < nonHostChars.length; i++) {
        hec = rest.indexOf(nonHostChars[i]);
        if (hec !== -1 && (hostEnd === -1 || hec < hostEnd)) {
          hostEnd = hec;
        }
      }
      // if we still have not hit it, then the entire thing is a host.
      if (hostEnd === -1) {
        hostEnd = rest.length;
      }

      if (rest[hostEnd - 1] === ':') { hostEnd--; }
      var host = rest.slice(0, hostEnd);
      rest = rest.slice(hostEnd);

      // pull out port.
      this.parseHost(host);

      // we've indicated that there is a hostname,
      // so even if it's empty, it has to be present.
      this.hostname = this.hostname || '';

      // if hostname begins with [ and ends with ]
      // assume that it's an IPv6 address.
      var ipv6Hostname = this.hostname[0] === '[' &&
          this.hostname[this.hostname.length - 1] === ']';

      // validate a little.
      if (!ipv6Hostname) {
        var hostparts = this.hostname.split(/\./);
        for (i = 0, l = hostparts.length; i < l; i++) {
          var part = hostparts[i];
          if (!part) { continue; }
          if (!part.match(hostnamePartPattern)) {
            var newpart = '';
            for (var j = 0, k = part.length; j < k; j++) {
              if (part.charCodeAt(j) > 127) {
                // we replace non-ASCII char with a temporary placeholder
                // we need this to make sure size of hostname is not
                // broken by replacing non-ASCII by nothing
                newpart += 'x';
              } else {
                newpart += part[j];
              }
            }
            // we test again with ASCII char only
            if (!newpart.match(hostnamePartPattern)) {
              var validParts = hostparts.slice(0, i);
              var notHost = hostparts.slice(i + 1);
              var bit = part.match(hostnamePartStart);
              if (bit) {
                validParts.push(bit[1]);
                notHost.unshift(bit[2]);
              }
              if (notHost.length) {
                rest = notHost.join('.') + rest;
              }
              this.hostname = validParts.join('.');
              break;
            }
          }
        }
      }

      if (this.hostname.length > hostnameMaxLen) {
        this.hostname = '';
      }

      // strip [ and ] from the hostname
      // the host field still retains them, though
      if (ipv6Hostname) {
        this.hostname = this.hostname.substr(1, this.hostname.length - 2);
      }
    }

    // chop off from the tail first.
    var hash = rest.indexOf('#');
    if (hash !== -1) {
      // got a fragment string.
      this.hash = rest.substr(hash);
      rest = rest.slice(0, hash);
    }
    var qm = rest.indexOf('?');
    if (qm !== -1) {
      this.search = rest.substr(qm);
      rest = rest.slice(0, qm);
    }
    if (rest) { this.pathname = rest; }
    if (slashedProtocol[lowerProto] &&
        this.hostname && !this.pathname) {
      this.pathname = '';
    }

    return this;
  };

  Url.prototype.parseHost = function(host) {
    var port = portPattern.exec(host);
    if (port) {
      port = port[0];
      if (port !== ':') {
        this.port = port.substr(1);
      }
      host = host.substr(0, host.length - port.length);
    }
    if (host) { this.hostname = host; }
  };

  var parse = urlParse;

  var encode$1 = encode_1;
  var decode$1 = decode_1;
  var format$1 = format;
  var parse$1  = parse;

  var mdurl = {
  	encode: encode$1,
  	decode: decode$1,
  	format: format$1,
  	parse: parse$1
  };

  var regex$1=/[\0-\uD7FF\uE000-\uFFFF]|[\uD800-\uDBFF][\uDC00-\uDFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;

  var regex$2=/[\0-\x1F\x7F-\x9F]/;

  var regex$3=/[\xAD\u0600-\u0605\u061C\u06DD\u070F\u08E2\u180E\u200B-\u200F\u202A-\u202E\u2060-\u2064\u2066-\u206F\uFEFF\uFFF9-\uFFFB]|\uD804[\uDCBD\uDCCD]|\uD82F[\uDCA0-\uDCA3]|\uD834[\uDD73-\uDD7A]|\uDB40[\uDC01\uDC20-\uDC7F]/;

  var regex$4=/[ \xA0\u1680\u2000-\u200A\u2028\u2029\u202F\u205F\u3000]/;

  var Any = regex$1;
  var Cc  = regex$2;
  var Cf  = regex$3;
  var P   = regex;
  var Z   = regex$4;

  var uc_micro = {
  	Any: Any,
  	Cc: Cc,
  	Cf: Cf,
  	P: P,
  	Z: Z
  };

  var utils = createCommonjsModule(function (module, exports) {


  function _class(obj) { return Object.prototype.toString.call(obj); }

  function isString(obj) { return _class(obj) === '[object String]'; }

  var _hasOwnProperty = Object.prototype.hasOwnProperty;

  function has(object, key) {
    return _hasOwnProperty.call(object, key);
  }

  // Merge objects
  //
  function assign(obj /*from1, from2, from3, ...*/) {
    var sources = Array.prototype.slice.call(arguments, 1);

    sources.forEach(function (source) {
      if (!source) { return; }

      if (typeof source !== 'object') {
        throw new TypeError(source + 'must be object');
      }

      Object.keys(source).forEach(function (key) {
        obj[key] = source[key];
      });
    });

    return obj;
  }

  // Remove element from array and put another array at those position.
  // Useful for some operations with tokens
  function arrayReplaceAt(src, pos, newElements) {
    return [].concat(src.slice(0, pos), newElements, src.slice(pos + 1));
  }

  ////////////////////////////////////////////////////////////////////////////////

  function isValidEntityCode(c) {
    /*eslint no-bitwise:0*/
    // broken sequence
    if (c >= 0xD800 && c <= 0xDFFF) { return false; }
    // never used
    if (c >= 0xFDD0 && c <= 0xFDEF) { return false; }
    if ((c & 0xFFFF) === 0xFFFF || (c & 0xFFFF) === 0xFFFE) { return false; }
    // control codes
    if (c >= 0x00 && c <= 0x08) { return false; }
    if (c === 0x0B) { return false; }
    if (c >= 0x0E && c <= 0x1F) { return false; }
    if (c >= 0x7F && c <= 0x9F) { return false; }
    // out of range
    if (c > 0x10FFFF) { return false; }
    return true;
  }

  function fromCodePoint(c) {
    /*eslint no-bitwise:0*/
    if (c > 0xffff) {
      c -= 0x10000;
      var surrogate1 = 0xd800 + (c >> 10),
          surrogate2 = 0xdc00 + (c & 0x3ff);

      return String.fromCharCode(surrogate1, surrogate2);
    }
    return String.fromCharCode(c);
  }


  var UNESCAPE_MD_RE  = /\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g;
  var ENTITY_RE       = /&([a-z#][a-z0-9]{1,31});/gi;
  var UNESCAPE_ALL_RE = new RegExp(UNESCAPE_MD_RE.source + '|' + ENTITY_RE.source, 'gi');

  var DIGITAL_ENTITY_TEST_RE = /^#((?:x[a-f0-9]{1,8}|[0-9]{1,8}))/i;



  function replaceEntityPattern(match, name) {
    var code = 0;

    if (has(entities, name)) {
      return entities[name];
    }

    if (name.charCodeAt(0) === 0x23/* # */ && DIGITAL_ENTITY_TEST_RE.test(name)) {
      code = name[1].toLowerCase() === 'x' ?
        parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);

      if (isValidEntityCode(code)) {
        return fromCodePoint(code);
      }
    }

    return match;
  }

  /*function replaceEntities(str) {
    if (str.indexOf('&') < 0) { return str; }

    return str.replace(ENTITY_RE, replaceEntityPattern);
  }*/

  function unescapeMd(str) {
    if (str.indexOf('\\') < 0) { return str; }
    return str.replace(UNESCAPE_MD_RE, '$1');
  }

  function unescapeAll(str) {
    if (str.indexOf('\\') < 0 && str.indexOf('&') < 0) { return str; }

    return str.replace(UNESCAPE_ALL_RE, function (match, escaped, entity) {
      if (escaped) { return escaped; }
      return replaceEntityPattern(match, entity);
    });
  }

  ////////////////////////////////////////////////////////////////////////////////

  var HTML_ESCAPE_TEST_RE = /[&<>"]/;
  var HTML_ESCAPE_REPLACE_RE = /[&<>"]/g;
  var HTML_REPLACEMENTS = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;'
  };

  function replaceUnsafeChar(ch) {
    return HTML_REPLACEMENTS[ch];
  }

  function escapeHtml(str) {
    if (HTML_ESCAPE_TEST_RE.test(str)) {
      return str.replace(HTML_ESCAPE_REPLACE_RE, replaceUnsafeChar);
    }
    return str;
  }

  ////////////////////////////////////////////////////////////////////////////////

  var REGEXP_ESCAPE_RE = /[.?*+^$[\]\\(){}|-]/g;

  function escapeRE(str) {
    return str.replace(REGEXP_ESCAPE_RE, '\\$&');
  }

  ////////////////////////////////////////////////////////////////////////////////

  function isSpace(code) {
    switch (code) {
      case 0x09:
      case 0x20:
        return true;
    }
    return false;
  }

  // Zs (unicode class) || [\t\f\v\r\n]
  function isWhiteSpace(code) {
    if (code >= 0x2000 && code <= 0x200A) { return true; }
    switch (code) {
      case 0x09: // \t
      case 0x0A: // \n
      case 0x0B: // \v
      case 0x0C: // \f
      case 0x0D: // \r
      case 0x20:
      case 0xA0:
      case 0x1680:
      case 0x202F:
      case 0x205F:
      case 0x3000:
        return true;
    }
    return false;
  }

  ////////////////////////////////////////////////////////////////////////////////

  /*eslint-disable max-len*/


  // Currently without astral characters support.
  function isPunctChar(ch) {
    return regex.test(ch);
  }


  // Markdown ASCII punctuation characters.
  //
  // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~
  // http://spec.commonmark.org/0.15/#ascii-punctuation-character
  //
  // Don't confuse with unicode punctuation !!! It lacks some chars in ascii range.
  //
  function isMdAsciiPunct(ch) {
    switch (ch) {
      case 0x21/* ! */:
      case 0x22/* " */:
      case 0x23/* # */:
      case 0x24/* $ */:
      case 0x25/* % */:
      case 0x26/* & */:
      case 0x27/* ' */:
      case 0x28/* ( */:
      case 0x29/* ) */:
      case 0x2A/* * */:
      case 0x2B/* + */:
      case 0x2C/* , */:
      case 0x2D/* - */:
      case 0x2E/* . */:
      case 0x2F/* / */:
      case 0x3A/* : */:
      case 0x3B/* ; */:
      case 0x3C/* < */:
      case 0x3D/* = */:
      case 0x3E/* > */:
      case 0x3F/* ? */:
      case 0x40/* @ */:
      case 0x5B/* [ */:
      case 0x5C/* \ */:
      case 0x5D/* ] */:
      case 0x5E/* ^ */:
      case 0x5F/* _ */:
      case 0x60/* ` */:
      case 0x7B/* { */:
      case 0x7C/* | */:
      case 0x7D/* } */:
      case 0x7E/* ~ */:
        return true;
      default:
        return false;
    }
  }

  // Hepler to unify [reference labels].
  //
  function normalizeReference(str) {
    // Trim and collapse whitespace
    //
    str = str.trim().replace(/\s+/g, ' ');

    // In node v10 'ẞ'.toLowerCase() === 'Ṿ', which is presumed to be a bug
    // fixed in v12 (couldn't find any details).
    //
    // So treat this one as a special case
    // (remove this when node v10 is no longer supported).
    //
    if ('ẞ'.toLowerCase() === 'Ṿ') {
      str = str.replace(/ẞ/g, 'ß');
    }

    // .toLowerCase().toUpperCase() should get rid of all differences
    // between letter variants.
    //
    // Simple .toLowerCase() doesn't normalize 125 code points correctly,
    // and .toUpperCase doesn't normalize 6 of them (list of exceptions:
    // İ, ϴ, ẞ, Ω, K, Å - those are already uppercased, but have differently
    // uppercased versions).
    //
    // Here's an example showing how it happens. Lets take greek letter omega:
    // uppercase U+0398 (Θ), U+03f4 (ϴ) and lowercase U+03b8 (θ), U+03d1 (ϑ)
    //
    // Unicode entries:
    // 0398;GREEK CAPITAL LETTER THETA;Lu;0;L;;;;;N;;;;03B8;
    // 03B8;GREEK SMALL LETTER THETA;Ll;0;L;;;;;N;;;0398;;0398
    // 03D1;GREEK THETA SYMBOL;Ll;0;L;<compat> 03B8;;;;N;GREEK SMALL LETTER SCRIPT THETA;;0398;;0398
    // 03F4;GREEK CAPITAL THETA SYMBOL;Lu;0;L;<compat> 0398;;;;N;;;;03B8;
    //
    // Case-insensitive comparison should treat all of them as equivalent.
    //
    // But .toLowerCase() doesn't change ϑ (it's already lowercase),
    // and .toUpperCase() doesn't change ϴ (already uppercase).
    //
    // Applying first lower then upper case normalizes any character:
    // '\u0398\u03f4\u03b8\u03d1'.toLowerCase().toUpperCase() === '\u0398\u0398\u0398\u0398'
    //
    // Note: this is equivalent to unicode case folding; unicode normalization
    // is a different step that is not required here.
    //
    // Final result should be uppercased, because it's later stored in an object
    // (this avoid a conflict with Object.prototype members,
    // most notably, `__proto__`)
    //
    return str.toLowerCase().toUpperCase();
  }

  ////////////////////////////////////////////////////////////////////////////////

  // Re-export libraries commonly used in both markdown-it and its plugins,
  // so plugins won't have to depend on them explicitly, which reduces their
  // bundled size (e.g. a browser build).
  //
  exports.lib                 = {};
  exports.lib.mdurl           = mdurl;
  exports.lib.ucmicro         = uc_micro;

  exports.assign              = assign;
  exports.isString            = isString;
  exports.has                 = has;
  exports.unescapeMd          = unescapeMd;
  exports.unescapeAll         = unescapeAll;
  exports.isValidEntityCode   = isValidEntityCode;
  exports.fromCodePoint       = fromCodePoint;
  // exports.replaceEntities     = replaceEntities;
  exports.escapeHtml          = escapeHtml;
  exports.arrayReplaceAt      = arrayReplaceAt;
  exports.isSpace             = isSpace;
  exports.isWhiteSpace        = isWhiteSpace;
  exports.isMdAsciiPunct      = isMdAsciiPunct;
  exports.isPunctChar         = isPunctChar;
  exports.escapeRE            = escapeRE;
  exports.normalizeReference  = normalizeReference;
  });

  // Parse link label

  var parse_link_label = function parseLinkLabel(state, start, disableNested) {
    var level, found, marker, prevPos,
        labelEnd = -1,
        max = state.posMax,
        oldPos = state.pos;

    state.pos = start + 1;
    level = 1;

    while (state.pos < max) {
      marker = state.src.charCodeAt(state.pos);
      if (marker === 0x5D /* ] */) {
        level--;
        if (level === 0) {
          found = true;
          break;
        }
      }

      prevPos = state.pos;
      state.md.inline.skipToken(state);
      if (marker === 0x5B /* [ */) {
        if (prevPos === state.pos - 1) {
          // increase level if we find text `[`, which is not a part of any token
          level++;
        } else if (disableNested) {
          state.pos = oldPos;
          return -1;
        }
      }
    }

    if (found) {
      labelEnd = state.pos;
    }

    // restore old state
    state.pos = oldPos;

    return labelEnd;
  };

  var unescapeAll = utils.unescapeAll;


  var parse_link_destination = function parseLinkDestination(str, pos, max) {
    var code, level,
        lines = 0,
        start = pos,
        result = {
          ok: false,
          pos: 0,
          lines: 0,
          str: ''
        };

    if (str.charCodeAt(pos) === 0x3C /* < */) {
      pos++;
      while (pos < max) {
        code = str.charCodeAt(pos);
        if (code === 0x0A /* \n */) { return result; }
        if (code === 0x3E /* > */) {
          result.pos = pos + 1;
          result.str = unescapeAll(str.slice(start + 1, pos));
          result.ok = true;
          return result;
        }
        if (code === 0x5C /* \ */ && pos + 1 < max) {
          pos += 2;
          continue;
        }

        pos++;
      }

      // no closing '>'
      return result;
    }

    // this should be ... } else { ... branch

    level = 0;
    while (pos < max) {
      code = str.charCodeAt(pos);

      if (code === 0x20) { break; }

      // ascii control characters
      if (code < 0x20 || code === 0x7F) { break; }

      if (code === 0x5C /* \ */ && pos + 1 < max) {
        pos += 2;
        continue;
      }

      if (code === 0x28 /* ( */) {
        level++;
      }

      if (code === 0x29 /* ) */) {
        if (level === 0) { break; }
        level--;
      }

      pos++;
    }

    if (start === pos) { return result; }
    if (level !== 0) { return result; }

    result.str = unescapeAll(str.slice(start, pos));
    result.lines = lines;
    result.pos = pos;
    result.ok = true;
    return result;
  };

  var unescapeAll$1 = utils.unescapeAll;


  var parse_link_title = function parseLinkTitle(str, pos, max) {
    var code,
        marker,
        lines = 0,
        start = pos,
        result = {
          ok: false,
          pos: 0,
          lines: 0,
          str: ''
        };

    if (pos >= max) { return result; }

    marker = str.charCodeAt(pos);

    if (marker !== 0x22 /* " */ && marker !== 0x27 /* ' */ && marker !== 0x28 /* ( */) { return result; }

    pos++;

    // if opening marker is "(", switch it to closing marker ")"
    if (marker === 0x28) { marker = 0x29; }

    while (pos < max) {
      code = str.charCodeAt(pos);
      if (code === marker) {
        result.pos = pos + 1;
        result.lines = lines;
        result.str = unescapeAll$1(str.slice(start + 1, pos));
        result.ok = true;
        return result;
      } else if (code === 0x0A) {
        lines++;
      } else if (code === 0x5C /* \ */ && pos + 1 < max) {
        pos++;
        if (str.charCodeAt(pos) === 0x0A) {
          lines++;
        }
      }

      pos++;
    }

    return result;
  };

  var parseLinkLabel       = parse_link_label;
  var parseLinkDestination = parse_link_destination;
  var parseLinkTitle       = parse_link_title;

  var helpers = {
  	parseLinkLabel: parseLinkLabel,
  	parseLinkDestination: parseLinkDestination,
  	parseLinkTitle: parseLinkTitle
  };

  var assign          = utils.assign;
  var unescapeAll$2     = utils.unescapeAll;
  var escapeHtml      = utils.escapeHtml;


  ////////////////////////////////////////////////////////////////////////////////

  var default_rules = {};


  default_rules.code_inline = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    return  '<code' + slf.renderAttrs(token) + '>' +
            escapeHtml(tokens[idx].content) +
            '</code>';
  };


  default_rules.code_block = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    return  '<pre' + slf.renderAttrs(token) + '><code>' +
            escapeHtml(tokens[idx].content) +
            '</code></pre>\n';
  };


  default_rules.fence = function (tokens, idx, options, env, slf) {
    var token = tokens[idx],
        info = token.info ? unescapeAll$2(token.info).trim() : '',
        langName = '',
        langAttrs = '',
        highlighted, i, arr, tmpAttrs, tmpToken;

    if (info) {
      arr = info.split(/(\s+)/g);
      langName = arr[0];
      langAttrs = arr.slice(2).join('');
    }

    if (options.highlight) {
      highlighted = options.highlight(token.content, langName, langAttrs) || escapeHtml(token.content);
    } else {
      highlighted = escapeHtml(token.content);
    }

    if (highlighted.indexOf('<pre') === 0) {
      return highlighted + '\n';
    }

    // If language exists, inject class gently, without modifying original token.
    // May be, one day we will add .clone() for token and simplify this part, but
    // now we prefer to keep things local.
    if (info) {
      i        = token.attrIndex('class');
      tmpAttrs = token.attrs ? token.attrs.slice() : [];

      if (i < 0) {
        tmpAttrs.push([ 'class', options.langPrefix + langName ]);
      } else {
        tmpAttrs[i][1] += ' ' + options.langPrefix + langName;
      }

      // Fake token just to render attributes
      tmpToken = {
        attrs: tmpAttrs
      };

      return  '<pre><code' + slf.renderAttrs(tmpToken) + '>'
            + highlighted
            + '</code></pre>\n';
    }


    return  '<pre><code' + slf.renderAttrs(token) + '>'
          + highlighted
          + '</code></pre>\n';
  };


  default_rules.image = function (tokens, idx, options, env, slf) {
    var token = tokens[idx];

    // "alt" attr MUST be set, even if empty. Because it's mandatory and
    // should be placed on proper position for tests.
    //
    // Replace content with actual value

    token.attrs[token.attrIndex('alt')][1] =
      slf.renderInlineAsText(token.children, options, env);

    return slf.renderToken(tokens, idx, options);
  };


  default_rules.hardbreak = function (tokens, idx, options /*, env */) {
    return options.xhtmlOut ? '<br />\n' : '<br>\n';
  };
  default_rules.softbreak = function (tokens, idx, options /*, env */) {
    return options.breaks ? (options.xhtmlOut ? '<br />\n' : '<br>\n') : '\n';
  };


  default_rules.text = function (tokens, idx /*, options, env */) {
    return escapeHtml(tokens[idx].content);
  };


  default_rules.html_block = function (tokens, idx /*, options, env */) {
    return tokens[idx].content;
  };
  default_rules.html_inline = function (tokens, idx /*, options, env */) {
    return tokens[idx].content;
  };


  /**
   * new Renderer()
   *
   * Creates new [[Renderer]] instance and fill [[Renderer#rules]] with defaults.
   **/
  function Renderer() {

    /**
     * Renderer#rules -> Object
     *
     * Contains render rules for tokens. Can be updated and extended.
     *
     * ##### Example
     *
     * ```javascript
     * var md = require('markdown-it')();
     *
     * md.renderer.rules.strong_open  = function () { return '<b>'; };
     * md.renderer.rules.strong_close = function () { return '</b>'; };
     *
     * var result = md.renderInline(...);
     * ```
     *
     * Each rule is called as independent static function with fixed signature:
     *
     * ```javascript
     * function my_token_render(tokens, idx, options, env, renderer) {
     *   // ...
     *   return renderedHTML;
     * }
     * ```
     *
     * See [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js)
     * for more details and examples.
     **/
    this.rules = assign({}, default_rules);
  }


  /**
   * Renderer.renderAttrs(token) -> String
   *
   * Render token attributes to string.
   **/
  Renderer.prototype.renderAttrs = function renderAttrs(token) {
    var i, l, result;

    if (!token.attrs) { return ''; }

    result = '';

    for (i = 0, l = token.attrs.length; i < l; i++) {
      result += ' ' + escapeHtml(token.attrs[i][0]) + '="' + escapeHtml(token.attrs[i][1]) + '"';
    }

    return result;
  };


  /**
   * Renderer.renderToken(tokens, idx, options) -> String
   * - tokens (Array): list of tokens
   * - idx (Numbed): token index to render
   * - options (Object): params of parser instance
   *
   * Default token renderer. Can be overriden by custom function
   * in [[Renderer#rules]].
   **/
  Renderer.prototype.renderToken = function renderToken(tokens, idx, options) {
    var nextToken,
        result = '',
        needLf = false,
        token = tokens[idx];

    // Tight list paragraphs
    if (token.hidden) {
      return '';
    }

    // Insert a newline between hidden paragraph and subsequent opening
    // block-level tag.
    //
    // For example, here we should insert a newline before blockquote:
    //  - a
    //    >
    //
    if (token.block && token.nesting !== -1 && idx && tokens[idx - 1].hidden) {
      result += '\n';
    }

    // Add token name, e.g. `<img`
    result += (token.nesting === -1 ? '</' : '<') + token.tag;

    // Encode attributes, e.g. `<img src="foo"`
    result += this.renderAttrs(token);

    // Add a slash for self-closing tags, e.g. `<img src="foo" /`
    if (token.nesting === 0 && options.xhtmlOut) {
      result += ' /';
    }

    // Check if we need to add a newline after this tag
    if (token.block) {
      needLf = true;

      if (token.nesting === 1) {
        if (idx + 1 < tokens.length) {
          nextToken = tokens[idx + 1];

          if (nextToken.type === 'inline' || nextToken.hidden) {
            // Block-level tag containing an inline tag.
            //
            needLf = false;

          } else if (nextToken.nesting === -1 && nextToken.tag === token.tag) {
            // Opening tag + closing tag of the same type. E.g. `<li></li>`.
            //
            needLf = false;
          }
        }
      }
    }

    result += needLf ? '>\n' : '>';

    return result;
  };


  /**
   * Renderer.renderInline(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * The same as [[Renderer.render]], but for single token of `inline` type.
   **/
  Renderer.prototype.renderInline = function (tokens, options, env) {
    var type,
        result = '',
        rules = this.rules;

    for (var i = 0, len = tokens.length; i < len; i++) {
      type = tokens[i].type;

      if (typeof rules[type] !== 'undefined') {
        result += rules[type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options);
      }
    }

    return result;
  };


  /** internal
   * Renderer.renderInlineAsText(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Special kludge for image `alt` attributes to conform CommonMark spec.
   * Don't try to use it! Spec requires to show `alt` content with stripped markup,
   * instead of simple escaping.
   **/
  Renderer.prototype.renderInlineAsText = function (tokens, options, env) {
    var result = '';

    for (var i = 0, len = tokens.length; i < len; i++) {
      if (tokens[i].type === 'text') {
        result += tokens[i].content;
      } else if (tokens[i].type === 'image') {
        result += this.renderInlineAsText(tokens[i].children, options, env);
      }
    }

    return result;
  };


  /**
   * Renderer.render(tokens, options, env) -> String
   * - tokens (Array): list on block tokens to renter
   * - options (Object): params of parser instance
   * - env (Object): additional data from parsed input (references, for example)
   *
   * Takes token stream and generates HTML. Probably, you will never need to call
   * this method directly.
   **/
  Renderer.prototype.render = function (tokens, options, env) {
    var i, len, type,
        result = '',
        rules = this.rules;

    for (i = 0, len = tokens.length; i < len; i++) {
      type = tokens[i].type;

      if (type === 'inline') {
        result += this.renderInline(tokens[i].children, options, env);
      } else if (typeof rules[type] !== 'undefined') {
        result += rules[tokens[i].type](tokens, i, options, env, this);
      } else {
        result += this.renderToken(tokens, i, options, env);
      }
    }

    return result;
  };

  var renderer = Renderer;

  /**
   * class Ruler
   *
   * Helper class, used by [[MarkdownIt#core]], [[MarkdownIt#block]] and
   * [[MarkdownIt#inline]] to manage sequences of functions (rules):
   *
   * - keep rules in defined order
   * - assign the name to each rule
   * - enable/disable rules
   * - add/replace rules
   * - allow assign rules to additional named chains (in the same)
   * - cacheing lists of active rules
   *
   * You will not need use this class directly until write plugins. For simple
   * rules control use [[MarkdownIt.disable]], [[MarkdownIt.enable]] and
   * [[MarkdownIt.use]].
   **/


  /**
   * new Ruler()
   **/
  function Ruler() {
    // List of added rules. Each element is:
    //
    // {
    //   name: XXX,
    //   enabled: Boolean,
    //   fn: Function(),
    //   alt: [ name2, name3 ]
    // }
    //
    this.__rules__ = [];

    // Cached rule chains.
    //
    // First level - chain name, '' for default.
    // Second level - diginal anchor for fast filtering by charcodes.
    //
    this.__cache__ = null;
  }

  ////////////////////////////////////////////////////////////////////////////////
  // Helper methods, should not be used directly


  // Find rule index by name
  //
  Ruler.prototype.__find__ = function (name) {
    for (var i = 0; i < this.__rules__.length; i++) {
      if (this.__rules__[i].name === name) {
        return i;
      }
    }
    return -1;
  };


  // Build rules lookup cache
  //
  Ruler.prototype.__compile__ = function () {
    var self = this;
    var chains = [ '' ];

    // collect unique names
    self.__rules__.forEach(function (rule) {
      if (!rule.enabled) { return; }

      rule.alt.forEach(function (altName) {
        if (chains.indexOf(altName) < 0) {
          chains.push(altName);
        }
      });
    });

    self.__cache__ = {};

    chains.forEach(function (chain) {
      self.__cache__[chain] = [];
      self.__rules__.forEach(function (rule) {
        if (!rule.enabled) { return; }

        if (chain && rule.alt.indexOf(chain) < 0) { return; }

        self.__cache__[chain].push(rule.fn);
      });
    });
  };


  /**
   * Ruler.at(name, fn [, options])
   * - name (String): rule name to replace.
   * - fn (Function): new rule function.
   * - options (Object): new rule options (not mandatory).
   *
   * Replace rule by name with new function & options. Throws error if name not
   * found.
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * Replace existing typographer replacement rule with new one:
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.core.ruler.at('replacements', function replace(state) {
   *   //...
   * });
   * ```
   **/
  Ruler.prototype.at = function (name, fn, options) {
    var index = this.__find__(name);
    var opt = options || {};

    if (index === -1) { throw new Error('Parser rule not found: ' + name); }

    this.__rules__[index].fn = fn;
    this.__rules__[index].alt = opt.alt || [];
    this.__cache__ = null;
  };


  /**
   * Ruler.before(beforeName, ruleName, fn [, options])
   * - beforeName (String): new rule will be added before this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain before one with given name. See also
   * [[Ruler.after]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.block.ruler.before('paragraph', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  Ruler.prototype.before = function (beforeName, ruleName, fn, options) {
    var index = this.__find__(beforeName);
    var opt = options || {};

    if (index === -1) { throw new Error('Parser rule not found: ' + beforeName); }

    this.__rules__.splice(index, 0, {
      name: ruleName,
      enabled: true,
      fn: fn,
      alt: opt.alt || []
    });

    this.__cache__ = null;
  };


  /**
   * Ruler.after(afterName, ruleName, fn [, options])
   * - afterName (String): new rule will be added after this one.
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Add new rule to chain after one with given name. See also
   * [[Ruler.before]], [[Ruler.push]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.inline.ruler.after('text', 'my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  Ruler.prototype.after = function (afterName, ruleName, fn, options) {
    var index = this.__find__(afterName);
    var opt = options || {};

    if (index === -1) { throw new Error('Parser rule not found: ' + afterName); }

    this.__rules__.splice(index + 1, 0, {
      name: ruleName,
      enabled: true,
      fn: fn,
      alt: opt.alt || []
    });

    this.__cache__ = null;
  };

  /**
   * Ruler.push(ruleName, fn [, options])
   * - ruleName (String): name of added rule.
   * - fn (Function): rule function.
   * - options (Object): rule options (not mandatory).
   *
   * Push new rule to the end of chain. See also
   * [[Ruler.before]], [[Ruler.after]].
   *
   * ##### Options:
   *
   * - __alt__ - array with names of "alternate" chains.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')();
   *
   * md.core.ruler.push('my_rule', function replace(state) {
   *   //...
   * });
   * ```
   **/
  Ruler.prototype.push = function (ruleName, fn, options) {
    var opt = options || {};

    this.__rules__.push({
      name: ruleName,
      enabled: true,
      fn: fn,
      alt: opt.alt || []
    });

    this.__cache__ = null;
  };


  /**
   * Ruler.enable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to enable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.disable]], [[Ruler.enableOnly]].
   **/
  Ruler.prototype.enable = function (list, ignoreInvalid) {
    if (!Array.isArray(list)) { list = [ list ]; }

    var result = [];

    // Search by name and enable
    list.forEach(function (name) {
      var idx = this.__find__(name);

      if (idx < 0) {
        if (ignoreInvalid) { return; }
        throw new Error('Rules manager: invalid rule name ' + name);
      }
      this.__rules__[idx].enabled = true;
      result.push(name);
    }, this);

    this.__cache__ = null;
    return result;
  };


  /**
   * Ruler.enableOnly(list [, ignoreInvalid])
   * - list (String|Array): list of rule names to enable (whitelist).
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable rules with given names, and disable everything else. If any rule name
   * not found - throw Error. Errors can be disabled by second param.
   *
   * See also [[Ruler.disable]], [[Ruler.enable]].
   **/
  Ruler.prototype.enableOnly = function (list, ignoreInvalid) {
    if (!Array.isArray(list)) { list = [ list ]; }

    this.__rules__.forEach(function (rule) { rule.enabled = false; });

    this.enable(list, ignoreInvalid);
  };


  /**
   * Ruler.disable(list [, ignoreInvalid]) -> Array
   * - list (String|Array): list of rule names to disable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Disable rules with given names. If any rule name not found - throw Error.
   * Errors can be disabled by second param.
   *
   * Returns list of found rule names (if no exception happened).
   *
   * See also [[Ruler.enable]], [[Ruler.enableOnly]].
   **/
  Ruler.prototype.disable = function (list, ignoreInvalid) {
    if (!Array.isArray(list)) { list = [ list ]; }

    var result = [];

    // Search by name and disable
    list.forEach(function (name) {
      var idx = this.__find__(name);

      if (idx < 0) {
        if (ignoreInvalid) { return; }
        throw new Error('Rules manager: invalid rule name ' + name);
      }
      this.__rules__[idx].enabled = false;
      result.push(name);
    }, this);

    this.__cache__ = null;
    return result;
  };


  /**
   * Ruler.getRules(chainName) -> Array
   *
   * Return array of active functions (rules) for given chain name. It analyzes
   * rules configuration, compiles caches if not exists and returns result.
   *
   * Default chain name is `''` (empty string). It can't be skipped. That's
   * done intentionally, to keep signature monomorphic for high speed.
   **/
  Ruler.prototype.getRules = function (chainName) {
    if (this.__cache__ === null) {
      this.__compile__();
    }

    // Chain can be empty, if rules disabled. But we still have to return Array.
    return this.__cache__[chainName] || [];
  };

  var ruler = Ruler;

  // Normalize input string


  // https://spec.commonmark.org/0.29/#line-ending
  var NEWLINES_RE  = /\r\n?|\n/g;
  var NULL_RE      = /\0/g;


  var normalize$1 = function normalize(state) {
    var str;

    // Normalize newlines
    str = state.src.replace(NEWLINES_RE, '\n');

    // Replace NULL characters
    str = str.replace(NULL_RE, '\uFFFD');

    state.src = str;
  };

  var block$1 = function block(state) {
    var token;

    if (state.inlineMode) {
      token          = new state.Token('inline', '', 0);
      token.content  = state.src;
      token.map      = [ 0, 1 ];
      token.children = [];
      state.tokens.push(token);
    } else {
      state.md.block.parse(state.src, state.md, state.env, state.tokens);
    }
  };

  var inline = function inline(state) {
    var tokens = state.tokens, tok, i, l;

    // Parse inlines
    for (i = 0, l = tokens.length; i < l; i++) {
      tok = tokens[i];
      if (tok.type === 'inline') {
        state.md.inline.parse(tok.content, state.md, state.env, tok.children);
      }
    }
  };

  var arrayReplaceAt = utils.arrayReplaceAt;


  function isLinkOpen(str) {
    return /^<a[>\s]/i.test(str);
  }
  function isLinkClose(str) {
    return /^<\/a\s*>/i.test(str);
  }


  var linkify = function linkify(state) {
    var i, j, l, tokens, token, currentToken, nodes, ln, text, pos, lastPos,
        level, htmlLinkLevel, url, fullUrl, urlText,
        blockTokens = state.tokens,
        links;

    if (!state.md.options.linkify) { return; }

    for (j = 0, l = blockTokens.length; j < l; j++) {
      if (blockTokens[j].type !== 'inline' ||
          !state.md.linkify.pretest(blockTokens[j].content)) {
        continue;
      }

      tokens = blockTokens[j].children;

      htmlLinkLevel = 0;

      // We scan from the end, to keep position when new tags added.
      // Use reversed logic in links start/end match
      for (i = tokens.length - 1; i >= 0; i--) {
        currentToken = tokens[i];

        // Skip content of markdown links
        if (currentToken.type === 'link_close') {
          i--;
          while (tokens[i].level !== currentToken.level && tokens[i].type !== 'link_open') {
            i--;
          }
          continue;
        }

        // Skip content of html tag links
        if (currentToken.type === 'html_inline') {
          if (isLinkOpen(currentToken.content) && htmlLinkLevel > 0) {
            htmlLinkLevel--;
          }
          if (isLinkClose(currentToken.content)) {
            htmlLinkLevel++;
          }
        }
        if (htmlLinkLevel > 0) { continue; }

        if (currentToken.type === 'text' && state.md.linkify.test(currentToken.content)) {

          text = currentToken.content;
          links = state.md.linkify.match(text);

          // Now split string to nodes
          nodes = [];
          level = currentToken.level;
          lastPos = 0;

          for (ln = 0; ln < links.length; ln++) {

            url = links[ln].url;
            fullUrl = state.md.normalizeLink(url);
            if (!state.md.validateLink(fullUrl)) { continue; }

            urlText = links[ln].text;

            // Linkifier might send raw hostnames like "example.com", where url
            // starts with domain name. So we prepend http:// in those cases,
            // and remove it afterwards.
            //
            if (!links[ln].schema) {
              urlText = state.md.normalizeLinkText('http://' + urlText).replace(/^http:\/\//, '');
            } else if (links[ln].schema === 'mailto:' && !/^mailto:/i.test(urlText)) {
              urlText = state.md.normalizeLinkText('mailto:' + urlText).replace(/^mailto:/, '');
            } else {
              urlText = state.md.normalizeLinkText(urlText);
            }

            pos = links[ln].index;

            if (pos > lastPos) {
              token         = new state.Token('text', '', 0);
              token.content = text.slice(lastPos, pos);
              token.level   = level;
              nodes.push(token);
            }

            token         = new state.Token('link_open', 'a', 1);
            token.attrs   = [ [ 'href', fullUrl ] ];
            token.level   = level++;
            token.markup  = 'linkify';
            token.info    = 'auto';
            nodes.push(token);

            token         = new state.Token('text', '', 0);
            token.content = urlText;
            token.level   = level;
            nodes.push(token);

            token         = new state.Token('link_close', 'a', -1);
            token.level   = --level;
            token.markup  = 'linkify';
            token.info    = 'auto';
            nodes.push(token);

            lastPos = links[ln].lastIndex;
          }
          if (lastPos < text.length) {
            token         = new state.Token('text', '', 0);
            token.content = text.slice(lastPos);
            token.level   = level;
            nodes.push(token);
          }

          // replace current node
          blockTokens[j].children = tokens = arrayReplaceAt(tokens, i, nodes);
        }
      }
    }
  };

  // Simple typographic replacements

  // TODO:
  // - fractionals 1/2, 1/4, 3/4 -> ½, ¼, ¾
  // - miltiplication 2 x 4 -> 2 × 4

  var RARE_RE = /\+-|\.\.|\?\?\?\?|!!!!|,,|--/;

  // Workaround for phantomjs - need regex without /g flag,
  // or root check will fail every second time
  var SCOPED_ABBR_TEST_RE = /\((c|tm|r|p)\)/i;

  var SCOPED_ABBR_RE = /\((c|tm|r|p)\)/ig;
  var SCOPED_ABBR = {
    c: '©',
    r: '®',
    p: '§',
    tm: '™'
  };

  function replaceFn(match, name) {
    return SCOPED_ABBR[name.toLowerCase()];
  }

  function replace_scoped(inlineTokens) {
    var i, token, inside_autolink = 0;

    for (i = inlineTokens.length - 1; i >= 0; i--) {
      token = inlineTokens[i];

      if (token.type === 'text' && !inside_autolink) {
        token.content = token.content.replace(SCOPED_ABBR_RE, replaceFn);
      }

      if (token.type === 'link_open' && token.info === 'auto') {
        inside_autolink--;
      }

      if (token.type === 'link_close' && token.info === 'auto') {
        inside_autolink++;
      }
    }
  }

  function replace_rare(inlineTokens) {
    var i, token, inside_autolink = 0;

    for (i = inlineTokens.length - 1; i >= 0; i--) {
      token = inlineTokens[i];

      if (token.type === 'text' && !inside_autolink) {
        if (RARE_RE.test(token.content)) {
          token.content = token.content
            .replace(/\+-/g, '±')
            // .., ..., ....... -> …
            // but ?..... & !..... -> ?.. & !..
            .replace(/\.{2,}/g, '…').replace(/([?!])…/g, '$1..')
            .replace(/([?!]){4,}/g, '$1$1$1').replace(/,{2,}/g, ',')
            // em-dash
            .replace(/(^|[^-])---(?=[^-]|$)/mg, '$1\u2014')
            // en-dash
            .replace(/(^|\s)--(?=\s|$)/mg, '$1\u2013')
            .replace(/(^|[^-\s])--(?=[^-\s]|$)/mg, '$1\u2013');
        }
      }

      if (token.type === 'link_open' && token.info === 'auto') {
        inside_autolink--;
      }

      if (token.type === 'link_close' && token.info === 'auto') {
        inside_autolink++;
      }
    }
  }


  var replacements = function replace(state) {
    var blkIdx;

    if (!state.md.options.typographer) { return; }

    for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

      if (state.tokens[blkIdx].type !== 'inline') { continue; }

      if (SCOPED_ABBR_TEST_RE.test(state.tokens[blkIdx].content)) {
        replace_scoped(state.tokens[blkIdx].children);
      }

      if (RARE_RE.test(state.tokens[blkIdx].content)) {
        replace_rare(state.tokens[blkIdx].children);
      }

    }
  };

  var isWhiteSpace   = utils.isWhiteSpace;
  var isPunctChar    = utils.isPunctChar;
  var isMdAsciiPunct = utils.isMdAsciiPunct;

  var QUOTE_TEST_RE = /['"]/;
  var QUOTE_RE = /['"]/g;
  var APOSTROPHE = '\u2019'; /* ’ */


  function replaceAt(str, index, ch) {
    return str.substr(0, index) + ch + str.substr(index + 1);
  }

  function process_inlines(tokens, state) {
    var i, token, text, t, pos, max, thisLevel, item, lastChar, nextChar,
        isLastPunctChar, isNextPunctChar, isLastWhiteSpace, isNextWhiteSpace,
        canOpen, canClose, j, isSingle, stack, openQuote, closeQuote;

    stack = [];

    for (i = 0; i < tokens.length; i++) {
      token = tokens[i];

      thisLevel = tokens[i].level;

      for (j = stack.length - 1; j >= 0; j--) {
        if (stack[j].level <= thisLevel) { break; }
      }
      stack.length = j + 1;

      if (token.type !== 'text') { continue; }

      text = token.content;
      pos = 0;
      max = text.length;

      /*eslint no-labels:0,block-scoped-var:0*/
      OUTER:
      while (pos < max) {
        QUOTE_RE.lastIndex = pos;
        t = QUOTE_RE.exec(text);
        if (!t) { break; }

        canOpen = canClose = true;
        pos = t.index + 1;
        isSingle = (t[0] === "'");

        // Find previous character,
        // default to space if it's the beginning of the line
        //
        lastChar = 0x20;

        if (t.index - 1 >= 0) {
          lastChar = text.charCodeAt(t.index - 1);
        } else {
          for (j = i - 1; j >= 0; j--) {
            if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // lastChar defaults to 0x20
            if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

            lastChar = tokens[j].content.charCodeAt(tokens[j].content.length - 1);
            break;
          }
        }

        // Find next character,
        // default to space if it's the end of the line
        //
        nextChar = 0x20;

        if (pos < max) {
          nextChar = text.charCodeAt(pos);
        } else {
          for (j = i + 1; j < tokens.length; j++) {
            if (tokens[j].type === 'softbreak' || tokens[j].type === 'hardbreak') break; // nextChar defaults to 0x20
            if (!tokens[j].content) continue; // should skip all tokens except 'text', 'html_inline' or 'code_inline'

            nextChar = tokens[j].content.charCodeAt(0);
            break;
          }
        }

        isLastPunctChar = isMdAsciiPunct(lastChar) || isPunctChar(String.fromCharCode(lastChar));
        isNextPunctChar = isMdAsciiPunct(nextChar) || isPunctChar(String.fromCharCode(nextChar));

        isLastWhiteSpace = isWhiteSpace(lastChar);
        isNextWhiteSpace = isWhiteSpace(nextChar);

        if (isNextWhiteSpace) {
          canOpen = false;
        } else if (isNextPunctChar) {
          if (!(isLastWhiteSpace || isLastPunctChar)) {
            canOpen = false;
          }
        }

        if (isLastWhiteSpace) {
          canClose = false;
        } else if (isLastPunctChar) {
          if (!(isNextWhiteSpace || isNextPunctChar)) {
            canClose = false;
          }
        }

        if (nextChar === 0x22 /* " */ && t[0] === '"') {
          if (lastChar >= 0x30 /* 0 */ && lastChar <= 0x39 /* 9 */) {
            // special case: 1"" - count first quote as an inch
            canClose = canOpen = false;
          }
        }

        if (canOpen && canClose) {
          // Replace quotes in the middle of punctuation sequence, but not
          // in the middle of the words, i.e.:
          //
          // 1. foo " bar " baz - not replaced
          // 2. foo-"-bar-"-baz - replaced
          // 3. foo"bar"baz     - not replaced
          //
          canOpen = isLastPunctChar;
          canClose = isNextPunctChar;
        }

        if (!canOpen && !canClose) {
          // middle of word
          if (isSingle) {
            token.content = replaceAt(token.content, t.index, APOSTROPHE);
          }
          continue;
        }

        if (canClose) {
          // this could be a closing quote, rewind the stack to get a match
          for (j = stack.length - 1; j >= 0; j--) {
            item = stack[j];
            if (stack[j].level < thisLevel) { break; }
            if (item.single === isSingle && stack[j].level === thisLevel) {
              item = stack[j];

              if (isSingle) {
                openQuote = state.md.options.quotes[2];
                closeQuote = state.md.options.quotes[3];
              } else {
                openQuote = state.md.options.quotes[0];
                closeQuote = state.md.options.quotes[1];
              }

              // replace token.content *before* tokens[item.token].content,
              // because, if they are pointing at the same token, replaceAt
              // could mess up indices when quote length != 1
              token.content = replaceAt(token.content, t.index, closeQuote);
              tokens[item.token].content = replaceAt(
                tokens[item.token].content, item.pos, openQuote);

              pos += closeQuote.length - 1;
              if (item.token === i) { pos += openQuote.length - 1; }

              text = token.content;
              max = text.length;

              stack.length = j;
              continue OUTER;
            }
          }
        }

        if (canOpen) {
          stack.push({
            token: i,
            pos: t.index,
            single: isSingle,
            level: thisLevel
          });
        } else if (canClose && isSingle) {
          token.content = replaceAt(token.content, t.index, APOSTROPHE);
        }
      }
    }
  }


  var smartquotes = function smartquotes(state) {
    /*eslint max-depth:0*/
    var blkIdx;

    if (!state.md.options.typographer) { return; }

    for (blkIdx = state.tokens.length - 1; blkIdx >= 0; blkIdx--) {

      if (state.tokens[blkIdx].type !== 'inline' ||
          !QUOTE_TEST_RE.test(state.tokens[blkIdx].content)) {
        continue;
      }

      process_inlines(state.tokens[blkIdx].children, state);
    }
  };

  // Token class


  /**
   * class Token
   **/

  /**
   * new Token(type, tag, nesting)
   *
   * Create new token and fill passed properties.
   **/
  function Token(type, tag, nesting) {
    /**
     * Token#type -> String
     *
     * Type of the token (string, e.g. "paragraph_open")
     **/
    this.type     = type;

    /**
     * Token#tag -> String
     *
     * html tag name, e.g. "p"
     **/
    this.tag      = tag;

    /**
     * Token#attrs -> Array
     *
     * Html attributes. Format: `[ [ name1, value1 ], [ name2, value2 ] ]`
     **/
    this.attrs    = null;

    /**
     * Token#map -> Array
     *
     * Source map info. Format: `[ line_begin, line_end ]`
     **/
    this.map      = null;

    /**
     * Token#nesting -> Number
     *
     * Level change (number in {-1, 0, 1} set), where:
     *
     * -  `1` means the tag is opening
     * -  `0` means the tag is self-closing
     * - `-1` means the tag is closing
     **/
    this.nesting  = nesting;

    /**
     * Token#level -> Number
     *
     * nesting level, the same as `state.level`
     **/
    this.level    = 0;

    /**
     * Token#children -> Array
     *
     * An array of child nodes (inline and img tokens)
     **/
    this.children = null;

    /**
     * Token#content -> String
     *
     * In a case of self-closing tag (code, html, fence, etc.),
     * it has contents of this tag.
     **/
    this.content  = '';

    /**
     * Token#markup -> String
     *
     * '*' or '_' for emphasis, fence string for fence, etc.
     **/
    this.markup   = '';

    /**
     * Token#info -> String
     *
     * fence infostring
     **/
    this.info     = '';

    /**
     * Token#meta -> Object
     *
     * A place for plugins to store an arbitrary data
     **/
    this.meta     = null;

    /**
     * Token#block -> Boolean
     *
     * True for block-level tokens, false for inline tokens.
     * Used in renderer to calculate line breaks
     **/
    this.block    = false;

    /**
     * Token#hidden -> Boolean
     *
     * If it's true, ignore this element when rendering. Used for tight lists
     * to hide paragraphs.
     **/
    this.hidden   = false;
  }


  /**
   * Token.attrIndex(name) -> Number
   *
   * Search attribute index by name.
   **/
  Token.prototype.attrIndex = function attrIndex(name) {
    var attrs, i, len;

    if (!this.attrs) { return -1; }

    attrs = this.attrs;

    for (i = 0, len = attrs.length; i < len; i++) {
      if (attrs[i][0] === name) { return i; }
    }
    return -1;
  };


  /**
   * Token.attrPush(attrData)
   *
   * Add `[ name, value ]` attribute to list. Init attrs if necessary
   **/
  Token.prototype.attrPush = function attrPush(attrData) {
    if (this.attrs) {
      this.attrs.push(attrData);
    } else {
      this.attrs = [ attrData ];
    }
  };


  /**
   * Token.attrSet(name, value)
   *
   * Set `name` attribute to `value`. Override old value if exists.
   **/
  Token.prototype.attrSet = function attrSet(name, value) {
    var idx = this.attrIndex(name),
        attrData = [ name, value ];

    if (idx < 0) {
      this.attrPush(attrData);
    } else {
      this.attrs[idx] = attrData;
    }
  };


  /**
   * Token.attrGet(name)
   *
   * Get the value of attribute `name`, or null if it does not exist.
   **/
  Token.prototype.attrGet = function attrGet(name) {
    var idx = this.attrIndex(name), value = null;
    if (idx >= 0) {
      value = this.attrs[idx][1];
    }
    return value;
  };


  /**
   * Token.attrJoin(name, value)
   *
   * Join value to existing attribute via space. Or create new attribute if not
   * exists. Useful to operate with token classes.
   **/
  Token.prototype.attrJoin = function attrJoin(name, value) {
    var idx = this.attrIndex(name);

    if (idx < 0) {
      this.attrPush([ name, value ]);
    } else {
      this.attrs[idx][1] = this.attrs[idx][1] + ' ' + value;
    }
  };


  var token = Token;

  function StateCore(src, md, env) {
    this.src = src;
    this.env = env;
    this.tokens = [];
    this.inlineMode = false;
    this.md = md; // link to parser instance
  }

  // re-export Token class to use in core rules
  StateCore.prototype.Token = token;


  var state_core = StateCore;

  var _rules = [
    [ 'normalize',      normalize$1      ],
    [ 'block',          block$1          ],
    [ 'inline',         inline         ],
    [ 'linkify',        linkify        ],
    [ 'replacements',   replacements   ],
    [ 'smartquotes',    smartquotes    ]
  ];


  /**
   * new Core()
   **/
  function Core() {
    /**
     * Core#ruler -> Ruler
     *
     * [[Ruler]] instance. Keep configuration of core rules.
     **/
    this.ruler = new ruler();

    for (var i = 0; i < _rules.length; i++) {
      this.ruler.push(_rules[i][0], _rules[i][1]);
    }
  }


  /**
   * Core.process(state)
   *
   * Executes core chain rules.
   **/
  Core.prototype.process = function (state) {
    var i, l, rules;

    rules = this.ruler.getRules('');

    for (i = 0, l = rules.length; i < l; i++) {
      rules[i](state);
    }
  };

  Core.prototype.State = state_core;


  var parser_core = Core;

  var isSpace = utils.isSpace;


  function getLine(state, line) {
    var pos = state.bMarks[line] + state.tShift[line],
        max = state.eMarks[line];

    return state.src.substr(pos, max - pos);
  }

  function escapedSplit(str) {
    var result = [],
        pos = 0,
        max = str.length,
        ch,
        isEscaped = false,
        lastPos = 0,
        current = '';

    ch  = str.charCodeAt(pos);

    while (pos < max) {
      if (ch === 0x7c/* | */) {
        if (!isEscaped) {
          // pipe separating cells, '|'
          result.push(current + str.substring(lastPos, pos));
          current = '';
          lastPos = pos + 1;
        } else {
          // escaped pipe, '\|'
          current += str.substring(lastPos, pos - 1);
          lastPos = pos;
        }
      }

      isEscaped = (ch === 0x5c/* \ */);
      pos++;

      ch = str.charCodeAt(pos);
    }

    result.push(current + str.substring(lastPos));

    return result;
  }


  var table = function table(state, startLine, endLine, silent) {
    var ch, lineText, pos, i, l, nextLine, columns, columnCount, token,
        aligns, t, tableLines, tbodyLines, oldParentType, terminate,
        terminatorRules;

    // should have at least two lines
    if (startLine + 2 > endLine) { return false; }

    nextLine = startLine + 1;

    if (state.sCount[nextLine] < state.blkIndent) { return false; }

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[nextLine] - state.blkIndent >= 4) { return false; }

    // first character of the second line should be '|', '-', ':',
    // and no other characters are allowed but spaces;
    // basically, this is the equivalent of /^[-:|][-:|\s]*$/ regexp

    pos = state.bMarks[nextLine] + state.tShift[nextLine];
    if (pos >= state.eMarks[nextLine]) { return false; }

    ch = state.src.charCodeAt(pos++);
    if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */) { return false; }

    while (pos < state.eMarks[nextLine]) {
      ch = state.src.charCodeAt(pos);

      if (ch !== 0x7C/* | */ && ch !== 0x2D/* - */ && ch !== 0x3A/* : */ && !isSpace(ch)) { return false; }

      pos++;
    }

    lineText = getLine(state, startLine + 1);

    columns = lineText.split('|');
    aligns = [];
    for (i = 0; i < columns.length; i++) {
      t = columns[i].trim();
      if (!t) {
        // allow empty columns before and after table, but not in between columns;
        // e.g. allow ` |---| `, disallow ` ---||--- `
        if (i === 0 || i === columns.length - 1) {
          continue;
        } else {
          return false;
        }
      }

      if (!/^:?-+:?$/.test(t)) { return false; }
      if (t.charCodeAt(t.length - 1) === 0x3A/* : */) {
        aligns.push(t.charCodeAt(0) === 0x3A/* : */ ? 'center' : 'right');
      } else if (t.charCodeAt(0) === 0x3A/* : */) {
        aligns.push('left');
      } else {
        aligns.push('');
      }
    }

    lineText = getLine(state, startLine).trim();
    if (lineText.indexOf('|') === -1) { return false; }
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }
    columns = escapedSplit(lineText);
    if (columns.length && columns[0] === '') columns.shift();
    if (columns.length && columns[columns.length - 1] === '') columns.pop();

    // header row will define an amount of columns in the entire table,
    // and align row should be exactly the same (the rest of the rows can differ)
    columnCount = columns.length;
    if (columnCount === 0 || columnCount !== aligns.length) { return false; }

    if (silent) { return true; }

    oldParentType = state.parentType;
    state.parentType = 'table';

    // use 'blockquote' lists for termination because it's
    // the most similar to tables
    terminatorRules = state.md.block.ruler.getRules('blockquote');

    token     = state.push('table_open', 'table', 1);
    token.map = tableLines = [ startLine, 0 ];

    token     = state.push('thead_open', 'thead', 1);
    token.map = [ startLine, startLine + 1 ];

    token     = state.push('tr_open', 'tr', 1);
    token.map = [ startLine, startLine + 1 ];

    for (i = 0; i < columns.length; i++) {
      token          = state.push('th_open', 'th', 1);
      if (aligns[i]) {
        token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
      }

      token          = state.push('inline', '', 0);
      token.content  = columns[i].trim();
      token.children = [];

      token          = state.push('th_close', 'th', -1);
    }

    token     = state.push('tr_close', 'tr', -1);
    token     = state.push('thead_close', 'thead', -1);

    for (nextLine = startLine + 2; nextLine < endLine; nextLine++) {
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }

      if (terminate) { break; }
      lineText = getLine(state, nextLine).trim();
      if (!lineText) { break; }
      if (state.sCount[nextLine] - state.blkIndent >= 4) { break; }
      columns = escapedSplit(lineText);
      if (columns.length && columns[0] === '') columns.shift();
      if (columns.length && columns[columns.length - 1] === '') columns.pop();

      if (nextLine === startLine + 2) {
        token     = state.push('tbody_open', 'tbody', 1);
        token.map = tbodyLines = [ startLine + 2, 0 ];
      }

      token     = state.push('tr_open', 'tr', 1);
      token.map = [ nextLine, nextLine + 1 ];

      for (i = 0; i < columnCount; i++) {
        token          = state.push('td_open', 'td', 1);
        if (aligns[i]) {
          token.attrs  = [ [ 'style', 'text-align:' + aligns[i] ] ];
        }

        token          = state.push('inline', '', 0);
        token.content  = columns[i] ? columns[i].trim() : '';
        token.children = [];

        token          = state.push('td_close', 'td', -1);
      }
      token = state.push('tr_close', 'tr', -1);
    }

    if (tbodyLines) {
      token = state.push('tbody_close', 'tbody', -1);
      tbodyLines[1] = nextLine;
    }

    token = state.push('table_close', 'table', -1);
    tableLines[1] = nextLine;

    state.parentType = oldParentType;
    state.line = nextLine;
    return true;
  };

  // Code block (4 spaces padded)


  var code = function code(state, startLine, endLine/*, silent*/) {
    var nextLine, last, token;

    if (state.sCount[startLine] - state.blkIndent < 4) { return false; }

    last = nextLine = startLine + 1;

    while (nextLine < endLine) {
      if (state.isEmpty(nextLine)) {
        nextLine++;
        continue;
      }

      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        nextLine++;
        last = nextLine;
        continue;
      }
      break;
    }

    state.line = last;

    token         = state.push('code_block', 'code', 0);
    token.content = state.getLines(startLine, last, 4 + state.blkIndent, true);
    token.map     = [ startLine, state.line ];

    return true;
  };

  // fences (``` lang, ~~~ lang)


  var fence = function fence(state, startLine, endLine, silent) {
    var marker, len, params, nextLine, mem, token, markup,
        haveEndMarker = false,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    if (pos + 3 > max) { return false; }

    marker = state.src.charCodeAt(pos);

    if (marker !== 0x7E/* ~ */ && marker !== 0x60 /* ` */) {
      return false;
    }

    // scan marker length
    mem = pos;
    pos = state.skipChars(pos, marker);

    len = pos - mem;

    if (len < 3) { return false; }

    markup = state.src.slice(mem, pos);
    params = state.src.slice(pos, max);

    if (marker === 0x60 /* ` */) {
      if (params.indexOf(String.fromCharCode(marker)) >= 0) {
        return false;
      }
    }

    // Since start is found, we can report success here in validation mode
    if (silent) { return true; }

    // search end of block
    nextLine = startLine;

    for (;;) {
      nextLine++;
      if (nextLine >= endLine) {
        // unclosed block should be autoclosed by end of document.
        // also block seems to be autoclosed by end of parent
        break;
      }

      pos = mem = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos < max && state.sCount[nextLine] < state.blkIndent) {
        // non-empty line with negative indent should stop the list:
        // - ```
        //  test
        break;
      }

      if (state.src.charCodeAt(pos) !== marker) { continue; }

      if (state.sCount[nextLine] - state.blkIndent >= 4) {
        // closing fence should be indented less than 4 spaces
        continue;
      }

      pos = state.skipChars(pos, marker);

      // closing code fence must be at least as long as the opening one
      if (pos - mem < len) { continue; }

      // make sure tail has spaces only
      pos = state.skipSpaces(pos);

      if (pos < max) { continue; }

      haveEndMarker = true;
      // found!
      break;
    }

    // If a fence has heading spaces, they should be removed from its inner block
    len = state.sCount[startLine];

    state.line = nextLine + (haveEndMarker ? 1 : 0);

    token         = state.push('fence', 'code', 0);
    token.info    = params;
    token.content = state.getLines(startLine + 1, nextLine, len, true);
    token.markup  = markup;
    token.map     = [ startLine, state.line ];

    return true;
  };

  var isSpace$1 = utils.isSpace;


  var blockquote = function blockquote(state, startLine, endLine, silent) {
    var adjustTab,
        ch,
        i,
        initial,
        l,
        lastLineEmpty,
        lines,
        nextLine,
        offset,
        oldBMarks,
        oldBSCount,
        oldIndent,
        oldParentType,
        oldSCount,
        oldTShift,
        spaceAfterMarker,
        terminate,
        terminatorRules,
        token,
        isOutdented,
        oldLineMax = state.lineMax,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    // check the block quote marker
    if (state.src.charCodeAt(pos++) !== 0x3E/* > */) { return false; }

    // we know that it's going to be a valid blockquote,
    // so no point trying to find the end of it in silent mode
    if (silent) { return true; }

    // set offset past spaces and ">"
    initial = offset = state.sCount[startLine] + 1;

    // skip one optional space after '>'
    if (state.src.charCodeAt(pos) === 0x20 /* space */) {
      // ' >   test '
      //     ^ -- position start of line here:
      pos++;
      initial++;
      offset++;
      adjustTab = false;
      spaceAfterMarker = true;
    } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
      spaceAfterMarker = true;

      if ((state.bsCount[startLine] + offset) % 4 === 3) {
        // '  >\t  test '
        //       ^ -- position start of line here (tab has width===1)
        pos++;
        initial++;
        offset++;
        adjustTab = false;
      } else {
        // ' >\t  test '
        //    ^ -- position start of line here + shift bsCount slightly
        //         to make extra space appear
        adjustTab = true;
      }
    } else {
      spaceAfterMarker = false;
    }

    oldBMarks = [ state.bMarks[startLine] ];
    state.bMarks[startLine] = pos;

    while (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (isSpace$1(ch)) {
        if (ch === 0x09) {
          offset += 4 - (offset + state.bsCount[startLine] + (adjustTab ? 1 : 0)) % 4;
        } else {
          offset++;
        }
      } else {
        break;
      }

      pos++;
    }

    oldBSCount = [ state.bsCount[startLine] ];
    state.bsCount[startLine] = state.sCount[startLine] + 1 + (spaceAfterMarker ? 1 : 0);

    lastLineEmpty = pos >= max;

    oldSCount = [ state.sCount[startLine] ];
    state.sCount[startLine] = offset - initial;

    oldTShift = [ state.tShift[startLine] ];
    state.tShift[startLine] = pos - state.bMarks[startLine];

    terminatorRules = state.md.block.ruler.getRules('blockquote');

    oldParentType = state.parentType;
    state.parentType = 'blockquote';

    // Search the end of the block
    //
    // Block ends with either:
    //  1. an empty line outside:
    //     ```
    //     > test
    //
    //     ```
    //  2. an empty line inside:
    //     ```
    //     >
    //     test
    //     ```
    //  3. another tag:
    //     ```
    //     > test
    //      - - -
    //     ```
    for (nextLine = startLine + 1; nextLine < endLine; nextLine++) {
      // check if it's outdented, i.e. it's inside list item and indented
      // less than said list item:
      //
      // ```
      // 1. anything
      //    > current blockquote
      // 2. checking this line
      // ```
      isOutdented = state.sCount[nextLine] < state.blkIndent;

      pos = state.bMarks[nextLine] + state.tShift[nextLine];
      max = state.eMarks[nextLine];

      if (pos >= max) {
        // Case 1: line is not inside the blockquote, and this line is empty.
        break;
      }

      if (state.src.charCodeAt(pos++) === 0x3E/* > */ && !isOutdented) {
        // This line is inside the blockquote.

        // set offset past spaces and ">"
        initial = offset = state.sCount[nextLine] + 1;

        // skip one optional space after '>'
        if (state.src.charCodeAt(pos) === 0x20 /* space */) {
          // ' >   test '
          //     ^ -- position start of line here:
          pos++;
          initial++;
          offset++;
          adjustTab = false;
          spaceAfterMarker = true;
        } else if (state.src.charCodeAt(pos) === 0x09 /* tab */) {
          spaceAfterMarker = true;

          if ((state.bsCount[nextLine] + offset) % 4 === 3) {
            // '  >\t  test '
            //       ^ -- position start of line here (tab has width===1)
            pos++;
            initial++;
            offset++;
            adjustTab = false;
          } else {
            // ' >\t  test '
            //    ^ -- position start of line here + shift bsCount slightly
            //         to make extra space appear
            adjustTab = true;
          }
        } else {
          spaceAfterMarker = false;
        }

        oldBMarks.push(state.bMarks[nextLine]);
        state.bMarks[nextLine] = pos;

        while (pos < max) {
          ch = state.src.charCodeAt(pos);

          if (isSpace$1(ch)) {
            if (ch === 0x09) {
              offset += 4 - (offset + state.bsCount[nextLine] + (adjustTab ? 1 : 0)) % 4;
            } else {
              offset++;
            }
          } else {
            break;
          }

          pos++;
        }

        lastLineEmpty = pos >= max;

        oldBSCount.push(state.bsCount[nextLine]);
        state.bsCount[nextLine] = state.sCount[nextLine] + 1 + (spaceAfterMarker ? 1 : 0);

        oldSCount.push(state.sCount[nextLine]);
        state.sCount[nextLine] = offset - initial;

        oldTShift.push(state.tShift[nextLine]);
        state.tShift[nextLine] = pos - state.bMarks[nextLine];
        continue;
      }

      // Case 2: line is not inside the blockquote, and the last line was empty.
      if (lastLineEmpty) { break; }

      // Case 3: another tag found.
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }

      if (terminate) {
        // Quirk to enforce "hard termination mode" for paragraphs;
        // normally if you call `tokenize(state, startLine, nextLine)`,
        // paragraphs will look below nextLine for paragraph continuation,
        // but if blockquote is terminated by another tag, they shouldn't
        state.lineMax = nextLine;

        if (state.blkIndent !== 0) {
          // state.blkIndent was non-zero, we now set it to zero,
          // so we need to re-calculate all offsets to appear as
          // if indent wasn't changed
          oldBMarks.push(state.bMarks[nextLine]);
          oldBSCount.push(state.bsCount[nextLine]);
          oldTShift.push(state.tShift[nextLine]);
          oldSCount.push(state.sCount[nextLine]);
          state.sCount[nextLine] -= state.blkIndent;
        }

        break;
      }

      oldBMarks.push(state.bMarks[nextLine]);
      oldBSCount.push(state.bsCount[nextLine]);
      oldTShift.push(state.tShift[nextLine]);
      oldSCount.push(state.sCount[nextLine]);

      // A negative indentation means that this is a paragraph continuation
      //
      state.sCount[nextLine] = -1;
    }

    oldIndent = state.blkIndent;
    state.blkIndent = 0;

    token        = state.push('blockquote_open', 'blockquote', 1);
    token.markup = '>';
    token.map    = lines = [ startLine, 0 ];

    state.md.block.tokenize(state, startLine, nextLine);

    token        = state.push('blockquote_close', 'blockquote', -1);
    token.markup = '>';

    state.lineMax = oldLineMax;
    state.parentType = oldParentType;
    lines[1] = state.line;

    // Restore original tShift; this might not be necessary since the parser
    // has already been here, but just to make sure we can do that.
    for (i = 0; i < oldTShift.length; i++) {
      state.bMarks[i + startLine] = oldBMarks[i];
      state.tShift[i + startLine] = oldTShift[i];
      state.sCount[i + startLine] = oldSCount[i];
      state.bsCount[i + startLine] = oldBSCount[i];
    }
    state.blkIndent = oldIndent;

    return true;
  };

  var isSpace$2 = utils.isSpace;


  var hr = function hr(state, startLine, endLine, silent) {
    var marker, cnt, ch, token,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    marker = state.src.charCodeAt(pos++);

    // Check hr marker
    if (marker !== 0x2A/* * */ &&
        marker !== 0x2D/* - */ &&
        marker !== 0x5F/* _ */) {
      return false;
    }

    // markers can be mixed with spaces, but there should be at least 3 of them

    cnt = 1;
    while (pos < max) {
      ch = state.src.charCodeAt(pos++);
      if (ch !== marker && !isSpace$2(ch)) { return false; }
      if (ch === marker) { cnt++; }
    }

    if (cnt < 3) { return false; }

    if (silent) { return true; }

    state.line = startLine + 1;

    token        = state.push('hr', 'hr', 0);
    token.map    = [ startLine, state.line ];
    token.markup = Array(cnt + 1).join(String.fromCharCode(marker));

    return true;
  };

  var isSpace$3 = utils.isSpace;


  // Search `[-+*][\n ]`, returns next pos after marker on success
  // or -1 on fail.
  function skipBulletListMarker(state, startLine) {
    var marker, pos, max, ch;

    pos = state.bMarks[startLine] + state.tShift[startLine];
    max = state.eMarks[startLine];

    marker = state.src.charCodeAt(pos++);
    // Check bullet
    if (marker !== 0x2A/* * */ &&
        marker !== 0x2D/* - */ &&
        marker !== 0x2B/* + */) {
      return -1;
    }

    if (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (!isSpace$3(ch)) {
        // " -test " - is not a list item
        return -1;
      }
    }

    return pos;
  }

  // Search `\d+[.)][\n ]`, returns next pos after marker on success
  // or -1 on fail.
  function skipOrderedListMarker(state, startLine) {
    var ch,
        start = state.bMarks[startLine] + state.tShift[startLine],
        pos = start,
        max = state.eMarks[startLine];

    // List marker should have at least 2 chars (digit + dot)
    if (pos + 1 >= max) { return -1; }

    ch = state.src.charCodeAt(pos++);

    if (ch < 0x30/* 0 */ || ch > 0x39/* 9 */) { return -1; }

    for (;;) {
      // EOL -> fail
      if (pos >= max) { return -1; }

      ch = state.src.charCodeAt(pos++);

      if (ch >= 0x30/* 0 */ && ch <= 0x39/* 9 */) {

        // List marker should have no more than 9 digits
        // (prevents integer overflow in browsers)
        if (pos - start >= 10) { return -1; }

        continue;
      }

      // found valid marker
      if (ch === 0x29/* ) */ || ch === 0x2e/* . */) {
        break;
      }

      return -1;
    }


    if (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (!isSpace$3(ch)) {
        // " 1.test " - is not a list item
        return -1;
      }
    }
    return pos;
  }

  function markTightParagraphs(state, idx) {
    var i, l,
        level = state.level + 2;

    for (i = idx + 2, l = state.tokens.length - 2; i < l; i++) {
      if (state.tokens[i].level === level && state.tokens[i].type === 'paragraph_open') {
        state.tokens[i + 2].hidden = true;
        state.tokens[i].hidden = true;
        i += 2;
      }
    }
  }


  var list = function list(state, startLine, endLine, silent) {
    var ch,
        contentStart,
        i,
        indent,
        indentAfterMarker,
        initial,
        isOrdered,
        itemLines,
        l,
        listLines,
        listTokIdx,
        markerCharCode,
        markerValue,
        max,
        nextLine,
        offset,
        oldListIndent,
        oldParentType,
        oldSCount,
        oldTShift,
        oldTight,
        pos,
        posAfterMarker,
        prevEmptyEnd,
        start,
        terminate,
        terminatorRules,
        token,
        isTerminatingParagraph = false,
        tight = true;

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    // Special case:
    //  - item 1
    //   - item 2
    //    - item 3
    //     - item 4
    //      - this one is a paragraph continuation
    if (state.listIndent >= 0 &&
        state.sCount[startLine] - state.listIndent >= 4 &&
        state.sCount[startLine] < state.blkIndent) {
      return false;
    }

    // limit conditions when list can interrupt
    // a paragraph (validation mode only)
    if (silent && state.parentType === 'paragraph') {
      // Next list item should still terminate previous list item;
      //
      // This code can fail if plugins use blkIndent as well as lists,
      // but I hope the spec gets fixed long before that happens.
      //
      if (state.tShift[startLine] >= state.blkIndent) {
        isTerminatingParagraph = true;
      }
    }

    // Detect list type and position after marker
    if ((posAfterMarker = skipOrderedListMarker(state, startLine)) >= 0) {
      isOrdered = true;
      start = state.bMarks[startLine] + state.tShift[startLine];
      markerValue = Number(state.src.substr(start, posAfterMarker - start - 1));

      // If we're starting a new ordered list right after
      // a paragraph, it should start with 1.
      if (isTerminatingParagraph && markerValue !== 1) return false;

    } else if ((posAfterMarker = skipBulletListMarker(state, startLine)) >= 0) {
      isOrdered = false;

    } else {
      return false;
    }

    // If we're starting a new unordered list right after
    // a paragraph, first line should not be empty.
    if (isTerminatingParagraph) {
      if (state.skipSpaces(posAfterMarker) >= state.eMarks[startLine]) return false;
    }

    // We should terminate list on style change. Remember first one to compare.
    markerCharCode = state.src.charCodeAt(posAfterMarker - 1);

    // For validation mode we can terminate immediately
    if (silent) { return true; }

    // Start list
    listTokIdx = state.tokens.length;

    if (isOrdered) {
      token       = state.push('ordered_list_open', 'ol', 1);
      if (markerValue !== 1) {
        token.attrs = [ [ 'start', markerValue ] ];
      }

    } else {
      token       = state.push('bullet_list_open', 'ul', 1);
    }

    token.map    = listLines = [ startLine, 0 ];
    token.markup = String.fromCharCode(markerCharCode);

    //
    // Iterate list items
    //

    nextLine = startLine;
    prevEmptyEnd = false;
    terminatorRules = state.md.block.ruler.getRules('list');

    oldParentType = state.parentType;
    state.parentType = 'list';

    while (nextLine < endLine) {
      pos = posAfterMarker;
      max = state.eMarks[nextLine];

      initial = offset = state.sCount[nextLine] + posAfterMarker - (state.bMarks[startLine] + state.tShift[startLine]);

      while (pos < max) {
        ch = state.src.charCodeAt(pos);

        if (ch === 0x09) {
          offset += 4 - (offset + state.bsCount[nextLine]) % 4;
        } else if (ch === 0x20) {
          offset++;
        } else {
          break;
        }

        pos++;
      }

      contentStart = pos;

      if (contentStart >= max) {
        // trimming space in "-    \n  3" case, indent is 1 here
        indentAfterMarker = 1;
      } else {
        indentAfterMarker = offset - initial;
      }

      // If we have more than 4 spaces, the indent is 1
      // (the rest is just indented code block)
      if (indentAfterMarker > 4) { indentAfterMarker = 1; }

      // "  -  test"
      //  ^^^^^ - calculating total length of this thing
      indent = initial + indentAfterMarker;

      // Run subparser & write tokens
      token        = state.push('list_item_open', 'li', 1);
      token.markup = String.fromCharCode(markerCharCode);
      token.map    = itemLines = [ startLine, 0 ];

      // change current state, then restore it after parser subcall
      oldTight = state.tight;
      oldTShift = state.tShift[startLine];
      oldSCount = state.sCount[startLine];

      //  - example list
      // ^ listIndent position will be here
      //   ^ blkIndent position will be here
      //
      oldListIndent = state.listIndent;
      state.listIndent = state.blkIndent;
      state.blkIndent = indent;

      state.tight = true;
      state.tShift[startLine] = contentStart - state.bMarks[startLine];
      state.sCount[startLine] = offset;

      if (contentStart >= max && state.isEmpty(startLine + 1)) {
        // workaround for this case
        // (list item is empty, list terminates before "foo"):
        // ~~~~~~~~
        //   -
        //
        //     foo
        // ~~~~~~~~
        state.line = Math.min(state.line + 2, endLine);
      } else {
        state.md.block.tokenize(state, startLine, endLine, true);
      }

      // If any of list item is tight, mark list as tight
      if (!state.tight || prevEmptyEnd) {
        tight = false;
      }
      // Item become loose if finish with empty line,
      // but we should filter last element, because it means list finish
      prevEmptyEnd = (state.line - startLine) > 1 && state.isEmpty(state.line - 1);

      state.blkIndent = state.listIndent;
      state.listIndent = oldListIndent;
      state.tShift[startLine] = oldTShift;
      state.sCount[startLine] = oldSCount;
      state.tight = oldTight;

      token        = state.push('list_item_close', 'li', -1);
      token.markup = String.fromCharCode(markerCharCode);

      nextLine = startLine = state.line;
      itemLines[1] = nextLine;
      contentStart = state.bMarks[startLine];

      if (nextLine >= endLine) { break; }

      //
      // Try to check if list is terminated or continued.
      //
      if (state.sCount[nextLine] < state.blkIndent) { break; }

      // if it's indented more than 3 spaces, it should be a code block
      if (state.sCount[startLine] - state.blkIndent >= 4) { break; }

      // fail if terminating block found
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) { break; }

      // fail if list has another type
      if (isOrdered) {
        posAfterMarker = skipOrderedListMarker(state, nextLine);
        if (posAfterMarker < 0) { break; }
      } else {
        posAfterMarker = skipBulletListMarker(state, nextLine);
        if (posAfterMarker < 0) { break; }
      }

      if (markerCharCode !== state.src.charCodeAt(posAfterMarker - 1)) { break; }
    }

    // Finalize list
    if (isOrdered) {
      token = state.push('ordered_list_close', 'ol', -1);
    } else {
      token = state.push('bullet_list_close', 'ul', -1);
    }
    token.markup = String.fromCharCode(markerCharCode);

    listLines[1] = nextLine;
    state.line = nextLine;

    state.parentType = oldParentType;

    // mark paragraphs tight if needed
    if (tight) {
      markTightParagraphs(state, listTokIdx);
    }

    return true;
  };

  var normalizeReference   = utils.normalizeReference;
  var isSpace$4              = utils.isSpace;


  var reference = function reference(state, startLine, _endLine, silent) {
    var ch,
        destEndPos,
        destEndLineNo,
        endLine,
        href,
        i,
        l,
        label,
        labelEnd,
        oldParentType,
        res,
        start,
        str,
        terminate,
        terminatorRules,
        title,
        lines = 0,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine],
        nextLine = startLine + 1;

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    if (state.src.charCodeAt(pos) !== 0x5B/* [ */) { return false; }

    // Simple check to quickly interrupt scan on [link](url) at the start of line.
    // Can be useful on practice: https://github.com/markdown-it/markdown-it/issues/54
    while (++pos < max) {
      if (state.src.charCodeAt(pos) === 0x5D /* ] */ &&
          state.src.charCodeAt(pos - 1) !== 0x5C/* \ */) {
        if (pos + 1 === max) { return false; }
        if (state.src.charCodeAt(pos + 1) !== 0x3A/* : */) { return false; }
        break;
      }
    }

    endLine = state.lineMax;

    // jump line-by-line until empty one or EOF
    terminatorRules = state.md.block.ruler.getRules('reference');

    oldParentType = state.parentType;
    state.parentType = 'reference';

    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      // this would be a code block normally, but after paragraph
      // it's considered a lazy continuation regardless of what's there
      if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

      // quirk for blockquotes, this line should already be checked by that rule
      if (state.sCount[nextLine] < 0) { continue; }

      // Some tags can terminate paragraph without empty line.
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) { break; }
    }

    str = state.getLines(startLine, nextLine, state.blkIndent, false).trim();
    max = str.length;

    for (pos = 1; pos < max; pos++) {
      ch = str.charCodeAt(pos);
      if (ch === 0x5B /* [ */) {
        return false;
      } else if (ch === 0x5D /* ] */) {
        labelEnd = pos;
        break;
      } else if (ch === 0x0A /* \n */) {
        lines++;
      } else if (ch === 0x5C /* \ */) {
        pos++;
        if (pos < max && str.charCodeAt(pos) === 0x0A) {
          lines++;
        }
      }
    }

    if (labelEnd < 0 || str.charCodeAt(labelEnd + 1) !== 0x3A/* : */) { return false; }

    // [label]:   destination   'title'
    //         ^^^ skip optional whitespace here
    for (pos = labelEnd + 2; pos < max; pos++) {
      ch = str.charCodeAt(pos);
      if (ch === 0x0A) {
        lines++;
      } else if (isSpace$4(ch)) ; else {
        break;
      }
    }

    // [label]:   destination   'title'
    //            ^^^^^^^^^^^ parse this
    res = state.md.helpers.parseLinkDestination(str, pos, max);
    if (!res.ok) { return false; }

    href = state.md.normalizeLink(res.str);
    if (!state.md.validateLink(href)) { return false; }

    pos = res.pos;
    lines += res.lines;

    // save cursor state, we could require to rollback later
    destEndPos = pos;
    destEndLineNo = lines;

    // [label]:   destination   'title'
    //                       ^^^ skipping those spaces
    start = pos;
    for (; pos < max; pos++) {
      ch = str.charCodeAt(pos);
      if (ch === 0x0A) {
        lines++;
      } else if (isSpace$4(ch)) ; else {
        break;
      }
    }

    // [label]:   destination   'title'
    //                          ^^^^^^^ parse this
    res = state.md.helpers.parseLinkTitle(str, pos, max);
    if (pos < max && start !== pos && res.ok) {
      title = res.str;
      pos = res.pos;
      lines += res.lines;
    } else {
      title = '';
      pos = destEndPos;
      lines = destEndLineNo;
    }

    // skip trailing spaces until the rest of the line
    while (pos < max) {
      ch = str.charCodeAt(pos);
      if (!isSpace$4(ch)) { break; }
      pos++;
    }

    if (pos < max && str.charCodeAt(pos) !== 0x0A) {
      if (title) {
        // garbage at the end of the line after title,
        // but it could still be a valid reference if we roll back
        title = '';
        pos = destEndPos;
        lines = destEndLineNo;
        while (pos < max) {
          ch = str.charCodeAt(pos);
          if (!isSpace$4(ch)) { break; }
          pos++;
        }
      }
    }

    if (pos < max && str.charCodeAt(pos) !== 0x0A) {
      // garbage at the end of the line
      return false;
    }

    label = normalizeReference(str.slice(1, labelEnd));
    if (!label) {
      // CommonMark 0.20 disallows empty labels
      return false;
    }

    // Reference can not terminate anything. This check is for safety only.
    /*istanbul ignore if*/
    if (silent) { return true; }

    if (typeof state.env.references === 'undefined') {
      state.env.references = {};
    }
    if (typeof state.env.references[label] === 'undefined') {
      state.env.references[label] = { title: title, href: href };
    }

    state.parentType = oldParentType;

    state.line = startLine + lines + 1;
    return true;
  };

  var isSpace$5 = utils.isSpace;


  var heading = function heading(state, startLine, endLine, silent) {
    var ch, level, tmp, token,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    ch  = state.src.charCodeAt(pos);

    if (ch !== 0x23/* # */ || pos >= max) { return false; }

    // count heading level
    level = 1;
    ch = state.src.charCodeAt(++pos);
    while (ch === 0x23/* # */ && pos < max && level <= 6) {
      level++;
      ch = state.src.charCodeAt(++pos);
    }

    if (level > 6 || (pos < max && !isSpace$5(ch))) { return false; }

    if (silent) { return true; }

    // Let's cut tails like '    ###  ' from the end of string

    max = state.skipSpacesBack(max, pos);
    tmp = state.skipCharsBack(max, 0x23, pos); // #
    if (tmp > pos && isSpace$5(state.src.charCodeAt(tmp - 1))) {
      max = tmp;
    }

    state.line = startLine + 1;

    token        = state.push('heading_open', 'h' + String(level), 1);
    token.markup = '########'.slice(0, level);
    token.map    = [ startLine, state.line ];

    token          = state.push('inline', '', 0);
    token.content  = state.src.slice(pos, max).trim();
    token.map      = [ startLine, state.line ];
    token.children = [];

    token        = state.push('heading_close', 'h' + String(level), -1);
    token.markup = '########'.slice(0, level);

    return true;
  };

  // lheading (---, ===)


  var lheading = function lheading(state, startLine, endLine/*, silent*/) {
    var content, terminate, i, l, token, pos, max, level, marker,
        nextLine = startLine + 1, oldParentType,
        terminatorRules = state.md.block.ruler.getRules('paragraph');

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    oldParentType = state.parentType;
    state.parentType = 'paragraph'; // use paragraph to match terminatorRules

    // jump line-by-line until empty one or EOF
    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      // this would be a code block normally, but after paragraph
      // it's considered a lazy continuation regardless of what's there
      if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

      //
      // Check for underline in setext header
      //
      if (state.sCount[nextLine] >= state.blkIndent) {
        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];

        if (pos < max) {
          marker = state.src.charCodeAt(pos);

          if (marker === 0x2D/* - */ || marker === 0x3D/* = */) {
            pos = state.skipChars(pos, marker);
            pos = state.skipSpaces(pos);

            if (pos >= max) {
              level = (marker === 0x3D/* = */ ? 1 : 2);
              break;
            }
          }
        }
      }

      // quirk for blockquotes, this line should already be checked by that rule
      if (state.sCount[nextLine] < 0) { continue; }

      // Some tags can terminate paragraph without empty line.
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) { break; }
    }

    if (!level) {
      // Didn't find valid underline
      return false;
    }

    content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

    state.line = nextLine + 1;

    token          = state.push('heading_open', 'h' + String(level), 1);
    token.markup   = String.fromCharCode(marker);
    token.map      = [ startLine, state.line ];

    token          = state.push('inline', '', 0);
    token.content  = content;
    token.map      = [ startLine, state.line - 1 ];
    token.children = [];

    token          = state.push('heading_close', 'h' + String(level), -1);
    token.markup   = String.fromCharCode(marker);

    state.parentType = oldParentType;

    return true;
  };

  // List of valid html blocks names, accorting to commonmark spec


  var html_blocks = [
    'address',
    'article',
    'aside',
    'base',
    'basefont',
    'blockquote',
    'body',
    'caption',
    'center',
    'col',
    'colgroup',
    'dd',
    'details',
    'dialog',
    'dir',
    'div',
    'dl',
    'dt',
    'fieldset',
    'figcaption',
    'figure',
    'footer',
    'form',
    'frame',
    'frameset',
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    'head',
    'header',
    'hr',
    'html',
    'iframe',
    'legend',
    'li',
    'link',
    'main',
    'menu',
    'menuitem',
    'meta',
    'nav',
    'noframes',
    'ol',
    'optgroup',
    'option',
    'p',
    'param',
    'section',
    'source',
    'summary',
    'table',
    'tbody',
    'td',
    'tfoot',
    'th',
    'thead',
    'title',
    'tr',
    'track',
    'ul'
  ];

  // Regexps to match html elements

  var attr_name     = '[a-zA-Z_:][a-zA-Z0-9:._-]*';

  var unquoted      = '[^"\'=<>`\\x00-\\x20]+';
  var single_quoted = "'[^']*'";
  var double_quoted = '"[^"]*"';

  var attr_value  = '(?:' + unquoted + '|' + single_quoted + '|' + double_quoted + ')';

  var attribute   = '(?:\\s+' + attr_name + '(?:\\s*=\\s*' + attr_value + ')?)';

  var open_tag    = '<[A-Za-z][A-Za-z0-9\\-]*' + attribute + '*\\s*\\/?>';

  var close_tag   = '<\\/[A-Za-z][A-Za-z0-9\\-]*\\s*>';
  var comment     = '<!---->|<!--(?:-?[^>-])(?:-?[^-])*-->';
  var processing  = '<[?].*?[?]>';
  var declaration = '<![A-Z]+\\s+[^>]*>';
  var cdata       = '<!\\[CDATA\\[[\\s\\S]*?\\]\\]>';

  var HTML_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + '|' + comment +
                          '|' + processing + '|' + declaration + '|' + cdata + ')');
  var HTML_OPEN_CLOSE_TAG_RE = new RegExp('^(?:' + open_tag + '|' + close_tag + ')');

  var HTML_TAG_RE_1 = HTML_TAG_RE;
  var HTML_OPEN_CLOSE_TAG_RE_1 = HTML_OPEN_CLOSE_TAG_RE;

  var html_re = {
  	HTML_TAG_RE: HTML_TAG_RE_1,
  	HTML_OPEN_CLOSE_TAG_RE: HTML_OPEN_CLOSE_TAG_RE_1
  };

  var HTML_OPEN_CLOSE_TAG_RE$1 = html_re.HTML_OPEN_CLOSE_TAG_RE;

  // An array of opening and corresponding closing sequences for html tags,
  // last argument defines whether it can terminate a paragraph or not
  //
  var HTML_SEQUENCES = [
    [ /^<(script|pre|style)(?=(\s|>|$))/i, /<\/(script|pre|style)>/i, true ],
    [ /^<!--/,        /-->/,   true ],
    [ /^<\?/,         /\?>/,   true ],
    [ /^<![A-Z]/,     />/,     true ],
    [ /^<!\[CDATA\[/, /\]\]>/, true ],
    [ new RegExp('^</?(' + html_blocks.join('|') + ')(?=(\\s|/?>|$))', 'i'), /^$/, true ],
    [ new RegExp(HTML_OPEN_CLOSE_TAG_RE$1.source + '\\s*$'),  /^$/, false ]
  ];


  var html_block = function html_block(state, startLine, endLine, silent) {
    var i, nextLine, token, lineText,
        pos = state.bMarks[startLine] + state.tShift[startLine],
        max = state.eMarks[startLine];

    // if it's indented more than 3 spaces, it should be a code block
    if (state.sCount[startLine] - state.blkIndent >= 4) { return false; }

    if (!state.md.options.html) { return false; }

    if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

    lineText = state.src.slice(pos, max);

    for (i = 0; i < HTML_SEQUENCES.length; i++) {
      if (HTML_SEQUENCES[i][0].test(lineText)) { break; }
    }

    if (i === HTML_SEQUENCES.length) { return false; }

    if (silent) {
      // true if this sequence can be a terminator, false otherwise
      return HTML_SEQUENCES[i][2];
    }

    nextLine = startLine + 1;

    // If we are here - we detected HTML block.
    // Let's roll down till block end.
    if (!HTML_SEQUENCES[i][1].test(lineText)) {
      for (; nextLine < endLine; nextLine++) {
        if (state.sCount[nextLine] < state.blkIndent) { break; }

        pos = state.bMarks[nextLine] + state.tShift[nextLine];
        max = state.eMarks[nextLine];
        lineText = state.src.slice(pos, max);

        if (HTML_SEQUENCES[i][1].test(lineText)) {
          if (lineText.length !== 0) { nextLine++; }
          break;
        }
      }
    }

    state.line = nextLine;

    token         = state.push('html_block', '', 0);
    token.map     = [ startLine, nextLine ];
    token.content = state.getLines(startLine, nextLine, state.blkIndent, true);

    return true;
  };

  // Paragraph


  var paragraph = function paragraph(state, startLine/*, endLine*/) {
    var content, terminate, i, l, token, oldParentType,
        nextLine = startLine + 1,
        terminatorRules = state.md.block.ruler.getRules('paragraph'),
        endLine = state.lineMax;

    oldParentType = state.parentType;
    state.parentType = 'paragraph';

    // jump line-by-line until empty one or EOF
    for (; nextLine < endLine && !state.isEmpty(nextLine); nextLine++) {
      // this would be a code block normally, but after paragraph
      // it's considered a lazy continuation regardless of what's there
      if (state.sCount[nextLine] - state.blkIndent > 3) { continue; }

      // quirk for blockquotes, this line should already be checked by that rule
      if (state.sCount[nextLine] < 0) { continue; }

      // Some tags can terminate paragraph without empty line.
      terminate = false;
      for (i = 0, l = terminatorRules.length; i < l; i++) {
        if (terminatorRules[i](state, nextLine, endLine, true)) {
          terminate = true;
          break;
        }
      }
      if (terminate) { break; }
    }

    content = state.getLines(startLine, nextLine, state.blkIndent, false).trim();

    state.line = nextLine;

    token          = state.push('paragraph_open', 'p', 1);
    token.map      = [ startLine, state.line ];

    token          = state.push('inline', '', 0);
    token.content  = content;
    token.map      = [ startLine, state.line ];
    token.children = [];

    token          = state.push('paragraph_close', 'p', -1);

    state.parentType = oldParentType;

    return true;
  };

  var isSpace$6 = utils.isSpace;


  function StateBlock(src, md, env, tokens) {
    var ch, s, start, pos, len, indent, offset, indent_found;

    this.src = src;

    // link to parser instance
    this.md     = md;

    this.env = env;

    //
    // Internal state vartiables
    //

    this.tokens = tokens;

    this.bMarks = [];  // line begin offsets for fast jumps
    this.eMarks = [];  // line end offsets for fast jumps
    this.tShift = [];  // offsets of the first non-space characters (tabs not expanded)
    this.sCount = [];  // indents for each line (tabs expanded)

    // An amount of virtual spaces (tabs expanded) between beginning
    // of each line (bMarks) and real beginning of that line.
    //
    // It exists only as a hack because blockquotes override bMarks
    // losing information in the process.
    //
    // It's used only when expanding tabs, you can think about it as
    // an initial tab length, e.g. bsCount=21 applied to string `\t123`
    // means first tab should be expanded to 4-21%4 === 3 spaces.
    //
    this.bsCount = [];

    // block parser variables
    this.blkIndent  = 0; // required block content indent (for example, if we are
                         // inside a list, it would be positioned after list marker)
    this.line       = 0; // line index in src
    this.lineMax    = 0; // lines count
    this.tight      = false;  // loose/tight mode for lists
    this.ddIndent   = -1; // indent of the current dd block (-1 if there isn't any)
    this.listIndent = -1; // indent of the current list block (-1 if there isn't any)

    // can be 'blockquote', 'list', 'root', 'paragraph' or 'reference'
    // used in lists to determine if they interrupt a paragraph
    this.parentType = 'root';

    this.level = 0;

    // renderer
    this.result = '';

    // Create caches
    // Generate markers.
    s = this.src;
    indent_found = false;

    for (start = pos = indent = offset = 0, len = s.length; pos < len; pos++) {
      ch = s.charCodeAt(pos);

      if (!indent_found) {
        if (isSpace$6(ch)) {
          indent++;

          if (ch === 0x09) {
            offset += 4 - offset % 4;
          } else {
            offset++;
          }
          continue;
        } else {
          indent_found = true;
        }
      }

      if (ch === 0x0A || pos === len - 1) {
        if (ch !== 0x0A) { pos++; }
        this.bMarks.push(start);
        this.eMarks.push(pos);
        this.tShift.push(indent);
        this.sCount.push(offset);
        this.bsCount.push(0);

        indent_found = false;
        indent = 0;
        offset = 0;
        start = pos + 1;
      }
    }

    // Push fake entry to simplify cache bounds checks
    this.bMarks.push(s.length);
    this.eMarks.push(s.length);
    this.tShift.push(0);
    this.sCount.push(0);
    this.bsCount.push(0);

    this.lineMax = this.bMarks.length - 1; // don't count last fake line
  }

  // Push new token to "stream".
  //
  StateBlock.prototype.push = function (type, tag, nesting) {
    var token$1 = new token(type, tag, nesting);
    token$1.block = true;

    if (nesting < 0) this.level--; // closing tag
    token$1.level = this.level;
    if (nesting > 0) this.level++; // opening tag

    this.tokens.push(token$1);
    return token$1;
  };

  StateBlock.prototype.isEmpty = function isEmpty(line) {
    return this.bMarks[line] + this.tShift[line] >= this.eMarks[line];
  };

  StateBlock.prototype.skipEmptyLines = function skipEmptyLines(from) {
    for (var max = this.lineMax; from < max; from++) {
      if (this.bMarks[from] + this.tShift[from] < this.eMarks[from]) {
        break;
      }
    }
    return from;
  };

  // Skip spaces from given position.
  StateBlock.prototype.skipSpaces = function skipSpaces(pos) {
    var ch;

    for (var max = this.src.length; pos < max; pos++) {
      ch = this.src.charCodeAt(pos);
      if (!isSpace$6(ch)) { break; }
    }
    return pos;
  };

  // Skip spaces from given position in reverse.
  StateBlock.prototype.skipSpacesBack = function skipSpacesBack(pos, min) {
    if (pos <= min) { return pos; }

    while (pos > min) {
      if (!isSpace$6(this.src.charCodeAt(--pos))) { return pos + 1; }
    }
    return pos;
  };

  // Skip char codes from given position
  StateBlock.prototype.skipChars = function skipChars(pos, code) {
    for (var max = this.src.length; pos < max; pos++) {
      if (this.src.charCodeAt(pos) !== code) { break; }
    }
    return pos;
  };

  // Skip char codes reverse from given position - 1
  StateBlock.prototype.skipCharsBack = function skipCharsBack(pos, code, min) {
    if (pos <= min) { return pos; }

    while (pos > min) {
      if (code !== this.src.charCodeAt(--pos)) { return pos + 1; }
    }
    return pos;
  };

  // cut lines range from source.
  StateBlock.prototype.getLines = function getLines(begin, end, indent, keepLastLF) {
    var i, lineIndent, ch, first, last, queue, lineStart,
        line = begin;

    if (begin >= end) {
      return '';
    }

    queue = new Array(end - begin);

    for (i = 0; line < end; line++, i++) {
      lineIndent = 0;
      lineStart = first = this.bMarks[line];

      if (line + 1 < end || keepLastLF) {
        // No need for bounds check because we have fake entry on tail.
        last = this.eMarks[line] + 1;
      } else {
        last = this.eMarks[line];
      }

      while (first < last && lineIndent < indent) {
        ch = this.src.charCodeAt(first);

        if (isSpace$6(ch)) {
          if (ch === 0x09) {
            lineIndent += 4 - (lineIndent + this.bsCount[line]) % 4;
          } else {
            lineIndent++;
          }
        } else if (first - lineStart < this.tShift[line]) {
          // patched tShift masked characters to look like spaces (blockquotes, list markers)
          lineIndent++;
        } else {
          break;
        }

        first++;
      }

      if (lineIndent > indent) {
        // partially expanding tabs in code blocks, e.g '\t\tfoobar'
        // with indent=2 becomes '  \tfoobar'
        queue[i] = new Array(lineIndent - indent + 1).join(' ') + this.src.slice(first, last);
      } else {
        queue[i] = this.src.slice(first, last);
      }
    }

    return queue.join('');
  };

  // re-export Token class to use in block rules
  StateBlock.prototype.Token = token;


  var state_block = StateBlock;

  var _rules$1 = [
    // First 2 params - rule name & source. Secondary array - list of rules,
    // which can be terminated by this one.
    [ 'table',      table,      [ 'paragraph', 'reference' ] ],
    [ 'code',       code ],
    [ 'fence',      fence,      [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
    [ 'blockquote', blockquote, [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
    [ 'hr',         hr,         [ 'paragraph', 'reference', 'blockquote', 'list' ] ],
    [ 'list',       list,       [ 'paragraph', 'reference', 'blockquote' ] ],
    [ 'reference',  reference ],
    [ 'heading',    heading,    [ 'paragraph', 'reference', 'blockquote' ] ],
    [ 'lheading',   lheading ],
    [ 'html_block', html_block, [ 'paragraph', 'reference', 'blockquote' ] ],
    [ 'paragraph',  paragraph ]
  ];


  /**
   * new ParserBlock()
   **/
  function ParserBlock() {
    /**
     * ParserBlock#ruler -> Ruler
     *
     * [[Ruler]] instance. Keep configuration of block rules.
     **/
    this.ruler = new ruler();

    for (var i = 0; i < _rules$1.length; i++) {
      this.ruler.push(_rules$1[i][0], _rules$1[i][1], { alt: (_rules$1[i][2] || []).slice() });
    }
  }


  // Generate tokens for input range
  //
  ParserBlock.prototype.tokenize = function (state, startLine, endLine) {
    var ok, i,
        rules = this.ruler.getRules(''),
        len = rules.length,
        line = startLine,
        hasEmptyLines = false,
        maxNesting = state.md.options.maxNesting;

    while (line < endLine) {
      state.line = line = state.skipEmptyLines(line);
      if (line >= endLine) { break; }

      // Termination condition for nested calls.
      // Nested calls currently used for blockquotes & lists
      if (state.sCount[line] < state.blkIndent) { break; }

      // If nesting level exceeded - skip tail to the end. That's not ordinary
      // situation and we should not care about content.
      if (state.level >= maxNesting) {
        state.line = endLine;
        break;
      }

      // Try all possible rules.
      // On success, rule should:
      //
      // - update `state.line`
      // - update `state.tokens`
      // - return true

      for (i = 0; i < len; i++) {
        ok = rules[i](state, line, endLine, false);
        if (ok) { break; }
      }

      // set state.tight if we had an empty line before current tag
      // i.e. latest empty line should not count
      state.tight = !hasEmptyLines;

      // paragraph might "eat" one newline after it in nested lists
      if (state.isEmpty(state.line - 1)) {
        hasEmptyLines = true;
      }

      line = state.line;

      if (line < endLine && state.isEmpty(line)) {
        hasEmptyLines = true;
        line++;
        state.line = line;
      }
    }
  };


  /**
   * ParserBlock.parse(str, md, env, outTokens)
   *
   * Process input string and push block tokens into `outTokens`
   **/
  ParserBlock.prototype.parse = function (src, md, env, outTokens) {
    var state;

    if (!src) { return; }

    state = new this.State(src, md, env, outTokens);

    this.tokenize(state, state.line, state.lineMax);
  };


  ParserBlock.prototype.State = state_block;


  var parser_block = ParserBlock;

  // Skip text characters for text token, place those to pending buffer


  // Rule to skip pure text
  // '{}$%@~+=:' reserved for extentions

  // !, ", #, $, %, &, ', (, ), *, +, ,, -, ., /, :, ;, <, =, >, ?, @, [, \, ], ^, _, `, {, |, }, or ~

  // !!!! Don't confuse with "Markdown ASCII Punctuation" chars
  // http://spec.commonmark.org/0.15/#ascii-punctuation-character
  function isTerminatorChar(ch) {
    switch (ch) {
      case 0x0A/* \n */:
      case 0x21/* ! */:
      case 0x23/* # */:
      case 0x24/* $ */:
      case 0x25/* % */:
      case 0x26/* & */:
      case 0x2A/* * */:
      case 0x2B/* + */:
      case 0x2D/* - */:
      case 0x3A/* : */:
      case 0x3C/* < */:
      case 0x3D/* = */:
      case 0x3E/* > */:
      case 0x40/* @ */:
      case 0x5B/* [ */:
      case 0x5C/* \ */:
      case 0x5D/* ] */:
      case 0x5E/* ^ */:
      case 0x5F/* _ */:
      case 0x60/* ` */:
      case 0x7B/* { */:
      case 0x7D/* } */:
      case 0x7E/* ~ */:
        return true;
      default:
        return false;
    }
  }

  var text = function text(state, silent) {
    var pos = state.pos;

    while (pos < state.posMax && !isTerminatorChar(state.src.charCodeAt(pos))) {
      pos++;
    }

    if (pos === state.pos) { return false; }

    if (!silent) { state.pending += state.src.slice(state.pos, pos); }

    state.pos = pos;

    return true;
  };

  var isSpace$7 = utils.isSpace;


  var newline = function newline(state, silent) {
    var pmax, max, pos = state.pos;

    if (state.src.charCodeAt(pos) !== 0x0A/* \n */) { return false; }

    pmax = state.pending.length - 1;
    max = state.posMax;

    // '  \n' -> hardbreak
    // Lookup in pending chars is bad practice! Don't copy to other rules!
    // Pending string is stored in concat mode, indexed lookups will cause
    // convertion to flat mode.
    if (!silent) {
      if (pmax >= 0 && state.pending.charCodeAt(pmax) === 0x20) {
        if (pmax >= 1 && state.pending.charCodeAt(pmax - 1) === 0x20) {
          state.pending = state.pending.replace(/ +$/, '');
          state.push('hardbreak', 'br', 0);
        } else {
          state.pending = state.pending.slice(0, -1);
          state.push('softbreak', 'br', 0);
        }

      } else {
        state.push('softbreak', 'br', 0);
      }
    }

    pos++;

    // skip heading spaces for next line
    while (pos < max && isSpace$7(state.src.charCodeAt(pos))) { pos++; }

    state.pos = pos;
    return true;
  };

  var isSpace$8 = utils.isSpace;

  var ESCAPED = [];

  for (var i = 0; i < 256; i++) { ESCAPED.push(0); }

  '\\!"#$%&\'()*+,./:;<=>?@[]^_`{|}~-'
    .split('').forEach(function (ch) { ESCAPED[ch.charCodeAt(0)] = 1; });


  var _escape = function escape(state, silent) {
    var ch, pos = state.pos, max = state.posMax;

    if (state.src.charCodeAt(pos) !== 0x5C/* \ */) { return false; }

    pos++;

    if (pos < max) {
      ch = state.src.charCodeAt(pos);

      if (ch < 256 && ESCAPED[ch] !== 0) {
        if (!silent) { state.pending += state.src[pos]; }
        state.pos += 2;
        return true;
      }

      if (ch === 0x0A) {
        if (!silent) {
          state.push('hardbreak', 'br', 0);
        }

        pos++;
        // skip leading whitespaces from next line
        while (pos < max) {
          ch = state.src.charCodeAt(pos);
          if (!isSpace$8(ch)) { break; }
          pos++;
        }

        state.pos = pos;
        return true;
      }
    }

    if (!silent) { state.pending += '\\'; }
    state.pos++;
    return true;
  };

  // Parse backticks

  var backticks = function backtick(state, silent) {
    var start, max, marker, matchStart, matchEnd, token,
        pos = state.pos,
        ch = state.src.charCodeAt(pos);

    if (ch !== 0x60/* ` */) { return false; }

    start = pos;
    pos++;
    max = state.posMax;

    while (pos < max && state.src.charCodeAt(pos) === 0x60/* ` */) { pos++; }

    marker = state.src.slice(start, pos);

    matchStart = matchEnd = pos;

    while ((matchStart = state.src.indexOf('`', matchEnd)) !== -1) {
      matchEnd = matchStart + 1;

      while (matchEnd < max && state.src.charCodeAt(matchEnd) === 0x60/* ` */) { matchEnd++; }

      if (matchEnd - matchStart === marker.length) {
        if (!silent) {
          token         = state.push('code_inline', 'code', 0);
          token.markup  = marker;
          token.content = state.src.slice(pos, matchStart)
            .replace(/\n/g, ' ')
            .replace(/^ (.+) $/, '$1');
        }
        state.pos = matchEnd;
        return true;
      }
    }

    if (!silent) { state.pending += marker; }
    state.pos += marker.length;
    return true;
  };

  // ~~strike through~~


  // Insert each marker as a separate text token, and add it to delimiter list
  //
  var tokenize = function strikethrough(state, silent) {
    var i, scanned, token, len, ch,
        start = state.pos,
        marker = state.src.charCodeAt(start);

    if (silent) { return false; }

    if (marker !== 0x7E/* ~ */) { return false; }

    scanned = state.scanDelims(state.pos, true);
    len = scanned.length;
    ch = String.fromCharCode(marker);

    if (len < 2) { return false; }

    if (len % 2) {
      token         = state.push('text', '', 0);
      token.content = ch;
      len--;
    }

    for (i = 0; i < len; i += 2) {
      token         = state.push('text', '', 0);
      token.content = ch + ch;

      state.delimiters.push({
        marker: marker,
        length: 0, // disable "rule of 3" length checks meant for emphasis
        jump:   i,
        token:  state.tokens.length - 1,
        end:    -1,
        open:   scanned.can_open,
        close:  scanned.can_close
      });
    }

    state.pos += scanned.length;

    return true;
  };


  function postProcess(state, delimiters) {
    var i, j,
        startDelim,
        endDelim,
        token,
        loneMarkers = [],
        max = delimiters.length;

    for (i = 0; i < max; i++) {
      startDelim = delimiters[i];

      if (startDelim.marker !== 0x7E/* ~ */) {
        continue;
      }

      if (startDelim.end === -1) {
        continue;
      }

      endDelim = delimiters[startDelim.end];

      token         = state.tokens[startDelim.token];
      token.type    = 's_open';
      token.tag     = 's';
      token.nesting = 1;
      token.markup  = '~~';
      token.content = '';

      token         = state.tokens[endDelim.token];
      token.type    = 's_close';
      token.tag     = 's';
      token.nesting = -1;
      token.markup  = '~~';
      token.content = '';

      if (state.tokens[endDelim.token - 1].type === 'text' &&
          state.tokens[endDelim.token - 1].content === '~') {

        loneMarkers.push(endDelim.token - 1);
      }
    }

    // If a marker sequence has an odd number of characters, it's splitted
    // like this: `~~~~~` -> `~` + `~~` + `~~`, leaving one marker at the
    // start of the sequence.
    //
    // So, we have to move all those markers after subsequent s_close tags.
    //
    while (loneMarkers.length) {
      i = loneMarkers.pop();
      j = i + 1;

      while (j < state.tokens.length && state.tokens[j].type === 's_close') {
        j++;
      }

      j--;

      if (i !== j) {
        token = state.tokens[j];
        state.tokens[j] = state.tokens[i];
        state.tokens[i] = token;
      }
    }
  }


  // Walk through delimiter list and replace text tokens with tags
  //
  var postProcess_1 = function strikethrough(state) {
    var curr,
        tokens_meta = state.tokens_meta,
        max = state.tokens_meta.length;

    postProcess(state, state.delimiters);

    for (curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        postProcess(state, tokens_meta[curr].delimiters);
      }
    }
  };

  var strikethrough = {
  	tokenize: tokenize,
  	postProcess: postProcess_1
  };

  // Process *this* and _that_


  // Insert each marker as a separate text token, and add it to delimiter list
  //
  var tokenize$1 = function emphasis(state, silent) {
    var i, scanned, token,
        start = state.pos,
        marker = state.src.charCodeAt(start);

    if (silent) { return false; }

    if (marker !== 0x5F /* _ */ && marker !== 0x2A /* * */) { return false; }

    scanned = state.scanDelims(state.pos, marker === 0x2A);

    for (i = 0; i < scanned.length; i++) {
      token         = state.push('text', '', 0);
      token.content = String.fromCharCode(marker);

      state.delimiters.push({
        // Char code of the starting marker (number).
        //
        marker: marker,

        // Total length of these series of delimiters.
        //
        length: scanned.length,

        // An amount of characters before this one that's equivalent to
        // current one. In plain English: if this delimiter does not open
        // an emphasis, neither do previous `jump` characters.
        //
        // Used to skip sequences like "*****" in one step, for 1st asterisk
        // value will be 0, for 2nd it's 1 and so on.
        //
        jump:   i,

        // A position of the token this delimiter corresponds to.
        //
        token:  state.tokens.length - 1,

        // If this delimiter is matched as a valid opener, `end` will be
        // equal to its position, otherwise it's `-1`.
        //
        end:    -1,

        // Boolean flags that determine if this delimiter could open or close
        // an emphasis.
        //
        open:   scanned.can_open,
        close:  scanned.can_close
      });
    }

    state.pos += scanned.length;

    return true;
  };


  function postProcess$1(state, delimiters) {
    var i,
        startDelim,
        endDelim,
        token,
        ch,
        isStrong,
        max = delimiters.length;

    for (i = max - 1; i >= 0; i--) {
      startDelim = delimiters[i];

      if (startDelim.marker !== 0x5F/* _ */ && startDelim.marker !== 0x2A/* * */) {
        continue;
      }

      // Process only opening markers
      if (startDelim.end === -1) {
        continue;
      }

      endDelim = delimiters[startDelim.end];

      // If the previous delimiter has the same marker and is adjacent to this one,
      // merge those into one strong delimiter.
      //
      // `<em><em>whatever</em></em>` -> `<strong>whatever</strong>`
      //
      isStrong = i > 0 &&
                 delimiters[i - 1].end === startDelim.end + 1 &&
                 delimiters[i - 1].token === startDelim.token - 1 &&
                 delimiters[startDelim.end + 1].token === endDelim.token + 1 &&
                 delimiters[i - 1].marker === startDelim.marker;

      ch = String.fromCharCode(startDelim.marker);

      token         = state.tokens[startDelim.token];
      token.type    = isStrong ? 'strong_open' : 'em_open';
      token.tag     = isStrong ? 'strong' : 'em';
      token.nesting = 1;
      token.markup  = isStrong ? ch + ch : ch;
      token.content = '';

      token         = state.tokens[endDelim.token];
      token.type    = isStrong ? 'strong_close' : 'em_close';
      token.tag     = isStrong ? 'strong' : 'em';
      token.nesting = -1;
      token.markup  = isStrong ? ch + ch : ch;
      token.content = '';

      if (isStrong) {
        state.tokens[delimiters[i - 1].token].content = '';
        state.tokens[delimiters[startDelim.end + 1].token].content = '';
        i--;
      }
    }
  }


  // Walk through delimiter list and replace text tokens with tags
  //
  var postProcess_1$1 = function emphasis(state) {
    var curr,
        tokens_meta = state.tokens_meta,
        max = state.tokens_meta.length;

    postProcess$1(state, state.delimiters);

    for (curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        postProcess$1(state, tokens_meta[curr].delimiters);
      }
    }
  };

  var emphasis = {
  	tokenize: tokenize$1,
  	postProcess: postProcess_1$1
  };

  var normalizeReference$1   = utils.normalizeReference;
  var isSpace$9              = utils.isSpace;


  var link = function link(state, silent) {
    var attrs,
        code,
        label,
        labelEnd,
        labelStart,
        pos,
        res,
        ref,
        title,
        token,
        href = '',
        oldPos = state.pos,
        max = state.posMax,
        start = state.pos,
        parseReference = true;

    if (state.src.charCodeAt(state.pos) !== 0x5B/* [ */) { return false; }

    labelStart = state.pos + 1;
    labelEnd = state.md.helpers.parseLinkLabel(state, state.pos, true);

    // parser failed to find ']', so it's not a valid link
    if (labelEnd < 0) { return false; }

    pos = labelEnd + 1;
    if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
      //
      // Inline link
      //

      // might have found a valid shortcut link, disable reference parsing
      parseReference = false;

      // [link](  <href>  "title"  )
      //        ^^ skipping these spaces
      pos++;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace$9(code) && code !== 0x0A) { break; }
      }
      if (pos >= max) { return false; }

      // [link](  <href>  "title"  )
      //          ^^^^^^ parsing link destination
      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
      if (res.ok) {
        href = state.md.normalizeLink(res.str);
        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = '';
        }
      }

      // [link](  <href>  "title"  )
      //                ^^ skipping these spaces
      start = pos;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace$9(code) && code !== 0x0A) { break; }
      }

      // [link](  <href>  "title"  )
      //                  ^^^^^^^ parsing link title
      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos;

        // [link](  <href>  "title"  )
        //                         ^^ skipping these spaces
        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);
          if (!isSpace$9(code) && code !== 0x0A) { break; }
        }
      } else {
        title = '';
      }

      if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
        // parsing a valid shortcut link failed, fallback to reference
        parseReference = true;
      }
      pos++;
    }

    if (parseReference) {
      //
      // Link reference
      //
      if (typeof state.env.references === 'undefined') { return false; }

      if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);
        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
        pos = labelEnd + 1;
      }

      // covers label === '' and label === undefined
      // (collapsed reference link and shortcut reference link respectively)
      if (!label) { label = state.src.slice(labelStart, labelEnd); }

      ref = state.env.references[normalizeReference$1(label)];
      if (!ref) {
        state.pos = oldPos;
        return false;
      }
      href = ref.href;
      title = ref.title;
    }

    //
    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //
    if (!silent) {
      state.pos = labelStart;
      state.posMax = labelEnd;

      token        = state.push('link_open', 'a', 1);
      token.attrs  = attrs = [ [ 'href', href ] ];
      if (title) {
        attrs.push([ 'title', title ]);
      }

      state.md.inline.tokenize(state);

      token        = state.push('link_close', 'a', -1);
    }

    state.pos = pos;
    state.posMax = max;
    return true;
  };

  var normalizeReference$2   = utils.normalizeReference;
  var isSpace$a              = utils.isSpace;


  var image$1 = function image(state, silent) {
    var attrs,
        code,
        content,
        label,
        labelEnd,
        labelStart,
        pos,
        ref,
        res,
        title,
        token,
        tokens,
        start,
        href = '',
        oldPos = state.pos,
        max = state.posMax;

    if (state.src.charCodeAt(state.pos) !== 0x21/* ! */) { return false; }
    if (state.src.charCodeAt(state.pos + 1) !== 0x5B/* [ */) { return false; }

    labelStart = state.pos + 2;
    labelEnd = state.md.helpers.parseLinkLabel(state, state.pos + 1, false);

    // parser failed to find ']', so it's not a valid link
    if (labelEnd < 0) { return false; }

    pos = labelEnd + 1;
    if (pos < max && state.src.charCodeAt(pos) === 0x28/* ( */) {
      //
      // Inline link
      //

      // [link](  <href>  "title"  )
      //        ^^ skipping these spaces
      pos++;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace$a(code) && code !== 0x0A) { break; }
      }
      if (pos >= max) { return false; }

      // [link](  <href>  "title"  )
      //          ^^^^^^ parsing link destination
      start = pos;
      res = state.md.helpers.parseLinkDestination(state.src, pos, state.posMax);
      if (res.ok) {
        href = state.md.normalizeLink(res.str);
        if (state.md.validateLink(href)) {
          pos = res.pos;
        } else {
          href = '';
        }
      }

      // [link](  <href>  "title"  )
      //                ^^ skipping these spaces
      start = pos;
      for (; pos < max; pos++) {
        code = state.src.charCodeAt(pos);
        if (!isSpace$a(code) && code !== 0x0A) { break; }
      }

      // [link](  <href>  "title"  )
      //                  ^^^^^^^ parsing link title
      res = state.md.helpers.parseLinkTitle(state.src, pos, state.posMax);
      if (pos < max && start !== pos && res.ok) {
        title = res.str;
        pos = res.pos;

        // [link](  <href>  "title"  )
        //                         ^^ skipping these spaces
        for (; pos < max; pos++) {
          code = state.src.charCodeAt(pos);
          if (!isSpace$a(code) && code !== 0x0A) { break; }
        }
      } else {
        title = '';
      }

      if (pos >= max || state.src.charCodeAt(pos) !== 0x29/* ) */) {
        state.pos = oldPos;
        return false;
      }
      pos++;
    } else {
      //
      // Link reference
      //
      if (typeof state.env.references === 'undefined') { return false; }

      if (pos < max && state.src.charCodeAt(pos) === 0x5B/* [ */) {
        start = pos + 1;
        pos = state.md.helpers.parseLinkLabel(state, pos);
        if (pos >= 0) {
          label = state.src.slice(start, pos++);
        } else {
          pos = labelEnd + 1;
        }
      } else {
        pos = labelEnd + 1;
      }

      // covers label === '' and label === undefined
      // (collapsed reference link and shortcut reference link respectively)
      if (!label) { label = state.src.slice(labelStart, labelEnd); }

      ref = state.env.references[normalizeReference$2(label)];
      if (!ref) {
        state.pos = oldPos;
        return false;
      }
      href = ref.href;
      title = ref.title;
    }

    //
    // We found the end of the link, and know for a fact it's a valid link;
    // so all that's left to do is to call tokenizer.
    //
    if (!silent) {
      content = state.src.slice(labelStart, labelEnd);

      state.md.inline.parse(
        content,
        state.md,
        state.env,
        tokens = []
      );

      token          = state.push('image', 'img', 0);
      token.attrs    = attrs = [ [ 'src', href ], [ 'alt', '' ] ];
      token.children = tokens;
      token.content  = content;

      if (title) {
        attrs.push([ 'title', title ]);
      }
    }

    state.pos = pos;
    state.posMax = max;
    return true;
  };

  // Process autolinks '<protocol:...>'


  /*eslint max-len:0*/
  var EMAIL_RE    = /^<([a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*)>/;
  var AUTOLINK_RE = /^<([a-zA-Z][a-zA-Z0-9+.\-]{1,31}):([^<>\x00-\x20]*)>/;


  var autolink = function autolink(state, silent) {
    var tail, linkMatch, emailMatch, url, fullUrl, token,
        pos = state.pos;

    if (state.src.charCodeAt(pos) !== 0x3C/* < */) { return false; }

    tail = state.src.slice(pos);

    if (tail.indexOf('>') < 0) { return false; }

    if (AUTOLINK_RE.test(tail)) {
      linkMatch = tail.match(AUTOLINK_RE);

      url = linkMatch[0].slice(1, -1);
      fullUrl = state.md.normalizeLink(url);
      if (!state.md.validateLink(fullUrl)) { return false; }

      if (!silent) {
        token         = state.push('link_open', 'a', 1);
        token.attrs   = [ [ 'href', fullUrl ] ];
        token.markup  = 'autolink';
        token.info    = 'auto';

        token         = state.push('text', '', 0);
        token.content = state.md.normalizeLinkText(url);

        token         = state.push('link_close', 'a', -1);
        token.markup  = 'autolink';
        token.info    = 'auto';
      }

      state.pos += linkMatch[0].length;
      return true;
    }

    if (EMAIL_RE.test(tail)) {
      emailMatch = tail.match(EMAIL_RE);

      url = emailMatch[0].slice(1, -1);
      fullUrl = state.md.normalizeLink('mailto:' + url);
      if (!state.md.validateLink(fullUrl)) { return false; }

      if (!silent) {
        token         = state.push('link_open', 'a', 1);
        token.attrs   = [ [ 'href', fullUrl ] ];
        token.markup  = 'autolink';
        token.info    = 'auto';

        token         = state.push('text', '', 0);
        token.content = state.md.normalizeLinkText(url);

        token         = state.push('link_close', 'a', -1);
        token.markup  = 'autolink';
        token.info    = 'auto';
      }

      state.pos += emailMatch[0].length;
      return true;
    }

    return false;
  };

  var HTML_TAG_RE$1 = html_re.HTML_TAG_RE;


  function isLetter(ch) {
    /*eslint no-bitwise:0*/
    var lc = ch | 0x20; // to lower case
    return (lc >= 0x61/* a */) && (lc <= 0x7a/* z */);
  }


  var html_inline = function html_inline(state, silent) {
    var ch, match, max, token,
        pos = state.pos;

    if (!state.md.options.html) { return false; }

    // Check start
    max = state.posMax;
    if (state.src.charCodeAt(pos) !== 0x3C/* < */ ||
        pos + 2 >= max) {
      return false;
    }

    // Quick fail on second char
    ch = state.src.charCodeAt(pos + 1);
    if (ch !== 0x21/* ! */ &&
        ch !== 0x3F/* ? */ &&
        ch !== 0x2F/* / */ &&
        !isLetter(ch)) {
      return false;
    }

    match = state.src.slice(pos).match(HTML_TAG_RE$1);
    if (!match) { return false; }

    if (!silent) {
      token         = state.push('html_inline', '', 0);
      token.content = state.src.slice(pos, pos + match[0].length);
    }
    state.pos += match[0].length;
    return true;
  };

  var has$2               = utils.has;
  var isValidEntityCode = utils.isValidEntityCode;
  var fromCodePoint     = utils.fromCodePoint;


  var DIGITAL_RE = /^&#((?:x[a-f0-9]{1,6}|[0-9]{1,7}));/i;
  var NAMED_RE   = /^&([a-z][a-z0-9]{1,31});/i;


  var entity = function entity(state, silent) {
    var ch, code, match, pos = state.pos, max = state.posMax;

    if (state.src.charCodeAt(pos) !== 0x26/* & */) { return false; }

    if (pos + 1 < max) {
      ch = state.src.charCodeAt(pos + 1);

      if (ch === 0x23 /* # */) {
        match = state.src.slice(pos).match(DIGITAL_RE);
        if (match) {
          if (!silent) {
            code = match[1][0].toLowerCase() === 'x' ? parseInt(match[1].slice(1), 16) : parseInt(match[1], 10);
            state.pending += isValidEntityCode(code) ? fromCodePoint(code) : fromCodePoint(0xFFFD);
          }
          state.pos += match[0].length;
          return true;
        }
      } else {
        match = state.src.slice(pos).match(NAMED_RE);
        if (match) {
          if (has$2(entities, match[1])) {
            if (!silent) { state.pending += entities[match[1]]; }
            state.pos += match[0].length;
            return true;
          }
        }
      }
    }

    if (!silent) { state.pending += '&'; }
    state.pos++;
    return true;
  };

  // For each opening emphasis-like marker find a matching closing one


  function processDelimiters(state, delimiters) {
    var closerIdx, openerIdx, closer, opener, minOpenerIdx, newMinOpenerIdx,
        isOddMatch, lastJump,
        openersBottom = {},
        max = delimiters.length;

    for (closerIdx = 0; closerIdx < max; closerIdx++) {
      closer = delimiters[closerIdx];

      // Length is only used for emphasis-specific "rule of 3",
      // if it's not defined (in strikethrough or 3rd party plugins),
      // we can default it to 0 to disable those checks.
      //
      closer.length = closer.length || 0;

      if (!closer.close) continue;

      // Previously calculated lower bounds (previous fails)
      // for each marker and each delimiter length modulo 3.
      if (!openersBottom.hasOwnProperty(closer.marker)) {
        openersBottom[closer.marker] = [ -1, -1, -1 ];
      }

      minOpenerIdx = openersBottom[closer.marker][closer.length % 3];
      newMinOpenerIdx = -1;

      openerIdx = closerIdx - closer.jump - 1;

      for (; openerIdx > minOpenerIdx; openerIdx -= opener.jump + 1) {
        opener = delimiters[openerIdx];

        if (opener.marker !== closer.marker) continue;

        if (newMinOpenerIdx === -1) newMinOpenerIdx = openerIdx;

        if (opener.open && opener.end < 0) {

          isOddMatch = false;

          // from spec:
          //
          // If one of the delimiters can both open and close emphasis, then the
          // sum of the lengths of the delimiter runs containing the opening and
          // closing delimiters must not be a multiple of 3 unless both lengths
          // are multiples of 3.
          //
          if (opener.close || closer.open) {
            if ((opener.length + closer.length) % 3 === 0) {
              if (opener.length % 3 !== 0 || closer.length % 3 !== 0) {
                isOddMatch = true;
              }
            }
          }

          if (!isOddMatch) {
            // If previous delimiter cannot be an opener, we can safely skip
            // the entire sequence in future checks. This is required to make
            // sure algorithm has linear complexity (see *_*_*_*_*_... case).
            //
            lastJump = openerIdx > 0 && !delimiters[openerIdx - 1].open ?
              delimiters[openerIdx - 1].jump + 1 :
              0;

            closer.jump  = closerIdx - openerIdx + lastJump;
            closer.open  = false;
            opener.end   = closerIdx;
            opener.jump  = lastJump;
            opener.close = false;
            newMinOpenerIdx = -1;
            break;
          }
        }
      }

      if (newMinOpenerIdx !== -1) {
        // If match for this delimiter run failed, we want to set lower bound for
        // future lookups. This is required to make sure algorithm has linear
        // complexity.
        //
        // See details here:
        // https://github.com/commonmark/cmark/issues/178#issuecomment-270417442
        //
        openersBottom[closer.marker][(closer.length || 0) % 3] = newMinOpenerIdx;
      }
    }
  }


  var balance_pairs = function link_pairs(state) {
    var curr,
        tokens_meta = state.tokens_meta,
        max = state.tokens_meta.length;

    processDelimiters(state, state.delimiters);

    for (curr = 0; curr < max; curr++) {
      if (tokens_meta[curr] && tokens_meta[curr].delimiters) {
        processDelimiters(state, tokens_meta[curr].delimiters);
      }
    }
  };

  // Clean up tokens after emphasis and strikethrough postprocessing:


  var text_collapse = function text_collapse(state) {
    var curr, last,
        level = 0,
        tokens = state.tokens,
        max = state.tokens.length;

    for (curr = last = 0; curr < max; curr++) {
      // re-calculate levels after emphasis/strikethrough turns some text nodes
      // into opening/closing tags
      if (tokens[curr].nesting < 0) level--; // closing tag
      tokens[curr].level = level;
      if (tokens[curr].nesting > 0) level++; // opening tag

      if (tokens[curr].type === 'text' &&
          curr + 1 < max &&
          tokens[curr + 1].type === 'text') {

        // collapse two adjacent text nodes
        tokens[curr + 1].content = tokens[curr].content + tokens[curr + 1].content;
      } else {
        if (curr !== last) { tokens[last] = tokens[curr]; }

        last++;
      }
    }

    if (curr !== last) {
      tokens.length = last;
    }
  };

  var isWhiteSpace$1   = utils.isWhiteSpace;
  var isPunctChar$1    = utils.isPunctChar;
  var isMdAsciiPunct$1 = utils.isMdAsciiPunct;


  function StateInline(src, md, env, outTokens) {
    this.src = src;
    this.env = env;
    this.md = md;
    this.tokens = outTokens;
    this.tokens_meta = Array(outTokens.length);

    this.pos = 0;
    this.posMax = this.src.length;
    this.level = 0;
    this.pending = '';
    this.pendingLevel = 0;

    // Stores { start: end } pairs. Useful for backtrack
    // optimization of pairs parse (emphasis, strikes).
    this.cache = {};

    // List of emphasis-like delimiters for current tag
    this.delimiters = [];

    // Stack of delimiter lists for upper level tags
    this._prev_delimiters = [];
  }


  // Flush pending text
  //
  StateInline.prototype.pushPending = function () {
    var token$1 = new token('text', '', 0);
    token$1.content = this.pending;
    token$1.level = this.pendingLevel;
    this.tokens.push(token$1);
    this.pending = '';
    return token$1;
  };


  // Push new token to "stream".
  // If pending text exists - flush it as text token
  //
  StateInline.prototype.push = function (type, tag, nesting) {
    if (this.pending) {
      this.pushPending();
    }

    var token$1 = new token(type, tag, nesting);
    var token_meta = null;

    if (nesting < 0) {
      // closing tag
      this.level--;
      this.delimiters = this._prev_delimiters.pop();
    }

    token$1.level = this.level;

    if (nesting > 0) {
      // opening tag
      this.level++;
      this._prev_delimiters.push(this.delimiters);
      this.delimiters = [];
      token_meta = { delimiters: this.delimiters };
    }

    this.pendingLevel = this.level;
    this.tokens.push(token$1);
    this.tokens_meta.push(token_meta);
    return token$1;
  };


  // Scan a sequence of emphasis-like markers, and determine whether
  // it can start an emphasis sequence or end an emphasis sequence.
  //
  //  - start - position to scan from (it should point at a valid marker);
  //  - canSplitWord - determine if these markers can be found inside a word
  //
  StateInline.prototype.scanDelims = function (start, canSplitWord) {
    var pos = start, lastChar, nextChar, count, can_open, can_close,
        isLastWhiteSpace, isLastPunctChar,
        isNextWhiteSpace, isNextPunctChar,
        left_flanking = true,
        right_flanking = true,
        max = this.posMax,
        marker = this.src.charCodeAt(start);

    // treat beginning of the line as a whitespace
    lastChar = start > 0 ? this.src.charCodeAt(start - 1) : 0x20;

    while (pos < max && this.src.charCodeAt(pos) === marker) { pos++; }

    count = pos - start;

    // treat end of the line as a whitespace
    nextChar = pos < max ? this.src.charCodeAt(pos) : 0x20;

    isLastPunctChar = isMdAsciiPunct$1(lastChar) || isPunctChar$1(String.fromCharCode(lastChar));
    isNextPunctChar = isMdAsciiPunct$1(nextChar) || isPunctChar$1(String.fromCharCode(nextChar));

    isLastWhiteSpace = isWhiteSpace$1(lastChar);
    isNextWhiteSpace = isWhiteSpace$1(nextChar);

    if (isNextWhiteSpace) {
      left_flanking = false;
    } else if (isNextPunctChar) {
      if (!(isLastWhiteSpace || isLastPunctChar)) {
        left_flanking = false;
      }
    }

    if (isLastWhiteSpace) {
      right_flanking = false;
    } else if (isLastPunctChar) {
      if (!(isNextWhiteSpace || isNextPunctChar)) {
        right_flanking = false;
      }
    }

    if (!canSplitWord) {
      can_open  = left_flanking  && (!right_flanking || isLastPunctChar);
      can_close = right_flanking && (!left_flanking  || isNextPunctChar);
    } else {
      can_open  = left_flanking;
      can_close = right_flanking;
    }

    return {
      can_open:  can_open,
      can_close: can_close,
      length:    count
    };
  };


  // re-export Token class to use in block rules
  StateInline.prototype.Token = token;


  var state_inline = StateInline;

  ////////////////////////////////////////////////////////////////////////////////
  // Parser rules

  var _rules$2 = [
    [ 'text',            text ],
    [ 'newline',         newline ],
    [ 'escape',          _escape ],
    [ 'backticks',       backticks ],
    [ 'strikethrough',   strikethrough.tokenize ],
    [ 'emphasis',        emphasis.tokenize ],
    [ 'link',            link ],
    [ 'image',           image$1 ],
    [ 'autolink',        autolink ],
    [ 'html_inline',     html_inline ],
    [ 'entity',          entity ]
  ];

  var _rules2 = [
    [ 'balance_pairs',   balance_pairs ],
    [ 'strikethrough',   strikethrough.postProcess ],
    [ 'emphasis',        emphasis.postProcess ],
    [ 'text_collapse',   text_collapse ]
  ];


  /**
   * new ParserInline()
   **/
  function ParserInline() {
    var i;

    /**
     * ParserInline#ruler -> Ruler
     *
     * [[Ruler]] instance. Keep configuration of inline rules.
     **/
    this.ruler = new ruler();

    for (i = 0; i < _rules$2.length; i++) {
      this.ruler.push(_rules$2[i][0], _rules$2[i][1]);
    }

    /**
     * ParserInline#ruler2 -> Ruler
     *
     * [[Ruler]] instance. Second ruler used for post-processing
     * (e.g. in emphasis-like rules).
     **/
    this.ruler2 = new ruler();

    for (i = 0; i < _rules2.length; i++) {
      this.ruler2.push(_rules2[i][0], _rules2[i][1]);
    }
  }


  // Skip single token by running all rules in validation mode;
  // returns `true` if any rule reported success
  //
  ParserInline.prototype.skipToken = function (state) {
    var ok, i, pos = state.pos,
        rules = this.ruler.getRules(''),
        len = rules.length,
        maxNesting = state.md.options.maxNesting,
        cache = state.cache;


    if (typeof cache[pos] !== 'undefined') {
      state.pos = cache[pos];
      return;
    }

    if (state.level < maxNesting) {
      for (i = 0; i < len; i++) {
        // Increment state.level and decrement it later to limit recursion.
        // It's harmless to do here, because no tokens are created. But ideally,
        // we'd need a separate private state variable for this purpose.
        //
        state.level++;
        ok = rules[i](state, true);
        state.level--;

        if (ok) { break; }
      }
    } else {
      // Too much nesting, just skip until the end of the paragraph.
      //
      // NOTE: this will cause links to behave incorrectly in the following case,
      //       when an amount of `[` is exactly equal to `maxNesting + 1`:
      //
      //       [[[[[[[[[[[[[[[[[[[[[foo]()
      //
      // TODO: remove this workaround when CM standard will allow nested links
      //       (we can replace it by preventing links from being parsed in
      //       validation mode)
      //
      state.pos = state.posMax;
    }

    if (!ok) { state.pos++; }
    cache[pos] = state.pos;
  };


  // Generate tokens for input range
  //
  ParserInline.prototype.tokenize = function (state) {
    var ok, i,
        rules = this.ruler.getRules(''),
        len = rules.length,
        end = state.posMax,
        maxNesting = state.md.options.maxNesting;

    while (state.pos < end) {
      // Try all possible rules.
      // On success, rule should:
      //
      // - update `state.pos`
      // - update `state.tokens`
      // - return true

      if (state.level < maxNesting) {
        for (i = 0; i < len; i++) {
          ok = rules[i](state, false);
          if (ok) { break; }
        }
      }

      if (ok) {
        if (state.pos >= end) { break; }
        continue;
      }

      state.pending += state.src[state.pos++];
    }

    if (state.pending) {
      state.pushPending();
    }
  };


  /**
   * ParserInline.parse(str, md, env, outTokens)
   *
   * Process input string and push inline tokens into `outTokens`
   **/
  ParserInline.prototype.parse = function (str, md, env, outTokens) {
    var i, rules, len;
    var state = new this.State(str, md, env, outTokens);

    this.tokenize(state);

    rules = this.ruler2.getRules('');
    len = rules.length;

    for (i = 0; i < len; i++) {
      rules[i](state);
    }
  };


  ParserInline.prototype.State = state_inline;


  var parser_inline = ParserInline;

  var re = function (opts) {
    var re = {};

    // Use direct extract instead of `regenerate` to reduse browserified size
    re.src_Any = regex$1.source;
    re.src_Cc  = regex$2.source;
    re.src_Z   = regex$4.source;
    re.src_P   = regex.source;

    // \p{\Z\P\Cc\CF} (white spaces + control + format + punctuation)
    re.src_ZPCc = [ re.src_Z, re.src_P, re.src_Cc ].join('|');

    // \p{\Z\Cc} (white spaces + control)
    re.src_ZCc = [ re.src_Z, re.src_Cc ].join('|');

    // Experimental. List of chars, completely prohibited in links
    // because can separate it from other part of text
    var text_separators = '[><\uff5c]';

    // All possible word characters (everything without punctuation, spaces & controls)
    // Defined via punctuation & spaces to save space
    // Should be something like \p{\L\N\S\M} (\w but without `_`)
    re.src_pseudo_letter       = '(?:(?!' + text_separators + '|' + re.src_ZPCc + ')' + re.src_Any + ')';
    // The same as abothe but without [0-9]
    // var src_pseudo_letter_non_d = '(?:(?![0-9]|' + src_ZPCc + ')' + src_Any + ')';

    ////////////////////////////////////////////////////////////////////////////////

    re.src_ip4 =

      '(?:(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)';

    // Prohibit any of "@/[]()" in user/pass to avoid wrong domain fetch.
    re.src_auth    = '(?:(?:(?!' + re.src_ZCc + '|[@/\\[\\]()]).)+@)?';

    re.src_port =

      '(?::(?:6(?:[0-4]\\d{3}|5(?:[0-4]\\d{2}|5(?:[0-2]\\d|3[0-5])))|[1-5]?\\d{1,4}))?';

    re.src_host_terminator =

      '(?=$|' + text_separators + '|' + re.src_ZPCc + ')(?!-|_|:\\d|\\.-|\\.(?!$|' + re.src_ZPCc + '))';

    re.src_path =

      '(?:' +
        '[/?#]' +
          '(?:' +
            '(?!' + re.src_ZCc + '|' + text_separators + '|[()[\\]{}.,"\'?!\\-]).|' +
            '\\[(?:(?!' + re.src_ZCc + '|\\]).)*\\]|' +
            '\\((?:(?!' + re.src_ZCc + '|[)]).)*\\)|' +
            '\\{(?:(?!' + re.src_ZCc + '|[}]).)*\\}|' +
            '\\"(?:(?!' + re.src_ZCc + '|["]).)+\\"|' +
            "\\'(?:(?!" + re.src_ZCc + "|[']).)+\\'|" +
            "\\'(?=" + re.src_pseudo_letter + '|[-]).|' +  // allow `I'm_king` if no pair found
            '\\.{2,}[a-zA-Z0-9%/&]|' + // google has many dots in "google search" links (#66, #81).
                                       // github has ... in commit range links,
                                       // Restrict to
                                       // - english
                                       // - percent-encoded
                                       // - parts of file path
                                       // - params separator
                                       // until more examples found.
            '\\.(?!' + re.src_ZCc + '|[.]).|' +
            (opts && opts['---'] ?
              '\\-(?!--(?:[^-]|$))(?:-*)|' // `---` => long dash, terminate
              :
              '\\-+|'
            ) +
            '\\,(?!' + re.src_ZCc + ').|' +       // allow `,,,` in paths
            '\\!+(?!' + re.src_ZCc + '|[!]).|' +  // allow `!!!` in paths, but not at the end
            '\\?(?!' + re.src_ZCc + '|[?]).' +
          ')+' +
        '|\\/' +
      ')?';

    // Allow anything in markdown spec, forbid quote (") at the first position
    // because emails enclosed in quotes are far more common
    re.src_email_name =

      '[\\-;:&=\\+\\$,\\.a-zA-Z0-9_][\\-;:&=\\+\\$,\\"\\.a-zA-Z0-9_]*';

    re.src_xn =

      'xn--[a-z0-9\\-]{1,59}';

    // More to read about domain names
    // http://serverfault.com/questions/638260/

    re.src_domain_root =

      // Allow letters & digits (http://test1)
      '(?:' +
        re.src_xn +
        '|' +
        re.src_pseudo_letter + '{1,63}' +
      ')';

    re.src_domain =

      '(?:' +
        re.src_xn +
        '|' +
        '(?:' + re.src_pseudo_letter + ')' +
        '|' +
        '(?:' + re.src_pseudo_letter + '(?:-|' + re.src_pseudo_letter + '){0,61}' + re.src_pseudo_letter + ')' +
      ')';

    re.src_host =

      '(?:' +
      // Don't need IP check, because digits are already allowed in normal domain names
      //   src_ip4 +
      // '|' +
        '(?:(?:(?:' + re.src_domain + ')\\.)*' + re.src_domain/*_root*/ + ')' +
      ')';

    re.tpl_host_fuzzy =

      '(?:' +
        re.src_ip4 +
      '|' +
        '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))' +
      ')';

    re.tpl_host_no_ip_fuzzy =

      '(?:(?:(?:' + re.src_domain + ')\\.)+(?:%TLDS%))';

    re.src_host_strict =

      re.src_host + re.src_host_terminator;

    re.tpl_host_fuzzy_strict =

      re.tpl_host_fuzzy + re.src_host_terminator;

    re.src_host_port_strict =

      re.src_host + re.src_port + re.src_host_terminator;

    re.tpl_host_port_fuzzy_strict =

      re.tpl_host_fuzzy + re.src_port + re.src_host_terminator;

    re.tpl_host_port_no_ip_fuzzy_strict =

      re.tpl_host_no_ip_fuzzy + re.src_port + re.src_host_terminator;


    ////////////////////////////////////////////////////////////////////////////////
    // Main rules

    // Rude test fuzzy links by host, for quick deny
    re.tpl_host_fuzzy_test =

      'localhost|www\\.|\\.\\d{1,3}\\.|(?:\\.(?:%TLDS%)(?:' + re.src_ZPCc + '|>|$))';

    re.tpl_email_fuzzy =

        '(^|' + text_separators + '|"|\\(|' + re.src_ZCc + ')' +
        '(' + re.src_email_name + '@' + re.tpl_host_fuzzy_strict + ')';

    re.tpl_link_fuzzy =
        // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
        '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_fuzzy_strict + re.src_path + ')';

    re.tpl_link_no_ip_fuzzy =
        // Fuzzy link can't be prepended with .:/\- and non punctuation.
        // but can start with > (markdown blockquote)
        '(^|(?![.:/\\-_@])(?:[$+<=>^`|\uff5c]|' + re.src_ZPCc + '))' +
        '((?![$+<=>^`|\uff5c])' + re.tpl_host_port_no_ip_fuzzy_strict + re.src_path + ')';

    return re;
  };

  ////////////////////////////////////////////////////////////////////////////////
  // Helpers

  // Merge objects
  //
  function assign$1(obj /*from1, from2, from3, ...*/) {
    var sources = Array.prototype.slice.call(arguments, 1);

    sources.forEach(function (source) {
      if (!source) { return; }

      Object.keys(source).forEach(function (key) {
        obj[key] = source[key];
      });
    });

    return obj;
  }

  function _class(obj) { return Object.prototype.toString.call(obj); }
  function isString(obj) { return _class(obj) === '[object String]'; }
  function isObject$1(obj) { return _class(obj) === '[object Object]'; }
  function isRegExp(obj) { return _class(obj) === '[object RegExp]'; }
  function isFunction(obj) { return _class(obj) === '[object Function]'; }


  function escapeRE(str) { return str.replace(/[.?*+^$[\]\\(){}|-]/g, '\\$&'); }

  ////////////////////////////////////////////////////////////////////////////////


  var defaultOptions = {
    fuzzyLink: true,
    fuzzyEmail: true,
    fuzzyIP: false
  };


  function isOptionsObj(obj) {
    return Object.keys(obj || {}).reduce(function (acc, k) {
      return acc || defaultOptions.hasOwnProperty(k);
    }, false);
  }


  var defaultSchemas = {
    'http:': {
      validate: function (text, pos, self) {
        var tail = text.slice(pos);

        if (!self.re.http) {
          // compile lazily, because "host"-containing variables can change on tlds update.
          self.re.http =  new RegExp(
            '^\\/\\/' + self.re.src_auth + self.re.src_host_port_strict + self.re.src_path, 'i'
          );
        }
        if (self.re.http.test(tail)) {
          return tail.match(self.re.http)[0].length;
        }
        return 0;
      }
    },
    'https:':  'http:',
    'ftp:':    'http:',
    '//':      {
      validate: function (text, pos, self) {
        var tail = text.slice(pos);

        if (!self.re.no_http) {
        // compile lazily, because "host"-containing variables can change on tlds update.
          self.re.no_http =  new RegExp(
            '^' +
            self.re.src_auth +
            // Don't allow single-level domains, because of false positives like '//test'
            // with code comments
            '(?:localhost|(?:(?:' + self.re.src_domain + ')\\.)+' + self.re.src_domain_root + ')' +
            self.re.src_port +
            self.re.src_host_terminator +
            self.re.src_path,

            'i'
          );
        }

        if (self.re.no_http.test(tail)) {
          // should not be `://` & `///`, that protects from errors in protocol name
          if (pos >= 3 && text[pos - 3] === ':') { return 0; }
          if (pos >= 3 && text[pos - 3] === '/') { return 0; }
          return tail.match(self.re.no_http)[0].length;
        }
        return 0;
      }
    },
    'mailto:': {
      validate: function (text, pos, self) {
        var tail = text.slice(pos);

        if (!self.re.mailto) {
          self.re.mailto =  new RegExp(
            '^' + self.re.src_email_name + '@' + self.re.src_host_strict, 'i'
          );
        }
        if (self.re.mailto.test(tail)) {
          return tail.match(self.re.mailto)[0].length;
        }
        return 0;
      }
    }
  };

  /*eslint-disable max-len*/

  // RE pattern for 2-character tlds (autogenerated by ./support/tlds_2char_gen.js)
  var tlds_2ch_src_re = 'a[cdefgilmnoqrstuwxz]|b[abdefghijmnorstvwyz]|c[acdfghiklmnoruvwxyz]|d[ejkmoz]|e[cegrstu]|f[ijkmor]|g[abdefghilmnpqrstuwy]|h[kmnrtu]|i[delmnoqrst]|j[emop]|k[eghimnprwyz]|l[abcikrstuvy]|m[acdeghklmnopqrstuvwxyz]|n[acefgilopruz]|om|p[aefghklmnrstwy]|qa|r[eosuw]|s[abcdeghijklmnortuvxyz]|t[cdfghjklmnortvwz]|u[agksyz]|v[aceginu]|w[fs]|y[et]|z[amw]';

  // DON'T try to make PRs with changes. Extend TLDs with LinkifyIt.tlds() instead
  var tlds_default = 'biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф'.split('|');

  /*eslint-enable max-len*/

  ////////////////////////////////////////////////////////////////////////////////

  function resetScanCache(self) {
    self.__index__ = -1;
    self.__text_cache__   = '';
  }

  function createValidator(re) {
    return function (text, pos) {
      var tail = text.slice(pos);

      if (re.test(tail)) {
        return tail.match(re)[0].length;
      }
      return 0;
    };
  }

  function createNormalizer() {
    return function (match, self) {
      self.normalize(match);
    };
  }

  // Schemas compiler. Build regexps.
  //
  function compile(self) {

    // Load & clone RE patterns.
    var re$1 = self.re = re(self.__opts__);

    // Define dynamic patterns
    var tlds = self.__tlds__.slice();

    self.onCompile();

    if (!self.__tlds_replaced__) {
      tlds.push(tlds_2ch_src_re);
    }
    tlds.push(re$1.src_xn);

    re$1.src_tlds = tlds.join('|');

    function untpl(tpl) { return tpl.replace('%TLDS%', re$1.src_tlds); }

    re$1.email_fuzzy      = RegExp(untpl(re$1.tpl_email_fuzzy), 'i');
    re$1.link_fuzzy       = RegExp(untpl(re$1.tpl_link_fuzzy), 'i');
    re$1.link_no_ip_fuzzy = RegExp(untpl(re$1.tpl_link_no_ip_fuzzy), 'i');
    re$1.host_fuzzy_test  = RegExp(untpl(re$1.tpl_host_fuzzy_test), 'i');

    //
    // Compile each schema
    //

    var aliases = [];

    self.__compiled__ = {}; // Reset compiled data

    function schemaError(name, val) {
      throw new Error('(LinkifyIt) Invalid schema "' + name + '": ' + val);
    }

    Object.keys(self.__schemas__).forEach(function (name) {
      var val = self.__schemas__[name];

      // skip disabled methods
      if (val === null) { return; }

      var compiled = { validate: null, link: null };

      self.__compiled__[name] = compiled;

      if (isObject$1(val)) {
        if (isRegExp(val.validate)) {
          compiled.validate = createValidator(val.validate);
        } else if (isFunction(val.validate)) {
          compiled.validate = val.validate;
        } else {
          schemaError(name, val);
        }

        if (isFunction(val.normalize)) {
          compiled.normalize = val.normalize;
        } else if (!val.normalize) {
          compiled.normalize = createNormalizer();
        } else {
          schemaError(name, val);
        }

        return;
      }

      if (isString(val)) {
        aliases.push(name);
        return;
      }

      schemaError(name, val);
    });

    //
    // Compile postponed aliases
    //

    aliases.forEach(function (alias) {
      if (!self.__compiled__[self.__schemas__[alias]]) {
        // Silently fail on missed schemas to avoid errons on disable.
        // schemaError(alias, self.__schemas__[alias]);
        return;
      }

      self.__compiled__[alias].validate =
        self.__compiled__[self.__schemas__[alias]].validate;
      self.__compiled__[alias].normalize =
        self.__compiled__[self.__schemas__[alias]].normalize;
    });

    //
    // Fake record for guessed links
    //
    self.__compiled__[''] = { validate: null, normalize: createNormalizer() };

    //
    // Build schema condition
    //
    var slist = Object.keys(self.__compiled__)
                        .filter(function (name) {
                          // Filter disabled & fake schemas
                          return name.length > 0 && self.__compiled__[name];
                        })
                        .map(escapeRE)
                        .join('|');
    // (?!_) cause 1.5x slowdown
    self.re.schema_test   = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'i');
    self.re.schema_search = RegExp('(^|(?!_)(?:[><\uff5c]|' + re$1.src_ZPCc + '))(' + slist + ')', 'ig');

    self.re.pretest = RegExp(
      '(' + self.re.schema_test.source + ')|(' + self.re.host_fuzzy_test.source + ')|@',
      'i'
    );

    //
    // Cleanup
    //

    resetScanCache(self);
  }

  /**
   * class Match
   *
   * Match result. Single element of array, returned by [[LinkifyIt#match]]
   **/
  function Match(self, shift) {
    var start = self.__index__,
        end   = self.__last_index__,
        text  = self.__text_cache__.slice(start, end);

    /**
     * Match#schema -> String
     *
     * Prefix (protocol) for matched string.
     **/
    this.schema    = self.__schema__.toLowerCase();
    /**
     * Match#index -> Number
     *
     * First position of matched string.
     **/
    this.index     = start + shift;
    /**
     * Match#lastIndex -> Number
     *
     * Next position after matched string.
     **/
    this.lastIndex = end + shift;
    /**
     * Match#raw -> String
     *
     * Matched string.
     **/
    this.raw       = text;
    /**
     * Match#text -> String
     *
     * Notmalized text of matched string.
     **/
    this.text      = text;
    /**
     * Match#url -> String
     *
     * Normalized url of matched string.
     **/
    this.url       = text;
  }

  function createMatch(self, shift) {
    var match = new Match(self, shift);

    self.__compiled__[match.schema].normalize(match, self);

    return match;
  }


  /**
   * class LinkifyIt
   **/

  /**
   * new LinkifyIt(schemas, options)
   * - schemas (Object): Optional. Additional schemas to validate (prefix/validator)
   * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
   *
   * Creates new linkifier instance with optional additional schemas.
   * Can be called without `new` keyword for convenience.
   *
   * By default understands:
   *
   * - `http(s)://...` , `ftp://...`, `mailto:...` & `//...` links
   * - "fuzzy" links and emails (example.com, foo@bar.com).
   *
   * `schemas` is an object, where each key/value describes protocol/rule:
   *
   * - __key__ - link prefix (usually, protocol name with `:` at the end, `skype:`
   *   for example). `linkify-it` makes shure that prefix is not preceeded with
   *   alphanumeric char and symbols. Only whitespaces and punctuation allowed.
   * - __value__ - rule to check tail after link prefix
   *   - _String_ - just alias to existing rule
   *   - _Object_
   *     - _validate_ - validator function (should return matched length on success),
   *       or `RegExp`.
   *     - _normalize_ - optional function to normalize text & url of matched result
   *       (for example, for @twitter mentions).
   *
   * `options`:
   *
   * - __fuzzyLink__ - recognige URL-s without `http(s):` prefix. Default `true`.
   * - __fuzzyIP__ - allow IPs in fuzzy links above. Can conflict with some texts
   *   like version numbers. Default `false`.
   * - __fuzzyEmail__ - recognize emails without `mailto:` prefix.
   *
   **/
  function LinkifyIt(schemas, options) {
    if (!(this instanceof LinkifyIt)) {
      return new LinkifyIt(schemas, options);
    }

    if (!options) {
      if (isOptionsObj(schemas)) {
        options = schemas;
        schemas = {};
      }
    }

    this.__opts__           = assign$1({}, defaultOptions, options);

    // Cache last tested result. Used to skip repeating steps on next `match` call.
    this.__index__          = -1;
    this.__last_index__     = -1; // Next scan position
    this.__schema__         = '';
    this.__text_cache__     = '';

    this.__schemas__        = assign$1({}, defaultSchemas, schemas);
    this.__compiled__       = {};

    this.__tlds__           = tlds_default;
    this.__tlds_replaced__  = false;

    this.re = {};

    compile(this);
  }


  /** chainable
   * LinkifyIt#add(schema, definition)
   * - schema (String): rule name (fixed pattern prefix)
   * - definition (String|RegExp|Object): schema definition
   *
   * Add new rule definition. See constructor description for details.
   **/
  LinkifyIt.prototype.add = function add(schema, definition) {
    this.__schemas__[schema] = definition;
    compile(this);
    return this;
  };


  /** chainable
   * LinkifyIt#set(options)
   * - options (Object): { fuzzyLink|fuzzyEmail|fuzzyIP: true|false }
   *
   * Set recognition options for links without schema.
   **/
  LinkifyIt.prototype.set = function set(options) {
    this.__opts__ = assign$1(this.__opts__, options);
    return this;
  };


  /**
   * LinkifyIt#test(text) -> Boolean
   *
   * Searches linkifiable pattern and returns `true` on success or `false` on fail.
   **/
  LinkifyIt.prototype.test = function test(text) {
    // Reset scan cache
    this.__text_cache__ = text;
    this.__index__      = -1;

    if (!text.length) { return false; }

    var m, ml, me, len, shift, next, re, tld_pos, at_pos;

    // try to scan for link with schema - that's the most simple rule
    if (this.re.schema_test.test(text)) {
      re = this.re.schema_search;
      re.lastIndex = 0;
      while ((m = re.exec(text)) !== null) {
        len = this.testSchemaAt(text, m[2], re.lastIndex);
        if (len) {
          this.__schema__     = m[2];
          this.__index__      = m.index + m[1].length;
          this.__last_index__ = m.index + m[0].length + len;
          break;
        }
      }
    }

    if (this.__opts__.fuzzyLink && this.__compiled__['http:']) {
      // guess schemaless links
      tld_pos = text.search(this.re.host_fuzzy_test);
      if (tld_pos >= 0) {
        // if tld is located after found link - no need to check fuzzy pattern
        if (this.__index__ < 0 || tld_pos < this.__index__) {
          if ((ml = text.match(this.__opts__.fuzzyIP ? this.re.link_fuzzy : this.re.link_no_ip_fuzzy)) !== null) {

            shift = ml.index + ml[1].length;

            if (this.__index__ < 0 || shift < this.__index__) {
              this.__schema__     = '';
              this.__index__      = shift;
              this.__last_index__ = ml.index + ml[0].length;
            }
          }
        }
      }
    }

    if (this.__opts__.fuzzyEmail && this.__compiled__['mailto:']) {
      // guess schemaless emails
      at_pos = text.indexOf('@');
      if (at_pos >= 0) {
        // We can't skip this check, because this cases are possible:
        // 192.168.1.1@gmail.com, my.in@example.com
        if ((me = text.match(this.re.email_fuzzy)) !== null) {

          shift = me.index + me[1].length;
          next  = me.index + me[0].length;

          if (this.__index__ < 0 || shift < this.__index__ ||
              (shift === this.__index__ && next > this.__last_index__)) {
            this.__schema__     = 'mailto:';
            this.__index__      = shift;
            this.__last_index__ = next;
          }
        }
      }
    }

    return this.__index__ >= 0;
  };


  /**
   * LinkifyIt#pretest(text) -> Boolean
   *
   * Very quick check, that can give false positives. Returns true if link MAY BE
   * can exists. Can be used for speed optimization, when you need to check that
   * link NOT exists.
   **/
  LinkifyIt.prototype.pretest = function pretest(text) {
    return this.re.pretest.test(text);
  };


  /**
   * LinkifyIt#testSchemaAt(text, name, position) -> Number
   * - text (String): text to scan
   * - name (String): rule (schema) name
   * - position (Number): text offset to check from
   *
   * Similar to [[LinkifyIt#test]] but checks only specific protocol tail exactly
   * at given position. Returns length of found pattern (0 on fail).
   **/
  LinkifyIt.prototype.testSchemaAt = function testSchemaAt(text, schema, pos) {
    // If not supported schema check requested - terminate
    if (!this.__compiled__[schema.toLowerCase()]) {
      return 0;
    }
    return this.__compiled__[schema.toLowerCase()].validate(text, pos, this);
  };


  /**
   * LinkifyIt#match(text) -> Array|null
   *
   * Returns array of found link descriptions or `null` on fail. We strongly
   * recommend to use [[LinkifyIt#test]] first, for best speed.
   *
   * ##### Result match description
   *
   * - __schema__ - link schema, can be empty for fuzzy links, or `//` for
   *   protocol-neutral  links.
   * - __index__ - offset of matched text
   * - __lastIndex__ - index of next char after mathch end
   * - __raw__ - matched text
   * - __text__ - normalized text
   * - __url__ - link, generated from matched text
   **/
  LinkifyIt.prototype.match = function match(text) {
    var shift = 0, result = [];

    // Try to take previous element from cache, if .test() called before
    if (this.__index__ >= 0 && this.__text_cache__ === text) {
      result.push(createMatch(this, shift));
      shift = this.__last_index__;
    }

    // Cut head if cache was used
    var tail = shift ? text.slice(shift) : text;

    // Scan string until end reached
    while (this.test(tail)) {
      result.push(createMatch(this, shift));

      tail = tail.slice(this.__last_index__);
      shift += this.__last_index__;
    }

    if (result.length) {
      return result;
    }

    return null;
  };


  /** chainable
   * LinkifyIt#tlds(list [, keepOld]) -> this
   * - list (Array): list of tlds
   * - keepOld (Boolean): merge with current list if `true` (`false` by default)
   *
   * Load (or merge) new tlds list. Those are user for fuzzy links (without prefix)
   * to avoid false positives. By default this algorythm used:
   *
   * - hostname with any 2-letter root zones are ok.
   * - biz|com|edu|gov|net|org|pro|web|xxx|aero|asia|coop|info|museum|name|shop|рф
   *   are ok.
   * - encoded (`xn--...`) root zones are ok.
   *
   * If list is replaced, then exact match for 2-chars root zones will be checked.
   **/
  LinkifyIt.prototype.tlds = function tlds(list, keepOld) {
    list = Array.isArray(list) ? list : [ list ];

    if (!keepOld) {
      this.__tlds__ = list.slice();
      this.__tlds_replaced__ = true;
      compile(this);
      return this;
    }

    this.__tlds__ = this.__tlds__.concat(list)
                                    .sort()
                                    .filter(function (el, idx, arr) {
                                      return el !== arr[idx - 1];
                                    })
                                    .reverse();

    compile(this);
    return this;
  };

  /**
   * LinkifyIt#normalize(match)
   *
   * Default normalizer (if schema does not define it's own).
   **/
  LinkifyIt.prototype.normalize = function normalize(match) {

    // Do minimal possible changes by default. Need to collect feedback prior
    // to move forward https://github.com/markdown-it/linkify-it/issues/1

    if (!match.schema) { match.url = 'http://' + match.url; }

    if (match.schema === 'mailto:' && !/^mailto:/i.test(match.url)) {
      match.url = 'mailto:' + match.url;
    }
  };


  /**
   * LinkifyIt#onCompile()
   *
   * Override to modify basic RegExp-s.
   **/
  LinkifyIt.prototype.onCompile = function onCompile() {
  };


  var linkifyIt = LinkifyIt;

  /**
  	* Creates an array containing the numeric code points of each Unicode
  	* character in the string. While JavaScript uses UCS-2 internally,
  	* this function will convert a pair of surrogate halves (each of which
  	* UCS-2 exposes as separate characters) into a single code point,
  	* matching UTF-16.
  	* @see `punycode.ucs2.encode`
  	* @see <https://mathiasbynens.be/notes/javascript-encoding>
  	* @memberOf punycode.ucs2
  	* @name decode
  	* @param {String} string The Unicode input string (UCS-2).
  	* @returns {Array} The new array of code points.
  */
  var decode$2 = function ucs2decode(string) {
  	var output = [],
  	counter = 0,
  	length = string.length,
  	value,
  	extra;
  	while (counter < length) {
  		value = string.charCodeAt(counter++);
  		if (value >= 0xD800 && value <= 0xDBFF && counter < length) {
  			// high surrogate, and there is a next character
  			extra = string.charCodeAt(counter++);
  			if ((extra & 0xFC00) === 0xDC00) { // low surrogate
  				output.push(((value & 0x3FF) << 10) + (extra & 0x3FF) + 0x10000);
  			} else {
  				// unmatched surrogate; only append this code unit, in case the next
  				// code unit is the high surrogate of a surrogate pair
  				output.push(value);
  				counter--;
  			}
  		} else {
  			output.push(value);
  		}
  	}
  	return output;
  };

  var stringFromCharCode = String.fromCharCode;

  /**
  	* Creates a string based on an array of numeric code points.
  	* @see `punycode.ucs2.decode`
  	* @memberOf punycode.ucs2
  	* @name encode
  	* @param {Array} codePoints The array of numeric code points.
  	* @returns {String} The new Unicode string (UCS-2).
  */
  var encode$2 = function (array) {
  	return array.map(function (value) {
  		var output = '';
  		if (value > 0xFFFF) {
  			value -= 0x10000;
  			output += stringFromCharCode(value >>> 10 & 0x3FF | 0xD800);
  			value = 0xDC00 | value & 0x3FF;
  		}
  		output += stringFromCharCode(value);
  		return output;
  	}).join('');
  };

  var floor$2 = Math.floor

    , base = 36, tMin = 1, tMax = 26, damp = 700, skew = 38
    , baseMinusTMin = base - tMin;

  /**
  	* Bias adaptation function as per section 3.4 of RFC 3492.
  	* https://tools.ietf.org/html/rfc3492#section-3.4
  	* @private
  */
  var adapt = function (delta, numPoints, firstTime) {
  	var k = 0;
  	delta = firstTime ? floor$2(delta / damp) : delta >> 1;
  	delta += floor$2(delta / numPoints);
  	for (k = 0; delta > baseMinusTMin * tMax >> 1; k += base) {
  		delta = floor$2(delta / baseMinusTMin);
  	}
  	return floor$2(k + (baseMinusTMin + 1) * delta / (delta + skew));
  };

  var floor$3 = Math.floor

  /** Highest positive signed 32-bit float value */
    , maxInt = 2147483647 // aka. 0x7FFFFFFF or 2^31-1
    , initialN = 128, initialBias = 72, delimiter = '-', base$1 = 36, tMin$1 = 1, tMax$1 = 26;

  /**
  	* Converts a basic code point into a digit/integer.
  	* @see `digitToBasic()`
  	* @private
  	* @param {Number} codePoint The basic numeric code point value.
  	* @returns {Number} The numeric value of a basic code point (for use in
  	* representing integers) in the range `0` to `base - 1`, or `base` if
  	* the code point does not represent a value.
  */
  var basicToDigit = function (codePoint) {
  	if (codePoint - 48 < 10) {
  		return codePoint - 22;
  	}
  	if (codePoint - 65 < 26) {
  		return codePoint - 65;
  	}
  	if (codePoint - 97 < 26) {
  		return codePoint - 97;
  	}
  	return base$1;
  };

  /** Error messages */
  var errors = {
  	overflow: 'Overflow: input needs wider integers to process',
  	'not-basic': 'Illegal input >= 0x80 (not a basic code point)',
  	'invalid-input': 'Invalid input'
  };

  /**
  	* A generic error utility function.
  	* @private
  	* @param {String} type The error type.
  	* @returns {Error} Throws a `RangeError` with the applicable error message.
  */
  var error = function (type) {
  	throw new RangeError(errors[type]);
  };

  /**
  	* Converts a Punycode string of ASCII-only symbols to a string of Unicode
  	* symbols.
  	* @memberOf punycode
  	* @param {String} input The Punycode string of ASCII-only symbols.
  	* @returns {String} The resulting string of Unicode symbols.
  */
  var decode$3 = function (input) {
  	// Don't use UCS-2
  	var output = [],
  	inputLength = input.length,
  	out,
  	i = 0,
  	n = initialN,
  	bias = initialBias,
  	basic,
  	j,
  	index,
  	oldi,
  	w,
  	k,
  	digit,
  	t,
  	/** Cached calculation results */
  	baseMinusT;

  	// Handle the basic code points: let `basic` be the number of input code
  	// points before the last delimiter, or `0` if there is none, then copy
  	// the first basic code points to the output.

  	basic = input.lastIndexOf(delimiter);
  	if (basic < 0) {
  		basic = 0;
  	}

  	for (j = 0; j < basic; ++j) {
  		// if it's not a basic code point
  		if (input.charCodeAt(j) >= 0x80) {
  			error('not-basic');
  		}
  		output.push(input.charCodeAt(j));
  	}

  	// Main decoding loop: start just after the last delimiter if any basic code
  	// points were copied; start at the beginning otherwise.

  	for (index = basic > 0 ? basic + 1 : 0; index < inputLength; index) {

  		// `index` is the index of the next character to be consumed.
  		// Decode a generalized variable-length integer into `delta`,
  		// which gets added to `i`. The overflow checking is easier
  		// if we increase `i` as we go, then subtract off its starting
  		// value at the end to obtain `delta`.
  		for (oldi = i, w = 1, k = base$1; true; k += base$1) {

  			if (index >= inputLength) {
  				error('invalid-input');
  			}

  			digit = basicToDigit(input.charCodeAt(index++));

  			if (digit >= base$1 || digit > floor$3((maxInt - i) / w)) {
  				error('overflow');
  			}

  			i += digit * w;
  			t = k <= bias ? tMin$1 : (k >= bias + tMax$1 ? tMax$1 : k - bias);

  			if (digit < t) {
  				break;
  			}

  			baseMinusT = base$1 - t;
  			if (w > floor$3(maxInt / baseMinusT)) {
  				error('overflow');
  			}

  			w *= baseMinusT;

  		}

  		out = output.length + 1;
  		bias = adapt(i - oldi, out, oldi === 0);

  		// `i` was supposed to wrap around from `out` to `0`,
  		// incrementing `n` each time, so we'll fix that now:
  		if (floor$3(i / out) > maxInt - n) {
  			error('overflow');
  		}

  		n += floor$3(i / out);
  		i %= out;

  		// Insert `n` at position `i` of the output
  		output.splice(i++, 0, n);

  	}

  	return encode$2(output);
  };

  var stringFromCharCode$1 = String.fromCharCode
    , floor$4 = Math.floor

  /** Highest positive signed 32-bit float value */
    , maxInt$1 = 2147483647 // aka. 0x7FFFFFFF or 2^31-1

    , base$2 = 36
    , delimiter$1 = '-' // '\x2D'
    , initialBias$1 = 72, initialN$1 = 128, tMin$2 = 1, tMax$2 = 26;

  /**
  	* Converts a digit/integer into a basic code point.
  	* @see `basicToDigit()`
  	* @private
  	* @param {Number} digit The numeric value of a basic code point.
  	* @returns {Number} The basic code point whose value (when used for
  	* representing integers) is `digit`, which needs to be in the range
  	* `0` to `base - 1`. If `flag` is non-zero, the uppercase form is
  	* used; else, the lowercase form is used. The behavior is undefined
  	* if `flag` is non-zero and `digit` has no uppercase form.
  */
  var digitToBasic = function (digit, flag) {
  	//  0..25 map to ASCII a..z or A..Z
  	// 26..35 map to ASCII 0..9
  	return digit + 22 + 75 * (digit < 26) - ((flag !== 0) << 5);
  };

  /**
  	* Converts a string of Unicode symbols (e.g. a domain name label) to a
  	* Punycode string of ASCII-only symbols.
  	* @memberOf punycode
  	* @param {String} input The string of Unicode symbols.
  	* @returns {String} The resulting Punycode string of ASCII-only symbols.
  */
  var encode$3 = function (input) {
  	var n,
  	delta,
  	handledCPCount,
  	basicLength,
  	bias,
  	j,
  	m,
  	q,
  	k,
  	t,
  	currentValue,
  	output = [],
  	/** `inputLength` will hold the number of code points in `input`. */
  	inputLength,
  	/** Cached calculation results */
  	handledCPCountPlusOne,
  	baseMinusT,
  	qMinusT;

  	// Convert the input in UCS-2 to Unicode
  	input = decode$2(input);

  	// Cache the length
  	inputLength = input.length;

  	// Initialize the state
  	n = initialN$1;
  	delta = 0;
  	bias = initialBias$1;

  	// Handle the basic code points
  	for (j = 0; j < inputLength; ++j) {
  		currentValue = input[j];
  		if (currentValue < 0x80) {
  			output.push(stringFromCharCode$1(currentValue));
  		}
  	}

  	handledCPCount = basicLength = output.length;

  	// `handledCPCount` is the number of code points that have been handled;
  	// `basicLength` is the number of basic code points.

  	// Finish the basic string - if it is not empty - with a delimiter
  	if (basicLength) {
  		output.push(delimiter$1);
  	}

  	// Main encoding loop:
  	while (handledCPCount < inputLength) {

  		// All non-basic code points < n have been handled already. Find the next
  		// larger one:
  		for (m = maxInt$1, j = 0; j < inputLength; ++j) {
  			currentValue = input[j];
  			if (currentValue >= n && currentValue < m) {
  				m = currentValue;
  			}
  		}

  		// Increase `delta` enough to advance the decoder's <n,i> state to <m,0>,
  		// but guard against overflow
  		handledCPCountPlusOne = handledCPCount + 1;
  		if (m - n > floor$4((maxInt$1 - delta) / handledCPCountPlusOne)) {
  			throw new RangeError('Overflow: input needs wider integers to process');
  		}

  		delta += (m - n) * handledCPCountPlusOne;
  		n = m;

  		for (j = 0; j < inputLength; ++j) {
  			currentValue = input[j];

  			if (currentValue < n && ++delta > maxInt$1) {
  				throw new RangeError('Overflow: input needs wider integers to process');
  			}

  			if (currentValue === n) {
  				// Represent delta as a generalized variable-length integer
  				for (q = delta, k = base$2; true; k += base$2) {
  					t = k <= bias ? tMin$2 : (k >= bias + tMax$2 ? tMax$2 : k - bias);
  					if (q < t) {
  						break;
  					}
  					qMinusT = q - t;
  					baseMinusT = base$2 - t;
  					output.push(
  						stringFromCharCode$1(digitToBasic(t + qMinusT % baseMinusT, 0))
  					);
  					q = floor$4(qMinusT / baseMinusT);
  				}

  				output.push(stringFromCharCode$1(digitToBasic(q, 0)));
  				bias = adapt(delta, handledCPCountPlusOne, handledCPCount === basicLength);
  				delta = 0;
  				++handledCPCount;
  			}
  		}

  		++delta;
  		++n;

  	}
  	return output.join('');
  };

  var regexSeparators = /[\x2E\u3002\uFF0E\uFF61]/g; // RFC 3490 separators

  /**
  	* A simple `Array#map`-like wrapper to work with domain name strings or email
  	* addresses.
  	* @private
  	* @param {String} domain The domain name or email address.
  	* @param {Function} callback The function that gets called for every
  	* character.
  	* @returns {Array} A new string of characters returned by the callback
  	* function.
  */
  var mapDomain = function (string, fn) {
  	var parts = string.split('@');
  	var result = '';
  	if (parts.length > 1) {
  		// In email addresses, only the domain name should be punycoded. Leave
  		// the local part (i.e. everything up to `@`) intact.
  		result = parts[0] + '@';
  		string = parts[1];
  	}
  	// Avoid `split(regex)` for IE8 compatibility. See #17.
  	string = string.replace(regexSeparators, '.');
  	var labels = string.split('.');
  	var encoded = labels.map(fn).join('.');
  	return result + encoded;
  };

  var regexNonASCII = /[^\x20-\x7E]/; // unprintable ASCII chars + non-ASCII chars

  /**
  	* Converts a Unicode string representing a domain name or an email address to
  	* Punycode. Only the non-ASCII parts of the domain name will be converted,
  	* i.e. it doesn't matter if you call it with a domain that's already in
  	* ASCII.
  	* @memberOf punycode
  	* @param {String} input The domain name or email address to convert, as a
  	* Unicode string.
  	* @returns {String} The Punycode representation of the given domain name or
  	* email address.
  */
  var toAscii = function (input) {
  	return mapDomain(input, function (string) {
  		return regexNonASCII.test(string)
  			? 'xn--' + encode$3(string)
  			: string;
  	});
  };

  var regexPunycode = /^xn--/;

  /**
  	* Converts a Punycode string representing a domain name or an email address
  	* to Unicode. Only the Punycoded parts of the input will be converted, i.e.
  	* it doesn't matter if you call it on a string that has already been
  	* converted to Unicode.
  	* @memberOf punycode
  	* @param {String} input The Punycoded domain name or email address to
  	* convert to Unicode.
  	* @returns {String} The Unicode representation of the given Punycode
  	* string.
  */
  var toUnicode = function (input) {
  	return mapDomain(input, function (string) {
  		return regexPunycode.test(string)
  			? decode$3(string.slice(4).toLowerCase())
  			: string;
  	});
  };

  /** Define the public API */
  var punycode2 = {
  	/**
  		* A string representing the current Punycode.js version number.
  		* @memberOf punycode
  		* @type String
  	*/
  	version: '1.3.2',
  	/**
  		* An object of methods to convert from JavaScript's internal character
  		* representation (UCS-2) to Unicode code points, and back.
  		* @see <https://mathiasbynens.be/notes/javascript-encoding>
  		* @memberOf punycode
  		* @type Object
  	*/
  	ucs2: {
  		decode: decode$2,
  		encode: encode$2
  	},
  	decode: decode$3,
  	encode: encode$3,
  	toASCII: toAscii,
  	toUnicode: toUnicode
  };

  // markdown-it default options


  var _default = {
    options: {
      html:         false,        // Enable HTML tags in source
      xhtmlOut:     false,        // Use '/' to close single tags (<br />)
      breaks:       false,        // Convert '\n' in paragraphs into <br>
      langPrefix:   'language-',  // CSS language prefix for fenced blocks
      linkify:      false,        // autoconvert URL-like texts to links

      // Enable some language-neutral replacements + quotes beautification
      typographer:  false,

      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,

      maxNesting:   100            // Internal protection, recursion limit
    },

    components: {

      core: {},
      block: {},
      inline: {}
    }
  };

  // "Zero" preset, with nothing enabled. Useful for manual configuring of simple


  var zero = {
    options: {
      html:         false,        // Enable HTML tags in source
      xhtmlOut:     false,        // Use '/' to close single tags (<br />)
      breaks:       false,        // Convert '\n' in paragraphs into <br>
      langPrefix:   'language-',  // CSS language prefix for fenced blocks
      linkify:      false,        // autoconvert URL-like texts to links

      // Enable some language-neutral replacements + quotes beautification
      typographer:  false,

      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,

      maxNesting:   20            // Internal protection, recursion limit
    },

    components: {

      core: {
        rules: [
          'normalize',
          'block',
          'inline'
        ]
      },

      block: {
        rules: [
          'paragraph'
        ]
      },

      inline: {
        rules: [
          'text'
        ],
        rules2: [
          'balance_pairs',
          'text_collapse'
        ]
      }
    }
  };

  // Commonmark default options


  var commonmark = {
    options: {
      html:         true,         // Enable HTML tags in source
      xhtmlOut:     true,         // Use '/' to close single tags (<br />)
      breaks:       false,        // Convert '\n' in paragraphs into <br>
      langPrefix:   'language-',  // CSS language prefix for fenced blocks
      linkify:      false,        // autoconvert URL-like texts to links

      // Enable some language-neutral replacements + quotes beautification
      typographer:  false,

      // Double + single quotes replacement pairs, when typographer enabled,
      // and smartquotes on. Could be either a String or an Array.
      //
      // For example, you can use '«»„“' for Russian, '„“‚‘' for German,
      // and ['«\xA0', '\xA0»', '‹\xA0', '\xA0›'] for French (including nbsp).
      quotes: '\u201c\u201d\u2018\u2019', /* “”‘’ */

      // Highlighter function. Should return escaped HTML,
      // or '' if the source string is not changed and should be escaped externaly.
      // If result starts with <pre... internal wrapper is skipped.
      //
      // function (/*str, lang*/) { return ''; }
      //
      highlight: null,

      maxNesting:   20            // Internal protection, recursion limit
    },

    components: {

      core: {
        rules: [
          'normalize',
          'block',
          'inline'
        ]
      },

      block: {
        rules: [
          'blockquote',
          'code',
          'fence',
          'heading',
          'hr',
          'html_block',
          'lheading',
          'list',
          'reference',
          'paragraph'
        ]
      },

      inline: {
        rules: [
          'autolink',
          'backticks',
          'emphasis',
          'entity',
          'escape',
          'html_inline',
          'image',
          'link',
          'newline',
          'text'
        ],
        rules2: [
          'balance_pairs',
          'emphasis',
          'text_collapse'
        ]
      }
    }
  };

  var config = {
    default: _default,
    zero: zero,
    commonmark: commonmark
  };

  ////////////////////////////////////////////////////////////////////////////////
  //
  // This validator can prohibit more than really needed to prevent XSS. It's a
  // tradeoff to keep code simple and to be secure by default.
  //
  // If you need different setup - override validator method as you wish. Or
  // replace it with dummy function and use external sanitizer.
  //

  var BAD_PROTO_RE = /^(vbscript|javascript|file|data):/;
  var GOOD_DATA_RE = /^data:image\/(gif|png|jpeg|webp);/;

  function validateLink(url) {
    // url should be normalized at this point, and existing entities are decoded
    var str = url.trim().toLowerCase();

    return BAD_PROTO_RE.test(str) ? (GOOD_DATA_RE.test(str) ? true : false) : true;
  }

  ////////////////////////////////////////////////////////////////////////////////


  var RECODE_HOSTNAME_FOR = [ 'http:', 'https:', 'mailto:' ];

  function normalizeLink(url) {
    var parsed = mdurl.parse(url, true);

    if (parsed.hostname) {
      // Encode hostnames in urls like:
      // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
      //
      // We don't encode unknown schemas, because it's likely that we encode
      // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
      //
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
        try {
          parsed.hostname = punycode2.toASCII(parsed.hostname);
        } catch (er) { /**/ }
      }
    }

    return mdurl.encode(mdurl.format(parsed));
  }

  function normalizeLinkText(url) {
    var parsed = mdurl.parse(url, true);

    if (parsed.hostname) {
      // Encode hostnames in urls like:
      // `http://host/`, `https://host/`, `mailto:user@host`, `//host/`
      //
      // We don't encode unknown schemas, because it's likely that we encode
      // something we shouldn't (e.g. `skype:name` treated as `skype:host`)
      //
      if (!parsed.protocol || RECODE_HOSTNAME_FOR.indexOf(parsed.protocol) >= 0) {
        try {
          parsed.hostname = punycode2.toUnicode(parsed.hostname);
        } catch (er) { /**/ }
      }
    }

    // add '%' to exclude list because of https://github.com/markdown-it/markdown-it/issues/720
    return mdurl.decode(mdurl.format(parsed), mdurl.decode.defaultChars + '%');
  }


  /**
   * class MarkdownIt
   *
   * Main parser/renderer class.
   *
   * ##### Usage
   *
   * ```javascript
   * // node.js, "classic" way:
   * var MarkdownIt = require('markdown-it'),
   *     md = new MarkdownIt();
   * var result = md.render('# markdown-it rulezz!');
   *
   * // node.js, the same, but with sugar:
   * var md = require('markdown-it')();
   * var result = md.render('# markdown-it rulezz!');
   *
   * // browser without AMD, added to "window" on script load
   * // Note, there are no dash.
   * var md = window.markdownit();
   * var result = md.render('# markdown-it rulezz!');
   * ```
   *
   * Single line rendering, without paragraph wrap:
   *
   * ```javascript
   * var md = require('markdown-it')();
   * var result = md.renderInline('__markdown-it__ rulezz!');
   * ```
   **/

  /**
   * new MarkdownIt([presetName, options])
   * - presetName (String): optional, `commonmark` / `zero`
   * - options (Object)
   *
   * Creates parser instanse with given config. Can be called without `new`.
   *
   * ##### presetName
   *
   * MarkdownIt provides named presets as a convenience to quickly
   * enable/disable active syntax rules and options for common use cases.
   *
   * - ["commonmark"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/commonmark.js) -
   *   configures parser to strict [CommonMark](http://commonmark.org/) mode.
   * - [default](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/default.js) -
   *   similar to GFM, used when no preset name given. Enables all available rules,
   *   but still without html, typographer & autolinker.
   * - ["zero"](https://github.com/markdown-it/markdown-it/blob/master/lib/presets/zero.js) -
   *   all rules disabled. Useful to quickly setup your config via `.enable()`.
   *   For example, when you need only `bold` and `italic` markup and nothing else.
   *
   * ##### options:
   *
   * - __html__ - `false`. Set `true` to enable HTML tags in source. Be careful!
   *   That's not safe! You may need external sanitizer to protect output from XSS.
   *   It's better to extend features via plugins, instead of enabling HTML.
   * - __xhtmlOut__ - `false`. Set `true` to add '/' when closing single tags
   *   (`<br />`). This is needed only for full CommonMark compatibility. In real
   *   world you will need HTML output.
   * - __breaks__ - `false`. Set `true` to convert `\n` in paragraphs into `<br>`.
   * - __langPrefix__ - `language-`. CSS language class prefix for fenced blocks.
   *   Can be useful for external highlighters.
   * - __linkify__ - `false`. Set `true` to autoconvert URL-like text to links.
   * - __typographer__  - `false`. Set `true` to enable [some language-neutral
   *   replacement](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/replacements.js) +
   *   quotes beautification (smartquotes).
   * - __quotes__ - `“”‘’`, String or Array. Double + single quotes replacement
   *   pairs, when typographer enabled and smartquotes on. For example, you can
   *   use `'«»„“'` for Russian, `'„“‚‘'` for German, and
   *   `['«\xA0', '\xA0»', '‹\xA0', '\xA0›']` for French (including nbsp).
   * - __highlight__ - `null`. Highlighter function for fenced code blocks.
   *   Highlighter `function (str, lang)` should return escaped HTML. It can also
   *   return empty string if the source was not changed and should be escaped
   *   externaly. If result starts with <pre... internal wrapper is skipped.
   *
   * ##### Example
   *
   * ```javascript
   * // commonmark mode
   * var md = require('markdown-it')('commonmark');
   *
   * // default mode
   * var md = require('markdown-it')();
   *
   * // enable everything
   * var md = require('markdown-it')({
   *   html: true,
   *   linkify: true,
   *   typographer: true
   * });
   * ```
   *
   * ##### Syntax highlighting
   *
   * ```js
   * var hljs = require('highlight.js') // https://highlightjs.org/
   *
   * var md = require('markdown-it')({
   *   highlight: function (str, lang) {
   *     if (lang && hljs.getLanguage(lang)) {
   *       try {
   *         return hljs.highlight(lang, str, true).value;
   *       } catch (__) {}
   *     }
   *
   *     return ''; // use external default escaping
   *   }
   * });
   * ```
   *
   * Or with full wrapper override (if you need assign class to `<pre>`):
   *
   * ```javascript
   * var hljs = require('highlight.js') // https://highlightjs.org/
   *
   * // Actual default values
   * var md = require('markdown-it')({
   *   highlight: function (str, lang) {
   *     if (lang && hljs.getLanguage(lang)) {
   *       try {
   *         return '<pre class="hljs"><code>' +
   *                hljs.highlight(lang, str, true).value +
   *                '</code></pre>';
   *       } catch (__) {}
   *     }
   *
   *     return '<pre class="hljs"><code>' + md.utils.escapeHtml(str) + '</code></pre>';
   *   }
   * });
   * ```
   *
   **/
  function MarkdownIt(presetName, options) {
    if (!(this instanceof MarkdownIt)) {
      return new MarkdownIt(presetName, options);
    }

    if (!options) {
      if (!utils.isString(presetName)) {
        options = presetName || {};
        presetName = 'default';
      }
    }

    /**
     * MarkdownIt#inline -> ParserInline
     *
     * Instance of [[ParserInline]]. You may need it to add new rules when
     * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
     * [[MarkdownIt.enable]].
     **/
    this.inline = new parser_inline();

    /**
     * MarkdownIt#block -> ParserBlock
     *
     * Instance of [[ParserBlock]]. You may need it to add new rules when
     * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
     * [[MarkdownIt.enable]].
     **/
    this.block = new parser_block();

    /**
     * MarkdownIt#core -> Core
     *
     * Instance of [[Core]] chain executor. You may need it to add new rules when
     * writing plugins. For simple rules control use [[MarkdownIt.disable]] and
     * [[MarkdownIt.enable]].
     **/
    this.core = new parser_core();

    /**
     * MarkdownIt#renderer -> Renderer
     *
     * Instance of [[Renderer]]. Use it to modify output look. Or to add rendering
     * rules for new token types, generated by plugins.
     *
     * ##### Example
     *
     * ```javascript
     * var md = require('markdown-it')();
     *
     * function myToken(tokens, idx, options, env, self) {
     *   //...
     *   return result;
     * };
     *
     * md.renderer.rules['my_token'] = myToken
     * ```
     *
     * See [[Renderer]] docs and [source code](https://github.com/markdown-it/markdown-it/blob/master/lib/renderer.js).
     **/
    this.renderer = new renderer();

    /**
     * MarkdownIt#linkify -> LinkifyIt
     *
     * [linkify-it](https://github.com/markdown-it/linkify-it) instance.
     * Used by [linkify](https://github.com/markdown-it/markdown-it/blob/master/lib/rules_core/linkify.js)
     * rule.
     **/
    this.linkify = new linkifyIt();

    /**
     * MarkdownIt#validateLink(url) -> Boolean
     *
     * Link validation function. CommonMark allows too much in links. By default
     * we disable `javascript:`, `vbscript:`, `file:` schemas, and almost all `data:...` schemas
     * except some embedded image types.
     *
     * You can change this behaviour:
     *
     * ```javascript
     * var md = require('markdown-it')();
     * // enable everything
     * md.validateLink = function () { return true; }
     * ```
     **/
    this.validateLink = validateLink;

    /**
     * MarkdownIt#normalizeLink(url) -> String
     *
     * Function used to encode link url to a machine-readable format,
     * which includes url-encoding, punycode, etc.
     **/
    this.normalizeLink = normalizeLink;

    /**
     * MarkdownIt#normalizeLinkText(url) -> String
     *
     * Function used to decode link url to a human-readable format`
     **/
    this.normalizeLinkText = normalizeLinkText;


    // Expose utils & helpers for easy acces from plugins

    /**
     * MarkdownIt#utils -> utils
     *
     * Assorted utility functions, useful to write plugins. See details
     * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/common/utils.js).
     **/
    this.utils = utils;

    /**
     * MarkdownIt#helpers -> helpers
     *
     * Link components parser functions, useful to write plugins. See details
     * [here](https://github.com/markdown-it/markdown-it/blob/master/lib/helpers).
     **/
    this.helpers = utils.assign({}, helpers);


    this.options = {};
    this.configure(presetName);

    if (options) { this.set(options); }
  }


  /** chainable
   * MarkdownIt.set(options)
   *
   * Set parser options (in the same format as in constructor). Probably, you
   * will never need it, but you can change options after constructor call.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')()
   *             .set({ html: true, breaks: true })
   *             .set({ typographer, true });
   * ```
   *
   * __Note:__ To achieve the best possible performance, don't modify a
   * `markdown-it` instance options on the fly. If you need multiple configurations
   * it's best to create multiple instances and initialize each with separate
   * config.
   **/
  MarkdownIt.prototype.set = function (options) {
    utils.assign(this.options, options);
    return this;
  };


  /** chainable, internal
   * MarkdownIt.configure(presets)
   *
   * Batch load of all options and compenent settings. This is internal method,
   * and you probably will not need it. But if you will - see available presets
   * and data structure [here](https://github.com/markdown-it/markdown-it/tree/master/lib/presets)
   *
   * We strongly recommend to use presets instead of direct config loads. That
   * will give better compatibility with next versions.
   **/
  MarkdownIt.prototype.configure = function (presets) {
    var self = this, presetName;

    if (utils.isString(presets)) {
      presetName = presets;
      presets = config[presetName];
      if (!presets) { throw new Error('Wrong `markdown-it` preset "' + presetName + '", check name'); }
    }

    if (!presets) { throw new Error('Wrong `markdown-it` preset, can\'t be empty'); }

    if (presets.options) { self.set(presets.options); }

    if (presets.components) {
      Object.keys(presets.components).forEach(function (name) {
        if (presets.components[name].rules) {
          self[name].ruler.enableOnly(presets.components[name].rules);
        }
        if (presets.components[name].rules2) {
          self[name].ruler2.enableOnly(presets.components[name].rules2);
        }
      });
    }
    return this;
  };


  /** chainable
   * MarkdownIt.enable(list, ignoreInvalid)
   * - list (String|Array): rule name or list of rule names to enable
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * Enable list or rules. It will automatically find appropriate components,
   * containing rules with given names. If rule not found, and `ignoreInvalid`
   * not set - throws exception.
   *
   * ##### Example
   *
   * ```javascript
   * var md = require('markdown-it')()
   *             .enable(['sub', 'sup'])
   *             .disable('smartquotes');
   * ```
   **/
  MarkdownIt.prototype.enable = function (list, ignoreInvalid) {
    var result = [];

    if (!Array.isArray(list)) { list = [ list ]; }

    [ 'core', 'block', 'inline' ].forEach(function (chain) {
      result = result.concat(this[chain].ruler.enable(list, true));
    }, this);

    result = result.concat(this.inline.ruler2.enable(list, true));

    var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

    if (missed.length && !ignoreInvalid) {
      throw new Error('MarkdownIt. Failed to enable unknown rule(s): ' + missed);
    }

    return this;
  };


  /** chainable
   * MarkdownIt.disable(list, ignoreInvalid)
   * - list (String|Array): rule name or list of rule names to disable.
   * - ignoreInvalid (Boolean): set `true` to ignore errors when rule not found.
   *
   * The same as [[MarkdownIt.enable]], but turn specified rules off.
   **/
  MarkdownIt.prototype.disable = function (list, ignoreInvalid) {
    var result = [];

    if (!Array.isArray(list)) { list = [ list ]; }

    [ 'core', 'block', 'inline' ].forEach(function (chain) {
      result = result.concat(this[chain].ruler.disable(list, true));
    }, this);

    result = result.concat(this.inline.ruler2.disable(list, true));

    var missed = list.filter(function (name) { return result.indexOf(name) < 0; });

    if (missed.length && !ignoreInvalid) {
      throw new Error('MarkdownIt. Failed to disable unknown rule(s): ' + missed);
    }
    return this;
  };


  /** chainable
   * MarkdownIt.use(plugin, params)
   *
   * Load specified plugin with given params into current parser instance.
   * It's just a sugar to call `plugin(md, params)` with curring.
   *
   * ##### Example
   *
   * ```javascript
   * var iterator = require('markdown-it-for-inline');
   * var md = require('markdown-it')()
   *             .use(iterator, 'foo_replace', 'text', function (tokens, idx) {
   *               tokens[idx].content = tokens[idx].content.replace(/foo/g, 'bar');
   *             });
   * ```
   **/
  MarkdownIt.prototype.use = function (plugin /*, params, ... */) {
    var args = [ this ].concat(Array.prototype.slice.call(arguments, 1));
    plugin.apply(plugin, args);
    return this;
  };


  /** internal
   * MarkdownIt.parse(src, env) -> Array
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Parse input string and return list of block tokens (special token type
   * "inline" will contain list of inline tokens). You should not call this
   * method directly, until you write custom renderer (for example, to produce
   * AST).
   *
   * `env` is used to pass data between "distributed" rules and return additional
   * metadata like reference info, needed for the renderer. It also can be used to
   * inject data in specific cases. Usually, you will be ok to pass `{}`,
   * and then pass updated object to renderer.
   **/
  MarkdownIt.prototype.parse = function (src, env) {
    if (typeof src !== 'string') {
      throw new Error('Input data should be a String');
    }

    var state = new this.core.State(src, this, env);

    this.core.process(state);

    return state.tokens;
  };


  /**
   * MarkdownIt.render(src [, env]) -> String
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Render markdown string into html. It does all magic for you :).
   *
   * `env` can be used to inject additional metadata (`{}` by default).
   * But you will not need it with high probability. See also comment
   * in [[MarkdownIt.parse]].
   **/
  MarkdownIt.prototype.render = function (src, env) {
    env = env || {};

    return this.renderer.render(this.parse(src, env), this.options, env);
  };


  /** internal
   * MarkdownIt.parseInline(src, env) -> Array
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * The same as [[MarkdownIt.parse]] but skip all block rules. It returns the
   * block tokens list with the single `inline` element, containing parsed inline
   * tokens in `children` property. Also updates `env` object.
   **/
  MarkdownIt.prototype.parseInline = function (src, env) {
    var state = new this.core.State(src, this, env);

    state.inlineMode = true;
    this.core.process(state);

    return state.tokens;
  };


  /**
   * MarkdownIt.renderInline(src [, env]) -> String
   * - src (String): source string
   * - env (Object): environment sandbox
   *
   * Similar to [[MarkdownIt.render]] but for single paragraph content. Result
   * will NOT be wrapped into `<p>` tags.
   **/
  MarkdownIt.prototype.renderInline = function (src, env) {
    env = env || {};

    return this.renderer.render(this.parseInline(src, env), this.options, env);
  };


  var lib = MarkdownIt;

  var markdownIt = lib;

  var months$1 = ['januaro', 'februaro', 'marto', 'aprilo', 'majo', 'junio', 'julio', 'aŭgusto', 'septembro', 'oktobro', 'novembro', 'decembro'];

  function daysInMonth$1(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function createDateInput(value, onUpdate) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var editor = document.createElement('div');
    editor.className = 'js-date-editor';
    var year = document.createElement('input');
    year.placeholder = locale.date_picker.year;
    year.type = 'number';
    year.min = 1;
    year.max = 3000;
    editor.appendChild(year);
    var month = document.createElement('select');
    {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '—';
      month.appendChild(opt);
    }

    for (var i = 0; i < 12; i++) {
      var _opt = document.createElement('option');

      _opt.value = i;
      _opt.textContent = months$1[i];
      month.appendChild(_opt);
    }

    editor.appendChild(month);
    var day = document.createElement('select');

    function renderDay(year, month) {
      day.innerHTML = '';

      if (!Number.isFinite(year)) {
        var _opt2 = document.createElement('option');

        _opt2.value = '';
        _opt2.textContent = '—';
        day.appendChild(_opt2);
      } else {
        var days = daysInMonth$1(year, month);

        for (var _i = 1; _i < days; _i++) {
          var _opt3 = document.createElement('option');

          _opt3.value = _i;
          _opt3.textContent = _i;
          day.appendChild(_opt3);
        }
      }
    }

    editor.appendChild(day);
    renderDay(null, null);

    function update() {
      var y = +year.value;
      var m = +month.value;
      var d = +day.value;

      if (year.value && Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
        var date = new Date();
        date.setUTCFullYear(y);
        date.setUTCMonth(m);
        date.setUTCDate(d);
        onUpdate(date.toISOString().split('T')[0]);
      } else {
        onUpdate('');
      }
    }

    function setNull() {
      year.value = '';
      month.value = '';
      renderDay(null, null);
      update();
    }

    function setNonNull() {
      if (!year.value) year.value = new Date().getFullYear();
      if (!month.value) month.value = 0;
      renderDay(+year.value, +month.value);
      update();
    }

    opts.setNull = setNull;
    opts.setNonNull = setNonNull;
    year.addEventListener('change', function () {
      if (!year.value) setNull();else setNonNull();
    });
    year.addEventListener('focus', function () {
      if (!year.value) {
        year.value = new Date().getFullYear();
        setNonNull();
      }
    });
    year.addEventListener('blur', function () {
      if (!year.value || !Number.isFinite(+year.value)) {
        setNull();
      }
    });
    month.addEventListener('change', function () {
      if (!month.value) setNull();else setNonNull();
    });
    day.addEventListener('change', function () {
      update();
    });

    function loadValue(value) {
      if (value) {
        var m = value.match(/(\d{4})-(\d{2})-(\d{2})/);

        if (m) {
          year.value = +m[1];
          month.value = +m[2] - 1;
          renderDay(+year.value, +month.value);
          day.value = +m[3];
          return;
        }
      }

      renderDay(null, null);
      year.value = '';
      month.value = '';
      day.value = '';
    }

    loadValue(value);
    opts.loadValue = loadValue;
    return editor;
  }

  function createTimeInput(value, onUpdate) {
    var opts = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var editor = document.createElement('div');
    editor.className = 'js-time-editor';
    var hour = document.createElement('select');
    {
      var opt = document.createElement('option');
      opt.value = '';
      opt.textContent = '—';
      hour.appendChild(opt);
    }

    for (var i = 0; i < 24; i++) {
      var _opt4 = document.createElement('option');

      _opt4.value = i;
      _opt4.textContent = ('00' + i).substr(-2);
      hour.appendChild(_opt4);
    }

    var minute = document.createElement('select');
    {
      var _opt5 = document.createElement('option');

      _opt5.value = '';
      _opt5.textContent = '—';
      minute.appendChild(_opt5);
    }

    for (var _i2 = 0; _i2 < 60; _i2++) {
      var _opt6 = document.createElement('option');

      _opt6.value = _i2;
      _opt6.textContent = ('00' + _i2).substr(-2);
      minute.appendChild(_opt6);
    }

    editor.appendChild(hour);
    editor.appendChild(document.createTextNode(':'));
    editor.appendChild(minute);

    function setNull() {
      hour.value = minute.value = '';
      onUpdate('');
    }

    function setNonNull() {
      if (!hour.value) hour.value = new Date().getHours();
      if (!minute.value) minute.value = '0';
      var h = ('00' + +hour.value).substr(-2);
      var m = ('00' + +minute.value).substr(-2);
      onUpdate(h + ':' + m);
    }

    opts.setNull = setNull;
    opts.setNonNull = setNonNull;
    hour.addEventListener('change', function () {
      if (hour.value) setNonNull();else setNull();
    });
    minute.addEventListener('change', function () {
      if (minute.value) setNonNull();else setNull();
    });

    function loadValue(value) {
      if (value) {
        var m = value.match(/(\d{1,2}):(\d{2})/);

        if (m) {
          hour.value = +m[1];
          minute.value = +m[2];
          return;
        }
      }

      hour.value = '';
      minute.value = '';
    }

    loadValue(value);
    opts.loadValue = loadValue;
    return editor;
  }

  function initDatePolyfill(input, onUpdate) {
    var editor = createDateInput(input.value, function (value) {
      input.value = value;
      onUpdate();
    }); // replace node with editor in the tree

    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input); // PREpend node in the editor so when using querySelector('input') this is the one being
    // returned

    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
  }
  function initTimePolyfill(input, onUpdate) {
    var editor = createTimeInput(input.value, function (value) {
      input.value = value;
      onUpdate();
    });
    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input);
    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
  }
  function initDateTimePolyfill(input, onUpdate) {
    var currentDate = '';
    var currentTime = '';

    if (input.value) {
      currentDate = input.value.split('T')[0];
      currentTime = input.value.split('T')[1].substr(0, 5);
    }

    var dateOpts = {};
    var timeOpts = {};
    var date = createDateInput(currentDate, function (value) {
      input.value = value + 'T' + currentTime;

      if (value) {
        if (!currentTime) {
          currentTime = ('00' + new Date().getHours()).substr(-2) + ':' + ('00' + new Date().getMinutes()).substr(-2);
          timeOpts.loadValue(currentTime);
        }

        input.value = value + 'T' + currentTime;
        currentDate = value;
      } else {
        input.value = '';
        currentDate = currentTime = '';
        dateOpts.loadValue('');
        timeOpts.loadValue('');
      }
    }, dateOpts);
    var time = createTimeInput(currentTime, function (value) {
      if (value) {
        if (!currentDate) {
          currentDate = new Date().toISOString().split('T')[0];
          dateOpts.loadValue(currentDate);
        }

        input.value = currentDate + 'T' + value;
        currentTime = value;
      } else {
        input.value = '';
        currentDate = currentTime = '';
        dateOpts.loadValue('');
        timeOpts.loadValue('');
      }
    }, timeOpts);
    var editor = document.createElement('div');
    editor.className = 'js-date-time-editor';
    editor.appendChild(date);
    editor.appendChild(time);
    input.parentNode.insertBefore(editor, input);
    input.parentNode.removeChild(input);
    editor.insertBefore(input, editor.firstChild);
    input.className += ' inner-input';
  }

  {
    var noscriptItems = document.querySelectorAll('.congress-form-noscript');

    for (var i$1 = 0; i$1 < noscriptItems.length; i$1++) {
      noscriptItems[i$1].parentNode.removeChild(noscriptItems[i$1]);
    }
  }
  {
    var intentRedirect = document.querySelector('#payment-intent-redirect-button');

    if (intentRedirect) {
      intentRedirect.click();
    }
  } // TODO: load if needed/show progress?

  loadCountryFmt().then(function () {
    return console.log('Loaded ASC countries');
  });
  loadPhoneFmt().then(function () {
    return console.log('Loaded ASC phone-numbers');
  }); // TODO: validate number ranges/step anyway because browsers are often rather unhelpful with their
  // error messages

  var scrollAnimationLoop = 0;

  function scrollNodeIntoView(node) {
    var windowTop = 0;
    var windowBottom = window.innerHeight;

    if (window.visualViewport) {
      windowTop = window.visualViewport.offsetTop;
      windowBottom = window.visualViewport.height;
    }

    var nodeRect = node.getBoundingClientRect();

    if (nodeRect.top > 0 && nodeRect.bottom < windowBottom) {
      // node is fully in frame
      return;
    } // target scrollY such that the target node is centered


    var centerY = (windowTop + windowBottom) / 2;
    var target = Math.max(0, nodeRect.top + nodeRect.height / 2 + window.scrollY - centerY);
    var value = window.scrollY;
    var velocity = 0;
    var F = 109.66;
    var D = 20.94;
    scrollAnimationLoop++;
    var loop = scrollAnimationLoop;
    var lastTime = Date.now();

    var loopFn = function loopFn() {
      if (loop === scrollAnimationLoop) requestAnimationFrame(loopFn);
      var dt = (Date.now() - lastTime) / 1000;
      lastTime = Date.now();
      velocity += ((target - value) * F - velocity * D) * dt;
      value += velocity * dt;
      window.scroll(window.scrollX, value); // stop if value is near target

      if (Math.abs(value - target) < 3) scrollAnimationLoop++;
    };

    loopFn();
  }

  window.addEventListener('touchstart', function () {
    // cancel scroll animation if the user taps the screen
    scrollAnimationLoop++;
  }, {
    passive: true
  });
  window.addEventListener('wheel', function () {
    // cancel scroll animation if the user scrolls
    scrollAnimationLoop++;
  }, {
    passive: true
  });
  var md = new markdownIt();
  var MAX_EVAL_STEPS = 4096;

  function decodeScript(script) {
    if (!script) return null;
    return JSON.parse(atob(script));
  }

  var shouldHalt = function shouldHalt() {
    var count = 0;
    return function () {
      count++;
      if (count > MAX_EVAL_STEPS) return true;
      return false;
    };
  };

  function ascEval(scriptStack, formVars, expr) {
    var sym = Symbol('result');
    return evaluate(scriptStack.concat([_defineProperty({}, sym, expr)]), sym, function (id) {
      return formVars[id] || null;
    }, {
      shouldHalt: shouldHalt()
    });
  }

  function localize(key) {
    for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      args[_key - 1] = arguments[_key];
    }

    if (args.length) {
      var out = '';
      var _i = 0;

      var _iterator = _createForOfIteratorHelper(args),
          _step;

      try {
        for (_iterator.s(); !(_step = _iterator.n()).done;) {
          var p = _step.value;
          out += locale.registration_form[key + '_' + _i];
          out += p;
          _i++;
        }
      } catch (err) {
        _iterator.e(err);
      } finally {
        _iterator.f();
      }

      out += locale.registration_form[key + '_' + _i];
      return out;
    }

    return locale.registration_form[key];
  }

  var RE_DATE_FMT = /^(\d{4})-(\d{2})-(\d{2})$/;
  var RE_TIME_FMT = /^(\d{2}):(\d{2})$/;
  var RE_DATETIME_FMT = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2}):(\d{2})$/;

  var FormInput = /*#__PURE__*/function () {
    function FormInput(node, onChange) {
      var _this = this;

      _classCallCheck(this, FormInput);

      this.el = 'input';
      this.node = node;
      this.name = node.dataset.name;
      this.type = node.dataset.type;
      this.onChange = onChange; // don't show errors until the user interacted with the input

      this.didInteract = false;
      this.didChangeOnce = false;

      this.didChange = function () {
        _this.didChangeOnce = true;

        _this.onChange();
      };

      this.init();
    }

    _createClass(FormInput, [{
      key: "init",
      value: function init() {
        var _this2 = this;

        var type = this.type;
        var inputs = this.node.querySelectorAll('input');

        for (var _i2 = 0; _i2 < inputs.length; _i2++) {
          var input = inputs[_i2];
          input.addEventListener('change', this.didChange);

          if (type === 'number' || type === 'text' || type === 'money' || type === 'date' || type === 'time' || type === 'datetime') {
            input.addEventListener('blur', function () {
              _this2.didInteract = true;

              _this2.onChange();
            });
          } else if (type === 'boolean') {
            input.addEventListener('change', function () {
              _this2.didInteract = true;
            });
          } else if (type === 'boolean_table') {
            input.addEventListener('change', function () {
              if (_this2.node.dataset.minSelect) {
                // only consider interacted after selecting minSelect items
                var value = _this2.getValue();

                var selected = 0;

                var _iterator2 = _createForOfIteratorHelper(value),
                    _step2;

                try {
                  for (_iterator2.s(); !(_step2 = _iterator2.n()).done;) {
                    var row = _step2.value;

                    var _iterator3 = _createForOfIteratorHelper(row),
                        _step3;

                    try {
                      for (_iterator3.s(); !(_step3 = _iterator3.n()).done;) {
                        var col = _step3.value;
                        if (col) selected++;
                      }
                    } catch (err) {
                      _iterator3.e(err);
                    } finally {
                      _iterator3.f();
                    }
                  }
                } catch (err) {
                  _iterator2.e(err);
                } finally {
                  _iterator2.f();
                }

                if (selected < _this2.node.dataset.minSelect) return;
              }

              _this2.didInteract = true;
            });
          }
        }

        if (type === 'enum') {
          if (this.node.dataset.variant === 'select') {
            this.node.querySelector('select').addEventListener('change', function () {
              _this2.didInteract = true;

              _this2.didChange();
            });
          }
        } else if (type === 'date') {
          var _input = this.node.querySelector('input'); // type="date" will fall back to "text" on browsers where date isn't supported


          if (_input.type !== 'date') initDatePolyfill(_input, function () {
            _this2.didInteract = true;

            _this2.didChange();
          });
        } else if (type === 'time') {
          var _input2 = this.node.querySelector('input');

          if (_input2.type !== 'time') initTimePolyfill(_input2, function () {
            _this2.didInteract = true;

            _this2.didChange();
          });
        } else if (type === 'datetime') {
          var _input3 = this.node.querySelector('input');

          if (_input3.type !== 'datetime-local') initDateTimePolyfill(_input3);
        } else if (type === 'country') {
          this.node.querySelector('select').addEventListener('change', function () {
            _this2.didInteract = true;

            _this2.didChange();
          });
        }

        var _this$node$dataset = this.node.dataset,
            scriptDefault = _this$node$dataset.scriptDefault,
            scriptRequired = _this$node$dataset.scriptRequired,
            scriptDisabled = _this$node$dataset.scriptDisabled;
        if (scriptDefault) this.scriptDefault = JSON.parse(atob(scriptDefault));
        if (scriptRequired) this.scriptRequired = JSON.parse(atob(scriptRequired));
        if (scriptDisabled) this.scriptDisabled = JSON.parse(atob(scriptDisabled));
      }
    }, {
      key: "update",
      value: function update(scriptStack, formVars) {
        if (!this.didChangeOnce && this.scriptDefault) {
          // update the value with the default as long as it wasn't edited
          try {
            var value = ascEval(scriptStack, formVars, this.scriptDefault);
            this.setValue(value);
          } catch (err) {
            console.warn("Error setting default value for ".concat(this.name), err);
          }
        }

        if (this.scriptRequired) {
          try {
            var _value = ascEval(scriptStack, formVars, this.scriptRequired);

            this.setRequired(_value === true);
          } catch (err) {
            console.warn("Error getting required parameter for ".concat(this.name), err);
          }
        }

        if (this.scriptDisabled) {
          try {
            var _value2 = ascEval(scriptStack, formVars, this.scriptDisabled);

            this.setDisabled(_value2 === true);
          } catch (err) {
            console.warn("Error getting disabled parameter for ".concat(this.name), err);
          }
        }
      }
    }, {
      key: "getValue",
      value: function getValue() {
        var type = this.type;

        if (type === 'boolean') {
          return this.node.querySelector('input').checked;
        } else if (type === 'number' || type === 'money') {
          var _this$node$querySelec = this.node.querySelector('input'),
              value = _this$node$querySelec.value;

          var parsed = parseFloat(value);
          if (Number.isFinite(parsed)) return parsed;
          return null;
        } else if (type === 'text') {
          var input = this.node.querySelector('input') || this.node.querySelector('textarea');
          return input.value || null;
        } else if (type === 'enum') {
          var variant = this.node.dataset.variant;

          if (variant === 'select') {
            return this.node.querySelector('select').value || null;
          } else if (variant === 'radio') {
            var inputs = this.node.querySelectorAll('input[type=radio]');

            for (var _i3 = 0; _i3 < inputs.length; _i3++) {
              if (inputs[_i3].checked) return inputs[_i3].value;
            }

            return null;
          }
        } else if (type === 'country') ; else if (type === 'date') {
          var _this$node$querySelec2 = this.node.querySelector('input'),
              _value3 = _this$node$querySelec2.value;

          var match = _value3.match(RE_DATE_FMT);

          if (match) return _value3;
          return null;
        } else if (type === 'time') {
          var _this$node$querySelec3 = this.node.querySelector('input'),
              _value4 = _this$node$querySelec3.value;

          var _match = _value4.match(RE_TIME_FMT);

          if (_match) return _value4;
          return null;
        } else if (type === 'datetime') {
          var tz = this.node.dataset.tz;

          var _this$node$querySelec4 = this.node.querySelector('input'),
              _value5 = _this$node$querySelec4.value;

          var _match2 = _value5.match(RE_DATETIME_FMT);

          if (_match2) {
            var tzOffset = Number.isFinite(tz) ? tz : new Date().getTimezoneOffset();
            return stdlib.ts_from_date(_match2[1], tzOffset, +_match2[2], +_match2[3], +_match2[4]);
          }

          return null;
        } else if (type === 'boolean_table') {
          var _this$node$dataset2 = this.node.dataset,
              cols = _this$node$dataset2.cols,
              rows = _this$node$dataset2.rows;
          var _value6 = [];

          for (var y = 0; y < rows; y++) {
            var row = [];

            for (var x = 0; x < cols; x++) {
              var box = this.node.querySelector("input[data-index=\"".concat(x, "-").concat(y, "\"]"));
              if (!box) row.push(null);else row.push(box.checked);
            }

            _value6.push(row);
          }

          return _value6;
        }
      }
    }, {
      key: "setValue",
      value: function setValue(value) {
        // TODO: don't crash if the value is invalid
        var type = this.type;

        if (type === 'boolean') {
          this.node.querySelector('input').checked = !!value;
        } else if (type === 'number' || type === 'money') {
          this.node.querySelector('input').value = value || '';
        } else if (type === 'text') {
          var input = this.node.querySelector('input') || this.node.querySelector('textarea');
          input.value || '';
        } else if (type === 'enum') {
          var variant = this.node.dataset.variant;

          if (variant === 'select') {
            this.node.querySelector('select').value = value || '';
          } else if (variant === 'radio') {
            var inputs = this.node.querySelectorAll('input[type=radio]');

            for (var _i4 = 0; _i4 < inputs.length; _i4++) {
              inputs[_i4].checked = inputs[_i4].value === value;
            }
          }
        } else if (type === 'country') ; else if (type === 'date') {
          this.node.querySelector('input').value = value;
        } else if (type === 'time') {
          this.node.querySelector('input').value = value;
        } else if (type === 'datetime') {
          var tz = this.node.dataset.tz;
          var tzOffset = Number.isFinite(tz) ? tz : new Date().getTimezoneOffset();
          var da = new Date(+value + tzOffset * 60000);
          this.node.querySelector('input').value = da.toISOString().replace(/Z$/, '');
        } else if (type === 'boolean_table') {
          var _this$node$dataset3 = this.node.dataset,
              cols = _this$node$dataset3.cols,
              rows = _this$node$dataset3.rows;

          for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
              var box = this.node.querySelector("input[data-index=\"".concat(x, "-").concat(y, "\"]"));

              if (box) {
                box.checked = value[y][x];
              }
            }
          }
        }
      }
    }, {
      key: "getRequired",
      value: function getRequired() {
        return !!this.node.dataset.required;
      }
    }, {
      key: "setRequired",
      value: function setRequired(required) {
        var label = this.node.querySelector('label');
        var oldReq = label.querySelector('.label-required');
        this.node.dataset.required = required ? 'true' : '';
        if (oldReq && !required) label.removeChild(oldReq);else if (!oldReq && required) {
          var req = document.createElement('span');
          req.className = 'label-required';
          req.textContent = ' *';
          label.appendChild(req);
        }
      }
    }, {
      key: "setDisabled",
      value: function setDisabled(disabled) {
        var type = this.type;

        if (type === 'boolean' || type === 'number' || type === 'money' || type === 'date' || type === 'time' || type === 'datetime') {
          this.node.querySelector('input').disabled = disabled;
        } else if (type === 'text') {
          var input = this.node.querySelector('input') || this.node.querySelector('textarea');
          input.disabled = disabled;
        } else if (type === 'enum') {
          var variant = this.node.dataset.variant;

          if (variant === 'select') {
            this.node.querySelector('select').disabled = disabled;
          } else if (variant === 'radio') {
            var inputs = this.node.querySelectorAll('input[type=radio]');

            for (var _i5 = 0; _i5 < inputs.length; _i5++) {
              var radio = inputs[_i5];
              radio.disabled = disabled || radio.dataset.disabled;
            }
          }
        } else if (type === 'country') {
          this.node.querySelector('select').disabled = disabled;
        } else if (type === 'boolean_table') {
          var _this$node$dataset4 = this.node.dataset,
              cols = _this$node$dataset4.cols,
              rows = _this$node$dataset4.rows;

          for (var y = 0; y < rows; y++) {
            for (var x = 0; x < cols; x++) {
              var box = this.node.querySelector("input[data-index=\"".concat(x, "-").concat(y, "\"]"));
              if (box) box.disabled = disabled;
            }
          }
        }
      }
    }, {
      key: "getValidationError",
      value: function getValidationError() {
        var type = this.type;
        var isRequired = this.getRequired();
        var value = this.getValue();

        if (isRequired && value === null) {
          return localize('err_field_is_required');
        }

        if (value !== null) {
          if (type === 'boolean') {
            if (isRequired && !value) {
              // booleans are special; required means they must be true
              return localize('err_field_is_required');
            }
          } else if (type === 'number') ; else if (type === 'text') {
            var input = this.node.querySelector('input') || this.node.querySelector('textarea');
            var pattern = input.getAttribute('pattern');

            if (pattern) {
              try {
                var re = new RegExp(pattern);

                if (!re.test(value)) {
                  return input.dataset.patternError || localize('err_text_pattern_generic');
                }
              } catch (_unused) {
                /* ignore invalid regex */
              }
            } // min/maxLength handled in HTML

          } else if (type === 'money') ; else if (type === 'enum') ; else if (type === 'country') ; else if (type === 'date') {
            if (!RE_DATE_FMT.test(value)) {
              return localize('err_date_fmt');
            } // TODO: validate date range in Safari

          } else if (type === 'time') {
            if (!RE_TIME_FMT.test(value)) {
              return localize('err_time_fmt');
            } // TODO: validate time range in Safari

          } else if (type === 'datetime') {
            if (!RE_DATETIME_FMT.test(value)) {
              return localize('err_datetime_fmt');
            } // TODO: validate datetime range in Safari

          } else if (type === 'boolean_table') {
            var selected = 0;

            var _iterator4 = _createForOfIteratorHelper(value),
                _step4;

            try {
              for (_iterator4.s(); !(_step4 = _iterator4.n()).done;) {
                var row = _step4.value;

                var _iterator5 = _createForOfIteratorHelper(row),
                    _step5;

                try {
                  for (_iterator5.s(); !(_step5 = _iterator5.n()).done;) {
                    var col = _step5.value;
                    if (col) selected++;
                  }
                } catch (err) {
                  _iterator5.e(err);
                } finally {
                  _iterator5.f();
                }
              }
            } catch (err) {
              _iterator4.e(err);
            } finally {
              _iterator4.f();
            }

            var _this$node$dataset5 = this.node.dataset,
                minSelect = _this$node$dataset5.minSelect,
                maxSelect = _this$node$dataset5.maxSelect;
            var fulfillsMin = minSelect ? selected >= minSelect : true;
            var fulfillsMax = maxSelect ? selected <= maxSelect : true;

            if (minSelect && maxSelect) {
              if (!fulfillsMin || !fulfillsMax) {
                return localize('err_bool_table_select_range', minSelect, maxSelect);
              }
            } else if (!fulfillsMin) {
              return localize('err_bool_table_select_min', minSelect);
            } else if (!fulfillsMax) {
              return localize('err_bool_table_select_max', maxSelect);
            }
          }
        }

        return null;
      }
    }, {
      key: "validate",
      value: function validate() {
        if (!this.didInteract) return;
        var error = this.getValidationError();
        this.setError(error);
        return !error;
      }
    }, {
      key: "setError",
      value: function setError(str) {
        var errorNode = this.node.querySelector('.field-error');
        if (errorNode && str) errorNode.textContent = str;else if (str) {
          var _errorNode = document.createElement('div');

          _errorNode.className = 'field-error';
          _errorNode.textContent = str;
          this.node.appendChild(_errorNode);
        } else if (errorNode) {
          this.node.removeChild(errorNode);
        }
      }
    }]);

    return FormInput;
  }();

  function initFormItem(node, onChange) {
    if (node.dataset.el === 'input') {
      var name = node.dataset.name;
      var type = node.dataset.type;
      return new FormInput(node, onChange);
    } else if (node.dataset.el === 'text') {
      var script = decodeScript(node.dataset.script);
      return {
        el: 'text',
        script: script
      };
    } else if (node.dataset.el === 'script') {
      return {
        el: 'script',
        script: decodeScript(node.dataset.script)
      };
    }
  }

  function init() {
    var form = document.querySelector('#akso-congress-registration-form');
    if (!form) return;
    var submitButton = form.querySelector('.submit-button'); // these are probably in the correct order

    var qaFormItems = form.querySelectorAll('.form-item');
    var formItems = [];
    var update;

    var onChange = function onChange() {
      return update();
    };

    for (var _i6 = 0; _i6 < qaFormItems.length; _i6++) {
      formItems.push(initFormItem(qaFormItems[_i6], onChange));
    }

    update = function update(isSubmissionAttempt) {
      var isValid = true;
      var scriptStack = [];
      var formVars = {
        // TODO: get actual values
        '@created_time': null,
        '@edited_time': null,
        '@is_member': false
      };

      var firstInvalidInput = null;

      var _iterator6 = _createForOfIteratorHelper(formItems),
          _step6;

      try {
        for (_iterator6.s(); !(_step6 = _iterator6.n()).done;) {
          var item = _step6.value;

          if (item.el === 'text') {
            if (item.script) {
              try {
                var result = ascEval(scriptStack, formVars, item.script);

                if (result) {
                  item.node.innerHTML = md.render(result.toString());
                } else {
                  item.node.innerHTML = '';
                }
              } catch (err) {
                console.error('Script eval error', err); // error
                // TODO: handle
              }
            }
          } else if (item.el === 'input') {
            item.update(scriptStack, formVars);
            formVars[item.name] = item.getValue();

            if (!item.validate()) {
              isValid = false;
              if (!firstInvalidInput) firstInvalidInput = item;
            }
          } else if (item.el === 'script') {
            scriptStack.push(item.script);
          }
        }
      } catch (err) {
        _iterator6.e(err);
      } finally {
        _iterator6.f();
      }

      if (!isValid && isSubmissionAttempt && firstInvalidInput) {
        scrollNodeIntoView(firstInvalidInput.node);
      }

      return isValid;
    };

    update();
    submitButton.addEventListener('click', function (e) {
      // show all errors
      var _iterator7 = _createForOfIteratorHelper(formItems),
          _step7;

      try {
        for (_iterator7.s(); !(_step7 = _iterator7.n()).done;) {
          var item = _step7.value;
          item.didInteract = true;
        }
      } catch (err) {
        _iterator7.e(err);
      } finally {
        _iterator7.f();
      }

      if (!update(true)) e.preventDefault();
    });
  }

  if (document.readyState === 'complete') init();else window.addEventListener('DOMContentLoaded', init);

  exports.commonjsGlobal = commonjsGlobal;
  exports.commonjsRequire = commonjsRequire;
  exports.createCommonjsModule = createCommonjsModule;
  exports.stdlibExt = stdlibExt;

  Object.defineProperty(exports, '__esModule', { value: true });

});
