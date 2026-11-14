var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// node_modules/i18next/dist/cjs/i18next.js
var require_i18next = __commonJS({
  "node_modules/i18next/dist/cjs/i18next.js"(exports2, module2) {
    "use strict";
    var isString = (obj) => typeof obj === "string";
    var defer = () => {
      let res;
      let rej;
      const promise = new Promise((resolve, reject) => {
        res = resolve;
        rej = reject;
      });
      promise.resolve = res;
      promise.reject = rej;
      return promise;
    };
    var makeString = (object) => {
      if (object == null)
        return "";
      return "" + object;
    };
    var copy = (a, s, t) => {
      a.forEach((m) => {
        if (s[m])
          t[m] = s[m];
      });
    };
    var lastOfPathSeparatorRegExp = /###/g;
    var cleanKey = (key) => key && key.indexOf("###") > -1 ? key.replace(lastOfPathSeparatorRegExp, ".") : key;
    var canNotTraverseDeeper = (object) => !object || isString(object);
    var getLastOfPath = (object, path, Empty) => {
      const stack = !isString(path) ? path : path.split(".");
      let stackIndex = 0;
      while (stackIndex < stack.length - 1) {
        if (canNotTraverseDeeper(object))
          return {};
        const key = cleanKey(stack[stackIndex]);
        if (!object[key] && Empty)
          object[key] = new Empty();
        if (Object.prototype.hasOwnProperty.call(object, key)) {
          object = object[key];
        } else {
          object = {};
        }
        ++stackIndex;
      }
      if (canNotTraverseDeeper(object))
        return {};
      return {
        obj: object,
        k: cleanKey(stack[stackIndex])
      };
    };
    var setPath = (object, path, newValue) => {
      const {
        obj,
        k
      } = getLastOfPath(object, path, Object);
      if (obj !== void 0 || path.length === 1) {
        obj[k] = newValue;
        return;
      }
      let e = path[path.length - 1];
      let p = path.slice(0, path.length - 1);
      let last = getLastOfPath(object, p, Object);
      while (last.obj === void 0 && p.length) {
        e = `${p[p.length - 1]}.${e}`;
        p = p.slice(0, p.length - 1);
        last = getLastOfPath(object, p, Object);
        if (last && last.obj && typeof last.obj[`${last.k}.${e}`] !== "undefined") {
          last.obj = void 0;
        }
      }
      last.obj[`${last.k}.${e}`] = newValue;
    };
    var pushPath = (object, path, newValue, concat) => {
      const {
        obj,
        k
      } = getLastOfPath(object, path, Object);
      obj[k] = obj[k] || [];
      obj[k].push(newValue);
    };
    var getPath = (object, path) => {
      const {
        obj,
        k
      } = getLastOfPath(object, path);
      if (!obj)
        return void 0;
      return obj[k];
    };
    var getPathWithDefaults = (data, defaultData, key) => {
      const value = getPath(data, key);
      if (value !== void 0) {
        return value;
      }
      return getPath(defaultData, key);
    };
    var deepExtend = (target, source, overwrite) => {
      for (const prop in source) {
        if (prop !== "__proto__" && prop !== "constructor") {
          if (prop in target) {
            if (isString(target[prop]) || target[prop] instanceof String || isString(source[prop]) || source[prop] instanceof String) {
              if (overwrite)
                target[prop] = source[prop];
            } else {
              deepExtend(target[prop], source[prop], overwrite);
            }
          } else {
            target[prop] = source[prop];
          }
        }
      }
      return target;
    };
    var regexEscape = (str) => str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
    var _entityMap = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
      "/": "&#x2F;"
    };
    var escape = (data) => {
      if (isString(data)) {
        return data.replace(/[&<>"'\/]/g, (s) => _entityMap[s]);
      }
      return data;
    };
    var RegExpCache = class {
      constructor(capacity) {
        this.capacity = capacity;
        this.regExpMap = /* @__PURE__ */ new Map();
        this.regExpQueue = [];
      }
      getRegExp(pattern) {
        const regExpFromCache = this.regExpMap.get(pattern);
        if (regExpFromCache !== void 0) {
          return regExpFromCache;
        }
        const regExpNew = new RegExp(pattern);
        if (this.regExpQueue.length === this.capacity) {
          this.regExpMap.delete(this.regExpQueue.shift());
        }
        this.regExpMap.set(pattern, regExpNew);
        this.regExpQueue.push(pattern);
        return regExpNew;
      }
    };
    var chars = [" ", ",", "?", "!", ";"];
    var looksLikeObjectPathRegExpCache = new RegExpCache(20);
    var looksLikeObjectPath = (key, nsSeparator, keySeparator) => {
      nsSeparator = nsSeparator || "";
      keySeparator = keySeparator || "";
      const possibleChars = chars.filter((c) => nsSeparator.indexOf(c) < 0 && keySeparator.indexOf(c) < 0);
      if (possibleChars.length === 0)
        return true;
      const r = looksLikeObjectPathRegExpCache.getRegExp(`(${possibleChars.map((c) => c === "?" ? "\\?" : c).join("|")})`);
      let matched = !r.test(key);
      if (!matched) {
        const ki = key.indexOf(keySeparator);
        if (ki > 0 && !r.test(key.substring(0, ki))) {
          matched = true;
        }
      }
      return matched;
    };
    var deepFind = function(obj, path) {
      let keySeparator = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : ".";
      if (!obj)
        return void 0;
      if (obj[path])
        return obj[path];
      const tokens = path.split(keySeparator);
      let current = obj;
      for (let i = 0; i < tokens.length; ) {
        if (!current || typeof current !== "object") {
          return void 0;
        }
        let next;
        let nextPath = "";
        for (let j = i; j < tokens.length; ++j) {
          if (j !== i) {
            nextPath += keySeparator;
          }
          nextPath += tokens[j];
          next = current[nextPath];
          if (next !== void 0) {
            if (["string", "number", "boolean"].indexOf(typeof next) > -1 && j < tokens.length - 1) {
              continue;
            }
            i += j - i + 1;
            break;
          }
        }
        current = next;
      }
      return current;
    };
    var getCleanedCode = (code) => code && code.replace("_", "-");
    var consoleLogger = {
      type: "logger",
      log(args) {
        this.output("log", args);
      },
      warn(args) {
        this.output("warn", args);
      },
      error(args) {
        this.output("error", args);
      },
      output(type, args) {
        if (console && console[type])
          console[type].apply(console, args);
      }
    };
    var Logger = class _Logger {
      constructor(concreteLogger) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.init(concreteLogger, options);
      }
      init(concreteLogger) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.prefix = options.prefix || "i18next:";
        this.logger = concreteLogger || consoleLogger;
        this.options = options;
        this.debug = options.debug;
      }
      log() {
        for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
          args[_key] = arguments[_key];
        }
        return this.forward(args, "log", "", true);
      }
      warn() {
        for (var _len2 = arguments.length, args = new Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
          args[_key2] = arguments[_key2];
        }
        return this.forward(args, "warn", "", true);
      }
      error() {
        for (var _len3 = arguments.length, args = new Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
          args[_key3] = arguments[_key3];
        }
        return this.forward(args, "error", "");
      }
      deprecate() {
        for (var _len4 = arguments.length, args = new Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
          args[_key4] = arguments[_key4];
        }
        return this.forward(args, "warn", "WARNING DEPRECATED: ", true);
      }
      forward(args, lvl, prefix, debugOnly) {
        if (debugOnly && !this.debug)
          return null;
        if (isString(args[0]))
          args[0] = `${prefix}${this.prefix} ${args[0]}`;
        return this.logger[lvl](args);
      }
      create(moduleName) {
        return new _Logger(this.logger, {
          ...{
            prefix: `${this.prefix}:${moduleName}:`
          },
          ...this.options
        });
      }
      clone(options) {
        options = options || this.options;
        options.prefix = options.prefix || this.prefix;
        return new _Logger(this.logger, options);
      }
    };
    var baseLogger = new Logger();
    var EventEmitter = class {
      constructor() {
        this.observers = {};
      }
      on(events, listener) {
        events.split(" ").forEach((event) => {
          if (!this.observers[event])
            this.observers[event] = /* @__PURE__ */ new Map();
          const numListeners = this.observers[event].get(listener) || 0;
          this.observers[event].set(listener, numListeners + 1);
        });
        return this;
      }
      off(event, listener) {
        if (!this.observers[event])
          return;
        if (!listener) {
          delete this.observers[event];
          return;
        }
        this.observers[event].delete(listener);
      }
      emit(event) {
        for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
          args[_key - 1] = arguments[_key];
        }
        if (this.observers[event]) {
          const cloned = Array.from(this.observers[event].entries());
          cloned.forEach((_ref) => {
            let [observer, numTimesAdded] = _ref;
            for (let i = 0; i < numTimesAdded; i++) {
              observer(...args);
            }
          });
        }
        if (this.observers["*"]) {
          const cloned = Array.from(this.observers["*"].entries());
          cloned.forEach((_ref2) => {
            let [observer, numTimesAdded] = _ref2;
            for (let i = 0; i < numTimesAdded; i++) {
              observer.apply(observer, [event, ...args]);
            }
          });
        }
      }
    };
    var ResourceStore = class extends EventEmitter {
      constructor(data) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
          ns: ["translation"],
          defaultNS: "translation"
        };
        super();
        this.data = data || {};
        this.options = options;
        if (this.options.keySeparator === void 0) {
          this.options.keySeparator = ".";
        }
        if (this.options.ignoreJSONStructure === void 0) {
          this.options.ignoreJSONStructure = true;
        }
      }
      addNamespaces(ns) {
        if (this.options.ns.indexOf(ns) < 0) {
          this.options.ns.push(ns);
        }
      }
      removeNamespaces(ns) {
        const index = this.options.ns.indexOf(ns);
        if (index > -1) {
          this.options.ns.splice(index, 1);
        }
      }
      getResource(lng, ns, key) {
        let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
        const ignoreJSONStructure = options.ignoreJSONStructure !== void 0 ? options.ignoreJSONStructure : this.options.ignoreJSONStructure;
        let path;
        if (lng.indexOf(".") > -1) {
          path = lng.split(".");
        } else {
          path = [lng, ns];
          if (key) {
            if (Array.isArray(key)) {
              path.push(...key);
            } else if (isString(key) && keySeparator) {
              path.push(...key.split(keySeparator));
            } else {
              path.push(key);
            }
          }
        }
        const result = getPath(this.data, path);
        if (!result && !ns && !key && lng.indexOf(".") > -1) {
          lng = path[0];
          ns = path[1];
          key = path.slice(2).join(".");
        }
        if (result || !ignoreJSONStructure || !isString(key))
          return result;
        return deepFind(this.data && this.data[lng] && this.data[lng][ns], key, keySeparator);
      }
      addResource(lng, ns, key, value) {
        let options = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : {
          silent: false
        };
        const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
        let path = [lng, ns];
        if (key)
          path = path.concat(keySeparator ? key.split(keySeparator) : key);
        if (lng.indexOf(".") > -1) {
          path = lng.split(".");
          value = ns;
          ns = path[1];
        }
        this.addNamespaces(ns);
        setPath(this.data, path, value);
        if (!options.silent)
          this.emit("added", lng, ns, key, value);
      }
      addResources(lng, ns, resources) {
        let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {
          silent: false
        };
        for (const m in resources) {
          if (isString(resources[m]) || Array.isArray(resources[m]))
            this.addResource(lng, ns, m, resources[m], {
              silent: true
            });
        }
        if (!options.silent)
          this.emit("added", lng, ns, resources);
      }
      addResourceBundle(lng, ns, resources, deep, overwrite) {
        let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {
          silent: false,
          skipCopy: false
        };
        let path = [lng, ns];
        if (lng.indexOf(".") > -1) {
          path = lng.split(".");
          deep = resources;
          resources = ns;
          ns = path[1];
        }
        this.addNamespaces(ns);
        let pack = getPath(this.data, path) || {};
        if (!options.skipCopy)
          resources = JSON.parse(JSON.stringify(resources));
        if (deep) {
          deepExtend(pack, resources, overwrite);
        } else {
          pack = {
            ...pack,
            ...resources
          };
        }
        setPath(this.data, path, pack);
        if (!options.silent)
          this.emit("added", lng, ns, resources);
      }
      removeResourceBundle(lng, ns) {
        if (this.hasResourceBundle(lng, ns)) {
          delete this.data[lng][ns];
        }
        this.removeNamespaces(ns);
        this.emit("removed", lng, ns);
      }
      hasResourceBundle(lng, ns) {
        return this.getResource(lng, ns) !== void 0;
      }
      getResourceBundle(lng, ns) {
        if (!ns)
          ns = this.options.defaultNS;
        if (this.options.compatibilityAPI === "v1")
          return {
            ...{},
            ...this.getResource(lng, ns)
          };
        return this.getResource(lng, ns);
      }
      getDataByLanguage(lng) {
        return this.data[lng];
      }
      hasLanguageSomeTranslations(lng) {
        const data = this.getDataByLanguage(lng);
        const n = data && Object.keys(data) || [];
        return !!n.find((v) => data[v] && Object.keys(data[v]).length > 0);
      }
      toJSON() {
        return this.data;
      }
    };
    var postProcessor = {
      processors: {},
      addPostProcessor(module3) {
        this.processors[module3.name] = module3;
      },
      handle(processors, value, key, options, translator) {
        processors.forEach((processor) => {
          if (this.processors[processor])
            value = this.processors[processor].process(value, key, options, translator);
        });
        return value;
      }
    };
    var checkedLoadedFor = {};
    var Translator = class _Translator extends EventEmitter {
      constructor(services) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        super();
        copy(["resourceStore", "languageUtils", "pluralResolver", "interpolator", "backendConnector", "i18nFormat", "utils"], services, this);
        this.options = options;
        if (this.options.keySeparator === void 0) {
          this.options.keySeparator = ".";
        }
        this.logger = baseLogger.create("translator");
      }
      changeLanguage(lng) {
        if (lng)
          this.language = lng;
      }
      exists(key) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
          interpolation: {}
        };
        if (key === void 0 || key === null) {
          return false;
        }
        const resolved = this.resolve(key, options);
        return resolved && resolved.res !== void 0;
      }
      extractFromKey(key, options) {
        let nsSeparator = options.nsSeparator !== void 0 ? options.nsSeparator : this.options.nsSeparator;
        if (nsSeparator === void 0)
          nsSeparator = ":";
        const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
        let namespaces = options.ns || this.options.defaultNS || [];
        const wouldCheckForNsInKey = nsSeparator && key.indexOf(nsSeparator) > -1;
        const seemsNaturalLanguage = !this.options.userDefinedKeySeparator && !options.keySeparator && !this.options.userDefinedNsSeparator && !options.nsSeparator && !looksLikeObjectPath(key, nsSeparator, keySeparator);
        if (wouldCheckForNsInKey && !seemsNaturalLanguage) {
          const m = key.match(this.interpolator.nestingRegexp);
          if (m && m.length > 0) {
            return {
              key,
              namespaces: isString(namespaces) ? [namespaces] : namespaces
            };
          }
          const parts = key.split(nsSeparator);
          if (nsSeparator !== keySeparator || nsSeparator === keySeparator && this.options.ns.indexOf(parts[0]) > -1)
            namespaces = parts.shift();
          key = parts.join(keySeparator);
        }
        return {
          key,
          namespaces: isString(namespaces) ? [namespaces] : namespaces
        };
      }
      translate(keys, options, lastKey) {
        if (typeof options !== "object" && this.options.overloadTranslationOptionHandler) {
          options = this.options.overloadTranslationOptionHandler(arguments);
        }
        if (typeof options === "object")
          options = {
            ...options
          };
        if (!options)
          options = {};
        if (keys === void 0 || keys === null)
          return "";
        if (!Array.isArray(keys))
          keys = [String(keys)];
        const returnDetails = options.returnDetails !== void 0 ? options.returnDetails : this.options.returnDetails;
        const keySeparator = options.keySeparator !== void 0 ? options.keySeparator : this.options.keySeparator;
        const {
          key,
          namespaces
        } = this.extractFromKey(keys[keys.length - 1], options);
        const namespace = namespaces[namespaces.length - 1];
        const lng = options.lng || this.language;
        const appendNamespaceToCIMode = options.appendNamespaceToCIMode || this.options.appendNamespaceToCIMode;
        if (lng && lng.toLowerCase() === "cimode") {
          if (appendNamespaceToCIMode) {
            const nsSeparator = options.nsSeparator || this.options.nsSeparator;
            if (returnDetails) {
              return {
                res: `${namespace}${nsSeparator}${key}`,
                usedKey: key,
                exactUsedKey: key,
                usedLng: lng,
                usedNS: namespace,
                usedParams: this.getUsedParamsDetails(options)
              };
            }
            return `${namespace}${nsSeparator}${key}`;
          }
          if (returnDetails) {
            return {
              res: key,
              usedKey: key,
              exactUsedKey: key,
              usedLng: lng,
              usedNS: namespace,
              usedParams: this.getUsedParamsDetails(options)
            };
          }
          return key;
        }
        const resolved = this.resolve(keys, options);
        let res = resolved && resolved.res;
        const resUsedKey = resolved && resolved.usedKey || key;
        const resExactUsedKey = resolved && resolved.exactUsedKey || key;
        const resType = Object.prototype.toString.apply(res);
        const noObject = ["[object Number]", "[object Function]", "[object RegExp]"];
        const joinArrays = options.joinArrays !== void 0 ? options.joinArrays : this.options.joinArrays;
        const handleAsObjectInI18nFormat = !this.i18nFormat || this.i18nFormat.handleAsObject;
        const handleAsObject = !isString(res) && typeof res !== "boolean" && typeof res !== "number";
        if (handleAsObjectInI18nFormat && res && handleAsObject && noObject.indexOf(resType) < 0 && !(isString(joinArrays) && Array.isArray(res))) {
          if (!options.returnObjects && !this.options.returnObjects) {
            if (!this.options.returnedObjectHandler) {
              this.logger.warn("accessing an object - but returnObjects options is not enabled!");
            }
            const r = this.options.returnedObjectHandler ? this.options.returnedObjectHandler(resUsedKey, res, {
              ...options,
              ns: namespaces
            }) : `key '${key} (${this.language})' returned an object instead of string.`;
            if (returnDetails) {
              resolved.res = r;
              resolved.usedParams = this.getUsedParamsDetails(options);
              return resolved;
            }
            return r;
          }
          if (keySeparator) {
            const resTypeIsArray = Array.isArray(res);
            const copy2 = resTypeIsArray ? [] : {};
            const newKeyToUse = resTypeIsArray ? resExactUsedKey : resUsedKey;
            for (const m in res) {
              if (Object.prototype.hasOwnProperty.call(res, m)) {
                const deepKey = `${newKeyToUse}${keySeparator}${m}`;
                copy2[m] = this.translate(deepKey, {
                  ...options,
                  ...{
                    joinArrays: false,
                    ns: namespaces
                  }
                });
                if (copy2[m] === deepKey)
                  copy2[m] = res[m];
              }
            }
            res = copy2;
          }
        } else if (handleAsObjectInI18nFormat && isString(joinArrays) && Array.isArray(res)) {
          res = res.join(joinArrays);
          if (res)
            res = this.extendTranslation(res, keys, options, lastKey);
        } else {
          let usedDefault = false;
          let usedKey = false;
          const needsPluralHandling = options.count !== void 0 && !isString(options.count);
          const hasDefaultValue = _Translator.hasDefaultValue(options);
          const defaultValueSuffix = needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, options) : "";
          const defaultValueSuffixOrdinalFallback = options.ordinal && needsPluralHandling ? this.pluralResolver.getSuffix(lng, options.count, {
            ordinal: false
          }) : "";
          const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && this.pluralResolver.shouldUseIntlApi();
          const defaultValue = needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] || options[`defaultValue${defaultValueSuffix}`] || options[`defaultValue${defaultValueSuffixOrdinalFallback}`] || options.defaultValue;
          if (!this.isValidLookup(res) && hasDefaultValue) {
            usedDefault = true;
            res = defaultValue;
          }
          if (!this.isValidLookup(res)) {
            usedKey = true;
            res = key;
          }
          const missingKeyNoValueFallbackToKey = options.missingKeyNoValueFallbackToKey || this.options.missingKeyNoValueFallbackToKey;
          const resForMissing = missingKeyNoValueFallbackToKey && usedKey ? void 0 : res;
          const updateMissing = hasDefaultValue && defaultValue !== res && this.options.updateMissing;
          if (usedKey || usedDefault || updateMissing) {
            this.logger.log(updateMissing ? "updateKey" : "missingKey", lng, namespace, key, updateMissing ? defaultValue : res);
            if (keySeparator) {
              const fk = this.resolve(key, {
                ...options,
                keySeparator: false
              });
              if (fk && fk.res)
                this.logger.warn("Seems the loaded translations were in flat JSON format instead of nested. Either set keySeparator: false on init or make sure your translations are published in nested format.");
            }
            let lngs = [];
            const fallbackLngs = this.languageUtils.getFallbackCodes(this.options.fallbackLng, options.lng || this.language);
            if (this.options.saveMissingTo === "fallback" && fallbackLngs && fallbackLngs[0]) {
              for (let i = 0; i < fallbackLngs.length; i++) {
                lngs.push(fallbackLngs[i]);
              }
            } else if (this.options.saveMissingTo === "all") {
              lngs = this.languageUtils.toResolveHierarchy(options.lng || this.language);
            } else {
              lngs.push(options.lng || this.language);
            }
            const send = (l, k, specificDefaultValue) => {
              const defaultForMissing = hasDefaultValue && specificDefaultValue !== res ? specificDefaultValue : resForMissing;
              if (this.options.missingKeyHandler) {
                this.options.missingKeyHandler(l, namespace, k, defaultForMissing, updateMissing, options);
              } else if (this.backendConnector && this.backendConnector.saveMissing) {
                this.backendConnector.saveMissing(l, namespace, k, defaultForMissing, updateMissing, options);
              }
              this.emit("missingKey", l, namespace, k, res);
            };
            if (this.options.saveMissing) {
              if (this.options.saveMissingPlurals && needsPluralHandling) {
                lngs.forEach((language) => {
                  const suffixes = this.pluralResolver.getSuffixes(language, options);
                  if (needsZeroSuffixLookup && options[`defaultValue${this.options.pluralSeparator}zero`] && suffixes.indexOf(`${this.options.pluralSeparator}zero`) < 0) {
                    suffixes.push(`${this.options.pluralSeparator}zero`);
                  }
                  suffixes.forEach((suffix) => {
                    send([language], key + suffix, options[`defaultValue${suffix}`] || defaultValue);
                  });
                });
              } else {
                send(lngs, key, defaultValue);
              }
            }
          }
          res = this.extendTranslation(res, keys, options, resolved, lastKey);
          if (usedKey && res === key && this.options.appendNamespaceToMissingKey)
            res = `${namespace}:${key}`;
          if ((usedKey || usedDefault) && this.options.parseMissingKeyHandler) {
            if (this.options.compatibilityAPI !== "v1") {
              res = this.options.parseMissingKeyHandler(this.options.appendNamespaceToMissingKey ? `${namespace}:${key}` : key, usedDefault ? res : void 0);
            } else {
              res = this.options.parseMissingKeyHandler(res);
            }
          }
        }
        if (returnDetails) {
          resolved.res = res;
          resolved.usedParams = this.getUsedParamsDetails(options);
          return resolved;
        }
        return res;
      }
      extendTranslation(res, key, options, resolved, lastKey) {
        var _this = this;
        if (this.i18nFormat && this.i18nFormat.parse) {
          res = this.i18nFormat.parse(res, {
            ...this.options.interpolation.defaultVariables,
            ...options
          }, options.lng || this.language || resolved.usedLng, resolved.usedNS, resolved.usedKey, {
            resolved
          });
        } else if (!options.skipInterpolation) {
          if (options.interpolation)
            this.interpolator.init({
              ...options,
              ...{
                interpolation: {
                  ...this.options.interpolation,
                  ...options.interpolation
                }
              }
            });
          const skipOnVariables = isString(res) && (options && options.interpolation && options.interpolation.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables);
          let nestBef;
          if (skipOnVariables) {
            const nb = res.match(this.interpolator.nestingRegexp);
            nestBef = nb && nb.length;
          }
          let data = options.replace && !isString(options.replace) ? options.replace : options;
          if (this.options.interpolation.defaultVariables)
            data = {
              ...this.options.interpolation.defaultVariables,
              ...data
            };
          res = this.interpolator.interpolate(res, data, options.lng || this.language || resolved.usedLng, options);
          if (skipOnVariables) {
            const na = res.match(this.interpolator.nestingRegexp);
            const nestAft = na && na.length;
            if (nestBef < nestAft)
              options.nest = false;
          }
          if (!options.lng && this.options.compatibilityAPI !== "v1" && resolved && resolved.res)
            options.lng = this.language || resolved.usedLng;
          if (options.nest !== false)
            res = this.interpolator.nest(res, function() {
              for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
                args[_key] = arguments[_key];
              }
              if (lastKey && lastKey[0] === args[0] && !options.context) {
                _this.logger.warn(`It seems you are nesting recursively key: ${args[0]} in key: ${key[0]}`);
                return null;
              }
              return _this.translate(...args, key);
            }, options);
          if (options.interpolation)
            this.interpolator.reset();
        }
        const postProcess = options.postProcess || this.options.postProcess;
        const postProcessorNames = isString(postProcess) ? [postProcess] : postProcess;
        if (res !== void 0 && res !== null && postProcessorNames && postProcessorNames.length && options.applyPostProcessor !== false) {
          res = postProcessor.handle(postProcessorNames, res, key, this.options && this.options.postProcessPassResolved ? {
            i18nResolved: {
              ...resolved,
              usedParams: this.getUsedParamsDetails(options)
            },
            ...options
          } : options, this);
        }
        return res;
      }
      resolve(keys) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        let found;
        let usedKey;
        let exactUsedKey;
        let usedLng;
        let usedNS;
        if (isString(keys))
          keys = [keys];
        keys.forEach((k) => {
          if (this.isValidLookup(found))
            return;
          const extracted = this.extractFromKey(k, options);
          const key = extracted.key;
          usedKey = key;
          let namespaces = extracted.namespaces;
          if (this.options.fallbackNS)
            namespaces = namespaces.concat(this.options.fallbackNS);
          const needsPluralHandling = options.count !== void 0 && !isString(options.count);
          const needsZeroSuffixLookup = needsPluralHandling && !options.ordinal && options.count === 0 && this.pluralResolver.shouldUseIntlApi();
          const needsContextHandling = options.context !== void 0 && (isString(options.context) || typeof options.context === "number") && options.context !== "";
          const codes = options.lngs ? options.lngs : this.languageUtils.toResolveHierarchy(options.lng || this.language, options.fallbackLng);
          namespaces.forEach((ns) => {
            if (this.isValidLookup(found))
              return;
            usedNS = ns;
            if (!checkedLoadedFor[`${codes[0]}-${ns}`] && this.utils && this.utils.hasLoadedNamespace && !this.utils.hasLoadedNamespace(usedNS)) {
              checkedLoadedFor[`${codes[0]}-${ns}`] = true;
              this.logger.warn(`key "${usedKey}" for languages "${codes.join(", ")}" won't get resolved as namespace "${usedNS}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
            }
            codes.forEach((code) => {
              if (this.isValidLookup(found))
                return;
              usedLng = code;
              const finalKeys = [key];
              if (this.i18nFormat && this.i18nFormat.addLookupKeys) {
                this.i18nFormat.addLookupKeys(finalKeys, key, code, ns, options);
              } else {
                let pluralSuffix;
                if (needsPluralHandling)
                  pluralSuffix = this.pluralResolver.getSuffix(code, options.count, options);
                const zeroSuffix = `${this.options.pluralSeparator}zero`;
                const ordinalPrefix = `${this.options.pluralSeparator}ordinal${this.options.pluralSeparator}`;
                if (needsPluralHandling) {
                  finalKeys.push(key + pluralSuffix);
                  if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                    finalKeys.push(key + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                  }
                  if (needsZeroSuffixLookup) {
                    finalKeys.push(key + zeroSuffix);
                  }
                }
                if (needsContextHandling) {
                  const contextKey = `${key}${this.options.contextSeparator}${options.context}`;
                  finalKeys.push(contextKey);
                  if (needsPluralHandling) {
                    finalKeys.push(contextKey + pluralSuffix);
                    if (options.ordinal && pluralSuffix.indexOf(ordinalPrefix) === 0) {
                      finalKeys.push(contextKey + pluralSuffix.replace(ordinalPrefix, this.options.pluralSeparator));
                    }
                    if (needsZeroSuffixLookup) {
                      finalKeys.push(contextKey + zeroSuffix);
                    }
                  }
                }
              }
              let possibleKey;
              while (possibleKey = finalKeys.pop()) {
                if (!this.isValidLookup(found)) {
                  exactUsedKey = possibleKey;
                  found = this.getResource(code, ns, possibleKey, options);
                }
              }
            });
          });
        });
        return {
          res: found,
          usedKey,
          exactUsedKey,
          usedLng,
          usedNS
        };
      }
      isValidLookup(res) {
        return res !== void 0 && !(!this.options.returnNull && res === null) && !(!this.options.returnEmptyString && res === "");
      }
      getResource(code, ns, key) {
        let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        if (this.i18nFormat && this.i18nFormat.getResource)
          return this.i18nFormat.getResource(code, ns, key, options);
        return this.resourceStore.getResource(code, ns, key, options);
      }
      getUsedParamsDetails() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        const optionsKeys = ["defaultValue", "ordinal", "context", "replace", "lng", "lngs", "fallbackLng", "ns", "keySeparator", "nsSeparator", "returnObjects", "returnDetails", "joinArrays", "postProcess", "interpolation"];
        const useOptionsReplaceForData = options.replace && !isString(options.replace);
        let data = useOptionsReplaceForData ? options.replace : options;
        if (useOptionsReplaceForData && typeof options.count !== "undefined") {
          data.count = options.count;
        }
        if (this.options.interpolation.defaultVariables) {
          data = {
            ...this.options.interpolation.defaultVariables,
            ...data
          };
        }
        if (!useOptionsReplaceForData) {
          data = {
            ...data
          };
          for (const key of optionsKeys) {
            delete data[key];
          }
        }
        return data;
      }
      static hasDefaultValue(options) {
        const prefix = "defaultValue";
        for (const option in options) {
          if (Object.prototype.hasOwnProperty.call(options, option) && prefix === option.substring(0, prefix.length) && void 0 !== options[option]) {
            return true;
          }
        }
        return false;
      }
    };
    var capitalize = (string) => string.charAt(0).toUpperCase() + string.slice(1);
    var LanguageUtil = class {
      constructor(options) {
        this.options = options;
        this.supportedLngs = this.options.supportedLngs || false;
        this.logger = baseLogger.create("languageUtils");
      }
      getScriptPartFromCode(code) {
        code = getCleanedCode(code);
        if (!code || code.indexOf("-") < 0)
          return null;
        const p = code.split("-");
        if (p.length === 2)
          return null;
        p.pop();
        if (p[p.length - 1].toLowerCase() === "x")
          return null;
        return this.formatLanguageCode(p.join("-"));
      }
      getLanguagePartFromCode(code) {
        code = getCleanedCode(code);
        if (!code || code.indexOf("-") < 0)
          return code;
        const p = code.split("-");
        return this.formatLanguageCode(p[0]);
      }
      formatLanguageCode(code) {
        if (isString(code) && code.indexOf("-") > -1) {
          if (typeof Intl !== "undefined" && typeof Intl.getCanonicalLocales !== "undefined") {
            try {
              let formattedCode = Intl.getCanonicalLocales(code)[0];
              if (formattedCode && this.options.lowerCaseLng) {
                formattedCode = formattedCode.toLowerCase();
              }
              if (formattedCode)
                return formattedCode;
            } catch (e) {
            }
          }
          const specialCases = ["hans", "hant", "latn", "cyrl", "cans", "mong", "arab"];
          let p = code.split("-");
          if (this.options.lowerCaseLng) {
            p = p.map((part) => part.toLowerCase());
          } else if (p.length === 2) {
            p[0] = p[0].toLowerCase();
            p[1] = p[1].toUpperCase();
            if (specialCases.indexOf(p[1].toLowerCase()) > -1)
              p[1] = capitalize(p[1].toLowerCase());
          } else if (p.length === 3) {
            p[0] = p[0].toLowerCase();
            if (p[1].length === 2)
              p[1] = p[1].toUpperCase();
            if (p[0] !== "sgn" && p[2].length === 2)
              p[2] = p[2].toUpperCase();
            if (specialCases.indexOf(p[1].toLowerCase()) > -1)
              p[1] = capitalize(p[1].toLowerCase());
            if (specialCases.indexOf(p[2].toLowerCase()) > -1)
              p[2] = capitalize(p[2].toLowerCase());
          }
          return p.join("-");
        }
        return this.options.cleanCode || this.options.lowerCaseLng ? code.toLowerCase() : code;
      }
      isSupportedCode(code) {
        if (this.options.load === "languageOnly" || this.options.nonExplicitSupportedLngs) {
          code = this.getLanguagePartFromCode(code);
        }
        return !this.supportedLngs || !this.supportedLngs.length || this.supportedLngs.indexOf(code) > -1;
      }
      getBestMatchFromCodes(codes) {
        if (!codes)
          return null;
        let found;
        codes.forEach((code) => {
          if (found)
            return;
          const cleanedLng = this.formatLanguageCode(code);
          if (!this.options.supportedLngs || this.isSupportedCode(cleanedLng))
            found = cleanedLng;
        });
        if (!found && this.options.supportedLngs) {
          codes.forEach((code) => {
            if (found)
              return;
            const lngOnly = this.getLanguagePartFromCode(code);
            if (this.isSupportedCode(lngOnly))
              return found = lngOnly;
            found = this.options.supportedLngs.find((supportedLng) => {
              if (supportedLng === lngOnly)
                return supportedLng;
              if (supportedLng.indexOf("-") < 0 && lngOnly.indexOf("-") < 0)
                return;
              if (supportedLng.indexOf("-") > 0 && lngOnly.indexOf("-") < 0 && supportedLng.substring(0, supportedLng.indexOf("-")) === lngOnly)
                return supportedLng;
              if (supportedLng.indexOf(lngOnly) === 0 && lngOnly.length > 1)
                return supportedLng;
            });
          });
        }
        if (!found)
          found = this.getFallbackCodes(this.options.fallbackLng)[0];
        return found;
      }
      getFallbackCodes(fallbacks, code) {
        if (!fallbacks)
          return [];
        if (typeof fallbacks === "function")
          fallbacks = fallbacks(code);
        if (isString(fallbacks))
          fallbacks = [fallbacks];
        if (Array.isArray(fallbacks))
          return fallbacks;
        if (!code)
          return fallbacks.default || [];
        let found = fallbacks[code];
        if (!found)
          found = fallbacks[this.getScriptPartFromCode(code)];
        if (!found)
          found = fallbacks[this.formatLanguageCode(code)];
        if (!found)
          found = fallbacks[this.getLanguagePartFromCode(code)];
        if (!found)
          found = fallbacks.default;
        return found || [];
      }
      toResolveHierarchy(code, fallbackCode) {
        const fallbackCodes = this.getFallbackCodes(fallbackCode || this.options.fallbackLng || [], code);
        const codes = [];
        const addCode = (c) => {
          if (!c)
            return;
          if (this.isSupportedCode(c)) {
            codes.push(c);
          } else {
            this.logger.warn(`rejecting language code not found in supportedLngs: ${c}`);
          }
        };
        if (isString(code) && (code.indexOf("-") > -1 || code.indexOf("_") > -1)) {
          if (this.options.load !== "languageOnly")
            addCode(this.formatLanguageCode(code));
          if (this.options.load !== "languageOnly" && this.options.load !== "currentOnly")
            addCode(this.getScriptPartFromCode(code));
          if (this.options.load !== "currentOnly")
            addCode(this.getLanguagePartFromCode(code));
        } else if (isString(code)) {
          addCode(this.formatLanguageCode(code));
        }
        fallbackCodes.forEach((fc) => {
          if (codes.indexOf(fc) < 0)
            addCode(this.formatLanguageCode(fc));
        });
        return codes;
      }
    };
    var sets = [{
      lngs: ["ach", "ak", "am", "arn", "br", "fil", "gun", "ln", "mfe", "mg", "mi", "oc", "pt", "pt-BR", "tg", "tl", "ti", "tr", "uz", "wa"],
      nr: [1, 2],
      fc: 1
    }, {
      lngs: ["af", "an", "ast", "az", "bg", "bn", "ca", "da", "de", "dev", "el", "en", "eo", "es", "et", "eu", "fi", "fo", "fur", "fy", "gl", "gu", "ha", "hi", "hu", "hy", "ia", "it", "kk", "kn", "ku", "lb", "mai", "ml", "mn", "mr", "nah", "nap", "nb", "ne", "nl", "nn", "no", "nso", "pa", "pap", "pms", "ps", "pt-PT", "rm", "sco", "se", "si", "so", "son", "sq", "sv", "sw", "ta", "te", "tk", "ur", "yo"],
      nr: [1, 2],
      fc: 2
    }, {
      lngs: ["ay", "bo", "cgg", "fa", "ht", "id", "ja", "jbo", "ka", "km", "ko", "ky", "lo", "ms", "sah", "su", "th", "tt", "ug", "vi", "wo", "zh"],
      nr: [1],
      fc: 3
    }, {
      lngs: ["be", "bs", "cnr", "dz", "hr", "ru", "sr", "uk"],
      nr: [1, 2, 5],
      fc: 4
    }, {
      lngs: ["ar"],
      nr: [0, 1, 2, 3, 11, 100],
      fc: 5
    }, {
      lngs: ["cs", "sk"],
      nr: [1, 2, 5],
      fc: 6
    }, {
      lngs: ["csb", "pl"],
      nr: [1, 2, 5],
      fc: 7
    }, {
      lngs: ["cy"],
      nr: [1, 2, 3, 8],
      fc: 8
    }, {
      lngs: ["fr"],
      nr: [1, 2],
      fc: 9
    }, {
      lngs: ["ga"],
      nr: [1, 2, 3, 7, 11],
      fc: 10
    }, {
      lngs: ["gd"],
      nr: [1, 2, 3, 20],
      fc: 11
    }, {
      lngs: ["is"],
      nr: [1, 2],
      fc: 12
    }, {
      lngs: ["jv"],
      nr: [0, 1],
      fc: 13
    }, {
      lngs: ["kw"],
      nr: [1, 2, 3, 4],
      fc: 14
    }, {
      lngs: ["lt"],
      nr: [1, 2, 10],
      fc: 15
    }, {
      lngs: ["lv"],
      nr: [1, 2, 0],
      fc: 16
    }, {
      lngs: ["mk"],
      nr: [1, 2],
      fc: 17
    }, {
      lngs: ["mnk"],
      nr: [0, 1, 2],
      fc: 18
    }, {
      lngs: ["mt"],
      nr: [1, 2, 11, 20],
      fc: 19
    }, {
      lngs: ["or"],
      nr: [2, 1],
      fc: 2
    }, {
      lngs: ["ro"],
      nr: [1, 2, 20],
      fc: 20
    }, {
      lngs: ["sl"],
      nr: [5, 1, 2, 3],
      fc: 21
    }, {
      lngs: ["he", "iw"],
      nr: [1, 2, 20, 21],
      fc: 22
    }];
    var _rulesPluralsTypes = {
      1: (n) => Number(n > 1),
      2: (n) => Number(n != 1),
      3: (n) => 0,
      4: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
      5: (n) => Number(n == 0 ? 0 : n == 1 ? 1 : n == 2 ? 2 : n % 100 >= 3 && n % 100 <= 10 ? 3 : n % 100 >= 11 ? 4 : 5),
      6: (n) => Number(n == 1 ? 0 : n >= 2 && n <= 4 ? 1 : 2),
      7: (n) => Number(n == 1 ? 0 : n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
      8: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n != 8 && n != 11 ? 2 : 3),
      9: (n) => Number(n >= 2),
      10: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n < 7 ? 2 : n < 11 ? 3 : 4),
      11: (n) => Number(n == 1 || n == 11 ? 0 : n == 2 || n == 12 ? 1 : n > 2 && n < 20 ? 2 : 3),
      12: (n) => Number(n % 10 != 1 || n % 100 == 11),
      13: (n) => Number(n !== 0),
      14: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : n == 3 ? 2 : 3),
      15: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n % 10 >= 2 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2),
      16: (n) => Number(n % 10 == 1 && n % 100 != 11 ? 0 : n !== 0 ? 1 : 2),
      17: (n) => Number(n == 1 || n % 10 == 1 && n % 100 != 11 ? 0 : 1),
      18: (n) => Number(n == 0 ? 0 : n == 1 ? 1 : 2),
      19: (n) => Number(n == 1 ? 0 : n == 0 || n % 100 > 1 && n % 100 < 11 ? 1 : n % 100 > 10 && n % 100 < 20 ? 2 : 3),
      20: (n) => Number(n == 1 ? 0 : n == 0 || n % 100 > 0 && n % 100 < 20 ? 1 : 2),
      21: (n) => Number(n % 100 == 1 ? 1 : n % 100 == 2 ? 2 : n % 100 == 3 || n % 100 == 4 ? 3 : 0),
      22: (n) => Number(n == 1 ? 0 : n == 2 ? 1 : (n < 0 || n > 10) && n % 10 == 0 ? 2 : 3)
    };
    var nonIntlVersions = ["v1", "v2", "v3"];
    var intlVersions = ["v4"];
    var suffixesOrder = {
      zero: 0,
      one: 1,
      two: 2,
      few: 3,
      many: 4,
      other: 5
    };
    var createRules = () => {
      const rules = {};
      sets.forEach((set) => {
        set.lngs.forEach((l) => {
          rules[l] = {
            numbers: set.nr,
            plurals: _rulesPluralsTypes[set.fc]
          };
        });
      });
      return rules;
    };
    var PluralResolver = class {
      constructor(languageUtils) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        this.languageUtils = languageUtils;
        this.options = options;
        this.logger = baseLogger.create("pluralResolver");
        if ((!this.options.compatibilityJSON || intlVersions.includes(this.options.compatibilityJSON)) && (typeof Intl === "undefined" || !Intl.PluralRules)) {
          this.options.compatibilityJSON = "v3";
          this.logger.error("Your environment seems not to be Intl API compatible, use an Intl.PluralRules polyfill. Will fallback to the compatibilityJSON v3 format handling.");
        }
        this.rules = createRules();
        this.pluralRulesCache = {};
      }
      addRule(lng, obj) {
        this.rules[lng] = obj;
      }
      clearCache() {
        this.pluralRulesCache = {};
      }
      getRule(code) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (this.shouldUseIntlApi()) {
          const cleanedCode = getCleanedCode(code === "dev" ? "en" : code);
          const type = options.ordinal ? "ordinal" : "cardinal";
          const cacheKey = JSON.stringify({
            cleanedCode,
            type
          });
          if (cacheKey in this.pluralRulesCache) {
            return this.pluralRulesCache[cacheKey];
          }
          let rule;
          try {
            rule = new Intl.PluralRules(cleanedCode, {
              type
            });
          } catch (err) {
            if (!code.match(/-|_/))
              return;
            const lngPart = this.languageUtils.getLanguagePartFromCode(code);
            rule = this.getRule(lngPart, options);
          }
          this.pluralRulesCache[cacheKey] = rule;
          return rule;
        }
        return this.rules[code] || this.rules[this.languageUtils.getLanguagePartFromCode(code)];
      }
      needsPlural(code) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const rule = this.getRule(code, options);
        if (this.shouldUseIntlApi()) {
          return rule && rule.resolvedOptions().pluralCategories.length > 1;
        }
        return rule && rule.numbers.length > 1;
      }
      getPluralFormsOfKey(code, key) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        return this.getSuffixes(code, options).map((suffix) => `${key}${suffix}`);
      }
      getSuffixes(code) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        const rule = this.getRule(code, options);
        if (!rule) {
          return [];
        }
        if (this.shouldUseIntlApi()) {
          return rule.resolvedOptions().pluralCategories.sort((pluralCategory1, pluralCategory2) => suffixesOrder[pluralCategory1] - suffixesOrder[pluralCategory2]).map((pluralCategory) => `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${pluralCategory}`);
        }
        return rule.numbers.map((number) => this.getSuffix(code, number, options));
      }
      getSuffix(code, count) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        const rule = this.getRule(code, options);
        if (rule) {
          if (this.shouldUseIntlApi()) {
            return `${this.options.prepend}${options.ordinal ? `ordinal${this.options.prepend}` : ""}${rule.select(count)}`;
          }
          return this.getSuffixRetroCompatible(rule, count);
        }
        this.logger.warn(`no plural rule found for: ${code}`);
        return "";
      }
      getSuffixRetroCompatible(rule, count) {
        const idx = rule.noAbs ? rule.plurals(count) : rule.plurals(Math.abs(count));
        let suffix = rule.numbers[idx];
        if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
          if (suffix === 2) {
            suffix = "plural";
          } else if (suffix === 1) {
            suffix = "";
          }
        }
        const returnSuffix = () => this.options.prepend && suffix.toString() ? this.options.prepend + suffix.toString() : suffix.toString();
        if (this.options.compatibilityJSON === "v1") {
          if (suffix === 1)
            return "";
          if (typeof suffix === "number")
            return `_plural_${suffix.toString()}`;
          return returnSuffix();
        } else if (this.options.compatibilityJSON === "v2") {
          return returnSuffix();
        } else if (this.options.simplifyPluralSuffix && rule.numbers.length === 2 && rule.numbers[0] === 1) {
          return returnSuffix();
        }
        return this.options.prepend && idx.toString() ? this.options.prepend + idx.toString() : idx.toString();
      }
      shouldUseIntlApi() {
        return !nonIntlVersions.includes(this.options.compatibilityJSON);
      }
    };
    var deepFindWithDefaults = function(data, defaultData, key) {
      let keySeparator = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : ".";
      let ignoreJSONStructure = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : true;
      let path = getPathWithDefaults(data, defaultData, key);
      if (!path && ignoreJSONStructure && isString(key)) {
        path = deepFind(data, key, keySeparator);
        if (path === void 0)
          path = deepFind(defaultData, key, keySeparator);
      }
      return path;
    };
    var regexSafe = (val) => val.replace(/\$/g, "$$$$");
    var Interpolator = class {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        this.logger = baseLogger.create("interpolator");
        this.options = options;
        this.format = options.interpolation && options.interpolation.format || ((value) => value);
        this.init(options);
      }
      init() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        if (!options.interpolation)
          options.interpolation = {
            escapeValue: true
          };
        const {
          escape: escape$1,
          escapeValue,
          useRawValueToEscape,
          prefix,
          prefixEscaped,
          suffix,
          suffixEscaped,
          formatSeparator,
          unescapeSuffix,
          unescapePrefix,
          nestingPrefix,
          nestingPrefixEscaped,
          nestingSuffix,
          nestingSuffixEscaped,
          nestingOptionsSeparator,
          maxReplaces,
          alwaysFormat
        } = options.interpolation;
        this.escape = escape$1 !== void 0 ? escape$1 : escape;
        this.escapeValue = escapeValue !== void 0 ? escapeValue : true;
        this.useRawValueToEscape = useRawValueToEscape !== void 0 ? useRawValueToEscape : false;
        this.prefix = prefix ? regexEscape(prefix) : prefixEscaped || "{{";
        this.suffix = suffix ? regexEscape(suffix) : suffixEscaped || "}}";
        this.formatSeparator = formatSeparator || ",";
        this.unescapePrefix = unescapeSuffix ? "" : unescapePrefix || "-";
        this.unescapeSuffix = this.unescapePrefix ? "" : unescapeSuffix || "";
        this.nestingPrefix = nestingPrefix ? regexEscape(nestingPrefix) : nestingPrefixEscaped || regexEscape("$t(");
        this.nestingSuffix = nestingSuffix ? regexEscape(nestingSuffix) : nestingSuffixEscaped || regexEscape(")");
        this.nestingOptionsSeparator = nestingOptionsSeparator || ",";
        this.maxReplaces = maxReplaces || 1e3;
        this.alwaysFormat = alwaysFormat !== void 0 ? alwaysFormat : false;
        this.resetRegExp();
      }
      reset() {
        if (this.options)
          this.init(this.options);
      }
      resetRegExp() {
        const getOrResetRegExp = (existingRegExp, pattern) => {
          if (existingRegExp && existingRegExp.source === pattern) {
            existingRegExp.lastIndex = 0;
            return existingRegExp;
          }
          return new RegExp(pattern, "g");
        };
        this.regexp = getOrResetRegExp(this.regexp, `${this.prefix}(.+?)${this.suffix}`);
        this.regexpUnescape = getOrResetRegExp(this.regexpUnescape, `${this.prefix}${this.unescapePrefix}(.+?)${this.unescapeSuffix}${this.suffix}`);
        this.nestingRegexp = getOrResetRegExp(this.nestingRegexp, `${this.nestingPrefix}(.+?)${this.nestingSuffix}`);
      }
      interpolate(str, data, lng, options) {
        let match;
        let value;
        let replaces;
        const defaultData = this.options && this.options.interpolation && this.options.interpolation.defaultVariables || {};
        const handleFormat = (key) => {
          if (key.indexOf(this.formatSeparator) < 0) {
            const path = deepFindWithDefaults(data, defaultData, key, this.options.keySeparator, this.options.ignoreJSONStructure);
            return this.alwaysFormat ? this.format(path, void 0, lng, {
              ...options,
              ...data,
              interpolationkey: key
            }) : path;
          }
          const p = key.split(this.formatSeparator);
          const k = p.shift().trim();
          const f = p.join(this.formatSeparator).trim();
          return this.format(deepFindWithDefaults(data, defaultData, k, this.options.keySeparator, this.options.ignoreJSONStructure), f, lng, {
            ...options,
            ...data,
            interpolationkey: k
          });
        };
        this.resetRegExp();
        const missingInterpolationHandler = options && options.missingInterpolationHandler || this.options.missingInterpolationHandler;
        const skipOnVariables = options && options.interpolation && options.interpolation.skipOnVariables !== void 0 ? options.interpolation.skipOnVariables : this.options.interpolation.skipOnVariables;
        const todos = [{
          regex: this.regexpUnescape,
          safeValue: (val) => regexSafe(val)
        }, {
          regex: this.regexp,
          safeValue: (val) => this.escapeValue ? regexSafe(this.escape(val)) : regexSafe(val)
        }];
        todos.forEach((todo) => {
          replaces = 0;
          while (match = todo.regex.exec(str)) {
            const matchedVar = match[1].trim();
            value = handleFormat(matchedVar);
            if (value === void 0) {
              if (typeof missingInterpolationHandler === "function") {
                const temp = missingInterpolationHandler(str, match, options);
                value = isString(temp) ? temp : "";
              } else if (options && Object.prototype.hasOwnProperty.call(options, matchedVar)) {
                value = "";
              } else if (skipOnVariables) {
                value = match[0];
                continue;
              } else {
                this.logger.warn(`missed to pass in variable ${matchedVar} for interpolating ${str}`);
                value = "";
              }
            } else if (!isString(value) && !this.useRawValueToEscape) {
              value = makeString(value);
            }
            const safeValue = todo.safeValue(value);
            str = str.replace(match[0], safeValue);
            if (skipOnVariables) {
              todo.regex.lastIndex += value.length;
              todo.regex.lastIndex -= match[0].length;
            } else {
              todo.regex.lastIndex = 0;
            }
            replaces++;
            if (replaces >= this.maxReplaces) {
              break;
            }
          }
        });
        return str;
      }
      nest(str, fc) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        let match;
        let value;
        let clonedOptions;
        const handleHasOptions = (key, inheritedOptions) => {
          const sep = this.nestingOptionsSeparator;
          if (key.indexOf(sep) < 0)
            return key;
          const c = key.split(new RegExp(`${sep}[ ]*{`));
          let optionsString = `{${c[1]}`;
          key = c[0];
          optionsString = this.interpolate(optionsString, clonedOptions);
          const matchedSingleQuotes = optionsString.match(/'/g);
          const matchedDoubleQuotes = optionsString.match(/"/g);
          if (matchedSingleQuotes && matchedSingleQuotes.length % 2 === 0 && !matchedDoubleQuotes || matchedDoubleQuotes.length % 2 !== 0) {
            optionsString = optionsString.replace(/'/g, '"');
          }
          try {
            clonedOptions = JSON.parse(optionsString);
            if (inheritedOptions)
              clonedOptions = {
                ...inheritedOptions,
                ...clonedOptions
              };
          } catch (e) {
            this.logger.warn(`failed parsing options string in nesting for key ${key}`, e);
            return `${key}${sep}${optionsString}`;
          }
          if (clonedOptions.defaultValue && clonedOptions.defaultValue.indexOf(this.prefix) > -1)
            delete clonedOptions.defaultValue;
          return key;
        };
        while (match = this.nestingRegexp.exec(str)) {
          let formatters = [];
          clonedOptions = {
            ...options
          };
          clonedOptions = clonedOptions.replace && !isString(clonedOptions.replace) ? clonedOptions.replace : clonedOptions;
          clonedOptions.applyPostProcessor = false;
          delete clonedOptions.defaultValue;
          let doReduce = false;
          if (match[0].indexOf(this.formatSeparator) !== -1 && !/{.*}/.test(match[1])) {
            const r = match[1].split(this.formatSeparator).map((elem) => elem.trim());
            match[1] = r.shift();
            formatters = r;
            doReduce = true;
          }
          value = fc(handleHasOptions.call(this, match[1].trim(), clonedOptions), clonedOptions);
          if (value && match[0] === str && !isString(value))
            return value;
          if (!isString(value))
            value = makeString(value);
          if (!value) {
            this.logger.warn(`missed to resolve ${match[1]} for nesting ${str}`);
            value = "";
          }
          if (doReduce) {
            value = formatters.reduce((v, f) => this.format(v, f, options.lng, {
              ...options,
              interpolationkey: match[1].trim()
            }), value.trim());
          }
          str = str.replace(match[0], value);
          this.regexp.lastIndex = 0;
        }
        return str;
      }
    };
    var parseFormatStr = (formatStr) => {
      let formatName = formatStr.toLowerCase().trim();
      const formatOptions = {};
      if (formatStr.indexOf("(") > -1) {
        const p = formatStr.split("(");
        formatName = p[0].toLowerCase().trim();
        const optStr = p[1].substring(0, p[1].length - 1);
        if (formatName === "currency" && optStr.indexOf(":") < 0) {
          if (!formatOptions.currency)
            formatOptions.currency = optStr.trim();
        } else if (formatName === "relativetime" && optStr.indexOf(":") < 0) {
          if (!formatOptions.range)
            formatOptions.range = optStr.trim();
        } else {
          const opts = optStr.split(";");
          opts.forEach((opt) => {
            if (opt) {
              const [key, ...rest] = opt.split(":");
              const val = rest.join(":").trim().replace(/^'+|'+$/g, "");
              const trimmedKey = key.trim();
              if (!formatOptions[trimmedKey])
                formatOptions[trimmedKey] = val;
              if (val === "false")
                formatOptions[trimmedKey] = false;
              if (val === "true")
                formatOptions[trimmedKey] = true;
              if (!isNaN(val))
                formatOptions[trimmedKey] = parseInt(val, 10);
            }
          });
        }
      }
      return {
        formatName,
        formatOptions
      };
    };
    var createCachedFormatter = (fn) => {
      const cache = {};
      return (val, lng, options) => {
        let optForCache = options;
        if (options && options.interpolationkey && options.formatParams && options.formatParams[options.interpolationkey] && options[options.interpolationkey]) {
          optForCache = {
            ...optForCache,
            [options.interpolationkey]: void 0
          };
        }
        const key = lng + JSON.stringify(optForCache);
        let formatter = cache[key];
        if (!formatter) {
          formatter = fn(getCleanedCode(lng), options);
          cache[key] = formatter;
        }
        return formatter(val);
      };
    };
    var Formatter = class {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        this.logger = baseLogger.create("formatter");
        this.options = options;
        this.formats = {
          number: createCachedFormatter((lng, opt) => {
            const formatter = new Intl.NumberFormat(lng, {
              ...opt
            });
            return (val) => formatter.format(val);
          }),
          currency: createCachedFormatter((lng, opt) => {
            const formatter = new Intl.NumberFormat(lng, {
              ...opt,
              style: "currency"
            });
            return (val) => formatter.format(val);
          }),
          datetime: createCachedFormatter((lng, opt) => {
            const formatter = new Intl.DateTimeFormat(lng, {
              ...opt
            });
            return (val) => formatter.format(val);
          }),
          relativetime: createCachedFormatter((lng, opt) => {
            const formatter = new Intl.RelativeTimeFormat(lng, {
              ...opt
            });
            return (val) => formatter.format(val, opt.range || "day");
          }),
          list: createCachedFormatter((lng, opt) => {
            const formatter = new Intl.ListFormat(lng, {
              ...opt
            });
            return (val) => formatter.format(val);
          })
        };
        this.init(options);
      }
      init(services) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {
          interpolation: {}
        };
        this.formatSeparator = options.interpolation.formatSeparator || ",";
      }
      add(name, fc) {
        this.formats[name.toLowerCase().trim()] = fc;
      }
      addCached(name, fc) {
        this.formats[name.toLowerCase().trim()] = createCachedFormatter(fc);
      }
      format(value, format, lng) {
        let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        const formats = format.split(this.formatSeparator);
        if (formats.length > 1 && formats[0].indexOf("(") > 1 && formats[0].indexOf(")") < 0 && formats.find((f) => f.indexOf(")") > -1)) {
          const lastIndex = formats.findIndex((f) => f.indexOf(")") > -1);
          formats[0] = [formats[0], ...formats.splice(1, lastIndex)].join(this.formatSeparator);
        }
        const result = formats.reduce((mem, f) => {
          const {
            formatName,
            formatOptions
          } = parseFormatStr(f);
          if (this.formats[formatName]) {
            let formatted = mem;
            try {
              const valOptions = options && options.formatParams && options.formatParams[options.interpolationkey] || {};
              const l = valOptions.locale || valOptions.lng || options.locale || options.lng || lng;
              formatted = this.formats[formatName](mem, l, {
                ...formatOptions,
                ...options,
                ...valOptions
              });
            } catch (error) {
              this.logger.warn(error);
            }
            return formatted;
          } else {
            this.logger.warn(`there was no format function for ${formatName}`);
          }
          return mem;
        }, value);
        return result;
      }
    };
    var removePending = (q, name) => {
      if (q.pending[name] !== void 0) {
        delete q.pending[name];
        q.pendingCount--;
      }
    };
    var Connector = class extends EventEmitter {
      constructor(backend, store, services) {
        let options = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : {};
        super();
        this.backend = backend;
        this.store = store;
        this.services = services;
        this.languageUtils = services.languageUtils;
        this.options = options;
        this.logger = baseLogger.create("backendConnector");
        this.waitingReads = [];
        this.maxParallelReads = options.maxParallelReads || 10;
        this.readingCalls = 0;
        this.maxRetries = options.maxRetries >= 0 ? options.maxRetries : 5;
        this.retryTimeout = options.retryTimeout >= 1 ? options.retryTimeout : 350;
        this.state = {};
        this.queue = [];
        if (this.backend && this.backend.init) {
          this.backend.init(services, options.backend, options);
        }
      }
      queueLoad(languages, namespaces, options, callback) {
        const toLoad = {};
        const pending = {};
        const toLoadLanguages = {};
        const toLoadNamespaces = {};
        languages.forEach((lng) => {
          let hasAllNamespaces = true;
          namespaces.forEach((ns) => {
            const name = `${lng}|${ns}`;
            if (!options.reload && this.store.hasResourceBundle(lng, ns)) {
              this.state[name] = 2;
            } else if (this.state[name] < 0)
              ;
            else if (this.state[name] === 1) {
              if (pending[name] === void 0)
                pending[name] = true;
            } else {
              this.state[name] = 1;
              hasAllNamespaces = false;
              if (pending[name] === void 0)
                pending[name] = true;
              if (toLoad[name] === void 0)
                toLoad[name] = true;
              if (toLoadNamespaces[ns] === void 0)
                toLoadNamespaces[ns] = true;
            }
          });
          if (!hasAllNamespaces)
            toLoadLanguages[lng] = true;
        });
        if (Object.keys(toLoad).length || Object.keys(pending).length) {
          this.queue.push({
            pending,
            pendingCount: Object.keys(pending).length,
            loaded: {},
            errors: [],
            callback
          });
        }
        return {
          toLoad: Object.keys(toLoad),
          pending: Object.keys(pending),
          toLoadLanguages: Object.keys(toLoadLanguages),
          toLoadNamespaces: Object.keys(toLoadNamespaces)
        };
      }
      loaded(name, err, data) {
        const s = name.split("|");
        const lng = s[0];
        const ns = s[1];
        if (err)
          this.emit("failedLoading", lng, ns, err);
        if (!err && data) {
          this.store.addResourceBundle(lng, ns, data, void 0, void 0, {
            skipCopy: true
          });
        }
        this.state[name] = err ? -1 : 2;
        if (err && data)
          this.state[name] = 0;
        const loaded = {};
        this.queue.forEach((q) => {
          pushPath(q.loaded, [lng], ns);
          removePending(q, name);
          if (err)
            q.errors.push(err);
          if (q.pendingCount === 0 && !q.done) {
            Object.keys(q.loaded).forEach((l) => {
              if (!loaded[l])
                loaded[l] = {};
              const loadedKeys = q.loaded[l];
              if (loadedKeys.length) {
                loadedKeys.forEach((n) => {
                  if (loaded[l][n] === void 0)
                    loaded[l][n] = true;
                });
              }
            });
            q.done = true;
            if (q.errors.length) {
              q.callback(q.errors);
            } else {
              q.callback();
            }
          }
        });
        this.emit("loaded", loaded);
        this.queue = this.queue.filter((q) => !q.done);
      }
      read(lng, ns, fcName) {
        let tried = arguments.length > 3 && arguments[3] !== void 0 ? arguments[3] : 0;
        let wait = arguments.length > 4 && arguments[4] !== void 0 ? arguments[4] : this.retryTimeout;
        let callback = arguments.length > 5 ? arguments[5] : void 0;
        if (!lng.length)
          return callback(null, {});
        if (this.readingCalls >= this.maxParallelReads) {
          this.waitingReads.push({
            lng,
            ns,
            fcName,
            tried,
            wait,
            callback
          });
          return;
        }
        this.readingCalls++;
        const resolver = (err, data) => {
          this.readingCalls--;
          if (this.waitingReads.length > 0) {
            const next = this.waitingReads.shift();
            this.read(next.lng, next.ns, next.fcName, next.tried, next.wait, next.callback);
          }
          if (err && data && tried < this.maxRetries) {
            setTimeout(() => {
              this.read.call(this, lng, ns, fcName, tried + 1, wait * 2, callback);
            }, wait);
            return;
          }
          callback(err, data);
        };
        const fc = this.backend[fcName].bind(this.backend);
        if (fc.length === 2) {
          try {
            const r = fc(lng, ns);
            if (r && typeof r.then === "function") {
              r.then((data) => resolver(null, data)).catch(resolver);
            } else {
              resolver(null, r);
            }
          } catch (err) {
            resolver(err);
          }
          return;
        }
        return fc(lng, ns, resolver);
      }
      prepareLoading(languages, namespaces) {
        let options = arguments.length > 2 && arguments[2] !== void 0 ? arguments[2] : {};
        let callback = arguments.length > 3 ? arguments[3] : void 0;
        if (!this.backend) {
          this.logger.warn("No backend was added via i18next.use. Will not load resources.");
          return callback && callback();
        }
        if (isString(languages))
          languages = this.languageUtils.toResolveHierarchy(languages);
        if (isString(namespaces))
          namespaces = [namespaces];
        const toLoad = this.queueLoad(languages, namespaces, options, callback);
        if (!toLoad.toLoad.length) {
          if (!toLoad.pending.length)
            callback();
          return null;
        }
        toLoad.toLoad.forEach((name) => {
          this.loadOne(name);
        });
      }
      load(languages, namespaces, callback) {
        this.prepareLoading(languages, namespaces, {}, callback);
      }
      reload(languages, namespaces, callback) {
        this.prepareLoading(languages, namespaces, {
          reload: true
        }, callback);
      }
      loadOne(name) {
        let prefix = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : "";
        const s = name.split("|");
        const lng = s[0];
        const ns = s[1];
        this.read(lng, ns, "read", void 0, void 0, (err, data) => {
          if (err)
            this.logger.warn(`${prefix}loading namespace ${ns} for language ${lng} failed`, err);
          if (!err && data)
            this.logger.log(`${prefix}loaded namespace ${ns} for language ${lng}`, data);
          this.loaded(name, err, data);
        });
      }
      saveMissing(languages, namespace, key, fallbackValue, isUpdate) {
        let options = arguments.length > 5 && arguments[5] !== void 0 ? arguments[5] : {};
        let clb = arguments.length > 6 && arguments[6] !== void 0 ? arguments[6] : () => {
        };
        if (this.services.utils && this.services.utils.hasLoadedNamespace && !this.services.utils.hasLoadedNamespace(namespace)) {
          this.logger.warn(`did not save key "${key}" as the namespace "${namespace}" was not yet loaded`, "This means something IS WRONG in your setup. You access the t function before i18next.init / i18next.loadNamespace / i18next.changeLanguage was done. Wait for the callback or Promise to resolve before accessing it!!!");
          return;
        }
        if (key === void 0 || key === null || key === "")
          return;
        if (this.backend && this.backend.create) {
          const opts = {
            ...options,
            isUpdate
          };
          const fc = this.backend.create.bind(this.backend);
          if (fc.length < 6) {
            try {
              let r;
              if (fc.length === 5) {
                r = fc(languages, namespace, key, fallbackValue, opts);
              } else {
                r = fc(languages, namespace, key, fallbackValue);
              }
              if (r && typeof r.then === "function") {
                r.then((data) => clb(null, data)).catch(clb);
              } else {
                clb(null, r);
              }
            } catch (err) {
              clb(err);
            }
          } else {
            fc(languages, namespace, key, fallbackValue, clb, opts);
          }
        }
        if (!languages || !languages[0])
          return;
        this.store.addResource(languages[0], namespace, key, fallbackValue);
      }
    };
    var get = () => ({
      debug: false,
      initImmediate: true,
      ns: ["translation"],
      defaultNS: ["translation"],
      fallbackLng: ["dev"],
      fallbackNS: false,
      supportedLngs: false,
      nonExplicitSupportedLngs: false,
      load: "all",
      preload: false,
      simplifyPluralSuffix: true,
      keySeparator: ".",
      nsSeparator: ":",
      pluralSeparator: "_",
      contextSeparator: "_",
      partialBundledLanguages: false,
      saveMissing: false,
      updateMissing: false,
      saveMissingTo: "fallback",
      saveMissingPlurals: true,
      missingKeyHandler: false,
      missingInterpolationHandler: false,
      postProcess: false,
      postProcessPassResolved: false,
      returnNull: false,
      returnEmptyString: true,
      returnObjects: false,
      joinArrays: false,
      returnedObjectHandler: false,
      parseMissingKeyHandler: false,
      appendNamespaceToMissingKey: false,
      appendNamespaceToCIMode: false,
      overloadTranslationOptionHandler: (args) => {
        let ret = {};
        if (typeof args[1] === "object")
          ret = args[1];
        if (isString(args[1]))
          ret.defaultValue = args[1];
        if (isString(args[2]))
          ret.tDescription = args[2];
        if (typeof args[2] === "object" || typeof args[3] === "object") {
          const options = args[3] || args[2];
          Object.keys(options).forEach((key) => {
            ret[key] = options[key];
          });
        }
        return ret;
      },
      interpolation: {
        escapeValue: true,
        format: (value) => value,
        prefix: "{{",
        suffix: "}}",
        formatSeparator: ",",
        unescapePrefix: "-",
        nestingPrefix: "$t(",
        nestingSuffix: ")",
        nestingOptionsSeparator: ",",
        maxReplaces: 1e3,
        skipOnVariables: true
      }
    });
    var transformOptions = (options) => {
      if (isString(options.ns))
        options.ns = [options.ns];
      if (isString(options.fallbackLng))
        options.fallbackLng = [options.fallbackLng];
      if (isString(options.fallbackNS))
        options.fallbackNS = [options.fallbackNS];
      if (options.supportedLngs && options.supportedLngs.indexOf("cimode") < 0) {
        options.supportedLngs = options.supportedLngs.concat(["cimode"]);
      }
      return options;
    };
    var noop = () => {
    };
    var bindMemberFunctions = (inst) => {
      const mems = Object.getOwnPropertyNames(Object.getPrototypeOf(inst));
      mems.forEach((mem) => {
        if (typeof inst[mem] === "function") {
          inst[mem] = inst[mem].bind(inst);
        }
      });
    };
    var I18n = class _I18n extends EventEmitter {
      constructor() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        let callback = arguments.length > 1 ? arguments[1] : void 0;
        super();
        this.options = transformOptions(options);
        this.services = {};
        this.logger = baseLogger;
        this.modules = {
          external: []
        };
        bindMemberFunctions(this);
        if (callback && !this.isInitialized && !options.isClone) {
          if (!this.options.initImmediate) {
            this.init(options, callback);
            return this;
          }
          setTimeout(() => {
            this.init(options, callback);
          }, 0);
        }
      }
      init() {
        var _this = this;
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        let callback = arguments.length > 1 ? arguments[1] : void 0;
        this.isInitializing = true;
        if (typeof options === "function") {
          callback = options;
          options = {};
        }
        if (!options.defaultNS && options.defaultNS !== false && options.ns) {
          if (isString(options.ns)) {
            options.defaultNS = options.ns;
          } else if (options.ns.indexOf("translation") < 0) {
            options.defaultNS = options.ns[0];
          }
        }
        const defOpts = get();
        this.options = {
          ...defOpts,
          ...this.options,
          ...transformOptions(options)
        };
        if (this.options.compatibilityAPI !== "v1") {
          this.options.interpolation = {
            ...defOpts.interpolation,
            ...this.options.interpolation
          };
        }
        if (options.keySeparator !== void 0) {
          this.options.userDefinedKeySeparator = options.keySeparator;
        }
        if (options.nsSeparator !== void 0) {
          this.options.userDefinedNsSeparator = options.nsSeparator;
        }
        const createClassOnDemand = (ClassOrObject) => {
          if (!ClassOrObject)
            return null;
          if (typeof ClassOrObject === "function")
            return new ClassOrObject();
          return ClassOrObject;
        };
        if (!this.options.isClone) {
          if (this.modules.logger) {
            baseLogger.init(createClassOnDemand(this.modules.logger), this.options);
          } else {
            baseLogger.init(null, this.options);
          }
          let formatter;
          if (this.modules.formatter) {
            formatter = this.modules.formatter;
          } else if (typeof Intl !== "undefined") {
            formatter = Formatter;
          }
          const lu = new LanguageUtil(this.options);
          this.store = new ResourceStore(this.options.resources, this.options);
          const s = this.services;
          s.logger = baseLogger;
          s.resourceStore = this.store;
          s.languageUtils = lu;
          s.pluralResolver = new PluralResolver(lu, {
            prepend: this.options.pluralSeparator,
            compatibilityJSON: this.options.compatibilityJSON,
            simplifyPluralSuffix: this.options.simplifyPluralSuffix
          });
          if (formatter && (!this.options.interpolation.format || this.options.interpolation.format === defOpts.interpolation.format)) {
            s.formatter = createClassOnDemand(formatter);
            s.formatter.init(s, this.options);
            this.options.interpolation.format = s.formatter.format.bind(s.formatter);
          }
          s.interpolator = new Interpolator(this.options);
          s.utils = {
            hasLoadedNamespace: this.hasLoadedNamespace.bind(this)
          };
          s.backendConnector = new Connector(createClassOnDemand(this.modules.backend), s.resourceStore, s, this.options);
          s.backendConnector.on("*", function(event) {
            for (var _len = arguments.length, args = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
              args[_key - 1] = arguments[_key];
            }
            _this.emit(event, ...args);
          });
          if (this.modules.languageDetector) {
            s.languageDetector = createClassOnDemand(this.modules.languageDetector);
            if (s.languageDetector.init)
              s.languageDetector.init(s, this.options.detection, this.options);
          }
          if (this.modules.i18nFormat) {
            s.i18nFormat = createClassOnDemand(this.modules.i18nFormat);
            if (s.i18nFormat.init)
              s.i18nFormat.init(this);
          }
          this.translator = new Translator(this.services, this.options);
          this.translator.on("*", function(event) {
            for (var _len2 = arguments.length, args = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
              args[_key2 - 1] = arguments[_key2];
            }
            _this.emit(event, ...args);
          });
          this.modules.external.forEach((m) => {
            if (m.init)
              m.init(this);
          });
        }
        this.format = this.options.interpolation.format;
        if (!callback)
          callback = noop;
        if (this.options.fallbackLng && !this.services.languageDetector && !this.options.lng) {
          const codes = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
          if (codes.length > 0 && codes[0] !== "dev")
            this.options.lng = codes[0];
        }
        if (!this.services.languageDetector && !this.options.lng) {
          this.logger.warn("init: no languageDetector is used and no lng is defined");
        }
        const storeApi = ["getResource", "hasResourceBundle", "getResourceBundle", "getDataByLanguage"];
        storeApi.forEach((fcName) => {
          this[fcName] = function() {
            return _this.store[fcName](...arguments);
          };
        });
        const storeApiChained = ["addResource", "addResources", "addResourceBundle", "removeResourceBundle"];
        storeApiChained.forEach((fcName) => {
          this[fcName] = function() {
            _this.store[fcName](...arguments);
            return _this;
          };
        });
        const deferred = defer();
        const load = () => {
          const finish = (err, t) => {
            this.isInitializing = false;
            if (this.isInitialized && !this.initializedStoreOnce)
              this.logger.warn("init: i18next is already initialized. You should call init just once!");
            this.isInitialized = true;
            if (!this.options.isClone)
              this.logger.log("initialized", this.options);
            this.emit("initialized", this.options);
            deferred.resolve(t);
            callback(err, t);
          };
          if (this.languages && this.options.compatibilityAPI !== "v1" && !this.isInitialized)
            return finish(null, this.t.bind(this));
          this.changeLanguage(this.options.lng, finish);
        };
        if (this.options.resources || !this.options.initImmediate) {
          load();
        } else {
          setTimeout(load, 0);
        }
        return deferred;
      }
      loadResources(language) {
        let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
        let usedCallback = callback;
        const usedLng = isString(language) ? language : this.language;
        if (typeof language === "function")
          usedCallback = language;
        if (!this.options.resources || this.options.partialBundledLanguages) {
          if (usedLng && usedLng.toLowerCase() === "cimode" && (!this.options.preload || this.options.preload.length === 0))
            return usedCallback();
          const toLoad = [];
          const append = (lng) => {
            if (!lng)
              return;
            if (lng === "cimode")
              return;
            const lngs = this.services.languageUtils.toResolveHierarchy(lng);
            lngs.forEach((l) => {
              if (l === "cimode")
                return;
              if (toLoad.indexOf(l) < 0)
                toLoad.push(l);
            });
          };
          if (!usedLng) {
            const fallbacks = this.services.languageUtils.getFallbackCodes(this.options.fallbackLng);
            fallbacks.forEach((l) => append(l));
          } else {
            append(usedLng);
          }
          if (this.options.preload) {
            this.options.preload.forEach((l) => append(l));
          }
          this.services.backendConnector.load(toLoad, this.options.ns, (e) => {
            if (!e && !this.resolvedLanguage && this.language)
              this.setResolvedLanguage(this.language);
            usedCallback(e);
          });
        } else {
          usedCallback(null);
        }
      }
      reloadResources(lngs, ns, callback) {
        const deferred = defer();
        if (typeof lngs === "function") {
          callback = lngs;
          lngs = void 0;
        }
        if (typeof ns === "function") {
          callback = ns;
          ns = void 0;
        }
        if (!lngs)
          lngs = this.languages;
        if (!ns)
          ns = this.options.ns;
        if (!callback)
          callback = noop;
        this.services.backendConnector.reload(lngs, ns, (err) => {
          deferred.resolve();
          callback(err);
        });
        return deferred;
      }
      use(module3) {
        if (!module3)
          throw new Error("You are passing an undefined module! Please check the object you are passing to i18next.use()");
        if (!module3.type)
          throw new Error("You are passing a wrong module! Please check the object you are passing to i18next.use()");
        if (module3.type === "backend") {
          this.modules.backend = module3;
        }
        if (module3.type === "logger" || module3.log && module3.warn && module3.error) {
          this.modules.logger = module3;
        }
        if (module3.type === "languageDetector") {
          this.modules.languageDetector = module3;
        }
        if (module3.type === "i18nFormat") {
          this.modules.i18nFormat = module3;
        }
        if (module3.type === "postProcessor") {
          postProcessor.addPostProcessor(module3);
        }
        if (module3.type === "formatter") {
          this.modules.formatter = module3;
        }
        if (module3.type === "3rdParty") {
          this.modules.external.push(module3);
        }
        return this;
      }
      setResolvedLanguage(l) {
        if (!l || !this.languages)
          return;
        if (["cimode", "dev"].indexOf(l) > -1)
          return;
        for (let li = 0; li < this.languages.length; li++) {
          const lngInLngs = this.languages[li];
          if (["cimode", "dev"].indexOf(lngInLngs) > -1)
            continue;
          if (this.store.hasLanguageSomeTranslations(lngInLngs)) {
            this.resolvedLanguage = lngInLngs;
            break;
          }
        }
      }
      changeLanguage(lng, callback) {
        var _this2 = this;
        this.isLanguageChangingTo = lng;
        const deferred = defer();
        this.emit("languageChanging", lng);
        const setLngProps = (l) => {
          this.language = l;
          this.languages = this.services.languageUtils.toResolveHierarchy(l);
          this.resolvedLanguage = void 0;
          this.setResolvedLanguage(l);
        };
        const done = (err, l) => {
          if (l) {
            setLngProps(l);
            this.translator.changeLanguage(l);
            this.isLanguageChangingTo = void 0;
            this.emit("languageChanged", l);
            this.logger.log("languageChanged", l);
          } else {
            this.isLanguageChangingTo = void 0;
          }
          deferred.resolve(function() {
            return _this2.t(...arguments);
          });
          if (callback)
            callback(err, function() {
              return _this2.t(...arguments);
            });
        };
        const setLng = (lngs) => {
          if (!lng && !lngs && this.services.languageDetector)
            lngs = [];
          const l = isString(lngs) ? lngs : this.services.languageUtils.getBestMatchFromCodes(lngs);
          if (l) {
            if (!this.language) {
              setLngProps(l);
            }
            if (!this.translator.language)
              this.translator.changeLanguage(l);
            if (this.services.languageDetector && this.services.languageDetector.cacheUserLanguage)
              this.services.languageDetector.cacheUserLanguage(l);
          }
          this.loadResources(l, (err) => {
            done(err, l);
          });
        };
        if (!lng && this.services.languageDetector && !this.services.languageDetector.async) {
          setLng(this.services.languageDetector.detect());
        } else if (!lng && this.services.languageDetector && this.services.languageDetector.async) {
          if (this.services.languageDetector.detect.length === 0) {
            this.services.languageDetector.detect().then(setLng);
          } else {
            this.services.languageDetector.detect(setLng);
          }
        } else {
          setLng(lng);
        }
        return deferred;
      }
      getFixedT(lng, ns, keyPrefix) {
        var _this3 = this;
        const fixedT = function(key, opts) {
          let options;
          if (typeof opts !== "object") {
            for (var _len3 = arguments.length, rest = new Array(_len3 > 2 ? _len3 - 2 : 0), _key3 = 2; _key3 < _len3; _key3++) {
              rest[_key3 - 2] = arguments[_key3];
            }
            options = _this3.options.overloadTranslationOptionHandler([key, opts].concat(rest));
          } else {
            options = {
              ...opts
            };
          }
          options.lng = options.lng || fixedT.lng;
          options.lngs = options.lngs || fixedT.lngs;
          options.ns = options.ns || fixedT.ns;
          if (options.keyPrefix !== "")
            options.keyPrefix = options.keyPrefix || keyPrefix || fixedT.keyPrefix;
          const keySeparator = _this3.options.keySeparator || ".";
          let resultKey;
          if (options.keyPrefix && Array.isArray(key)) {
            resultKey = key.map((k) => `${options.keyPrefix}${keySeparator}${k}`);
          } else {
            resultKey = options.keyPrefix ? `${options.keyPrefix}${keySeparator}${key}` : key;
          }
          return _this3.t(resultKey, options);
        };
        if (isString(lng)) {
          fixedT.lng = lng;
        } else {
          fixedT.lngs = lng;
        }
        fixedT.ns = ns;
        fixedT.keyPrefix = keyPrefix;
        return fixedT;
      }
      t() {
        return this.translator && this.translator.translate(...arguments);
      }
      exists() {
        return this.translator && this.translator.exists(...arguments);
      }
      setDefaultNamespace(ns) {
        this.options.defaultNS = ns;
      }
      hasLoadedNamespace(ns) {
        let options = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : {};
        if (!this.isInitialized) {
          this.logger.warn("hasLoadedNamespace: i18next was not initialized", this.languages);
          return false;
        }
        if (!this.languages || !this.languages.length) {
          this.logger.warn("hasLoadedNamespace: i18n.languages were undefined or empty", this.languages);
          return false;
        }
        const lng = options.lng || this.resolvedLanguage || this.languages[0];
        const fallbackLng = this.options ? this.options.fallbackLng : false;
        const lastLng = this.languages[this.languages.length - 1];
        if (lng.toLowerCase() === "cimode")
          return true;
        const loadNotPending = (l, n) => {
          const loadState = this.services.backendConnector.state[`${l}|${n}`];
          return loadState === -1 || loadState === 0 || loadState === 2;
        };
        if (options.precheck) {
          const preResult = options.precheck(this, loadNotPending);
          if (preResult !== void 0)
            return preResult;
        }
        if (this.hasResourceBundle(lng, ns))
          return true;
        if (!this.services.backendConnector.backend || this.options.resources && !this.options.partialBundledLanguages)
          return true;
        if (loadNotPending(lng, ns) && (!fallbackLng || loadNotPending(lastLng, ns)))
          return true;
        return false;
      }
      loadNamespaces(ns, callback) {
        const deferred = defer();
        if (!this.options.ns) {
          if (callback)
            callback();
          return Promise.resolve();
        }
        if (isString(ns))
          ns = [ns];
        ns.forEach((n) => {
          if (this.options.ns.indexOf(n) < 0)
            this.options.ns.push(n);
        });
        this.loadResources((err) => {
          deferred.resolve();
          if (callback)
            callback(err);
        });
        return deferred;
      }
      loadLanguages(lngs, callback) {
        const deferred = defer();
        if (isString(lngs))
          lngs = [lngs];
        const preloaded = this.options.preload || [];
        const newLngs = lngs.filter((lng) => preloaded.indexOf(lng) < 0 && this.services.languageUtils.isSupportedCode(lng));
        if (!newLngs.length) {
          if (callback)
            callback();
          return Promise.resolve();
        }
        this.options.preload = preloaded.concat(newLngs);
        this.loadResources((err) => {
          deferred.resolve();
          if (callback)
            callback(err);
        });
        return deferred;
      }
      dir(lng) {
        if (!lng)
          lng = this.resolvedLanguage || (this.languages && this.languages.length > 0 ? this.languages[0] : this.language);
        if (!lng)
          return "rtl";
        const rtlLngs = ["ar", "shu", "sqr", "ssh", "xaa", "yhd", "yud", "aao", "abh", "abv", "acm", "acq", "acw", "acx", "acy", "adf", "ads", "aeb", "aec", "afb", "ajp", "apc", "apd", "arb", "arq", "ars", "ary", "arz", "auz", "avl", "ayh", "ayl", "ayn", "ayp", "bbz", "pga", "he", "iw", "ps", "pbt", "pbu", "pst", "prp", "prd", "ug", "ur", "ydd", "yds", "yih", "ji", "yi", "hbo", "men", "xmn", "fa", "jpr", "peo", "pes", "prs", "dv", "sam", "ckb"];
        const languageUtils = this.services && this.services.languageUtils || new LanguageUtil(get());
        return rtlLngs.indexOf(languageUtils.getLanguagePartFromCode(lng)) > -1 || lng.toLowerCase().indexOf("-arab") > 1 ? "rtl" : "ltr";
      }
      static createInstance() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        let callback = arguments.length > 1 ? arguments[1] : void 0;
        return new _I18n(options, callback);
      }
      cloneInstance() {
        let options = arguments.length > 0 && arguments[0] !== void 0 ? arguments[0] : {};
        let callback = arguments.length > 1 && arguments[1] !== void 0 ? arguments[1] : noop;
        const forkResourceStore = options.forkResourceStore;
        if (forkResourceStore)
          delete options.forkResourceStore;
        const mergedOptions = {
          ...this.options,
          ...options,
          ...{
            isClone: true
          }
        };
        const clone = new _I18n(mergedOptions);
        if (options.debug !== void 0 || options.prefix !== void 0) {
          clone.logger = clone.logger.clone(options);
        }
        const membersToCopy = ["store", "services", "language"];
        membersToCopy.forEach((m) => {
          clone[m] = this[m];
        });
        clone.services = {
          ...this.services
        };
        clone.services.utils = {
          hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
        };
        if (forkResourceStore) {
          clone.store = new ResourceStore(this.store.data, mergedOptions);
          clone.services.resourceStore = clone.store;
        }
        clone.translator = new Translator(clone.services, mergedOptions);
        clone.translator.on("*", function(event) {
          for (var _len4 = arguments.length, args = new Array(_len4 > 1 ? _len4 - 1 : 0), _key4 = 1; _key4 < _len4; _key4++) {
            args[_key4 - 1] = arguments[_key4];
          }
          clone.emit(event, ...args);
        });
        clone.init(mergedOptions, callback);
        clone.translator.options = mergedOptions;
        clone.translator.backendConnector.services.utils = {
          hasLoadedNamespace: clone.hasLoadedNamespace.bind(clone)
        };
        return clone;
      }
      toJSON() {
        return {
          options: this.options,
          store: this.store,
          language: this.language,
          languages: this.languages,
          resolvedLanguage: this.resolvedLanguage
        };
      }
    };
    var instance = I18n.createInstance();
    instance.createInstance = I18n.createInstance;
    module2.exports = instance;
  }
});

// js/system-proxy.js
var require_system_proxy = __commonJS({
  "js/system-proxy.js"(exports2, module2) {
    var os = require("os");
    var { execFileSync } = require("child_process");
    var cached;
    function getSystemProxyUrl() {
      if (cached !== void 0)
        return cached;
      const envProxy = process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || process.env.ALL_PROXY || process.env.all_proxy;
      if (envProxy) {
        cached = envProxy;
        return envProxy;
      }
      if (os.platform() === "win32") {
        try {
          const out = execFileSync(
            "reg",
            ["query", "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings"],
            { encoding: "utf8", windowsHide: true }
          );
          const enabled = /ProxyEnable\s+REG_DWORD\s+0x[1-9a-f]/i.test(out);
          const match = out.match(/ProxyServer\s+REG_SZ\s+([^\r\n]+)/i);
          if (enabled && match) {
            let server = match[1].trim();
            if (server.includes("=")) {
              const parts = server.split(";").filter(Boolean).map((entry) => entry.split("="));
              const httpsPart = parts.find(([key]) => /https/i.test(key || ""));
              server = httpsPart && httpsPart[1] || parts[0] && parts[0][1] || "";
            }
            server = server.trim();
            if (server && !/^(http|socks)/i.test(server))
              server = "http://" + server;
            if (server) {
              cached = server;
              return server;
            }
          }
        } catch (e) {
        }
      }
      cached = null;
      return null;
    }
    module2.exports = { getSystemProxyUrl };
  }
});

// js/proxy-agent.js
var require_proxy_agent = __commonJS({
  "js/proxy-agent.js"(exports2, module2) {
    var http = require("http");
    var https = require("https");
    var tls = require("tls");
    function parseProxy(proxyUrl) {
      try {
        const parsed = new URL(proxyUrl);
        const secure = parsed.protocol === "https:";
        return {
          host: parsed.hostname,
          port: Number(parsed.port || (secure ? 443 : 80)),
          auth: parsed.username ? `${decodeURIComponent(parsed.username)}:${decodeURIComponent(parsed.password || "")}` : null
        };
      } catch (e) {
        return null;
      }
    }
    var ConnectProxyAgent = class extends https.Agent {
      constructor(proxyUrl, options = {}) {
        super(options);
        this.proxy = parseProxy(proxyUrl);
      }
      createConnection(options, callback) {
        const proxy = this.proxy;
        if (!proxy) {
          callback(new Error("invalid proxy url"));
          return void 0;
        }
        const targetHost = options.hostname || options.host;
        const targetPort = Number(options.port) || 443;
        const headers = { Host: `${targetHost}:${targetPort}` };
        if (proxy.auth)
          headers["Proxy-Authorization"] = "Basic " + Buffer.from(proxy.auth).toString("base64");
        const proxyReq = http.request({
          host: proxy.host,
          port: proxy.port,
          method: "CONNECT",
          path: `${targetHost}:${targetPort}`,
          headers
        });
        let settled = false;
        const fail = (error) => {
          if (settled)
            return;
          settled = true;
          try {
            proxyReq.destroy();
          } catch (e) {
          }
          callback(error);
        };
        proxyReq.once("connect", (res, socket) => {
          if (res.statusCode !== 200) {
            socket.destroy();
            fail(new Error(`proxy CONNECT failed with ${res.statusCode}`));
            return;
          }
          const tlsSocket = tls.connect({ socket, servername: options.servername || targetHost });
          tlsSocket.once("secureConnect", () => {
            if (settled)
              return;
            settled = true;
            callback(null, tlsSocket);
          });
          tlsSocket.once("error", fail);
        });
        proxyReq.once("error", fail);
        proxyReq.setTimeout(15e3, () => fail(new Error("proxy CONNECT timeout")));
        proxyReq.end();
        return void 0;
      }
    };
    module2.exports = { ConnectProxyAgent, parseProxy };
  }
});

// js/net-guard.js
var require_net_guard = __commonJS({
  "js/net-guard.js"(exports2, module2) {
    var net = require("net");
    var dns = require("dns");
    var https = require("https");
    var { getSystemProxyUrl } = require_system_proxy();
    var { ConnectProxyAgent } = require_proxy_agent();
    function isPrivateIp(ip) {
      if (net.isIPv4(ip)) {
        const parts = ip.split(".").map(Number);
        if (parts[0] === 10)
          return true;
        if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31)
          return true;
        if (parts[0] === 192 && parts[1] === 168)
          return true;
        if (parts[0] === 127)
          return true;
        if (parts[0] === 169 && parts[1] === 254)
          return true;
        if (parts[0] === 0)
          return true;
        if (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127)
          return true;
        if (parts[0] === 192 && parts[1] === 0 && parts[2] === 2)
          return true;
        if (parts[0] === 198 && parts[1] === 51 && parts[2] === 100)
          return true;
        if (parts[0] === 203 && parts[1] === 0 && parts[2] === 113)
          return true;
        if (parts[0] >= 224 && parts[0] <= 239)
          return true;
        if (parts[0] >= 240)
          return true;
      }
      if (net.isIPv6(ip)) {
        const normalized = ip.toLowerCase();
        if (normalized === "::1" || normalized === "::")
          return true;
        if (normalized.startsWith("fe80:"))
          return true;
        if (normalized.startsWith("fc") || normalized.startsWith("fd"))
          return true;
        if (normalized.startsWith("::ffff:")) {
          const mapped = normalized.slice(7);
          if (net.isIPv4(mapped))
            return isPrivateIp(mapped);
        }
        if (normalized.startsWith("64:ff9b:"))
          return true;
        if (normalized.startsWith("2001:db8:"))
          return true;
        if (normalized.startsWith("2001:") && (normalized.startsWith("2001:0:") || normalized === "2001::"))
          return true;
        if (normalized.startsWith("2002:"))
          return true;
        if (normalized.startsWith("ff"))
          return true;
        if (normalized.startsWith("100:"))
          return true;
      }
      return false;
    }
    function boundaryError(message) {
      const err = new Error(message);
      err.code = "ENETBOUNDARY";
      return err;
    }
    async function validateUrl(url) {
      if (typeof url !== "string" || !url.trim()) {
        throw boundaryError("Invalid URL");
      }
      let parsed;
      try {
        parsed = new URL(url);
      } catch {
        throw boundaryError(`Invalid URL: ${url}`);
      }
      if (parsed.protocol !== "https:") {
        throw boundaryError("Only HTTPS URLs are allowed");
      }
      if (parsed.username || parsed.password) {
        throw boundaryError("URLs with userinfo (credentials) are not allowed");
      }
      if (parsed.port !== "" && parsed.port !== "443") {
        throw boundaryError(`Non-standard port ${parsed.port} is not allowed`);
      }
      const hostname = parsed.hostname.toLowerCase();
      if (hostname === "localhost" || hostname === "[::1]") {
        throw boundaryError("Access to localhost is blocked");
      }
      if (net.isIP(hostname)) {
        if (isPrivateIp(hostname)) {
          throw boundaryError(`Access to private IP address ${hostname} is blocked`);
        }
        return { parsed, addresses: [hostname] };
      }
      try {
        let addresses = [];
        try {
          addresses = await dns.promises.resolve4(hostname);
        } catch (e) {
          addresses = [];
        }
        if (!Array.isArray(addresses) || addresses.length === 0) {
          const looked = await dns.promises.lookup(hostname, { all: true, family: 4 }).catch(() => []);
          const list = Array.isArray(looked) ? looked : [looked];
          addresses = list.map((item) => typeof item === "string" ? item : item && item.address).filter((ip) => typeof ip === "string" && net.isIPv4(ip));
        }
        if (addresses.length === 0) {
          throw boundaryError(`DNS resolution returned no addresses for ${hostname}`);
        }
        const badAddr = addresses.find((addr) => isPrivateIp(addr));
        if (badAddr) {
          throw boundaryError(`Resolved address ${badAddr} for ${hostname} is private, access blocked`);
        }
        return { parsed, addresses };
      } catch (e) {
        if (e.code === "ENETBOUNDARY")
          throw e;
        throw new Error(`DNS resolution failed for ${hostname}: ${e.message}`);
      }
    }
    function pinnedLookup(addresses) {
      const list = addresses.map((ip) => ({ address: ip, family: 4 }));
      return (hostname, options, callback) => {
        if (options && options.all)
          return callback(null, list);
        return callback(null, list[0].address, 4);
      };
    }
    var NETWORK_ERROR_PATTERNS = /timed out|timeout|ENOTFOUND|ECONNREFUSED|ECONNRESET|EHOSTUNREACH|ENETUNREACH|EAI_AGAIN|socket hang up|DNS resolution/i;
    function isNetworkError2(err) {
      if ((err == null ? void 0 : err.code) === "ENETBOUNDARY")
        return false;
      return NETWORK_ERROR_PATTERNS.test((err == null ? void 0 : err.message) || "") || NETWORK_ERROR_PATTERNS.test((err == null ? void 0 : err.code) || "");
    }
    function assertHostAllowed(url, domains) {
      let hostname;
      try {
        hostname = new URL(url).hostname.toLowerCase();
      } catch {
        throw boundaryError(`Invalid URL for host check: ${url}`);
      }
      const allowed = domains.some(
        (d) => hostname === d || hostname.endsWith("." + d)
      );
      if (!allowed) {
        throw boundaryError(`Host ${hostname} is not in the allowed platform list`);
      }
    }
    async function secureHttpsGet(url, options, callback) {
      if (typeof options === "function") {
        callback = options;
        options = {};
      }
      options = options || {};
      const { addresses } = await validateUrl(url);
      const proxyUrl = getSystemProxyUrl();
      if (proxyUrl) {
        return https.get(url, { ...options, agent: new ConnectProxyAgent(proxyUrl) }, callback);
      }
      const getOptions = { ...options, lookup: pinnedLookup(addresses) };
      return https.get(url, getOptions, callback);
    }
    module2.exports = {
      isPrivateIp,
      validateUrl,
      assertHostAllowed,
      pinnedLookup,
      secureHttpsGet,
      isNetworkError: isNetworkError2
    };
  }
});

// js/binary.js
var require_binary = __commonJS({
  "js/binary.js"(exports2, module2) {
    var path = require("path");
    var fs = require("fs");
    var os = require("os");
    var crypto = require("crypto");
    var { spawn, execFileSync } = require("child_process");
    var { secureHttpsGet } = require_net_guard();
    var PLUGIN_ROOT = path.join(__dirname, "..");
    var BIN_DIR = path.join(PLUGIN_ROOT, "bin");
    var PINNED_VERSIONS = {
      ytdlp: {
        version: "2026.08.19",
        assets: {
          "yt-dlp.exe": { sha256: "66674953fe251b89f4d08c5f0e35e0728679bd67ab3d7d05c0562af101dd3e7a" },
          "yt-dlp_macos": { sha256: "0f192b7ec147ab6288885d6351d9ab67367640029b4377576ef46dd79cf7b202" },
          "yt-dlp_linux": { sha256: "58162f9bfdc27458ea47bfcb311cf47028f17d8154a8bf7d689861d46399230a" }
        },
        urlTemplate: "https://github.com/yt-dlp/yt-dlp/releases/download/{version}/{binary}"
      }
    };
    function verifySha256(filePath, expectedHash) {
      if (!expectedHash || typeof expectedHash !== "string" || expectedHash.length !== 64 || expectedHash.startsWith("<")) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
        }
        throw new Error(`SHA-256 verification failed for ${path.basename(filePath)}: hash missing or invalid`);
      }
      const fileBuffer = fs.readFileSync(filePath);
      const hash = crypto.createHash("sha256").update(fileBuffer).digest("hex");
      if (hash.toLowerCase() !== expectedHash.toLowerCase()) {
        try {
          fs.unlinkSync(filePath);
        } catch (e) {
        }
        throw new Error(`SHA-256 verification failed for ${path.basename(filePath)}: expected ${expectedHash}, got ${hash}`);
      }
    }
    function getYtDlpBinaryName() {
      const platform = os.platform();
      switch (platform) {
        case "win32":
          return "yt-dlp.exe";
        case "darwin":
          return "yt-dlp_macos";
        case "linux":
          return "yt-dlp_linux";
        default:
          return "yt-dlp";
      }
    }
    function getYtDlpPath() {
      return path.join(BIN_DIR, getYtDlpBinaryName());
    }
    function isYtDlpInstalled2() {
      return fs.existsSync(getYtDlpPath());
    }
    function getEagleFfmpegPath() {
      const platform = os.platform();
      const archName = os.arch() === "arm64" ? "arm64" : "x64";
      const dataDir = platform === "darwin" ? path.join(os.homedir(), "Library", "Application Support", "Eagle") : platform === "win32" ? path.join(os.homedir(), "AppData", "Roaming", "Eagle") : path.join(os.homedir(), ".config", "Eagle");
      const dirName = platform === "darwin" ? `ffmpeg-mac-${archName}` : platform === "win32" ? `ffmpeg-win-${archName}` : `ffmpeg-linux-${archName}`;
      const bin = platform === "win32" ? "ffmpeg.exe" : "ffmpeg";
      return path.join(dataDir, "Plugins", dirName, bin);
    }
    function resolveFfmpeg() {
      const p = getEagleFfmpegPath();
      if (fs.existsSync(p))
        return { source: "eagle", path: p };
      return null;
    }
    function getFfmpegSource2() {
      var _a;
      return ((_a = resolveFfmpeg()) == null ? void 0 : _a.source) ?? null;
    }
    function getFfmpegPath() {
      var _a;
      return ((_a = resolveFfmpeg()) == null ? void 0 : _a.path) ?? null;
    }
    var DOWNLOAD_IDLE_TIMEOUT_MS = 15e3;
    var DOWNLOAD_MAX_RETRIES = 2;
    function downloadFile(url, destPath, onProgress, retriesLeft = DOWNLOAD_MAX_RETRIES, idleTimeoutMs = DOWNLOAD_IDLE_TIMEOUT_MS, maxRedirects = 5) {
      return new Promise((resolve, reject) => {
        const tmpPath = `${destPath}.download`;
        const file = fs.createWriteStream(tmpPath);
        let settled = false;
        let request = null;
        const cleanupFile = () => {
          file.close();
          if (fs.existsSync(tmpPath)) {
            try {
              fs.unlinkSync(tmpPath);
            } catch (e) {
            }
          }
        };
        const handleFailure = (error) => {
          if (settled)
            return;
          settled = true;
          if (request)
            request.destroy();
          cleanupFile();
          if (retriesLeft > 0) {
            downloadFile(url, destPath, onProgress, retriesLeft - 1, idleTimeoutMs).then(resolve).catch(reject);
          } else {
            reject(error);
          }
        };
        const onResponse = (response) => {
          if ([301, 302, 307, 308].includes(response.statusCode)) {
            settled = true;
            cleanupFile();
            const redirectUrl = response.headers.location;
            if (!redirectUrl) {
              reject(new Error("Redirect missing location header"));
              return;
            }
            if (maxRedirects <= 0) {
              reject(new Error("Too many redirects"));
              return;
            }
            downloadFile(redirectUrl, destPath, onProgress, retriesLeft, idleTimeoutMs, maxRedirects - 1).then(resolve).catch(reject);
            return;
          }
          if (response.statusCode !== 200) {
            settled = true;
            cleanupFile();
            reject(new Error(`Download failed with status ${response.statusCode}`));
            return;
          }
          const totalSize = parseInt(response.headers["content-length"], 10);
          let downloadedSize = 0;
          response.on("data", (chunk) => {
            downloadedSize += chunk.length;
            if (onProgress && totalSize) {
              onProgress(Math.round(downloadedSize / totalSize * 100));
            }
          });
          response.on("error", handleFailure);
          response.pipe(file);
          file.on("finish", () => {
            if (settled)
              return;
            settled = true;
            file.close(() => {
              try {
                fs.renameSync(tmpPath, destPath);
                resolve(destPath);
              } catch (e) {
                if (fs.existsSync(tmpPath)) {
                  try {
                    fs.unlinkSync(tmpPath);
                  } catch (_) {
                  }
                }
                reject(e);
              }
            });
          });
          file.on("error", handleFailure);
        };
        secureHttpsGet(url, onResponse).then((req) => {
          request = req;
          request.setTimeout(idleTimeoutMs, () => {
            handleFailure(new Error("Download timed out: no data received"));
          });
          request.on("error", handleFailure);
        }).catch(handleFailure);
      });
    }
    function clearQuarantine(filePath) {
      try {
        execFileSync("xattr", ["-d", "com.apple.quarantine", filePath], { stdio: "ignore" });
      } catch (e) {
      }
    }
    async function downloadYtDlp2(onProgress) {
      if (!fs.existsSync(BIN_DIR)) {
        fs.mkdirSync(BIN_DIR, { recursive: true });
      }
      const destPath = getYtDlpPath();
      const binaryName = getYtDlpBinaryName();
      const asset = PINNED_VERSIONS.ytdlp.assets[binaryName];
      if (!asset)
        throw new Error(`Unsupported platform: ${os.platform()}`);
      const url = PINNED_VERSIONS.ytdlp.urlTemplate.replace("{version}", PINNED_VERSIONS.ytdlp.version).replace("{binary}", binaryName);
      await downloadFile(url, destPath, onProgress);
      verifySha256(destPath, asset.sha256);
      if (os.platform() !== "win32") {
        fs.chmodSync(destPath, "755");
      }
      if (os.platform() === "darwin") {
        clearQuarantine(destPath);
      }
      return destPath;
    }
    function getInstalledYtDlpVersion2() {
      return new Promise((resolve) => {
        const ytdlp = getYtDlpPath();
        if (!fs.existsSync(ytdlp)) {
          resolve(null);
          return;
        }
        const proc = spawn(ytdlp, ["--version"]);
        let output = "";
        proc.stdout.on("data", (d) => {
          output += d.toString();
        });
        proc.on("close", () => resolve(output.trim() || null));
        proc.on("error", () => resolve(null));
      });
    }
    function getLatestYtDlpVersion2() {
      return PINNED_VERSIONS.ytdlp.version;
    }
    async function checkAndUpdateYtDlp(onProgress) {
      const installedVersion = await getInstalledYtDlpVersion2();
      if (!installedVersion) {
        await downloadYtDlp2(onProgress);
        return true;
      }
      const latestVersion = getLatestYtDlpVersion2();
      if (installedVersion !== latestVersion) {
        await downloadYtDlp2(onProgress);
        return true;
      }
      return false;
    }
    function uninstallYtDlp2() {
      const ytdlp = getYtDlpPath();
      if (fs.existsSync(ytdlp)) {
        fs.unlinkSync(ytdlp);
      }
      try {
        if (fs.existsSync(BIN_DIR) && fs.readdirSync(BIN_DIR).length === 0) {
          fs.rmdirSync(BIN_DIR);
        }
      } catch (e) {
      }
    }
    async function getYtDlpUpdateInfo2() {
      const installedVersion = await getInstalledYtDlpVersion2();
      if (!installedVersion) {
        return { hasUpdate: false, latestVersion: null, installedVersion: null };
      }
      const latestVersion = await getLatestYtDlpVersion2();
      return {
        hasUpdate: installedVersion !== latestVersion,
        latestVersion,
        installedVersion
      };
    }
    module2.exports = {
      BIN_DIR,
      getYtDlpPath,
      getFfmpegPath,
      getFfmpegSource: getFfmpegSource2,
      isYtDlpInstalled: isYtDlpInstalled2,
      downloadYtDlp: downloadYtDlp2,
      uninstallYtDlp: uninstallYtDlp2,
      checkAndUpdateYtDlp,
      getInstalledYtDlpVersion: getInstalledYtDlpVersion2,
      getLatestYtDlpVersion: getLatestYtDlpVersion2,
      getYtDlpUpdateInfo: getYtDlpUpdateInfo2,
      verifySha256
    };
  }
});

// js/x-http.js
var require_x_http = __commonJS({
  "js/x-http.js"(exports2, module2) {
    var http = require("http");
    var https = require("https");
    var tls = require("tls");
    var { exec } = require("child_process");
    var cachedProxy;
    function parseProxy(value) {
      if (!value)
        return null;
      const text = String(value).trim();
      if (!text)
        return null;
      const withScheme = /^[a-z]+:\/\//i.test(text) ? text : "http://" + text;
      try {
        const url = new URL(withScheme);
        if (!url.hostname)
          return null;
        return { host: url.hostname, port: Number(url.port) || 80 };
      } catch (e) {
        return null;
      }
    }
    function detectProxyFromEnv() {
      return parseProxy(
        process.env.HTTPS_PROXY || process.env.https_proxy || process.env.HTTP_PROXY || process.env.http_proxy || process.env.ALL_PROXY || process.env.all_proxy
      );
    }
    function detectProxyFromRegistry() {
      return new Promise((resolve) => {
        if (process.platform !== "win32")
          return resolve(null);
        exec(
          'reg query "HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings" /v ProxyServer',
          { timeout: 5e3 },
          (error, stdout) => {
            if (error || !stdout)
              return resolve(null);
            const matched = stdout.match(/ProxyServer\s+REG_SZ\s+(.+)/i);
            if (!matched)
              return resolve(null);
            let value = matched[1].trim();
            const httpsPart = value.match(/https=([^;]+)/i);
            if (httpsPart) {
              value = httpsPart[1];
            } else if (value.includes("=")) {
              value = value.split(";")[0].split("=")[1] || value;
            }
            resolve(parseProxy(value));
          }
        );
      });
    }
    async function resolveProxy(manual) {
      const explicit = parseProxy(manual);
      if (explicit)
        return explicit;
      if (cachedProxy !== void 0)
        return cachedProxy;
      cachedProxy = detectProxyFromEnv() || await detectProxyFromRegistry() || null;
      return cachedProxy;
    }
    function collect(res, resolve) {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 8e6)
          res.destroy();
      });
      res.on("end", () => resolve({ status: res.statusCode, body }));
    }
    function requestDirect(url, headers, timeoutMs) {
      return new Promise((resolve) => {
        const target = new URL(url);
        const req = https.request(
          {
            host: target.hostname,
            port: target.port || 443,
            path: target.pathname + target.search,
            method: "GET",
            headers: { ...headers, host: target.hostname }
          },
          (res) => collect(res, resolve)
        );
        req.on("error", (error) => resolve({ status: 0, error: error.message }));
        req.setTimeout(timeoutMs || 2e4, () => {
          req.destroy();
          resolve({ status: 0, error: "timeout" });
        });
        req.end();
      });
    }
    function requestViaProxy(url, headers, proxy, timeoutMs) {
      const target = new URL(url);
      return new Promise((resolve) => {
        const connectReq = http.request({
          host: proxy.host,
          port: proxy.port,
          method: "CONNECT",
          path: target.hostname + ":443",
          headers: { Host: target.hostname + ":443" },
          timeout: 15e3
        });
        connectReq.on("connect", (res, socket) => {
          if (res.statusCode !== 200) {
            socket.destroy();
            resolve({ status: 0, error: "proxy CONNECT " + res.statusCode });
            return;
          }
          const tlsSocket = tls.connect({ socket, servername: target.hostname });
          tlsSocket.on("error", (error) => resolve({ status: 0, error: "tls " + error.message }));
          tlsSocket.on("secureConnect", () => {
            const req = https.request(
              {
                host: target.hostname,
                port: 443,
                path: target.pathname + target.search,
                method: "GET",
                createConnection: () => tlsSocket,
                headers: { ...headers, host: target.hostname }
              },
              (response) => collect(response, resolve)
            );
            req.on("error", (error) => resolve({ status: 0, error: error.message }));
            req.setTimeout(timeoutMs || 2e4, () => {
              req.destroy();
              resolve({ status: 0, error: "timeout" });
            });
            req.end();
          });
        });
        connectReq.on("error", (error) => resolve({ status: 0, error: "proxy " + error.message }));
        connectReq.on("timeout", () => {
          connectReq.destroy();
          resolve({ status: 0, error: "proxy timeout" });
        });
        connectReq.end();
      });
    }
    async function getJson2(url, { headers = {}, proxy, timeout } = {}) {
      const resolved = await resolveProxy(proxy);
      let result = resolved ? await requestViaProxy(url, headers, resolved, timeout) : await requestDirect(url, headers, timeout);
      if (resolved && !result.status) {
        const direct = await requestDirect(url, headers, timeout);
        if (direct.status)
          result = direct;
      }
      if (result.body) {
        try {
          result.json = JSON.parse(result.body);
        } catch (e) {
          result.json = null;
        }
      }
      return result;
    }
    function requestBufferDirect(url, headers, timeoutMs) {
      return new Promise((resolve) => {
        const target = new URL(url);
        const req = https.request(
          {
            host: target.hostname,
            port: target.port || 443,
            path: target.pathname + target.search,
            method: "GET",
            headers: { ...headers, host: target.hostname }
          },
          (res) => {
            const chunks = [];
            res.on("data", (chunk) => {
              chunks.push(chunk);
              if (chunks.reduce((sum, item) => sum + item.length, 0) > 2e6)
                res.destroy();
            });
            res.on("end", () => resolve({ status: res.statusCode, buffer: Buffer.concat(chunks), contentType: res.headers["content-type"] }));
          }
        );
        req.on("error", (error) => resolve({ status: 0, error: error.message }));
        req.setTimeout(timeoutMs || 2e4, () => {
          req.destroy();
          resolve({ status: 0, error: "timeout" });
        });
        req.end();
      });
    }
    function requestBufferViaProxy(url, headers, proxy, timeoutMs) {
      const target = new URL(url);
      return new Promise((resolve) => {
        const connectReq = http.request({
          host: proxy.host,
          port: proxy.port,
          method: "CONNECT",
          path: target.hostname + ":443",
          headers: { Host: target.hostname + ":443" },
          timeout: 15e3
        });
        connectReq.on("connect", (res, socket) => {
          if (res.statusCode !== 200) {
            socket.destroy();
            resolve({ status: 0, error: "proxy CONNECT " + res.statusCode });
            return;
          }
          const tlsSocket = tls.connect({ socket, servername: target.hostname });
          tlsSocket.on("error", (error) => resolve({ status: 0, error: "tls " + error.message }));
          tlsSocket.on("secureConnect", () => {
            const req = https.request(
              {
                host: target.hostname,
                port: 443,
                path: target.pathname + target.search,
                method: "GET",
                createConnection: () => tlsSocket,
                headers: { ...headers, host: target.hostname }
              },
              (response) => {
                const chunks = [];
                response.on("data", (chunk) => {
                  chunks.push(chunk);
                  if (chunks.reduce((sum, item) => sum + item.length, 0) > 2e6)
                    response.destroy();
                });
                response.on(
                  "end",
                  () => resolve({ status: response.statusCode, buffer: Buffer.concat(chunks), contentType: response.headers["content-type"] })
                );
              }
            );
            req.on("error", (error) => resolve({ status: 0, error: error.message }));
            req.setTimeout(timeoutMs || 2e4, () => {
              req.destroy();
              resolve({ status: 0, error: "timeout" });
            });
            req.end();
          });
        });
        connectReq.on("error", (error) => resolve({ status: 0, error: "proxy " + error.message }));
        connectReq.on("timeout", () => {
          connectReq.destroy();
          resolve({ status: 0, error: "proxy timeout" });
        });
        connectReq.end();
      });
    }
    async function getRaw(url, { headers = {}, proxy, timeout } = {}) {
      const resolved = await resolveProxy(proxy);
      let result = resolved ? await requestBufferViaProxy(url, headers, resolved, timeout) : await requestBufferDirect(url, headers, timeout);
      if (resolved && !result.status) {
        const direct = await requestBufferDirect(url, headers, timeout);
        if (direct.status)
          result = direct;
      }
      return result;
    }
    module2.exports = {
      getJson: getJson2,
      getRaw,
      parseProxy,
      resolveProxy,
      detectProxyFromEnv,
      detectProxyFromRegistry
    };
  }
});

// js/sites/bilibili.js
var require_bilibili = __commonJS({
  "js/sites/bilibili.js"(exports2, module2) {
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "bilibili.com" || host === "b23.tv" || host.endsWith(".bilibili.com");
      } catch {
        return false;
      }
    }
    function getSiteArgs(url) {
      return [
        "--referer",
        "https://www.bilibili.com",
        "--add-header",
        "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      ];
    }
    async function handleExecFailure({ stderr, args, onProgress, onOutput, execYtDlp, url }) {
      const is412 = stderr.includes("HTTP Error 412");
      const alreadyHasReferer = args.includes("--referer");
      if (is412 && !alreadyHasReferer) {
        const extraArgs = getSiteArgs(url);
        if (extraArgs.length > 0) {
          return await execYtDlp([...args, ...extraArgs], onProgress, onOutput, false);
        }
      }
      return null;
    }
    module2.exports = {
      match,
      getSiteArgs,
      handleExecFailure
    };
  }
});

// js/sites/twitter.js
var require_twitter = __commonJS({
  "js/sites/twitter.js"(exports2, module2) {
    var { validateUrl, assertHostAllowed, secureHttpsGet } = require_net_guard();
    var STATUS_ID_RE = /\/(?:status|statuses)\/(\d+)/;
    var ALLOWED_MEDIA_DOMAINS = ["video.twimg.com"];
    var RECOVERABLE_ERROR_RE = /No video formats found|No video could be found|TweetTombstone|NSFW|age.?restrict|not authorized|requires authentication|Postprocessing|Invalid data found|Error opening input/i;
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "twitter.com" || host === "x.com" || host.endsWith(".twitter.com") || host.endsWith(".x.com");
      } catch {
        return false;
      }
    }
    function getSiteArgs() {
      return [
        "--ignore-no-formats-error"
      ];
    }
    function getStatusId(url) {
      const matched = String(url || "").match(STATUS_ID_RE);
      return matched ? matched[1] : null;
    }
    function getOutputTemplate(args) {
      const index = args.indexOf("-o");
      if (index >= 0 && typeof args[index + 1] === "string" && args[index + 1].trim()) {
        return args[index + 1];
      }
      return null;
    }
    function pickBestVideoUrl(tweet) {
      const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
      for (const video of videos) {
        const variants = Array.isArray(video.variants) ? video.variants.filter((variant) => {
          if (!variant || typeof variant.url !== "string")
            return false;
          const kind = `${variant.content_type || ""} ${variant.container || ""}`.toLowerCase();
          return kind.includes("mp4") || kind.includes("video/");
        }) : [];
        variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const candidate = variants.length > 0 ? variants[0].url : video.url;
        if (typeof candidate === "string" && candidate.startsWith("https://")) {
          return candidate;
        }
      }
      return null;
    }
    function pickVideoUrls(tweet) {
      const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
      const urls = [];
      for (const video of videos) {
        if (!video)
          continue;
        const variants = Array.isArray(video.variants) ? video.variants.filter((variant) => {
          if (!variant || typeof variant.url !== "string")
            return false;
          if (!/^https:\/\/video\.twimg\.com\//i.test(variant.url))
            return false;
          const kind = `${variant.content_type || ""} ${variant.container || ""}`.toLowerCase();
          return kind.includes("mp4") || /\.mp4(\?|$)/i.test(variant.url);
        }) : [];
        variants.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
        const candidate = variants.length > 0 ? variants[0].url : video.url;
        if (typeof candidate === "string" && candidate.startsWith("https://") && !urls.includes(candidate)) {
          urls.push(candidate);
        }
      }
      return urls;
    }
    var TWEET_API_TIMEOUT = 6e3;
    function fetchJsonFromApi(apiUrl, timeoutMs) {
      return new Promise(async (resolve) => {
        let settled = false;
        const finish = (value) => {
          if (!settled) {
            settled = true;
            resolve(value);
          }
        };
        try {
          await validateUrl(apiUrl);
          const req = await secureHttpsGet(
            apiUrl,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                "Accept": "application/json"
              }
            },
            (res) => {
              if (res.statusCode !== 200) {
                res.resume();
                return finish(null);
              }
              let body = "";
              res.setEncoding("utf8");
              res.on("data", (chunk) => {
                body += chunk;
                if (body.length > 2e6) {
                  res.destroy();
                  finish(null);
                }
              });
              res.on("end", () => {
                try {
                  finish(JSON.parse(body));
                } catch (e) {
                  finish(null);
                }
              });
              res.on("error", () => finish(null));
            }
          );
          req.on("error", () => finish(null));
          req.setTimeout(timeoutMs, () => {
            req.destroy();
            finish(null);
          });
        } catch (e) {
          finish(null);
        }
        setTimeout(() => finish(null), timeoutMs + 2e3);
      });
    }
    function normalizeVxTweet(data) {
      if (!data || typeof data !== "object")
        return null;
      const extended = Array.isArray(data.media_extended) ? data.media_extended : [];
      const mediaUrls = Array.isArray(data.mediaURLs) ? data.mediaURLs : [];
      const videos = [];
      const photos = [];
      for (const item of extended) {
        if (!item || typeof item.url !== "string")
          continue;
        const type = String(item.type || "").toLowerCase();
        if (type === "video" || /^https:\/\/video\.twimg\.com\//i.test(item.url)) {
          videos.push({
            url: item.url,
            duration: Number(item.duration_millis) > 0 ? Number(item.duration_millis) / 1e3 : 0,
            thumbnail_url: item.thumbnail_url || null,
            variants: [{ url: item.url, content_type: "video/mp4", bitrate: 0 }]
          });
        } else if (/^https:\/\/pbs\.twimg\.com\//i.test(item.url)) {
          photos.push(item.url);
        }
      }
      if (!videos.length && !photos.length) {
        for (const url of mediaUrls) {
          if (typeof url !== "string")
            continue;
          if (/^https:\/\/pbs\.twimg\.com\//i.test(url))
            photos.push(url);
        }
      }
      if (!videos.length && !photos.length && !String(data.text || "").trim())
        return null;
      return {
        text: typeof data.text === "string" ? data.text : "",
        author: {
          screen_name: data.user_screen_name || "",
          name: data.user_name || data.user_screen_name || "",
          id: data.user_id_str ? String(data.user_id_str) : null
        },
        media: { videos, photos }
      };
    }
    async function fetchTweetJson(statusId) {
      const fx = await fetchJsonFromApi(`https://api.fxtwitter.com/status/${statusId}`, TWEET_API_TIMEOUT);
      if (fx && fx.tweet)
        return fx;
      const vx = await fetchJsonFromApi(`https://api.vxtwitter.com/status/${statusId}`, TWEET_API_TIMEOUT);
      const normalized = normalizeVxTweet(vx);
      if (normalized)
        return { tweet: normalized };
      return null;
    }
    function pickPhotoUrls(tweet) {
      const photos = tweet && tweet.media && Array.isArray(tweet.media.photos) ? tweet.media.photos : [];
      const urls = [];
      for (const photo of photos) {
        const raw = typeof photo === "string" ? photo : photo && (photo.url || photo.media_url_https);
        if (typeof raw !== "string" || !/^https:\/\/pbs\.twimg\.com\//i.test(raw))
          continue;
        const base = raw.replace(/[?&]name=[^&]+/i, "");
        urls.push(base + (base.includes("?") ? "&" : "?") + "name=orig");
      }
      return urls;
    }
    function hasOwnMedia(tweet) {
      if (!tweet || !tweet.media)
        return false;
      const videos = Array.isArray(tweet.media.videos) ? tweet.media.videos.length : 0;
      const photos = Array.isArray(tweet.media.photos) ? tweet.media.photos.length : 0;
      return videos > 0 || photos > 0;
    }
    function resolveMediaTweet(tweet) {
      if (!tweet)
        return null;
      if (hasOwnMedia(tweet))
        return tweet;
      const nested = [tweet.quote, tweet.quoted_status, tweet.retweeted_status, tweet.retweeted_status_result];
      for (const item of nested) {
        if (hasOwnMedia(item))
          return item;
      }
      return tweet;
    }
    function tweetPageUrl(tweet) {
      if (!tweet)
        return null;
      if (typeof tweet.url === "string" && /^https:\/\/(?:x|twitter)\.com\//i.test(tweet.url))
        return tweet.url;
      const id = tweet.id ? String(tweet.id) : "";
      if (!id)
        return null;
      const handle = tweet.author && tweet.author.screen_name ? String(tweet.author.screen_name) : "i";
      return "https://x.com/" + handle + "/status/" + id;
    }
    function buildTitle(tweet, text, statusId) {
      const cleaned = String(text || "").replace(/https:\/\/t\.co\/\S+/gi, "").replace(/\s+/g, " ").trim();
      const author = tweet && tweet.author ? tweet.author.screen_name || tweet.author.name : "";
      const head = cleaned || "Twitter " + statusId;
      const suffix = author ? " - @" + author : "";
      return (head + suffix).slice(0, 180);
    }
    async function customGetInfo(url) {
      const statusId = getStatusId(url);
      if (!statusId)
        return null;
      let data = null;
      try {
        data = await fetchTweetJson(statusId);
      } catch (e) {
        return null;
      }
      const tweet = data && data.tweet;
      if (!tweet)
        return null;
      const text = typeof tweet.text === "string" ? tweet.text : "";
      const author = tweet.author || {};
      const mediaTweet = resolveMediaTweet(tweet) || tweet;
      const base = {
        title: buildTitle(tweet, text, statusId),
        description: text,
        uploader: author.name || author.screen_name || "Twitter",
        extractor: "twitter",
        webpage_url: url,
        id: statusId,
        // 自动标签用的作者字段：数字 ID 供「推特 ID」标签读取
        authorId: author.id ? String(author.id) : null,
        authorScreenName: author.screen_name || null,
        authorName: author.name || null,
        thumbnail: mediaTweet.media && mediaTweet.media.videos && mediaTweet.media.videos[0] ? mediaTweet.media.videos[0].thumbnail_url || null : null
      };
      const videos = mediaTweet.media && Array.isArray(mediaTweet.media.videos) ? mediaTweet.media.videos : [];
      if (videos.length) {
        const videoUrls = pickVideoUrls(mediaTweet);
        const pageUrl = tweetPageUrl(mediaTweet);
        const retarget = pageUrl && pageUrl !== url ? { webpage_url: pageUrl, sourceUrl: pageUrl } : {};
        return Object.assign({}, base, {
          duration: Number(videos[0].duration) || 0,
          ...videoUrls.length > 1 ? { videoUrls } : {}
        }, retarget);
      }
      const photos = pickPhotoUrls(mediaTweet);
      if (photos.length) {
        return Object.assign({}, base, {
          type: "image",
          imageUrl: photos[0],
          images: photos,
          webpage_url: url
        });
      }
      return null;
    }
    async function handleExecFailure({ stderr, args, onProgress, onOutput, execYtDlp, url }) {
      try {
        if (!match(url) || !Array.isArray(args) || args.includes("--dump-json"))
          return null;
        if (!RECOVERABLE_ERROR_RE.test(String(stderr || "")))
          return null;
        const statusId = getStatusId(url);
        const outputTemplate = getOutputTemplate(args);
        if (!statusId || !outputTemplate)
          return null;
        const data = await fetchTweetJson(statusId);
        const directUrl = pickBestVideoUrl(resolveMediaTweet(data && data.tweet));
        if (!directUrl)
          return null;
        await validateUrl(directUrl);
        assertHostAllowed(directUrl, ALLOWED_MEDIA_DOMAINS);
        return await execYtDlp(
          [directUrl, "-o", outputTemplate, "--no-warnings", "--merge-output-format", "mp4"],
          onProgress,
          onOutput,
          false
        );
      } catch (e) {
        return null;
      }
    }
    module2.exports = {
      match,
      getSiteArgs,
      customGetInfo,
      handleExecFailure,
      pickPhotoUrls,
      pickVideoUrls
    };
  }
});

// js/sites/vimeo.js
var require_vimeo = __commonJS({
  "js/sites/vimeo.js"(exports2, module2) {
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "vimeo.com" || host.endsWith(".vimeo.com");
      } catch {
        return false;
      }
    }
    function normalizeUrl(url) {
      try {
        const urlObj = new URL(url);
        if (urlObj.hostname === "vimeo.com" || urlObj.hostname === "www.vimeo.com") {
          const pathParts = urlObj.pathname.split("/").filter((p) => p);
          const videoId = pathParts.find((part) => /^\d+$/.test(part));
          if (videoId) {
            return `https://player.vimeo.com/video/${videoId}`;
          }
        }
        return url;
      } catch {
        return url;
      }
    }
    module2.exports = {
      match,
      normalizeUrl
    };
  }
});

// js/sites/instagram.js
var require_instagram = __commonJS({
  "js/sites/instagram.js"(exports2, module2) {
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "instagram.com" || host.endsWith(".instagram.com");
      } catch {
        return false;
      }
    }
    function getSiteArgs() {
      return [
        "--referer",
        "https://www.instagram.com/",
        "--add-header",
        "User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      ];
    }
    module2.exports = {
      match,
      getSiteArgs
    };
  }
});

// js/sites/pinterest.js
var require_pinterest = __commonJS({
  "js/sites/pinterest.js"(exports2, module2) {
    var { validateUrl, assertHostAllowed, secureHttpsGet } = require_net_guard();
    var DERIVED_SOURCE_DOMAINS = ["instagram.com", "youtube.com", "youtu.be", "vimeo.com", "tiktok.com"];
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "pinterest.com" || host.endsWith(".pinterest.com") || host === "pin.it";
      } catch {
        return false;
      }
    }
    function getSiteArgs() {
      return [
        "--referer",
        "https://www.pinterest.com/",
        "--add-header",
        "User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      ];
    }
    function fetchWithRedirect(url, maxRedirects = 5) {
      return new Promise(async (resolve) => {
        if (maxRedirects <= 0)
          return resolve(null);
        try {
          const u = new URL(url);
          const req = await secureHttpsGet(
            url,
            {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            },
            async (res) => {
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                let redirectUrl = res.headers.location;
                if (redirectUrl.startsWith("/")) {
                  redirectUrl = `${u.protocol}//${u.host}${redirectUrl}`;
                }
                try {
                  assertHostAllowed(redirectUrl, ["pinterest.com", "pin.it", "pinimg.com"]);
                  await validateUrl(redirectUrl);
                  return fetchWithRedirect(redirectUrl, maxRedirects - 1).then(resolve);
                } catch (err) {
                  return resolve(null);
                }
              }
              let html = "";
              res.on("data", (chunk) => html += chunk);
              res.on("end", () => resolve(html));
            }
          );
          req.on("error", () => resolve(null));
          req.setTimeout(8e3, () => {
            req.destroy();
            resolve(null);
          });
        } catch (e) {
          resolve(null);
        }
      });
    }
    async function fetchPageHtml(url) {
      await validateUrl(url);
      return await fetchWithRedirect(url);
    }
    function pickDerivedSourceUrl(html, pinId) {
      let searchArea = html;
      if (pinId) {
        const entityIdx = html.indexOf(`"entityId":"${pinId}"`);
        if (entityIdx !== -1) {
          const start = Math.max(0, entityIdx - 8e3);
          const end = Math.min(html.length, entityIdx + 8e3);
          searchArea = html.substring(start, end);
        }
      }
      const normalizedArea = searchArea.replace(/\\\//g, "/");
      const candidates = normalizedArea.match(/https:\/\/[^\s"'<>\\]+/gi);
      if (!candidates)
        return null;
      for (const raw of candidates) {
        const cleaned = raw.replace(/\\\/|\\/g, "/").replace(/\\u0026/g, "&");
        try {
          assertHostAllowed(cleaned, DERIVED_SOURCE_DOMAINS);
          return cleaned;
        } catch {
        }
      }
      return null;
    }
    async function extractPinterestPinData(pinterestUrl) {
      try {
        const html = await fetchPageHtml(pinterestUrl);
        if (!html)
          return null;
        const pinIdMatch = pinterestUrl.match(/pin\/([\d]+)/);
        const pinId = pinIdMatch ? pinIdMatch[1] : null;
        const result = {
          isVideo: false,
          videos: null,
          imageUrl: null,
          title: "",
          description: "",
          link: null,
          sourceUrl: null
        };
        if (pinId) {
          const entityIdx = html.indexOf(`"entityId":"${pinId}"`);
          if (entityIdx !== -1) {
            const start = Math.max(0, entityIdx - 3e3);
            const end = Math.min(html.length, entityIdx + 3e3);
            const context = html.substring(start, end);
            const isVideoMatch = context.match(/"isVideo"\s*:\s*(true|false)/);
            if (isVideoMatch)
              result.isVideo = isVideoMatch[1] === "true";
            const videosMatch = context.match(/"videos"\s*:\s*(null|\{)/);
            if (videosMatch && videosMatch[1] !== "null")
              result.videos = true;
            const descMatch = context.match(/"description"\s*:\s*"([^"]{0,500})"/);
            if (descMatch)
              result.description = descMatch[1];
            const titleMatch = context.match(/"seoTitle"\s*:\s*"([^"]{0,200})"/);
            if (titleMatch && titleMatch[1])
              result.title = titleMatch[1];
            const linkMatch = context.match(/"link"\s*:\s*"([^"]+)"/);
            if (linkMatch)
              result.link = linkMatch[1];
          }
        }
        if (pinId) {
          const entityIdx = html.indexOf(`"entityId":"${pinId}"`);
          if (entityIdx !== -1) {
            const imgSearchStart = Math.max(0, entityIdx - 8e3);
            const imgSearchEnd = Math.min(html.length, entityIdx + 8e3);
            const imgContext = html.substring(imgSearchStart, imgSearchEnd);
            const origMatch = imgContext.match(/https:\/\/i\.pinimg\.com\/originals\/([a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]+\.(?:jpg|png|gif|webp))/i);
            if (origMatch) {
              result.imageUrl = `https://i.pinimg.com/originals/${origMatch[1]}`;
            } else {
              const anyMatch = imgContext.match(/https:\/\/i\.pinimg\.com\/(?:1200x|736x|564x|474x|236x|136x136|60x60|600x315)\/([a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]+\.(?:jpg|png|gif|webp))/i);
              if (anyMatch) {
                result.imageUrl = `https://i.pinimg.com/originals/${anyMatch[1]}`;
              }
            }
          }
        }
        if (!result.imageUrl) {
          const originalsMatch = html.match(/https:\/\/i\.pinimg\.com\/originals\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]+\.(?:jpg|png|gif|webp)/i);
          if (originalsMatch) {
            result.imageUrl = originalsMatch[0];
          } else {
            const anyImgMatch = html.match(/https:\/\/i\.pinimg\.com\/(?:1200x|736x|564x|474x)\/([a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]{2}\/[a-f0-9]+\.(?:jpg|png|gif|webp))/i);
            if (anyImgMatch) {
              result.imageUrl = `https://i.pinimg.com/originals/${anyImgMatch[1]}`;
            }
          }
        }
        result.sourceUrl = pickDerivedSourceUrl(html, pinId);
        if (!result.title && result.description) {
          result.title = result.description.split("\n")[0].substring(0, 100);
        }
        if (!result.title)
          result.title = "Pinterest Pin";
        return result;
      } catch (e) {
        return null;
      }
    }
    async function customGetInfo(url, { execYtDlp, parseYtDlpOutput, getSiteArgsForUrl }) {
      const pinData = await extractPinterestPinData(url);
      if (!pinData)
        return null;
      const hasVideoContent = pinData.isVideo || pinData.videos;
      const hasVideoSource = !!pinData.sourceUrl;
      if (!hasVideoContent && !hasVideoSource && pinData.imageUrl) {
        return {
          type: "image",
          imageUrl: pinData.imageUrl,
          title: pinData.title || "Pinterest Pin",
          description: pinData.description || "",
          duration: 0,
          thumbnail: pinData.imageUrl,
          uploader: "Pinterest",
          extractor: "pinterest",
          webpage_url: url,
          id: null
        };
      }
      if (hasVideoSource && !hasVideoContent) {
        const targetUrl = pinData.sourceUrl.replace(/\?img_index=\d+/, "");
        assertHostAllowed(targetUrl, DERIVED_SOURCE_DOMAINS);
        await validateUrl(targetUrl);
        const args = ["--dump-json", "--no-warnings", ...getSiteArgsForUrl(targetUrl), targetUrl];
        try {
          const output = await execYtDlp(args, null, null, { targetUrl });
          const info = parseYtDlpOutput(output, targetUrl);
          info.derivedFrom = "pinterest";
          return info;
        } catch (e) {
          if (pinData.imageUrl) {
            return {
              type: "image",
              imageUrl: pinData.imageUrl,
              title: pinData.title || "Pinterest Pin",
              description: pinData.description || "",
              duration: 0,
              thumbnail: pinData.imageUrl,
              uploader: "Pinterest",
              extractor: "pinterest",
              webpage_url: url,
              id: null
            };
          }
          throw e;
        }
      }
      return null;
    }
    async function handleExecFailure({ stderr, args, onProgress, onOutput, execYtDlp, getSiteArgsForUrl, url }) {
      const isNoFormats = stderr.includes("No video formats found") || stderr.includes("[Pinterest]");
      if (!isNoFormats)
        return null;
      const alreadyTriedSource = (() => {
        try {
          return args.some((a) => {
            if (typeof a !== "string" || !a.startsWith("https"))
              return false;
            const host = new URL(a).hostname.toLowerCase();
            return DERIVED_SOURCE_DOMAINS.some((d) => host === d || host.endsWith("." + d));
          });
        } catch {
          return false;
        }
      })();
      if (!alreadyTriedSource) {
        let sourceUrl = await extractPinterestPinData(url).then((d) => (d == null ? void 0 : d.sourceUrl) ?? null);
        if (sourceUrl) {
          sourceUrl = sourceUrl.replace(/\?img_index=\d+/, "");
          try {
            assertHostAllowed(sourceUrl, DERIVED_SOURCE_DOMAINS);
            await validateUrl(sourceUrl);
          } catch {
            return null;
          }
          const oldSiteArgs = getSiteArgs();
          const cleanedArgs = args.filter((a) => !oldSiteArgs.includes(a));
          const newSiteArgs = getSiteArgsForUrl(sourceUrl);
          const newArgs = cleanedArgs.map((a) => a === url ? sourceUrl : a);
          newArgs.push(...newSiteArgs);
          try {
            return await execYtDlp(newArgs, onProgress, onOutput, { allowRecovery: false, targetUrl: sourceUrl });
          } catch (e) {
          }
        }
      }
      return null;
    }
    function assertDerivedHostAllowed(url) {
      assertHostAllowed(url, DERIVED_SOURCE_DOMAINS);
    }
    module2.exports = {
      match,
      getSiteArgs,
      customGetInfo,
      handleExecFailure,
      pickDerivedSourceUrl,
      assertDerivedHostAllowed
    };
  }
});

// js/sites/dribbble.js
var require_dribbble = __commonJS({
  "js/sites/dribbble.js"(exports2, module2) {
    var { validateUrl, assertHostAllowed, secureHttpsGet } = require_net_guard();
    var i18next2 = require_i18next();
    var ALLOWED_DOMAINS = ["dribbble.com", "cdn.dribbble.com"];
    function match(url) {
      try {
        const host = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
        return host === "dribbble.com" || host.endsWith(".dribbble.com");
      } catch {
        return false;
      }
    }
    function normalizeUrl(url) {
      try {
        const u = new URL(url);
        if (u.hostname === "dribbble.com" || u.hostname === "www.dribbble.com") {
          return `${u.protocol}//${u.host}${u.pathname}`;
        }
        return url;
      } catch {
        return url;
      }
    }
    function getSiteArgs() {
      return [
        "--referer",
        "https://dribbble.com/",
        "--add-header",
        "User-Agent:Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      ];
    }
    function parseJinaResponse(raw) {
      let title = "Dribbble Shot";
      let description = "";
      let content = raw;
      let ogImage = null;
      let creator = "Dribbble";
      if (raw.trim().startsWith("{")) {
        try {
          const json = JSON.parse(raw);
          const d = json.data || {};
          const meta = d.metadata || {};
          title = d.title || meta["og:title"] || title;
          description = d.description || meta["description"] || "";
          content = d.content || "";
          creator = meta["twitter:creator"] || creator;
          if (meta["og:image"]) {
            ogImage = Array.isArray(meta["og:image"]) ? meta["og:image"][0] : meta["og:image"];
          }
        } catch {
        }
      } else {
        const titleMatch = raw.match(/^Title:\s*(.+)$/m);
        if (titleMatch)
          title = titleMatch[1].trim();
      }
      const videoMatch = content.match(/https:\/\/cdn\.dribbble\.com\/(?:userupload|users)\/[^\s\)"\x27]+\.mp4/i) || raw.match(/https:\/\/cdn\.dribbble\.com\/(?:userupload|users)\/[^\s\)"\x27]+\.mp4/i);
      const imgMatch = content.match(/https:\/\/cdn\.dribbble\.com\/userupload\/[^\s\)"\x27]+\.(?:jpg|jpeg|png|webp|gif)/i) || raw.match(/https:\/\/cdn\.dribbble\.com\/userupload\/[^\s\)"\x27]+\.(?:jpg|jpeg|png|webp|gif)/i) || ogImage;
      return {
        title,
        description,
        creator,
        videoUrl: videoMatch ? videoMatch[0] : null,
        imageUrl: imgMatch ? typeof imgMatch === "string" ? imgMatch : imgMatch[0] : null
      };
    }
    function fetchShotData(shotUrl) {
      return new Promise(async (resolve) => {
        try {
          const jinaUrl = `https://r.jina.ai/${shotUrl}`;
          await validateUrl(jinaUrl);
          const req = await secureHttpsGet(
            jinaUrl,
            {
              headers: {
                "Accept": "application/json",
                "X-Return-Format": "json"
              }
            },
            (res) => {
              let body = "";
              res.on("data", (chunk) => body += chunk);
              res.on("end", () => {
                resolve(parseJinaResponse(body));
              });
            }
          );
          req.on("error", () => resolve(null));
          req.setTimeout(2e4, () => {
            req.destroy();
            resolve(null);
          });
        } catch (e) {
          resolve(null);
        }
      });
    }
    async function customGetInfo(url) {
      try {
        const parsed = new URL(url);
        if (parsed.hostname.toLowerCase() === "cdn.dribbble.com") {
          return null;
        }
      } catch {
        return null;
      }
      if (!url.includes("/shots/")) {
        return null;
      }
      const cleanUrl = normalizeUrl(url);
      const shotData = await fetchShotData(cleanUrl);
      if (!shotData) {
        throw new Error(i18next2.t("error.dribbbleExtractFailed"));
      }
      const shotIdMatch = url.match(/\/shots\/(\d+)/);
      const shotId = shotIdMatch ? shotIdMatch[1] : null;
      if (shotData.videoUrl) {
        assertHostAllowed(shotData.videoUrl, ALLOWED_DOMAINS);
        await validateUrl(shotData.videoUrl);
        return {
          title: shotData.title,
          description: shotData.description,
          uploader: shotData.creator || "Dribbble",
          extractor: "dribbble",
          webpage_url: shotData.videoUrl,
          thumbnail: shotData.imageUrl,
          duration: 0,
          id: shotId
        };
      }
      if (shotData.imageUrl) {
        assertHostAllowed(shotData.imageUrl, ALLOWED_DOMAINS);
        await validateUrl(shotData.imageUrl);
        return {
          type: "image",
          imageUrl: shotData.imageUrl,
          title: shotData.title,
          description: shotData.description,
          duration: 0,
          thumbnail: shotData.imageUrl,
          uploader: shotData.creator || "Dribbble",
          extractor: "dribbble",
          webpage_url: url,
          id: shotId
        };
      }
      throw new Error(i18next2.t("error.dribbbleNoMedia"));
    }
    module2.exports = {
      match,
      normalizeUrl,
      getSiteArgs,
      customGetInfo
    };
  }
});

// js/library-context.js
var require_library_context = __commonJS({
  "js/library-context.js"(exports2, module2) {
    function getLibraryPath() {
      try {
        if (typeof eagle !== "undefined" && eagle && eagle.library && eagle.library.path) {
          return String(eagle.library.path);
        }
      } catch (e) {
      }
      return "";
    }
    function scopedKey(base) {
      const libraryPath = getLibraryPath();
      if (!libraryPath)
        return base;
      return base + "::" + libraryPath.toLowerCase();
    }
    module2.exports = {
      getLibraryPath,
      scopedKey
    };
  }
});

// js/sankaku-auth.js
var require_sankaku_auth = __commonJS({
  "js/sankaku-auth.js"(exports2, module2) {
    var { scopedKey } = require_library_context();
    var STORAGE_KEY = "Edge-Media-Download-NEW.sankakuAuth";
    function currentKey() {
      if (typeof localStorage === "undefined")
        return STORAGE_KEY;
      return scopedKey(STORAGE_KEY);
    }
    function migrateLegacyKey(key) {
      try {
        if (typeof localStorage === "undefined" || key === STORAGE_KEY)
          return;
        if (localStorage.getItem(key) === null) {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy !== null)
            localStorage.setItem(key, legacy);
        }
      } catch (e) {
      }
    }
    function getStoredAuth() {
      try {
        if (typeof localStorage === "undefined")
          return "";
        const key = currentKey();
        migrateLegacyKey(key);
        return localStorage.getItem(key) || "";
      } catch (e) {
        return "";
      }
    }
    function setStoredAuth(value) {
      try {
        if (typeof localStorage === "undefined")
          return;
        const key = currentKey();
        const text = String(value || "").trim();
        if (!text) {
          localStorage.removeItem(key);
          return;
        }
        localStorage.setItem(key, text);
      } catch (e) {
      }
    }
    function parseAccessToken(raw) {
      const text = String(raw === void 0 || raw === null ? "" : raw).trim();
      if (!text)
        return "";
      if (!text.includes("="))
        return text;
      for (const part of text.split(";")) {
        const index = part.indexOf("=");
        if (index < 0)
          continue;
        const name = part.slice(0, index).trim();
        const value = part.slice(index + 1).trim();
        if (name === "accessToken" && value)
          return value;
      }
      return "";
    }
    function getAccessToken() {
      return parseAccessToken(getStoredAuth());
    }
    function buildAuthHeaders(baseHeaders) {
      const headers = { ...baseHeaders || {} };
      const token = getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      return headers;
    }
    module2.exports = {
      STORAGE_KEY,
      getStoredAuth,
      setStoredAuth,
      parseAccessToken,
      getAccessToken,
      buildAuthHeaders
    };
  }
});

// js/sites/sankaku.js
var require_sankaku = __commonJS({
  "js/sites/sankaku.js"(exports2, module2) {
    var { validateUrl, assertHostAllowed, secureHttpsGet } = require_net_guard();
    var { buildAuthHeaders, getAccessToken } = require_sankaku_auth();
    var i18next2 = require_i18next();
    function tr(key, fallback) {
      try {
        const value = i18next2.t(key);
        return value && value !== key ? value : fallback;
      } catch (e) {
        return fallback;
      }
    }
    var API_BASE = "https://sankakuapi.com";
    var API_ACCEPT = "application/vnd.sankaku.api+json;v=2";
    var ALLOWED_MEDIA_DOMAINS = ["sankakucomplex.com", "sankaku.app"];
    var POST_PATH_RE = /^(?:\/[a-z]{2}(?:-[a-zA-Z]{2,4})?)?\/posts?(?:\/show)?\/([A-Za-z0-9]+)\/?$/;
    var VIDEO_EXT_RE = /^(mp4|webm|mov|m4v|mkv)$/i;
    var IMAGE_EXT_RE = /^(jpg|jpeg|png|gif|webp|avif)$/i;
    function match(url) {
      try {
        const host = new URL(url).hostname.toLowerCase();
        return host === "sankaku.app" || host.endsWith(".sankaku.app") || host === "sankakucomplex.com" || host.endsWith(".sankakucomplex.com");
      } catch {
        return false;
      }
    }
    function normalizeUrl(url) {
      try {
        const u = new URL(url);
        if (!getPostId(u))
          return url;
        return `${u.protocol}//${u.host}${u.pathname.replace(/\/+$/, "")}`;
      } catch {
        return url;
      }
    }
    function getSiteArgs() {
      return [
        "--referer",
        "https://sankaku.app/",
        "--add-header",
        "User-Agent:Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"
      ];
    }
    function getPostId(url) {
      try {
        const parsed = url instanceof URL ? url : new URL(url);
        const matched = parsed.pathname.match(POST_PATH_RE);
        return matched ? matched[1] : null;
      } catch {
        return null;
      }
    }
    function fetchPost(postId, anonymous = false) {
      return new Promise(async (resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => {
          if (settled)
            return;
          settled = true;
          fn(value);
        };
        const params = new URLSearchParams({
          lang: "en",
          page: "1",
          limit: "1",
          tags: `id_range:${postId}`
        });
        const apiUrl = `${API_BASE}/v2/posts?${params.toString()}`;
        try {
          await validateUrl(apiUrl);
          const req = await secureHttpsGet(
            apiUrl,
            {
              headers: anonymous ? {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": API_ACCEPT,
                "Origin": "https://sankaku.app",
                "Referer": "https://sankaku.app/"
              } : buildAuthHeaders({
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
                "Accept": API_ACCEPT,
                "Origin": "https://sankaku.app",
                "Referer": "https://sankaku.app/"
              })
            },
            (res) => {
              let body = "";
              res.setEncoding("utf8");
              res.on("data", (chunk) => {
                body += chunk;
                if (body.length > 2e6) {
                  res.destroy();
                  finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post")));
                }
              });
              res.on("end", () => {
                if (res.statusCode === 429) {
                  finish(reject, new Error(tr("error.sankakuRateLimited", "Sankaku API rate limited, please retry later")));
                  return;
                }
                if (res.statusCode === 401 && !anonymous && getAccessToken()) {
                  fetchPost(postId, true).then((post) => finish(resolve, post), (err) => finish(reject, err));
                  return;
                }
                if (res.statusCode === 401) {
                  finish(reject, new Error(tr("error.sankakuAuthExpired", "Sankaku login expired, please update the account cookie in Settings")));
                  return;
                }
                if (res.statusCode === 404) {
                  if (getAccessToken() && !anonymous) {
                    finish(reject, new Error(tr("error.sankakuNotFound", "Sankaku post not found (bad link or deleted)")));
                  } else {
                    finish(reject, new Error(tr(
                      "error.sankakuLoginOrDeleted",
                      "Sankaku post not found for anonymous users; it may require login or be deleted. Add your account cookie in Settings -> Account."
                    )));
                  }
                  return;
                }
                if (res.statusCode === 403) {
                  if (getAccessToken() && !anonymous) {
                    fetchPost(postId, true).then((post) => finish(resolve, post), (err) => finish(reject, err));
                  } else {
                    finish(reject, new Error(tr("error.sankakuUnavailable", "Sankaku post unavailable (deleted or restricted)")));
                  }
                  return;
                }
                if (res.statusCode !== 200) {
                  finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post")));
                  return;
                }
                try {
                  finish(resolve, pickPost(JSON.parse(body), postId));
                } catch (e) {
                  finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post")));
                }
              });
              res.on("error", () => finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post"))));
            }
          );
          req.on("error", () => finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post"))));
          req.setTimeout(15e3, () => {
            req.destroy();
            finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post")));
          });
        } catch (e) {
          finish(reject, e);
        }
        setTimeout(() => finish(reject, new Error(tr("error.sankakuExtractFailed", "Failed to read this Sankaku post"))), 2e4);
      });
    }
    function pickPost(payload, postId) {
      const list = Array.isArray(payload) ? payload : Array.isArray(payload && payload.data) ? payload.data : [];
      const post = list.find((item) => item && String(item.id).toLowerCase() === postId.toLowerCase());
      return post || null;
    }
    function buildTitle(post) {
      const author = post.author && (post.author.display_name || post.author.name) || "";
      const label = `Sankaku ${post.id}`;
      return author ? `${author} - ${label}` : label;
    }
    function buildDescription(post) {
      const tags = Array.isArray(post.tag_names) ? post.tag_names.slice(0, 12).join(" ") : "";
      return tags;
    }
    async function customGetInfo(url) {
      const postId = getPostId(url);
      if (!postId)
        return null;
      const post = await fetchPost(postId);
      if (!post) {
        throw new Error(tr("error.sankakuNotFound", "Sankaku post not found (bad link or deleted)"));
      }
      if (post.status && post.status !== "active") {
        throw new Error(tr("error.sankakuUnavailable", "Sankaku post unavailable (deleted or restricted)"));
      }
      let fileUrl = typeof post.file_url === "string" ? post.file_url.trim() : "";
      if (!fileUrl) {
        throw new Error(tr("error.sankakuLoginRequired", "This Sankaku post requires a logged-in account"));
      }
      if (fileUrl.startsWith("http://")) {
        fileUrl = `https://${fileUrl.slice("http://".length)}`;
      }
      assertHostAllowed(fileUrl, ALLOWED_MEDIA_DOMAINS);
      await validateUrl(fileUrl);
      const fileExt = String(post.file_ext || "").toLowerCase();
      const fileType = String(post.file_type || "").toLowerCase();
      const isVideo = fileType.startsWith("video/") || VIDEO_EXT_RE.test(fileExt);
      const base = {
        title: buildTitle(post),
        description: buildDescription(post),
        duration: Number(post.duration || post.video_duration || 0) || 0,
        thumbnail: post.preview_url || post.sample_url || null,
        uploader: post.author && (post.author.display_name || post.author.name) || "Sankaku",
        extractor: "sankaku",
        id: post.id,
        webpage_url: fileUrl
      };
      if (isVideo) {
        return base;
      }
      if (IMAGE_EXT_RE.test(fileExt) || fileType.startsWith("image/")) {
        return {
          ...base,
          type: "image",
          imageUrl: fileUrl,
          webpage_url: url
        };
      }
      throw new Error(tr("error.sankakuNoMedia", "No downloadable video or image in this Sankaku post"));
    }
    module2.exports = {
      match,
      normalizeUrl,
      getSiteArgs,
      customGetInfo,
      getPostId
    };
  }
});

// js/sites/xiaohongshu.js
var require_xiaohongshu = __commonJS({
  "js/sites/xiaohongshu.js"(exports2, module2) {
    var { validateUrl, assertHostAllowed, secureHttpsGet } = require_net_guard();
    var i18next2 = require_i18next();
    var PLATFORM_DOMAINS = ["xiaohongshu.com", "xhslink.com"];
    var NOTE_HOST_DOMAINS = ["xiaohongshu.com"];
    var SHORT_LINK_DOMAINS = ["xhslink.com"];
    var ALLOWED_MEDIA_DOMAINS = ["xhscdn.com"];
    var USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
    var NOTE_PATH_RE = /^\/(?:explore|discovery\/item|note)\/([0-9a-f]{24})\/?$/i;
    var IMAGE_ORIGIN = "https://sns-img-bd.xhscdn.com/";
    var HTML_LIMIT = 4 * 1024 * 1024;
    var REQUEST_TIMEOUT = 25e3;
    var WARM_TTL = 10 * 60 * 1e3;
    var MAX_TAGS = 30;
    function tr(key, fallback) {
      try {
        const value = i18next2.t(key);
        return value && value !== key ? value : fallback;
      } catch (e) {
        return fallback;
      }
    }
    function hostOf(url) {
      try {
        return new URL(url).hostname.toLowerCase().replace(/^www\./, "");
      } catch (e) {
        return "";
      }
    }
    function isHostIn(url, domains) {
      const host = hostOf(url);
      if (!host)
        return false;
      return domains.some((domain) => host === domain || host.endsWith("." + domain));
    }
    function match(url) {
      return isHostIn(url, PLATFORM_DOMAINS);
    }
    function isShortLink(url) {
      return isHostIn(url, SHORT_LINK_DOMAINS);
    }
    function getNoteId(url) {
      try {
        const parsed = url instanceof URL ? url : new URL(url);
        const matched = parsed.pathname.match(NOTE_PATH_RE);
        return matched ? matched[1].toLowerCase() : null;
      } catch (e) {
        return null;
      }
    }
    function normalizeUrl(url) {
      try {
        const parsed = new URL(url);
        if (!getNoteId(parsed))
          return url;
        const kept = new URLSearchParams();
        for (const key of ["xsec_token", "xsec_source"]) {
          const value = parsed.searchParams.get(key);
          if (value)
            kept.set(key, value);
        }
        parsed.hash = "";
        parsed.search = kept.toString();
        return parsed.toString();
      } catch (e) {
        return url;
      }
    }
    function getSiteArgs() {
      return [
        "--referer",
        "https://www.xiaohongshu.com/",
        "--add-header",
        `User-Agent:${USER_AGENT}`
      ];
    }
    var cookieJar = /* @__PURE__ */ new Map();
    var warmedAt = 0;
    var warmPromise = null;
    function storeCookies(res) {
      const list = res && res.headers && res.headers["set-cookie"];
      if (!Array.isArray(list))
        return;
      for (const line of list) {
        const pair = String(line).split(";")[0];
        const index = pair.indexOf("=");
        if (index > 0)
          cookieJar.set(pair.slice(0, index).trim(), pair.slice(index + 1).trim());
      }
    }
    function cookieHeader() {
      if (!cookieJar.size)
        return "";
      return [...cookieJar.entries()].map(([key, value]) => `${key}=${value}`).join("; ");
    }
    function buildHeaders(url, extra) {
      const headers = {
        "User-Agent": USER_AGENT,
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "zh-CN,zh;q=0.9,en;q=0.8",
        ...extra || {}
      };
      if (isHostIn(url, NOTE_HOST_DOMAINS)) {
        const cookie = cookieHeader();
        if (cookie)
          headers.Cookie = cookie;
      }
      return headers;
    }
    function request(url, redirectsLeft = 5) {
      return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (fn, value) => {
          if (settled)
            return;
          settled = true;
          fn(value);
        };
        (async () => {
          let req;
          try {
            req = await secureHttpsGet(url, { headers: buildHeaders(url) }, (res) => {
              storeCookies(res);
              const status = res.statusCode;
              if ([301, 302, 303, 307, 308].includes(status) && res.headers.location) {
                res.resume();
                if (redirectsLeft <= 0) {
                  finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note")));
                  return;
                }
                let nextUrl;
                try {
                  nextUrl = new URL(res.headers.location, url).toString();
                } catch (e) {
                  finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note")));
                  return;
                }
                request(nextUrl, redirectsLeft - 1).then(
                  (value) => finish(resolve, value),
                  (error) => finish(reject, error)
                );
                return;
              }
              let body = "";
              res.setEncoding("utf8");
              res.on("data", (chunk) => {
                body += chunk;
                if (body.length > HTML_LIMIT) {
                  res.destroy();
                  finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note")));
                }
              });
              res.on("end", () => finish(resolve, { statusCode: status, body, finalUrl: url, headers: res.headers }));
              res.on("error", () => finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note"))));
            });
            req.on("error", () => finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note"))));
            req.setTimeout(REQUEST_TIMEOUT, () => {
              req.destroy();
              finish(reject, new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note")));
            });
          } catch (error) {
            finish(reject, error);
          }
        })();
      });
    }
    async function warmUp() {
      if (cookieJar.size && Date.now() - warmedAt < WARM_TTL)
        return;
      if (warmPromise)
        return warmPromise;
      warmPromise = (async () => {
        try {
          await request("https://www.xiaohongshu.com/explore");
          warmedAt = Date.now();
        } catch (e) {
        } finally {
          warmPromise = null;
        }
      })();
      return warmPromise;
    }
    function extractState(html) {
      if (typeof html !== "string")
        return null;
      const matched = html.match(/window\.__INITIAL_STATE__\s*=\s*([\s\S]*?)<\/script>/);
      if (!matched)
        return null;
      const source = matched[1].replace(/([:[,]\s*)undefined(?=\s*[,}\]])/g, "$1null");
      try {
        return JSON.parse(source);
      } catch (e) {
        return null;
      }
    }
    function pickNote(state, noteId) {
      const map = state && state.note && state.note.noteDetailMap;
      if (!map || typeof map !== "object")
        return null;
      const entry = map[noteId] || map[Object.keys(map)[0]];
      if (!entry || !entry.note || typeof entry.note !== "object")
        return null;
      return entry.note;
    }
    function firstLine(text, maxLength) {
      const cleaned = String(text || "").replace(/\s+/g, " ").trim();
      if (!cleaned)
        return "";
      const cut = cleaned.split(/[。！？!?\n]/)[0].trim();
      return (cut || cleaned).slice(0, maxLength);
    }
    function buildTitle(note, noteId) {
      const title = String(note.title || "").replace(/\s+/g, " ").trim();
      if (title)
        return title.slice(0, 120);
      const fromDesc = firstLine(note.desc, 60);
      return fromDesc || `\u5C0F\u7EA2\u4E66 ${noteId}`;
    }
    function buildTags(note) {
      const list = Array.isArray(note.tagList) ? note.tagList : [];
      const seen = /* @__PURE__ */ new Set();
      const tags = [];
      for (const tag of list) {
        const name = String(tag && tag.name || "").trim().replace(/^#+/, "");
        if (!name || seen.has(name))
          continue;
        seen.add(name);
        tags.push(name);
        if (tags.length >= MAX_TAGS)
          break;
      }
      return tags;
    }
    function buildDescription(note) {
      return String(note.desc || "").slice(0, 4e3);
    }
    function mediaUrl(value) {
      if (typeof value !== "string" || !value.trim())
        return null;
      const upgraded = value.trim().replace(/^http:\/\//i, "https://");
      try {
        assertHostAllowed(upgraded, ALLOWED_MEDIA_DOMAINS);
        return upgraded;
      } catch (e) {
        return null;
      }
    }
    function pickImages(note) {
      const list = Array.isArray(note.imageList) ? note.imageList : [];
      const items = [];
      const seen = /* @__PURE__ */ new Set();
      for (const image of list) {
        if (!image)
          continue;
        const fileId = typeof image.fileId === "string" ? image.fileId.trim() : "";
        const original = fileId ? mediaUrl(IMAGE_ORIGIN + fileId) : null;
        const fallback = mediaUrl(image.urlDefault) || mediaUrl(image.url);
        if (!original && !fallback)
          continue;
        if (original && seen.has(original))
          continue;
        if (original)
          seen.add(original);
        const converted = original ? mediaUrl(`${original}?imageView2/2/w/0/format/jpg`) : null;
        const fallbacks = [];
        for (const candidate of [converted, fallback]) {
          if (candidate && candidate !== original && !fallbacks.includes(candidate))
            fallbacks.push(candidate);
        }
        const item = original ? { url: original, fallbacks } : { url: fallback, fallbacks: [] };
        items.push(item);
      }
      return items;
    }
    function pickVideo(note) {
      const stream = note && note.video && note.video.media && note.video.media.stream;
      if (!stream || typeof stream !== "object")
        return null;
      const candidates = [];
      for (const codec of ["h264", "h265", "av1", "h266"]) {
        const list = Array.isArray(stream[codec]) ? stream[codec] : [];
        for (const item of list) {
          if (item && typeof item === "object")
            candidates.push(item);
        }
      }
      if (!candidates.length)
        return null;
      const score = (item) => {
        const size = Number(item.size) || 0;
        return size * (String(item.videoCodec || "").toLowerCase() === "h264" ? 1.2 : 1);
      };
      candidates.sort((a, b) => score(b) - score(a));
      for (const candidate of candidates) {
        const backups = Array.isArray(candidate.backupUrls) ? candidate.backupUrls : [];
        for (const raw of [candidate.masterUrl, ...backups]) {
          const url = mediaUrl(raw);
          if (!url)
            continue;
          const durationMs = Number(candidate.videoDuration) || 0;
          const duration = durationMs > 0 ? Math.round(durationMs / 1e3) : Number(note.video && note.video.capa && note.video.capa.duration) || 0;
          return {
            url,
            duration,
            width: Number(candidate.width) || 0,
            height: Number(candidate.height) || 0
          };
        }
      }
      return null;
    }
    async function customGetInfo(url) {
      await warmUp();
      let noteUrl = url;
      if (isShortLink(url)) {
        const initial = await request(url);
        noteUrl = initial.finalUrl;
      }
      if (!isHostIn(noteUrl, NOTE_HOST_DOMAINS)) {
        throw new Error(tr("error.xhsUnsupported", "Only Xiaohongshu note links are supported"));
      }
      const noteId = getNoteId(noteUrl);
      if (!noteId) {
        throw new Error(tr("error.xhsUnsupported", "Only Xiaohongshu note links are supported"));
      }
      await validateUrl(noteUrl);
      const response = await request(noteUrl);
      if (response.statusCode === 404) {
        throw new Error(tr("error.xhsNoteUnavailable", "This Xiaohongshu note cannot be read"));
      }
      if (response.statusCode !== 200) {
        throw new Error(tr("error.xhsExtractFailed", "Failed to read this Xiaohongshu note"));
      }
      const state = extractState(response.body);
      const note = pickNote(state, noteId);
      if (!note) {
        throw new Error(tr("error.xhsNoteUnavailable", "This Xiaohongshu note cannot be read"));
      }
      const title = buildTitle(note, noteId);
      const description = buildDescription(note);
      const tags = buildTags(note);
      const nickname = note.user && (note.user.nickname || note.user.nickName) || "Xiaohongshu";
      const base = {
        title,
        description,
        tags,
        extractor: "xiaohongshu",
        uploader: String(nickname),
        id: noteId,
        webpage_url: noteUrl,
        thumbnail: mediaUrl(note.imageList && note.imageList[0] && note.imageList[0].urlDefault) || null
      };
      const video = pickVideo(note);
      if (video && video.url) {
        return {
          ...base,
          duration: video.duration || 0,
          webpage_url: video.url,
          useTitleAsFilename: true
        };
      }
      if (String(note.type || "").toLowerCase() === "video") {
        throw new Error(tr("error.xhsNoMedia", "No downloadable image or video found in this note"));
      }
      const images = pickImages(note);
      if (images.length) {
        return {
          ...base,
          type: "image",
          imageUrl: images[0].url,
          images,
          // 图片 CDN 直连即可，跳过 yt-dlp 尝试，避免每张图多一次无效子进程
          imageDirect: true
        };
      }
      throw new Error(tr("error.xhsNoMedia", "No downloadable image or video found in this note"));
    }
    module2.exports = {
      match,
      normalizeUrl,
      getSiteArgs,
      getNoteId,
      customGetInfo
    };
  }
});

// js/sites/index.js
var require_sites = __commonJS({
  "js/sites/index.js"(exports2, module2) {
    var bilibili = require_bilibili();
    var twitter = require_twitter();
    var vimeo = require_vimeo();
    var instagram = require_instagram();
    var pinterest = require_pinterest();
    var dribbble = require_dribbble();
    var sankaku = require_sankaku();
    var xiaohongshu = require_xiaohongshu();
    var adapters = [
      bilibili,
      twitter,
      vimeo,
      instagram,
      pinterest,
      dribbble,
      sankaku,
      xiaohongshu
    ];
    function findAdapter(url) {
      if (!url || typeof url !== "string")
        return null;
      for (const adapter of adapters) {
        if (adapter.match(url)) {
          return adapter;
        }
      }
      return null;
    }
    function normalizeUrl(url) {
      const adapter = findAdapter(url);
      if (adapter && typeof adapter.normalizeUrl === "function") {
        return adapter.normalizeUrl(url);
      }
      return url;
    }
    function getSiteArgs(url) {
      const adapter = findAdapter(url);
      if (adapter && typeof adapter.getSiteArgs === "function") {
        return adapter.getSiteArgs(url);
      }
      return [];
    }
    async function customGetInfo(url, context) {
      const adapter = findAdapter(url);
      if (adapter && typeof adapter.customGetInfo === "function") {
        return await adapter.customGetInfo(url, context);
      }
      return null;
    }
    async function handleExecFailure(context) {
      const { url } = context;
      const adapter = findAdapter(url);
      if (adapter && typeof adapter.handleExecFailure === "function") {
        return await adapter.handleExecFailure(context);
      }
      return null;
    }
    function assertDerivedHostAllowed(url) {
      return pinterest.assertDerivedHostAllowed(url);
    }
    module2.exports = {
      findAdapter,
      normalizeUrl,
      getSiteArgs,
      customGetInfo,
      handleExecFailure,
      assertDerivedHostAllowed
    };
  }
});

// js/downloader.js
var require_downloader = __commonJS({
  "js/downloader.js"(exports2, module2) {
    var path = require("path");
    var fs = require("fs");
    var os = require("os");
    var { spawn } = require("child_process");
    var i18next2 = require_i18next();
    var { getYtDlpPath, getFfmpegPath, BIN_DIR, downloadYtDlp: downloadYtDlp2 } = require_binary();
    var { validateUrl, secureHttpsGet } = require_net_guard();
    var { getSystemProxyUrl } = require_system_proxy();
    var siteAdapters = require_sites();
    var maxResolution = "auto";
    var maxFramerate = "auto";
    var threadCount = 0;
    var runningProcs = /* @__PURE__ */ new Set();
    var cancelledProcs = /* @__PURE__ */ new WeakSet();
    function cancelAll() {
      let count = 0;
      for (const proc of runningProcs) {
        try {
          cancelledProcs.add(proc);
          proc.kill();
          count++;
        } catch (e) {
        }
      }
      return count;
    }
    function setQualityPrefs({ resolution = "auto", framerate = "auto" } = {}) {
      maxResolution = resolution || "auto";
      maxFramerate = framerate || "auto";
    }
    function setThreadCount(value) {
      if (String(value) === "auto") {
        threadCount = 8;
        return;
      }
      const parsed = parseInt(value, 10);
      threadCount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    }
    function escapeRegExp(text) {
      return String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    }
    function startProcessingWatcher(outputDir, sanitizedTitle, onProgress) {
      const base = escapeRegExp(sanitizedTitle);
      const finalRe = new RegExp(`^${base}_\\d+\\.[^.]+$`);
      const partRe = new RegExp(`^${base}_\\d+\\.[^.]{1,8}\\.[^.]+$`);
      const timer = setInterval(() => {
        let entries = [];
        try {
          entries = fs.readdirSync(outputDir);
        } catch (e) {
          return;
        }
        const finals = entries.filter((name) => finalRe.test(name) && !partRe.test(name));
        if (!finals.length)
          return;
        let expected = 0;
        for (const name of entries) {
          if (!partRe.test(name))
            continue;
          try {
            expected += fs.statSync(path.join(outputDir, name)).size;
          } catch (e) {
          }
        }
        if (expected <= 0)
          return;
        let written = 0;
        for (const name of finals) {
          try {
            written += fs.statSync(path.join(outputDir, name)).size;
          } catch (e) {
          }
        }
        if (onProgress) {
          onProgress({ processingPercent: Math.max(0, Math.min(99, Math.round(written / expected * 100))) });
        }
      }, 400);
      if (timer.unref)
        timer.unref();
      return { stop: () => clearInterval(timer) };
    }
    function buildFormatSelector(resolution, framerate) {
      const heightFilter = resolution && resolution !== "auto" ? `[height<=${resolution}]` : "";
      const fpsFilter = framerate && framerate !== "auto" ? `[fps<=${framerate}]` : "";
      if (!heightFilter && !fpsFilter) {
        return "bestvideo+bestaudio/best/b";
      }
      const parts = [];
      if (heightFilter && fpsFilter) {
        parts.push(`bestvideo${heightFilter}${fpsFilter}+bestaudio/best${heightFilter}${fpsFilter}`);
      }
      if (heightFilter) {
        parts.push(`bestvideo${heightFilter}+bestaudio/best${heightFilter}`);
      }
      if (fpsFilter) {
        parts.push(`bestvideo${fpsFilter}+bestaudio/best${fpsFilter}`);
      }
      parts.push("bestvideo+bestaudio/best/b");
      return parts.join("/");
    }
    function isCorruptedBinaryError(error) {
      return error.code === "EBADMACHO" || error.code === "ENOEXEC" || error.errno === -88;
    }
    function execYtDlp(args, onProgress, onOutput, options = {}) {
      if (typeof options === "boolean") {
        options = { allowRecovery: options };
      }
      const { allowRecovery = true, targetUrl = null } = options;
      return new Promise((resolve, reject) => {
        const ytdlp = getYtDlpPath();
        if (!fs.existsSync(ytdlp)) {
          reject(new Error(i18next2.t("error.ytdlpNotInstalled")));
          return;
        }
        if (os.platform() !== "win32") {
          try {
            fs.chmodSync(ytdlp, "755");
          } catch (e) {
          }
        }
        const recoverFromCorruptBinary = (error) => {
          try {
            fs.unlinkSync(ytdlp);
          } catch (e) {
          }
          downloadYtDlp2().then(() => execYtDlp(args, onProgress, onOutput, { allowRecovery: false, targetUrl })).then(resolve).catch(() => reject(new Error(`${i18next2.t("error.failedToExecuteYtdlp")}: ${error.message}`)));
        };
        const finalArgs = args.includes("--force-ipv4") ? args : ["--force-ipv4", ...args];
        const proxyUrl = getSystemProxyUrl();
        const runArgs = proxyUrl && !finalArgs.includes("--proxy") ? ["--proxy", proxyUrl, ...finalArgs] : finalArgs;
        let proc;
        try {
          proc = spawn(ytdlp, runArgs, { cwd: BIN_DIR });
        } catch (error) {
          if (allowRecovery && isCorruptedBinaryError(error)) {
            recoverFromCorruptBinary(error);
            return;
          }
          reject(new Error(`${i18next2.t("error.failedToExecuteYtdlp")}: ${error.message}`));
          return;
        }
        let stdout = "";
        let stderr = "";
        runningProcs.add(proc);
        proc.stdout.on("data", (data) => {
          const output = data.toString();
          stdout += output;
          if (onOutput)
            onOutput(output);
          const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%/);
          if (progressMatch && onProgress) {
            const percent = parseFloat(progressMatch[1]);
            const sizeMatch = output.match(/of\s+~?\s*(\S+)/);
            const totalSize = sizeMatch ? sizeMatch[1] : "";
            const speedMatch = output.match(/at\s+(\S+)/);
            const currentSpeed = speedMatch ? speedMatch[1] : "";
            const etaMatch = output.match(/ETA\s+(\S+)/);
            const eta = etaMatch ? etaMatch[1] : "";
            onProgress({
              percent,
              totalSize,
              currentSpeed,
              eta
            });
          }
        });
        proc.stderr.on("data", (data) => {
          stderr += data.toString();
        });
        proc.on("error", (error) => {
          runningProcs.delete(proc);
          if (allowRecovery && isCorruptedBinaryError(error)) {
            recoverFromCorruptBinary(error);
            return;
          }
          let detail = error.message;
          if (error.code === "ENOENT") {
            detail = i18next2.t("error.ytdlpNotFound") + " (ENOENT)";
          } else if (error.code === "EACCES") {
            detail = i18next2.t("error.ytdlpPermissionDenied") + " (EACCES)";
          }
          reject(new Error(`${i18next2.t("error.failedToExecuteYtdlp")}: ${detail}`));
        });
        proc.on("close", async (code) => {
          runningProcs.delete(proc);
          if (cancelledProcs.has(proc)) {
            const err = new Error("ECANCELED");
            err.code = "ECANCELED";
            reject(err);
            return;
          }
          if (code === 0) {
            resolve(stdout);
          } else {
            if (targetUrl) {
              try {
                const recoveryResult = await siteAdapters.handleExecFailure({
                  code,
                  stderr,
                  args,
                  onProgress,
                  onOutput,
                  execYtDlp,
                  getSiteArgsForUrl: siteAdapters.getSiteArgs,
                  url: targetUrl
                });
                if (recoveryResult !== null) {
                  resolve(recoveryResult);
                  return;
                }
              } catch (recoveryErr) {
              }
            }
            reject(
              new Error(`${i18next2.t("error.ytdlpExitedWithCode")} ${code}: ${stderr}`)
            );
          }
        });
      });
    }
    async function downloadFile(url, outputPath, onProgress, maxRedirects = 5) {
      const dir = path.dirname(outputPath);
      if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
      return new Promise((resolve, reject) => {
        (async () => {
          let req;
          try {
            req = await secureHttpsGet(url, {
              headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
              }
            }, (res) => {
              if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                if (maxRedirects <= 0)
                  return reject(new Error("Too many redirects"));
                let redirectUrl = res.headers.location;
                if (redirectUrl.startsWith("/")) {
                  const u = new URL(url);
                  redirectUrl = `${u.protocol}//${u.host}${redirectUrl}`;
                }
                res.resume();
                downloadFile(redirectUrl, outputPath, onProgress, maxRedirects - 1).then(resolve).catch(reject);
                return;
              }
              if (res.statusCode < 200 || res.statusCode >= 400) {
                return reject(new Error(`HTTP ${res.statusCode}`));
              }
              const contentLength = parseInt(res.headers["content-length"] || "0", 10);
              const fileStream = fs.createWriteStream(outputPath);
              let received = 0;
              res.on("data", (chunk) => {
                received += chunk.length;
                if (onProgress && contentLength > 0) {
                  onProgress({ percent: Math.round(received / contentLength * 100) });
                }
              });
              res.pipe(fileStream);
              fileStream.on("finish", () => {
                fileStream.close();
                if (onProgress)
                  onProgress({ percent: 100 });
                resolve(outputPath);
              });
              fileStream.on("error", reject);
            });
          } catch (e) {
            return reject(e);
          }
          req.on("error", reject);
          req.setTimeout(3e4, () => {
            req.destroy();
            reject(new Error("Download timeout"));
          });
        })();
      });
    }
    async function getVideoInfo(url) {
      await validateUrl(url);
      url = siteAdapters.normalizeUrl(url);
      await validateUrl(url);
      const customInfo = await siteAdapters.customGetInfo(url, {
        execYtDlp,
        parseYtDlpOutput,
        getSiteArgsForUrl: siteAdapters.getSiteArgs
      });
      if (customInfo) {
        return customInfo;
      }
      const args = ["--dump-json", "--no-warnings", ...siteAdapters.getSiteArgs(url), url];
      const output = await execYtDlp(args, null, null, { targetUrl: url });
      return parseYtDlpOutput(output, url);
    }
    function parseYtDlpOutput(output, fallbackUrl) {
      const lines = output.trim().split("\n").filter(Boolean);
      let info = {};
      for (const line of lines) {
        try {
          const parsed = JSON.parse(line);
          if (parsed._type === "video" || parsed.title || parsed.playlist_title) {
            info = parsed;
            if (parsed.title)
              break;
          } else if (!info.id) {
            info = parsed;
          }
        } catch (e) {
        }
      }
      return {
        title: info.title || info.playlist_title || i18next2.t("error.untitledVideo"),
        description: info.description || "",
        duration: info.duration || 0,
        thumbnail: info.thumbnail || null,
        uploader: info.uploader || info.channel || info.playlist_uploader || i18next2.t("error.unknown"),
        extractor: info.extractor || i18next2.t("error.unknown"),
        webpage_url: info.webpage_url || fallbackUrl,
        id: info.id || null
      };
    }
    function sanitizeFilename(filename) {
      let str = typeof filename === "string" && filename.trim().length > 0 ? filename : "";
      if (!str) {
        try {
          if (typeof i18next2 !== "undefined" && typeof i18next2.t === "function") {
            const res = i18next2.t("error.untitledVideo");
            if (typeof res === "string" && res.length > 0)
              str = res;
          }
        } catch (e) {
        }
      }
      if (!str || typeof str !== "string") {
        str = "Untitled Video";
      }
      return str.replace(/[<>:"/\\|?*]/g, "_").replace(/\s+/g, " ").trim().slice(0, 200) || "Untitled Video";
    }
    function detectImageExtension(filePath) {
      try {
        const fd = fs.openSync(filePath, "r");
        const buffer = Buffer.alloc(16);
        const read = fs.readSync(fd, buffer, 0, 16, 0);
        fs.closeSync(fd);
        if (read < 12)
          return null;
        if (buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255)
          return ".jpg";
        if (buffer[0] === 137 && buffer.toString("ascii", 1, 4) === "PNG")
          return ".png";
        if (buffer.toString("ascii", 0, 3) === "GIF")
          return ".gif";
        if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP")
          return ".webp";
        if (buffer.toString("ascii", 4, 8) === "ftyp") {
          const brand = buffer.toString("ascii", 8, 12).toLowerCase();
          if (["heic", "heix", "hevc", "hevx", "mif1", "msf1", "heif"].includes(brand))
            return ".heic";
          if (brand === "avif" || brand === "avis")
            return ".avif";
        }
        return null;
      } catch (e) {
        return null;
      }
    }
    function getTempDir() {
      const tempDir = path.join(os.tmpdir(), "eagle-video-downloader");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }
      return tempDir;
    }
    async function downloadVideo(url, onProgress, onStatus, preloadedInfo = null) {
      await validateUrl(url);
      let videoInfo;
      if (preloadedInfo) {
        videoInfo = preloadedInfo;
      } else {
        if (onStatus)
          onStatus(i18next2.t("download.fetchingInfo"));
        try {
          videoInfo = await getVideoInfo(url);
          if (onStatus && videoInfo && videoInfo.title) {
            const foundMsg = typeof i18next2 !== "undefined" && i18next2.t ? i18next2.t("download.foundVideo") : "Found Video";
            onStatus(`${foundMsg}: ${videoInfo.title}`);
          }
        } catch (error) {
          videoInfo = {
            title: typeof i18next2 !== "undefined" && i18next2.t ? i18next2.t("error.untitledVideo") : "Untitled Video",
            extractor: typeof i18next2 !== "undefined" && i18next2.t ? i18next2.t("error.unknown") : "Unknown"
          };
        }
      }
      const images = videoInfo ? Array.isArray(videoInfo.images) && videoInfo.images.length ? videoInfo.images : videoInfo.type === "image" && videoInfo.imageUrl ? [videoInfo.imageUrl] : [] : [];
      if (images.length) {
        const outputDir2 = getTempDir();
        const sanitizedTitle2 = sanitizeFilename(videoInfo.title);
        const imageDirect = videoInfo.imageDirect === true;
        if (onStatus)
          onStatus(i18next2.t("ui.downloading"));
        const results = [];
        for (let index = 0; index < images.length; index++) {
          const entry = images[index];
          const imageUrl = typeof entry === "string" ? entry : entry && entry.url;
          if (typeof imageUrl !== "string" || !/^https:\/\//i.test(imageUrl)) {
            throw new Error(i18next2.t("error.invalidUrl"));
          }
          await validateUrl(imageUrl);
          const fallbacks = entry && typeof entry === "object" && Array.isArray(entry.fallbacks) ? entry.fallbacks.filter((item) => typeof item === "string" && /^https:\/\//i.test(item)) : [];
          const urlPath = new URL(imageUrl).pathname;
          const ext = path.extname(urlPath) || ".jpg";
          const suffix = images.length > 1 ? "_" + (index + 1) : "";
          const filename = sanitizedTitle2 + suffix + ext;
          const outputPath = path.join(outputDir2, filename);
          const imageProgress = images.length > 1 ? void 0 : onProgress;
          let lastError = null;
          let downloaded = false;
          const candidates = [imageUrl, ...fallbacks];
          for (let candidateIndex = 0; candidateIndex < candidates.length && !downloaded; candidateIndex++) {
            const candidate = candidates[candidateIndex];
            try {
              if (fs.existsSync(outputPath))
                fs.unlinkSync(outputPath);
            } catch (e) {
            }
            try {
              await validateUrl(candidate);
              if (candidateIndex === 0 && !imageDirect) {
                try {
                  await execYtDlp([candidate, "-o", outputPath, "--no-warnings"], imageProgress, null, false);
                } catch (e) {
                }
              }
              if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
                await downloadFile(candidate, outputPath, imageProgress);
              }
              downloaded = fs.existsSync(outputPath) && fs.statSync(outputPath).size > 0;
              if (!downloaded)
                throw new Error("image not written");
            } catch (e) {
              lastError = e;
              downloaded = false;
            }
            const detected2 = downloaded ? detectImageExtension(outputPath) : null;
            if (detected2 === ".heic" && candidateIndex < candidates.length - 1) {
              try {
                fs.unlinkSync(outputPath);
              } catch (e) {
              }
              downloaded = false;
            }
          }
          if (!downloaded) {
            throw lastError || new Error(i18next2.t("error.fileNotFound"));
          }
          let finalPath = outputPath;
          const detected = detectImageExtension(outputPath);
          if (detected && detected !== ext) {
            finalPath = outputPath.slice(0, outputPath.length - ext.length) + detected;
            try {
              fs.renameSync(outputPath, finalPath);
            } catch (e) {
              finalPath = outputPath;
            }
          }
          results.push({
            path: finalPath,
            metadata: videoInfo,
            filename: path.basename(finalPath),
            partIndex: images.length > 1 ? index + 1 : 0,
            partTotal: images.length > 1 ? images.length : 0
          });
        }
        return results;
      }
      const directVideos = videoInfo && Array.isArray(videoInfo.videoUrls) ? videoInfo.videoUrls.filter((item) => typeof item === "string" && item.startsWith("https://")) : [];
      if (directVideos.length >= 1) {
        const multiDir = getTempDir();
        const multiTitle = sanitizeFilename(videoInfo.title);
        if (onStatus)
          onStatus(i18next2.t("ui.downloading"));
        const multiResults = [];
        for (let index = 0; index < directVideos.length; index++) {
          const videoUrl = directVideos[index];
          await validateUrl(videoUrl);
          const filename = `${multiTitle}_${index + 1}.mp4`;
          const outputPath = path.join(multiDir, filename);
          await execYtDlp(
            [videoUrl, "-o", outputPath, "--no-warnings", "--merge-output-format", "mp4", "--http-chunk-size", "10M", "--retries", "10"],
            void 0,
            null,
            false
          );
          if (!fs.existsSync(outputPath))
            throw new Error(i18next2.t("error.fileNotFound"));
          multiResults.push({
            path: outputPath,
            metadata: videoInfo,
            filename,
            partIndex: directVideos.length > 1 ? index + 1 : 0,
            partTotal: directVideos.length > 1 ? directVideos.length : 0
          });
        }
        return multiResults;
      }
      const outputDir = getTempDir();
      const sanitizedTitle = sanitizeFilename(videoInfo.title);
      const titleOnly = videoInfo && videoInfo.useTitleAsFilename === true;
      const outputTemplate = path.join(
        outputDir,
        titleOnly ? `${sanitizedTitle}.%(ext)s` : `${sanitizedTitle}_%(autonumber)s.%(ext)s`
      );
      let targetUrl = videoInfo && typeof videoInfo.webpage_url === "string" && videoInfo.webpage_url.startsWith("https") ? videoInfo.webpage_url : url;
      targetUrl = siteAdapters.normalizeUrl(targetUrl);
      await validateUrl(targetUrl);
      if (videoInfo && videoInfo.derivedFrom === "pinterest") {
        siteAdapters.assertDerivedHostAllowed(targetUrl);
      }
      const formatSelector = buildFormatSelector(maxResolution, maxFramerate);
      const args = [
        targetUrl,
        "-o",
        outputTemplate,
        "-f",
        formatSelector,
        "--merge-output-format",
        "mp4",
        "--no-warnings",
        // 直链大文件按 10MB 分块并发拉取：单连接被 CDN 限速时可显著提速
        "--http-chunk-size",
        "10M",
        // 网络抖动时的重试余量，避免一次超时就判定失败
        "--retries",
        "10",
        "--fragment-retries",
        "10",
        ...siteAdapters.getSiteArgs(targetUrl)
      ];
      if (threadCount > 0) {
        args.push("-N", String(threadCount));
      }
      const ffmpeg = getFfmpegPath();
      if (ffmpeg && fs.existsSync(ffmpeg)) {
        args.push("--ffmpeg-location", path.dirname(ffmpeg));
      }
      if (onStatus)
        onStatus(i18next2.t("ui.downloading"));
      const filesBefore = new Set(fs.existsSync(outputDir) ? fs.readdirSync(outputDir) : []);
      let processingPhase = null;
      let processingWatcher = null;
      let pendingOutput = "";
      const handleOutput = (chunk) => {
        const text = pendingOutput + String(chunk || "");
        pendingOutput = text.slice(-32);
        let next = null;
        if (/\[Merger\]|Merging formats/i.test(text)) {
          next = "merge";
        } else if (/\[VideoConvertor\]|Converting video|\[Fixup/i.test(text)) {
          next = "convert";
        }
        if (next && next !== processingPhase) {
          processingPhase = next;
          if (onProgress)
            onProgress({ phase: next });
          if (!processingWatcher) {
            processingWatcher = startProcessingWatcher(outputDir, sanitizedTitle, onProgress);
          }
        }
      };
      try {
        await execYtDlp(args, onProgress, handleOutput, { targetUrl });
      } catch (error) {
        const message = String(error && error.message || "");
        const recoverable = /Postprocessing|Invalid data found|Error opening input/i.test(message);
        if (!recoverable)
          throw error;
        const retryArgs = args.slice();
        const mergeIndex = retryArgs.indexOf("--merge-output-format");
        if (mergeIndex >= 0)
          retryArgs.splice(mergeIndex, 2);
        const formatIndex = retryArgs.indexOf("-f");
        if (formatIndex >= 0)
          retryArgs[formatIndex + 1] = "b/best";
        await execYtDlp(retryArgs, onProgress, handleOutput, { targetUrl });
      } finally {
        if (processingWatcher)
          processingWatcher.stop();
      }
      const filesAfter = fs.readdirSync(outputDir);
      const newFiles = filesAfter.filter((f) => !filesBefore.has(f) && f.startsWith(sanitizedTitle));
      if (newFiles.length === 0) {
        throw new Error(i18next2.t("error.fileNotFound"));
      }
      return newFiles.map((filename, index) => ({
        path: path.join(outputDir, filename),
        metadata: videoInfo,
        filename,
        partIndex: newFiles.length > 1 ? index + 1 : 0,
        partTotal: newFiles.length > 1 ? newFiles.length : 0
      }));
    }
    function cleanup(filePath) {
      try {
        if (filePath && fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      } catch (error) {
      }
    }
    module2.exports = {
      downloadVideo,
      getVideoInfo,
      cleanup,
      cancelAll,
      setQualityPrefs,
      setThreadCount,
      buildFormatSelector
    };
  }
});

// js/twitter-auth.js
var require_twitter_auth = __commonJS({
  "js/twitter-auth.js"(exports2, module2) {
    var { scopedKey } = require_library_context();
    var STORAGE_KEY = "Edge-Media-Download-NEW.twitterAuth";
    var PUBLIC_BEARER = "AAAAAAAAAAAAAAAAAAAAANRILgAAAAAAnNwIzUejRCOuH5E6I8xnZz4puTs%3D1Zv7ttfk8LF81IUq16cHjhLTvJu4FA33AGWWjCpTnA";
    function currentKey() {
      return scopedKey(STORAGE_KEY);
    }
    function migrateLegacyKey(key) {
      try {
        if (key === STORAGE_KEY)
          return;
        if (localStorage.getItem(key) === null) {
          const legacy = localStorage.getItem(STORAGE_KEY);
          if (legacy !== null)
            localStorage.setItem(key, legacy);
        }
      } catch (e) {
      }
    }
    function getStoredCookie() {
      try {
        const key = currentKey();
        migrateLegacyKey(key);
        return localStorage.getItem(key) || "";
      } catch (e) {
        return "";
      }
    }
    function setStoredCookie(value) {
      try {
        const key = currentKey();
        if (value) {
          localStorage.setItem(key, value);
        } else {
          localStorage.removeItem(key);
        }
      } catch (e) {
      }
    }
    function buildCookie(authToken, ct0) {
      const token = String(authToken || "").trim();
      const csrf = String(ct0 || "").trim();
      if (!token || !csrf)
        return "";
      return `auth_token=${token}; ct0=${csrf}`;
    }
    function splitCookie(raw) {
      const text = raw === void 0 ? getStoredCookie() : String(raw || "");
      const map = {};
      text.split(/;\s*/).forEach((pair) => {
        const index = pair.indexOf("=");
        if (index <= 0)
          return;
        const key = pair.slice(0, index).trim();
        const value = pair.slice(index + 1).trim().replace(/^"|"$/g, "");
        if (key && value)
          map[key] = value;
      });
      return { authToken: map.auth_token || "", ct0: map.ct0 || "", map };
    }
    function hasAuth(raw) {
      const parts = splitCookie(raw);
      return !!(parts.authToken && parts.ct0);
    }
    function getAuth(raw) {
      const parts = splitCookie(raw);
      if (!parts.authToken || !parts.ct0)
        return null;
      const cookie = `auth_token=${parts.authToken}; ct0=${parts.ct0}`;
      return {
        cookie,
        csrf: parts.ct0,
        headers: {
          cookie,
          authorization: "Bearer " + PUBLIC_BEARER,
          "x-csrf-token": parts.ct0,
          "x-twitter-auth-type": "OAuth2Session",
          "x-twitter-active-user": "yes",
          "x-twitter-client-language": "en",
          "content-type": "application/json",
          "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
          accept: "application/json",
          referer: "https://x.com/"
        }
      };
    }
    module2.exports = {
      getStoredCookie,
      setStoredCookie,
      buildCookie,
      splitCookie,
      hasAuth,
      getAuth
    };
  }
});

// js/thrift.js
var require_thrift = __commonJS({
  "js/thrift.js"(exports2, module2) {
    var Reader = class {
      constructor(data) {
        this.data = data;
        this.offset = 0;
      }
      take(count) {
        if (this.offset + count > this.data.length)
          throw new Error("thrift truncated");
        const chunk = this.data.slice(this.offset, this.offset + count);
        this.offset += count;
        return chunk;
      }
      int(size) {
        const raw = this.take(size);
        let value = 0;
        for (let index = 0; index < raw.length; index++)
          value = value * 256 + raw[index];
        if (raw[0] & 128)
          value -= Math.pow(256, size);
        return value;
      }
      value(kind) {
        if (kind === 2)
          return this.take(1)[0] !== 0;
        if (kind === 3)
          return this.int(1);
        if (kind === 4)
          return this.take(8);
        if (kind === 6)
          return this.int(2);
        if (kind === 8)
          return this.int(4);
        if (kind === 10)
          return this.int(8);
        if (kind === 11)
          return this.take(this.int(4));
        if (kind === 12)
          return this.struct();
        if (kind === 13) {
          const keyKind = this.int(1);
          const valueKind = this.int(1);
          const size = this.int(4);
          const map = [];
          for (let index = 0; index < size; index++)
            map.push([this.value(keyKind), this.value(valueKind)]);
          return map;
        }
        if (kind === 14 || kind === 15) {
          const elementKind = this.int(1);
          const size = this.int(4);
          const list = [];
          for (let index = 0; index < size; index++)
            list.push(this.value(elementKind));
          return list;
        }
        throw new Error("thrift unknown type " + kind);
      }
      struct() {
        const fields = {};
        while (true) {
          const kind = this.int(1);
          if (kind === 0)
            return fields;
          const fieldId = this.int(2);
          fields[fieldId] = this.value(kind);
        }
      }
    };
    function decode(base64) {
      return new Reader(Buffer.from(base64, "base64")).struct();
    }
    function text(value) {
      return Buffer.isBuffer(value) ? value.toString("utf8") : null;
    }
    module2.exports = { Reader, decode, text };
  }
});

// node_modules/tweetnacl/nacl-fast.js
var require_nacl_fast = __commonJS({
  "node_modules/tweetnacl/nacl-fast.js"(exports2, module2) {
    (function(nacl) {
      "use strict";
      var gf = function(init) {
        var i, r = new Float64Array(16);
        if (init)
          for (i = 0; i < init.length; i++)
            r[i] = init[i];
        return r;
      };
      var randombytes = function() {
        throw new Error("no PRNG");
      };
      var _0 = new Uint8Array(16);
      var _9 = new Uint8Array(32);
      _9[0] = 9;
      var gf0 = gf(), gf1 = gf([1]), _121665 = gf([56129, 1]), D = gf([30883, 4953, 19914, 30187, 55467, 16705, 2637, 112, 59544, 30585, 16505, 36039, 65139, 11119, 27886, 20995]), D2 = gf([61785, 9906, 39828, 60374, 45398, 33411, 5274, 224, 53552, 61171, 33010, 6542, 64743, 22239, 55772, 9222]), X = gf([54554, 36645, 11616, 51542, 42930, 38181, 51040, 26924, 56412, 64982, 57905, 49316, 21502, 52590, 14035, 8553]), Y = gf([26200, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214, 26214]), I = gf([41136, 18958, 6951, 50414, 58488, 44335, 6150, 12099, 55207, 15867, 153, 11085, 57099, 20417, 9344, 11139]);
      function ts64(x, i, h, l) {
        x[i] = h >> 24 & 255;
        x[i + 1] = h >> 16 & 255;
        x[i + 2] = h >> 8 & 255;
        x[i + 3] = h & 255;
        x[i + 4] = l >> 24 & 255;
        x[i + 5] = l >> 16 & 255;
        x[i + 6] = l >> 8 & 255;
        x[i + 7] = l & 255;
      }
      function vn(x, xi, y, yi, n) {
        var i, d = 0;
        for (i = 0; i < n; i++)
          d |= x[xi + i] ^ y[yi + i];
        return (1 & d - 1 >>> 8) - 1;
      }
      function crypto_verify_16(x, xi, y, yi) {
        return vn(x, xi, y, yi, 16);
      }
      function crypto_verify_32(x, xi, y, yi) {
        return vn(x, xi, y, yi, 32);
      }
      function core_salsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        x0 = x0 + j0 | 0;
        x1 = x1 + j1 | 0;
        x2 = x2 + j2 | 0;
        x3 = x3 + j3 | 0;
        x4 = x4 + j4 | 0;
        x5 = x5 + j5 | 0;
        x6 = x6 + j6 | 0;
        x7 = x7 + j7 | 0;
        x8 = x8 + j8 | 0;
        x9 = x9 + j9 | 0;
        x10 = x10 + j10 | 0;
        x11 = x11 + j11 | 0;
        x12 = x12 + j12 | 0;
        x13 = x13 + j13 | 0;
        x14 = x14 + j14 | 0;
        x15 = x15 + j15 | 0;
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x1 >>> 0 & 255;
        o[5] = x1 >>> 8 & 255;
        o[6] = x1 >>> 16 & 255;
        o[7] = x1 >>> 24 & 255;
        o[8] = x2 >>> 0 & 255;
        o[9] = x2 >>> 8 & 255;
        o[10] = x2 >>> 16 & 255;
        o[11] = x2 >>> 24 & 255;
        o[12] = x3 >>> 0 & 255;
        o[13] = x3 >>> 8 & 255;
        o[14] = x3 >>> 16 & 255;
        o[15] = x3 >>> 24 & 255;
        o[16] = x4 >>> 0 & 255;
        o[17] = x4 >>> 8 & 255;
        o[18] = x4 >>> 16 & 255;
        o[19] = x4 >>> 24 & 255;
        o[20] = x5 >>> 0 & 255;
        o[21] = x5 >>> 8 & 255;
        o[22] = x5 >>> 16 & 255;
        o[23] = x5 >>> 24 & 255;
        o[24] = x6 >>> 0 & 255;
        o[25] = x6 >>> 8 & 255;
        o[26] = x6 >>> 16 & 255;
        o[27] = x6 >>> 24 & 255;
        o[28] = x7 >>> 0 & 255;
        o[29] = x7 >>> 8 & 255;
        o[30] = x7 >>> 16 & 255;
        o[31] = x7 >>> 24 & 255;
        o[32] = x8 >>> 0 & 255;
        o[33] = x8 >>> 8 & 255;
        o[34] = x8 >>> 16 & 255;
        o[35] = x8 >>> 24 & 255;
        o[36] = x9 >>> 0 & 255;
        o[37] = x9 >>> 8 & 255;
        o[38] = x9 >>> 16 & 255;
        o[39] = x9 >>> 24 & 255;
        o[40] = x10 >>> 0 & 255;
        o[41] = x10 >>> 8 & 255;
        o[42] = x10 >>> 16 & 255;
        o[43] = x10 >>> 24 & 255;
        o[44] = x11 >>> 0 & 255;
        o[45] = x11 >>> 8 & 255;
        o[46] = x11 >>> 16 & 255;
        o[47] = x11 >>> 24 & 255;
        o[48] = x12 >>> 0 & 255;
        o[49] = x12 >>> 8 & 255;
        o[50] = x12 >>> 16 & 255;
        o[51] = x12 >>> 24 & 255;
        o[52] = x13 >>> 0 & 255;
        o[53] = x13 >>> 8 & 255;
        o[54] = x13 >>> 16 & 255;
        o[55] = x13 >>> 24 & 255;
        o[56] = x14 >>> 0 & 255;
        o[57] = x14 >>> 8 & 255;
        o[58] = x14 >>> 16 & 255;
        o[59] = x14 >>> 24 & 255;
        o[60] = x15 >>> 0 & 255;
        o[61] = x15 >>> 8 & 255;
        o[62] = x15 >>> 16 & 255;
        o[63] = x15 >>> 24 & 255;
      }
      function core_hsalsa20(o, p, k, c) {
        var j0 = c[0] & 255 | (c[1] & 255) << 8 | (c[2] & 255) << 16 | (c[3] & 255) << 24, j1 = k[0] & 255 | (k[1] & 255) << 8 | (k[2] & 255) << 16 | (k[3] & 255) << 24, j2 = k[4] & 255 | (k[5] & 255) << 8 | (k[6] & 255) << 16 | (k[7] & 255) << 24, j3 = k[8] & 255 | (k[9] & 255) << 8 | (k[10] & 255) << 16 | (k[11] & 255) << 24, j4 = k[12] & 255 | (k[13] & 255) << 8 | (k[14] & 255) << 16 | (k[15] & 255) << 24, j5 = c[4] & 255 | (c[5] & 255) << 8 | (c[6] & 255) << 16 | (c[7] & 255) << 24, j6 = p[0] & 255 | (p[1] & 255) << 8 | (p[2] & 255) << 16 | (p[3] & 255) << 24, j7 = p[4] & 255 | (p[5] & 255) << 8 | (p[6] & 255) << 16 | (p[7] & 255) << 24, j8 = p[8] & 255 | (p[9] & 255) << 8 | (p[10] & 255) << 16 | (p[11] & 255) << 24, j9 = p[12] & 255 | (p[13] & 255) << 8 | (p[14] & 255) << 16 | (p[15] & 255) << 24, j10 = c[8] & 255 | (c[9] & 255) << 8 | (c[10] & 255) << 16 | (c[11] & 255) << 24, j11 = k[16] & 255 | (k[17] & 255) << 8 | (k[18] & 255) << 16 | (k[19] & 255) << 24, j12 = k[20] & 255 | (k[21] & 255) << 8 | (k[22] & 255) << 16 | (k[23] & 255) << 24, j13 = k[24] & 255 | (k[25] & 255) << 8 | (k[26] & 255) << 16 | (k[27] & 255) << 24, j14 = k[28] & 255 | (k[29] & 255) << 8 | (k[30] & 255) << 16 | (k[31] & 255) << 24, j15 = c[12] & 255 | (c[13] & 255) << 8 | (c[14] & 255) << 16 | (c[15] & 255) << 24;
        var x0 = j0, x1 = j1, x2 = j2, x3 = j3, x4 = j4, x5 = j5, x6 = j6, x7 = j7, x8 = j8, x9 = j9, x10 = j10, x11 = j11, x12 = j12, x13 = j13, x14 = j14, x15 = j15, u;
        for (var i = 0; i < 20; i += 2) {
          u = x0 + x12 | 0;
          x4 ^= u << 7 | u >>> 32 - 7;
          u = x4 + x0 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x4 | 0;
          x12 ^= u << 13 | u >>> 32 - 13;
          u = x12 + x8 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x1 | 0;
          x9 ^= u << 7 | u >>> 32 - 7;
          u = x9 + x5 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x9 | 0;
          x1 ^= u << 13 | u >>> 32 - 13;
          u = x1 + x13 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x6 | 0;
          x14 ^= u << 7 | u >>> 32 - 7;
          u = x14 + x10 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x14 | 0;
          x6 ^= u << 13 | u >>> 32 - 13;
          u = x6 + x2 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x11 | 0;
          x3 ^= u << 7 | u >>> 32 - 7;
          u = x3 + x15 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x3 | 0;
          x11 ^= u << 13 | u >>> 32 - 13;
          u = x11 + x7 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
          u = x0 + x3 | 0;
          x1 ^= u << 7 | u >>> 32 - 7;
          u = x1 + x0 | 0;
          x2 ^= u << 9 | u >>> 32 - 9;
          u = x2 + x1 | 0;
          x3 ^= u << 13 | u >>> 32 - 13;
          u = x3 + x2 | 0;
          x0 ^= u << 18 | u >>> 32 - 18;
          u = x5 + x4 | 0;
          x6 ^= u << 7 | u >>> 32 - 7;
          u = x6 + x5 | 0;
          x7 ^= u << 9 | u >>> 32 - 9;
          u = x7 + x6 | 0;
          x4 ^= u << 13 | u >>> 32 - 13;
          u = x4 + x7 | 0;
          x5 ^= u << 18 | u >>> 32 - 18;
          u = x10 + x9 | 0;
          x11 ^= u << 7 | u >>> 32 - 7;
          u = x11 + x10 | 0;
          x8 ^= u << 9 | u >>> 32 - 9;
          u = x8 + x11 | 0;
          x9 ^= u << 13 | u >>> 32 - 13;
          u = x9 + x8 | 0;
          x10 ^= u << 18 | u >>> 32 - 18;
          u = x15 + x14 | 0;
          x12 ^= u << 7 | u >>> 32 - 7;
          u = x12 + x15 | 0;
          x13 ^= u << 9 | u >>> 32 - 9;
          u = x13 + x12 | 0;
          x14 ^= u << 13 | u >>> 32 - 13;
          u = x14 + x13 | 0;
          x15 ^= u << 18 | u >>> 32 - 18;
        }
        o[0] = x0 >>> 0 & 255;
        o[1] = x0 >>> 8 & 255;
        o[2] = x0 >>> 16 & 255;
        o[3] = x0 >>> 24 & 255;
        o[4] = x5 >>> 0 & 255;
        o[5] = x5 >>> 8 & 255;
        o[6] = x5 >>> 16 & 255;
        o[7] = x5 >>> 24 & 255;
        o[8] = x10 >>> 0 & 255;
        o[9] = x10 >>> 8 & 255;
        o[10] = x10 >>> 16 & 255;
        o[11] = x10 >>> 24 & 255;
        o[12] = x15 >>> 0 & 255;
        o[13] = x15 >>> 8 & 255;
        o[14] = x15 >>> 16 & 255;
        o[15] = x15 >>> 24 & 255;
        o[16] = x6 >>> 0 & 255;
        o[17] = x6 >>> 8 & 255;
        o[18] = x6 >>> 16 & 255;
        o[19] = x6 >>> 24 & 255;
        o[20] = x7 >>> 0 & 255;
        o[21] = x7 >>> 8 & 255;
        o[22] = x7 >>> 16 & 255;
        o[23] = x7 >>> 24 & 255;
        o[24] = x8 >>> 0 & 255;
        o[25] = x8 >>> 8 & 255;
        o[26] = x8 >>> 16 & 255;
        o[27] = x8 >>> 24 & 255;
        o[28] = x9 >>> 0 & 255;
        o[29] = x9 >>> 8 & 255;
        o[30] = x9 >>> 16 & 255;
        o[31] = x9 >>> 24 & 255;
      }
      function crypto_core_salsa20(out, inp, k, c) {
        core_salsa20(out, inp, k, c);
      }
      function crypto_core_hsalsa20(out, inp, k, c) {
        core_hsalsa20(out, inp, k, c);
      }
      var sigma = new Uint8Array([101, 120, 112, 97, 110, 100, 32, 51, 50, 45, 98, 121, 116, 101, 32, 107]);
      function crypto_stream_salsa20_xor(c, cpos, m, mpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++)
          z[i] = 0;
        for (i = 0; i < 8; i++)
          z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++)
            c[cpos + i] = m[mpos + i] ^ x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
          mpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++)
            c[cpos + i] = m[mpos + i] ^ x[i];
        }
        return 0;
      }
      function crypto_stream_salsa20(c, cpos, b, n, k) {
        var z = new Uint8Array(16), x = new Uint8Array(64);
        var u, i;
        for (i = 0; i < 16; i++)
          z[i] = 0;
        for (i = 0; i < 8; i++)
          z[i] = n[i];
        while (b >= 64) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < 64; i++)
            c[cpos + i] = x[i];
          u = 1;
          for (i = 8; i < 16; i++) {
            u = u + (z[i] & 255) | 0;
            z[i] = u & 255;
            u >>>= 8;
          }
          b -= 64;
          cpos += 64;
        }
        if (b > 0) {
          crypto_core_salsa20(x, z, k, sigma);
          for (i = 0; i < b; i++)
            c[cpos + i] = x[i];
        }
        return 0;
      }
      function crypto_stream(c, cpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++)
          sn[i] = n[i + 16];
        return crypto_stream_salsa20(c, cpos, d, sn, s);
      }
      function crypto_stream_xor(c, cpos, m, mpos, d, n, k) {
        var s = new Uint8Array(32);
        crypto_core_hsalsa20(s, n, k, sigma);
        var sn = new Uint8Array(8);
        for (var i = 0; i < 8; i++)
          sn[i] = n[i + 16];
        return crypto_stream_salsa20_xor(c, cpos, m, mpos, d, sn, s);
      }
      var poly1305 = function(key) {
        this.buffer = new Uint8Array(16);
        this.r = new Uint16Array(10);
        this.h = new Uint16Array(10);
        this.pad = new Uint16Array(8);
        this.leftover = 0;
        this.fin = 0;
        var t0, t1, t2, t3, t4, t5, t6, t7;
        t0 = key[0] & 255 | (key[1] & 255) << 8;
        this.r[0] = t0 & 8191;
        t1 = key[2] & 255 | (key[3] & 255) << 8;
        this.r[1] = (t0 >>> 13 | t1 << 3) & 8191;
        t2 = key[4] & 255 | (key[5] & 255) << 8;
        this.r[2] = (t1 >>> 10 | t2 << 6) & 7939;
        t3 = key[6] & 255 | (key[7] & 255) << 8;
        this.r[3] = (t2 >>> 7 | t3 << 9) & 8191;
        t4 = key[8] & 255 | (key[9] & 255) << 8;
        this.r[4] = (t3 >>> 4 | t4 << 12) & 255;
        this.r[5] = t4 >>> 1 & 8190;
        t5 = key[10] & 255 | (key[11] & 255) << 8;
        this.r[6] = (t4 >>> 14 | t5 << 2) & 8191;
        t6 = key[12] & 255 | (key[13] & 255) << 8;
        this.r[7] = (t5 >>> 11 | t6 << 5) & 8065;
        t7 = key[14] & 255 | (key[15] & 255) << 8;
        this.r[8] = (t6 >>> 8 | t7 << 8) & 8191;
        this.r[9] = t7 >>> 5 & 127;
        this.pad[0] = key[16] & 255 | (key[17] & 255) << 8;
        this.pad[1] = key[18] & 255 | (key[19] & 255) << 8;
        this.pad[2] = key[20] & 255 | (key[21] & 255) << 8;
        this.pad[3] = key[22] & 255 | (key[23] & 255) << 8;
        this.pad[4] = key[24] & 255 | (key[25] & 255) << 8;
        this.pad[5] = key[26] & 255 | (key[27] & 255) << 8;
        this.pad[6] = key[28] & 255 | (key[29] & 255) << 8;
        this.pad[7] = key[30] & 255 | (key[31] & 255) << 8;
      };
      poly1305.prototype.blocks = function(m, mpos, bytes) {
        var hibit = this.fin ? 0 : 1 << 11;
        var t0, t1, t2, t3, t4, t5, t6, t7, c;
        var d0, d1, d2, d3, d4, d5, d6, d7, d8, d9;
        var h0 = this.h[0], h1 = this.h[1], h2 = this.h[2], h3 = this.h[3], h4 = this.h[4], h5 = this.h[5], h6 = this.h[6], h7 = this.h[7], h8 = this.h[8], h9 = this.h[9];
        var r0 = this.r[0], r1 = this.r[1], r2 = this.r[2], r3 = this.r[3], r4 = this.r[4], r5 = this.r[5], r6 = this.r[6], r7 = this.r[7], r8 = this.r[8], r9 = this.r[9];
        while (bytes >= 16) {
          t0 = m[mpos + 0] & 255 | (m[mpos + 1] & 255) << 8;
          h0 += t0 & 8191;
          t1 = m[mpos + 2] & 255 | (m[mpos + 3] & 255) << 8;
          h1 += (t0 >>> 13 | t1 << 3) & 8191;
          t2 = m[mpos + 4] & 255 | (m[mpos + 5] & 255) << 8;
          h2 += (t1 >>> 10 | t2 << 6) & 8191;
          t3 = m[mpos + 6] & 255 | (m[mpos + 7] & 255) << 8;
          h3 += (t2 >>> 7 | t3 << 9) & 8191;
          t4 = m[mpos + 8] & 255 | (m[mpos + 9] & 255) << 8;
          h4 += (t3 >>> 4 | t4 << 12) & 8191;
          h5 += t4 >>> 1 & 8191;
          t5 = m[mpos + 10] & 255 | (m[mpos + 11] & 255) << 8;
          h6 += (t4 >>> 14 | t5 << 2) & 8191;
          t6 = m[mpos + 12] & 255 | (m[mpos + 13] & 255) << 8;
          h7 += (t5 >>> 11 | t6 << 5) & 8191;
          t7 = m[mpos + 14] & 255 | (m[mpos + 15] & 255) << 8;
          h8 += (t6 >>> 8 | t7 << 8) & 8191;
          h9 += t7 >>> 5 | hibit;
          c = 0;
          d0 = c;
          d0 += h0 * r0;
          d0 += h1 * (5 * r9);
          d0 += h2 * (5 * r8);
          d0 += h3 * (5 * r7);
          d0 += h4 * (5 * r6);
          c = d0 >>> 13;
          d0 &= 8191;
          d0 += h5 * (5 * r5);
          d0 += h6 * (5 * r4);
          d0 += h7 * (5 * r3);
          d0 += h8 * (5 * r2);
          d0 += h9 * (5 * r1);
          c += d0 >>> 13;
          d0 &= 8191;
          d1 = c;
          d1 += h0 * r1;
          d1 += h1 * r0;
          d1 += h2 * (5 * r9);
          d1 += h3 * (5 * r8);
          d1 += h4 * (5 * r7);
          c = d1 >>> 13;
          d1 &= 8191;
          d1 += h5 * (5 * r6);
          d1 += h6 * (5 * r5);
          d1 += h7 * (5 * r4);
          d1 += h8 * (5 * r3);
          d1 += h9 * (5 * r2);
          c += d1 >>> 13;
          d1 &= 8191;
          d2 = c;
          d2 += h0 * r2;
          d2 += h1 * r1;
          d2 += h2 * r0;
          d2 += h3 * (5 * r9);
          d2 += h4 * (5 * r8);
          c = d2 >>> 13;
          d2 &= 8191;
          d2 += h5 * (5 * r7);
          d2 += h6 * (5 * r6);
          d2 += h7 * (5 * r5);
          d2 += h8 * (5 * r4);
          d2 += h9 * (5 * r3);
          c += d2 >>> 13;
          d2 &= 8191;
          d3 = c;
          d3 += h0 * r3;
          d3 += h1 * r2;
          d3 += h2 * r1;
          d3 += h3 * r0;
          d3 += h4 * (5 * r9);
          c = d3 >>> 13;
          d3 &= 8191;
          d3 += h5 * (5 * r8);
          d3 += h6 * (5 * r7);
          d3 += h7 * (5 * r6);
          d3 += h8 * (5 * r5);
          d3 += h9 * (5 * r4);
          c += d3 >>> 13;
          d3 &= 8191;
          d4 = c;
          d4 += h0 * r4;
          d4 += h1 * r3;
          d4 += h2 * r2;
          d4 += h3 * r1;
          d4 += h4 * r0;
          c = d4 >>> 13;
          d4 &= 8191;
          d4 += h5 * (5 * r9);
          d4 += h6 * (5 * r8);
          d4 += h7 * (5 * r7);
          d4 += h8 * (5 * r6);
          d4 += h9 * (5 * r5);
          c += d4 >>> 13;
          d4 &= 8191;
          d5 = c;
          d5 += h0 * r5;
          d5 += h1 * r4;
          d5 += h2 * r3;
          d5 += h3 * r2;
          d5 += h4 * r1;
          c = d5 >>> 13;
          d5 &= 8191;
          d5 += h5 * r0;
          d5 += h6 * (5 * r9);
          d5 += h7 * (5 * r8);
          d5 += h8 * (5 * r7);
          d5 += h9 * (5 * r6);
          c += d5 >>> 13;
          d5 &= 8191;
          d6 = c;
          d6 += h0 * r6;
          d6 += h1 * r5;
          d6 += h2 * r4;
          d6 += h3 * r3;
          d6 += h4 * r2;
          c = d6 >>> 13;
          d6 &= 8191;
          d6 += h5 * r1;
          d6 += h6 * r0;
          d6 += h7 * (5 * r9);
          d6 += h8 * (5 * r8);
          d6 += h9 * (5 * r7);
          c += d6 >>> 13;
          d6 &= 8191;
          d7 = c;
          d7 += h0 * r7;
          d7 += h1 * r6;
          d7 += h2 * r5;
          d7 += h3 * r4;
          d7 += h4 * r3;
          c = d7 >>> 13;
          d7 &= 8191;
          d7 += h5 * r2;
          d7 += h6 * r1;
          d7 += h7 * r0;
          d7 += h8 * (5 * r9);
          d7 += h9 * (5 * r8);
          c += d7 >>> 13;
          d7 &= 8191;
          d8 = c;
          d8 += h0 * r8;
          d8 += h1 * r7;
          d8 += h2 * r6;
          d8 += h3 * r5;
          d8 += h4 * r4;
          c = d8 >>> 13;
          d8 &= 8191;
          d8 += h5 * r3;
          d8 += h6 * r2;
          d8 += h7 * r1;
          d8 += h8 * r0;
          d8 += h9 * (5 * r9);
          c += d8 >>> 13;
          d8 &= 8191;
          d9 = c;
          d9 += h0 * r9;
          d9 += h1 * r8;
          d9 += h2 * r7;
          d9 += h3 * r6;
          d9 += h4 * r5;
          c = d9 >>> 13;
          d9 &= 8191;
          d9 += h5 * r4;
          d9 += h6 * r3;
          d9 += h7 * r2;
          d9 += h8 * r1;
          d9 += h9 * r0;
          c += d9 >>> 13;
          d9 &= 8191;
          c = (c << 2) + c | 0;
          c = c + d0 | 0;
          d0 = c & 8191;
          c = c >>> 13;
          d1 += c;
          h0 = d0;
          h1 = d1;
          h2 = d2;
          h3 = d3;
          h4 = d4;
          h5 = d5;
          h6 = d6;
          h7 = d7;
          h8 = d8;
          h9 = d9;
          mpos += 16;
          bytes -= 16;
        }
        this.h[0] = h0;
        this.h[1] = h1;
        this.h[2] = h2;
        this.h[3] = h3;
        this.h[4] = h4;
        this.h[5] = h5;
        this.h[6] = h6;
        this.h[7] = h7;
        this.h[8] = h8;
        this.h[9] = h9;
      };
      poly1305.prototype.finish = function(mac, macpos) {
        var g = new Uint16Array(10);
        var c, mask, f, i;
        if (this.leftover) {
          i = this.leftover;
          this.buffer[i++] = 1;
          for (; i < 16; i++)
            this.buffer[i] = 0;
          this.fin = 1;
          this.blocks(this.buffer, 0, 16);
        }
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        for (i = 2; i < 10; i++) {
          this.h[i] += c;
          c = this.h[i] >>> 13;
          this.h[i] &= 8191;
        }
        this.h[0] += c * 5;
        c = this.h[0] >>> 13;
        this.h[0] &= 8191;
        this.h[1] += c;
        c = this.h[1] >>> 13;
        this.h[1] &= 8191;
        this.h[2] += c;
        g[0] = this.h[0] + 5;
        c = g[0] >>> 13;
        g[0] &= 8191;
        for (i = 1; i < 10; i++) {
          g[i] = this.h[i] + c;
          c = g[i] >>> 13;
          g[i] &= 8191;
        }
        g[9] -= 1 << 13;
        mask = (c ^ 1) - 1;
        for (i = 0; i < 10; i++)
          g[i] &= mask;
        mask = ~mask;
        for (i = 0; i < 10; i++)
          this.h[i] = this.h[i] & mask | g[i];
        this.h[0] = (this.h[0] | this.h[1] << 13) & 65535;
        this.h[1] = (this.h[1] >>> 3 | this.h[2] << 10) & 65535;
        this.h[2] = (this.h[2] >>> 6 | this.h[3] << 7) & 65535;
        this.h[3] = (this.h[3] >>> 9 | this.h[4] << 4) & 65535;
        this.h[4] = (this.h[4] >>> 12 | this.h[5] << 1 | this.h[6] << 14) & 65535;
        this.h[5] = (this.h[6] >>> 2 | this.h[7] << 11) & 65535;
        this.h[6] = (this.h[7] >>> 5 | this.h[8] << 8) & 65535;
        this.h[7] = (this.h[8] >>> 8 | this.h[9] << 5) & 65535;
        f = this.h[0] + this.pad[0];
        this.h[0] = f & 65535;
        for (i = 1; i < 8; i++) {
          f = (this.h[i] + this.pad[i] | 0) + (f >>> 16) | 0;
          this.h[i] = f & 65535;
        }
        mac[macpos + 0] = this.h[0] >>> 0 & 255;
        mac[macpos + 1] = this.h[0] >>> 8 & 255;
        mac[macpos + 2] = this.h[1] >>> 0 & 255;
        mac[macpos + 3] = this.h[1] >>> 8 & 255;
        mac[macpos + 4] = this.h[2] >>> 0 & 255;
        mac[macpos + 5] = this.h[2] >>> 8 & 255;
        mac[macpos + 6] = this.h[3] >>> 0 & 255;
        mac[macpos + 7] = this.h[3] >>> 8 & 255;
        mac[macpos + 8] = this.h[4] >>> 0 & 255;
        mac[macpos + 9] = this.h[4] >>> 8 & 255;
        mac[macpos + 10] = this.h[5] >>> 0 & 255;
        mac[macpos + 11] = this.h[5] >>> 8 & 255;
        mac[macpos + 12] = this.h[6] >>> 0 & 255;
        mac[macpos + 13] = this.h[6] >>> 8 & 255;
        mac[macpos + 14] = this.h[7] >>> 0 & 255;
        mac[macpos + 15] = this.h[7] >>> 8 & 255;
      };
      poly1305.prototype.update = function(m, mpos, bytes) {
        var i, want;
        if (this.leftover) {
          want = 16 - this.leftover;
          if (want > bytes)
            want = bytes;
          for (i = 0; i < want; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          bytes -= want;
          mpos += want;
          this.leftover += want;
          if (this.leftover < 16)
            return;
          this.blocks(this.buffer, 0, 16);
          this.leftover = 0;
        }
        if (bytes >= 16) {
          want = bytes - bytes % 16;
          this.blocks(m, mpos, want);
          mpos += want;
          bytes -= want;
        }
        if (bytes) {
          for (i = 0; i < bytes; i++)
            this.buffer[this.leftover + i] = m[mpos + i];
          this.leftover += bytes;
        }
      };
      function crypto_onetimeauth(out, outpos, m, mpos, n, k) {
        var s = new poly1305(k);
        s.update(m, mpos, n);
        s.finish(out, outpos);
        return 0;
      }
      function crypto_onetimeauth_verify(h, hpos, m, mpos, n, k) {
        var x = new Uint8Array(16);
        crypto_onetimeauth(x, 0, m, mpos, n, k);
        return crypto_verify_16(h, hpos, x, 0);
      }
      function crypto_secretbox(c, m, d, n, k) {
        var i;
        if (d < 32)
          return -1;
        crypto_stream_xor(c, 0, m, 0, d, n, k);
        crypto_onetimeauth(c, 16, c, 32, d - 32, c);
        for (i = 0; i < 16; i++)
          c[i] = 0;
        return 0;
      }
      function crypto_secretbox_open(m, c, d, n, k) {
        var i;
        var x = new Uint8Array(32);
        if (d < 32)
          return -1;
        crypto_stream(x, 0, 32, n, k);
        if (crypto_onetimeauth_verify(c, 16, c, 32, d - 32, x) !== 0)
          return -1;
        crypto_stream_xor(m, 0, c, 0, d, n, k);
        for (i = 0; i < 32; i++)
          m[i] = 0;
        return 0;
      }
      function set25519(r, a) {
        var i;
        for (i = 0; i < 16; i++)
          r[i] = a[i] | 0;
      }
      function car25519(o) {
        var i, v, c = 1;
        for (i = 0; i < 16; i++) {
          v = o[i] + c + 65535;
          c = Math.floor(v / 65536);
          o[i] = v - c * 65536;
        }
        o[0] += c - 1 + 37 * (c - 1);
      }
      function sel25519(p, q, b) {
        var t, c = ~(b - 1);
        for (var i = 0; i < 16; i++) {
          t = c & (p[i] ^ q[i]);
          p[i] ^= t;
          q[i] ^= t;
        }
      }
      function pack25519(o, n) {
        var i, j, b;
        var m = gf(), t = gf();
        for (i = 0; i < 16; i++)
          t[i] = n[i];
        car25519(t);
        car25519(t);
        car25519(t);
        for (j = 0; j < 2; j++) {
          m[0] = t[0] - 65517;
          for (i = 1; i < 15; i++) {
            m[i] = t[i] - 65535 - (m[i - 1] >> 16 & 1);
            m[i - 1] &= 65535;
          }
          m[15] = t[15] - 32767 - (m[14] >> 16 & 1);
          b = m[15] >> 16 & 1;
          m[14] &= 65535;
          sel25519(t, m, 1 - b);
        }
        for (i = 0; i < 16; i++) {
          o[2 * i] = t[i] & 255;
          o[2 * i + 1] = t[i] >> 8;
        }
      }
      function neq25519(a, b) {
        var c = new Uint8Array(32), d = new Uint8Array(32);
        pack25519(c, a);
        pack25519(d, b);
        return crypto_verify_32(c, 0, d, 0);
      }
      function par25519(a) {
        var d = new Uint8Array(32);
        pack25519(d, a);
        return d[0] & 1;
      }
      function unpack25519(o, n) {
        var i;
        for (i = 0; i < 16; i++)
          o[i] = n[2 * i] + (n[2 * i + 1] << 8);
        o[15] &= 32767;
      }
      function A(o, a, b) {
        for (var i = 0; i < 16; i++)
          o[i] = a[i] + b[i];
      }
      function Z(o, a, b) {
        for (var i = 0; i < 16; i++)
          o[i] = a[i] - b[i];
      }
      function M(o, a, b) {
        var v, c, t0 = 0, t1 = 0, t2 = 0, t3 = 0, t4 = 0, t5 = 0, t6 = 0, t7 = 0, t8 = 0, t9 = 0, t10 = 0, t11 = 0, t12 = 0, t13 = 0, t14 = 0, t15 = 0, t16 = 0, t17 = 0, t18 = 0, t19 = 0, t20 = 0, t21 = 0, t22 = 0, t23 = 0, t24 = 0, t25 = 0, t26 = 0, t27 = 0, t28 = 0, t29 = 0, t30 = 0, b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3], b4 = b[4], b5 = b[5], b6 = b[6], b7 = b[7], b8 = b[8], b9 = b[9], b10 = b[10], b11 = b[11], b12 = b[12], b13 = b[13], b14 = b[14], b15 = b[15];
        v = a[0];
        t0 += v * b0;
        t1 += v * b1;
        t2 += v * b2;
        t3 += v * b3;
        t4 += v * b4;
        t5 += v * b5;
        t6 += v * b6;
        t7 += v * b7;
        t8 += v * b8;
        t9 += v * b9;
        t10 += v * b10;
        t11 += v * b11;
        t12 += v * b12;
        t13 += v * b13;
        t14 += v * b14;
        t15 += v * b15;
        v = a[1];
        t1 += v * b0;
        t2 += v * b1;
        t3 += v * b2;
        t4 += v * b3;
        t5 += v * b4;
        t6 += v * b5;
        t7 += v * b6;
        t8 += v * b7;
        t9 += v * b8;
        t10 += v * b9;
        t11 += v * b10;
        t12 += v * b11;
        t13 += v * b12;
        t14 += v * b13;
        t15 += v * b14;
        t16 += v * b15;
        v = a[2];
        t2 += v * b0;
        t3 += v * b1;
        t4 += v * b2;
        t5 += v * b3;
        t6 += v * b4;
        t7 += v * b5;
        t8 += v * b6;
        t9 += v * b7;
        t10 += v * b8;
        t11 += v * b9;
        t12 += v * b10;
        t13 += v * b11;
        t14 += v * b12;
        t15 += v * b13;
        t16 += v * b14;
        t17 += v * b15;
        v = a[3];
        t3 += v * b0;
        t4 += v * b1;
        t5 += v * b2;
        t6 += v * b3;
        t7 += v * b4;
        t8 += v * b5;
        t9 += v * b6;
        t10 += v * b7;
        t11 += v * b8;
        t12 += v * b9;
        t13 += v * b10;
        t14 += v * b11;
        t15 += v * b12;
        t16 += v * b13;
        t17 += v * b14;
        t18 += v * b15;
        v = a[4];
        t4 += v * b0;
        t5 += v * b1;
        t6 += v * b2;
        t7 += v * b3;
        t8 += v * b4;
        t9 += v * b5;
        t10 += v * b6;
        t11 += v * b7;
        t12 += v * b8;
        t13 += v * b9;
        t14 += v * b10;
        t15 += v * b11;
        t16 += v * b12;
        t17 += v * b13;
        t18 += v * b14;
        t19 += v * b15;
        v = a[5];
        t5 += v * b0;
        t6 += v * b1;
        t7 += v * b2;
        t8 += v * b3;
        t9 += v * b4;
        t10 += v * b5;
        t11 += v * b6;
        t12 += v * b7;
        t13 += v * b8;
        t14 += v * b9;
        t15 += v * b10;
        t16 += v * b11;
        t17 += v * b12;
        t18 += v * b13;
        t19 += v * b14;
        t20 += v * b15;
        v = a[6];
        t6 += v * b0;
        t7 += v * b1;
        t8 += v * b2;
        t9 += v * b3;
        t10 += v * b4;
        t11 += v * b5;
        t12 += v * b6;
        t13 += v * b7;
        t14 += v * b8;
        t15 += v * b9;
        t16 += v * b10;
        t17 += v * b11;
        t18 += v * b12;
        t19 += v * b13;
        t20 += v * b14;
        t21 += v * b15;
        v = a[7];
        t7 += v * b0;
        t8 += v * b1;
        t9 += v * b2;
        t10 += v * b3;
        t11 += v * b4;
        t12 += v * b5;
        t13 += v * b6;
        t14 += v * b7;
        t15 += v * b8;
        t16 += v * b9;
        t17 += v * b10;
        t18 += v * b11;
        t19 += v * b12;
        t20 += v * b13;
        t21 += v * b14;
        t22 += v * b15;
        v = a[8];
        t8 += v * b0;
        t9 += v * b1;
        t10 += v * b2;
        t11 += v * b3;
        t12 += v * b4;
        t13 += v * b5;
        t14 += v * b6;
        t15 += v * b7;
        t16 += v * b8;
        t17 += v * b9;
        t18 += v * b10;
        t19 += v * b11;
        t20 += v * b12;
        t21 += v * b13;
        t22 += v * b14;
        t23 += v * b15;
        v = a[9];
        t9 += v * b0;
        t10 += v * b1;
        t11 += v * b2;
        t12 += v * b3;
        t13 += v * b4;
        t14 += v * b5;
        t15 += v * b6;
        t16 += v * b7;
        t17 += v * b8;
        t18 += v * b9;
        t19 += v * b10;
        t20 += v * b11;
        t21 += v * b12;
        t22 += v * b13;
        t23 += v * b14;
        t24 += v * b15;
        v = a[10];
        t10 += v * b0;
        t11 += v * b1;
        t12 += v * b2;
        t13 += v * b3;
        t14 += v * b4;
        t15 += v * b5;
        t16 += v * b6;
        t17 += v * b7;
        t18 += v * b8;
        t19 += v * b9;
        t20 += v * b10;
        t21 += v * b11;
        t22 += v * b12;
        t23 += v * b13;
        t24 += v * b14;
        t25 += v * b15;
        v = a[11];
        t11 += v * b0;
        t12 += v * b1;
        t13 += v * b2;
        t14 += v * b3;
        t15 += v * b4;
        t16 += v * b5;
        t17 += v * b6;
        t18 += v * b7;
        t19 += v * b8;
        t20 += v * b9;
        t21 += v * b10;
        t22 += v * b11;
        t23 += v * b12;
        t24 += v * b13;
        t25 += v * b14;
        t26 += v * b15;
        v = a[12];
        t12 += v * b0;
        t13 += v * b1;
        t14 += v * b2;
        t15 += v * b3;
        t16 += v * b4;
        t17 += v * b5;
        t18 += v * b6;
        t19 += v * b7;
        t20 += v * b8;
        t21 += v * b9;
        t22 += v * b10;
        t23 += v * b11;
        t24 += v * b12;
        t25 += v * b13;
        t26 += v * b14;
        t27 += v * b15;
        v = a[13];
        t13 += v * b0;
        t14 += v * b1;
        t15 += v * b2;
        t16 += v * b3;
        t17 += v * b4;
        t18 += v * b5;
        t19 += v * b6;
        t20 += v * b7;
        t21 += v * b8;
        t22 += v * b9;
        t23 += v * b10;
        t24 += v * b11;
        t25 += v * b12;
        t26 += v * b13;
        t27 += v * b14;
        t28 += v * b15;
        v = a[14];
        t14 += v * b0;
        t15 += v * b1;
        t16 += v * b2;
        t17 += v * b3;
        t18 += v * b4;
        t19 += v * b5;
        t20 += v * b6;
        t21 += v * b7;
        t22 += v * b8;
        t23 += v * b9;
        t24 += v * b10;
        t25 += v * b11;
        t26 += v * b12;
        t27 += v * b13;
        t28 += v * b14;
        t29 += v * b15;
        v = a[15];
        t15 += v * b0;
        t16 += v * b1;
        t17 += v * b2;
        t18 += v * b3;
        t19 += v * b4;
        t20 += v * b5;
        t21 += v * b6;
        t22 += v * b7;
        t23 += v * b8;
        t24 += v * b9;
        t25 += v * b10;
        t26 += v * b11;
        t27 += v * b12;
        t28 += v * b13;
        t29 += v * b14;
        t30 += v * b15;
        t0 += 38 * t16;
        t1 += 38 * t17;
        t2 += 38 * t18;
        t3 += 38 * t19;
        t4 += 38 * t20;
        t5 += 38 * t21;
        t6 += 38 * t22;
        t7 += 38 * t23;
        t8 += 38 * t24;
        t9 += 38 * t25;
        t10 += 38 * t26;
        t11 += 38 * t27;
        t12 += 38 * t28;
        t13 += 38 * t29;
        t14 += 38 * t30;
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        c = 1;
        v = t0 + c + 65535;
        c = Math.floor(v / 65536);
        t0 = v - c * 65536;
        v = t1 + c + 65535;
        c = Math.floor(v / 65536);
        t1 = v - c * 65536;
        v = t2 + c + 65535;
        c = Math.floor(v / 65536);
        t2 = v - c * 65536;
        v = t3 + c + 65535;
        c = Math.floor(v / 65536);
        t3 = v - c * 65536;
        v = t4 + c + 65535;
        c = Math.floor(v / 65536);
        t4 = v - c * 65536;
        v = t5 + c + 65535;
        c = Math.floor(v / 65536);
        t5 = v - c * 65536;
        v = t6 + c + 65535;
        c = Math.floor(v / 65536);
        t6 = v - c * 65536;
        v = t7 + c + 65535;
        c = Math.floor(v / 65536);
        t7 = v - c * 65536;
        v = t8 + c + 65535;
        c = Math.floor(v / 65536);
        t8 = v - c * 65536;
        v = t9 + c + 65535;
        c = Math.floor(v / 65536);
        t9 = v - c * 65536;
        v = t10 + c + 65535;
        c = Math.floor(v / 65536);
        t10 = v - c * 65536;
        v = t11 + c + 65535;
        c = Math.floor(v / 65536);
        t11 = v - c * 65536;
        v = t12 + c + 65535;
        c = Math.floor(v / 65536);
        t12 = v - c * 65536;
        v = t13 + c + 65535;
        c = Math.floor(v / 65536);
        t13 = v - c * 65536;
        v = t14 + c + 65535;
        c = Math.floor(v / 65536);
        t14 = v - c * 65536;
        v = t15 + c + 65535;
        c = Math.floor(v / 65536);
        t15 = v - c * 65536;
        t0 += c - 1 + 37 * (c - 1);
        o[0] = t0;
        o[1] = t1;
        o[2] = t2;
        o[3] = t3;
        o[4] = t4;
        o[5] = t5;
        o[6] = t6;
        o[7] = t7;
        o[8] = t8;
        o[9] = t9;
        o[10] = t10;
        o[11] = t11;
        o[12] = t12;
        o[13] = t13;
        o[14] = t14;
        o[15] = t15;
      }
      function S(o, a) {
        M(o, a, a);
      }
      function inv25519(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++)
          c[a] = i[a];
        for (a = 253; a >= 0; a--) {
          S(c, c);
          if (a !== 2 && a !== 4)
            M(c, c, i);
        }
        for (a = 0; a < 16; a++)
          o[a] = c[a];
      }
      function pow2523(o, i) {
        var c = gf();
        var a;
        for (a = 0; a < 16; a++)
          c[a] = i[a];
        for (a = 250; a >= 0; a--) {
          S(c, c);
          if (a !== 1)
            M(c, c, i);
        }
        for (a = 0; a < 16; a++)
          o[a] = c[a];
      }
      function crypto_scalarmult(q, n, p) {
        var z = new Uint8Array(32);
        var x = new Float64Array(80), r, i;
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf();
        for (i = 0; i < 31; i++)
          z[i] = n[i];
        z[31] = n[31] & 127 | 64;
        z[0] &= 248;
        unpack25519(x, p);
        for (i = 0; i < 16; i++) {
          b[i] = x[i];
          d[i] = a[i] = c[i] = 0;
        }
        a[0] = d[0] = 1;
        for (i = 254; i >= 0; --i) {
          r = z[i >>> 3] >>> (i & 7) & 1;
          sel25519(a, b, r);
          sel25519(c, d, r);
          A(e, a, c);
          Z(a, a, c);
          A(c, b, d);
          Z(b, b, d);
          S(d, e);
          S(f, a);
          M(a, c, a);
          M(c, b, e);
          A(e, a, c);
          Z(a, a, c);
          S(b, a);
          Z(c, d, f);
          M(a, c, _121665);
          A(a, a, d);
          M(c, c, a);
          M(a, d, f);
          M(d, b, x);
          S(b, e);
          sel25519(a, b, r);
          sel25519(c, d, r);
        }
        for (i = 0; i < 16; i++) {
          x[i + 16] = a[i];
          x[i + 32] = c[i];
          x[i + 48] = b[i];
          x[i + 64] = d[i];
        }
        var x32 = x.subarray(32);
        var x16 = x.subarray(16);
        inv25519(x32, x32);
        M(x16, x16, x32);
        pack25519(q, x16);
        return 0;
      }
      function crypto_scalarmult_base(q, n) {
        return crypto_scalarmult(q, n, _9);
      }
      function crypto_box_keypair(y, x) {
        randombytes(x, 32);
        return crypto_scalarmult_base(y, x);
      }
      function crypto_box_beforenm(k, y, x) {
        var s = new Uint8Array(32);
        crypto_scalarmult(s, x, y);
        return crypto_core_hsalsa20(k, _0, s, sigma);
      }
      var crypto_box_afternm = crypto_secretbox;
      var crypto_box_open_afternm = crypto_secretbox_open;
      function crypto_box(c, m, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_afternm(c, m, d, n, k);
      }
      function crypto_box_open(m, c, d, n, y, x) {
        var k = new Uint8Array(32);
        crypto_box_beforenm(k, y, x);
        return crypto_box_open_afternm(m, c, d, n, k);
      }
      var K = [
        1116352408,
        3609767458,
        1899447441,
        602891725,
        3049323471,
        3964484399,
        3921009573,
        2173295548,
        961987163,
        4081628472,
        1508970993,
        3053834265,
        2453635748,
        2937671579,
        2870763221,
        3664609560,
        3624381080,
        2734883394,
        310598401,
        1164996542,
        607225278,
        1323610764,
        1426881987,
        3590304994,
        1925078388,
        4068182383,
        2162078206,
        991336113,
        2614888103,
        633803317,
        3248222580,
        3479774868,
        3835390401,
        2666613458,
        4022224774,
        944711139,
        264347078,
        2341262773,
        604807628,
        2007800933,
        770255983,
        1495990901,
        1249150122,
        1856431235,
        1555081692,
        3175218132,
        1996064986,
        2198950837,
        2554220882,
        3999719339,
        2821834349,
        766784016,
        2952996808,
        2566594879,
        3210313671,
        3203337956,
        3336571891,
        1034457026,
        3584528711,
        2466948901,
        113926993,
        3758326383,
        338241895,
        168717936,
        666307205,
        1188179964,
        773529912,
        1546045734,
        1294757372,
        1522805485,
        1396182291,
        2643833823,
        1695183700,
        2343527390,
        1986661051,
        1014477480,
        2177026350,
        1206759142,
        2456956037,
        344077627,
        2730485921,
        1290863460,
        2820302411,
        3158454273,
        3259730800,
        3505952657,
        3345764771,
        106217008,
        3516065817,
        3606008344,
        3600352804,
        1432725776,
        4094571909,
        1467031594,
        275423344,
        851169720,
        430227734,
        3100823752,
        506948616,
        1363258195,
        659060556,
        3750685593,
        883997877,
        3785050280,
        958139571,
        3318307427,
        1322822218,
        3812723403,
        1537002063,
        2003034995,
        1747873779,
        3602036899,
        1955562222,
        1575990012,
        2024104815,
        1125592928,
        2227730452,
        2716904306,
        2361852424,
        442776044,
        2428436474,
        593698344,
        2756734187,
        3733110249,
        3204031479,
        2999351573,
        3329325298,
        3815920427,
        3391569614,
        3928383900,
        3515267271,
        566280711,
        3940187606,
        3454069534,
        4118630271,
        4000239992,
        116418474,
        1914138554,
        174292421,
        2731055270,
        289380356,
        3203993006,
        460393269,
        320620315,
        685471733,
        587496836,
        852142971,
        1086792851,
        1017036298,
        365543100,
        1126000580,
        2618297676,
        1288033470,
        3409855158,
        1501505948,
        4234509866,
        1607167915,
        987167468,
        1816402316,
        1246189591
      ];
      function crypto_hashblocks_hl(hh, hl, m, n) {
        var wh = new Int32Array(16), wl = new Int32Array(16), bh0, bh1, bh2, bh3, bh4, bh5, bh6, bh7, bl0, bl1, bl2, bl3, bl4, bl5, bl6, bl7, th, tl, i, j, h, l, a, b, c, d;
        var ah0 = hh[0], ah1 = hh[1], ah2 = hh[2], ah3 = hh[3], ah4 = hh[4], ah5 = hh[5], ah6 = hh[6], ah7 = hh[7], al0 = hl[0], al1 = hl[1], al2 = hl[2], al3 = hl[3], al4 = hl[4], al5 = hl[5], al6 = hl[6], al7 = hl[7];
        var pos = 0;
        while (n >= 128) {
          for (i = 0; i < 16; i++) {
            j = 8 * i + pos;
            wh[i] = m[j + 0] << 24 | m[j + 1] << 16 | m[j + 2] << 8 | m[j + 3];
            wl[i] = m[j + 4] << 24 | m[j + 5] << 16 | m[j + 6] << 8 | m[j + 7];
          }
          for (i = 0; i < 80; i++) {
            bh0 = ah0;
            bh1 = ah1;
            bh2 = ah2;
            bh3 = ah3;
            bh4 = ah4;
            bh5 = ah5;
            bh6 = ah6;
            bh7 = ah7;
            bl0 = al0;
            bl1 = al1;
            bl2 = al2;
            bl3 = al3;
            bl4 = al4;
            bl5 = al5;
            bl6 = al6;
            bl7 = al7;
            h = ah7;
            l = al7;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah4 >>> 14 | al4 << 32 - 14) ^ (ah4 >>> 18 | al4 << 32 - 18) ^ (al4 >>> 41 - 32 | ah4 << 32 - (41 - 32));
            l = (al4 >>> 14 | ah4 << 32 - 14) ^ (al4 >>> 18 | ah4 << 32 - 18) ^ (ah4 >>> 41 - 32 | al4 << 32 - (41 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah4 & ah5 ^ ~ah4 & ah6;
            l = al4 & al5 ^ ~al4 & al6;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = K[i * 2];
            l = K[i * 2 + 1];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = wh[i % 16];
            l = wl[i % 16];
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            th = c & 65535 | d << 16;
            tl = a & 65535 | b << 16;
            h = th;
            l = tl;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = (ah0 >>> 28 | al0 << 32 - 28) ^ (al0 >>> 34 - 32 | ah0 << 32 - (34 - 32)) ^ (al0 >>> 39 - 32 | ah0 << 32 - (39 - 32));
            l = (al0 >>> 28 | ah0 << 32 - 28) ^ (ah0 >>> 34 - 32 | al0 << 32 - (34 - 32)) ^ (ah0 >>> 39 - 32 | al0 << 32 - (39 - 32));
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            h = ah0 & ah1 ^ ah0 & ah2 ^ ah1 & ah2;
            l = al0 & al1 ^ al0 & al2 ^ al1 & al2;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh7 = c & 65535 | d << 16;
            bl7 = a & 65535 | b << 16;
            h = bh3;
            l = bl3;
            a = l & 65535;
            b = l >>> 16;
            c = h & 65535;
            d = h >>> 16;
            h = th;
            l = tl;
            a += l & 65535;
            b += l >>> 16;
            c += h & 65535;
            d += h >>> 16;
            b += a >>> 16;
            c += b >>> 16;
            d += c >>> 16;
            bh3 = c & 65535 | d << 16;
            bl3 = a & 65535 | b << 16;
            ah1 = bh0;
            ah2 = bh1;
            ah3 = bh2;
            ah4 = bh3;
            ah5 = bh4;
            ah6 = bh5;
            ah7 = bh6;
            ah0 = bh7;
            al1 = bl0;
            al2 = bl1;
            al3 = bl2;
            al4 = bl3;
            al5 = bl4;
            al6 = bl5;
            al7 = bl6;
            al0 = bl7;
            if (i % 16 === 15) {
              for (j = 0; j < 16; j++) {
                h = wh[j];
                l = wl[j];
                a = l & 65535;
                b = l >>> 16;
                c = h & 65535;
                d = h >>> 16;
                h = wh[(j + 9) % 16];
                l = wl[(j + 9) % 16];
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 1) % 16];
                tl = wl[(j + 1) % 16];
                h = (th >>> 1 | tl << 32 - 1) ^ (th >>> 8 | tl << 32 - 8) ^ th >>> 7;
                l = (tl >>> 1 | th << 32 - 1) ^ (tl >>> 8 | th << 32 - 8) ^ (tl >>> 7 | th << 32 - 7);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                th = wh[(j + 14) % 16];
                tl = wl[(j + 14) % 16];
                h = (th >>> 19 | tl << 32 - 19) ^ (tl >>> 61 - 32 | th << 32 - (61 - 32)) ^ th >>> 6;
                l = (tl >>> 19 | th << 32 - 19) ^ (th >>> 61 - 32 | tl << 32 - (61 - 32)) ^ (tl >>> 6 | th << 32 - 6);
                a += l & 65535;
                b += l >>> 16;
                c += h & 65535;
                d += h >>> 16;
                b += a >>> 16;
                c += b >>> 16;
                d += c >>> 16;
                wh[j] = c & 65535 | d << 16;
                wl[j] = a & 65535 | b << 16;
              }
            }
          }
          h = ah0;
          l = al0;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[0];
          l = hl[0];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[0] = ah0 = c & 65535 | d << 16;
          hl[0] = al0 = a & 65535 | b << 16;
          h = ah1;
          l = al1;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[1];
          l = hl[1];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[1] = ah1 = c & 65535 | d << 16;
          hl[1] = al1 = a & 65535 | b << 16;
          h = ah2;
          l = al2;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[2];
          l = hl[2];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[2] = ah2 = c & 65535 | d << 16;
          hl[2] = al2 = a & 65535 | b << 16;
          h = ah3;
          l = al3;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[3];
          l = hl[3];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[3] = ah3 = c & 65535 | d << 16;
          hl[3] = al3 = a & 65535 | b << 16;
          h = ah4;
          l = al4;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[4];
          l = hl[4];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[4] = ah4 = c & 65535 | d << 16;
          hl[4] = al4 = a & 65535 | b << 16;
          h = ah5;
          l = al5;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[5];
          l = hl[5];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[5] = ah5 = c & 65535 | d << 16;
          hl[5] = al5 = a & 65535 | b << 16;
          h = ah6;
          l = al6;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[6];
          l = hl[6];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[6] = ah6 = c & 65535 | d << 16;
          hl[6] = al6 = a & 65535 | b << 16;
          h = ah7;
          l = al7;
          a = l & 65535;
          b = l >>> 16;
          c = h & 65535;
          d = h >>> 16;
          h = hh[7];
          l = hl[7];
          a += l & 65535;
          b += l >>> 16;
          c += h & 65535;
          d += h >>> 16;
          b += a >>> 16;
          c += b >>> 16;
          d += c >>> 16;
          hh[7] = ah7 = c & 65535 | d << 16;
          hl[7] = al7 = a & 65535 | b << 16;
          pos += 128;
          n -= 128;
        }
        return n;
      }
      function crypto_hash(out, m, n) {
        var hh = new Int32Array(8), hl = new Int32Array(8), x = new Uint8Array(256), i, b = n;
        hh[0] = 1779033703;
        hh[1] = 3144134277;
        hh[2] = 1013904242;
        hh[3] = 2773480762;
        hh[4] = 1359893119;
        hh[5] = 2600822924;
        hh[6] = 528734635;
        hh[7] = 1541459225;
        hl[0] = 4089235720;
        hl[1] = 2227873595;
        hl[2] = 4271175723;
        hl[3] = 1595750129;
        hl[4] = 2917565137;
        hl[5] = 725511199;
        hl[6] = 4215389547;
        hl[7] = 327033209;
        crypto_hashblocks_hl(hh, hl, m, n);
        n %= 128;
        for (i = 0; i < n; i++)
          x[i] = m[b - n + i];
        x[n] = 128;
        n = 256 - 128 * (n < 112 ? 1 : 0);
        x[n - 9] = 0;
        ts64(x, n - 8, b / 536870912 | 0, b << 3);
        crypto_hashblocks_hl(hh, hl, x, n);
        for (i = 0; i < 8; i++)
          ts64(out, 8 * i, hh[i], hl[i]);
        return 0;
      }
      function add(p, q) {
        var a = gf(), b = gf(), c = gf(), d = gf(), e = gf(), f = gf(), g = gf(), h = gf(), t = gf();
        Z(a, p[1], p[0]);
        Z(t, q[1], q[0]);
        M(a, a, t);
        A(b, p[0], p[1]);
        A(t, q[0], q[1]);
        M(b, b, t);
        M(c, p[3], q[3]);
        M(c, c, D2);
        M(d, p[2], q[2]);
        A(d, d, d);
        Z(e, b, a);
        Z(f, d, c);
        A(g, d, c);
        A(h, b, a);
        M(p[0], e, f);
        M(p[1], h, g);
        M(p[2], g, f);
        M(p[3], e, h);
      }
      function cswap(p, q, b) {
        var i;
        for (i = 0; i < 4; i++) {
          sel25519(p[i], q[i], b);
        }
      }
      function pack(r, p) {
        var tx = gf(), ty = gf(), zi = gf();
        inv25519(zi, p[2]);
        M(tx, p[0], zi);
        M(ty, p[1], zi);
        pack25519(r, ty);
        r[31] ^= par25519(tx) << 7;
      }
      function scalarmult(p, q, s) {
        var b, i;
        set25519(p[0], gf0);
        set25519(p[1], gf1);
        set25519(p[2], gf1);
        set25519(p[3], gf0);
        for (i = 255; i >= 0; --i) {
          b = s[i / 8 | 0] >> (i & 7) & 1;
          cswap(p, q, b);
          add(q, p);
          add(p, p);
          cswap(p, q, b);
        }
      }
      function scalarbase(p, s) {
        var q = [gf(), gf(), gf(), gf()];
        set25519(q[0], X);
        set25519(q[1], Y);
        set25519(q[2], gf1);
        M(q[3], X, Y);
        scalarmult(p, q, s);
      }
      function crypto_sign_keypair(pk, sk, seeded) {
        var d = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()];
        var i;
        if (!seeded)
          randombytes(sk, 32);
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        scalarbase(p, d);
        pack(pk, p);
        for (i = 0; i < 32; i++)
          sk[i + 32] = pk[i];
        return 0;
      }
      var L = new Float64Array([237, 211, 245, 92, 26, 99, 18, 88, 214, 156, 247, 162, 222, 249, 222, 20, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 16]);
      function modL(r, x) {
        var carry, i, j, k;
        for (i = 63; i >= 32; --i) {
          carry = 0;
          for (j = i - 32, k = i - 12; j < k; ++j) {
            x[j] += carry - 16 * x[i] * L[j - (i - 32)];
            carry = Math.floor((x[j] + 128) / 256);
            x[j] -= carry * 256;
          }
          x[j] += carry;
          x[i] = 0;
        }
        carry = 0;
        for (j = 0; j < 32; j++) {
          x[j] += carry - (x[31] >> 4) * L[j];
          carry = x[j] >> 8;
          x[j] &= 255;
        }
        for (j = 0; j < 32; j++)
          x[j] -= carry * L[j];
        for (i = 0; i < 32; i++) {
          x[i + 1] += x[i] >> 8;
          r[i] = x[i] & 255;
        }
      }
      function reduce(r) {
        var x = new Float64Array(64), i;
        for (i = 0; i < 64; i++)
          x[i] = r[i];
        for (i = 0; i < 64; i++)
          r[i] = 0;
        modL(r, x);
      }
      function crypto_sign(sm, m, n, sk) {
        var d = new Uint8Array(64), h = new Uint8Array(64), r = new Uint8Array(64);
        var i, j, x = new Float64Array(64);
        var p = [gf(), gf(), gf(), gf()];
        crypto_hash(d, sk, 32);
        d[0] &= 248;
        d[31] &= 127;
        d[31] |= 64;
        var smlen = n + 64;
        for (i = 0; i < n; i++)
          sm[64 + i] = m[i];
        for (i = 0; i < 32; i++)
          sm[32 + i] = d[32 + i];
        crypto_hash(r, sm.subarray(32), n + 32);
        reduce(r);
        scalarbase(p, r);
        pack(sm, p);
        for (i = 32; i < 64; i++)
          sm[i] = sk[i];
        crypto_hash(h, sm, n + 64);
        reduce(h);
        for (i = 0; i < 64; i++)
          x[i] = 0;
        for (i = 0; i < 32; i++)
          x[i] = r[i];
        for (i = 0; i < 32; i++) {
          for (j = 0; j < 32; j++) {
            x[i + j] += h[i] * d[j];
          }
        }
        modL(sm.subarray(32), x);
        return smlen;
      }
      function unpackneg(r, p) {
        var t = gf(), chk = gf(), num = gf(), den = gf(), den2 = gf(), den4 = gf(), den6 = gf();
        set25519(r[2], gf1);
        unpack25519(r[1], p);
        S(num, r[1]);
        M(den, num, D);
        Z(num, num, r[2]);
        A(den, r[2], den);
        S(den2, den);
        S(den4, den2);
        M(den6, den4, den2);
        M(t, den6, num);
        M(t, t, den);
        pow2523(t, t);
        M(t, t, num);
        M(t, t, den);
        M(t, t, den);
        M(r[0], t, den);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num))
          M(r[0], r[0], I);
        S(chk, r[0]);
        M(chk, chk, den);
        if (neq25519(chk, num))
          return -1;
        if (par25519(r[0]) === p[31] >> 7)
          Z(r[0], gf0, r[0]);
        M(r[3], r[0], r[1]);
        return 0;
      }
      function crypto_sign_open(m, sm, n, pk) {
        var i;
        var t = new Uint8Array(32), h = new Uint8Array(64);
        var p = [gf(), gf(), gf(), gf()], q = [gf(), gf(), gf(), gf()];
        if (n < 64)
          return -1;
        if (unpackneg(q, pk))
          return -1;
        for (i = 0; i < n; i++)
          m[i] = sm[i];
        for (i = 0; i < 32; i++)
          m[i + 32] = pk[i];
        crypto_hash(h, m, n);
        reduce(h);
        scalarmult(p, q, h);
        scalarbase(q, sm.subarray(32));
        add(p, q);
        pack(t, p);
        n -= 64;
        if (crypto_verify_32(sm, 0, t, 0)) {
          for (i = 0; i < n; i++)
            m[i] = 0;
          return -1;
        }
        for (i = 0; i < n; i++)
          m[i] = sm[i + 64];
        return n;
      }
      var crypto_secretbox_KEYBYTES = 32, crypto_secretbox_NONCEBYTES = 24, crypto_secretbox_ZEROBYTES = 32, crypto_secretbox_BOXZEROBYTES = 16, crypto_scalarmult_BYTES = 32, crypto_scalarmult_SCALARBYTES = 32, crypto_box_PUBLICKEYBYTES = 32, crypto_box_SECRETKEYBYTES = 32, crypto_box_BEFORENMBYTES = 32, crypto_box_NONCEBYTES = crypto_secretbox_NONCEBYTES, crypto_box_ZEROBYTES = crypto_secretbox_ZEROBYTES, crypto_box_BOXZEROBYTES = crypto_secretbox_BOXZEROBYTES, crypto_sign_BYTES = 64, crypto_sign_PUBLICKEYBYTES = 32, crypto_sign_SECRETKEYBYTES = 64, crypto_sign_SEEDBYTES = 32, crypto_hash_BYTES = 64;
      nacl.lowlevel = {
        crypto_core_hsalsa20,
        crypto_stream_xor,
        crypto_stream,
        crypto_stream_salsa20_xor,
        crypto_stream_salsa20,
        crypto_onetimeauth,
        crypto_onetimeauth_verify,
        crypto_verify_16,
        crypto_verify_32,
        crypto_secretbox,
        crypto_secretbox_open,
        crypto_scalarmult,
        crypto_scalarmult_base,
        crypto_box_beforenm,
        crypto_box_afternm,
        crypto_box,
        crypto_box_open,
        crypto_box_keypair,
        crypto_hash,
        crypto_sign,
        crypto_sign_keypair,
        crypto_sign_open,
        crypto_secretbox_KEYBYTES,
        crypto_secretbox_NONCEBYTES,
        crypto_secretbox_ZEROBYTES,
        crypto_secretbox_BOXZEROBYTES,
        crypto_scalarmult_BYTES,
        crypto_scalarmult_SCALARBYTES,
        crypto_box_PUBLICKEYBYTES,
        crypto_box_SECRETKEYBYTES,
        crypto_box_BEFORENMBYTES,
        crypto_box_NONCEBYTES,
        crypto_box_ZEROBYTES,
        crypto_box_BOXZEROBYTES,
        crypto_sign_BYTES,
        crypto_sign_PUBLICKEYBYTES,
        crypto_sign_SECRETKEYBYTES,
        crypto_sign_SEEDBYTES,
        crypto_hash_BYTES,
        gf,
        D,
        L,
        pack25519,
        unpack25519,
        M,
        A,
        S,
        Z,
        pow2523,
        add,
        set25519,
        modL,
        scalarmult,
        scalarbase
      };
      function checkLengths(k, n) {
        if (k.length !== crypto_secretbox_KEYBYTES)
          throw new Error("bad key size");
        if (n.length !== crypto_secretbox_NONCEBYTES)
          throw new Error("bad nonce size");
      }
      function checkBoxLengths(pk, sk) {
        if (pk.length !== crypto_box_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        if (sk.length !== crypto_box_SECRETKEYBYTES)
          throw new Error("bad secret key size");
      }
      function checkArrayTypes() {
        for (var i = 0; i < arguments.length; i++) {
          if (!(arguments[i] instanceof Uint8Array))
            throw new TypeError("unexpected type, use Uint8Array");
        }
      }
      function cleanup(arr) {
        for (var i = 0; i < arr.length; i++)
          arr[i] = 0;
      }
      nacl.randomBytes = function(n) {
        var b = new Uint8Array(n);
        randombytes(b, n);
        return b;
      };
      nacl.secretbox = function(msg, nonce, key) {
        checkArrayTypes(msg, nonce, key);
        checkLengths(key, nonce);
        var m = new Uint8Array(crypto_secretbox_ZEROBYTES + msg.length);
        var c = new Uint8Array(m.length);
        for (var i = 0; i < msg.length; i++)
          m[i + crypto_secretbox_ZEROBYTES] = msg[i];
        crypto_secretbox(c, m, m.length, nonce, key);
        return c.subarray(crypto_secretbox_BOXZEROBYTES);
      };
      nacl.secretbox.open = function(box, nonce, key) {
        checkArrayTypes(box, nonce, key);
        checkLengths(key, nonce);
        var c = new Uint8Array(crypto_secretbox_BOXZEROBYTES + box.length);
        var m = new Uint8Array(c.length);
        for (var i = 0; i < box.length; i++)
          c[i + crypto_secretbox_BOXZEROBYTES] = box[i];
        if (c.length < 32)
          return null;
        if (crypto_secretbox_open(m, c, c.length, nonce, key) !== 0)
          return null;
        return m.subarray(crypto_secretbox_ZEROBYTES);
      };
      nacl.secretbox.keyLength = crypto_secretbox_KEYBYTES;
      nacl.secretbox.nonceLength = crypto_secretbox_NONCEBYTES;
      nacl.secretbox.overheadLength = crypto_secretbox_BOXZEROBYTES;
      nacl.scalarMult = function(n, p) {
        checkArrayTypes(n, p);
        if (n.length !== crypto_scalarmult_SCALARBYTES)
          throw new Error("bad n size");
        if (p.length !== crypto_scalarmult_BYTES)
          throw new Error("bad p size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult(q, n, p);
        return q;
      };
      nacl.scalarMult.base = function(n) {
        checkArrayTypes(n);
        if (n.length !== crypto_scalarmult_SCALARBYTES)
          throw new Error("bad n size");
        var q = new Uint8Array(crypto_scalarmult_BYTES);
        crypto_scalarmult_base(q, n);
        return q;
      };
      nacl.scalarMult.scalarLength = crypto_scalarmult_SCALARBYTES;
      nacl.scalarMult.groupElementLength = crypto_scalarmult_BYTES;
      nacl.box = function(msg, nonce, publicKey, secretKey) {
        var k = nacl.box.before(publicKey, secretKey);
        return nacl.secretbox(msg, nonce, k);
      };
      nacl.box.before = function(publicKey, secretKey) {
        checkArrayTypes(publicKey, secretKey);
        checkBoxLengths(publicKey, secretKey);
        var k = new Uint8Array(crypto_box_BEFORENMBYTES);
        crypto_box_beforenm(k, publicKey, secretKey);
        return k;
      };
      nacl.box.after = nacl.secretbox;
      nacl.box.open = function(msg, nonce, publicKey, secretKey) {
        var k = nacl.box.before(publicKey, secretKey);
        return nacl.secretbox.open(msg, nonce, k);
      };
      nacl.box.open.after = nacl.secretbox.open;
      nacl.box.keyPair = function() {
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_box_SECRETKEYBYTES);
        crypto_box_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl.box.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_box_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_box_PUBLICKEYBYTES);
        crypto_scalarmult_base(pk, secretKey);
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl.box.publicKeyLength = crypto_box_PUBLICKEYBYTES;
      nacl.box.secretKeyLength = crypto_box_SECRETKEYBYTES;
      nacl.box.sharedKeyLength = crypto_box_BEFORENMBYTES;
      nacl.box.nonceLength = crypto_box_NONCEBYTES;
      nacl.box.overheadLength = nacl.secretbox.overheadLength;
      nacl.sign = function(msg, secretKey) {
        checkArrayTypes(msg, secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var signedMsg = new Uint8Array(crypto_sign_BYTES + msg.length);
        crypto_sign(signedMsg, msg, msg.length, secretKey);
        return signedMsg;
      };
      nacl.sign.open = function(signedMsg, publicKey) {
        checkArrayTypes(signedMsg, publicKey);
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var tmp = new Uint8Array(signedMsg.length);
        var mlen = crypto_sign_open(tmp, signedMsg, signedMsg.length, publicKey);
        if (mlen < 0)
          return null;
        var m = new Uint8Array(mlen);
        for (var i = 0; i < m.length; i++)
          m[i] = tmp[i];
        return m;
      };
      nacl.sign.detached = function(msg, secretKey) {
        var signedMsg = nacl.sign(msg, secretKey);
        var sig = new Uint8Array(crypto_sign_BYTES);
        for (var i = 0; i < sig.length; i++)
          sig[i] = signedMsg[i];
        return sig;
      };
      nacl.sign.detached.verify = function(msg, sig, publicKey) {
        checkArrayTypes(msg, sig, publicKey);
        if (sig.length !== crypto_sign_BYTES)
          throw new Error("bad signature size");
        if (publicKey.length !== crypto_sign_PUBLICKEYBYTES)
          throw new Error("bad public key size");
        var sm = new Uint8Array(crypto_sign_BYTES + msg.length);
        var m = new Uint8Array(crypto_sign_BYTES + msg.length);
        var i;
        for (i = 0; i < crypto_sign_BYTES; i++)
          sm[i] = sig[i];
        for (i = 0; i < msg.length; i++)
          sm[i + crypto_sign_BYTES] = msg[i];
        return crypto_sign_open(m, sm, sm.length, publicKey) >= 0;
      };
      nacl.sign.keyPair = function() {
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        crypto_sign_keypair(pk, sk);
        return { publicKey: pk, secretKey: sk };
      };
      nacl.sign.keyPair.fromSecretKey = function(secretKey) {
        checkArrayTypes(secretKey);
        if (secretKey.length !== crypto_sign_SECRETKEYBYTES)
          throw new Error("bad secret key size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        for (var i = 0; i < pk.length; i++)
          pk[i] = secretKey[32 + i];
        return { publicKey: pk, secretKey: new Uint8Array(secretKey) };
      };
      nacl.sign.keyPair.fromSeed = function(seed) {
        checkArrayTypes(seed);
        if (seed.length !== crypto_sign_SEEDBYTES)
          throw new Error("bad seed size");
        var pk = new Uint8Array(crypto_sign_PUBLICKEYBYTES);
        var sk = new Uint8Array(crypto_sign_SECRETKEYBYTES);
        for (var i = 0; i < 32; i++)
          sk[i] = seed[i];
        crypto_sign_keypair(pk, sk, true);
        return { publicKey: pk, secretKey: sk };
      };
      nacl.sign.publicKeyLength = crypto_sign_PUBLICKEYBYTES;
      nacl.sign.secretKeyLength = crypto_sign_SECRETKEYBYTES;
      nacl.sign.seedLength = crypto_sign_SEEDBYTES;
      nacl.sign.signatureLength = crypto_sign_BYTES;
      nacl.hash = function(msg) {
        checkArrayTypes(msg);
        var h = new Uint8Array(crypto_hash_BYTES);
        crypto_hash(h, msg, msg.length);
        return h;
      };
      nacl.hash.hashLength = crypto_hash_BYTES;
      nacl.verify = function(x, y) {
        checkArrayTypes(x, y);
        if (x.length === 0 || y.length === 0)
          return false;
        if (x.length !== y.length)
          return false;
        return vn(x, 0, y, 0, x.length) === 0 ? true : false;
      };
      nacl.setPRNG = function(fn) {
        randombytes = fn;
      };
      (function() {
        var crypto = typeof self !== "undefined" ? self.crypto || self.msCrypto : null;
        if (crypto && crypto.getRandomValues) {
          var QUOTA = 65536;
          nacl.setPRNG(function(x, n) {
            var i, v = new Uint8Array(n);
            for (i = 0; i < n; i += QUOTA) {
              crypto.getRandomValues(v.subarray(i, i + Math.min(n - i, QUOTA)));
            }
            for (i = 0; i < n; i++)
              x[i] = v[i];
            cleanup(v);
          });
        } else if (typeof require !== "undefined") {
          crypto = require("crypto");
          if (crypto && crypto.randomBytes) {
            nacl.setPRNG(function(x, n) {
              var i, v = crypto.randomBytes(n);
              for (i = 0; i < n; i++)
                x[i] = v[i];
              cleanup(v);
            });
          }
        }
      })();
    })(typeof module2 !== "undefined" && module2.exports ? module2.exports : self.nacl = self.nacl || {});
  }
});

// node_modules/juicebox-sdk/juicebox-sdk_bg.js
var juicebox_sdk_bg_exports = {};
__export(juicebox_sdk_bg_exports, {
  AuthTokenGenerator: () => AuthTokenGenerator,
  Client: () => Client,
  Configuration: () => Configuration,
  DeleteError: () => DeleteError,
  RecoverError: () => RecoverError,
  RecoverErrorReason: () => RecoverErrorReason,
  RegisterError: () => RegisterError,
  __wbg_JuiceboxGetAuthToken_b281475283f56b2c: () => __wbg_JuiceboxGetAuthToken_b281475283f56b2c,
  __wbg_arrayBuffer_a9d862b05aaee2f9: () => __wbg_arrayBuffer_a9d862b05aaee2f9,
  __wbg_blob_c6537f3e31e66dad: () => __wbg_blob_c6537f3e31e66dad,
  __wbg_buffer_a448f833075b71ba: () => __wbg_buffer_a448f833075b71ba,
  __wbg_call_5da1969d7cd31ccd: () => __wbg_call_5da1969d7cd31ccd,
  __wbg_call_90c26b09837aba1c: () => __wbg_call_90c26b09837aba1c,
  __wbg_crypto_58f13aa23ffcb166: () => __wbg_crypto_58f13aa23ffcb166,
  __wbg_done_5fe336b092d60cf2: () => __wbg_done_5fe336b092d60cf2,
  __wbg_entries_9e2e2aa45aa5094a: () => __wbg_entries_9e2e2aa45aa5094a,
  __wbg_error_f851667af71bcfc6: () => __wbg_error_f851667af71bcfc6,
  __wbg_fetch_edb546a0ab30aba2: () => __wbg_fetch_edb546a0ab30aba2,
  __wbg_from_71add2e723d1f1b2: () => __wbg_from_71add2e723d1f1b2,
  __wbg_getRandomValues_504510b5564925af: () => __wbg_getRandomValues_504510b5564925af,
  __wbg_get_7b48513de5dc5ea4: () => __wbg_get_7b48513de5dc5ea4,
  __wbg_get_f01601b5a68d10e3: () => __wbg_get_f01601b5a68d10e3,
  __wbg_getwithrefkey_4a92a5eca60879b9: () => __wbg_getwithrefkey_4a92a5eca60879b9,
  __wbg_globalThis_9caa27ff917c6860: () => __wbg_globalThis_9caa27ff917c6860,
  __wbg_global_35dfdd59a4da3e74: () => __wbg_global_35dfdd59a4da3e74,
  __wbg_headers_24def508a7518df9: () => __wbg_headers_24def508a7518df9,
  __wbg_headers_d135d2bb8cc60413: () => __wbg_headers_d135d2bb8cc60413,
  __wbg_instanceof_ArrayBuffer_e7d53d51371448e2: () => __wbg_instanceof_ArrayBuffer_e7d53d51371448e2,
  __wbg_instanceof_Response_4c3b1446206114d1: () => __wbg_instanceof_Response_4c3b1446206114d1,
  __wbg_instanceof_Uint8Array_bced6f43aed8c1aa: () => __wbg_instanceof_Uint8Array_bced6f43aed8c1aa,
  __wbg_isArray_74fb723e24f76012: () => __wbg_isArray_74fb723e24f76012,
  __wbg_isSafeInteger_f93fde0dca9820f8: () => __wbg_isSafeInteger_f93fde0dca9820f8,
  __wbg_iterator_db7ca081358d4fb2: () => __wbg_iterator_db7ca081358d4fb2,
  __wbg_length_1009b1af0c481d7b: () => __wbg_length_1009b1af0c481d7b,
  __wbg_length_1d25fa9e4ac21ce7: () => __wbg_length_1d25fa9e4ac21ce7,
  __wbg_msCrypto_abcb1295e768d1f2: () => __wbg_msCrypto_abcb1295e768d1f2,
  __wbg_new_60f57089c7563e81: () => __wbg_new_60f57089c7563e81,
  __wbg_new_8f67e318f15d7254: () => __wbg_new_8f67e318f15d7254,
  __wbg_new_9fb8d994e1c0aaac: () => __wbg_new_9fb8d994e1c0aaac,
  __wbg_new_abda76e883ba8a5f: () => __wbg_new_abda76e883ba8a5f,
  __wbg_newnoargs_c62ea9419c21fbac: () => __wbg_newnoargs_c62ea9419c21fbac,
  __wbg_newwithbyteoffsetandlength_d0482f893617af71: () => __wbg_newwithbyteoffsetandlength_d0482f893617af71,
  __wbg_newwithlength_6c2df9e2f3028c43: () => __wbg_newwithlength_6c2df9e2f3028c43,
  __wbg_newwithstrandinit_f581dff0d19a8b03: () => __wbg_newwithstrandinit_f581dff0d19a8b03,
  __wbg_next_6529ee0cca8d57ed: () => __wbg_next_6529ee0cca8d57ed,
  __wbg_next_9b877f231f476d01: () => __wbg_next_9b877f231f476d01,
  __wbg_node_523d7bd03ef69fba: () => __wbg_node_523d7bd03ef69fba,
  __wbg_now_0343d9c3e0e8eedc: () => __wbg_now_0343d9c3e0e8eedc,
  __wbg_now_b724952e890dc703: () => __wbg_now_b724952e890dc703,
  __wbg_process_5b786e71d465a513: () => __wbg_process_5b786e71d465a513,
  __wbg_queueMicrotask_4d890031a6a5a50c: () => __wbg_queueMicrotask_4d890031a6a5a50c,
  __wbg_queueMicrotask_adae4bc085237231: () => __wbg_queueMicrotask_adae4bc085237231,
  __wbg_randomFillSync_a0d98aa11c81fe89: () => __wbg_randomFillSync_a0d98aa11c81fe89,
  __wbg_recovererror_new: () => __wbg_recovererror_new,
  __wbg_require_2784e593a4674877: () => __wbg_require_2784e593a4674877,
  __wbg_resolve_6e1c6553a82f85b7: () => __wbg_resolve_6e1c6553a82f85b7,
  __wbg_self_f0e34d89f33b99fd: () => __wbg_self_f0e34d89f33b99fd,
  __wbg_setTimeout_de06f469be594d94: () => __wbg_setTimeout_de06f469be594d94,
  __wbg_set_2357bf09366ee480: () => __wbg_set_2357bf09366ee480,
  __wbg_set_27f236f6d7a28c29: () => __wbg_set_27f236f6d7a28c29,
  __wbg_set_759f75cd92b612d2: () => __wbg_set_759f75cd92b612d2,
  __wbg_set_wasm: () => __wbg_set_wasm,
  __wbg_stack_658279fe44541cf6: () => __wbg_stack_658279fe44541cf6,
  __wbg_status_d6d47ad2837621eb: () => __wbg_status_d6d47ad2837621eb,
  __wbg_stringify_e1b19966d964d242: () => __wbg_stringify_e1b19966d964d242,
  __wbg_subarray_2e940e41c0f5a1d9: () => __wbg_subarray_2e940e41c0f5a1d9,
  __wbg_then_3ab08cd4fbb91ae9: () => __wbg_then_3ab08cd4fbb91ae9,
  __wbg_then_8371cc12cfedc5a2: () => __wbg_then_8371cc12cfedc5a2,
  __wbg_value_0c248a78fdc8e19f: () => __wbg_value_0c248a78fdc8e19f,
  __wbg_versions_c2ab80650590b6a2: () => __wbg_versions_c2ab80650590b6a2,
  __wbg_window_d3b084224f4774d7: () => __wbg_window_d3b084224f4774d7,
  __wbindgen_as_number: () => __wbindgen_as_number,
  __wbindgen_boolean_get: () => __wbindgen_boolean_get,
  __wbindgen_cb_drop: () => __wbindgen_cb_drop,
  __wbindgen_closure_wrapper610: () => __wbindgen_closure_wrapper610,
  __wbindgen_closure_wrapper901: () => __wbindgen_closure_wrapper901,
  __wbindgen_debug_string: () => __wbindgen_debug_string,
  __wbindgen_error_new: () => __wbindgen_error_new,
  __wbindgen_in: () => __wbindgen_in,
  __wbindgen_is_function: () => __wbindgen_is_function,
  __wbindgen_is_object: () => __wbindgen_is_object,
  __wbindgen_is_string: () => __wbindgen_is_string,
  __wbindgen_is_undefined: () => __wbindgen_is_undefined,
  __wbindgen_jsval_loose_eq: () => __wbindgen_jsval_loose_eq,
  __wbindgen_memory: () => __wbindgen_memory,
  __wbindgen_number_get: () => __wbindgen_number_get,
  __wbindgen_number_new: () => __wbindgen_number_new,
  __wbindgen_object_clone_ref: () => __wbindgen_object_clone_ref,
  __wbindgen_object_drop_ref: () => __wbindgen_object_drop_ref,
  __wbindgen_string_get: () => __wbindgen_string_get,
  __wbindgen_string_new: () => __wbindgen_string_new,
  __wbindgen_throw: () => __wbindgen_throw
});
function __wbg_set_wasm(val) {
  wasm = val;
}
function getObject(idx) {
  return heap[idx];
}
function dropObject(idx) {
  if (idx < 132)
    return;
  heap[idx] = heap_next;
  heap_next = idx;
}
function takeObject(idx) {
  const ret = getObject(idx);
  dropObject(idx);
  return ret;
}
function getUint8Memory0() {
  if (cachedUint8Memory0 === null || cachedUint8Memory0.byteLength === 0) {
    cachedUint8Memory0 = new Uint8Array(wasm.memory.buffer);
  }
  return cachedUint8Memory0;
}
function passStringToWasm0(arg, malloc, realloc) {
  if (realloc === void 0) {
    const buf = cachedTextEncoder.encode(arg);
    const ptr2 = malloc(buf.length, 1) >>> 0;
    getUint8Memory0().subarray(ptr2, ptr2 + buf.length).set(buf);
    WASM_VECTOR_LEN = buf.length;
    return ptr2;
  }
  let len = arg.length;
  let ptr = malloc(len, 1) >>> 0;
  const mem = getUint8Memory0();
  let offset = 0;
  for (; offset < len; offset++) {
    const code = arg.charCodeAt(offset);
    if (code > 127)
      break;
    mem[ptr + offset] = code;
  }
  if (offset !== len) {
    if (offset !== 0) {
      arg = arg.slice(offset);
    }
    ptr = realloc(ptr, len, len = offset + arg.length * 3, 1) >>> 0;
    const view = getUint8Memory0().subarray(ptr + offset, ptr + len);
    const ret = encodeString(arg, view);
    offset += ret.written;
  }
  WASM_VECTOR_LEN = offset;
  return ptr;
}
function isLikeNone(x) {
  return x === void 0 || x === null;
}
function getInt32Memory0() {
  if (cachedInt32Memory0 === null || cachedInt32Memory0.byteLength === 0) {
    cachedInt32Memory0 = new Int32Array(wasm.memory.buffer);
  }
  return cachedInt32Memory0;
}
function getStringFromWasm0(ptr, len) {
  ptr = ptr >>> 0;
  return cachedTextDecoder.decode(getUint8Memory0().subarray(ptr, ptr + len));
}
function addHeapObject(obj) {
  if (heap_next === heap.length)
    heap.push(heap.length + 1);
  const idx = heap_next;
  heap_next = heap[idx];
  heap[idx] = obj;
  return idx;
}
function getFloat64Memory0() {
  if (cachedFloat64Memory0 === null || cachedFloat64Memory0.byteLength === 0) {
    cachedFloat64Memory0 = new Float64Array(wasm.memory.buffer);
  }
  return cachedFloat64Memory0;
}
function debugString(val) {
  const type = typeof val;
  if (type == "number" || type == "boolean" || val == null) {
    return `${val}`;
  }
  if (type == "string") {
    return `"${val}"`;
  }
  if (type == "symbol") {
    const description = val.description;
    if (description == null) {
      return "Symbol";
    } else {
      return `Symbol(${description})`;
    }
  }
  if (type == "function") {
    const name = val.name;
    if (typeof name == "string" && name.length > 0) {
      return `Function(${name})`;
    } else {
      return "Function";
    }
  }
  if (Array.isArray(val)) {
    const length = val.length;
    let debug = "[";
    if (length > 0) {
      debug += debugString(val[0]);
    }
    for (let i = 1; i < length; i++) {
      debug += ", " + debugString(val[i]);
    }
    debug += "]";
    return debug;
  }
  const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val));
  let className;
  if (builtInMatches.length > 1) {
    className = builtInMatches[1];
  } else {
    return toString.call(val);
  }
  if (className == "Object") {
    try {
      return "Object(" + JSON.stringify(val) + ")";
    } catch (_) {
      return "Object";
    }
  }
  if (val instanceof Error) {
    return `${val.name}: ${val.message}
${val.stack}`;
  }
  return className;
}
function makeMutClosure(arg0, arg1, dtor, f) {
  const state = { a: arg0, b: arg1, cnt: 1, dtor };
  const real = (...args) => {
    state.cnt++;
    const a = state.a;
    state.a = 0;
    try {
      return f(a, state.b, ...args);
    } finally {
      if (--state.cnt === 0) {
        wasm.__wbindgen_export_2.get(state.dtor)(a, state.b);
      } else {
        state.a = a;
      }
    }
  };
  real.original = state;
  return real;
}
function __wbg_adapter_40(arg0, arg1) {
  wasm.wasm_bindgen__convert__closures__invoke0_mut__h049e4b2574a589ac(arg0, arg1);
}
function __wbg_adapter_43(arg0, arg1, arg2) {
  wasm._dyn_core__ops__function__FnMut__A____Output___R_as_wasm_bindgen__closure__WasmClosure___describe__invoke__h664375554e075ae3(arg0, arg1, addHeapObject(arg2));
}
function _assertClass(instance, klass) {
  if (!(instance instanceof klass)) {
    throw new Error(`expected instance of ${klass.name}`);
  }
  return instance.ptr;
}
function passArray8ToWasm0(arg, malloc) {
  const ptr = malloc(arg.length * 1, 1) >>> 0;
  getUint8Memory0().set(arg, ptr / 1);
  WASM_VECTOR_LEN = arg.length;
  return ptr;
}
function handleError(f, args) {
  try {
    return f.apply(this, args);
  } catch (e) {
    wasm.__wbindgen_exn_store(addHeapObject(e));
  }
}
function __wbg_adapter_144(arg0, arg1, arg2, arg3) {
  wasm.wasm_bindgen__convert__closures__invoke2_mut__h35a3737c9c8313d7(arg0, arg1, addHeapObject(arg2), addHeapObject(arg3));
}
function __wbindgen_object_drop_ref(arg0) {
  takeObject(arg0);
}
function __wbg_recovererror_new(arg0) {
  const ret = RecoverError.__wrap(arg0);
  return addHeapObject(ret);
}
function __wbindgen_cb_drop(arg0) {
  const obj = takeObject(arg0).original;
  if (obj.cnt-- == 1) {
    obj.a = 0;
    return true;
  }
  const ret = false;
  return ret;
}
function __wbindgen_string_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "string" ? obj : void 0;
  var ptr1 = isLikeNone(ret) ? 0 : passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  var len1 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len1;
  getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}
function __wbindgen_is_string(arg0) {
  const ret = typeof getObject(arg0) === "string";
  return ret;
}
function __wbindgen_is_object(arg0) {
  const val = getObject(arg0);
  const ret = typeof val === "object" && val !== null;
  return ret;
}
function __wbindgen_is_undefined(arg0) {
  const ret = getObject(arg0) === void 0;
  return ret;
}
function __wbindgen_in(arg0, arg1) {
  const ret = getObject(arg0) in getObject(arg1);
  return ret;
}
function __wbindgen_error_new(arg0, arg1) {
  const ret = new Error(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_fetch_edb546a0ab30aba2(arg0) {
  const ret = fetch(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_setTimeout_de06f469be594d94() {
  return handleError(function(arg0, arg1) {
    const ret = setTimeout(getObject(arg0), arg1);
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_JuiceboxGetAuthToken_b281475283f56b2c() {
  return handleError(function(arg0) {
    const ret = JuiceboxGetAuthToken(takeObject(arg0));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_new_abda76e883ba8a5f() {
  const ret = new Error();
  return addHeapObject(ret);
}
function __wbg_stack_658279fe44541cf6(arg0, arg1) {
  const ret = getObject(arg1).stack;
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len1;
  getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}
function __wbg_error_f851667af71bcfc6(arg0, arg1) {
  let deferred0_0;
  let deferred0_1;
  try {
    deferred0_0 = arg0;
    deferred0_1 = arg1;
    console.error(getStringFromWasm0(arg0, arg1));
  } finally {
    wasm.__wbindgen_free(deferred0_0, deferred0_1, 1);
  }
}
function __wbg_queueMicrotask_4d890031a6a5a50c(arg0) {
  queueMicrotask(getObject(arg0));
}
function __wbg_queueMicrotask_adae4bc085237231(arg0) {
  const ret = getObject(arg0).queueMicrotask;
  return addHeapObject(ret);
}
function __wbindgen_is_function(arg0) {
  const ret = typeof getObject(arg0) === "function";
  return ret;
}
function __wbindgen_object_clone_ref(arg0) {
  const ret = getObject(arg0);
  return addHeapObject(ret);
}
function __wbindgen_jsval_loose_eq(arg0, arg1) {
  const ret = getObject(arg0) == getObject(arg1);
  return ret;
}
function __wbindgen_boolean_get(arg0) {
  const v = getObject(arg0);
  const ret = typeof v === "boolean" ? v ? 1 : 0 : 2;
  return ret;
}
function __wbindgen_number_get(arg0, arg1) {
  const obj = getObject(arg1);
  const ret = typeof obj === "number" ? obj : void 0;
  getFloat64Memory0()[arg0 / 8 + 1] = isLikeNone(ret) ? 0 : ret;
  getInt32Memory0()[arg0 / 4 + 0] = !isLikeNone(ret);
}
function __wbindgen_as_number(arg0) {
  const ret = +getObject(arg0);
  return ret;
}
function __wbindgen_number_new(arg0) {
  const ret = arg0;
  return addHeapObject(ret);
}
function __wbindgen_string_new(arg0, arg1) {
  const ret = getStringFromWasm0(arg0, arg1);
  return addHeapObject(ret);
}
function __wbg_getwithrefkey_4a92a5eca60879b9(arg0, arg1) {
  const ret = getObject(arg0)[getObject(arg1)];
  return addHeapObject(ret);
}
function __wbg_now_0343d9c3e0e8eedc() {
  const ret = Date.now();
  return ret;
}
function __wbg_now_b724952e890dc703(arg0) {
  const ret = getObject(arg0).now();
  return ret;
}
function __wbg_headers_d135d2bb8cc60413(arg0) {
  const ret = getObject(arg0).headers;
  return addHeapObject(ret);
}
function __wbg_newwithstrandinit_f581dff0d19a8b03() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = new Request(getStringFromWasm0(arg0, arg1), getObject(arg2));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_set_27f236f6d7a28c29() {
  return handleError(function(arg0, arg1, arg2, arg3, arg4) {
    getObject(arg0).set(getStringFromWasm0(arg1, arg2), getStringFromWasm0(arg3, arg4));
  }, arguments);
}
function __wbg_arrayBuffer_a9d862b05aaee2f9(arg0) {
  const ret = getObject(arg0).arrayBuffer();
  return addHeapObject(ret);
}
function __wbg_instanceof_Response_4c3b1446206114d1(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Response;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_status_d6d47ad2837621eb(arg0) {
  const ret = getObject(arg0).status;
  return ret;
}
function __wbg_headers_24def508a7518df9(arg0) {
  const ret = getObject(arg0).headers;
  return addHeapObject(ret);
}
function __wbg_blob_c6537f3e31e66dad() {
  return handleError(function(arg0) {
    const ret = getObject(arg0).blob();
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_crypto_58f13aa23ffcb166(arg0) {
  const ret = getObject(arg0).crypto;
  return addHeapObject(ret);
}
function __wbg_process_5b786e71d465a513(arg0) {
  const ret = getObject(arg0).process;
  return addHeapObject(ret);
}
function __wbg_versions_c2ab80650590b6a2(arg0) {
  const ret = getObject(arg0).versions;
  return addHeapObject(ret);
}
function __wbg_node_523d7bd03ef69fba(arg0) {
  const ret = getObject(arg0).node;
  return addHeapObject(ret);
}
function __wbg_msCrypto_abcb1295e768d1f2(arg0) {
  const ret = getObject(arg0).msCrypto;
  return addHeapObject(ret);
}
function __wbg_require_2784e593a4674877() {
  return handleError(function() {
    const ret = module.require;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_randomFillSync_a0d98aa11c81fe89() {
  return handleError(function(arg0, arg1) {
    getObject(arg0).randomFillSync(takeObject(arg1));
  }, arguments);
}
function __wbg_getRandomValues_504510b5564925af() {
  return handleError(function(arg0, arg1) {
    getObject(arg0).getRandomValues(getObject(arg1));
  }, arguments);
}
function __wbg_get_f01601b5a68d10e3(arg0, arg1) {
  const ret = getObject(arg0)[arg1 >>> 0];
  return addHeapObject(ret);
}
function __wbg_length_1009b1af0c481d7b(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}
function __wbg_newnoargs_c62ea9419c21fbac(arg0, arg1) {
  const ret = new Function(getStringFromWasm0(arg0, arg1));
  return addHeapObject(ret);
}
function __wbg_next_9b877f231f476d01(arg0) {
  const ret = getObject(arg0).next;
  return addHeapObject(ret);
}
function __wbg_next_6529ee0cca8d57ed() {
  return handleError(function(arg0) {
    const ret = getObject(arg0).next();
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_done_5fe336b092d60cf2(arg0) {
  const ret = getObject(arg0).done;
  return ret;
}
function __wbg_value_0c248a78fdc8e19f(arg0) {
  const ret = getObject(arg0).value;
  return addHeapObject(ret);
}
function __wbg_iterator_db7ca081358d4fb2() {
  const ret = Symbol.iterator;
  return addHeapObject(ret);
}
function __wbg_get_7b48513de5dc5ea4() {
  return handleError(function(arg0, arg1) {
    const ret = Reflect.get(getObject(arg0), getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_call_90c26b09837aba1c() {
  return handleError(function(arg0, arg1) {
    const ret = getObject(arg0).call(getObject(arg1));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_new_9fb8d994e1c0aaac() {
  const ret = new Object();
  return addHeapObject(ret);
}
function __wbg_self_f0e34d89f33b99fd() {
  return handleError(function() {
    const ret = self.self;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_window_d3b084224f4774d7() {
  return handleError(function() {
    const ret = window.window;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_globalThis_9caa27ff917c6860() {
  return handleError(function() {
    const ret = globalThis.globalThis;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_global_35dfdd59a4da3e74() {
  return handleError(function() {
    const ret = global.global;
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_from_71add2e723d1f1b2(arg0) {
  const ret = Array.from(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_isArray_74fb723e24f76012(arg0) {
  const ret = Array.isArray(getObject(arg0));
  return ret;
}
function __wbg_instanceof_ArrayBuffer_e7d53d51371448e2(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof ArrayBuffer;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_call_5da1969d7cd31ccd() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = getObject(arg0).call(getObject(arg1), getObject(arg2));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_isSafeInteger_f93fde0dca9820f8(arg0) {
  const ret = Number.isSafeInteger(getObject(arg0));
  return ret;
}
function __wbg_entries_9e2e2aa45aa5094a(arg0) {
  const ret = Object.entries(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_new_60f57089c7563e81(arg0, arg1) {
  try {
    var state0 = { a: arg0, b: arg1 };
    var cb0 = (arg02, arg12) => {
      const a = state0.a;
      state0.a = 0;
      try {
        return __wbg_adapter_144(a, state0.b, arg02, arg12);
      } finally {
        state0.a = a;
      }
    };
    const ret = new Promise(cb0);
    return addHeapObject(ret);
  } finally {
    state0.a = state0.b = 0;
  }
}
function __wbg_resolve_6e1c6553a82f85b7(arg0) {
  const ret = Promise.resolve(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_then_3ab08cd4fbb91ae9(arg0, arg1) {
  const ret = getObject(arg0).then(getObject(arg1));
  return addHeapObject(ret);
}
function __wbg_then_8371cc12cfedc5a2(arg0, arg1, arg2) {
  const ret = getObject(arg0).then(getObject(arg1), getObject(arg2));
  return addHeapObject(ret);
}
function __wbg_buffer_a448f833075b71ba(arg0) {
  const ret = getObject(arg0).buffer;
  return addHeapObject(ret);
}
function __wbg_newwithbyteoffsetandlength_d0482f893617af71(arg0, arg1, arg2) {
  const ret = new Uint8Array(getObject(arg0), arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}
function __wbg_new_8f67e318f15d7254(arg0) {
  const ret = new Uint8Array(getObject(arg0));
  return addHeapObject(ret);
}
function __wbg_set_2357bf09366ee480(arg0, arg1, arg2) {
  getObject(arg0).set(getObject(arg1), arg2 >>> 0);
}
function __wbg_length_1d25fa9e4ac21ce7(arg0) {
  const ret = getObject(arg0).length;
  return ret;
}
function __wbg_instanceof_Uint8Array_bced6f43aed8c1aa(arg0) {
  let result;
  try {
    result = getObject(arg0) instanceof Uint8Array;
  } catch (_) {
    result = false;
  }
  const ret = result;
  return ret;
}
function __wbg_newwithlength_6c2df9e2f3028c43(arg0) {
  const ret = new Uint8Array(arg0 >>> 0);
  return addHeapObject(ret);
}
function __wbg_subarray_2e940e41c0f5a1d9(arg0, arg1, arg2) {
  const ret = getObject(arg0).subarray(arg1 >>> 0, arg2 >>> 0);
  return addHeapObject(ret);
}
function __wbg_stringify_e1b19966d964d242() {
  return handleError(function(arg0) {
    const ret = JSON.stringify(getObject(arg0));
    return addHeapObject(ret);
  }, arguments);
}
function __wbg_set_759f75cd92b612d2() {
  return handleError(function(arg0, arg1, arg2) {
    const ret = Reflect.set(getObject(arg0), getObject(arg1), getObject(arg2));
    return ret;
  }, arguments);
}
function __wbindgen_debug_string(arg0, arg1) {
  const ret = debugString(getObject(arg1));
  const ptr1 = passStringToWasm0(ret, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
  const len1 = WASM_VECTOR_LEN;
  getInt32Memory0()[arg0 / 4 + 1] = len1;
  getInt32Memory0()[arg0 / 4 + 0] = ptr1;
}
function __wbindgen_throw(arg0, arg1) {
  throw new Error(getStringFromWasm0(arg0, arg1));
}
function __wbindgen_memory() {
  const ret = wasm.memory;
  return addHeapObject(ret);
}
function __wbindgen_closure_wrapper610(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 123, __wbg_adapter_40);
  return addHeapObject(ret);
}
function __wbindgen_closure_wrapper901(arg0, arg1, arg2) {
  const ret = makeMutClosure(arg0, arg1, 217, __wbg_adapter_43);
  return addHeapObject(ret);
}
var wasm, heap, heap_next, WASM_VECTOR_LEN, cachedUint8Memory0, lTextEncoder, cachedTextEncoder, encodeString, cachedInt32Memory0, lTextDecoder, cachedTextDecoder, cachedFloat64Memory0, RegisterError, DeleteError, RecoverErrorReason, AuthTokenGenerator, Client, Configuration, RecoverError;
var init_juicebox_sdk_bg = __esm({
  "node_modules/juicebox-sdk/juicebox-sdk_bg.js"() {
    heap = new Array(128).fill(void 0);
    heap.push(void 0, null, true, false);
    heap_next = heap.length;
    WASM_VECTOR_LEN = 0;
    cachedUint8Memory0 = null;
    lTextEncoder = typeof TextEncoder === "undefined" ? (0, module.require)("util").TextEncoder : TextEncoder;
    cachedTextEncoder = new lTextEncoder("utf-8");
    encodeString = typeof cachedTextEncoder.encodeInto === "function" ? function(arg, view) {
      return cachedTextEncoder.encodeInto(arg, view);
    } : function(arg, view) {
      const buf = cachedTextEncoder.encode(arg);
      view.set(buf);
      return {
        read: arg.length,
        written: buf.length
      };
    };
    cachedInt32Memory0 = null;
    lTextDecoder = typeof TextDecoder === "undefined" ? (0, module.require)("util").TextDecoder : TextDecoder;
    cachedTextDecoder = new lTextDecoder("utf-8", { ignoreBOM: true, fatal: true });
    cachedTextDecoder.decode();
    cachedFloat64Memory0 = null;
    RegisterError = Object.freeze({
      /**
      * A realm rejected the `Client`'s auth token.
      */
      InvalidAuth: 0,
      "0": "InvalidAuth",
      /**
      * The SDK software is too old to communicate with this realm
      * and must be upgraded.
      */
      UpgradeRequired: 1,
      "1": "UpgradeRequired",
      /**
      * The tenant has exceeded their allowed number of operations. Try again
      * later.
      */
      RateLimitExceeded: 2,
      "2": "RateLimitExceeded",
      /**
      * A software error has occurred. This request should not be retried
      * with the same parameters. Verify your inputs, check for software
      * updates and try again.
      */
      Assertion: 3,
      "3": "Assertion",
      /**
      * A transient error in sending or receiving requests to a realm.
      * This request may succeed by trying again with the same parameters.
      */
      Transient: 4,
      "4": "Transient"
    });
    DeleteError = Object.freeze({
      /**
      * A realm rejected the `Client`'s auth token.
      */
      InvalidAuth: 0,
      "0": "InvalidAuth",
      /**
      * The SDK software is too old to communicate with this realm
      * and must be upgraded.
      */
      UpgradeRequired: 1,
      "1": "UpgradeRequired",
      /**
      * The tenant has exceeded their allowed number of operations. Try again
      * later.
      */
      RateLimitExceeded: 2,
      "2": "RateLimitExceeded",
      /**
      * A software error has occurred. This request should not be retried
      * with the same parameters. Verify your inputs, check for software
      * updates and try again.
      */
      Assertion: 3,
      "3": "Assertion",
      /**
      * A transient error in sending or receiving requests to a realm.
      * This request may succeed by trying again with the same parameters.
      */
      Transient: 4,
      "4": "Transient"
    });
    RecoverErrorReason = Object.freeze({
      /**
      * The secret could not be unlocked, but you can try again
      * with a different PIN if you have guesses remaining. If no
      * guesses remain, this secret is locked and inaccessible.
      */
      InvalidPin: 0,
      "0": "InvalidPin",
      /**
      * The secret was not registered or not fully registered with the
      * provided realms.
      */
      NotRegistered: 1,
      "1": "NotRegistered",
      /**
      * A realm rejected the `Client`'s auth token.
      */
      InvalidAuth: 2,
      "2": "InvalidAuth",
      /**
      * The SDK software is too old to communicate with this realm
      * and must be upgraded.
      */
      UpgradeRequired: 3,
      "3": "UpgradeRequired",
      /**
      * The tenant has exceeded their allowed number of operations. Try again
      * later.
      */
      RateLimitExceeded: 4,
      "4": "RateLimitExceeded",
      /**
      * A software error has occurred. This request should not be retried
      * with the same parameters. Verify your inputs, check for software
      * updates and try again.
      */
      Assertion: 5,
      "5": "Assertion",
      /**
      * A transient error in sending or receiving requests to a realm.
      * This request may succeed by trying again with the same parameters.
      */
      Transient: 6,
      "6": "Transient"
    });
    AuthTokenGenerator = class {
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_authtokengenerator_free(ptr);
      }
      /**
      * Constructs a new generator from an Object.
      *
      * The provided Object must contain the following parameters:
      *
      * - `key`: A hex string representing the private signing key.
      *
      * - `tenant`: The name of the tenant the key belongs to.
      *
      * - `version`: The integer version of the signing key.
      *
      * An example generator looks like:
      * ```js
      * const generator = new AuthTokenGenerator({
      *     "key": "0668e97c5d282a08d4251255541845e2d78b78b9438e1562b51d9cf4e099be53",
      *     "tenant": "acme",
      *     "version": 1
      *   });
      * ```
      * @param {any} value
      */
      constructor(value) {
        const ret = wasm.authtokengenerator_new(addHeapObject(value));
        this.__wbg_ptr = ret >>> 0;
        return this;
      }
      /**
      * @param {string} realm_id
      * @param {string} secret_id
      * @returns {string}
      */
      vend(realm_id, secret_id) {
        let deferred3_0;
        let deferred3_1;
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          const ptr0 = passStringToWasm0(realm_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          const len0 = WASM_VECTOR_LEN;
          const ptr1 = passStringToWasm0(secret_id, wasm.__wbindgen_malloc, wasm.__wbindgen_realloc);
          const len1 = WASM_VECTOR_LEN;
          wasm.authtokengenerator_vend(retptr, this.__wbg_ptr, ptr0, len0, ptr1, len1);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          deferred3_0 = r0;
          deferred3_1 = r1;
          return getStringFromWasm0(r0, r1);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
          wasm.__wbindgen_free(deferred3_0, deferred3_1, 1);
        }
      }
      /**
      * @returns {string}
      */
      static random_secret_id() {
        let deferred1_0;
        let deferred1_1;
        try {
          const retptr = wasm.__wbindgen_add_to_stack_pointer(-16);
          wasm.authtokengenerator_random_secret_id(retptr);
          var r0 = getInt32Memory0()[retptr / 4 + 0];
          var r1 = getInt32Memory0()[retptr / 4 + 1];
          deferred1_0 = r0;
          deferred1_1 = r1;
          return getStringFromWasm0(r0, r1);
        } finally {
          wasm.__wbindgen_add_to_stack_pointer(16);
          wasm.__wbindgen_free(deferred1_0, deferred1_1, 1);
        }
      }
    };
    Client = class {
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_client_free(ptr);
      }
      /**
      * Initializes a new client with the provided configuration.
      *
      * A `Client` requires authentication, which is acquired through
      * a `JuiceboxGetAuthToken(realmId: Uint8Array): Promise<string>`
      * that you must define globally.
      *
      * @param {Configuration} configuration - Represents the current configuration.
      * The configuration provided must include at least one `Realm`.
      * @param {Configuration[]} previous_configurations - Represents any other
      * configurations you have previously registered with that you may not yet
      * have migrated the data from. During {@link Client#recover}, they will be
      * tried if the current user has not yet registered on the current configuration.
      * These should be ordered from most recently to least recently used.
      */
      constructor(configuration, previous_configurations) {
        _assertClass(configuration, Configuration);
        var ptr0 = configuration.__destroy_into_raw();
        const ret = wasm.client_new(ptr0, addHeapObject(previous_configurations));
        this.__wbg_ptr = ret >>> 0;
        return this;
      }
      /**
      * Stores a new PIN-protected secret on the configured realms.
      *
      * @param {Uint8Array} pin - A user provided PIN. If using a strong
      * `PinHashingMode`, this can safely be a low-entropy value.
      * @param {Uint8Array} secret - A user provided secret with a maximum
      * length of 128-bytes.
      * @param {Uint8Array} info - Additional data added to the salt for the
      * configured `PinHashingMode`.
      * The chosen data must be consistent between registration and recovery or
      * recovery will fail. This data does not need to be a well-kept secret. A
      * user's ID is a reasonable choice, but even the name of the company or
      * service could be viable if nothing else is available.
      * @param {number} num_guesses - The number of guesses allowed before the
      * secret can no longer be accessed.
      *
      * @returns {Promise<void>} – If registration could not be completed successfully,
      * the promise will be rejected with a {@link RegisterError}.
      */
      register(pin, secret, info, num_guesses) {
        const ptr0 = passArray8ToWasm0(pin, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(secret, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ptr2 = passArray8ToWasm0(info, wasm.__wbindgen_malloc);
        const len2 = WASM_VECTOR_LEN;
        const ret = wasm.client_register(this.__wbg_ptr, ptr0, len0, ptr1, len1, ptr2, len2, num_guesses);
        return takeObject(ret);
      }
      /**
      * Retrieves a PIN-protected secret from the configured realms, or falls back to the
      * previous realms if the current realms do not have any secret registered.
      *
      * @param {Uint8Array} pin - A user provided PIN. If using a strong `PinHashingMode`,
      * this can safely be a low-entropy value.
      * @param {Uint8Array} info - Additional data added to the salt for the configured
      * `PinHashingMode`.
      * The chosen data must be consistent between registration and recovery or recovery
      * will fail. This data does not need to be a well-kept secret. A user's ID is a reasonable
      * choice, but even the name of the company or service could be viable if nothing else
      * is available.
      *
      * @returns {Promise<Uint8Array>} - The recovered user provided secret. If recovery could not
      * be completed successfully, the promise will be rejected with a {@link RecoverError}.
      */
      recover(pin, info) {
        const ptr0 = passArray8ToWasm0(pin, wasm.__wbindgen_malloc);
        const len0 = WASM_VECTOR_LEN;
        const ptr1 = passArray8ToWasm0(info, wasm.__wbindgen_malloc);
        const len1 = WASM_VECTOR_LEN;
        const ret = wasm.client_recover(this.__wbg_ptr, ptr0, len0, ptr1, len1);
        return takeObject(ret);
      }
      /**
      * Deletes the registered secret for this user, if any.
      *
      * @returns {Promise<void>} - If delete could not be completed successfully, the promise will
      * be rejected with a {@link DeleteError}.
      */
      delete() {
        const ret = wasm.client_delete(this.__wbg_ptr);
        return takeObject(ret);
      }
    };
    Configuration = class {
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_configuration_free(ptr);
      }
      /**
      * Constructs a new configuration from an Object.
      *
      * The provided Object must contain the following parameters:
      *
      * - `realms`: An array of remote services that the client interacts with.
      *
      * Each `realm` is itself an Object containing an: id, address, and optionally a public_key.
      *
      * There must be between `registerThreshold` and 255
      * realms, inclusive.
      * - `registerThreshold`: A registration will be considered successful if it's successful
      * on at least this many realms.
      *
      * Must be between `recoverThreshold` and `realms.count`, inclusive.
      * - `recoverThreshold`: A recovery (or an adversary) will need the cooperation of this
      * many realms to retrieve the secret.
      *
      * Must be between `ceil(realms.count / 2)` and `realms.count`, inclusive.
      * - `pinHashingMode`: Defines how the provided PIN will be hashed before register and
      * recover operations. Changing modes will make previous secrets stored on the realms
      * inaccessible with the same PIN and should not be done without re-registering secrets.
      *
      * Possible pinHashingModes are:
      * - `Standard2019` - A tuned hash, secure for use on modern devices as of 2019 with low-entropy PINs.
      * - `FastInsecure` - A fast hash used for testing. Do not use in production.
      *
      * An example configuration looks like:
      * ```js
      * const configuration = new Configuration({
      *     realms: [
      *         {
      *             "address": "https://juicebox.hsm.realm.address",
      *             "id": "0102030405060708090a0b0c0d0e0f10",
      *             "public_key": "0102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f20"
      *         },
      *         {
      *             "address": "https://your.software.realm.address",
      *             "id": "2102030405060708090a0b0c0d0e0f10"
      *         },
      *         {
      *             "address": "https://juicebox.software.realm.address",
      *             "id": "3102030405060708090a0b0c0d0e0f10"
      *         }
      *     ],
      *     register_threshold: 3,
      *     recover_threshold: 3,
      *     pin_hashing_mode: "Standard2019"
      * });
      * ```
      * @param {any} value
      */
      constructor(value) {
        const ret = wasm.configuration_new(addHeapObject(value));
        this.__wbg_ptr = ret >>> 0;
        return this;
      }
    };
    RecoverError = class _RecoverError {
      static __wrap(ptr) {
        ptr = ptr >>> 0;
        const obj = Object.create(_RecoverError.prototype);
        obj.__wbg_ptr = ptr;
        return obj;
      }
      __destroy_into_raw() {
        const ptr = this.__wbg_ptr;
        this.__wbg_ptr = 0;
        return ptr;
      }
      free() {
        const ptr = this.__destroy_into_raw();
        wasm.__wbg_recovererror_free(ptr);
      }
      /**
      * The reason recovery failed.
      * @returns {RecoverErrorReason}
      */
      get reason() {
        const ret = wasm.__wbg_get_recovererror_reason(this.__wbg_ptr);
        return ret;
      }
      /**
      * The reason recovery failed.
      * @param {RecoverErrorReason} arg0
      */
      set reason(arg0) {
        wasm.__wbg_set_recovererror_reason(this.__wbg_ptr, arg0);
      }
      /**
      * Guesses remaining is only valid if `reason` is `InvalidPin`
      * @returns {number | undefined}
      */
      get guesses_remaining() {
        const ret = wasm.__wbg_get_recovererror_guesses_remaining(this.__wbg_ptr);
        return ret === 16777215 ? void 0 : ret;
      }
      /**
      * Guesses remaining is only valid if `reason` is `InvalidPin`
      * @param {number | undefined} [arg0]
      */
      set guesses_remaining(arg0) {
        wasm.__wbg_set_recovererror_guesses_remaining(this.__wbg_ptr, isLikeNone(arg0) ? 16777215 : arg0);
      }
    };
  }
});

// js/xchat-crypto.js
var require_xchat_crypto = __commonJS({
  "js/xchat-crypto.js"(exports2, module2) {
    var crypto = require("crypto");
    var fs = require("fs");
    var path = require("path");
    var nacl = require_nacl_fast();
    var wasmReady = null;
    function sha256(buffer) {
      return crypto.createHash("sha256").update(buffer).digest();
    }
    function toRawBlob(wrapped) {
      let blob = Buffer.isBuffer(wrapped) ? wrapped : Buffer.from(String(wrapped || ""), "base64");
      const asText = blob.toString("latin1");
      if (/^[A-Za-z0-9+/=\s]+$/.test(asText) && asText.length >= 44) {
        blob = Buffer.from(asText.replace(/\s+/g, ""), "base64");
      }
      return blob;
    }
    function unwrapConversationKey(identityPrivate, wrapped) {
      const blob = toRawBlob(wrapped);
      const ephemeral = blob.subarray(0, 65);
      const ciphertext = blob.subarray(65);
      const ecdh = crypto.createECDH("prime256v1");
      ecdh.setPrivateKey(identityPrivate);
      const shared = ecdh.computeSecret(ephemeral);
      const derived = sha256(Buffer.concat([shared, Buffer.from([0, 0, 0, 1]), ephemeral]));
      const decipher = crypto.createDecipheriv("aes-128-gcm", derived.subarray(0, 16), derived.subarray(16, 32));
      decipher.setAuthTag(ciphertext.subarray(ciphertext.length - 16));
      return Buffer.concat([decipher.update(ciphertext.subarray(0, ciphertext.length - 16)), decipher.final()]);
    }
    function openSealed(conversationKey, sealed) {
      const nonce = sealed.subarray(0, 24);
      const body = sealed.subarray(24);
      const plain = nacl.secretbox.open(body, nonce, conversationKey);
      if (!plain)
        throw new Error("secretbox open failed");
      return Buffer.from(plain);
    }
    function conversationKeysFromItem(item, identityPrivate, userId) {
      const keys = {};
      const events = item && item.latest_conversation_key_change_events;
      if (!Array.isArray(events))
        return keys;
      for (const eventBase64 of events) {
        let event;
        try {
          event = require_thrift().decode(eventBase64);
        } catch (error) {
          continue;
        }
        const change = event && event[7] && event[7][3];
        if (!change)
          continue;
        const version = require_thrift().text(change[1]);
        const participants = change[2] || [];
        for (const participant of participants || []) {
          const participantId = require_thrift().text(participant[1]);
          const wrapped = participant[2];
          if (!participantId || !wrapped)
            continue;
          if (userId && participantId !== String(userId))
            continue;
          try {
            keys[version] = unwrapConversationKey(identityPrivate, wrapped);
          } catch (error) {
          }
          break;
        }
      }
      return keys;
    }
    function decryptEvent(event, keys, viewerId) {
      const thrift = require_thrift();
      const detail = event[7] || {};
      const create = detail[1];
      if (!create)
        return null;
      const plain = create[101] === void 0;
      const version = thrift.text(create[101]) || "";
      const key = keys[version];
      let holder = null;
      try {
        const contents = create[100];
        holder = plain ? thrift.decode(contents.toString("base64")) : thrift.decode(openSealed(key, contents).toString("base64"));
      } catch (error) {
        return null;
      }
      const entry = holder && holder[1];
      if (!entry) {
        lastShape = "no-entry " + shapeOf(holder);
        return null;
      }
      lastShape = shapeOf(holder);
      const text = pickText(holder, entry);
      if (!text && !lastShapeFull)
        lastShapeFull = shapeOf(holder, 5);
      return {
        sequenceId: thrift.text(event[1]) || "",
        senderId: thrift.text(event[3]) || "",
        text,
        time: readTime(event) || findTime(event),
        own: throttleSafeBoolean(event, viewerId)
      };
    }
    var lastShape = "";
    var lastShapeFull = "";
    function readTime(event) {
      const candidates = [event && event[6], event && event[2], event && event[7] && event[7][12] && event[7][12][2]];
      for (const candidate of candidates) {
        const number = Number(typeof candidate === "string" ? candidate.trim() : candidate);
        if (/^\d{13}$/.test(String(typeof candidate === "string" ? candidate.trim() : candidate)) && number >= 12e11 && number <= 19e11) {
          return number;
        }
      }
      return 0;
    }
    function findTime(node, depth = 0) {
      if (depth > 4 || node === void 0 || node === null)
        return 0;
      if (typeof node === "number" || typeof node === "bigint") {
        const value = Number(node);
        return value >= 12e11 && value <= 19e11 ? value : 0;
      }
      if (typeof node === "string") {
        const value = Number(node);
        return /^\d{13}$/.test(node) && value >= 12e11 && value <= 19e11 ? value : 0;
      }
      if (typeof node !== "object")
        return 0;
      for (const value of Object.values(node)) {
        const found = findTime(value, depth + 1);
        if (found)
          return found;
      }
      return 0;
    }
    function getLastShape() {
      return { short: lastShape, full: lastShapeFull };
    }
    function shapeOf(node, depth = 2) {
      if (node === void 0 || node === null)
        return "nil";
      if (Buffer.isBuffer(node))
        return "buf:" + node.length;
      if (typeof node === "string")
        return "str:" + node.length;
      if (typeof node !== "object")
        return typeof node;
      if (depth <= 0)
        return "obj";
      const parts = [];
      for (const key of Object.keys(node).slice(0, 6)) {
        parts.push(key + "=" + shapeOf(node[key], depth - 1));
      }
      return "{" + parts.join(",") + "}";
    }
    function pickText(holder, entry) {
      const thrift = require_thrift();
      const found = [];
      const walk = (node, depth) => {
        if (depth > 8 || node === void 0 || node === null)
          return;
        if (Buffer.isBuffer(node)) {
          const value = node.toString("utf8");
          if (value && !value.includes("\uFFFD") && value.trim())
            found.push(value);
          return;
        }
        if (typeof node !== "object")
          return;
        for (const value of Object.values(node))
          walk(value, depth + 1);
      };
      walk(entry, 0);
      if (!found.length)
        return "";
      return found.sort((a, b) => b.length - a.length)[0];
    }
    function throttleSafeBoolean(event, viewerId) {
      const sender = require_thrift().text(event[3]);
      return !!viewerId && sender === String(viewerId);
    }
    function tweetLinksIn(text) {
      const links = [];
      const pattern = /https?:\/\/(?:www\.)?(?:x|twitter)\.com\/(?:#!\/)?([A-Za-z0-9_]+)\/status\/(\d+)/g;
      let match;
      while ((match = pattern.exec(String(text || ""))) !== null) {
        links.push({ screenName: match[1], tweetId: match[2] });
      }
      return links;
    }
    async function loadJuicebox() {
      if (!wasmReady) {
        wasmReady = (async () => {
          const glue = (init_juicebox_sdk_bg(), __toCommonJS(juicebox_sdk_bg_exports));
          const bytes = fs.readFileSync(resolveWasmPath());
          const { instance } = await WebAssembly.instantiate(bytes, { "./juicebox-sdk_bg.js": glue });
          glue.__wbg_set_wasm(instance.exports);
          return glue;
        })();
      }
      return wasmReady;
    }
    function resolveWasmPath() {
      const name = "juicebox-sdk_bg.wasm";
      const candidates = [];
      const push = (dir) => {
        if (dir)
          candidates.push(path.join(dir, name));
      };
      push(path.join(__dirname, "..", "assets"));
      push(path.join(__dirname, "assets"));
      try {
        if (typeof location !== "undefined" && location.href) {
          const raw = decodeURIComponent(new URL(location.href).pathname);
          const normalized = /^\/[A-Za-z]:/.test(raw) ? raw.slice(1) : raw;
          push(path.join(path.dirname(normalized), "assets"));
        }
      } catch (error) {
      }
      push(path.join(process.cwd(), "assets"));
      for (const candidate of candidates) {
        if (fs.existsSync(candidate))
          return candidate;
      }
      throw new Error("\u627E\u4E0D\u5230 juicebox wasm\uFF1A" + candidates.join(" | "));
    }
    async function recoverSecret(pin, config, tokens) {
      const glue = await loadJuicebox();
      const { Client: Client2, Configuration: Configuration2 } = glue;
      const encoder = new TextEncoder();
      globalThis.JuiceboxGetAuthToken = async (realmId) => {
        const raw = Buffer.from(realmId);
        const token = tokens[raw.toString("hex")] || tokens[raw.toString("base64")] || tokens[raw.toString("utf8")] || // 只有一个 realm 时不再纠结 id 的编码形式
        (Object.keys(tokens).length === 1 ? tokens[Object.keys(tokens)[0]] : null);
        if (!token)
          throw new Error("unknown realm " + raw.toString("hex"));
        return token;
      };
      for (const realm of config.realms || []) {
        if (!tokens[realm.id])
          throw new Error("no auth token for realm " + realm.id);
      }
      const client = new Client2(new Configuration2(config), []);
      const secret = await client.recover(encoder.encode(String(pin)), new Uint8Array());
      return Buffer.from(secret);
    }
    module2.exports = {
      recoverSecret,
      unwrapConversationKey,
      openSealed,
      conversationKeysFromItem,
      decryptEvent,
      getLastShape,
      tweetLinksIn,
      sha256
    };
  }
});

// js/twitter-xchat.js
var require_twitter_xchat = __commonJS({
  "js/twitter-xchat.js"(exports2, module2) {
    var { getJson: getJson2 } = require_x_http();
    var thrift = require_thrift();
    var xchatCrypto = require_xchat_crypto();
    var GRAPHQL_URL = "https://x.com/i/api/graphql";
    var QUERY_IDS = {
      GetInitialXChatPageQuery: "Q4Mw0C6YcnjJac21wq-5NA",
      GetInboxPageRequestQuery: "txrXftx8RcSvw9jCjwRZWA",
      GetConversationPageQuery: "GX9ZijkxG8AqRMQVD7hMnQ",
      GetPublicKeysQuery: "C-YphxeIcPLOGtFNGhkuOw"
    };
    var NEWEST_SEQUENCE_ID = "9223372036854775807";
    var MAX_PAGES = 4;
    var MAX_ITEMS = 60;
    function graphqlHeaders(auth) {
      return Object.assign({}, auth.headers, {
        accept: "*/*",
        referer: "https://x.com/i/chat",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
        "x-twitter-active-user": "yes",
        "x-twitter-client-language": "zh-cn"
      });
    }
    function normalizeAvatar(user) {
      const raw = user && user.avatar && user.avatar.image_url || user && user.profile_image_url_https || user && user.profile_image_url || "";
      return typeof raw === "string" ? raw.replace("_normal.", "_200x200.") : "";
    }
    function conversationOf(item, selfId) {
      const detail = item && item.conversation_detail || {};
      const id = String(detail.conversation_id || "");
      if (!id)
        return null;
      const participants = (detail.participants_results || []).map((entry) => entry && entry.result || null).filter(Boolean).map((user) => ({
        id: String(user.rest_id || user.legacy && user.legacy.id_str || ""),
        name: user.core && user.core.name || user.legacy && user.legacy.name || "",
        screenName: user.core && user.core.screen_name || user.legacy && user.legacy.screen_name || "",
        avatar: normalizeAvatar(user)
      }));
      const peers = participants.filter((user) => !selfId || user.id !== selfId);
      const isGroup = detail.__typename === "XChatGroupConversationDetail";
      const first = peers[0] || participants[0] || { id: "", name: "", screenName: "", avatar: "" };
      const name = isGroup ? "\u7FA4\u804A\uFF08" + ((detail.group_members_results || []).length || participants.length) + " \u4EBA\uFF09" : peers.length > 1 ? peers.slice(0, 2).map((user) => user.name || user.screenName).filter(Boolean).join("\u3001") : first.name || first.screenName || "\u672A\u77E5\u804A\u5929";
      const isSelf = !isGroup && !peers.length;
      return {
        id,
        name: isSelf ? "\u6211\u81EA\u5DF1" : name,
        screenName: isGroup ? "" : first.screenName,
        avatar: first.avatar,
        isSelf,
        encrypted: true,
        updatedAt: 0
      };
    }
    async function fetchChatConversations(auth, selfId) {
      const headers = graphqlHeaders(auth);
      const attempts = [];
      let items = [];
      let status = 0;
      try {
        const variables = {
          include_user_public_keys: true,
          include_juicebox_tokens: false,
          message_pull_version: 1
        };
        const url = GRAPHQL_URL + "/" + QUERY_IDS.GetInitialXChatPageQuery + "/GetInitialXChatPageQuery?variables=" + encodeURIComponent(JSON.stringify(variables));
        let result = await getJson2(url, { headers, timeout: 2e4 });
        status = result.status;
        attempts.push({ step: "initial", status: result.status });
        const page = result && result.json && result.json.data && result.json.data.get_initial_chat_page;
        if (result.status !== 200 || !page) {
          return { ok: false, status, items: [], attempts, reason: result.status === 403 ? "\u9700\u8981\u91CD\u65B0\u767B\u5F55 X" : "HTTP " + result.status };
        }
        const collect = (list) => {
          for (const item of list || []) {
            const conversation = conversationOf(item, selfId);
            if (conversation)
              items.push(conversation);
          }
        };
        collect(page.items);
        let cursor = page.inboxCursor;
        for (let index = 0; index < MAX_PAGES - 1 && items.length < MAX_ITEMS; index++) {
          if (!cursor || cursor.__typename !== "XChatGetInboxPageContinueCursor")
            break;
          const nextUrl = GRAPHQL_URL + "/" + QUERY_IDS.GetInboxPageRequestQuery + "/GetInboxPageRequestQuery?variables=" + encodeURIComponent(
            JSON.stringify({ continue_cursor: { cursor_id: cursor.cursor_id, graph_snapshot_id: cursor.graph_snapshot_id } })
          );
          const next = await getJson2(nextUrl, { headers, timeout: 2e4 });
          attempts.push({ step: "page" + (index + 1), status: next.status });
          const nextPage = next && next.json && next.json.data && next.json.data.get_inbox_page;
          if (next.status !== 200 || !nextPage)
            break;
          collect(nextPage.items);
          cursor = nextPage.inboxCursor;
        }
        const now = Date.now();
        items.forEach((item, index) => {
          item.updatedAt = now - index * 1e3;
        });
        return { ok: items.length > 0, status, items: items.slice(0, MAX_ITEMS), attempts };
      } catch (error) {
        return { ok: false, status, items: [], attempts, reason: error && error.message || "error" };
      }
    }
    async function fetchPublicKeys(auth, userId) {
      const url = GRAPHQL_URL + "/" + QUERY_IDS.GetPublicKeysQuery + "/GetPublicKeysQuery?variables=" + encodeURIComponent(JSON.stringify({ ids: [String(userId)], include_juicebox_tokens: true }));
      const result = await getJson2(url, { headers: graphqlHeaders(auth), timeout: 2e4 });
      const entries = result && result.json && result.json.data && result.json.data.user_results_by_rest_ids;
      if (result.status !== 200 || !Array.isArray(entries) || !entries.length) {
        return { ok: false, status: result.status, reason: "HTTP " + result.status };
      }
      const versions = ((entries[0].result || {}).get_public_keys || {}).public_keys_with_token_map || [];
      if (!versions.length)
        return { ok: false, status: 200, reason: "\u8D26\u53F7\u6CA1\u6709 X Chat \u5BC6\u94A5" };
      const newest = versions.slice().sort((a, b) => Number((b.public_key_with_metadata || {}).version || 0) - Number((a.public_key_with_metadata || {}).version || 0))[0];
      const tokenMap = newest.token_map || {};
      let config = null;
      try {
        config = JSON.parse(tokenMap.key_store_token_map_json || "{}");
      } catch (error) {
        return { ok: false, status: 200, reason: "\u5BC6\u94A5\u914D\u7F6E\u89E3\u6790\u5931\u8D25" };
      }
      const tokens = {};
      for (const entry of tokenMap.token_map || []) {
        if (entry && entry.key && entry.value && entry.value.token)
          tokens[String(entry.key)] = String(entry.value.token);
      }
      return { ok: true, status: 200, config, tokens, version: (newest.public_key_with_metadata || {}).version };
    }
    async function ensureSecret(auth, userId, passcode) {
      const cacheKey = "evd.xchatSecret." + String(userId);
      const failKey = "evd.xchatKeyFail." + String(userId);
      const pinHash = xchatCrypto.sha256(Buffer.from(String(passcode || ""))).toString("hex").slice(0, 16);
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached && cached.length >= 64)
          return { ok: true, secret: Buffer.from(cached, "hex"), cached: true };
        const failed = localStorage.getItem(failKey);
        if (failed && failed.startsWith(pinHash + "|")) {
          return { ok: false, reason: failed.slice(pinHash.length + 1), blocked: true };
        }
      } catch (error) {
      }
      if (!passcode)
        return { ok: false, reason: "\u672A\u586B\u5199\u804A\u5929\u5BC6\u7801" };
      const keys = await fetchPublicKeys(auth, userId);
      if (!keys.ok)
        return keys;
      try {
        const secret = await xchatCrypto.recoverSecret(passcode, keys.config, keys.tokens);
        if (!secret || secret.length < 64)
          return { ok: false, reason: "\u6062\u590D\u51FA\u7684\u5BC6\u94A5\u957F\u5EA6\u5F02\u5E38" };
        try {
          localStorage.setItem(cacheKey, secret.toString("hex"));
          localStorage.removeItem(failKey);
        } catch (error) {
        }
        return { ok: true, secret, cached: false };
      } catch (error) {
        const reasonNumber = error && typeof error.reason === "number" ? error.reason : null;
        const guesses = error && typeof error.guesses_remaining === "number" ? error.guesses_remaining : null;
        const known = {
          0: "\u804A\u5929\u5BC6\u7801\u4E0D\u6B63\u786E" + (guesses !== null ? "\uFF08\u5269\u4F59 " + guesses + " \u6B21\uFF09" : ""),
          1: "\u8FD9\u4E2A\u8D26\u53F7\u6CA1\u6709\u6CE8\u518C\u8FC7 X Chat \u5BC6\u94A5\u5907\u4EFD",
          2: "X \u62D2\u7EDD\u4E86\u8FD9\u6B21\u5BC6\u94A5\u6062\u590D\u7684\u6388\u6743\uFF08Cookie \u53EF\u80FD\u5DF2\u8FC7\u671F\uFF09",
          3: "\u5BC6\u94A5\u6062\u590D\u9700\u8981\u66F4\u65B0\u7248\u672C\u7684\u5BA2\u6237\u7AEF",
          4: "\u5BC6\u94A5\u6062\u590D\u8BF7\u6C42\u88AB\u9650\u6D41\uFF0C\u7A0D\u540E\u518D\u8BD5",
          5: "\u5BC6\u94A5\u6062\u590D\u5185\u90E8\u51FA\u9519\uFF0C\u53C2\u6570\u53EF\u80FD\u4E0D\u5BF9",
          6: "\u8FDE\u63A5\u5BC6\u94A5\u670D\u52A1\u5668\u5931\u8D25\uFF0C\u7A0D\u540E\u91CD\u8BD5"
        };
        const text = known[reasonNumber] || "\u5BC6\u94A5\u6062\u590D\u5931\u8D25\uFF08reason=" + String(reasonNumber) + "\uFF09";
        const detail = {
          reason: reasonNumber,
          guesses,
          realms: keys.config && (keys.config.realms || []).length || 0,
          tokens: Object.keys(keys.tokens || {}).length,
          version: keys.version,
          message: String(error && (error.message || error) || "").slice(0, 200),
          errorName: error && error.constructor && error.constructor.name || typeof error
        };
        try {
          if ([0, 1, 2, 3, 5].indexOf(reasonNumber) !== -1)
            localStorage.setItem(failKey, pinHash + "|" + text);
        } catch (error2) {
        }
        return { ok: false, reason: text, detail };
      }
    }
    async function conversationMessages(auth, item, secret, selfId) {
      const identity = secret.subarray(0, 32);
      const detail = item.conversation_detail || {};
      const conversationId = String(detail.conversation_id || "");
      const keys = xchatCrypto.conversationKeysFromItem(item, identity, selfId);
      const stats = { page: false, status: 0, eventCount: 0, thriftFailed: 0, nullResult: 0, msgCount: 0, keyVersions: [], pages: [], pageKeys: [] };
      const messages = [];
      const seen = /* @__PURE__ */ new Set();
      let cursor = { min_local_sequence_id: NEWEST_SEQUENCE_ID, min_conversation_key_version: "0" };
      for (let round = 0; round < 6; round += 1) {
        const url = GRAPHQL_URL + "/" + QUERY_IDS.GetConversationPageQuery + "/GetConversationPageQuery?variables=" + encodeURIComponent(JSON.stringify(Object.assign({ conversation_id: conversationId }, cursor)));
        const result = await getJson2(url, { headers: graphqlHeaders(auth), timeout: 2e4 });
        const page = result && result.json && result.json.data && result.json.data.get_conversation_page;
        const errors = result && result.json && result.json.errors || [];
        stats.status = result.status;
        if (result.status !== 200 || !page) {
          stats.error = errors[0] && errors[0].message || "\u4F1A\u8BDD\u9875\u4E3A\u7A7A";
          break;
        }
        stats.page = true;
        if (page.message_request_state)
          stats.requestState = page.message_request_state;
        for (const encoded of page.missing_conversation_key_change_events || []) {
          try {
            const event = thrift.decode(encoded);
            const change = event[7] && event[7][3];
            if (!change)
              continue;
            const version = thrift.text(change[1]);
            for (const participant of change[2] || []) {
              if (String(thrift.text(participant[1]) || "") !== String(selfId))
                continue;
              keys[version] = xchatCrypto.unwrapConversationKey(identity, participant[2]);
              break;
            }
          } catch (error) {
          }
        }
        if (!stats.pageKeys.length)
          stats.pageKeys = Object.keys(page).filter((key) => page[key] !== null && !/encoded_message_events|missing_conversation_key/.test(key));
        const events = page.encoded_message_events || [];
        let pageMessageCount = 0;
        let oldest = null;
        for (const encoded of events) {
          stats.eventCount += 1;
          let event;
          try {
            event = thrift.decode(encoded);
          } catch (error) {
            stats.thriftFailed += 1;
            continue;
          }
          const sequenceId = thrift.text(event[1]) || "";
          if (!stats.eventProbe) {
            const probe = {};
            const walk = (node, path, depth) => {
              if (depth > 3 || node === null || node === void 0)
                return;
              if (typeof node === "number" || typeof node === "bigint") {
                if (Number(node) >= 1e12)
                  probe[path] = String(node);
                return;
              }
              if (typeof node === "string") {
                if (/^\d{10,}$/.test(node))
                  probe[path] = node;
                return;
              }
              if (typeof node !== "object" || Buffer.isBuffer(node))
                return;
              for (const key of Object.keys(node))
                walk(node[key], path + "." + key, depth + 1);
            };
            walk(event, "e", 0);
            stats.eventProbe = probe;
          }
          if (sequenceId && (!oldest || sequenceId.length < oldest.length || sequenceId.length === oldest.length && sequenceId < oldest))
            oldest = sequenceId;
          if (seen.has(sequenceId)) {
            stats.nullResult += 1;
            continue;
          }
          const message = xchatCrypto.decryptEvent(event, keys, selfId);
          if (!message) {
            stats.nullResult += 1;
            continue;
          }
          seen.add(sequenceId);
          pageMessageCount += 1;
          stats.msgCount += 1;
          messages.push(message);
        }
        stats.pages.push({ round, events: events.length, messages: pageMessageCount, cursor: String(cursor.min_local_sequence_id || cursor.max_local_sequence_id || "") });
        if (!pageMessageCount || !oldest || pageMessageCount >= events.length)
          break;
        if (stats.msgCount >= 400)
          break;
        let upper = oldest;
        try {
          upper = (BigInt(oldest) - 1n).toString();
        } catch (error) {
          upper = oldest;
        }
        cursor = { min_local_sequence_id: upper, min_conversation_key_version: "0" };
      }
      stats.keyVersions = Object.keys(keys);
      stats.httpCount = messages.filter((message) => /http|status\//.test(message.text || "")).length;
      stats.emptyText = messages.filter((message) => !String(message.text || "").trim()).length;
      stats.times = messages.slice(0, 8).map((message) => ({
        time: message.time ? new Date(message.time).toLocaleString("zh-CN", { hour12: false }).slice(5) : "",
        link: /http|status\//.test(message.text || "")
      }));
      stats.around1716 = messages.filter((message) => {
        if (!message.time)
          return false;
        const local = new Date(message.time);
        const minutes = local.getHours() * 60 + local.getMinutes();
        return Math.abs(minutes - (17 * 60 + 16)) <= 10;
      }).map((message) => ({
        time: new Date(message.time).toLocaleString("zh-CN", { hour12: false }),
        fromPeer: selfId ? message.senderId !== selfId : true,
        link: xchatCrypto.tweetLinksIn(message.text).map((entry) => entry.tweetId)
      }));
      return { ok: true, status: stats.status, items: messages, conversationId, participants: detail.participants_results || [], stats };
    }
    async function fetchChatShares(auth, options = {}) {
      const selfId = String(options.selfId || "");
      const passcode = String(options.passcode || "");
      const since = Number(options.since || 0);
      const selected = (options.conversationIds || []).map(String);
      const norm = (id) => String(id || "").replace(/[:]/g, "-");
      const initial = await fetchChatConversations(auth, selfId);
      if (!initial.ok || !initial.items.length) {
        writeXchatDebug({ ok: false, at: (/* @__PURE__ */ new Date()).toISOString(), stage: "inbox", status: initial.status, reason: initial.reason || "" });
        return { ok: false, status: initial.status, error: initial.reason || "\u8BFB\u53D6\u804A\u5929\u5217\u8868\u5931\u8D25", items: [] };
      }
      const secretResult = await ensureSecret(auth, selfId, passcode);
      if (!secretResult.ok) {
        writeXchatDebug({
          ok: false,
          at: (/* @__PURE__ */ new Date()).toISOString(),
          stage: "key",
          reason: secretResult.reason || "",
          detail: secretResult.detail || null,
          blocked: !!secretResult.blocked,
          hasPasscode: !!passcode
        });
        return { ok: false, status: 0, error: secretResult.reason || "\u5BC6\u94A5\u6062\u590D\u5931\u8D25", items: [] };
      }
      const secret = secretResult.secret;
      const raw = await getJson2(
        GRAPHQL_URL + "/" + QUERY_IDS.GetInitialXChatPageQuery + "/GetInitialXChatPageQuery?variables=" + encodeURIComponent(JSON.stringify({ include_user_public_keys: true, include_juicebox_tokens: false, message_pull_version: 1 })),
        { headers: graphqlHeaders(auth), timeout: 2e4 }
      );
      const rawItems = raw.json && raw.json.data && raw.json.data.get_initial_chat_page && raw.json.data.get_initial_chat_page.items || [];
      const wanted = rawItems.filter((item) => {
        const id = String((item.conversation_detail || {}).conversation_id || "");
        return !selected.length || selected.some((sid) => norm(sid) === norm(id));
      });
      const shares = [];
      const filters = [];
      let totalMessages = 0;
      let totalFromPeer = 0;
      let totalLinks = 0;
      for (const item of wanted) {
        const detail = item.conversation_detail || {};
        const participants = (detail.participants_results || []).map((entry) => entry && entry.result || {});
        const parts = String(detail.conversation_id || "").split(":");
        if (parts.length === 2 && parts[0] === parts[1]) {
          filters.push({ conversationId: String(detail.conversation_id || ""), status: 0, messages: 0, links: 0, skipped: "\u53EA\u6709\u81EA\u5DF1" });
          continue;
        }
        const names = {};
        for (const user of participants) {
          const id = String(user.rest_id || user.legacy && user.legacy.id_str || "");
          names[id] = {
            id,
            name: user.core && user.core.name || user.legacy && user.legacy.name || "",
            screenName: user.core && user.core.screen_name || user.legacy && user.legacy.screen_name || "",
            avatar: normalizeAvatar(user)
          };
        }
        const page = await conversationMessages(auth, item, secret, selfId);
        if (!page.ok) {
          filters.push({
            conversationId: String(detail.conversation_id || ""),
            status: page.status,
            messages: 0,
            links: 0,
            stats: page.stats || null,
            error: page.error || ""
          });
          continue;
        }
        let linkCount = 0;
        let fromPeer = 0;
        const peerLinkIds = [];
        for (const message of page.items) {
          if (selfId && message.senderId === selfId)
            continue;
          if (since && message.time && message.time < since)
            continue;
          fromPeer += 1;
          const links = xchatCrypto.tweetLinksIn(message.text);
          if (!links.length)
            continue;
          linkCount += links.length;
          for (const link of links) {
            peerLinkIds.push(link.tweetId);
            shares.push({
              tweetId: link.tweetId,
              screenName: link.screenName,
              conversationId: page.conversationId,
              sender: names[message.senderId] || { id: message.senderId, name: "", screenName: "", avatar: "" },
              text: message.text
            });
          }
        }
        totalMessages += page.items.length;
        totalFromPeer += fromPeer;
        totalLinks += peerLinkIds.length;
        filters.push({
          conversationId: page.conversationId,
          status: 200,
          peer: (names[Object.keys(names).find((id) => id !== selfId)] || {}).screenName || "",
          messages: page.items.length,
          fromPeer,
          links: linkCount,
          uniqueLinks: new Set(peerLinkIds).size,
          stats: page.stats || null
        });
      }
      const seen = /* @__PURE__ */ new Set();
      const unique = shares.filter((share) => {
        if (seen.has(share.tweetId))
          return false;
        seen.add(share.tweetId);
        return true;
      });
      writeXchatDebug({
        ok: true,
        at: (/* @__PURE__ */ new Date()).toISOString(),
        cachedKey: !!secretResult.cached,
        conversationsAsked: wanted.length,
        conversationsRead: filters.filter((entry) => entry.status === 200).length,
        totalMessages,
        totalFromPeer,
        totalLinks,
        shareCount: unique.length,
        filters
      });
      return { ok: true, items: unique, filters, cached: secretResult.cached };
    }
    function writeXchatDebug(info) {
      try {
        require("fs").writeFileSync(
          require("path").join(process.env.TEMP || require("os").tmpdir(), "evd_xchat_debug.json"),
          JSON.stringify(info, null, 2)
        );
      } catch (error) {
      }
    }
    module2.exports = {
      fetchChatConversations,
      fetchChatShares,
      conversationOf,
      ensureSecret
    };
  }
});

// js/twitter-dm.js
var require_twitter_dm = __commonJS({
  "js/twitter-dm.js"(exports2, module2) {
    var { getJson: getJson2, getRaw } = require_x_http();
    var { fetchChatConversations, fetchChatShares } = require_twitter_xchat();
    var MAX_ITEMS = 30;
    function writeInboxDebug(info) {
      try {
        const fs = require("fs");
        const os = require("os");
        const path = require("path");
        info.at = (/* @__PURE__ */ new Date()).toISOString();
        fs.writeFileSync(path.join(os.tmpdir(), "evd_dm_debug.json"), JSON.stringify(info, null, 2), "utf8");
      } catch (e) {
      }
    }
    function describeError(result) {
      if (result.status === 401 || result.status === 403)
        return "cookie \u65E0\u6548\u6216\u5DF2\u8FC7\u671F";
      if (result.status === 404)
        return "X \u79C1\u4FE1\u63A5\u53E3\u5DF2\u66F4\u65B0";
      if (result.status === 429)
        return "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF08429\uFF09";
      if (result.status === 0)
        return "\u7F51\u7EDC\u9519\u8BEF\uFF08\u53EF\u80FD\u9700\u8981\u4EE3\u7406\uFF09" + (result.error ? "\uFF1A" + result.error : "");
      return "HTTP " + result.status;
    }
    function statusIdOf(url) {
      const matched = String(url || "").match(/\/status(?:es)?\/(\d+)/);
      return matched ? matched[1] : "";
    }
    function walkMessages(node, out, depth) {
      if (!node || depth > 12)
        return;
      if (Array.isArray(node)) {
        for (const item of node)
          walkMessages(item, out, depth + 1);
        return;
      }
      if (typeof node !== "object")
        return;
      if (node.message_data && typeof node.message_data === "object")
        out.push(node);
      for (const key of Object.keys(node)) {
        if (key === "message_data")
          continue;
        walkMessages(node[key], out, depth + 1);
      }
    }
    function findUsers(node, out, depth) {
      if (!node || depth > 10)
        return;
      if (Array.isArray(node)) {
        for (const item of node)
          findUsers(item, out, depth + 1);
        return;
      }
      if (typeof node !== "object")
        return;
      const id = node.id_str || (typeof node.rest_id === "string" ? node.rest_id : "");
      const screenName = node.screen_name || node.screenName;
      if (id && screenName)
        out[id] = node;
      for (const key of Object.keys(node))
        findUsers(node[key], out, depth + 1);
    }
    function senderOf(user, senderId) {
      const avatar = user && (user.profile_image_url_https || user.profile_image_url);
      return {
        id: String(senderId || user && (user.id_str || user.rest_id) || ""),
        name: user && user.name || "",
        screenName: user && (user.screen_name || user.screenName) || "",
        avatar: typeof avatar === "string" ? avatar.replace("_normal.", "_200x200.") : ""
      };
    }
    function extractSharedTweets(json, conversationIds, options) {
      const messages = [];
      walkMessages(json, messages, 0);
      const users = {};
      findUsers(json, users, 0);
      const normId = (id) => String(id || "").replace(/[:]/g, "-");
      const allowed = Array.isArray(conversationIds) && conversationIds.length ? new Set(conversationIds.map((id) => normId(id))) : null;
      const selfId = options && options.selfId ? String(options.selfId) : "";
      const seen = /* @__PURE__ */ new Set();
      const items = [];
      for (const message of messages) {
        const conversationId = String(
          message.conversation_id || message.message_data && message.message_data.conversation_id || ""
        );
        if (allowed && !allowed.has(normId(conversationId)))
          continue;
        const data = message.message_data || {};
        const senderId = String(data.sender_id || "");
        if (allowed && selfId && senderId === selfId)
          continue;
        const urls = data.entities && data.entities.urls || [];
        const text = data.text || "";
        let tweetId = "";
        for (const url of urls) {
          const id = statusIdOf(url && (url.expanded_url || url.url));
          if (id) {
            tweetId = id;
            break;
          }
        }
        if (!tweetId)
          tweetId = statusIdOf(text);
        if (!tweetId || seen.has(tweetId))
          continue;
        seen.add(tweetId);
        const user = users[senderId] || null;
        const createdAt = message.created_at ? Date.parse(message.created_at) : Number(data.time || 0);
        items.push({
          id: tweetId,
          conversationId,
          text,
          createdAt: Number.isFinite(createdAt) ? createdAt : 0,
          sender: senderOf(user, senderId)
        });
      }
      return items.slice(0, MAX_ITEMS);
    }
    function participantIds(node) {
      const raw = node && node.participants;
      const out = [];
      const push = (value) => {
        const id = String(value || "").trim();
        if (/^\d+$/.test(id) && !out.includes(id))
          out.push(id);
      };
      if (Array.isArray(raw)) {
        raw.forEach((participant) => {
          if (typeof participant === "string")
            return push(participant);
          if (participant && participant.user_id)
            return push(participant.user_id);
          if (participant && participant.id)
            return push(participant.id);
          if (participant && participant.id_str)
            return push(participant.id_str);
        });
      } else if (raw && typeof raw === "object") {
        for (const [key, value] of Object.entries(raw)) {
          if (typeof value === "string")
            push(value);
          else if (value && (value.user_id || value.id || value.id_str))
            push(value.user_id || value.id || value.id_str);
          else
            push(key);
        }
      } else if (typeof raw === "string") {
        push(raw);
      }
      return out;
    }
    function idsFromConversationId(conversationId) {
      return String(conversationId || "").split("-").map((part) => part.trim()).filter((part) => /^\d{5,}$/.test(part));
    }
    function extractConversations(json, selfId) {
      const users = {};
      findUsers(json, users, 0);
      let self2 = String(selfId || "");
      const seenNodes = /* @__PURE__ */ new Map();
      const remember = (id, node) => {
        const key = String(id || "");
        if (!key)
          return;
        const previous = seenNodes.get(key);
        if (!previous || !previous.node.participants && node && node.participants) {
          seenNodes.set(key, { node: node || {}, senders: previous ? previous.senders : /* @__PURE__ */ new Set() });
        }
      };
      const CONVERSATION_KEY_RE = /^\d{5,}(-\d{5,})+$/;
      const walk = (node, depth) => {
        if (!node || depth > 10)
          return;
        if (Array.isArray(node)) {
          node.forEach((item) => walk(item, depth + 1));
          return;
        }
        if (typeof node === "string") {
          if (CONVERSATION_KEY_RE.test(node))
            remember(node, null);
          return;
        }
        if (typeof node !== "object")
          return;
        if (node.conversation_id)
          remember(node.conversation_id, node);
        for (const key of Object.keys(node)) {
          const value = node[key];
          if (CONVERSATION_KEY_RE.test(key) && value && typeof value === "object") {
            remember(key, value);
          }
          walk(value, depth + 1);
        }
      };
      walk(json, 0);
      const messages = [];
      walkMessages(json, messages, 0);
      for (const message of messages) {
        const conversationId = String(
          message.conversation_id || message.message_data && message.message_data.conversation_id || ""
        );
        if (!conversationId)
          continue;
        const entry = seenNodes.get(conversationId) || { node: {}, senders: /* @__PURE__ */ new Set() };
        const senderId = String(message.message_data && message.message_data.sender_id || "");
        if (senderId)
          entry.senders.add(senderId);
        seenNodes.set(conversationId, entry);
      }
      if (!self2) {
        const counts = {};
        for (const conversationId of seenNodes.keys()) {
          for (const part of idsFromConversationId(conversationId)) {
            counts[part] = (counts[part] || 0) + 1;
          }
        }
        const shared = Object.keys(counts).filter((id) => counts[id] > 1).sort((a, b) => counts[b] - counts[a])[0];
        let senderCounts = {};
        for (const entry of seenNodes.values()) {
          for (const id of entry.senders)
            senderCounts[id] = (senderCounts[id] || 0) + 1;
        }
        const busiestSender = Object.keys(senderCounts).sort((a, b) => senderCounts[b] - senderCounts[a])[0];
        const onlyOne = seenNodes.size === 1 ? idsFromConversationId(Array.from(seenNodes.keys())[0])[0] : "";
        self2 = String(shared || onlyOne || busiestSender || "");
      }
      const selfProfile = senderOf(users[self2], self2);
      const conversations = [];
      for (const [conversationId, entry] of seenNodes) {
        const node = entry.node || {};
        let ids = participantIds(node);
        if (!ids.length)
          ids = idsFromConversationId(conversationId);
        const peers = ids.filter((id) => id && (!self2 || id !== self2));
        const senders = Array.from(entry.senders).filter((id) => id && (!self2 || id !== self2));
        const peerIds = peers.length ? peers : senders;
        const other = peerIds.map((id) => users[id]).filter(Boolean);
        const fallbackProfile = peerIds[0] ? senderOf(users[peerIds[0]], peerIds[0]) : null;
        const profile = other.length ? senderOf(other[0], peerIds[0]) : fallbackProfile;
        const isSelf = !peerIds.length && (!self2 || ids.includes(self2) || ids.length === 0);
        const name = other.length ? other.slice(0, 2).map((user) => user.name || user.screen_name || "").filter(Boolean).join("\u3001") : isSelf ? "\u6211\u81EA\u5DF1" : profile && (profile.name || profile.screenName) || (peerIds[0] ? "\u597D\u53CB " + String(peerIds[0]).slice(-6) : "\u672A\u77E5\u804A\u5929");
        conversations.push({
          id: conversationId,
          name: name || "\u672A\u77E5\u804A\u5929",
          screenName: isSelf ? selfProfile.screenName : profile && profile.screenName || "",
          avatar: isSelf ? selfProfile.avatar : profile && profile.avatar || "",
          isSelf,
          updatedAt: Number(node.sort_timestamp || node.last_message_time || 0) || 0
        });
      }
      const seen = /* @__PURE__ */ new Set();
      return conversations.filter((item) => {
        if (seen.has(item.id))
          return false;
        seen.add(item.id);
        return true;
      }).sort((a, b) => b.updatedAt - a.updatedAt);
    }
    async function withSenderAvatar(sender) {
      if (!sender || !sender.avatar)
        return sender;
      try {
        const result = await getRaw(sender.avatar, {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            accept: "image/*"
          }
        });
        if (result.status === 200 && result.buffer && result.buffer.length) {
          const type = String(result.contentType || "image/jpeg").split(";")[0];
          const dataUrl = "data:" + type + ";base64," + result.buffer.toString("base64");
          if (dataUrl.length < 4e5)
            sender.avatarData = dataUrl;
        }
      } catch (e) {
      }
      return sender;
    }
    async function fetchDmShares(auth, options = {}) {
      const result = await fetchChatShares(auth, {
        conversationIds: options.conversationIds || [],
        selfId: options.selfId || "",
        passcode: options.passcode || ""
      });
      if (!result.ok) {
        return { ok: false, status: result.status || 0, error: result.error || "\u8BFB\u53D6\u804A\u5929\u5931\u8D25", items: [] };
      }
      const prepared = [];
      for (const item of result.items || []) {
        prepared.push({
          id: item.tweetId,
          conversationId: item.conversationId,
          text: item.text,
          createdAt: 0,
          sender: await withSenderAvatar(item.sender)
        });
      }
      return { ok: true, items: prepared };
    }
    async function fetchConversations(auth, selfId) {
      let xchat = { ok: false, items: [], attempts: [], status: 0, reason: "" };
      try {
        xchat = await fetchChatConversations(auth, selfId);
      } catch (error) {
        xchat = { ok: false, items: [], attempts: [], status: 0, reason: error && error.message || "error" };
      }
      const items = (xchat.items || []).slice(0, 40);
      writeInboxDebug({
        ok: items.length > 0,
        source: "xchat",
        xchatAttempts: xchat.attempts,
        xchatCount: items.length,
        xchatReason: xchat.reason || "",
        selfId: String(selfId || ""),
        itemCount: items.length,
        items: items.map((item) => ({ id: item.id, name: item.name, screenName: item.screenName, isSelf: item.isSelf, encrypted: !!item.encrypted })),
        status: xchat.status || 0
      });
      if (!items.length) {
        return {
          ok: false,
          status: xchat.status || 0,
          error: xchat.reason || describeError({ status: xchat.status || 0 }),
          items: []
        };
      }
      for (let index = 0; index < items.length; index++) {
        if (index >= 24)
          break;
        await withSenderAvatar(items[index]);
      }
      return { ok: true, items };
    }
    module2.exports = {
      fetchDmShares,
      fetchConversations,
      extractSharedTweets,
      extractConversations,
      describeError,
      MAX_ITEMS
    };
  }
});

// js/twitter-monitor.js
var require_twitter_monitor = __commonJS({
  "js/twitter-monitor.js"(exports2, module2) {
    var twitterAuth2 = require_twitter_auth();
    var { getJson: getJson2, getRaw } = require_x_http();
    var { scopedKey } = require_library_context();
    var twitterDm = require_twitter_dm();
    var SEEN_KEY = "Edge-Media-Download-NEW.twitterSeen";
    var ENABLED_KEY = "Edge-Media-Download-NEW.twitterMonitorEnabled";
    var INTERVAL_KEY = "Edge-Media-Download-NEW.twitterMonitorInterval";
    var INTERVAL_MS_KEY = "Edge-Media-Download-NEW.twitterMonitorIntervalMs";
    var MIN_INTERVAL_MS = 3e4;
    var DM_INTERVAL_MS_KEY = "Edge-Media-Download-NEW.twitterDmIntervalMs";
    var DM_LAST_CHECK_KEY = "Edge-Media-Download-NEW.twitterDmLastCheckAt";
    var LAST_LIKES_KEY = "Edge-Media-Download-NEW.twitterLastLikesAt";
    var LAST_BOOKMARKS_KEY = "Edge-Media-Download-NEW.twitterLastBookmarksAt";
    var FETCH_LOG_KEY = "Edge-Media-Download-NEW.twitterFetchLog";
    var MAX_FETCH_LOG = 30;
    var MIN_DM_INTERVAL_MS = 12e4;
    var DEFAULT_DM_INTERVAL_MINUTES = 2;
    var LIKES_KEY = "Edge-Media-Download-NEW.twitterMonitorLikes";
    var BOOKMARKS_KEY = "Edge-Media-Download-NEW.twitterMonitorBookmarks";
    var DM_KEY = "Edge-Media-Download-NEW.twitterMonitorDm";
    var DM_CHATS_KEY = "Edge-Media-Download-NEW.twitterDmChats";
    var CHAT_PASSCODE_KEY = "Edge-Media-Download-NEW.xchatPasscode";
    var CONVERSATIONS_KEY = "Edge-Media-Download-NEW.twitterDmConversations";
    var BASELINE_KEY = "Edge-Media-Download-NEW.twitterBaselineAt";
    var LAST_CHECK_KEY = "Edge-Media-Download-NEW.twitterLastCheckAt";
    var PROFILE_KEY = "Edge-Media-Download-NEW.twitterProfile";
    var MAX_SEEN = 5e3;
    var MAX_DOWNLOAD_PER_CYCLE = Number.MAX_SAFE_INTEGER;
    var MAX_CATCHUP_DOWNLOAD = Number.MAX_SAFE_INTEGER;
    var MAX_CATCHUP_PAGES = 200;
    var MAX_ITEMS_PER_KIND = 100;
    var DEFAULT_INTERVAL_MINUTES = 10;
    var QUERY_IDS = {
      Viewer: "TpQxQtWMTMnIAMPlMGMqNw",
      Likes: "a6ZbplAY_XzbVt5jy_Ko_Q",
      Bookmarks: "jbqsfdzI0EMFHAtpEC6vyA"
    };
    var FEATURES = { rweb_video_screen_enabled: false };
    var timer = null;
    var changeTimer = null;
    var dmTimer = null;
    var dmIntervalMs = 0;
    var dmNextRunAt = 0;
    var dmRunning = false;
    var running = false;
    var lastResult = null;
    var nextRunAt = 0;
    var currentIntervalMs = 0;
    var lastRunAt = 0;
    function readJson(baseKey, fallback) {
      try {
        const key = scopedKey(baseKey);
        let raw = localStorage.getItem(key);
        if (raw === null) {
          const legacy = localStorage.getItem(baseKey);
          if (legacy !== null) {
            localStorage.setItem(key, legacy);
            raw = legacy;
          }
        }
        return raw === null ? fallback : JSON.parse(raw);
      } catch (e) {
        return fallback;
      }
    }
    function readNumber(baseKey) {
      try {
        const key = scopedKey(baseKey);
        let raw = localStorage.getItem(key);
        if (raw === null) {
          const legacy = localStorage.getItem(baseKey);
          if (legacy !== null) {
            localStorage.setItem(key, legacy);
            raw = legacy;
          }
        }
        return Number(raw) || 0;
      } catch (e) {
        return 0;
      }
    }
    function writeValue(baseKey, value) {
      try {
        localStorage.setItem(scopedKey(baseKey), String(value));
      } catch (e) {
      }
    }
    function readSeen() {
      const parsed = readJson(SEEN_KEY, []);
      return new Set(Array.isArray(parsed) ? parsed : []);
    }
    function writeSeen(set) {
      writeValue(SEEN_KEY, JSON.stringify(Array.from(set).slice(-MAX_SEEN)));
    }
    function getPrefs() {
      try {
        const savedMs = readNumber(INTERVAL_MS_KEY);
        const legacyMinutes = readNumber(INTERVAL_KEY);
        const ms = savedMs || (legacyMinutes ? legacyMinutes * 6e4 : DEFAULT_INTERVAL_MINUTES * 6e4);
        const readFlag = (key) => localStorage.getItem(scopedKey(key)) !== "0";
        return {
          enabled: localStorage.getItem(scopedKey(ENABLED_KEY)) === "1",
          ms: Math.max(MIN_INTERVAL_MS, ms || DEFAULT_INTERVAL_MINUTES * 6e4),
          dmMs: Math.max(MIN_DM_INTERVAL_MS, readNumber(DM_INTERVAL_MS_KEY) || DEFAULT_DM_INTERVAL_MINUTES * 6e4),
          likes: readFlag(LIKES_KEY),
          bookmarks: readFlag(BOOKMARKS_KEY),
          dm: readFlag(DM_KEY),
          dmChats: readJson(DM_CHATS_KEY, []) || [],
          chatPasscode: localStorage.getItem(scopedKey(CHAT_PASSCODE_KEY)) || ""
        };
      } catch (e) {
        return {
          enabled: false,
          ms: DEFAULT_INTERVAL_MINUTES * 6e4,
          likes: true,
          bookmarks: true,
          dm: true,
          dmChats: [],
          chatPasscode: ""
        };
      }
    }
    function setPrefs(patch) {
      if (typeof patch.enabled === "boolean")
        writeValue(ENABLED_KEY, patch.enabled ? "1" : "0");
      if (patch.ms)
        writeValue(INTERVAL_MS_KEY, Math.max(MIN_INTERVAL_MS, Number(patch.ms) || 0));
      if (patch.dmMs)
        writeValue(DM_INTERVAL_MS_KEY, Math.max(MIN_DM_INTERVAL_MS, Number(patch.dmMs) || 0));
      if (typeof patch.likes === "boolean")
        writeValue(LIKES_KEY, patch.likes ? "1" : "0");
      if (typeof patch.bookmarks === "boolean")
        writeValue(BOOKMARKS_KEY, patch.bookmarks ? "1" : "0");
      if (typeof patch.dm === "boolean")
        writeValue(DM_KEY, patch.dm ? "1" : "0");
      if (Array.isArray(patch.dmChats))
        writeValue(DM_CHATS_KEY, JSON.stringify(patch.dmChats.map(String)));
      if (typeof patch.chatPasscode === "string")
        writeValue(CHAT_PASSCODE_KEY, patch.chatPasscode);
    }
    function getBaselineAt() {
      return readNumber(BASELINE_KEY);
    }
    function setBaselineAt(value) {
      writeValue(BASELINE_KEY, value || 0);
    }
    function getLastCheckAt() {
      return readNumber(LAST_CHECK_KEY);
    }
    function getDmLastCheckAt() {
      return readNumber(DM_LAST_CHECK_KEY);
    }
    function setDmLastCheckAt(value) {
      writeValue(DM_LAST_CHECK_KEY, value || Date.now());
    }
    function getKindLastCheckAt(kind) {
      const map = { likes: LAST_LIKES_KEY, bookmarks: LAST_BOOKMARKS_KEY, dm: DM_LAST_CHECK_KEY };
      const key = map[kind];
      return key ? readNumber(key) : 0;
    }
    function setKindLastCheckAt(kind, value) {
      const map = { likes: LAST_LIKES_KEY, bookmarks: LAST_BOOKMARKS_KEY, dm: DM_LAST_CHECK_KEY };
      const key = map[kind];
      if (key)
        writeValue(key, value || Date.now());
    }
    function getFetchLog() {
      return readJson(FETCH_LOG_KEY, []) || [];
    }
    function appendFetchLog(entry) {
      try {
        const list = getFetchLog();
        list.unshift({
          startedAt: entry.startedAt || Date.now(),
          finishedAt: entry.finishedAt || Date.now(),
          mode: entry.mode || "poll",
          likesOk: entry.likesOk !== false,
          bookmarksOk: entry.bookmarksOk !== false,
          dmOk: entry.dmOk !== false,
          newCount: Number(entry.newCount) || 0,
          duplicateCount: Number(entry.duplicateCount) || 0,
          error: entry.error || null
        });
        writeValue(FETCH_LOG_KEY, JSON.stringify(list.slice(0, MAX_FETCH_LOG)));
      } catch (e) {
      }
    }
    function setLastCheckAt(value) {
      writeValue(LAST_CHECK_KEY, value || Date.now());
    }
    function describeError(result) {
      if (result.status === 401 || result.status === 403)
        return "cookie \u65E0\u6548\u6216\u5DF2\u8FC7\u671F";
      if (result.status === 404)
        return "X \u63A5\u53E3\u5DF2\u66F4\u65B0\uFF08queryId \u5931\u6548\uFF09";
      if (result.status === 422)
        return "\u8BF7\u6C42\u53C2\u6570\u88AB\u62D2\u7EDD";
      if (result.status === 429)
        return "\u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF08429\uFF09";
      if (result.status === 0)
        return "\u7F51\u7EDC\u9519\u8BEF\uFF08\u53EF\u80FD\u9700\u8981\u4EE3\u7406\uFF09" + (result.error ? "\uFF1A" + result.error : "");
      return "HTTP " + result.status;
    }
    function findTweetIds(node, out, depth) {
      if (!node || depth > 14)
        return;
      if (Array.isArray(node)) {
        for (const item of node)
          findTweetIds(item, out, depth + 1);
        return;
      }
      if (typeof node !== "object")
        return;
      const result = node.tweet_results && node.tweet_results.result;
      if (result) {
        const legacy = result.legacy || result;
        const id = legacy.id_str || legacy.rest_id || result.rest_id;
        if (id && /^\d+$/.test(String(id)))
          out.push(String(id));
      }
      for (const key of Object.keys(node)) {
        if (key === "tweet_results")
          continue;
        findTweetIds(node[key], out, depth + 1);
      }
    }
    function extractTimeline(json) {
      const instructions = [];
      const visit = (node, depth) => {
        if (!node || depth > 8)
          return;
        if (Array.isArray(node)) {
          node.forEach((item) => visit(item, depth + 1));
          return;
        }
        if (typeof node !== "object")
          return;
        if (Array.isArray(node.instructions))
          instructions.push(...node.instructions);
        for (const key of Object.keys(node)) {
          if (key !== "instructions")
            visit(node[key], depth + 1);
        }
      };
      visit(json, 0);
      const items = [];
      let cursor = null;
      for (const instruction of instructions) {
        if (!instruction)
          continue;
        if (instruction.cursorType === "Bottom" && instruction.value)
          cursor = instruction.value;
        if (!Array.isArray(instruction.entries))
          continue;
        for (const entry of instruction.entries) {
          if (!entry)
            continue;
          const content = entry.content || {};
          const itemContent = content.itemContent;
          const tweet = itemContent && itemContent.tweet_results && itemContent.tweet_results.result;
          if (tweet) {
            const legacy = tweet.legacy || tweet;
            const id = legacy.id_str || legacy.rest_id || tweet.rest_id;
            const createdAt = legacy.created_at ? Date.parse(legacy.created_at) : 0;
            if (id)
              items.push({ id: String(id), createdAt });
          }
          if (typeof entry.entryId === "string" && entry.entryId.startsWith("cursor-bottom") && content.value) {
            cursor = content.value;
          }
        }
      }
      return { items, cursor };
    }
    function findUserLegacy(node, depth) {
      if (!node || depth > 10)
        return null;
      if (Array.isArray(node)) {
        for (const item of node) {
          const found = findUserLegacy(item, depth + 1);
          if (found)
            return found;
        }
        return null;
      }
      if (typeof node !== "object")
        return null;
      if (node.legacy && typeof node.legacy === "object" && node.legacy.screen_name)
        return node.legacy;
      for (const key of Object.keys(node)) {
        const found = findUserLegacy(node[key], depth + 1);
        if (found)
          return found;
      }
      return null;
    }
    function normalizeProfile(legacy, fallbackId) {
      const avatar = legacy && (legacy.profile_image_url_https || legacy.profile_image_url || legacy.image_url);
      return {
        id: legacy && legacy.id_str || fallbackId || "",
        screenName: legacy && legacy.screen_name || "",
        name: legacy && legacy.name || "",
        avatar: typeof avatar === "string" ? avatar.replace("_normal.", "_200x200.") : ""
      };
    }
    async function withAvatarData(profile) {
      if (!profile || !profile.avatar)
        return profile;
      try {
        const result = await getRaw(profile.avatar, {
          headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
            accept: "image/*"
          }
        });
        if (result.status === 200 && result.buffer && result.buffer.length) {
          const type = String(result.contentType || "image/jpeg").split(";")[0];
          const dataUrl = "data:" + type + ";base64," + result.buffer.toString("base64");
          if (dataUrl.length < 4e5)
            profile.avatarData = dataUrl;
        }
      } catch (e) {
      }
      return profile;
    }
    function saveProfile(profile) {
      try {
        writeValue(PROFILE_KEY, JSON.stringify(profile || {}));
      } catch (e) {
      }
    }
    function getSavedProfile() {
      const parsed = readJson(PROFILE_KEY, null);
      return parsed && typeof parsed === "object" ? parsed : null;
    }
    async function getProfile(auth) {
      const url = "https://x.com/i/api/graphql/" + QUERY_IDS.Viewer + "/Viewer?variables=%7B%7D&features=%7B%7D";
      const result = await getJson2(url, { headers: auth.headers });
      if (result.status !== 200 || !result.json) {
        return { ok: false, status: result.status, error: describeError(result) };
      }
      const body = result.body || "";
      const idMatch = body.match(/"rest_id":"(\d+)"/);
      const legacy = findUserLegacy(result.json, 0);
      const profile = normalizeProfile(legacy, idMatch ? idMatch[1] : "");
      if (!profile.screenName) {
        const matched = body.match(/"screen_name":"([^"]+)"/);
        if (matched)
          profile.screenName = matched[1];
      }
      if (!profile.name) {
        const matched = body.match(/"name":"((?:[^"\\]|\\.)+)"/);
        if (matched)
          profile.name = matched[1].replace(/\\"/g, '"');
      }
      if (!profile.avatar) {
        const matched = body.match(/"(?:profile_image_url_https|image_url)":"([^"]+)"/);
        if (matched)
          profile.avatar = matched[1].replace(/\\\//g, "/").replace("_normal.", "_200x200.");
      }
      return { ok: true, ...profile };
    }
    function endpoointUrl(kind, variables) {
      const op = kind === "likes" ? "Likes" : "Bookmarks";
      return "https://x.com/i/api/graphql/" + QUERY_IDS[op] + "/" + op + "?variables=" + encodeURIComponent(JSON.stringify(variables)) + "&features=" + encodeURIComponent(JSON.stringify(FEATURES));
    }
    async function fetchPage(auth, kind, userId, cursor, count) {
      const variables = kind === "likes" ? {
        userId,
        count,
        includePromotedContent: false,
        withClientEventToken: false,
        withBirdwatchNotes: false,
        withVoice: true
      } : { count, includePromotedContent: true };
      if (cursor)
        variables.cursor = cursor;
      const result = await getJson2(endpoointUrl(kind, variables), { headers: auth.headers });
      if (result.status !== 200 || !result.json) {
        return { ok: false, status: result.status, error: describeError(result), items: [], cursor: null };
      }
      const timeline = extractTimeline(result.json);
      return { ok: true, items: timeline.items, cursor: timeline.cursor };
    }
    async function fetchLikes(auth, userId, count) {
      const page = await fetchPage(auth, "likes", userId, null, count);
      if (!page.ok)
        return page;
      return { ok: true, items: Array.from(new Set(page.items.map((item) => item.id))).map((id) => ({ id, source: "like" })) };
    }
    async function fetchBookmarks(auth, count) {
      const page = await fetchPage(auth, "bookmarks", "", null, count);
      if (!page.ok)
        return page;
      return { ok: true, items: Array.from(new Set(page.items.map((item) => item.id))).map((id) => ({ id, source: "bookmark" })) };
    }
    async function fetchSince(auth, kind, userId, since, maxPages) {
      const collected = [];
      let cursor = null;
      let reachedOld = false;
      for (let pageIndex = 0; pageIndex < maxPages; pageIndex++) {
        const page = await fetchPage(auth, kind, userId, cursor, 20);
        if (!page.ok)
          return { ok: false, error: page.error, items: collected };
        if (!page.items.length)
          break;
        for (const item of page.items) {
          if (item.createdAt && item.createdAt < since) {
            reachedOld = true;
            continue;
          }
          collected.push(item);
          if (collected.length >= MAX_ITEMS_PER_KIND)
            break;
        }
        cursor = page.cursor;
        if (reachedOld || !cursor || collected.length >= MAX_ITEMS_PER_KIND)
          break;
      }
      return { ok: true, items: collected.slice(0, MAX_ITEMS_PER_KIND) };
    }
    function markTweetSeen(url) {
      const matched = String(url || "").match(/\/status\/(\d+)/);
      if (!matched)
        return false;
      const seen = readSeen();
      if (seen.has(matched[1]))
        return false;
      seen.add(matched[1]);
      writeSeen(seen);
      return true;
    }
    async function dispatchDownloads(entries) {
      const waiting = /* @__PURE__ */ new Map();
      const onResult = (e) => {
        const detail = e && e.detail || {};
        const resolve = waiting.get(detail.url);
        if (resolve)
          resolve(detail.status || "queued");
      };
      document.addEventListener("evd:download-result", onResult);
      let duplicateCount = 0;
      try {
        const pending = [];
        for (const entry of entries) {
          const id = typeof entry === "string" ? entry : entry && entry.id;
          if (!id)
            continue;
          const from = typeof entry === "object" && entry ? entry.sender || null : null;
          const url = "https://x.com/i/status/" + id;
          pending.push(
            new Promise((resolve) => {
              let settled = false;
              const finish = (status) => {
                if (settled)
                  return;
                settled = true;
                if (status === "duplicate" || status === "skip")
                  duplicateCount += 1;
                resolve(status);
              };
              waiting.set(url, finish);
              setTimeout(() => finish("timeout"), 8e3);
              document.dispatchEvent(new CustomEvent("startDownload", { detail: { url, from, scrape: true } }));
            })
          );
        }
        await Promise.all(pending);
      } finally {
        document.removeEventListener("evd:download-result", onResult);
      }
      return duplicateCount;
    }
    var defaultApi = {
      getProfile,
      fetchLikes,
      fetchBookmarks,
      fetchSince,
      fetchDmShares: twitterDm.fetchDmShares,
      fetchConversations: twitterDm.fetchConversations
    };
    function writePollDebug(info) {
      try {
        require("fs").writeFileSync(
          require("path").join(process.env.TEMP || require("os").tmpdir(), "evd_poll_debug.json"),
          JSON.stringify(info, null, 2)
        );
      } catch (error) {
      }
    }
    async function pollOnce(options = {}) {
      const { baselineOnly = false, api = defaultApi } = options;
      const auth = twitterAuth2.getAuth();
      if (!auth) {
        writePollDebug({ at: (/* @__PURE__ */ new Date()).toISOString(), error: "no-cookie" });
        return { ok: false, error: "no-cookie" };
      }
      const profile = await api.getProfile(auth);
      if (!profile.ok) {
        writePollDebug({ at: (/* @__PURE__ */ new Date()).toISOString(), error: "profile", status: profile.status });
        return { ok: false, error: profile.error, status: profile.status };
      }
      const seen = readSeen();
      const isFirstRun = !getBaselineAt();
      const prefs = getPrefs();
      const startedAt = Date.now();
      const collected = [];
      const likes = prefs.likes ? await api.fetchLikes(auth, profile.id, MAX_ITEMS_PER_KIND) : { ok: true, items: [] };
      if (likes.ok)
        collected.push(...likes.items.slice(0, MAX_ITEMS_PER_KIND));
      const bookmarks = prefs.bookmarks ? await api.fetchBookmarks(auth, MAX_ITEMS_PER_KIND) : { ok: true, items: [] };
      if (bookmarks.ok)
        collected.push(...bookmarks.items.slice(0, MAX_ITEMS_PER_KIND));
      const dmSince = getDmLastCheckAt() ? getDmLastCheckAt() - 6e4 : getLastCheckAt() ? getLastCheckAt() - 6e4 : 0;
      const dm = prefs.dm && !dmTimer ? await api.fetchDmShares(auth, {
        conversationIds: prefs.dmChats || [],
        selfId: profile.id,
        passcode: prefs.chatPasscode || "",
        since: dmSince
      }) : { ok: true, items: [] };
      writePollDebug({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        dmEnabled: !!prefs.dm,
        chatCount: (prefs.dmChats || []).length,
        hasPasscode: !!prefs.chatPasscode,
        dmOk: !!dm.ok,
        dmError: dm.ok ? null : dm.error || null,
        dmItems: (dm.items || []).length,
        likesOk: !!likes.ok,
        bookmarksOk: !!bookmarks.ok
      });
      if (dm.ok) {
        for (const item of dm.items.slice(0, MAX_ITEMS_PER_KIND)) {
          collected.push({ id: item.id, source: "dm", sender: item.sender, text: item.text });
        }
      }
      const fresh = collected.filter((item) => item.id && (item.source === "dm" || !seen.has(item.id)));
      for (const item of collected)
        seen.add(item.id);
      writeSeen(seen);
      const finishedAt = Date.now();
      setLastCheckAt(finishedAt);
      if (likes.ok)
        setKindLastCheckAt("likes", finishedAt);
      if (bookmarks.ok)
        setKindLastCheckAt("bookmarks", finishedAt);
      if (dm.ok && prefs.dm)
        setKindLastCheckAt("dm", finishedAt);
      if (isFirstRun || baselineOnly) {
        setBaselineAt(Date.now());
        appendFetchLog({ startedAt, finishedAt, mode: "baseline", likesOk: likes.ok, bookmarksOk: bookmarks.ok, dmOk: dm.ok, newCount: 0 });
        return {
          ok: true,
          baseline: true,
          screenName: profile.screenName,
          newCount: 0,
          likesOk: likes.ok,
          bookmarksOk: bookmarks.ok,
          dmOk: dm.ok,
          dmError: dm.ok ? null : dm.error
        };
      }
      const toDownload = fresh.slice(0, MAX_DOWNLOAD_PER_CYCLE);
      const duplicateCount = await dispatchDownloads(toDownload);
      appendFetchLog({
        startedAt,
        finishedAt: Date.now(),
        mode: "poll",
        likesOk: likes.ok,
        bookmarksOk: bookmarks.ok,
        dmOk: dm.ok,
        newCount: toDownload.length - duplicateCount,
        duplicateCount
      });
      return {
        ok: true,
        screenName: profile.screenName,
        newCount: toDownload.length - duplicateCount,
        duplicateCount,
        likesOk: likes.ok,
        bookmarksOk: bookmarks.ok,
        dmOk: dm.ok,
        likesError: likes.ok ? null : likes.error,
        bookmarksError: bookmarks.ok ? null : bookmarks.error,
        dmError: dm.ok ? null : dm.error
      };
    }
    async function catchUp(options = {}) {
      const { maxPages = MAX_CATCHUP_PAGES, maxDownload = MAX_CATCHUP_DOWNLOAD, api = defaultApi, includeDm = false } = options;
      const auth = twitterAuth2.getAuth();
      if (!auth)
        return { ok: false, error: "no-cookie" };
      const lastCheck = getLastCheckAt();
      if (!lastCheck) {
        const baseline = await pollOnce({ baselineOnly: true });
        return { ok: true, baseline: true, newCount: 0, screenName: baseline.screenName };
      }
      const profile = await api.getProfile(auth);
      if (!profile.ok)
        return { ok: false, error: profile.error };
      const startedAt = Date.now();
      const likesSince = (getKindLastCheckAt("likes") || lastCheck) - 6e4;
      const bookmarkSince = (getKindLastCheckAt("bookmarks") || lastCheck) - 6e4;
      const dmSince = (getKindLastCheckAt("dm") || lastCheck) - 6e4;
      const seen = readSeen();
      const prefs = getPrefs();
      const likes = prefs.likes ? await api.fetchSince(auth, "likes", profile.id, likesSince, maxPages) : { ok: true, items: [] };
      const bookmarks = prefs.bookmarks ? await api.fetchSince(auth, "bookmarks", "", bookmarkSince, maxPages) : { ok: true, items: [] };
      const dm = prefs.dm && (!dmTimer || includeDm) ? await api.fetchDmShares(auth, {
        conversationIds: prefs.dmChats || [],
        selfId: profile.id,
        passcode: prefs.chatPasscode || "",
        since: dmSince
      }) : { ok: true, items: [] };
      writePollDebug({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        mode: "catchup",
        dmEnabled: !!prefs.dm,
        chatCount: (prefs.dmChats || []).length,
        hasPasscode: !!prefs.chatPasscode,
        dmOk: !!dm.ok,
        dmError: dm.ok ? null : dm.error || null,
        dmItems: (dm.items || []).length
      });
      const collected = [];
      if (likes.ok)
        collected.push(...likes.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "like" })));
      if (bookmarks.ok)
        collected.push(...bookmarks.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "bookmark" })));
      if (dm.ok)
        collected.push(...dm.items.slice(0, MAX_ITEMS_PER_KIND).map((item) => ({ id: item.id, source: "dm", sender: item.sender, text: item.text })));
      const unique = [];
      const seenIds = /* @__PURE__ */ new Set();
      for (const item of collected) {
        if (!item.id || seenIds.has(item.id) || item.source !== "dm" && seen.has(item.id))
          continue;
        seenIds.add(item.id);
        unique.push(item);
      }
      for (const item of unique)
        seen.add(item.id);
      writeSeen(seen);
      const finishedAt = Date.now();
      setLastCheckAt(finishedAt);
      if (likes.ok)
        setKindLastCheckAt("likes", finishedAt);
      if (bookmarks.ok)
        setKindLastCheckAt("bookmarks", finishedAt);
      if (dm.ok && prefs.dm)
        setKindLastCheckAt("dm", finishedAt);
      const toDownload = unique.slice(0, maxDownload);
      const duplicateCount = await dispatchDownloads(toDownload.map((item) => item.id));
      appendFetchLog({
        startedAt,
        finishedAt,
        mode: "catchup",
        likesOk: likes.ok,
        bookmarksOk: bookmarks.ok,
        dmOk: dm.ok,
        newCount: toDownload.length - duplicateCount,
        duplicateCount
      });
      return {
        ok: true,
        screenName: profile.screenName,
        newCount: toDownload.length - duplicateCount,
        duplicateCount,
        truncated: unique.length > toDownload.length,
        likesOk: likes.ok,
        bookmarksOk: bookmarks.ok,
        dmOk: dm.ok,
        dmError: dm.ok ? null : dm.error,
        likesError: likes.ok ? null : likes.error,
        bookmarksError: bookmarks.ok ? null : bookmarks.error
      };
    }
    async function fetchDmCycle(options = {}) {
      const { api = defaultApi } = options;
      const auth = twitterAuth2.getAuth();
      if (!auth)
        return { ok: false, error: "no-cookie" };
      const prefs = getPrefs();
      if (!prefs.dm)
        return { ok: true, skipped: true, newCount: 0 };
      const profile = await api.getProfile(auth);
      if (!profile.ok)
        return { ok: false, error: profile.error };
      const startedAt = Date.now();
      const lastCheck = getDmLastCheckAt() || getLastCheckAt();
      const since = lastCheck ? lastCheck - 6e4 : 0;
      const dm = await api.fetchDmShares(auth, {
        conversationIds: prefs.dmChats || [],
        selfId: profile.id,
        passcode: prefs.chatPasscode || "",
        since
      });
      writePollDebug({
        at: (/* @__PURE__ */ new Date()).toISOString(),
        mode: "dm-cycle",
        dmEnabled: true,
        chatCount: (prefs.dmChats || []).length,
        hasPasscode: !!prefs.chatPasscode,
        dmOk: !!dm.ok,
        dmError: dm.ok ? null : dm.error || null,
        dmItems: (dm.items || []).length
      });
      const seen = readSeen();
      const unique = [];
      const seenIds = /* @__PURE__ */ new Set();
      if (dm.ok) {
        for (const item of dm.items.slice(0, MAX_ITEMS_PER_KIND)) {
          if (!item.id || seenIds.has(item.id) || seen.has(item.id))
            continue;
          seenIds.add(item.id);
          unique.push(item);
        }
      }
      for (const item of unique)
        seen.add(item.id);
      writeSeen(seen);
      setDmLastCheckAt(Date.now());
      const duplicateCount = await dispatchDownloads(unique.map((item) => item.id));
      appendFetchLog({
        startedAt,
        finishedAt: Date.now(),
        mode: "dm",
        likesOk: true,
        bookmarksOk: true,
        dmOk: dm.ok,
        newCount: unique.length - duplicateCount,
        duplicateCount
      });
      return {
        ok: true,
        screenName: profile.screenName,
        newCount: unique.length - duplicateCount,
        duplicateCount,
        dmOk: dm.ok,
        dmError: dm.ok ? null : dm.error
      };
    }
    async function runDmTick() {
      if (dmRunning)
        return lastResult;
      dmRunning = true;
      try {
        lastResult = await fetchDmCycle();
      } catch (e) {
        lastResult = { ok: false, error: e && e.message || "dm-cycle-failed" };
      } finally {
        dmRunning = false;
        if (dmTimer && dmIntervalMs)
          dmNextRunAt = Date.now() + dmIntervalMs;
      }
      return lastResult;
    }
    function startDm(ms) {
      stopDm();
      const interval = Math.max(MIN_DM_INTERVAL_MS, Number(ms) || DEFAULT_DM_INTERVAL_MINUTES * 6e4);
      setPrefs({ dmMs: interval });
      dmIntervalMs = interval;
      dmNextRunAt = Date.now() + interval;
      dmTimer = setInterval(runDmTick, interval);
      return interval;
    }
    function stopDm() {
      if (dmTimer) {
        clearInterval(dmTimer);
        dmTimer = null;
      }
      dmIntervalMs = 0;
      dmNextRunAt = 0;
    }
    function markNextRun(intervalMs) {
      currentIntervalMs = intervalMs;
      nextRunAt = Date.now() + intervalMs;
    }
    function markRunFinished() {
      if (!timer || !currentIntervalMs)
        return;
      lastRunAt = Date.now();
      markNextRun(currentIntervalMs);
    }
    function schedule(intervalMs, runNow) {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (runNow)
        runCycle();
      markNextRun(intervalMs);
      timer = setInterval(runCycle, intervalMs);
    }
    async function runCycle() {
      if (running)
        return lastResult;
      running = true;
      try {
        lastResult = await pollOnce();
      } catch (error) {
        lastResult = { ok: false, error: error && error.message || "unknown" };
      } finally {
        running = false;
      }
      markRunFinished();
      return lastResult;
    }
    function start(ms) {
      const interval = Math.max(MIN_INTERVAL_MS, Number(ms) || DEFAULT_INTERVAL_MINUTES * 6e4);
      const justChecked = isRunning() && currentIntervalMs === interval && Date.now() - lastRunAt < 5e3;
      stop();
      setPrefs({ enabled: true, ms: interval });
      schedule(interval, false);
      if (!justChecked) {
        if (changeTimer)
          clearTimeout(changeTimer);
        changeTimer = setTimeout(() => {
          changeTimer = null;
          runCycle();
        }, 5e3);
      }
      const prefs = getPrefs();
      if (prefs.dm)
        startDm(prefs.dmMs);
    }
    function stop() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      if (changeTimer) {
        clearTimeout(changeTimer);
        changeTimer = null;
      }
      stopDm();
      setPrefs({ enabled: false });
      nextRunAt = 0;
      currentIntervalMs = 0;
    }
    function isRunning() {
      return !!timer;
    }
    function getStatus() {
      return {
        running: isRunning(),
        prefs: getPrefs(),
        baselineAt: getBaselineAt(),
        lastCheckAt: getLastCheckAt(),
        last: lastResult
      };
    }
    async function testConnection() {
      const auth = twitterAuth2.getAuth();
      if (!auth)
        return { ok: false, error: "no-cookie" };
      const profile = await getProfile(auth);
      if (!profile.ok)
        return profile;
      const likes = await fetchLikes(auth, profile.id, 3);
      const bookmarks = await fetchBookmarks(auth, 3);
      await withAvatarData(profile);
      saveProfile(profile);
      return {
        ok: true,
        screenName: profile.screenName,
        name: profile.name,
        avatar: profile.avatar,
        avatarData: profile.avatarData || "",
        id: profile.id,
        likesOk: likes.ok,
        likesError: likes.ok ? null : likes.error,
        bookmarksOk: bookmarks.ok,
        bookmarksError: bookmarks.ok ? null : bookmarks.error
      };
    }
    async function fetchProfile() {
      const auth = twitterAuth2.getAuth();
      if (!auth)
        return { ok: false, error: "no-cookie" };
      const profile = await getProfile(auth);
      if (profile.ok) {
        await withAvatarData(profile);
        saveProfile(profile);
      }
      return profile;
    }
    function getCachedConversations() {
      const cached = readJson(CONVERSATIONS_KEY, []);
      return Array.isArray(cached) ? cached : [];
    }
    function clearConversations() {
      writeValue(CONVERSATIONS_KEY, "[]");
      writeValue(DM_CHATS_KEY, "[]");
    }
    async function refreshConversations() {
      const auth = twitterAuth2.getAuth();
      if (!auth)
        return { ok: false, error: "no-cookie", items: [] };
      let selfId = "";
      try {
        const saved = getSavedProfile();
        selfId = saved && saved.id || "";
      } catch (e) {
        selfId = "";
      }
      let result;
      try {
        result = await twitterDm.fetchConversations(auth, selfId);
      } catch (error) {
        return { ok: false, error: error && error.message || "error", items: [] };
      }
      if (result.ok)
        writeValue(CONVERSATIONS_KEY, JSON.stringify(result.items));
      return result;
    }
    async function init() {
      const prefs = getPrefs();
      if (!prefs.enabled || !twitterAuth2.hasAuth())
        return { ok: false, skipped: true };
      let result = null;
      try {
        result = await catchUp();
      } catch (error) {
        result = { ok: false, error: error && error.message || "unknown" };
      }
      const interval = Math.max(MIN_INTERVAL_MS, prefs.ms || DEFAULT_INTERVAL_MINUTES * 6e4);
      schedule(interval, !(result && result.ok));
      setPrefs({ enabled: true, ms: interval });
      if (prefs.dm)
        startDm(prefs.dmMs);
      return result;
    }
    function refreshForLibrary() {
      const prefs = getPrefs();
      if (prefs.enabled && twitterAuth2.hasAuth()) {
        const interval = Math.max(MIN_INTERVAL_MS, prefs.ms);
        if (isRunning() && currentIntervalMs === interval) {
          return true;
        }
        schedule(interval, false);
        if (prefs.dm)
          startDm(prefs.dmMs);
        return true;
      }
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
      stopDm();
      return false;
    }
    module2.exports = {
      MIN_INTERVAL_MS,
      MIN_DM_INTERVAL_MS,
      findTweetIds,
      extractTimeline,
      describeError,
      init,
      catchUp,
      start,
      stop,
      isRunning,
      getStatus,
      testConnection,
      pollOnce,
      runCycle,
      getPrefs,
      setPrefs,
      fetchProfile,
      getSavedProfile,
      saveProfile,
      getCachedConversations,
      refreshConversations,
      clearConversations,
      markTweetSeen,
      dispatchDownloads,
      fetchDmCycle,
      startDm,
      stopDm,
      getDmLastCheckAt,
      getKindLastCheckAt,
      getFetchLog,
      getLastCheckAt,
      setLastCheckAt,
      setBaselineAt,
      refreshForLibrary
    };
  }
});

// js/twitter-name.js
var require_twitter_name = __commonJS({
  "js/twitter-name.js"(exports2, module2) {
    var FIELD_MAX_LENGTH = {
      authorId: 40,
      tweetId: 40,
      screenName: 40,
      name: 60,
      text: 100
    };
    var DEFAULT_PREFS = {
      authorId: false,
      tweetId: false,
      screenName: false,
      name: false,
      text: false
    };
    var FIELD_ORDER = ["authorId", "tweetId", "screenName", "text", "name"];
    var DEFAULT_ORDER = FIELD_ORDER.slice();
    function normalizeJoin(join) {
      const result = [];
      if (Array.isArray(join)) {
        for (const field of join) {
          if (FIELD_ORDER.includes(field) && !result.includes(field))
            result.push(field);
        }
      }
      return result;
    }
    function normalizeOrder(order) {
      const result = [];
      if (Array.isArray(order)) {
        for (const field of order) {
          if (FIELD_ORDER.includes(field) && !result.includes(field))
            result.push(field);
        }
      }
      for (const field of FIELD_ORDER) {
        if (!result.includes(field))
          result.push(field);
      }
      return result;
    }
    var NAME_MAX_LENGTH = 150;
    var ANNOTATION_FIELD_MAX_LENGTH = {
      authorId: 40,
      tweetId: 40,
      screenName: 40,
      name: 60,
      text: 0
    };
    var ANNOTATION_MAX_LENGTH = 5e3;
    var TAG_FIELD_MAX_LENGTH = {
      authorId: 40,
      tweetId: 40,
      screenName: 40,
      name: 60,
      text: 100
    };
    var TAG_MAX_LENGTH = 100;
    function getDefaultPrefs() {
      return Object.assign({ order: DEFAULT_ORDER.slice(), join: [] }, DEFAULT_PREFS);
    }
    function cleanValue(raw, maxLength) {
      let value = String(raw == null ? "" : raw).replace(/https:\/\/t\.co\/\S+/gi, " ").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").trim();
      if (!value)
        return "";
      if (maxLength && value.length > maxLength) {
        value = value.slice(0, maxLength - 1).trimEnd() + "\u2026";
      }
      return value;
    }
    function sanitizeName(value) {
      return String(value == null ? "" : value).replace(/[\\/:*?"<>|]/g, " ").replace(/[\r\n\t]+/g, " ").replace(/\s+/g, " ").replace(/^[\s.]+|[\s.]+$/g, "");
    }
    function fieldValues(metadata, limits) {
      const meta = metadata || {};
      const max = limits || FIELD_MAX_LENGTH;
      const screenName = String(meta.authorScreenName || meta.uploader_id || "").replace(/^@+/, "");
      return {
        authorId: cleanValue(meta.authorId, max.authorId),
        tweetId: cleanValue(meta.id, max.tweetId),
        screenName: screenName ? "@" + cleanValue(screenName, max.screenName) : "",
        name: cleanValue(meta.authorName || meta.uploader, max.name),
        text: cleanValue(meta.description, max.text)
      };
    }
    function composeFields(metadata, prefs, limits, maxLength, transform) {
      const enabled = Object.assign(getDefaultPrefs(), prefs || {});
      const values = fieldValues(metadata, limits);
      const parts = [];
      for (const field of normalizeOrder(enabled.order)) {
        if (!enabled[field])
          continue;
        const value = values[field];
        if (value)
          parts.push(value);
      }
      if (!parts.length)
        return "";
      const joined = transform ? transform(parts.join(" - ")) : parts.join(" - ");
      return joined.length > maxLength ? joined.slice(0, maxLength).trimEnd() : joined;
    }
    function buildTwitterName(metadata, prefs) {
      return composeFields(metadata, prefs, FIELD_MAX_LENGTH, NAME_MAX_LENGTH, sanitizeName);
    }
    function buildTwitterAnnotation(metadata, prefs) {
      return composeFields(metadata, prefs, ANNOTATION_FIELD_MAX_LENGTH, ANNOTATION_MAX_LENGTH);
    }
    function buildTwitterTags(metadata, prefs) {
      const enabled = Object.assign(getDefaultPrefs(), prefs || {});
      const values = fieldValues(metadata, TAG_FIELD_MAX_LENGTH);
      const joins = normalizeJoin(enabled.join);
      const tags = [];
      let previousChecked = false;
      for (const field of normalizeOrder(enabled.order)) {
        if (!enabled[field]) {
          previousChecked = false;
          continue;
        }
        const tag = cleanValue(values[field], TAG_MAX_LENGTH).replace(/#/g, "").trim();
        const merge = joins.includes(field) && previousChecked && tags.length > 0;
        previousChecked = true;
        if (!tag)
          continue;
        if (merge) {
          const merged = `${tags[tags.length - 1]} - ${tag}`;
          tags[tags.length - 1] = merged.length > TAG_MAX_LENGTH ? merged.slice(0, TAG_MAX_LENGTH - 1).trimEnd() + "\u2026" : merged;
          continue;
        }
        if (tags.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
          continue;
        tags.push(tag);
      }
      return tags;
    }
    function appendPartSuffix(name, index, total, limit) {
      const idx = Number(index) || 0;
      const all = Number(total) || 0;
      if (all <= 1 || idx <= 0)
        return name;
      const suffix = ` (${idx}/${all})`;
      const max = Number(limit) || NAME_MAX_LENGTH;
      const base = String(name == null ? "" : name).slice(0, Math.max(1, max - suffix.length)).trimEnd();
      return base + suffix;
    }
    function moveInOrder(order, field, direction) {
      const list = normalizeOrder(order);
      const index = list.indexOf(field);
      const target = index + (direction === "up" ? -1 : 1);
      if (index < 0 || target < 0 || target >= list.length)
        return null;
      const moved = list[target];
      list[target] = list[index];
      list[index] = moved;
      return list;
    }
    function composeImportName(metadata, prefs, part, fallbackTitle, appendPart = true) {
      const meta = metadata || {};
      const isTwitter = String(meta.extractor || "").toLowerCase() === "twitter";
      const composed = isTwitter ? buildTwitterName(meta, prefs) : "";
      const base = composed || meta.title || fallbackTitle || "";
      const limit = composed ? NAME_MAX_LENGTH : 180;
      if (!appendPart)
        return base.slice(0, limit);
      return appendPartSuffix(base, part && part.index, part && part.total, limit);
    }
    module2.exports = {
      DEFAULT_PREFS,
      FIELD_ORDER,
      DEFAULT_ORDER,
      FIELD_MAX_LENGTH,
      NAME_MAX_LENGTH,
      ANNOTATION_FIELD_MAX_LENGTH,
      ANNOTATION_MAX_LENGTH,
      TAG_FIELD_MAX_LENGTH,
      TAG_MAX_LENGTH,
      getDefaultPrefs,
      normalizeOrder,
      normalizeJoin,
      moveInOrder,
      buildTwitterName,
      buildTwitterAnnotation,
      buildTwitterTags,
      appendPartSuffix,
      composeImportName,
      cleanValue,
      sanitizeName
    };
  }
});

// js/library-index.js
var require_library_index = __commonJS({
  "js/library-index.js"(exports2, module2) {
    var fs = require("fs");
    var path = require("path");
    var { getLibraryPath } = require_library_context();
    var keyOf = (value) => String(value || "");
    var cache = { library: "", keys: /* @__PURE__ */ new Set(), ready: false };
    var scanning = false;
    var pending = null;
    var warnedNoLibrary = false;
    function configure(options = {}) {
      if (typeof options.keyOf === "function")
        keyOf = options.keyOf;
    }
    async function collectFromEagle() {
      try {
        if (typeof eagle === "undefined" || !eagle || !eagle.item)
          return null;
        const api = eagle.item;
        if (typeof api.getAll !== "function")
          return null;
        const items = await api.getAll() || [];
        const keys = /* @__PURE__ */ new Set();
        for (const item of items) {
          if (!item || item.isDeleted)
            continue;
          const key = keyOf(item.url || "");
          if (key)
            keys.add(key);
        }
        return keys;
      } catch (e) {
        return null;
      }
    }
    function itemLink(imagesDir, dirName) {
      const file = path.join(imagesDir, dirName, "metadata.json");
      try {
        const meta = JSON.parse(fs.readFileSync(file, "utf8"));
        return meta && meta.url ? String(meta.url) : "";
      } catch (e) {
        return "";
      }
    }
    function scanFiles(libraryPath) {
      const imagesDir = path.join(libraryPath, "images");
      let dirs = [];
      try {
        dirs = fs.readdirSync(imagesDir, { withFileTypes: true }).filter((entry) => entry.isDirectory() && entry.name.endsWith(".info")).map((entry) => entry.name);
      } catch (e) {
        return Promise.resolve(0);
      }
      const keys = /* @__PURE__ */ new Set();
      let index = 0;
      return new Promise((resolve) => {
        const step = () => {
          const started = Date.now();
          while (index < dirs.length && Date.now() - started < 8) {
            const link = itemLink(imagesDir, dirs[index]);
            index += 1;
            if (!link)
              continue;
            const key = keyOf(link);
            if (key)
              keys.add(key);
          }
          if (index >= dirs.length) {
            cache = { library: libraryPath, keys, ready: true };
            resolve(keys.size);
            return;
          }
          setTimeout(step, 0);
        };
        step();
      });
    }
    function build(options = {}) {
      const force = !!options.force;
      const libraryPath = getLibraryPath();
      if (!libraryPath) {
        if (!warnedNoLibrary) {
          warnedNoLibrary = true;
          console.warn("[library-index] \u62FF\u4E0D\u5230 eagle.library.path\uFF0C\u5224\u91CD\u6682\u65F6\u4E0D\u53EF\u7528");
        }
        return Promise.resolve(0);
      }
      if (!force && cache.library === libraryPath && cache.ready)
        return Promise.resolve(cache.keys.size);
      if (pending)
        return pending;
      scanning = true;
      pending = collectFromEagle().then((keys) => {
        if (keys) {
          cache = { library: libraryPath, keys, ready: true };
          return keys.size;
        }
        return scanFiles(libraryPath);
      }).finally(() => {
        scanning = false;
        pending = null;
      });
      return pending;
    }
    async function hasSameLink(url) {
      const key = keyOf(url);
      if (!key)
        return false;
      const libraryPath = getLibraryPath();
      if (cache.library !== libraryPath || !cache.ready) {
        await build({ force: true });
      }
      return cache.keys.has(key);
    }
    function remember(url) {
      const key = keyOf(url);
      if (!key)
        return false;
      if (cache.ready)
        cache.keys.add(key);
      return true;
    }
    module2.exports = {
      configure,
      build,
      hasSameLink,
      remember
    };
  }
});

// js/error-log.js
var require_error_log = __commonJS({
  "js/error-log.js"(exports2, module2) {
    var STORAGE_KEY = "Edge-Media-Download-NEW.downloadErrors";
    var LIMIT = 80;
    function readAll() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw)
          return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed))
          return [];
        return parsed.filter((entry) => entry && typeof entry.url === "string" && entry.url);
      } catch (e) {
        return [];
      }
    }
    function writeAll(list2) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(list2.slice(-LIMIT)));
      } catch (e) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(list2.slice(-12)));
        } catch (inner) {
        }
      }
    }
    function slimFrom(from) {
      if (!from || typeof from !== "object")
        return null;
      const out = {
        id: from.id || "",
        name: from.name || "",
        screenName: from.screenName || "",
        avatar: from.avatar || ""
      };
      if (typeof from.avatarData === "string" && from.avatarData.length <= 6e4) {
        out.avatarData = from.avatarData;
      }
      if (!out.id && !out.name && !out.screenName)
        return null;
      return out;
    }
    function add(entry) {
      const url = String(entry && entry.url || "");
      if (!url)
        return;
      const list2 = readAll().filter((item) => item.url !== url);
      list2.push({
        url,
        title: String(entry && entry.title || url),
        error: String(entry && entry.error || ""),
        from: slimFrom(entry && entry.from),
        time: Date.now()
      });
      writeAll(list2);
    }
    function remove(url) {
      const text = String(url || "");
      if (!text)
        return;
      const list2 = readAll().filter((item) => item.url !== text);
      writeAll(list2);
    }
    function list() {
      return readAll();
    }
    function clear() {
      writeAll([]);
    }
    module2.exports = {
      STORAGE_KEY,
      add,
      remove,
      list,
      clear
    };
  }
});

// js/ui-replica.js
var require_ui_replica = __commonJS({
  "js/ui-replica.js"(exports2, module2) {
    var sankakuAuth2 = require_sankaku_auth();
    var twitterAuth2 = require_twitter_auth();
    var twitterMonitor2 = require_twitter_monitor();
    var twitterName2 = require_twitter_name();
    var { scopedKey } = require_library_context();
    var INTERVAL_CHOICE_KEY = "Edge-Media-Download-NEW.twitterIntervalChoice";
    var THEME_FOLLOW_KEY = "Edge-Media-Download-NEW.followEagleTheme";
    var THEME_KEY = "Edge-Media-Download-NEW.theme";
    var THEME_NAMES = ["light", "lightgray", "gray", "dark", "blue", "purple"];
    function shell() {
      return typeof window !== "undefined" && window.EVDUI || null;
    }
    function el(id) {
      return document.getElementById(id);
    }
    function getIntervalChoice() {
      try {
        const raw = localStorage.getItem(scopedKey(INTERVAL_CHOICE_KEY));
        if (raw === null)
          return null;
        return Number(raw) || 0;
      } catch (e) {
        return null;
      }
    }
    function setIntervalChoice(minutes) {
      try {
        localStorage.setItem(scopedKey(INTERVAL_CHOICE_KEY), String(Number(minutes) || 0));
      } catch (e) {
      }
    }
    function getFollowEagleTheme() {
      const value = localStorage.getItem(THEME_FOLLOW_KEY);
      return value === null ? true : value === "true";
    }
    function getManualTheme() {
      const value = localStorage.getItem(THEME_KEY);
      return THEME_NAMES.includes(value) ? value : "gray";
    }
    function eagleThemeName() {
      const support = {
        AUTO: eagle.app.isDarkColors() ? "gray" : "light",
        LIGHT: "light",
        LIGHTGRAY: "lightgray",
        GRAY: "gray",
        DARK: "dark",
        BLUE: "blue",
        PURPLE: "purple"
      };
      try {
        return support[String(eagle.app.theme).toUpperCase()] || "gray";
      } catch (e) {
        return "gray";
      }
    }
    function currentThemeName() {
      return getFollowEagleTheme() ? eagleThemeName() : getManualTheme();
    }
    function syncThemeControls(themeName) {
      const follow = getFollowEagleTheme();
      const toggle = el("followThemeToggle");
      if (toggle)
        toggle.checked = follow;
      Array.prototype.forEach.call(document.querySelectorAll(".themes-picker .theme"), (sw) => {
        sw.classList.toggle("active", sw.dataset.theme === (themeName || currentThemeName()));
      });
    }
    function setupThemeControls() {
      syncThemeControls();
    }
    function updateTheme() {
      const name = currentThemeName();
      const ui2 = shell();
      if (ui2)
        ui2.setTheme(name);
      else
        document.body.setAttribute("theme", name);
      syncThemeControls(name);
    }
    function setFollowEagleTheme(value) {
      localStorage.setItem(THEME_FOLLOW_KEY, String(!!value));
      if (!value)
        localStorage.setItem(THEME_KEY, eagleThemeName());
      updateTheme();
    }
    function setManualTheme(name) {
      if (!THEME_NAMES.includes(name))
        return;
      localStorage.setItem(THEME_KEY, name);
      localStorage.setItem(THEME_FOLLOW_KEY, "false");
      updateTheme();
    }
    function showMainUI() {
      const ui2 = shell();
      const hashView = (location.hash || "").replace("#", "");
      if (hashView && /^(download|settings|tags|dependencies|account)$/.test(hashView))
        return;
      if (ui2 && ui2.currentPanel() !== "download")
        ui2.showPanel("download", false);
    }
    function switchSubpageTab(tab) {
      const ui2 = shell();
      if (!ui2)
        return;
      const map = { settings: "settings", tags: "tags", dependencies: "dependencies", account: "account" };
      if (map[tab])
        ui2.showPanel(map[tab], false);
    }
    function setDepsGating(gating) {
      const downloadBtn = el("downloadBtn");
      if (downloadBtn)
        downloadBtn.classList.toggle("disabled", !!gating);
      if (gating)
        switchSubpageTab("dependencies");
    }
    function hideDepsPage() {
      setDepsGating(false);
      const ui2 = shell();
      if (ui2 && ui2.currentPanel() !== "download")
        ui2.showPanel("download", false);
    }
    function updateDepsBadge(hasNotice) {
    }
    function isValidUrl(string) {
      try {
        const url = new URL(string);
        return url.protocol === "https:";
      } catch (e) {
        return false;
      }
    }
    function setupInputBar() {
    }
    var tipTimer = null;
    function showTip(message) {
      const btn = el("downloadBtn");
      if (!btn)
        return;
      let tip = document.querySelector(".evd-tip");
      if (!tip) {
        tip = document.createElement("div");
        tip.className = "evd-tip";
        tip.style.cssText = "position:absolute;right:12px;bottom:58px;z-index:9;max-width:360px;padding:6px 8px;font-size:12px;line-height:16px;border-radius:6px;background:var(--color-bg-active, #2a2b2f);color:var(--color-text-primary, #f8f9fb);box-shadow:0 2px 10px rgba(0,0,0,.28)";
        document.body.appendChild(tip);
      }
      tip.textContent = message;
      tip.hidden = false;
      clearTimeout(tipTimer);
      tipTimer = setTimeout(() => {
        if (tip)
          tip.hidden = true;
      }, 2600);
    }
    function setInputBarState(state, errorMessage = "") {
      if (state === "error")
        showTip(errorMessage || "\u94FE\u63A5\u65E0\u6548");
    }
    function canDeleteQueueItem(item) {
      return !!item && item.state !== "preparing" && item.state !== "downloading";
    }
    function queueStatusText(item) {
      const state = item.state;
      if (state === "waiting")
        return "\u7B49\u5F85\u4E2D";
      if (state === "preparing")
        return "\u6B63\u5728\u83B7\u53D6\u5A92\u4F53\u4FE1\u606F\u2026";
      if (state === "completed")
        return "\u5DF2\u5B8C\u6210";
      if (state === "error")
        return "\u4E0B\u8F7D\u5931\u8D25";
      if (item.phase === "merge" || item.phase === "convert") {
        const label = item.phase === "merge" ? "\u5408\u5E76\u4E2D" : "\u8F6C\u7801\u4E2D";
        return typeof item.processingPercent === "number" ? `${label} ${Math.round(item.processingPercent)}%` : `${label}\u2026`;
      }
      if (state === "downloading") {
        const parts = ["\u4E0B\u8F7D\u4E2D"];
        if (typeof item.progress === "number")
          parts.push(`${item.progress.toFixed(1)}%`);
        if (item.speed)
          parts.push(item.speed);
        return parts.join(" \xB7 ");
      }
      return "\u7B49\u5F85\u4E2D";
    }
    function queueEtaText(item) {
      if (item.state === "error")
        return friendlyError(item.error || "");
      if (item.eta)
        return `\u5269\u4F59 ${item.eta}`;
      return "";
    }
    function friendlyError(raw) {
      const text = String(raw || "").replace(/^下载失败[：:]\s*/, "").replace(/^yt-dlp\s*退出，代码\s*\d+[：:]\s*/, "").replace(/^ERROR:\s*/, "").trim();
      if (!text)
        return "";
      if (/No video formats found/i.test(text))
        return "\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891\u683C\u5F0F";
      if (/not authorized to view this protected tweet|protected account/i.test(text)) {
        return "\u63A8\u6587\u53D7\u4FDD\u62A4\uFF0C\u9700\u5728\u8D26\u53F7\u9875\u586B\u5199 Cookie";
      }
      if (/media could not be|unsupported URL|no video|There is no video/i.test(text)) {
        return "\u8BE5\u63A8\u6587\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891";
      }
      if (/HTTP Error 404|status: 404|not found/i.test(text))
        return "\u63A8\u6587\u4E0D\u5B58\u5728\u6216\u5DF2\u88AB\u5220\u9664";
      if (/HTTP Error 403|HTTP Error 401/i.test(text))
        return "\u6CA1\u6709\u8BBF\u95EE\u6743\u9650\uFF0C\u68C0\u67E5 Cookie";
      if (/timed out|ETIMEDOUT|socket hang up|ECONNRESET/i.test(text))
        return "\u7F51\u7EDC\u8D85\u65F6\uFF0C\u53EF\u70B9\u91CD\u8BD5";
      const cleaned = text.replace(/^\[[^\]]+\]\s*[^:]*:\s*/, "").replace(/\s+/g, " ");
      return cleaned.length > 60 ? cleaned.slice(0, 60) + "\u2026" : cleaned;
    }
    function displayTitle(item) {
      const raw = String(item && item.title || "").trim();
      const url = String(item && item.url || "");
      const idMatch = (raw + " " + url).match(/\/status(?:es)?\/(\d+)|\b(twitter\s*video)\s*#(\d+)/i);
      const id = idMatch ? idMatch[1] || idMatch[3] || "" : "";
      const isPlaceholder = !raw || /^https?:\/\//i.test(raw) || /^twitter\s*video\s*#?\d*/i.test(raw) || /^x\.com\/i\/status/i.test(raw);
      if (isPlaceholder && id)
        return `\u63A8\u6587 #${id}`;
      if (isPlaceholder && raw) {
        const short = raw.replace(/^https?:\/\//i, "");
        return short.length > 60 ? short.slice(0, 60) + "\u2026" : short;
      }
      return raw;
    }
    function queueProgress(item) {
      const isProcessing = item.state === "downloading" && (item.phase === "merge" || item.phase === "convert");
      if (isProcessing)
        return typeof item.processingPercent === "number" ? item.processingPercent : 100;
      return item.progress || 0;
    }
    function toRowData(item) {
      return {
        id: item.id,
        title: displayTitle(item),
        state: item.state,
        status: queueStatusText(item),
        eta: queueEtaText(item),
        progress: queueProgress(item),
        from: item.from || null
      };
    }
    function appendQueueItem(item) {
      const ui2 = shell();
      if (ui2)
        ui2.addQueueItem(toRowData(item));
    }
    function updateQueueItem(id, data) {
      const ui2 = shell();
      if (ui2)
        ui2.updateQueueItem(id, toRowData(data));
    }
    function removeQueueItem(id) {
      const ui2 = shell();
      if (ui2)
        ui2.removeQueueItem(id);
    }
    function setQueuePaused(paused) {
      const ui2 = shell();
      if (ui2 && typeof ui2.setQueuePaused === "function")
        ui2.setQueuePaused(paused);
    }
    function findQueueButton(id, action) {
      const row = document.querySelector(`.download-item[data-id="${id}"]`);
      if (!row)
        return null;
      return row.querySelector(`.link-btn[data-act="${action}"]`);
    }
    function showCopiedFeedback(id) {
      const ui2 = shell();
      const btn = findQueueButton(id, "copy");
      if (ui2 && btn)
        ui2.flashButton(btn, "\u5DF2\u590D\u5236");
    }
    function showCopiedErrorFeedback(id) {
      const ui2 = shell();
      const btn = findQueueButton(id, "copyError");
      if (ui2 && btn)
        ui2.flashButton(btn, "\u5DF2\u590D\u5236");
    }
    function depEls(prefix) {
      return {
        state: el(prefix + "State"),
        progress: el(prefix + "Progress"),
        bar: el(prefix + "Bar"),
        check: el(prefix + "Check"),
        reinstall: el(prefix + "Reinstall"),
        uninstall: el(prefix + "Uninstall")
      };
    }
    function setDepState(node, text, tone) {
      if (!node)
        return;
      node.textContent = text;
      node.className = "value dep-state" + (tone ? " " + tone : "");
    }
    function setDepButtons(prefix, { check, reinstall, uninstall, reinstallLabel }) {
      const d = depEls(prefix);
      const toggle = (node, visible) => {
        if (!node)
          return;
        node.hidden = !visible;
        node.style.display = visible ? "" : "none";
      };
      toggle(d.check, check);
      toggle(d.reinstall, reinstall);
      toggle(d.uninstall, uninstall);
      if (d.reinstall && reinstall) {
        d.reinstall.textContent = reinstallLabel || (prefix === "ffmpeg" ? "\u5B89\u88C5 FFmpeg \u4F9D\u8D56" : "\u91CD\u65B0\u5B89\u88C5");
      }
      const container = (d.reinstall || d.check || d.uninstall || {}).parentElement;
      if (container) {
        const anyVisible = [d.check, d.reinstall, d.uninstall].some((node) => node && !node.hidden);
        container.style.display = anyVisible ? "" : "none";
      }
    }
    function updateYtdlpCard(state, data = {}) {
      const d = depEls("ytdlp");
      if (!d.state)
        return;
      if (d.progress)
        d.progress.hidden = true;
      if (d.bar)
        d.bar.style.width = "0%";
      switch (state) {
        case "checking":
          setDepState(d.state, "\u68C0\u67E5\u4E2D\u2026", "");
          setDepButtons("ytdlp", { check: false, reinstall: false, uninstall: false });
          break;
        case "installed":
        case "latest":
          setDepState(d.state, "\u5DF2\u662F\u6700\u65B0\u7248", "ok");
          setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true });
          break;
        case "outdated":
          setDepState(d.state, `\u6709\u65B0\u7248\u672C ${data.latestVersion || ""}`.trim(), "warn");
          setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true });
          break;
        case "missing":
          setDepState(d.state, "\u672A\u5B89\u88C5", "warn");
          setDepButtons("ytdlp", { check: false, reinstall: true, uninstall: false, reinstallLabel: "\u5B89\u88C5" });
          break;
        case "busy": {
          const pct = Math.round(data.percent || 0);
          setDepState(d.state, data.statusText || "\u66F4\u65B0\u4E2D\u2026", "");
          if (d.progress)
            d.progress.hidden = false;
          if (d.bar)
            d.bar.style.width = pct + "%";
          setDepButtons("ytdlp", { check: false, reinstall: false, uninstall: false });
          break;
        }
        case "done":
          setDepState(d.state, data.statusText || "\u5DF2\u5B89\u88C5", "ok");
          setDepButtons("ytdlp", { check: true, reinstall: true, uninstall: true, reinstallLabel: "\u91CD\u65B0\u5B89\u88C5" });
          break;
        case "error":
        default:
          setDepState(d.state, "\u5B89\u88C5\u5931\u8D25", "warn");
          setDepButtons("ytdlp", { check: false, reinstall: true, uninstall: false, reinstallLabel: "\u91CD\u8BD5" });
          break;
      }
    }
    function updateFfmpegCard(state, data = {}) {
      const d = depEls("ffmpeg");
      if (!d.state)
        return;
      if (d.progress)
        d.progress.hidden = true;
      if (state === "checking") {
        setDepState(d.state, "\u68C0\u67E5\u4E2D\u2026", "");
      } else if (state === "eagle") {
        setDepState(d.state, "Eagle \u5185\u7F6E", "ok");
        setDepButtons("ffmpeg", { check: false, reinstall: false });
      } else {
        setDepState(d.state, "\u672A\u627E\u5230", "warn");
        setDepButtons("ffmpeg", { check: false, reinstall: true });
      }
    }
    var tagJoinState = [];
    function applyTwitterNameOrder(order) {
      const ui2 = shell();
      if (ui2)
        ui2.applyOrder("name", twitterName2.normalizeOrder(order));
    }
    function applyTwitterAnnotationOrder(order) {
      const ui2 = shell();
      if (ui2)
        ui2.applyOrder("annotation", twitterName2.normalizeOrder(order));
    }
    function applyTwitterTagsOrder(order, join) {
      const ui2 = shell();
      if (!ui2)
        return;
      ui2.applyOrder("tags", twitterName2.normalizeOrder(order));
      if (Array.isArray(join))
        tagJoinState = twitterName2.normalizeJoin(join);
      ui2.applyJoin(tagJoinState);
    }
    function refreshTwitterTagJoins(join) {
      if (Array.isArray(join))
        tagJoinState = twitterName2.normalizeJoin(join);
      const ui2 = shell();
      if (ui2)
        ui2.applyJoin(tagJoinState);
    }
    var ACCOUNT_EDITOR_KEY = "Edge-Media-Download-NEW.twitterEditorExpanded";
    var accountEditorExpanded = readAccountEditorPref();
    var lastAccountConnected = null;
    function readAccountEditorPref() {
      try {
        const raw = localStorage.getItem(scopedKey(ACCOUNT_EDITOR_KEY));
        return raw === null ? null : raw === "1";
      } catch (e) {
        return null;
      }
    }
    function writeAccountEditorPref(expanded) {
      try {
        localStorage.setItem(scopedKey(ACCOUNT_EDITOR_KEY), expanded ? "1" : "0");
      } catch (e) {
      }
    }
    function applyAccountEditor(connected) {
      const editor = el("cookieEditor");
      const toggle = el("accountToggle");
      if (!editor)
        return;
      if (!connected) {
        accountEditorExpanded = true;
      } else if (lastAccountConnected !== connected) {
        accountEditorExpanded = false;
      } else if (accountEditorExpanded === null) {
        accountEditorExpanded = false;
      }
      lastAccountConnected = connected;
      editor.hidden = !accountEditorExpanded;
      const logout = el("twitterClear");
      if (logout)
        logout.hidden = !connected;
      if (toggle) {
        toggle.classList.toggle("is-expanded", !!accountEditorExpanded);
        toggle.setAttribute("aria-expanded", String(!!accountEditorExpanded));
        toggle.setAttribute("title", accountEditorExpanded ? "\u6536\u8D77 Cookie \u8F93\u5165" : "\u5C55\u5F00 Cookie \u8F93\u5165");
      }
    }
    function setupAccountToggle() {
      const toggle = el("accountToggle");
      if (!toggle || toggle.dataset.bound === "1")
        return;
      toggle.dataset.bound = "1";
      const flip = () => {
        const editor = el("cookieEditor");
        if (!editor)
          return;
        const willExpand = !!editor.hidden;
        accountEditorExpanded = willExpand;
        writeAccountEditorPref(willExpand);
        applyAccountEditor(lastAccountConnected === true);
      };
      toggle.addEventListener("click", flip);
      toggle.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip();
        }
      });
    }
    function renderTwitterProfile(profile) {
      const avatarEl = el("twitterAvatar");
      const nameEl = el("twitterName");
      const handleEl = el("twitterHandle");
      if (!avatarEl && !nameEl)
        return;
      const data = profile || twitterMonitor2.getSavedProfile();
      if (!data || !data.screenName && !data.name) {
        if (nameEl)
          nameEl.textContent = "\u672A\u8FDE\u63A5\u8D26\u53F7";
        if (handleEl)
          handleEl.textContent = "\u672A\u8FDE\u63A5 \xB7 \u4FDD\u5B58 Cookie \u540E\u663E\u793A\u771F\u5B9E\u5934\u50CF\u4E0E\u540D\u79F0";
        if (avatarEl)
          avatarEl.style.backgroundImage = "";
        applyAccountEditor(false);
        return;
      }
      const src = data.avatarData || data.avatar;
      if (avatarEl) {
        if (src) {
          avatarEl.style.backgroundImage = `url("${src}")`;
          avatarEl.style.backgroundSize = "cover";
        } else {
          avatarEl.style.backgroundImage = "";
        }
      }
      if (nameEl)
        nameEl.textContent = data.name || (data.screenName ? "@" + data.screenName : "\u5DF2\u8FDE\u63A5");
      if (handleEl)
        handleEl.textContent = data.screenName ? "@" + data.screenName : "\u5DF2\u8FDE\u63A5";
      applyAccountEditor(true);
    }
    function applySourceCheckboxes() {
      const likes = el("twitterMonitorLikes");
      const bookmarks = el("twitterMonitorBookmarks");
      const dm = el("twitterMonitorDm");
      const prefs = twitterMonitor2.getPrefs();
      if (likes)
        likes.checked = prefs.likes !== false;
      if (bookmarks)
        bookmarks.checked = prefs.bookmarks !== false;
      if (dm)
        dm.checked = prefs.dm !== false;
    }
    function updateChatHint(count, total, encrypted) {
      const hint = el("chatHint");
      if (!hint)
        return;
      const totalText = typeof total === "number" && total > 0 ? "\u5171 " + total + " \u4E2A\u804A\u5929\uFF1B" : "";
      const encryptedText = typeof encrypted === "number" && encrypted > 0 ? "\u5176\u4E2D " + encrypted + " \u4E2A\u662F\u52A0\u5BC6\u804A\u5929\uFF08\u4EC5\u80FD\u663E\u793A\uFF0C\u8BFB\u4E0D\u5230\u91CC\u9762\u7684\u94FE\u63A5\uFF09\uFF1B" : "";
      hint.textContent = count ? totalText + encryptedText + "\u5DF2\u9009\u62E9 " + count + " \u4E2A\u804A\u5929\uFF0C\u53EA\u6293\u53D6\u8FD9\u4E9B\u804A\u5929\u91CC\u597D\u53CB\u53D1\u6765\u7684\u94FE\u63A5" : totalText + encryptedText + "\u672A\u9009\u62E9\u65F6\u6293\u53D6\u6240\u6709\u804A\u5929\uFF1B\u52FE\u9009\u540E\u53EA\u6293\u53D6\u6240\u9009\u804A\u5929\u91CC\u597D\u53CB\u53D1\u6765\u7684\u94FE\u63A5";
    }
    function persistChatSelection() {
      const list = el("chatList");
      if (!list)
        return;
      const ids = Array.from(list.querySelectorAll('input[type="checkbox"]')).filter((input) => input.checked).map((input) => input.value);
      twitterMonitor2.setPrefs({ dmChats: ids });
      const chats = twitterMonitor2.getCachedConversations();
      updateChatHint(ids.length, chats.length, chats.filter((chat) => chat.encrypted).length);
    }
    function renderChatList() {
      const list = el("chatList");
      if (!list)
        return;
      const prefs = twitterMonitor2.getPrefs();
      const selected = new Set((prefs.dmChats || []).map(String));
      const chats = twitterMonitor2.getCachedConversations();
      const connected = twitterAuth2.hasAuth();
      list.textContent = "";
      if (!chats.length) {
        const empty = document.createElement("div");
        empty.className = "chat-empty";
        empty.textContent = connected ? "\u70B9\u300C\u5237\u65B0\u5217\u8868\u300D\u83B7\u53D6\u804A\u5929" : "\u4FDD\u5B58 Cookie \u540E\u53EF\u9009\u62E9\u804A\u5929";
        list.appendChild(empty);
        updateChatHint(selected.size, chats.length);
        return;
      }
      chats.forEach((chat) => {
        const row = document.createElement("label");
        row.className = "chat-item";
        const input = document.createElement("input");
        input.type = "checkbox";
        input.value = String(chat.id);
        input.checked = selected.has(String(chat.id));
        input.addEventListener("change", persistChatSelection);
        row.appendChild(input);
        const check = document.createElement("span");
        check.className = "chat-check";
        row.appendChild(check);
        const avatar = document.createElement("img");
        if (chat.avatarData)
          avatar.src = chat.avatarData;
        else
          avatar.style.display = "none";
        row.appendChild(avatar);
        const name = document.createElement("span");
        name.className = "chat-name";
        name.textContent = chat.name || chat.screenName || "\u672A\u77E5\u804A\u5929";
        row.appendChild(name);
        const handle = document.createElement("span");
        handle.className = "chat-handle";
        handle.textContent = (chat.screenName ? "@" + chat.screenName : "") + (chat.encrypted ? " \xB7 \u52A0\u5BC6" : "");
        row.appendChild(handle);
        list.appendChild(row);
      });
      updateChatHint(selected.size, chats.length, chats.filter((chat) => chat.encrypted).length);
    }
    async function refreshChatList() {
      const hint = el("chatHint");
      const button = el("chatRefresh");
      if (!twitterAuth2.hasAuth()) {
        if (hint)
          hint.textContent = "\u4FDD\u5B58 Cookie \u540E\u624D\u80FD\u8BFB\u53D6\u804A\u5929\u5217\u8868";
        return;
      }
      if (button)
        button.classList.add("is-loading");
      if (hint)
        hint.textContent = "\u6B63\u5728\u8BFB\u53D6\u804A\u5929\u5217\u8868\u2026";
      let result = null;
      try {
        result = await twitterMonitor2.refreshConversations();
      } catch (error) {
        result = { ok: false, error: error && error.message || "error", items: [] };
      }
      if (button)
        button.classList.remove("is-loading");
      if (!result || result.ok === false) {
        const errorText = (result && result.error) === "no-cookie" ? "\u4FDD\u5B58 Cookie \u540E\u624D\u80FD\u8BFB\u53D6\u804A\u5929\u5217\u8868" : "\u8BFB\u53D6\u5931\u8D25\uFF1A" + (result && result.error || "error");
        renderChatList();
        if (hint)
          hint.textContent = errorText;
        return;
      }
      renderChatList();
    }
    function setupChatPicker() {
      const button = el("chatRefresh");
      if (button && !button.dataset.bound) {
        button.dataset.bound = "1";
        button.addEventListener("click", refreshChatList);
      }
    }
    function applyIntervalSelect() {
      const select = el("monitorInterval");
      if (!select)
        return;
      const prefs = twitterMonitor2.getPrefs();
      const savedChoice = getIntervalChoice();
      const minutes = savedChoice === null ? prefs.enabled ? Math.max(2, Math.round((prefs.ms || 6e5) / 6e4)) : 0 : savedChoice;
      const values = Array.from(select.options).map((option) => Number(option.value));
      let chosen = values.includes(minutes) ? minutes : 0;
      if (!chosen && minutes) {
        const positives = values.filter((value) => value > 0);
        chosen = positives.reduce((best, value) => Math.abs(value - minutes) < Math.abs(best - minutes) ? value : best, positives[0]);
      }
      select.value = String(chosen || 0);
    }
    function refreshAccountFields() {
      const sankakuInput = el("sankakuToken");
      if (sankakuInput)
        sankakuInput.value = sankakuAuth2.getStoredAuth() || "";
      const sankakuStatus = el("sankakuAuthStatus");
      if (sankakuStatus)
        sankakuStatus.textContent = "";
      const token = el("authToken");
      const ct0 = el("ct0");
      if (token || ct0) {
        const parts = twitterAuth2.splitCookie();
        if (token)
          token.value = parts.authToken;
        if (ct0)
          ct0.value = parts.ct0;
      }
      const passcode = el("chatPasscode");
      if (passcode)
        passcode.value = twitterMonitor2.getPrefs().chatPasscode || "";
      applyIntervalSelect();
      applySourceCheckboxes();
      renderChatList();
      setupChatPicker();
      const status = el("twitterAuthStatus");
      if (status)
        status.textContent = twitterAuth2.hasAuth() ? "Cookie \u5DF2\u4FDD\u5B58" : "";
      setupAccountToggle();
      renderTwitterProfile();
    }
    function autoGrowTextarea() {
    }
    var RULE_FIELDS = ["authorId", "tweetId", "screenName", "text", "name"];
    function hydrateColumns(opts) {
      const columns = {
        name: opts.twitterNamePref,
        annotation: opts.twitterAnnotationPref,
        tags: opts.twitterTagsPref
      };
      Object.keys(columns).forEach((key) => {
        const pref = columns[key];
        if (!pref)
          return;
        RULE_FIELDS.forEach((field) => {
          if (typeof pref[field] !== "boolean")
            return;
          const ui3 = shell();
          if (ui3)
            ui3.setColumnChecked(key, field, pref[field]);
        });
        const ui2 = shell();
        if (!ui2)
          return;
        if (Array.isArray(pref.order))
          ui2.applyOrder(key, pref.order);
        if (key === "tags" && Array.isArray(pref.join))
          ui2.applyJoin(pref.join);
      });
    }
    function hydrateControls(opts) {
      const bindCheck = (id, value) => {
        const node = el(id);
        if (node && typeof value === "boolean")
          node.checked = value;
      };
      const bindSelect = (id, value) => {
        const node = el(id);
        if (node && value != null)
          node.value = String(value);
      };
      bindCheck("autoAddSourceToggle", opts.autoAddSourcePref);
      bindCheck("xhsTagsToggle", opts.xhsTagsPref);
      bindCheck("xhsMultiFileToggle", opts.xhsMultiFilePref);
      bindCheck("twMultiFileToggle", opts.twitterMultiFilePref);
      bindSelect("maxResolution", opts.maxResolutionPref);
      bindSelect("maxFramerate", opts.maxFrameratePref);
      bindSelect("threadCount", opts.threadCountPref);
    }
    function showDepsPage(options = {}) {
      const { tab = "settings", gating = false } = options;
      hydrateControls(options);
      hydrateColumns(options);
      applyIntervalSelect();
      refreshAccountFields();
      setupThemeControls();
      switchSubpageTab(gating ? "dependencies" : tab);
      setDepsGating(gating);
    }
    module2.exports = {
      updateTheme,
      showMainUI,
      showTip,
      isValidUrl,
      setupInputBar,
      setInputBarState,
      appendQueueItem,
      updateQueueItem,
      setQueuePaused,
      showCopiedFeedback,
      showCopiedErrorFeedback,
      canDeleteQueueItem,
      removeQueueItem,
      showDepsPage,
      hideDepsPage,
      setDepsGating,
      switchSubpageTab,
      autoGrowTextarea,
      applyTwitterNameOrder,
      applyTwitterAnnotationOrder,
      applyTwitterTagsOrder,
      refreshTwitterTagJoins,
      refreshAccountFields,
      applyIntervalSelect,
      getIntervalChoice,
      setIntervalChoice,
      applySourceCheckboxes,
      renderTwitterProfile,
      renderChatList,
      refreshChatList,
      friendlyError,
      displayTitle,
      updateDepsBadge,
      updateYtdlpCard,
      updateFfmpegCard,
      setupThemeControls,
      getFollowEagleTheme,
      setFollowEagleTheme,
      setManualTheme
    };
  }
});

// Plugin/_locales/en.json
var require_en = __commonJS({
  "Plugin/_locales/en.json"(exports2, module2) {
    module2.exports = {
      manifest: {
        app: {
          name: "\u5A92\u4F53\u4E0B\u8F7D\u5668"
        }
      },
      ui: {
        appTitle: "Media Downloader",
        inputPlaceholder: "Paste any video URL...",
        downloadBtn: "Download",
        downloadingBtn: "Downloading...",
        preparing: "Preparing...",
        waiting: "Waiting...",
        downloading: "Downloading...",
        completed: "Complete",
        retry: "Retry",
        cancel: "Cancel",
        addToQueue: "Add to Queue",
        loading: "Loading...",
        successDownload: "Successful download",
        paste: "Paste from clipboard",
        pin: "Always on Top"
      },
      queue: {
        waiting: "Waiting...",
        preparing: "Fetching video info...",
        downloading: "Downloading",
        completed: "Completed",
        error: "Download failed",
        retry: "Retry",
        copyUrl: "Copy URL",
        copyError: "Copy Error",
        copied: "Copied!",
        eta: "ETA",
        merging: "Merging",
        converting: "Converting",
        remove: "Remove from list"
      },
      download: {
        fetchingInfo: "Fetching video information...",
        foundVideo: "Found video",
        complete: "Download complete, importing to Eagle...",
        importSuccess: "Import successful",
        failed: "Download failed"
      },
      error: {
        notInitialized: "Plugin not yet initialized",
        emptyUrl: "Please enter a video URL",
        invalidUrl: "Please enter a valid HTTPS video URL",
        fileNotFound: "Download complete but file not found",
        eagleImportFailed: "Failed to import to Eagle",
        duplicateFound: "This video already exists in library",
        checkingDuplicate: "Checking for duplicates...",
        clickToRedownload: "Click to re-download and import",
        eagleApiNotAvailable: "Eagle API not available",
        untitledVideo: "Untitled Video",
        downloadedVideo: "Downloaded Video",
        ytdlpNotInstalled: "yt-dlp not installed",
        ytdlpNotFound: "yt-dlp executable not found, please restart the plugin to re-download",
        ytdlpPermissionDenied: "yt-dlp has no execute permission",
        failedToExecuteYtdlp: "Failed to execute yt-dlp",
        ytdlpExitedWithCode: "yt-dlp exited with code",
        networkUnavailable: "Network unavailable \u2014 check your connection or proxy settings and retry",
        blockedAddress: "Access blocked \u2014 this address is not allowed",
        unsupportedUrl: "Unsupported website or link \u2014 please verify that the platform is supported",
        dribbbleProtected: "Dribbble pages are bot-protected. Please right-click the video in your browser, copy the direct video URL (.mp4), and paste it here",
        dribbbleExtractFailed: "Failed to extract Dribbble shot content, please check your network or copy the direct video URL from browser",
        dribbbleNoMedia: "No downloadable video or image found in this Dribbble shot",
        sankakuExtractFailed: "Failed to read Sankaku post data, please check your network and try again",
        sankakuRateLimited: "Sankaku API rate limit reached, please wait a minute and retry",
        sankakuNotFound: "Sankaku post not found - the link may be wrong or the post was deleted",
        sankakuUnavailable: "This Sankaku post is unavailable (deleted or restricted)",
        sankakuLoginRequired: "This Sankaku post requires a signed-in account to download",
        sankakuNoMedia: "No downloadable video or image found in this Sankaku post",
        videoUnavailable: "Video is unavailable or has been removed",
        privateVideo: "This video is private or requires sign-in",
        unknown: "Unknown",
        sankakuLoginOrDeleted: "Sankaku post not found for anonymous requests; it may require login or be deleted. Add your account cookie in Settings -> Sankaku Account.",
        sankakuAuthExpired: "Sankaku login expired. Please update the account cookie in Settings -> Sankaku Account.",
        xhsExtractFailed: "Failed to read this Xiaohongshu note, please check your network and try again",
        xhsNoteUnavailable: "This Xiaohongshu note cannot be read: the link must include xsec_token (copy the full link from the app share menu or the browser address bar). The note may also be deleted or login-only.",
        xhsUnsupported: "Only Xiaohongshu note links are supported (/explore/ or /discovery/item/)",
        xhsNoMedia: "No downloadable image or video found in this Xiaohongshu note"
      },
      progress: {
        remaining: "Remaining"
      },
      update: {
        available: "New yt-dlp version available ({{version}})",
        clickToUpdate: "Update",
        updating: "Updating... {{percent}}%",
        done: "\u2713 Updated to latest version"
      },
      deps: {
        title: "Settings & Dependencies",
        tabSettings: "Settings",
        tabTags: "Import Info",
        tabDependencies: "Dependencies",
        sectionPreferences: "Preferences",
        sectionEngines: "Core Engines",
        appearanceTitle: "Appearance",
        themeLabel: "Theme",
        themeHint: "Pick a colour scheme, or enable the switch below to follow Eagle",
        followThemeLabel: "Follow Eagle theme",
        followThemeHint: "Use Eagle's current appearance; turn off to use the theme selected above",
        themeLight: "Light",
        themeLightgray: "Light gray",
        themeGray: "Gray",
        themeDark: "Dark",
        themeBlue: "Deep blue",
        themePurple: "Purple",
        autoAddSourceLabel: "Auto-set Eagle Data Source",
        autoAddSourceHint: "When enabled, original web URLs are automatically saved to Eagle items",
        tagsTitle: "Import Info Rules",
        xhsTagsLabel: "Xiaohongshu Tags",
        xhsTagsHint: "When enabled, Xiaohongshu note topics are written as Eagle tags; turn off to import without any tags",
        tagsNote: "Tags are written into Eagle when an item is imported: Xiaohongshu notes use their topics, other sites use the site identifier. Up to 30 tags per import.",
        xhsMultiFileLabel: "Distinguish Multiple Files",
        xhsMultiFileHint: 'Append " (1/N)" to the item name when one note yields several images or videos; turn off to let them share one name.',
        twMultiFileLabel: "Distinguish Multiple Files",
        twMultiFileHint: 'Append " (1/N)" to the item name when one tweet yields several images or videos; turn off to let them share one name.',
        twNameTitle: "Twitter Info Rules",
        twNameHint: `The left column builds the item name, the middle one its annotation and the right one extra tags; each row's arrows set the order. With nothing selected the name keeps "tweet text - @handle", the annotation keeps the plain tweet text and the tags stay as the site tag. Twitter ID means the author numeric ID.`,
        twNameColumnTitle: "Name",
        twNameAuthorIdLabel: "Twitter ID",
        twNameTweetIdLabel: "Tweet ID",
        twNameScreenNameLabel: "Username",
        twNameTextLabel: "Text",
        twNameFullNameLabel: "Full name",
        twNameNote: 'Name: fields joined with " - " in the order you arrange, up to 150 characters; illegal filename characters are replaced.',
        twAnColumnTitle: "Annotation",
        twAnAuthorIdLabel: "Twitter ID",
        twAnTweetIdLabel: "Tweet ID",
        twAnScreenNameLabel: "Username",
        twAnTextLabel: "Text",
        twAnFullNameLabel: "Full name",
        twAnNote: 'Annotation: joined with " - " in the order you arrange, up to 5000 characters; checking any field replaces the plain tweet text, so check "Text" to keep it.',
        twTagColumnTitle: "Tags",
        twTagAuthorIdLabel: "Twitter ID",
        twTagTweetIdLabel: "Tweet ID",
        twTagScreenNameLabel: "Username",
        twTagTextLabel: "Text",
        twTagFullNameLabel: "Full name",
        twTagNote: 'Tags: each checked field becomes its own tag, listed after the site tag in the order you arrange; a tag longer than 100 characters is truncated. When two adjacent tags are both checked, a chain button appears between them - click it to merge the two into one tag joined with " - ".',
        twTagJoinLabel: "Combine with the tag above",
        maxResolutionLabel: "Max Resolution",
        maxResolutionHint: "Limit the maximum video resolution. If not available, automatically falls back to the highest available resolution.",
        maxFramerateLabel: "Max Frame Rate",
        maxFramerateHint: "Limit the maximum frame rate. If not available, automatically falls back to the highest available frame rate.",
        resAuto: "Auto (Best)",
        fpsAuto: "Auto (Best)",
        setupRequired: "These components are required for first-time use. The main view will open automatically once setup is complete.",
        back: "Back",
        ytdlpDesc: "Video extraction & download engine",
        ffmpegDesc: "Video merging & transcoding engine",
        ffmpegManaged: "Managed by Eagle, no action needed",
        ffmpegNotFoundHint: "Eagle built-in FFmpeg plugin not found. Please click the button below to install it.",
        ffmpegUnsupported: "Eagle official FFmpeg plugin is required for audio/video merging",
        installFfmpegDep: "Install FFmpeg Dependency",
        checking: "Checking...",
        installed: "Installed",
        checkingUpdate: "Checking for updates...",
        latest: "Up to date",
        outdated: "Update",
        missing: "Not installed",
        eagleBuiltin: "Eagle built-in",
        notFound: "Not found",
        installing: "Installing...",
        updating: "Updating...",
        reinstalling: "Reinstalling...",
        doneInstalled: "Installed",
        doneUpdated: "Updated",
        doneReinstalled: "Reinstalled",
        install: "Install",
        update: "Update",
        reinstall: "Reinstall",
        uninstall: "Uninstall",
        retry: "Retry",
        downloadFailed: "Download failed",
        versionInstalled: "Version: {{version}}",
        versionUpdate: "{{from}} \u2192 {{to}}",
        progressText: "Downloading... {{percent}}%",
        threadCountLabel: "Download Threads",
        threadCountHint: "Concurrent fragments for HLS/DASH. Not always faster; direct MP4 stays single-connection.",
        threadAuto: "Auto (Default)",
        sankakuAuthLabel: "Sankaku Account",
        sankakuAuthHint: "Paste the accessToken cookie (or JSON from get-cookies / Cookie-Editor) to download login-only posts.",
        sankakuAuthPlaceholder: '{"accessToken":"..."} or accessToken=...',
        sankakuAuthSave: "Save",
        sankakuAuthClear: "Clear",
        sankakuAuthSaved: "Saved. Login-only posts will use this session.",
        sankakuAuthCleared: "Cleared.",
        sankakuAuthInvalid: "No accessToken found in the pasted text.",
        tabAccount: "Accounts",
        twitterAuthLabel: "Twitter / X Account",
        twitterAuthHint: "Copy auth_token and ct0 from the browser cookies of a logged-in x.com session.",
        twitterAuthReady: "Cookie saved",
        twitterAuthSaved: "Saved, account: {{name}}",
        twitterAuthInvalid: "Cookie needs both auth_token and ct0",
        twitterAuthCleared: "Cookie cleared",
        twitterAuthTesting: "Testing\u2026",
        twitterAuthFailed: "Connection failed: {{error}}",
        twitterMonitorLabel: "Auto fetch likes & bookmarks",
        twitterMonitorHint: "New likes and bookmarks are pushed to the download queue automatically.",
        twitterMonitorOn: "Fetching every {{interval}}",
        twitterMonitorOff: "Fetching is off",
        twitterCatchup: "Caught up {{count}} new posts since last session",
        twitterCatchupTruncated: "more pending in the next cycle",
        twitterAuthSave: "Save & Test",
        twitterAuthClear: "Clear",
        unitSeconds: "seconds",
        unitMinutes: "minutes",
        unitHours: "hours",
        twitterMonitorMinHint: "Recommended minimum: 2 minutes",
        twitterMonitorLikesLabel: "Fetch likes",
        twitterMonitorBookmarksLabel: "Fetch bookmarks",
        twitterMonitorNoSource: "Select at least one of fetch likes / fetch bookmarks",
        twitterIntervalOffLabel: "Off",
        sankakuAuthTesting: "Testing\u2026",
        monitorIdle: "Idle",
        monitorCountdown: "Next {{time}}",
        twitterFetching: "Fetching\u2026",
        twitterMonitorTest: "Fetch test"
      }
    };
  }
});

// Plugin/_locales/zh_CN.json
var require_zh_CN = __commonJS({
  "Plugin/_locales/zh_CN.json"(exports2, module2) {
    module2.exports = {
      manifest: {
        app: {
          name: "\u5A92\u4F53\u4E0B\u8F7D\u5668"
        }
      },
      ui: {
        appTitle: "\u5A92\u4F53\u4E0B\u8F7D\u5668",
        inputPlaceholder: "\u7C98\u8D34\u4EFB\u610F\u89C6\u9891\u94FE\u63A5...",
        downloadBtn: "\u4E0B\u8F7D",
        downloadingBtn: "\u4E0B\u8F7D\u4E2D...",
        preparing: "\u51C6\u5907\u4E2D...",
        waiting: "\u7B49\u5F85\u4E2D...",
        downloading: "\u4E0B\u8F7D\u4E2D...",
        completed: "\u5B8C\u6210",
        retry: "\u91CD\u8BD5",
        cancel: "\u53D6\u6D88",
        addToQueue: "\u6DFB\u52A0\u5230\u961F\u5217",
        loading: "\u52A0\u8F7D\u4E2D...",
        successDownload: "\u4E0B\u8F7D\u6210\u529F",
        paste: "\u7C98\u8D34\u526A\u8D34\u677F\u5185\u5BB9",
        pin: "\u7A97\u53E3\u7F6E\u9876"
      },
      queue: {
        waiting: "\u7B49\u5F85\u4E2D...",
        preparing: "\u83B7\u53D6\u5A92\u4F53\u4FE1\u606F...",
        downloading: "\u4E0B\u8F7D\u4E2D",
        completed: "\u5DF2\u5B8C\u6210",
        error: "\u4E0B\u8F7D\u5931\u8D25",
        retry: "\u91CD\u8BD5",
        copyUrl: "\u590D\u5236\u94FE\u63A5",
        copyError: "\u590D\u5236\u9519\u8BEF",
        copied: "\u5DF2\u590D\u5236",
        eta: "\u5269\u4F59",
        merging: "\u5408\u5E76\u4E2D",
        converting: "\u8F6C\u7801\u4E2D",
        remove: "\u5220\u9664\u8BB0\u5F55"
      },
      download: {
        fetchingInfo: "\u6B63\u5728\u83B7\u53D6\u5A92\u4F53\u4FE1\u606F...",
        foundVideo: "\u627E\u5230\u89C6\u9891",
        complete: "\u4E0B\u8F7D\u5B8C\u6210\uFF0C\u6B63\u5728\u5BFC\u5165 Eagle...",
        importSuccess: "\u5BFC\u5165\u6210\u529F",
        failed: "\u4E0B\u8F7D\u5931\u8D25"
      },
      error: {
        notInitialized: "\u63D2\u4EF6\u5C1A\u672A\u521D\u59CB\u5316\u5B8C\u6210",
        emptyUrl: "\u8BF7\u8F93\u5165\u89C6\u9891\u94FE\u63A5",
        invalidUrl: "\u8BF7\u8F93\u5165\u6709\u6548\u7684 HTTPS \u89C6\u9891\u94FE\u63A5",
        fileNotFound: "\u4E0B\u8F7D\u5B8C\u6210\u4F46\u627E\u4E0D\u5230\u6587\u4EF6",
        eagleImportFailed: "\u5BFC\u5165 Eagle \u5931\u8D25",
        duplicateFound: "\u8BE5\u89C6\u9891\u5DF2\u5B58\u5728\u4E8E\u5E93\u4E2D",
        checkingDuplicate: "\u6B63\u5728\u68C0\u67E5\u91CD\u590D...",
        clickToRedownload: "\u70B9\u51FB\u91CD\u65B0\u4E0B\u8F7D\u5E76\u5BFC\u5165",
        eagleApiNotAvailable: "Eagle API \u4E0D\u53EF\u7528",
        untitledVideo: "\u672A\u547D\u540D\u89C6\u9891",
        downloadedVideo: "\u5DF2\u4E0B\u8F7D\u89C6\u9891",
        ytdlpNotInstalled: "yt-dlp \u672A\u5B89\u88C5",
        ytdlpNotFound: "\u627E\u4E0D\u5230 yt-dlp \u6267\u884C\u6587\u4EF6\uFF0C\u8BF7\u91CD\u542F\u63D2\u4EF6\u91CD\u65B0\u4E0B\u8F7D",
        ytdlpPermissionDenied: "yt-dlp \u6CA1\u6709\u6267\u884C\u6743\u9650",
        failedToExecuteYtdlp: "\u6267\u884C yt-dlp \u5931\u8D25",
        ytdlpExitedWithCode: "yt-dlp \u9000\u51FA\uFF0C\u4EE3\u7801",
        networkUnavailable: "\u7F51\u7EDC\u4E0D\u53EF\u7528 \u2014\u2014 \u8BF7\u68C0\u67E5\u7F51\u7EDC\u8FDE\u63A5\u6216\u4EE3\u7406\u8BBE\u7F6E\u540E\u91CD\u8BD5",
        blockedAddress: "\u8BBF\u95EE\u88AB\u963B\u65AD \u2014\u2014 \u8BE5\u5730\u5740\u4E0D\u88AB\u5141\u8BB8",
        unsupportedUrl: "\u6682\u4E0D\u652F\u6301\u6B64\u7F51\u7AD9\u6216\u94FE\u63A5 \u2014\u2014 \u8BF7\u786E\u8BA4\u662F\u5426\u4E3A\u53D7\u652F\u6301\u7684\u89C6\u9891\u5E73\u53F0",
        dribbbleProtected: "Dribbble \u9875\u9762\u53D7\u9632\u722C\u4FDD\u62A4\u65E0\u6CD5\u76F4\u63A5\u89E3\u6790\uFF0C\u8BF7\u5728\u6D4F\u89C8\u5668\u4E2D\u53F3\u952E\u89C6\u9891\u590D\u5236\u300C\u89C6\u9891\u5730\u5740\u300D(.mp4) \u540E\u4E0B\u8F7D",
        dribbbleExtractFailed: "Dribbble \u5185\u5BB9\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u6216\u5728\u6D4F\u89C8\u5668\u4E2D\u590D\u5236\u89C6\u9891\u76F4\u94FE",
        dribbbleNoMedia: "\u672A\u5728\u8BE5 Dribbble \u9875\u9762\u4E2D\u627E\u5230\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891\u6216\u56FE\u7247",
        sankakuExtractFailed: "Sankaku \u6295\u7A3F\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        sankakuRateLimited: "Sankaku API \u8BF7\u6C42\u8FC7\u4E8E\u9891\u7E41\uFF0C\u8BF7\u7A0D\u7B49\u4E00\u5206\u949F\u518D\u8BD5",
        sankakuNotFound: "\u672A\u627E\u5230\u8BE5 Sankaku \u6295\u7A3F\uFF0C\u94FE\u63A5\u53EF\u80FD\u6709\u8BEF\u6216\u6295\u7A3F\u5DF2\u5220\u9664",
        sankakuUnavailable: "\u8BE5 Sankaku \u6295\u7A3F\u4E0D\u53EF\u7528\uFF08\u5DF2\u5220\u9664\u6216\u53D7\u9650\uFF09",
        sankakuLoginRequired: "\u8BE5 Sankaku \u6295\u7A3F\u9700\u8981\u767B\u5F55\u8D26\u53F7\u624D\u80FD\u4E0B\u8F7D",
        sankakuNoMedia: "\u672A\u5728\u8BE5 Sankaku \u6295\u7A3F\u4E2D\u627E\u5230\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891\u6216\u56FE\u7247",
        videoUnavailable: "\u89C6\u9891\u4E0D\u53EF\u7528\u6216\u5DF2\u88AB\u5220\u9664",
        privateVideo: "\u79C1\u5BC6\u89C6\u9891\u6216\u9700\u8981\u767B\u5F55\u8BBF\u95EE",
        unknown: "\u672A\u77E5",
        sankakuLoginOrDeleted: "\u672A\u627E\u5230\u8BE5\u6295\u7A3F\uFF0C\u53EF\u80FD\u9700\u8981\u767B\u5F55\u540E\u624D\u80FD\u67E5\u770B\uFF0C\u6216\u6295\u7A3F\u5DF2\u5220\u9664\u3002\u53EF\u5728\u300C\u8BBE\u7F6E \u2192 Sankaku \u8D26\u53F7\u300D\u4E2D\u586B\u5199 Cookie \u540E\u91CD\u8BD5\u3002",
        sankakuAuthExpired: "Sankaku \u767B\u5F55\u5DF2\u5931\u6548\uFF0C\u8BF7\u5728\u300C\u8BBE\u7F6E \u2192 Sankaku \u8D26\u53F7\u300D\u4E2D\u66F4\u65B0 Cookie\u3002",
        xhsExtractFailed: "\u5C0F\u7EA2\u4E66\u7B14\u8BB0\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u7F51\u7EDC\u540E\u91CD\u8BD5",
        xhsNoteUnavailable: "\u65E0\u6CD5\u8BFB\u53D6\u8BE5\u5C0F\u7EA2\u4E66\u7B14\u8BB0\uFF1A\u94FE\u63A5\u9700\u5E26 xsec_token\uFF08\u8BF7\u4ECE App \u5206\u4EAB\u83DC\u5355\u6216\u6D4F\u89C8\u5668\u5730\u5740\u680F\u590D\u5236\u5B8C\u6574\u94FE\u63A5\uFF09\uFF0C\u4E5F\u53EF\u80FD\u7B14\u8BB0\u5DF2\u5220\u9664\u6216\u4EC5\u767B\u5F55\u53EF\u89C1",
        xhsUnsupported: "\u4EC5\u652F\u6301\u5C0F\u7EA2\u4E66\u7B14\u8BB0\u94FE\u63A5\uFF08/explore/ \u6216 /discovery/item/\uFF09",
        xhsNoMedia: "\u672A\u5728\u8BE5\u5C0F\u7EA2\u4E66\u7B14\u8BB0\u4E2D\u627E\u5230\u53EF\u4E0B\u8F7D\u7684\u56FE\u7247\u6216\u89C6\u9891"
      },
      progress: {
        remaining: "\u5269\u4F59"
      },
      update: {
        available: "\u53D1\u73B0\u65B0\u7248\u672C yt-dlp ({{version}})",
        clickToUpdate: "\u66F4\u65B0",
        updating: "\u6B63\u5728\u66F4\u65B0... {{percent}}%",
        done: "\u2713 \u5DF2\u66F4\u65B0\u81F3\u6700\u65B0\u7248"
      },
      deps: {
        title: "\u8BBE\u7F6E\u4E0E\u4F9D\u8D56\u7BA1\u7406",
        tabSettings: "\u504F\u597D\u8BBE\u7F6E",
        tabTags: "\u5BFC\u5165\u4FE1\u606F\u89C4\u5219",
        tabDependencies: "\u4F9D\u8D56\u7BA1\u7406",
        sectionPreferences: "\u504F\u597D\u8BBE\u7F6E",
        sectionEngines: "\u6838\u5FC3\u5F15\u64CE\u4F9D\u8D56",
        appearanceTitle: "\u5916\u89C2",
        themeLabel: "\u4E3B\u9898",
        themeHint: "\u9009\u62E9\u754C\u9762\u914D\u8272\uFF0C\u6216\u5F00\u542F\u4E0B\u65B9\u5F00\u5173\u8DDF\u968F Eagle",
        followThemeLabel: "\u8DDF\u968F Eagle \u4E3B\u9898",
        followThemeHint: "\u5F00\u542F\u540E\u4F7F\u7528 Eagle \u5F53\u524D\u7684\u5916\u89C2\u4E3B\u9898\uFF0C\u5173\u95ED\u540E\u4F7F\u7528\u4E0A\u9762\u9009\u62E9\u7684\u4E3B\u9898",
        themeLight: "\u6D45\u8272",
        themeLightgray: "\u6D45\u7070",
        themeGray: "\u7070\u8272",
        themeDark: "\u6DF1\u8272",
        themeBlue: "\u6DF1\u84DD",
        themePurple: "\u7D2B\u8272",
        autoAddSourceLabel: "\u81EA\u52A8\u8BBE\u7F6E Eagle \u6570\u636E\u6765\u6E90",
        autoAddSourceHint: "\u5F00\u542F\u540E\uFF0C\u4E0B\u8F7D\u89C6\u9891\u65F6\u4F1A\u81EA\u52A8\u5728 Eagle \u4E2D\u8BB0\u5F55\u539F\u59CB\u7F51\u9875 URL",
        tagsTitle: "\u5BFC\u5165\u4FE1\u606F\u89C4\u5219",
        xhsTagsLabel: "\u5C0F\u7EA2\u4E66\u6807\u7B7E",
        xhsTagsHint: "\u5F00\u542F\u540E\uFF0C\u4E0B\u8F7D\u5C0F\u7EA2\u4E66\u7B14\u8BB0\u65F6\u4F1A\u628A\u7B14\u8BB0\u8BDD\u9898\u5199\u5165 Eagle \u6807\u7B7E\uFF1B\u5173\u95ED\u5219\u4E0D\u5E26\u4EFB\u4F55\u6807\u7B7E",
        tagsNote: "\u6807\u7B7E\u5728\u4E0B\u8F7D\u5B8C\u6210\u5BFC\u5165 Eagle \u65F6\u5199\u5165\uFF1A\u5C0F\u7EA2\u4E66\u7B14\u8BB0\u5199\u5165\u8BDD\u9898\u6807\u7B7E\uFF0C\u5176\u4ED6\u7AD9\u70B9\u5199\u5165\u7AD9\u70B9\u6807\u8BC6\uFF0C\u5355\u6B21\u5BFC\u5165\u6700\u591A 30 \u4E2A\u6807\u7B7E\u3002",
        xhsMultiFileLabel: "\u591A\u56FE\u533A\u5206",
        xhsMultiFileHint: "\u5F00\u542F\u540E\uFF0C\u540C\u4E00\u7BC7\u7B14\u8BB0\u6709\u591A\u4E2A\u56FE\u7247\u6216\u89C6\u9891\u65F6\uFF0C\u540D\u79F0\u672B\u5C3E\u81EA\u52A8\u8FFD\u52A0\u300C (1/N)\u300D\uFF1B\u5173\u95ED\u5219\u51E0\u4E2A\u6587\u4EF6\u5171\u7528\u540C\u4E00\u4E2A\u540D\u79F0\u3002",
        twMultiFileLabel: "\u591A\u6587\u4EF6\u533A\u5206",
        twMultiFileHint: "\u5F00\u542F\u540E\uFF0C\u540C\u4E00\u6761\u63A8\u6587\u6709\u591A\u4E2A\u56FE\u7247\u6216\u89C6\u9891\u65F6\uFF0C\u540D\u79F0\u672B\u5C3E\u81EA\u52A8\u8FFD\u52A0\u300C (1/N)\u300D\uFF1B\u5173\u95ED\u5219\u51E0\u4E2A\u6587\u4EF6\u5171\u7528\u540C\u4E00\u4E2A\u540D\u79F0\u3002",
        twNameTitle: "\u63A8\u7279\u4FE1\u606F\u89C4\u5219",
        twNameHint: "\u5DE6\u4FA7\u52FE\u9009\u51B3\u5B9A\u7D20\u6750\u540D\u79F0\uFF0C\u4E2D\u95F4\u51B3\u5B9A\u6CE8\u91CA\uFF0C\u53F3\u4FA7\u51B3\u5B9A\u6807\u7B7E\uFF0C\u6BCF\u884C\u7BAD\u5934\u8C03\u6574\u5404\u81EA\u987A\u5E8F\uFF1B\u5168\u4E0D\u52FE\u65F6\u540D\u79F0\u6CBF\u7528\u300C\u63A8\u6587\u6B63\u6587 - @\u7528\u6237\u540D\u300D\u3001\u6CE8\u91CA\u6CBF\u7528\u63A8\u6587\u6B63\u6587\u3001\u6807\u7B7E\u6CBF\u7528\u7AD9\u70B9\u6807\u7B7E\u3002\u63A8\u7279 ID \u5373\u4F5C\u8005\u6570\u5B57 ID\u3002",
        twNameColumnTitle: "\u540D\u79F0",
        twNameAuthorIdLabel: "\u63A8\u7279 ID",
        twNameTweetIdLabel: "\u63A8\u6587 ID",
        twNameScreenNameLabel: "\u7528\u6237\u540D",
        twNameTextLabel: "\u6B63\u6587",
        twNameFullNameLabel: "\u5168\u540D",
        twNameNote: "\u540D\u79F0\uFF1A\u5B57\u6BB5\u6309\u4F60\u8C03\u6574\u540E\u7684\u987A\u5E8F\u7528\u300C - \u300D\u8FDE\u63A5\uFF0C\u8D85\u8FC7 150 \u4E2A\u5B57\u7B26\u622A\u65AD\uFF1B\u6587\u4EF6\u540D\u975E\u6CD5\u5B57\u7B26\u4F1A\u88AB\u66FF\u6362\u3002",
        twAnColumnTitle: "\u6CE8\u91CA",
        twAnAuthorIdLabel: "\u63A8\u7279 ID",
        twAnTweetIdLabel: "\u63A8\u6587 ID",
        twAnScreenNameLabel: "\u7528\u6237\u540D",
        twAnTextLabel: "\u6B63\u6587",
        twAnFullNameLabel: "\u5168\u540D",
        twAnNote: "\u6CE8\u91CA\uFF1A\u6309\u4F60\u8C03\u6574\u540E\u7684\u987A\u5E8F\u7528\u300C - \u300D\u8FDE\u63A5\uFF0C\u8D85\u8FC7 5000 \u4E2A\u5B57\u7B26\u622A\u65AD\uFF1B\u52FE\u9009\u4EFB\u610F\u5B57\u6BB5\u540E\u6CE8\u91CA\u53EA\u7531\u52FE\u9009\u7684\u5B57\u6BB5\u7EC4\u6210\uFF0C\u4E0D\u518D\u81EA\u52A8\u5E26\u63A8\u6587\u6B63\u6587\uFF0C\u60F3\u4FDD\u7559\u6B63\u6587\u8BF7\u52FE\u9009\u300C\u6B63\u6587\u300D\u3002",
        twTagColumnTitle: "\u6807\u7B7E",
        twTagAuthorIdLabel: "\u63A8\u7279 ID",
        twTagTweetIdLabel: "\u63A8\u6587 ID",
        twTagScreenNameLabel: "\u7528\u6237\u540D",
        twTagTextLabel: "\u6B63\u6587",
        twTagFullNameLabel: "\u5168\u540D",
        twTagNote: "\u6807\u7B7E\uFF1A\u6BCF\u4E2A\u52FE\u9009\u7684\u5B57\u6BB5\u5404\u81EA\u6210\u4E3A\u4E00\u6761\u72EC\u7ACB\u6807\u7B7E\uFF0C\u6309\u8C03\u6574\u540E\u7684\u987A\u5E8F\u6392\u5728\u8BE5\u7AD9\u70B9\u6807\u7B7E\u4E4B\u540E\uFF0C\u5355\u6761\u6807\u7B7E\u8D85\u8FC7 100 \u4E2A\u5B57\u7B26\u622A\u65AD\u3002\u4E0A\u4E0B\u4E24\u6761\u90FD\u52FE\u9009\u65F6\uFF0C\u4E24\u884C\u4E4B\u95F4\u4F1A\u51FA\u73B0\u9501\u94FE\u6309\u94AE\uFF0C\u70B9\u4E00\u4E0B\u628A\u8FD9\u4E24\u6761\u5408\u5E76\u6210\u4E00\u6761\u6807\u7B7E\uFF08\u7528\u300C - \u300D\u8FDE\u63A5\uFF09\u3002",
        twTagJoinLabel: "\u4E0E\u4E0A\u4E00\u6761\u6807\u7B7E\u5408\u5E76",
        maxResolutionLabel: "\u6E05\u6670\u5EA6\u4E0A\u9650",
        maxResolutionHint: "\u9650\u5236\u4E0B\u8F7D\u7684\u6700\u5927\u6E05\u6670\u5EA6\u3002\u82E5\u76EE\u6807\u89C6\u9891\u65E0\u5BF9\u5E94\u753B\u8D28\uFF0C\u5C06\u81EA\u52A8\u5411\u4E0B\u5339\u914D\u6700\u9AD8\u53EF\u7528\u6E05\u6670\u5EA6\u3002",
        maxFramerateLabel: "\u5E27\u7387\u4E0A\u9650",
        maxFramerateHint: "\u9650\u5236\u4E0B\u8F7D\u7684\u6700\u5927\u5E27\u7387\u3002\u82E5\u76EE\u6807\u89C6\u9891\u65E0\u5BF9\u5E94\u5E27\u7387\uFF0C\u5C06\u81EA\u52A8\u5411\u4E0B\u5339\u914D\u6700\u9AD8\u53EF\u7528\u5E27\u7387\u3002",
        resAuto: "Auto (\u6700\u9AD8\u753B\u8D28)",
        fpsAuto: "Auto (\u6700\u9AD8\u5E27\u7387)",
        setupRequired: "\u9996\u6B21\u4F7F\u7528\u9700\u8981\u5148\u5B89\u88C5\u4EE5\u4E0B\u7EC4\u4EF6\uFF0C\u5B89\u88C5\u5B8C\u6210\u540E\u5C06\u81EA\u52A8\u8FDB\u5165\u4E3B\u754C\u9762",
        back: "\u8FD4\u56DE",
        ytdlpDesc: "\u89C6\u9891\u89E3\u6790\u4E0E\u4E0B\u8F7D\u5F15\u64CE",
        ffmpegDesc: "\u89C6\u9891\u5408\u5E76\u4E0E\u8F6C\u7801\u5F15\u64CE",
        ffmpegManaged: "\u7531 Eagle \u7BA1\u7406\uFF0C\u65E0\u9700\u624B\u52A8\u64CD\u4F5C",
        ffmpegNotFoundHint: "\u672A\u68C0\u6D4B\u5230 Eagle \u5185\u7F6E FFmpeg \u63D2\u4EF6\uFF0C\u8BF7\u70B9\u51FB\u4E0B\u65B9\u6309\u94AE\u5B89\u88C5",
        ffmpegUnsupported: "\u9700\u5B89\u88C5 Eagle \u5B98\u65B9 FFmpeg \u63D2\u4EF6\u4EE5\u652F\u6301\u97F3\u89C6\u9891\u5408\u5E76",
        installFfmpegDep: "\u5B89\u88C5 FFmpeg \u4F9D\u8D56",
        checking: "\u68C0\u67E5\u4E2D...",
        installed: "\u5DF2\u5B89\u88C5",
        checkingUpdate: "\u68C0\u67E5\u66F4\u65B0\u4E2D...",
        latest: "\u5DF2\u662F\u6700\u65B0\u7248",
        outdated: "\u6709\u65B0\u7248\u672C",
        missing: "\u672A\u5B89\u88C5",
        eagleBuiltin: "Eagle \u5185\u7F6E",
        notFound: "\u672A\u627E\u5230",
        installing: "\u5B89\u88C5\u4E2D...",
        updating: "\u66F4\u65B0\u4E2D...",
        reinstalling: "\u91CD\u88C5\u4E2D...",
        doneInstalled: "\u5B89\u88C5\u5B8C\u6210",
        doneUpdated: "\u66F4\u65B0\u5B8C\u6210",
        doneReinstalled: "\u91CD\u88C5\u5B8C\u6210",
        install: "\u5B89\u88C5",
        update: "\u66F4\u65B0",
        reinstall: "\u91CD\u65B0\u5B89\u88C5",
        uninstall: "\u5378\u8F7D",
        retry: "\u91CD\u8BD5",
        downloadFailed: "\u4E0B\u8F7D\u5931\u8D25",
        versionInstalled: "\u7248\u672C\uFF1A{{version}}",
        versionUpdate: "{{from}} \u2192 {{to}}",
        progressText: "\u6B63\u5728\u4E0B\u8F7D... {{percent}}%",
        threadCountLabel: "\u4E0B\u8F7D\u7EBF\u7A0B\u6570",
        threadCountHint: "\u5206\u7247\u89C6\u9891\uFF08HLS/DASH\uFF09\u7684\u5E76\u53D1\u7EBF\u7A0B\u6570\u3002\u4E0D\u4E00\u5B9A\u8D8A\u5FEB\uFF1B\u76F4\u94FE MP4 \u5355\u8FDE\u63A5\u3002",
        threadAuto: "\u81EA\u52A8\uFF08\u9ED8\u8BA4\uFF09",
        sankakuAuthLabel: "Sankaku \u8D26\u53F7",
        sankakuAuthHint: "\u7C98\u8D34 accessToken cookie\uFF08\u4E5F\u652F\u6301 get-cookies / Cookie-Editor \u5BFC\u51FA\u7684 JSON\uFF09\u4EE5\u4E0B\u8F7D\u4EC5\u767B\u5F55\u53EF\u89C1\u6295\u7A3F\u3002",
        sankakuAuthPlaceholder: '{"accessToken":"..."} \u6216 accessToken=...',
        sankakuAuthSave: "\u4FDD\u5B58",
        sankakuAuthClear: "\u6E05\u9664",
        sankakuAuthSaved: "\u5DF2\u4FDD\u5B58\uFF0C\u4E0B\u8F7D\u65F6\u4F1A\u4F7F\u7528\u8BE5\u767B\u5F55\u6001\u3002",
        sankakuAuthCleared: "\u5DF2\u6E05\u9664\u3002",
        sankakuAuthInvalid: "\u672A\u8BC6\u522B\u5230 accessToken\uFF0C\u8BF7\u68C0\u67E5\u7C98\u8D34\u5185\u5BB9\u3002",
        tabAccount: "\u8D26\u53F7",
        twitterAuthLabel: "\u63A8\u7279 / X \u8D26\u53F7",
        twitterAuthHint: "\u4ECE\u5DF2\u767B\u5F55 x.com \u7684\u6D4F\u89C8\u5668 Cookie \u91CC\u590D\u5236 auth_token \u548C ct0 \u4E24\u4E2A\u503C\u3002",
        twitterAuthReady: "Cookie \u5DF2\u4FDD\u5B58",
        twitterAuthSaved: "\u5DF2\u4FDD\u5B58\uFF0C\u8D26\u53F7\uFF1A@{{name}}",
        twitterAuthInvalid: "Cookie \u9700\u8981\u540C\u65F6\u5305\u542B auth_token \u548C ct0",
        twitterAuthCleared: "Cookie \u5DF2\u6E05\u9664",
        twitterAuthTesting: "\u6B63\u5728\u6D4B\u8BD5\u2026",
        twitterAuthFailed: "\u8FDE\u63A5\u5931\u8D25\uFF1A{{error}}",
        twitterMonitorLabel: "\u81EA\u52A8\u83B7\u53D6\u70B9\u8D5E\u4E0E\u6536\u85CF",
        twitterMonitorHint: "\u65B0\u589E\u7684\u70B9\u8D5E / \u6536\u85CF\u4F1A\u81EA\u52A8\u52A0\u5165\u4E0B\u8F7D\u961F\u5217\u3002",
        twitterMonitorOn: "\u83B7\u53D6\u5DF2\u5F00\u542F\uFF1A\u6BCF {{interval}} \u68C0\u67E5\u4E00\u6B21",
        twitterMonitorOff: "\u83B7\u53D6\u5DF2\u5173\u95ED",
        twitterCatchup: "\u5DF2\u8865\u6293\u4E0A\u6B21\u5173\u95ED\u540E\u65B0\u589E\u7684 {{count}} \u6761\u5185\u5BB9",
        twitterCatchupTruncated: "\u5269\u4F59\u4E0B\u6B21\u7EE7\u7EED",
        twitterAuthSave: "\u4FDD\u5B58\u5E76\u6D4B\u8BD5",
        twitterAuthClear: "\u6E05\u9664",
        unitSeconds: "\u79D2",
        unitMinutes: "\u5206\u949F",
        unitHours: "\u5C0F\u65F6",
        twitterMonitorMinHint: "\u5EFA\u8BAE\u6700\u4F4E 2 \u5206\u949F",
        twitterMonitorLikesLabel: "\u83B7\u53D6\u70B9\u8D5E",
        twitterMonitorBookmarksLabel: "\u83B7\u53D6\u6536\u85CF",
        twitterMonitorNoSource: "\u8BF7\u81F3\u5C11\u52FE\u9009\u83B7\u53D6\u70B9\u8D5E\u6216\u83B7\u53D6\u6536\u85CF",
        twitterIntervalOffLabel: "\u5173\u95ED",
        sankakuAuthTesting: "\u6B63\u5728\u83B7\u53D6\u8D26\u53F7\u4FE1\u606F\u2026",
        monitorIdle: "\u672A\u76D1\u63A7",
        monitorCountdown: "\u4E0B\u6B21 {{time}}",
        twitterFetching: "\u6B63\u5728\u6293\u53D6\u2026",
        twitterMonitorTest: "\u6293\u53D6\u6D4B\u8BD5"
      }
    };
  }
});

// js/plugin.js
var i18next = require_i18next();
var {
  isYtDlpInstalled,
  downloadYtDlp,
  uninstallYtDlp,
  getYtDlpUpdateInfo,
  getInstalledYtDlpVersion,
  getLatestYtDlpVersion,
  getFfmpegSource
} = require_binary();
var { isNetworkError } = require_net_guard();
var { getJson } = require_x_http();
var downloader = require_downloader();
var sankakuAuth = require_sankaku_auth();
var twitterAuth = require_twitter_auth();
var twitterMonitor = require_twitter_monitor();
var twitterName = require_twitter_name();
var libraryIndex = require_library_index();
var errorLog = require_error_log();
var ui = require_ui_replica();
libraryIndex.configure({ keyOf: downloadKey });
var isInitialized = false;
function buildImportTags(metadata) {
  const adapterTags = Array.isArray(metadata.tags) ? metadata.tags.map((tag) => String(tag || "").trim().replace(/^#+/, "")).filter(Boolean) : [];
  const isXiaohongshu = String(metadata.extractor || "").toLowerCase() === "xiaohongshu";
  if (isXiaohongshu) {
    return getXhsTagsPref() ? adapterTags.slice(0, 30) : [];
  }
  const baseTags = adapterTags.length ? adapterTags.slice(0, 30) : [metadata.extractor || "video"];
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  if (!isTwitter)
    return baseTags;
  const ruleTags = twitterName.buildTwitterTags(metadata, getTwitterTagsPref());
  const merged = baseTags.slice();
  for (const tag of ruleTags) {
    if (!merged.some((existing) => existing.toLowerCase() === tag.toLowerCase()))
      merged.push(tag);
  }
  return merged.slice(0, 30);
}
function buildImportName(metadata, part) {
  const extractor = String(metadata && metadata.extractor || "").toLowerCase();
  let appendPart = true;
  if (extractor === "twitter")
    appendPart = getTwitterMultiFilePref();
  else if (extractor === "xiaohongshu")
    appendPart = getXhsMultiFilePref();
  return twitterName.composeImportName(
    metadata,
    getTwitterNamePrefs(),
    part,
    i18next.t("error.downloadedVideo"),
    appendPart
  );
}
function buildImportAnnotation(metadata) {
  const isTwitter = String(metadata.extractor || "").toLowerCase() === "twitter";
  const composed = isTwitter ? twitterName.buildTwitterAnnotation(metadata, getTwitterAnnotationPrefs()) : "";
  if (composed)
    return composed.slice(0, twitterName.ANNOTATION_MAX_LENGTH);
  return metadata.description ? metadata.description.slice(0, 5e3) : "";
}
async function importToEagle(videoPath, metadata, sourceUrl, part) {
  if (typeof eagle === "undefined") {
    throw new Error(i18next.t("error.eagleApiNotAvailable"));
  }
  const tags = buildImportTags(metadata);
  const importOptions = {
    name: buildImportName(metadata, part),
    website: sourceUrl || void 0,
    tags,
    annotation: buildImportAnnotation(metadata)
  };
  try {
    const item = await eagle.item.addFromPath(videoPath, importOptions);
    return item;
  } catch (error) {
    throw new Error(`${i18next.t("error.eagleImportFailed")}: ${error.message}`);
  }
}
var AUTO_ADD_SOURCE_KEY = "Edge-Media-Download-NEW.autoAddSource";
var MAX_RESOLUTION_KEY = "Edge-Media-Download-NEW.maxResolution";
var MAX_FRAMERATE_KEY = "Edge-Media-Download-NEW.maxFramerate";
var THREAD_COUNT_KEY = "Edge-Media-Download-NEW.threadCount";
function getAutoAddSourcePref() {
  const val = localStorage.getItem(AUTO_ADD_SOURCE_KEY);
  return val === null ? true : val === "true";
}
function setAutoAddSourcePref(value) {
  localStorage.setItem(AUTO_ADD_SOURCE_KEY, String(value));
}
var XHS_TAGS_KEY = "Edge-Media-Download-NEW.xhsTags";
function getXhsTagsPref() {
  const val = localStorage.getItem(XHS_TAGS_KEY);
  return val === null ? true : val === "true";
}
function setXhsTagsPref(value) {
  localStorage.setItem(XHS_TAGS_KEY, String(value));
}
var XHS_MULTI_FILE_KEY = "Edge-Media-Download-NEW.xhsMultiFile";
function getXhsMultiFilePref() {
  const val = localStorage.getItem(XHS_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}
function setXhsMultiFilePref(value) {
  localStorage.setItem(XHS_MULTI_FILE_KEY, String(value));
}
var TWITTER_MULTI_FILE_KEY = "Edge-Media-Download-NEW.twitterMultiFile";
function getTwitterMultiFilePref() {
  const val = localStorage.getItem(TWITTER_MULTI_FILE_KEY);
  return val === null ? true : val === "true";
}
function setTwitterMultiFilePref(value) {
  localStorage.setItem(TWITTER_MULTI_FILE_KEY, String(value));
}
var TWITTER_NAME_KEY = "Edge-Media-Download-NEW.twitterName";
var TWITTER_ANNOTATION_KEY = "Edge-Media-Download-NEW.twitterAnnotation";
var TWITTER_TAGS_KEY = "Edge-Media-Download-NEW.twitterTagRules";
function createFieldPrefsStore(storageKey) {
  function get() {
    const raw = localStorage.getItem(storageKey);
    let saved = null;
    if (raw) {
      try {
        saved = JSON.parse(raw);
      } catch (e) {
        saved = null;
      }
    }
    const prefs = twitterName.getDefaultPrefs();
    if (saved && typeof saved === "object") {
      for (const field of twitterName.FIELD_ORDER) {
        if (typeof saved[field] === "boolean")
          prefs[field] = saved[field];
      }
      if (Array.isArray(saved.order))
        prefs.order = twitterName.normalizeOrder(saved.order);
      if (Array.isArray(saved.join))
        prefs.join = twitterName.normalizeJoin(saved.join);
    }
    return prefs;
  }
  function save(prefs) {
    localStorage.setItem(storageKey, JSON.stringify(prefs));
  }
  function setField(field, value) {
    if (!twitterName.FIELD_ORDER.includes(field))
      return;
    const prefs = get();
    prefs[field] = value === true;
    save(prefs);
  }
  function setOrder(order) {
    const prefs = get();
    prefs.order = twitterName.normalizeOrder(order);
    save(prefs);
    return prefs.order;
  }
  function setJoin(field, joined) {
    if (!twitterName.FIELD_ORDER.includes(field))
      return get().join;
    const prefs = get();
    const list = Array.isArray(prefs.join) ? prefs.join.slice() : [];
    const index = list.indexOf(field);
    if (joined === true && index < 0)
      list.push(field);
    if (joined !== true && index >= 0)
      list.splice(index, 1);
    prefs.join = twitterName.normalizeJoin(list);
    save(prefs);
    return prefs.join;
  }
  function move(field, direction) {
    const prefs = get();
    const moved = twitterName.moveInOrder(prefs.order, field, direction);
    if (!moved)
      return null;
    return setOrder(moved);
  }
  return { get, setField, setOrder, setJoin, move };
}
var twitterNamePrefsStore = createFieldPrefsStore(TWITTER_NAME_KEY);
var twitterAnnotationPrefsStore = createFieldPrefsStore(TWITTER_ANNOTATION_KEY);
var twitterTagsPrefsStore = createFieldPrefsStore(TWITTER_TAGS_KEY);
function getTwitterNamePrefs() {
  return twitterNamePrefsStore.get();
}
function setTwitterNamePref(field, value) {
  twitterNamePrefsStore.setField(field, value);
}
function setTwitterNameOrder(order) {
  return twitterNamePrefsStore.setOrder(order);
}
function moveTwitterNameField(field, direction) {
  return twitterNamePrefsStore.move(field, direction);
}
function getTwitterAnnotationPrefs() {
  return twitterAnnotationPrefsStore.get();
}
function setTwitterAnnotationPref(field, value) {
  twitterAnnotationPrefsStore.setField(field, value);
}
function setTwitterAnnotationOrder(order) {
  return twitterAnnotationPrefsStore.setOrder(order);
}
function moveTwitterAnnotationField(field, direction) {
  return twitterAnnotationPrefsStore.move(field, direction);
}
function getTwitterTagsPref() {
  return twitterTagsPrefsStore.get();
}
function setTwitterTagsPref(field, value) {
  twitterTagsPrefsStore.setField(field, value);
}
function setTwitterTagsOrder(order) {
  return twitterTagsPrefsStore.setOrder(order);
}
function setTwitterTagsJoin(field, joined) {
  return twitterTagsPrefsStore.setJoin(field, joined);
}
function moveTwitterTagsField(field, direction) {
  return twitterTagsPrefsStore.move(field, direction);
}
function getMaxResolutionPref() {
  return localStorage.getItem(MAX_RESOLUTION_KEY) || "auto";
}
function setMaxResolutionPref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_RESOLUTION_KEY, val);
  downloader.setQualityPrefs({
    resolution: val,
    framerate: getMaxFrameratePref()
  });
}
function getMaxFrameratePref() {
  return localStorage.getItem(MAX_FRAMERATE_KEY) || "auto";
}
function setMaxFrameratePref(value) {
  const val = value || "auto";
  localStorage.setItem(MAX_FRAMERATE_KEY, val);
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: val
  });
}
function getThreadCountPref() {
  return localStorage.getItem(THREAD_COUNT_KEY) || "auto";
}
var DOWNLOAD_SOUND_KEY = "Edge-Media-Download-NEW.downloadSound";
function getDownloadSoundPref() {
  const val = localStorage.getItem(DOWNLOAD_SOUND_KEY);
  return val === null ? true : val === "true";
}
function setDownloadSoundPref(value) {
  localStorage.setItem(DOWNLOAD_SOUND_KEY, String(value));
}
var __evdSoundLast = 0;
var __evdSoundPlaying = false;
var __evdAudioEl = null;
var CUSTOM_SOUND_KEY = "Edge-Media-Download-NEW.customSound";
var DEFAULT_SOUND_FILE = "assets/sounds/notify.wav";
function ensureAudioEl() {
  if (!__evdAudioEl) {
    __evdAudioEl = new Audio();
    __evdAudioEl.preload = "auto";
    __evdAudioEl.volume = 0.9;
    __evdAudioEl.addEventListener("ended", function() {
      __evdSoundPlaying = false;
    });
  }
  return __evdAudioEl;
}
function pluginRootDir() {
  try {
    const href = location.href.split("?")[0].split("#")[0];
    const dirUrl = href.substring(0, href.lastIndexOf("/") + 1);
    let decoded = decodeURIComponent(dirUrl);
    decoded = decoded.replace(/^file:\/\/\//i, "").replace(/^file:\/\//i, "").replace(/^\/+/, "");
    return decoded.replace(/\/+$/, "");
  } catch (e) {
    return "";
  }
}
function defaultSoundFile() {
  return DEFAULT_SOUND_FILE;
}
function getCustomSoundFile() {
  try {
    return localStorage.getItem(CUSTOM_SOUND_KEY) || "";
  } catch (e) {
    return "";
  }
}
function setCustomSoundFile(file) {
  try {
    localStorage.setItem(CUSTOM_SOUND_KEY, file || "");
  } catch (e) {
  }
}
function soundFileName(file) {
  return String(file || "").split(/[\\\/]/).pop();
}
function soundUrl(file) {
  if (!file)
    return defaultSoundFile();
  if (/^(assets\/|blob:|data:|file:)/i.test(file))
    return file;
  return "file:///" + encodeURI(file.replace(/\\/g, "/"));
}
function playSoundFile(url, onFail) {
  try {
    const el = ensureAudioEl();
    if (el.src !== url)
      el.src = url;
    try {
      el.currentTime = 0;
    } catch (e) {
    }
    __evdSoundPlaying = true;
    const p = el.play();
    if (p && typeof p.then === "function") {
      p.then(null, () => {
        __evdSoundPlaying = false;
        if (onFail)
          onFail();
      });
    }
  } catch (e) {
    __evdSoundPlaying = false;
    if (onFail)
      onFail();
  }
}
function playDownloadAddedSound(force) {
  if (!getDownloadSoundPref())
    return;
  const now = Date.now();
  if (!force && now - __evdSoundLast < 300)
    return;
  __evdSoundLast = now;
  if (__evdSoundPlaying)
    return;
  const custom = getCustomSoundFile();
  const file = custom || defaultSoundFile();
  playSoundFile(soundUrl(file), () => {
    if (custom) {
      setCustomSoundFile("");
      const label = document.getElementById("customSoundName");
      if (label) {
        label.textContent = "\u9ED8\u8BA4\u97F3\u6548";
        label.title = "\u6572\u6572.wav";
      }
      playDownloadAddedSound(true);
    }
  });
}
document.addEventListener("pointerdown", function unlockSound() {
  ensureSoundContext();
  document.removeEventListener("pointerdown", unlockSound);
});
function setThreadCountPref(value) {
  const val = value || "auto";
  localStorage.setItem(THREAD_COUNT_KEY, val);
  downloader.setThreadCount(val);
}
var downloadQueue = [];
var CONCURRENCY_KEY = "evd.maxConcurrentDownloads";
var CONCURRENCY_VALUES = [3, 6, 9, 16, 32];
function getConcurrencyPref() {
  try {
    const value = Number(localStorage.getItem(CONCURRENCY_KEY));
    if (CONCURRENCY_VALUES.indexOf(value) >= 0)
      return value;
  } catch (e) {
  }
  return 3;
}
function setConcurrencyPref(value) {
  const next = Number(value);
  const picked = CONCURRENCY_VALUES.indexOf(next) >= 0 ? next : 3;
  try {
    localStorage.setItem(CONCURRENCY_KEY, String(picked));
  } catch (e) {
  }
}
var activeCount = 0;
var queueIdCounter = 0;
var queuePaused = false;
async function initI18n() {
  const enTranslation = require_en();
  const zhCNTranslation = require_zh_CN();
  await i18next.init({
    lng: eagle.app.locale || "en",
    fallbackLng: "en",
    resources: {
      en: { translation: enTranslation },
      zh_CN: { translation: zhCNTranslation }
    }
  });
  global.i18next = i18next;
}
function applyTranslations() {
  const input = document.getElementById("urlInput");
  if (input)
    input.placeholder = "\u7C98\u8D34\u89C6\u9891\u94FE\u63A5\u2026";
}
eagle.onPluginCreate(async (plugin) => {
  await initI18n();
  applyTranslations();
  ui.updateTheme();
  try {
    setupEventListeners();
  } catch (e) {
    console.error("setupEventListeners failed:", e);
  }
  startLibraryWatcher();
  try {
    ui.renderTwitterProfile();
    twitterMonitor.fetchProfile().then((profile) => {
      if (profile && profile.ok)
        ui.renderTwitterProfile(profile);
    }).catch(() => {
    });
  } catch (e) {
  }
  twitterMonitor.init().then((result) => {
    const status = document.getElementById("twitterAuthStatus");
    if (!status || !result || result.skipped)
      return;
    if (result.ok === false) {
      status.textContent = "\u9A8C\u8BC1\u5931\u8D25\uFF1A" + (result.error || "error");
      return;
    }
    if (result.baseline) {
      status.textContent = "Cookie \u6709\u6548\uFF0C\u5DF2\u5EFA\u7ACB\u6293\u53D6\u57FA\u7EBF";
      return;
    }
    status.textContent = describeCatchupResult(result);
  }).catch((e) => {
    console.warn("[twitter-monitor] init failed:", e && e.message);
  });
  setTimeout(() => {
    try {
      const prefs = twitterMonitor.getPrefs();
      if (!prefs || !(prefs.likes || prefs.bookmarks || prefs.dm))
        return;
      libraryIndex.build({ force: true }).catch(() => {
      }).then(() => twitterMonitor.catchUp({ includeDm: true })).catch((e) => {
        console.warn("[twitter-monitor] auto catchup failed:", e && e.message);
      });
    } catch (e) {
    }
  }, 1e4);
  setupWindowState();
  startIngestBridge();
  downloader.setQualityPrefs({
    resolution: getMaxResolutionPref(),
    framerate: getMaxFrameratePref()
  });
  downloader.setThreadCount(getThreadCountPref());
  try {
    await initializeBinaries();
  } catch (e) {
    console.error("initializeBinaries failed:", e);
  }
});
eagle.onThemeChanged(() => {
  ui.updateTheme();
});
var lastLibraryPath = null;
function startLibraryWatcher() {
  try {
    lastLibraryPath = eagle.library && eagle.library.path || "";
  } catch (e) {
    lastLibraryPath = "";
  }
  setInterval(() => {
    let current = "";
    try {
      current = eagle.library && eagle.library.path || "";
    } catch (e) {
      current = "";
    }
    if (current === lastLibraryPath)
      return;
    lastLibraryPath = current;
    try {
      ui.refreshAccountFields();
    } catch (e) {
    }
    try {
      renderDownloadAccount();
    } catch (e) {
    }
    try {
      twitterMonitor.refreshForLibrary();
    } catch (e) {
    }
  }, 3e3);
}
function setupEventListeners() {
  const closeBtn = document.getElementById("closeButton");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => {
      saveWindowSize();
      window.close();
    });
  }
  const minBtn = document.getElementById("minimizeBtn");
  if (minBtn) {
    minBtn.addEventListener("click", () => {
      try {
        if (typeof eagle !== "undefined" && eagle.window && typeof eagle.window.minimize === "function")
          eagle.window.minimize();
      } catch (e) {
      }
    });
  }
  setupPinButton();
  const getUi = () => typeof window !== "undefined" ? window.EVDUI : null;
  document.addEventListener("evd:panel", (e) => {
    const view = e.detail && e.detail.view;
    if (!view)
      return;
    if (view === "download") {
      ui.hideDepsPage();
    } else {
      openDepsPage(view);
    }
  });
  const urlInput = document.getElementById("urlInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const pasteBtn = document.getElementById("pasteBtn");
  const submitUrl = (raw) => {
    const value = String(raw || "").trim();
    if (!value)
      return;
    if (!isInitialized) {
      ui.setInputBarState("error", "\u8BF7\u5148\u5728\u4F9D\u8D56\u9875\u5B89\u88C5 yt-dlp \u540E\u518D\u4E0B\u8F7D");
      openDepsPage("dependencies");
      return;
    }
    document.dispatchEvent(new CustomEvent("startDownload", { detail: { url: value } }));
    if (urlInput) {
      urlInput.value = "";
      urlInput.focus();
    }
  };
  if (downloadBtn && urlInput) {
    downloadBtn.addEventListener("click", () => submitUrl(urlInput.value));
  }
  if (urlInput) {
    urlInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submitUrl(urlInput.value);
      }
    });
  }
  if (pasteBtn && urlInput) {
    pasteBtn.addEventListener("click", () => {
      let text = "";
      try {
        text = eagle.clipboard.readText() || "";
      } catch (e) {
        text = "";
      }
      if (!text) {
        ui.setInputBarState("error", "\u526A\u8D34\u677F\u91CC\u6CA1\u6709\u53EF\u7528\u7684\u94FE\u63A5");
        return;
      }
      urlInput.value = text.trim();
      urlInput.focus();
      submitUrl(text);
    });
  }
  document.addEventListener("startDownload", async (e) => {
    const url = e.detail && e.detail.url;
    if (!ui.isValidUrl(url)) {
      ui.setInputBarState("error", "\u94FE\u63A5\u65E0\u6548\uFF0C\u9700\u8981 https \u89C6\u9891\u5730\u5740");
      return;
    }
    const status = await addToQueue(url, e.detail && e.detail.from, !!(e.detail && e.detail.scrape));
    try {
      document.dispatchEvent(new CustomEvent("evd:download-result", { detail: { url, status } }));
    } catch (err) {
    }
  });
  document.addEventListener("evd:queue-action", (e) => {
    const detail = e.detail || {};
    if (typeof detail.id !== "number")
      return;
    if (detail.action === "retry")
      retryDownload(detail.id);
    if (detail.action === "copy")
      copyUrl(detail.id);
    if (detail.action === "copyError")
      copyError(detail.id);
    if (detail.action === "remove")
      deleteDownloadItem(detail.id);
  });
  document.addEventListener("evd:queue-bulk", (e) => {
    const action = e.detail && e.detail.action;
    if (action === "start")
      resumeAllDownloads();
    if (action === "pause")
      pauseAllDownloads();
  });
  document.addEventListener("evd:theme-pick", (e) => {
    const theme = e.detail && e.detail.theme;
    if (theme)
      ui.setManualTheme(theme);
  });
  const followToggle = document.getElementById("followThemeToggle");
  if (followToggle) {
    followToggle.addEventListener("change", (e) => {
      ui.setFollowEagleTheme(!!e.target.checked);
    });
  }
  const resetWindowBtn = document.getElementById("resetWindowSize");
  if (resetWindowBtn) {
    const RESET_W = 840;
    const RESET_H = 650;
    const resetWindow = async () => {
      const windowApi = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
      const applySize = async () => {
        if (windowApi && typeof windowApi.setSize === "function")
          await windowApi.setSize(RESET_W, RESET_H);
        else if (typeof window.resizeTo === "function")
          window.resizeTo(RESET_W, RESET_H);
      };
      try {
        await applySize();
        if (windowApi && typeof windowApi.getSize === "function") {
          for (let i = 0; i < 3; i++) {
            await new Promise((resolve) => setTimeout(resolve, 120));
            const current = await windowApi.getSize();
            const width = Number(Array.isArray(current) ? current[0] : current && current.width);
            const height = Number(Array.isArray(current) ? current[1] : current && current.height);
            if (Number.isFinite(width) && Number.isFinite(height) && Math.abs(width - RESET_W) <= 2 && Math.abs(height - RESET_H) <= 2)
              break;
            await applySize();
          }
        }
      } catch (e) {
      }
    };
    resetWindowBtn.addEventListener("click", resetWindow);
    resetWindowBtn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" && e.key !== " ")
        return;
      e.preventDefault();
      resetWindow();
    });
  }
  const autoAddToggle = document.getElementById("autoAddSourceToggle");
  if (autoAddToggle) {
    autoAddToggle.checked = getAutoAddSourcePref();
    autoAddToggle.addEventListener("change", (e) => {
      setAutoAddSourcePref(!!e.target.checked);
    });
  }
  const maxResolution = document.getElementById("maxResolution");
  if (maxResolution) {
    maxResolution.value = getMaxResolutionPref();
    maxResolution.addEventListener("change", (e) => {
      setMaxResolutionPref(e.target.value);
      downloader.setQualityPrefs({
        resolution: getMaxResolutionPref(),
        framerate: getMaxFrameratePref()
      });
    });
  }
  const maxFramerate = document.getElementById("maxFramerate");
  if (maxFramerate) {
    maxFramerate.value = getMaxFrameratePref();
    maxFramerate.addEventListener("change", (e) => {
      setMaxFrameratePref(e.target.value);
      downloader.setQualityPrefs({
        resolution: getMaxResolutionPref(),
        framerate: getMaxFrameratePref()
      });
    });
  }
  const concurrency = document.getElementById("concurrency");
  if (concurrency) {
    concurrency.value = String(getConcurrencyPref());
    concurrency.addEventListener("change", (e) => {
      setConcurrencyPref(e.target.value);
      processQueue();
    });
  }
  const threadCount = document.getElementById("threadCount");
  if (threadCount) {
    threadCount.value = getThreadCountPref();
    threadCount.addEventListener("change", (e) => {
      setThreadCountPref(e.target.value);
      downloader.setThreadCount(getThreadCountPref());
    });
  }
  const downloadSoundToggle = document.getElementById("downloadSoundToggle");
  if (downloadSoundToggle) {
    downloadSoundToggle.checked = getDownloadSoundPref();
    downloadSoundToggle.addEventListener("change", (e) => {
      setDownloadSoundPref(!!e.target.checked);
      if (e.target.checked)
        playDownloadAddedSound(true);
    });
  }
  const customSoundName = document.getElementById("customSoundName");
  function refreshCustomSoundLabel() {
    if (!customSoundName)
      return;
    const custom = getCustomSoundFile();
    customSoundName.textContent = custom ? soundFileName(custom) : "\u9ED8\u8BA4\u97F3\u6548";
    customSoundName.title = custom || "\u6572\u6572.wav";
  }
  function pickCustomSoundFile() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "audio/*,.wav,.mp3,.ogg,.m4a,.aac,.flac";
    input.style.display = "none";
    document.body.appendChild(input);
    input.addEventListener("change", () => {
      const picked = input.files && input.files[0];
      let path = "";
      if (picked) {
        try {
          const electron = require("electron");
          if (electron && electron.webUtils && typeof electron.webUtils.getPathForFile === "function")
            path = electron.webUtils.getPathForFile(picked) || "";
        } catch (e) {
        }
        if (!path)
          path = picked.path || "";
      }
      try {
        input.remove();
      } catch (e) {
      }
      let stored = "";
      if (path) {
        try {
          const fs = require("fs");
          const root = pluginRootDir();
          const extMatch = /\.([a-z0-9]+)$/i.exec(picked && picked.name || path);
          const ext = extMatch ? "." + extMatch[1].toLowerCase() : ".wav";
          const dest = root ? root + "/assets/sounds/custom" + ext : "";
          if (dest) {
            fs.copyFileSync(path, dest);
            stored = "assets/sounds/custom" + ext;
          }
        } catch (e) {
          stored = "";
        }
        if (!stored)
          stored = soundUrl(path);
      } else if (picked) {
        try {
          stored = URL.createObjectURL(picked);
        } catch (e) {
        }
      }
      if (!stored)
        return;
      setCustomSoundFile(stored);
      refreshCustomSoundLabel();
      playDownloadAddedSound(true);
    });
    input.click();
  }
  const pickSoundBtn = document.getElementById("pickSoundBtn");
  if (pickSoundBtn)
    pickSoundBtn.addEventListener("click", pickCustomSoundFile);
  const resetSoundBtn = document.getElementById("resetSoundBtn");
  if (resetSoundBtn) {
    resetSoundBtn.addEventListener("click", () => {
      setCustomSoundFile("");
      refreshCustomSoundLabel();
      playDownloadAddedSound(true);
    });
  }
  refreshCustomSoundLabel();
  setupDownloadAccountStrip();
  const xhsTagsToggle = document.getElementById("xhsTagsToggle");
  if (xhsTagsToggle) {
    xhsTagsToggle.checked = getXhsTagsPref();
    xhsTagsToggle.addEventListener("change", (e) => setXhsTagsPref(!!e.target.checked));
  }
  const xhsMultiFileToggle = document.getElementById("xhsMultiFileToggle");
  if (xhsMultiFileToggle) {
    xhsMultiFileToggle.checked = getXhsMultiFilePref();
    xhsMultiFileToggle.addEventListener("change", (e) => setXhsMultiFilePref(!!e.target.checked));
  }
  const twMultiFileToggle = document.getElementById("twMultiFileToggle");
  if (twMultiFileToggle) {
    twMultiFileToggle.checked = getTwitterMultiFilePref();
    twMultiFileToggle.addEventListener("change", (e) => setTwitterMultiFilePref(!!e.target.checked));
  }
  const TAG_FIELDS = ["authorId", "tweetId", "screenName", "text", "name"];
  const COLUMN_OF_FIELD = {
    name: getTwitterNamePrefs(),
    annotation: getTwitterAnnotationPrefs(),
    tags: getTwitterTagsPref()
  };
  const FIELD_OWNER = {};
  ["name", "annotation", "tags"].forEach((column) => {
    TAG_FIELDS.forEach((field) => {
      FIELD_OWNER[field + ":" + column] = true;
    });
  });
  document.addEventListener("evd:tag-check", (e) => {
    const field = e.detail && e.detail.field;
    if (!field || !e.detail.panel)
      return;
    const panel = e.detail.panel;
    const checked = !!e.detail.checked;
    if (panel === "name")
      setTwitterNamePref(field, checked);
    if (panel === "annotation")
      setTwitterAnnotationPref(field, checked);
    if (panel === "tags")
      setTwitterTagsPref(field, checked);
  });
  const persistTagLayout = (reason) => {
    const shellState = getUi() ? getUi().tagState() : null;
    if (!shellState)
      return;
    if (reason === "reset") {
      setTwitterNameOrder(twitterName.DEFAULT_ORDER);
      setTwitterAnnotationOrder(twitterName.DEFAULT_ORDER);
      setTwitterTagsOrder(twitterName.DEFAULT_ORDER);
      TAG_FIELDS.forEach((field) => setTwitterTagsJoin(field, false));
    } else {
      setTwitterNameOrder(shellState.name.order);
      setTwitterAnnotationOrder(shellState.annotation.order);
      setTwitterTagsOrder(shellState.tags.order);
      TAG_FIELDS.forEach((field) => setTwitterTagsJoin(field, shellState.join.indexOf(field) >= 0));
    }
    ui.applyTwitterNameOrder(getTwitterNamePrefs().order);
    ui.applyTwitterAnnotationOrder(getTwitterAnnotationPrefs().order);
    ui.applyTwitterTagsOrder(getTwitterTagsPref().order, getTwitterTagsPref().join);
  };
  document.addEventListener("evd:tag-change", (e) => {
    persistTagLayout(e.detail && e.detail.reason || "order");
  });
  const resetOrder = document.getElementById("resetOrder");
  if (resetOrder) {
    resetOrder.addEventListener("click", () => {
      const shellUi = getUi();
      if (shellUi)
        shellUi.resetLayout();
    });
  }
  const ytdlpCheck = document.getElementById("ytdlpCheck");
  if (ytdlpCheck)
    ytdlpCheck.addEventListener("click", () => loadYtdlpUpdateStatus());
  const ytdlpUninstall = document.getElementById("ytdlpUninstall");
  if (ytdlpUninstall)
    ytdlpUninstall.addEventListener("click", () => handleYtdlpAction("uninstall"));
  const ytdlpReinstall = document.getElementById("ytdlpReinstall");
  if (ytdlpReinstall) {
    ytdlpReinstall.addEventListener("click", () => handleYtdlpAction("reinstall"));
  }
  const ffmpegCheck = document.getElementById("ffmpegCheck");
  if (ffmpegCheck)
    ffmpegCheck.addEventListener("click", () => loadDepsInfo());
  const ffmpegReinstall = document.getElementById("ffmpegReinstall");
  if (ffmpegReinstall)
    ffmpegReinstall.addEventListener("click", () => openEagleFfmpegStore());
  const sankakuInput = document.getElementById("sankakuToken");
  const sankakuSave = document.getElementById("sankakuSave");
  const sankakuClear = document.getElementById("sankakuClear");
  const sankakuStatus = document.getElementById("sankakuAuthStatus");
  if (sankakuSave && sankakuInput) {
    sankakuSave.addEventListener("click", () => {
      const token = sankakuAuth.parseAccessToken(sankakuInput.value);
      if (!token) {
        if (sankakuStatus)
          sankakuStatus.textContent = "access_token \u65E0\u6548";
        return;
      }
      sankakuAuth.setStoredAuth(sankakuInput.value);
      if (sankakuStatus)
        sankakuStatus.textContent = "\u5DF2\u4FDD\u5B58";
    });
  }
  if (sankakuClear && sankakuInput) {
    sankakuClear.addEventListener("click", () => {
      sankakuAuth.setStoredAuth("");
      sankakuInput.value = "";
      if (sankakuStatus)
        sankakuStatus.textContent = "\u5DF2\u6E05\u9664";
    });
  }
  const twToken = document.getElementById("authToken");
  const twCt0 = document.getElementById("ct0");
  const twPasscode = document.getElementById("chatPasscode");
  const twStatus = document.getElementById("twitterAuthStatus");
  const twSave = document.getElementById("twitterSave");
  const twClear = document.getElementById("twitterClear");
  const twIntervals = document.getElementById("monitorInterval");
  const setTwStatus = (text) => {
    if (twStatus)
      twStatus.textContent = text;
  };
  const twLastRun = document.getElementById("monitorLastRun");
  const fmtClock = (ms) => {
    if (!ms)
      return "\u2014";
    const d = new Date(ms);
    const pad = (n) => String(n).padStart(2, "0");
    return pad(d.getHours()) + ":" + pad(d.getMinutes()) + ":" + pad(d.getSeconds());
  };
  const updateLastRunLine = () => {
    if (!twLastRun)
      return;
    const log = twitterMonitor.getFetchLog ? twitterMonitor.getFetchLog() : [];
    const timestamps = [
      twitterMonitor.getKindLastCheckAt("likes"),
      twitterMonitor.getKindLastCheckAt("bookmarks"),
      twitterMonitor.getKindLastCheckAt("dm")
    ].filter(Boolean);
    const latest = timestamps.length ? Math.max(...timestamps) : 0;
    const parts = [];
    const likeAt = twitterMonitor.getKindLastCheckAt("likes");
    const bookmarkAt = twitterMonitor.getKindLastCheckAt("bookmarks");
    const dmAt = twitterMonitor.getKindLastCheckAt("dm");
    if (likeAt)
      parts.push("\u70B9\u8D5E " + fmtClock(likeAt));
    if (bookmarkAt)
      parts.push("\u6536\u85CF " + fmtClock(bookmarkAt));
    if (dmAt)
      parts.push("\u597D\u53CB " + fmtClock(dmAt));
    twLastRun.textContent = latest ? "\u6700\u8FD1\u6293\u53D6\uFF1A" + parts.join(" / ") + (log[0] ? "\uFF08\u65B0\u589E " + log[0].newCount + "\uFF09" : "") : "\u6700\u8FD1\u6293\u53D6\uFF1A\u2014";
  };
  if (twLastRun) {
    updateLastRunLine();
    setInterval(updateLastRunLine, 1e4);
  }
  const describeInterval = (ms) => {
    if (ms % 36e5 === 0)
      return ms / 36e5 + " \u5C0F\u65F6";
    if (ms < 6e4)
      return Math.round(ms / 1e3) + " \u79D2";
    return ms / 6e4 + " \u5206\u949F";
  };
  const applyInterval = () => {
    const minutes = twIntervals ? Number(twIntervals.value) || 0 : 0;
    ui.setIntervalChoice(minutes);
    if (!minutes) {
      twitterMonitor.stop();
      setTwStatus("\u81EA\u52A8\u6293\u53D6\u5DF2\u5173\u95ED");
      return false;
    }
    if (!twitterAuth.hasAuth()) {
      setTwStatus("Cookie \u65E0\u6548\uFF0C\u65E0\u6CD5\u542F\u52A8\u81EA\u52A8\u6293\u53D6");
      return false;
    }
    const intervalMs = Math.max(twitterMonitor.MIN_INTERVAL_MS, minutes * 6e4);
    twitterMonitor.start(intervalMs);
    setTwStatus("\u81EA\u52A8\u6293\u53D6\u8FD0\u884C\u4E2D\uFF0C\u6BCF " + describeInterval(intervalMs) + " \u4E00\u6B21");
    updateLastRunLine();
    return true;
  };
  if (twSave && twToken && twCt0) {
    twSave.addEventListener("click", async () => {
      const cookie = twitterAuth.buildCookie(twToken.value, twCt0.value);
      if (!cookie) {
        setTwStatus("auth_token \u6216 ct0 \u65E0\u6548");
        return;
      }
      twitterAuth.setStoredCookie(cookie);
      twitterMonitor.setPrefs({ chatPasscode: twPasscode ? String(twPasscode.value || "").trim() : "" });
      setTwStatus("\u6B63\u5728\u4FDD\u5B58\u2026");
      const profile = await twitterMonitor.fetchProfile();
      if (profile && profile.ok) {
        setTwStatus("\u5DF2\u4FDD\u5B58\uFF0C@" + (profile.screenName || "?"));
        ui.renderTwitterProfile(profile);
      } else {
        setTwStatus("\u5DF2\u4FDD\u5B58\uFF0C\u8D26\u53F7\u8D44\u6599\u6682\u672A\u83B7\u53D6");
        ui.renderTwitterProfile();
      }
      if (ui.refreshChatList)
        ui.refreshChatList();
      applyInterval();
    });
  }
  if (twClear && twToken && twCt0) {
    twClear.addEventListener("click", () => {
      twitterAuth.setStoredCookie("");
      twToken.value = "";
      twCt0.value = "";
      twitterMonitor.setPrefs({ chatPasscode: "" });
      if (twPasscode)
        twPasscode.value = "";
      twitterMonitor.saveProfile({});
      twitterMonitor.clearConversations();
      ui.renderTwitterProfile(null);
      if (ui.renderChatList)
        ui.renderChatList();
      setTwStatus("\u5DF2\u6E05\u9664 Cookie");
      twitterMonitor.stop();
      if (twIntervals)
        twIntervals.value = "0";
    });
  }
  if (twIntervals)
    twIntervals.addEventListener("change", applyInterval);
  const dmIntervals = document.getElementById("dmMonitorInterval");
  if (dmIntervals) {
    const savedDmMs = twitterMonitor.getPrefs().dmMs;
    if (savedDmMs)
      dmIntervals.value = String(Math.round(savedDmMs / 6e4));
    dmIntervals.addEventListener("change", () => {
      const minutes = Number(dmIntervals.value) || 2;
      twitterMonitor.setPrefs({ dmMs: minutes * 6e4 });
      if (twitterMonitor.isRunning())
        twitterMonitor.startDm(minutes * 6e4);
      setTwStatus("\u597D\u53CB\u6293\u53D6\u8FD0\u884C\u4E2D\uFF0C\u6BCF " + minutes + " \u5206\u949F\u4E00\u6B21");
    });
  }
  const twLikes = document.getElementById("twitterMonitorLikes");
  const twBookmarks = document.getElementById("twitterMonitorBookmarks");
  const twDm = document.getElementById("twitterMonitorDm");
  const onSourceChange = () => {
    twitterMonitor.setPrefs({
      likes: !!(twLikes && twLikes.checked),
      bookmarks: !!(twBookmarks && twBookmarks.checked),
      dm: !!(twDm && twDm.checked)
    });
    const anySource = twLikes && twLikes.checked || twBookmarks && twBookmarks.checked || twDm && twDm.checked;
    if (!anySource) {
      twitterMonitor.stop();
      setTwStatus("\u672A\u9009\u62E9\u6293\u53D6\u5185\u5BB9\uFF0C\u81EA\u52A8\u6293\u53D6\u5DF2\u505C\u6B62");
      return;
    }
    if (!(twDm && twDm.checked))
      twitterMonitor.stopDm();
    else if (twitterMonitor.isRunning())
      twitterMonitor.startDm(twitterMonitor.getPrefs().dmMs);
    applyInterval();
  };
  const savedSourcePrefs = twitterMonitor.getPrefs();
  if (twLikes)
    twLikes.checked = savedSourcePrefs.likes !== false;
  if (twBookmarks)
    twBookmarks.checked = savedSourcePrefs.bookmarks !== false;
  if (twDm)
    twDm.checked = savedSourcePrefs.dm !== false;
  if (twLikes)
    twLikes.addEventListener("change", onSourceChange);
  if (twBookmarks)
    twBookmarks.addEventListener("change", onSourceChange);
  if (twDm)
    twDm.addEventListener("change", onSourceChange);
  const groupHeads = document.querySelectorAll(".account-group-head");
  const setGroupOpen = (head, open) => {
    head.classList.toggle("open", open);
    head.setAttribute("aria-expanded", open ? "true" : "false");
    const body = document.getElementById(head.dataset.target);
    if (body)
      body.hidden = !open;
  };
  const closeGroups = () => {
    Array.prototype.forEach.call(groupHeads, (head) => setGroupOpen(head, false));
  };
  Array.prototype.forEach.call(groupHeads, (head) => {
    setGroupOpen(head, false);
    head.addEventListener("click", () => setGroupOpen(head, !head.classList.contains("open")));
    head.addEventListener("keydown", (event) => {
      if (event.key !== "Enter" && event.key !== " ")
        return;
      event.preventDefault();
      setGroupOpen(head, !head.classList.contains("open"));
    });
  });
  document.addEventListener("evd:panel", (event) => {
    if (!event.detail || event.detail.view !== "account")
      closeGroups();
  });
  const twTest = document.getElementById("monitorTest");
  if (twTest) {
    twTest.addEventListener("click", async () => {
      if (!twitterAuth.hasAuth()) {
        setTwStatus("Cookie \u65E0\u6548");
        return;
      }
      twTest.disabled = true;
      setTwStatus("\u6B63\u5728\u6293\u53D6\u2026");
      let result = null;
      try {
        await libraryIndex.build({ force: true });
        result = await twitterMonitor.catchUp({ includeDm: true });
      } catch (e) {
        result = { ok: false, error: e && e.message || "error" };
      }
      twTest.disabled = false;
      if (!result || result.ok === false) {
        setTwStatus("\u6293\u53D6\u5931\u8D25\uFF1A" + (result && result.error || "error"));
        return;
      }
      setTwStatus(describeCatchupResult(result));
      updateLastRunLine();
    });
  }
}
async function openEagleFfmpegStore() {
  if (typeof eagle !== "undefined" && eagle.extraModule && eagle.extraModule.ffmpeg && typeof eagle.extraModule.ffmpeg.install === "function") {
    try {
      await eagle.extraModule.ffmpeg.install();
      return;
    } catch (e) {
    }
  }
  const isZh = eagle.app.locale && eagle.app.locale.startsWith("zh");
  const url = isZh ? "https://community-cn.eagle.cool/plugin/detail/eagle-plugin-ffmpeg" : "https://community.eagle.cool/plugin/detail/eagle-plugin-ffmpeg";
  try {
    const { shell } = require("electron");
    shell.openExternal(url);
  } catch (e) {
    window.open(url, "_blank");
  }
}
async function initializeBinaries() {
  if (depsReady()) {
    isInitialized = true;
    initializeMainUI();
    loadDepsInfo();
    checkForUpdateAndNotify();
    return;
  }
  ui.showDepsPage({
    tab: "dependencies",
    gating: true,
    autoAddSourcePref: getAutoAddSourcePref(),
    xhsTagsPref: getXhsTagsPref(),
    xhsMultiFilePref: getXhsMultiFilePref(),
    twitterMultiFilePref: getTwitterMultiFilePref(),
    twitterNamePref: getTwitterNamePrefs(),
    twitterAnnotationPref: getTwitterAnnotationPrefs(),
    twitterTagsPref: getTwitterTagsPref(),
    maxResolutionPref: getMaxResolutionPref(),
    maxFrameratePref: getMaxFrameratePref(),
    threadCountPref: getThreadCountPref()
  });
  ui.updateDepsBadge(true);
  loadDepsInfo();
}
function depsReady() {
  return isYtDlpInstalled() && !!getFfmpegSource();
}
function refreshDepsGatingState() {
  if (depsReady()) {
    if (!isInitialized) {
      isInitialized = true;
      ui.hideDepsPage();
      initializeMainUI();
      checkForUpdateAndNotify();
    } else {
      getYtDlpUpdateInfo().then(({ hasUpdate }) => {
        ui.updateDepsBadge(hasUpdate);
      }).catch(() => {
        ui.updateDepsBadge(false);
      });
    }
  } else {
    isInitialized = false;
    ui.setDepsGating(true);
    ui.updateDepsBadge(true);
  }
}
function initializeMainUI() {
  ui.showMainUI();
  ui.setupInputBar();
  restoreErrorLog();
  const urlInput = document.getElementById("urlInput");
  if (urlInput)
    urlInput.focus();
  try {
    libraryIndex.build().catch(() => {
    });
    setInterval(() => {
      libraryIndex.build({ force: true }).catch(() => {
      });
    }, 6e4);
  } catch (e) {
  }
}
function restoreErrorLog() {
  const entries = errorLog.list();
  for (const entry of entries) {
    if (!entry || !entry.url)
      continue;
    if (downloadQueue.some((item2) => item2.url === entry.url))
      continue;
    const item = {
      id: ++queueIdCounter,
      url: entry.url,
      title: entry.title || entry.url,
      state: "error",
      progress: 0,
      speed: "",
      eta: "",
      phase: null,
      processingPercent: void 0,
      error: entry.error || "",
      from: entry.from || null
    };
    downloadQueue.push(item);
    ui.appendQueueItem(item);
  }
}
var RECENT_DOWNLOAD_KEY = "evd.recentDownloads";
var RECENT_DOWNLOAD_TTL = 24 * 60 * 60 * 1e3;
var RECENT_DOWNLOAD_LIMIT = 500;
var FAILED_DOWNLOAD_KEY = "evd.failedDownloads";
var FAILED_DOWNLOAD_LIMIT = 500;
function loadFailedDownloads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(FAILED_DOWNLOAD_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}
function saveFailedDownloads(map) {
  try {
    const entries = Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, FAILED_DOWNLOAD_LIMIT);
    localStorage.setItem(FAILED_DOWNLOAD_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (e) {
  }
}
function markDownloadFailed(url) {
  const key = downloadKey(url);
  if (!key)
    return;
  const map = loadFailedDownloads();
  map[key] = Date.now();
  saveFailedDownloads(map);
}
function clearDownloadFailed(url) {
  const key = downloadKey(url);
  if (!key)
    return;
  const map = loadFailedDownloads();
  if (!(key in map))
    return;
  delete map[key];
  saveFailedDownloads(map);
}
function isMarkedDownloadFailed(url) {
  const key = downloadKey(url);
  return !!key && key in loadFailedDownloads();
}
function describeCatchupResult(result) {
  const parts = ["\u672C\u6B21\u65B0\u589E " + (result.newCount || 0) + " \u6761"];
  if (result.duplicateCount)
    parts.push("\u68C0\u6D4B\u5230\u91CD\u590D " + result.duplicateCount + " \u6761");
  if (result.truncated)
    parts.push("\uFF08\u5DF2\u622A\u65AD\u81F3\u4E0A\u9650\uFF09");
  return parts.join(" \xB7 ");
}
function downloadKey(url) {
  const text = String(url || "");
  const tweet = text.match(/\/status\/(\d+)/);
  if (tweet)
    return "tw:" + tweet[1];
  const sankaku = text.match(/\/(?:posts?|post\/show)\/([A-Za-z0-9]+)/i);
  if (sankaku)
    return "sk:" + sankaku[1];
  const xiaohongshu = text.match(/xiaohongshu\.com\/(?:explore|discovery\/item|note)\/([0-9a-f]{24})/i);
  if (xiaohongshu)
    return "xhs:" + xiaohongshu[1].toLowerCase();
  try {
    const parsed = new URL(text.trim());
    return "url:" + parsed.hostname.toLowerCase().replace(/^www\./, "") + parsed.pathname.replace(/\/+$/, "") + parsed.search;
  } catch (e) {
    return "url:" + text.split("#")[0].replace(/\/+$/, "");
  }
}
function loadRecentDownloads() {
  try {
    const parsed = JSON.parse(localStorage.getItem(RECENT_DOWNLOAD_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (e) {
    return {};
  }
}
function saveRecentDownloads(map) {
  try {
    const now = Date.now();
    const entries = Object.entries(map).filter(([, ts]) => now - ts < RECENT_DOWNLOAD_TTL).sort((a, b) => b[1] - a[1]).slice(0, RECENT_DOWNLOAD_LIMIT);
    localStorage.setItem(RECENT_DOWNLOAD_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch (e) {
  }
}
var ACTIVE_QUEUE_STATES = ["waiting", "preparing", "downloading"];
async function isDuplicateDownload(url, options) {
  const key = downloadKey(url);
  if (!key)
    return false;
  if (downloadQueue.some((item) => item.state !== "error" && downloadKey(item.url) === key))
    return true;
  if (options && options.scrape) {
    const recent = loadRecentDownloads();
    const downloadedAt = Number(recent[key]) || 0;
    if (downloadedAt && Date.now() - downloadedAt < RECENT_DOWNLOAD_TTL)
      return true;
  }
  try {
    return await libraryIndex.hasSameLink(url);
  } catch (e) {
    return false;
  }
}
function recordDownloaded(url) {
  const key = downloadKey(url);
  const recent = loadRecentDownloads();
  recent[key] = Date.now();
  saveRecentDownloads(recent);
  try {
    twitterMonitor.markTweetSeen(url);
  } catch (e) {
  }
  try {
    libraryIndex.remember(url);
  } catch (e) {
  }
}
async function addToQueue(url, from, scrape) {
  if (!isInitialized)
    return "skip";
  if (scrape && isMarkedDownloadFailed(url)) {
    console.info("[queue] previously failed, skip from scrape:", url);
    return "skip";
  }
  const failed = downloadQueue.find((item2) => item2.state === "error" && item2.url === url);
  if (failed) {
    failed.state = "waiting";
    failed.progress = 0;
    failed.speed = "";
    failed.eta = "";
    failed.phase = null;
    failed.processingPercent = void 0;
    failed.error = null;
    ui.updateQueueItem(failed.id, failed);
    processQueue();
    playDownloadAddedSound();
    return "queued";
  }
  if (await isDuplicateDownload(url, { scrape })) {
    console.info("[queue] duplicate skipped:", url);
    try {
      document.dispatchEvent(new CustomEvent("evd:download-duplicate", { detail: { url } }));
    } catch (e) {
    }
    return "duplicate";
  }
  if (downloadQueue.some((entry) => ACTIVE_QUEUE_STATES.includes(entry.state) && downloadKey(entry.url) === downloadKey(url)))
    return "duplicate";
  const item = {
    id: ++queueIdCounter,
    url,
    title: url,
    state: "waiting",
    progress: 0,
    speed: "",
    eta: "",
    phase: null,
    processingPercent: void 0,
    error: null,
    from: from && (from.screenName || from.name || from.id) ? from : null
  };
  downloadQueue.push(item);
  ui.appendQueueItem(item);
  processQueue();
  playDownloadAddedSound();
  return "queued";
}
function processQueue() {
  if (queuePaused)
    return;
  while (activeCount < getConcurrencyPref()) {
    const nextItem = downloadQueue.find((item) => item.state === "waiting");
    if (!nextItem)
      break;
    activeCount++;
    executeDownload(nextItem);
  }
}
function pauseAllDownloads() {
  queuePaused = true;
  for (const item of downloadQueue) {
    if (item.state === "preparing" || item.state === "downloading") {
      item.state = "waiting";
      item.progress = 0;
      item.speed = "";
      item.eta = "";
      item.phase = null;
      item.processingPercent = void 0;
      ui.updateQueueItem(item.id, item);
    }
  }
  try {
    downloader.cancelAll();
  } catch (e) {
    console.error("cancelAll failed:", e);
  }
  ui.setQueuePaused(true);
}
function resumeAllDownloads() {
  queuePaused = false;
  ui.setQueuePaused(false);
  downloadQueue.forEach((item) => {
    if (item.state !== "error")
      return;
    item.state = "waiting";
    item.progress = 0;
    item.error = null;
    item.speed = "";
    item.eta = "";
    item.phase = null;
    item.processingPercent = void 0;
    ui.updateQueueItem(item.id, item);
  });
  processQueue();
}
async function probeTweetFailure(url) {
  const matched = String(url || "").match(/\/status(?:es)?\/(\d+)/);
  if (!matched)
    return "";
  const res = await getJson("https://api.fxtwitter.com/status/" + matched[1], {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
      accept: "application/json"
    },
    timeout: 4e3
  });
  if (!res || !res.status)
    return "";
  if (res.status === 404)
    return "\u63A8\u6587\u4E0D\u5B58\u5728\u6216\u5DF2\u5220\u9664";
  if (res.status === 401 || res.status === 403) {
    return "\u63A8\u6587\u53D7\u4FDD\u62A4\uFF0C\u8D26\u53F7\u6240\u6709\u8005\u9650\u5236\u4E86\u53EF\u4EE5\u67E5\u770B\u5176\u5E16\u5B50\u7684\u7528\u6237";
  }
  if (res.status === 200) {
    const tweet = res.json && res.json.tweet;
    const videos = tweet && tweet.media && Array.isArray(tweet.media.videos) ? tweet.media.videos : [];
    if (!videos.length)
      return "\u8BE5\u63A8\u6587\u6CA1\u6709\u53EF\u4E0B\u8F7D\u7684\u89C6\u9891";
  }
  return "";
}
function isTwitterUrl(url) {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, "").toLowerCase();
    return hostname === "x.com" || hostname === "twitter.com" || hostname.endsWith(".x.com") || hostname.endsWith(".twitter.com");
  } catch {
    return false;
  }
}
async function formatDownloadError(error, url) {
  if ((error == null ? void 0 : error.code) === "ENETBOUNDARY") {
    return i18next.t("error.blockedAddress");
  }
  if (isNetworkError(error)) {
    return i18next.t("error.networkUnavailable");
  }
  const msg = (error == null ? void 0 : error.message) || "";
  if (/Unsupported URL/i.test(msg)) {
    try {
      const hostname = new URL(url).hostname.toLowerCase();
      if (hostname === "dribbble.com" || hostname.endsWith(".dribbble.com")) {
        return i18next.t("error.dribbbleProtected");
      }
    } catch {
    }
    return i18next.t("error.unsupportedUrl");
  }
  if (/Video unavailable|This video is unavailable|Unable to download video/i.test(msg)) {
    return i18next.t("error.videoUnavailable");
  }
  if (/Private video|This video is private|Sign in to confirm/i.test(msg)) {
    return i18next.t("error.privateVideo");
  }
  if (isTwitterUrl(url) && /No video formats found|not authorized|TweetTombstone|requires authentication|No video could be found/i.test(msg)) {
    const real = await probeTweetFailure(url);
    if (real)
      return real;
  }
  return msg || i18next.t("download.failed");
}
async function executeDownload(item) {
  try {
    item.state = "preparing";
    ui.updateQueueItem(item.id, item);
    const videoInfo = await downloader.getVideoInfo(item.url);
    item.title = videoInfo.title || i18next.t("error.untitledVideo");
    if (videoInfo && videoInfo.sourceUrl && videoInfo.sourceUrl !== item.url) {
      let alreadyInLibrary = false;
      try {
        alreadyInLibrary = await libraryIndex.hasSameLink(videoInfo.sourceUrl);
      } catch (e) {
        alreadyInLibrary = false;
      }
      if (alreadyInLibrary) {
        console.info("[queue] media already in library via source:", videoInfo.sourceUrl);
        item.state = "completed";
        item.progress = 100;
        item.speed = "";
        item.eta = "";
        item.phase = null;
        item.processingPercent = void 0;
        ui.updateQueueItem(item.id, item);
        recordDownloaded(item.url);
        recordDownloaded(videoInfo.sourceUrl);
        clearDownloadFailed(item.url);
        try {
          document.dispatchEvent(new CustomEvent("evd:download-duplicate", {
            detail: { url: item.url, sourceUrl: videoInfo.sourceUrl }
          }));
        } catch (e) {
        }
        return;
      }
    }
    item.state = "downloading";
    item.phase = null;
    item.processingPercent = void 0;
    item.eta = "";
    ui.updateQueueItem(item.id, item);
    const results = await downloader.downloadVideo(
      item.url,
      (progress) => {
        if (progress.phase) {
          item.phase = progress.phase;
          item.processingPercent = void 0;
        }
        if (typeof progress.processingPercent === "number")
          item.processingPercent = progress.processingPercent;
        if (typeof progress.percent === "number" && !progress.phase)
          item.progress = progress.percent;
        if (typeof progress.currentSpeed === "string")
          item.speed = progress.currentSpeed;
        if (typeof progress.eta === "string")
          item.eta = progress.eta;
        ui.updateQueueItem(item.id, item);
      },
      null,
      videoInfo
    );
    item.state = "completed";
    item.progress = 100;
    item.speed = "";
    item.eta = "";
    item.phase = null;
    item.processingPercent = void 0;
    ui.updateQueueItem(item.id, item);
    errorLog.remove(item.url);
    for (const result of results) {
      const sourceUrl = getAutoAddSourcePref() ? item.url : void 0;
      await importToEagle(result.path, result.metadata, sourceUrl, {
        index: result.partIndex,
        total: result.partTotal
      });
      downloader.cleanup(result.path);
    }
    recordDownloaded(item.url);
    for (const result of results) {
      const resolvedSource = result && result.metadata && result.metadata.sourceUrl;
      if (typeof resolvedSource === "string" && resolvedSource && resolvedSource !== item.url) {
        recordDownloaded(resolvedSource);
        break;
      }
    }
    clearDownloadFailed(item.url);
  } catch (error) {
    if (item.state === "waiting")
      return;
    item.state = "error";
    markDownloadFailed(item.url);
    item.error = await formatDownloadError(error, item.url);
    ui.updateQueueItem(item.id, item);
    errorLog.add({ url: item.url, title: item.title, error: item.error, from: item.from });
  } finally {
    activeCount--;
    processQueue();
  }
}
function retryDownload(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item || item.state !== "error")
    return;
  item.state = "waiting";
  item.progress = 0;
  item.error = null;
  item.speed = "";
  item.eta = "";
  item.phase = null;
  item.processingPercent = void 0;
  ui.updateQueueItem(item.id, item);
  processQueue();
}
async function copyError(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item || !item.error)
    return;
  try {
    await navigator.clipboard.writeText(item.error);
    ui.showCopiedErrorFeedback(id);
  } catch (error) {
    console.error("Failed to copy error:", error);
  }
}
async function checkForUpdateAndNotify() {
  try {
    const { hasUpdate } = await getYtDlpUpdateInfo();
    ui.updateDepsBadge(hasUpdate || !depsReady());
  } catch (e) {
    ui.updateDepsBadge(!depsReady());
  }
}
function openDepsPage(tab = "settings") {
  ui.showDepsPage({
    tab,
    autoAddSourcePref: getAutoAddSourcePref(),
    xhsTagsPref: getXhsTagsPref(),
    xhsMultiFilePref: getXhsMultiFilePref(),
    twitterMultiFilePref: getTwitterMultiFilePref(),
    twitterNamePref: getTwitterNamePrefs(),
    twitterAnnotationPref: getTwitterAnnotationPrefs(),
    twitterTagsPref: getTwitterTagsPref(),
    maxResolutionPref: getMaxResolutionPref(),
    maxFrameratePref: getMaxFrameratePref(),
    threadCountPref: getThreadCountPref()
  });
  loadDepsInfo();
}
function loadDepsInfo(options = {}) {
  const ffmpegSource = getFfmpegSource();
  const ytdlpInstalled = isYtDlpInstalled();
  if (ffmpegSource === "eagle") {
    ui.updateFfmpegCard("eagle", {});
  } else {
    ui.updateFfmpegCard("missing", {});
  }
  if (!ytdlpInstalled) {
    ui.updateYtdlpCard("missing");
    return;
  }
  if (options.ytdlpKnownLatest) {
    ui.updateYtdlpCard("latest", { version: options.ytdlpKnownLatest });
  } else {
    loadYtdlpUpdateStatus();
  }
}
function loadYtdlpUpdateStatus() {
  ui.updateYtdlpCard("installed", { checkingUpdate: true });
  const latestVersion = getLatestYtDlpVersion();
  getInstalledYtDlpVersion().then((installedVersion) => {
    if (!installedVersion) {
      ui.updateYtdlpCard("missing");
      return;
    }
    if (installedVersion !== latestVersion) {
      ui.updateYtdlpCard("outdated", { installedVersion, latestVersion });
    } else {
      ui.updateYtdlpCard("latest", { version: installedVersion });
    }
  }).catch(() => {
  });
}
async function handleYtdlpAction(action) {
  if (action === "uninstall") {
    uninstallYtDlp();
    ui.updateYtdlpCard("missing");
    refreshDepsGatingState();
    return;
  }
  const statusKey = {
    install: "deps.installing",
    update: "deps.updating",
    reinstall: "deps.reinstalling"
  }[action] || "deps.updating";
  const doneKey = {
    install: "deps.doneInstalled",
    update: "deps.doneUpdated",
    reinstall: "deps.doneReinstalled"
  }[action] || "deps.doneInstalled";
  const statusText = i18next.t(statusKey);
  ui.updateYtdlpCard("busy", { statusText, percent: 0 });
  try {
    await downloadYtDlp((progress) => {
      ui.updateYtdlpCard("busy", { statusText, percent: progress });
    });
    const version = await getInstalledYtDlpVersion();
    ui.updateYtdlpCard("done", { statusText: i18next.t(doneKey), version });
    setTimeout(() => {
      loadDepsInfo({ ytdlpKnownLatest: version });
      refreshDepsGatingState();
    }, 1500);
  } catch (e) {
    const message = isNetworkError(e) ? i18next.t("error.networkUnavailable") : e.message;
    ui.updateYtdlpCard("error", { message, retryAction: action });
  }
}
async function copyUrl(id) {
  const item = downloadQueue.find((item2) => item2.id === id);
  if (!item)
    return;
  try {
    await navigator.clipboard.writeText(item.url);
    ui.showCopiedFeedback(id);
  } catch (error) {
    console.error("Failed to copy URL:", error);
  }
}
function deleteDownloadItem(id) {
  const index = downloadQueue.findIndex((entry) => entry.id === id);
  if (index < 0)
    return;
  if (!ui.canDeleteQueueItem(downloadQueue[index]))
    return;
  const url = downloadQueue[index].url;
  downloadQueue.splice(index, 1);
  ui.removeQueueItem(id);
  errorLog.remove(url);
  try {
    twitterMonitor.markTweetSeen(url);
  } catch (e) {
  }
}
var WINDOW_SIZE_KEY = "evd.windowSize.v2";
function saveWindowSize() {
  if (window.__evdApplyingWindowSize)
    return;
  try {
    const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
    if (api && typeof api.getSize === "function") {
      Promise.resolve(api.getSize()).then((current) => {
        if (window.__evdApplyingWindowSize)
          return;
        const width2 = Math.round(Number(Array.isArray(current) ? current[0] : current && current.width));
        const height2 = Math.round(Number(Array.isArray(current) ? current[1] : current && current.height));
        if (Number.isFinite(width2) && Number.isFinite(height2) && width2 > 0 && height2 > 0)
          localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ width: width2, height: height2 }));
      }).catch(() => {
      });
      return;
    }
    const width = Math.round(window.innerWidth);
    const height = Math.round(window.innerHeight);
    if (width > 0 && height > 0) {
      localStorage.setItem(WINDOW_SIZE_KEY, JSON.stringify({ width, height }));
    }
  } catch (e) {
  }
}
var DOWNLOAD_CORNER_KEY = "evd.downloadCornerMode";
var DOWNLOAD_CORNER_VALUES = ["default", "account"];
function getDownloadCornerMode() {
  try {
    let value = String(localStorage.getItem(DOWNLOAD_CORNER_KEY) || "default");
    if (value === "status" || value === "none")
      value = "default";
    if (DOWNLOAD_CORNER_VALUES.indexOf(value) >= 0)
      return value;
  } catch (e) {
  }
  return "default";
}
function setDownloadCornerMode(value) {
  const next = DOWNLOAD_CORNER_VALUES.indexOf(String(value)) >= 0 ? String(value) : "default";
  try {
    localStorage.setItem(DOWNLOAD_CORNER_KEY, next);
  } catch (e) {
  }
}
var SIDEBAR_ACCOUNT_KEY = "evd.showSidebarAccount";
function getShowSidebarAccount() {
  try {
    return localStorage.getItem(SIDEBAR_ACCOUNT_KEY) !== "0";
  } catch (e) {
    return true;
  }
}
function applySidebarAccountVisibility() {
  const el = document.getElementById("downloadAccount");
  const sep = document.getElementById("sidebarAccountSep");
  if (!el)
    return;
  const visible = getShowSidebarAccount();
  el.style.display = visible ? "" : "none";
  if (sep)
    sep.style.display = visible ? "" : "none";
}
function setShowSidebarAccount(value) {
  try {
    localStorage.setItem(SIDEBAR_ACCOUNT_KEY, value ? "1" : "0");
  } catch (e) {
  }
  applySidebarAccountVisibility();
}
function currentLibraryPath() {
  try {
    if (typeof eagle !== "undefined" && eagle && eagle.library && eagle.library.path)
      return String(eagle.library.path);
  } catch (e) {
  }
  return "";
}
function readScopedRaw(baseKey) {
  try {
    const libraryPath = currentLibraryPath();
    if (libraryPath) {
      const scoped = localStorage.getItem(baseKey + "::" + libraryPath.toLowerCase());
      if (scoped != null)
        return scoped;
    }
    return localStorage.getItem(baseKey);
  } catch (e) {
    return null;
  }
}
function readScopedJson(baseKey, fallback) {
  const raw = readScopedRaw(baseKey);
  if (raw == null)
    return fallback;
  try {
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}
function renderDownloadAccount() {
  const nameEl = document.getElementById("downloadAccountName");
  const avatarEl = document.getElementById("downloadAccountAvatar");
  const rightEl = document.getElementById("downloadAccountRight");
  if (!nameEl || !avatarEl || !rightEl)
    return;
  let profile = null;
  try {
    profile = readScopedJson("Edge-Media-Download-NEW.twitterProfile", null);
  } catch (e) {
  }
  const connected = !!(profile && profile.screenName);
  nameEl.textContent = connected ? profile.name || profile.screenName : "\u672A\u8FDE\u63A5\u63A8\u7279\u8D26\u53F7";
  const avatarUrl = connected ? profile.avatarData || profile.avatar || "" : "";
  if (avatarUrl) {
    avatarEl.style.backgroundImage = 'url("' + String(avatarUrl).replace(/"/g, "%22") + '")';
    avatarEl.textContent = "";
  } else {
    avatarEl.style.backgroundImage = "";
    avatarEl.textContent = connected ? String(profile.name || profile.screenName || "?").slice(0, 1).toUpperCase() : "";
  }
  const rightText = connected ? "@" + profile.screenName : "";
  rightEl.textContent = rightText;
  rightEl.style.display = rightText ? "" : "none";
}
function setupDownloadAccountStrip() {
  applySidebarAccountVisibility();
  renderDownloadAccount();
  window.setInterval(renderDownloadAccount, 3e3);
  const showToggle = document.getElementById("showSidebarAccountToggle");
  if (showToggle) {
    showToggle.checked = getShowSidebarAccount();
    showToggle.addEventListener("change", (e) => {
      setShowSidebarAccount(!!e.target.checked);
    });
  }
  window.addEventListener("evd:panel", renderDownloadAccount);
  const select = document.getElementById("downloadCornerMode");
  if (select) {
    select.value = getDownloadCornerMode();
    select.addEventListener("change", (e) => {
      setDownloadCornerMode(e.target.value);
      renderDownloadAccount();
    });
  }
}
function setupWindowState() {
  try {
    localStorage.removeItem(WINDOW_SIZE_KEY);
  } catch (e) {
  }
}
var INGEST_PORT = 43110;
var INGEST_ALLOWED_HOSTS = ["x.com", "twitter.com", "mobile.twitter.com", "video.twimg.com", "pbs.twimg.com", "sankaku.app", "sankakucomplex.com", "xiaohongshu.com", "xhslink.com"];
function isIngestUrlAllowed(value) {
  try {
    const parsed = new URL(String(value || ""));
    if (parsed.protocol !== "https:")
      return false;
    const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
    return INGEST_ALLOWED_HOSTS.some((allowed) => host === allowed || host.endsWith("." + allowed));
  } catch (e) {
    return false;
  }
}
function writeBridgeResponse(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": Buffer.byteLength(body),
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(body);
}
var peersCache = { at: 0, list: [] };
function getLocalSubnets() {
  const subnets = /* @__PURE__ */ new Set();
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const info of interfaces[name] || []) {
        if (info.family === "IPv4" && !info.internal && info.address) {
          subnets.add(info.address.split(".").slice(0, 3).join("."));
        }
      }
    }
  } catch (e) {
  }
  return Array.from(subnets);
}
function probePeer(ip) {
  return new Promise((resolve) => {
    const http = require("http");
    const req = http.get({ host: ip, port: INGEST_PORT, path: "/ping", timeout: 400 }, (res) => {
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 4096)
          res.destroy();
      });
      res.on("end", () => {
        try {
          const json = JSON.parse(body);
          if (json && json.app === "eagle-video-downloader") {
            resolve({ ip, name: json.name || ip, ready: !!json.ready });
            return;
          }
        } catch (e) {
        }
        resolve(null);
      });
    });
    req.on("timeout", () => {
      req.destroy();
      resolve(null);
    });
    req.on("error", () => resolve(null));
  });
}
async function scanLanPeers(force) {
  const now = Date.now();
  if (!force && peersCache.list.length && now - peersCache.at < 3e4)
    return peersCache.list;
  const selfIps = /* @__PURE__ */ new Set();
  try {
    const os = require("os");
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const info of interfaces[name] || []) {
        if (info.family === "IPv4" && info.address)
          selfIps.add(info.address);
      }
    }
  } catch (e) {
  }
  const targets = [];
  for (const subnet of getLocalSubnets()) {
    for (let host = 1; host <= 254; host++) {
      const ip = subnet + "." + host;
      if (!selfIps.has(ip))
        targets.push(ip);
    }
  }
  if (!targets.length)
    return [];
  const peers = [];
  const concurrency = 64;
  for (let index = 0; index < targets.length; index += concurrency) {
    const batch = targets.slice(index, index + concurrency);
    const results = await Promise.all(batch.map((ip) => probePeer(ip)));
    for (const item of results) {
      if (item)
        peers.push(item);
    }
    if (peers.length >= 20)
      break;
  }
  peersCache = { at: Date.now(), list: peers };
  return peers;
}
function startIngestBridge() {
  if (startIngestBridge.server)
    return startIngestBridge.server;
  let http;
  try {
    http = require("http");
  } catch (e) {
    return null;
  }
  if (!http || typeof http.createServer !== "function")
    return null;
  const server = http.createServer((req, res) => {
    const pathname = String(req.url || "/").split("?")[0];
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type"
      });
      res.end();
      return;
    }
    if (pathname === "/ping") {
      let name = "";
      try {
        name = require("os").hostname();
      } catch (e) {
      }
      writeBridgeResponse(res, 200, { ok: true, app: "eagle-video-downloader", ready: !!isInitialized, name });
      return;
    }
    if (pathname === "/peers") {
      scanLanPeers().then((peers) => writeBridgeResponse(res, 200, { ok: true, peers })).catch(() => writeBridgeResponse(res, 200, { ok: true, peers: [] }));
      return;
    }
    if (pathname !== "/ingest" || req.method !== "POST") {
      writeBridgeResponse(res, 404, { ok: false, error: "not-found" });
      return;
    }
    let body = "";
    let tooLarge = false;
    req.on("data", (chunk) => {
      body += chunk;
      if (body.length > 16 * 1024) {
        tooLarge = true;
        req.destroy();
      }
    });
    req.on("end", () => {
      if (tooLarge)
        return;
      let payload = null;
      try {
        payload = JSON.parse(body || "{}");
      } catch (e) {
        payload = null;
      }
      const target = payload && typeof payload.url === "string" ? payload.url.trim() : "";
      if (!target || !isIngestUrlAllowed(target)) {
        writeBridgeResponse(res, 400, { ok: false, error: "invalid-url" });
        return;
      }
      if (!isInitialized) {
        writeBridgeResponse(res, 503, { ok: false, error: "not-ready" });
        return;
      }
      addToQueue(target);
      writeBridgeResponse(res, 200, { ok: true, url: target });
    });
    req.on("error", () => {
    });
  });
  server.on("error", (error) => {
    console.warn("[ingest] bridge error:", error && error.message);
  });
  server.listen(INGEST_PORT, "0.0.0.0");
  startIngestBridge.server = server;
  return server;
}
function setupPinButton() {
  const pinButton = document.getElementById("pinBtn");
  if (!pinButton)
    return;
  const STORAGE_KEY = "evd.alwaysOnTop";
  const api = typeof eagle !== "undefined" && eagle.window ? eagle.window : null;
  const render = (pinned2) => {
    pinButton.classList.toggle("active", pinned2);
    pinButton.setAttribute("aria-pressed", pinned2 ? "true" : "false");
  };
  const apply = async (pinned2) => {
    try {
      if (api && typeof api.setAlwaysOnTop === "function") {
        await api.setAlwaysOnTop(pinned2);
      }
    } catch (e) {
      console.error("Failed to set always on top:", e);
      return;
    }
    render(pinned2);
    try {
      localStorage.setItem(STORAGE_KEY, pinned2 ? "1" : "0");
    } catch (e) {
    }
  };
  let pinned = false;
  try {
    pinned = localStorage.getItem(STORAGE_KEY) === "1";
  } catch (e) {
  }
  render(pinned);
  if (pinned)
    apply(true);
  pinButton.addEventListener("click", () => {
    pinned = !pinned;
    apply(pinned);
  });
}
module.exports = {
  buildImportTags,
  buildImportName,
  buildImportAnnotation,
  getTwitterNamePrefs,
  setTwitterNamePref,
  setTwitterNameOrder,
  moveTwitterNameField,
  getTwitterAnnotationPrefs,
  setTwitterAnnotationPref,
  setTwitterAnnotationOrder,
  moveTwitterAnnotationField,
  getTwitterTagsPref,
  setTwitterTagsPref,
  setTwitterTagsOrder,
  setTwitterTagsJoin,
  moveTwitterTagsField,
  getXhsMultiFilePref,
  setXhsMultiFilePref,
  getTwitterMultiFilePref,
  setTwitterMultiFilePref
};
