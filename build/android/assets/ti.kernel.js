(function () {
  'use strict';

  /**
   * @param  {*} arg passed in argument value
   * @param  {string} name name of the argument
   * @param  {string} typename i.e. 'string', 'Function' (value is compared to typeof after lowercasing)
   * @return {void}
   * @throws {TypeError}
   */
  function assertArgumentType(arg, name, typename) {
    const type = typeof arg;

    if (type !== typename.toLowerCase()) {
      throw new TypeError(`The "${name}" argument must be of type ${typename}. Received type ${type}`);
    }
  }

  const FORWARD_SLASH = 47; // '/'

  const BACKWARD_SLASH = 92; // '\\'

  /**
   * Is this [a-zA-Z]?
   * @param  {number}  charCode value from String.charCodeAt()
   * @return {Boolean}          [description]
   */

  function isWindowsDeviceName(charCode) {
    return charCode >= 65 && charCode <= 90 || charCode >= 97 && charCode <= 122;
  }
  /**
   * [isAbsolute description]
   * @param  {boolean} isPosix whether this impl is for POSIX or not
   * @param  {string} filepath   input file path
   * @return {Boolean}          [description]
   */


  function isAbsolute(isPosix, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const length = filepath.length; // empty string special case

    if (length === 0) {
      return false;
    }

    const firstChar = filepath.charCodeAt(0);

    if (firstChar === FORWARD_SLASH) {
      return true;
    } // we already did our checks for posix


    if (isPosix) {
      return false;
    } // win32 from here on out


    if (firstChar === BACKWARD_SLASH) {
      return true;
    }

    if (length > 2 && isWindowsDeviceName(firstChar) && filepath.charAt(1) === ':') {
      const thirdChar = filepath.charAt(2);
      return thirdChar === '/' || thirdChar === '\\';
    }

    return false;
  }
  /**
   * [dirname description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @return {string}            [description]
   */


  function dirname(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const length = filepath.length;

    if (length === 0) {
      return '.';
    } // ignore trailing separator


    let fromIndex = length - 1;
    const hadTrailing = filepath.endsWith(separator);

    if (hadTrailing) {
      fromIndex--;
    }

    const foundIndex = filepath.lastIndexOf(separator, fromIndex); // no separators

    if (foundIndex === -1) {
      // handle special case of root windows paths
      if (length >= 2 && separator === '\\' && filepath.charAt(1) === ':') {
        const firstChar = filepath.charCodeAt(0);

        if (isWindowsDeviceName(firstChar)) {
          return filepath; // it's a root windows path
        }
      }

      return '.';
    } // only found root separator


    if (foundIndex === 0) {
      return separator; // if it was '/', return that
    } // Handle special case of '//something'


    if (foundIndex === 1 && separator === '/' && filepath.charAt(0) === '/') {
      return '//';
    }

    return filepath.slice(0, foundIndex);
  }
  /**
   * [extname description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @return {string}            [description]
   */


  function extname(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const index = filepath.lastIndexOf('.');

    if (index === -1 || index === 0) {
      return '';
    } // ignore trailing separator


    let endIndex = filepath.length;

    if (filepath.endsWith(separator)) {
      endIndex--;
    }

    return filepath.slice(index, endIndex);
  }

  function lastIndexWin32Separator(filepath, index) {
    for (let i = index; i >= 0; i--) {
      const char = filepath.charCodeAt(i);

      if (char === BACKWARD_SLASH || char === FORWARD_SLASH) {
        return i;
      }
    }

    return -1;
  }
  /**
   * [basename description]
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath   input file path
   * @param  {string} [ext]      file extension to drop if it exists
   * @return {string}            [description]
   */


  function basename(separator, filepath, ext) {
    assertArgumentType(filepath, 'path', 'string');

    if (ext !== undefined) {
      assertArgumentType(ext, 'ext', 'string');
    }

    const length = filepath.length;

    if (length === 0) {
      return '';
    }

    const isPosix = separator === '/';
    let endIndex = length; // drop trailing separator (if there is one)

    const lastCharCode = filepath.charCodeAt(length - 1);

    if (lastCharCode === FORWARD_SLASH || !isPosix && lastCharCode === BACKWARD_SLASH) {
      endIndex--;
    } // Find last occurence of separator


    let lastIndex = -1;

    if (isPosix) {
      lastIndex = filepath.lastIndexOf(separator, endIndex - 1);
    } else {
      // On win32, handle *either* separator!
      lastIndex = lastIndexWin32Separator(filepath, endIndex - 1); // handle special case of root path like 'C:' or 'C:\\'

      if ((lastIndex === 2 || lastIndex === -1) && filepath.charAt(1) === ':' && isWindowsDeviceName(filepath.charCodeAt(0))) {
        return '';
      }
    } // Take from last occurrence of separator to end of string (or beginning to end if not found)


    const base = filepath.slice(lastIndex + 1, endIndex); // drop trailing extension (if specified)

    if (ext === undefined) {
      return base;
    }

    return base.endsWith(ext) ? base.slice(0, base.length - ext.length) : base;
  }
  /**
   * The `path.normalize()` method normalizes the given path, resolving '..' and '.' segments.
   *
   * When multiple, sequential path segment separation characters are found (e.g.
   * / on POSIX and either \ or / on Windows), they are replaced by a single
   * instance of the platform-specific path segment separator (/ on POSIX and \
   * on Windows). Trailing separators are preserved.
   *
   * If the path is a zero-length string, '.' is returned, representing the
   * current working directory.
   *
   * @param  {string} separator  platform-specific file separator
   * @param  {string} filepath  input file path
   * @return {string} [description]
   */


  function normalize(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');

    if (filepath.length === 0) {
      return '.';
    } // Windows can handle '/' or '\\' and both should be turned into separator


    const isWindows = separator === '\\';

    if (isWindows) {
      filepath = filepath.replace(/\//g, separator);
    }

    const hadLeading = filepath.startsWith(separator); // On Windows, need to handle UNC paths (\\host-name\\resource\\dir) special to retain leading double backslash

    const isUNC = hadLeading && isWindows && filepath.length > 2 && filepath.charAt(1) === '\\';
    const hadTrailing = filepath.endsWith(separator);
    const parts = filepath.split(separator);
    const result = [];

    for (const segment of parts) {
      if (segment.length !== 0 && segment !== '.') {
        if (segment === '..') {
          result.pop(); // FIXME: What if this goes above root? Should we throw an error?
        } else {
          result.push(segment);
        }
      }
    }

    let normalized = hadLeading ? separator : '';
    normalized += result.join(separator);

    if (hadTrailing) {
      normalized += separator;
    }

    if (isUNC) {
      normalized = '\\' + normalized;
    }

    return normalized;
  }
  /**
   * [assertSegment description]
   * @param  {*} segment [description]
   * @return {void}         [description]
   */


  function assertSegment(segment) {
    if (typeof segment !== 'string') {
      throw new TypeError(`Path must be a string. Received ${segment}`);
    }
  }
  /**
   * The `path.join()` method joins all given path segments together using the
   * platform-specific separator as a delimiter, then normalizes the resulting path.
   * Zero-length path segments are ignored. If the joined path string is a zero-
   * length string then '.' will be returned, representing the current working directory.
   * @param  {string} separator platform-specific file separator
   * @param  {string[]} paths [description]
   * @return {string}       The joined filepath
   */


  function join(separator, paths) {
    const result = []; // naive impl: just join all the paths with separator

    for (const segment of paths) {
      assertSegment(segment);

      if (segment.length !== 0) {
        result.push(segment);
      }
    }

    return normalize(separator, result.join(separator));
  }
  /**
   * The `path.resolve()` method resolves a sequence of paths or path segments into an absolute path.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {string[]} paths [description]
   * @return {string}       [description]
   */


  function resolve(separator, paths) {
    let resolved = '';
    let hitRoot = false;
    const isPosix = separator === '/'; // go from right to left until we hit absolute path/root

    for (let i = paths.length - 1; i >= 0; i--) {
      const segment = paths[i];
      assertSegment(segment);

      if (segment.length === 0) {
        continue; // skip empty
      }

      resolved = segment + separator + resolved; // prepend new segment

      if (isAbsolute(isPosix, segment)) {
        // have we backed into an absolute path?
        hitRoot = true;
        break;
      }
    } // if we didn't hit root, prepend cwd


    if (!hitRoot) {
      resolved = (global.process ? process.cwd() : '/') + separator + resolved;
    }

    const normalized = normalize(separator, resolved);

    if (normalized.charAt(normalized.length - 1) === separator) {
      // FIXME: Handle UNC paths on Windows as well, so we don't trim trailing separator on something like '\\\\host-name\\resource\\'
      // Don't remove trailing separator if this is root path on windows!
      if (!isPosix && normalized.length === 3 && normalized.charAt(1) === ':' && isWindowsDeviceName(normalized.charCodeAt(0))) {
        return normalized;
      } // otherwise trim trailing separator


      return normalized.slice(0, normalized.length - 1);
    }

    return normalized;
  }
  /**
   * The `path.relative()` method returns the relative path `from` from to `to` based
   * on the current working directory. If from and to each resolve to the same
   * path (after calling `path.resolve()` on each), a zero-length string is returned.
   *
   * If a zero-length string is passed as `from` or `to`, the current working directory
   * will be used instead of the zero-length strings.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {string} from [description]
   * @param  {string} to   [description]
   * @return {string}      [description]
   */


  function relative(separator, from, to) {
    assertArgumentType(from, 'from', 'string');
    assertArgumentType(to, 'to', 'string');

    if (from === to) {
      return '';
    }

    from = resolve(separator, [from]);
    to = resolve(separator, [to]);

    if (from === to) {
      return '';
    } // we now have two absolute paths,
    // lets "go up" from `from` until we reach common base dir of `to`
    // const originalFrom = from;


    let upCount = 0;
    let remainingPath = '';

    while (true) {
      if (to.startsWith(from)) {
        // match! record rest...?
        remainingPath = to.slice(from.length);
        break;
      } // FIXME: Break/throw if we hit bad edge case of no common root!


      from = dirname(separator, from);
      upCount++;
    } // remove leading separator from remainingPath if there is any


    if (remainingPath.length > 0) {
      remainingPath = remainingPath.slice(1);
    }

    return ('..' + separator).repeat(upCount) + remainingPath;
  }
  /**
   * The `path.parse()` method returns an object whose properties represent
   * significant elements of the path. Trailing directory separators are ignored,
   * see `path.sep`.
   *
   * The returned object will have the following properties:
   *
   * - dir <string>
   * - root <string>
   * - base <string>
   * - name <string>
   * - ext <string>
   * @param  {string} separator platform-specific file separator
   * @param  {string} filepath [description]
   * @return {object}
   */


  function parse(separator, filepath) {
    assertArgumentType(filepath, 'path', 'string');
    const result = {
      root: '',
      dir: '',
      base: '',
      ext: '',
      name: '' };

    const length = filepath.length;

    if (length === 0) {
      return result;
    } // Cheat and just call our other methods for dirname/basename/extname?


    result.base = basename(separator, filepath);
    result.ext = extname(separator, result.base);
    const baseLength = result.base.length;
    result.name = result.base.slice(0, baseLength - result.ext.length);
    const toSubtract = baseLength === 0 ? 0 : baseLength + 1;
    result.dir = filepath.slice(0, filepath.length - toSubtract); // drop trailing separator!

    const firstCharCode = filepath.charCodeAt(0); // both win32 and POSIX return '/' root

    if (firstCharCode === FORWARD_SLASH) {
      result.root = '/';
      return result;
    } // we're done with POSIX...


    if (separator === '/') {
      return result;
    } // for win32...


    if (firstCharCode === BACKWARD_SLASH) {
      // FIXME: Handle UNC paths like '\\\\host-name\\resource\\file_path'
      // need to retain '\\\\host-name\\resource\\' as root in that case!
      result.root = '\\';
      return result;
    } // check for C: style root


    if (length > 1 && isWindowsDeviceName(firstCharCode) && filepath.charAt(1) === ':') {
      if (length > 2) {
        // is it like C:\\?
        const thirdCharCode = filepath.charCodeAt(2);

        if (thirdCharCode === FORWARD_SLASH || thirdCharCode === BACKWARD_SLASH) {
          result.root = filepath.slice(0, 3);
          return result;
        }
      } // nope, just C:, no trailing separator


      result.root = filepath.slice(0, 2);
    }

    return result;
  }
  /**
   * The `path.format()` method returns a path string from an object. This is the
   * opposite of `path.parse()`.
   *
   * @param  {string} separator platform-specific file separator
   * @param  {object} pathObject object of format returned by `path.parse()`
   * @param  {string} pathObject.dir directory name
   * @param  {string} pathObject.root file root dir, ignored if `pathObject.dir` is provided
   * @param  {string} pathObject.base file basename
   * @param  {string} pathObject.name basename minus extension, ignored if `pathObject.base` exists
   * @param  {string} pathObject.ext file extension, ignored if `pathObject.base` exists
   * @return {string}
   */


  function format(separator, pathObject) {
    assertArgumentType(pathObject, 'pathObject', 'object');
    const base = pathObject.base || `${pathObject.name || ''}${pathObject.ext || ''}`; // append base to root if `dir` wasn't specified, or if
    // dir is the root

    if (!pathObject.dir || pathObject.dir === pathObject.root) {
      return `${pathObject.root || ''}${base}`;
    } // combine dir + / + base


    return `${pathObject.dir}${separator}${base}`;
  }
  /**
   * On Windows systems only, returns an equivalent namespace-prefixed path for
   * the given path. If path is not a string, path will be returned without modifications.
   * See https://docs.microsoft.com/en-us/windows/desktop/FileIO/naming-a-file#namespaces
   * @param  {string} filepath [description]
   * @return {string}          [description]
   */


  function toNamespacedPath(filepath) {
    if (typeof filepath !== 'string') {
      return filepath;
    }

    if (filepath.length === 0) {
      return '';
    }

    const resolvedPath = resolve('\\', [filepath]);
    const length = resolvedPath.length;

    if (length < 2) {
      // need '\\\\' or 'C:' minimum
      return filepath;
    }

    const firstCharCode = resolvedPath.charCodeAt(0); // if start with '\\\\', prefix with UNC root, drop the slashes

    if (firstCharCode === BACKWARD_SLASH && resolvedPath.charAt(1) === '\\') {
      // return as-is if it's an aready long path ('\\\\?\\' or '\\\\.\\' prefix)
      if (length >= 3) {
        const thirdChar = resolvedPath.charAt(2);

        if (thirdChar === '?' || thirdChar === '.') {
          return filepath;
        }
      }

      return '\\\\?\\UNC\\' + resolvedPath.slice(2);
    } else if (isWindowsDeviceName(firstCharCode) && resolvedPath.charAt(1) === ':') {
      return '\\\\?\\' + resolvedPath;
    }

    return filepath;
  }

  const Win32Path = {
    sep: '\\',
    delimiter: ';',
    basename: function (filepath, ext) {
      return basename(this.sep, filepath, ext);
    },
    normalize: function (filepath) {
      return normalize(this.sep, filepath);
    },
    join: function (...paths) {
      return join(this.sep, paths);
    },
    extname: function (filepath) {
      return extname(this.sep, filepath);
    },
    dirname: function (filepath) {
      return dirname(this.sep, filepath);
    },
    isAbsolute: function (filepath) {
      return isAbsolute(false, filepath);
    },
    relative: function (from, to) {
      return relative(this.sep, from, to);
    },
    resolve: function (...paths) {
      return resolve(this.sep, paths);
    },
    parse: function (filepath) {
      return parse(this.sep, filepath);
    },
    format: function (pathObject) {
      return format(this.sep, pathObject);
    },
    toNamespacedPath: toNamespacedPath };

  const PosixPath = {
    sep: '/',
    delimiter: ':',
    basename: function (filepath, ext) {
      return basename(this.sep, filepath, ext);
    },
    normalize: function (filepath) {
      return normalize(this.sep, filepath);
    },
    join: function (...paths) {
      return join(this.sep, paths);
    },
    extname: function (filepath) {
      return extname(this.sep, filepath);
    },
    dirname: function (filepath) {
      return dirname(this.sep, filepath);
    },
    isAbsolute: function (filepath) {
      return isAbsolute(true, filepath);
    },
    relative: function (from, to) {
      return relative(this.sep, from, to);
    },
    resolve: function (...paths) {
      return resolve(this.sep, paths);
    },
    parse: function (filepath) {
      return parse(this.sep, filepath);
    },
    format: function (pathObject) {
      return format(this.sep, pathObject);
    },
    toNamespacedPath: function (filepath) {
      return filepath; // no-op
    } };

  const path = PosixPath;
  path.win32 = Win32Path;
  path.posix = PosixPath;

  /**
   * Appcelerator Titanium Mobile
   * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
   * Licensed under the terms of the Apache Public License
   * Please see the LICENSE included with this distribution for details.
   */

  /**
   * Generates a wrapped invoker function for a specific API
   * This lets us pass in context-specific data to a function
   * defined in an API namespace (i.e. on a module)
   *
   * We use this for create methods, and other APIs that take
   * a KrollInvocation object as their first argument in Java
   *
   * For example, an invoker for a "create" method might look
   * something like this:
   *
   *     function createView(sourceUrl, options) {
   *         var view = new View(options);
   *         view.sourceUrl = sourceUrl;
   *         return view;
   *     }
   *
   * And the corresponding invoker for app.js would look like:
   *
   *     UI.createView = function() {
   *         return createView("app://app.js", arguments[0]);
   *     }
   *
   * wrapperAPI: The scope specific API (module) wrapper
   * realAPI: The actual module implementation
   * apiName: The top level API name of the root module
   * invocationAPI: The actual API to generate an invoker for
   * scopeVars: A map that is passed into each invoker
   */

  /**
   * @param {object} wrapperAPI e.g. TitaniumWrapper
   * @param {object} realAPI e.g. Titanium
   * @param {string} apiName e.g. 'Titanium'
   * @param {object} invocationAPI details on the api we're wrapping
   * @param {string} invocationAPI.namespace the namespace of the proxy where method hangs (w/o 'Ti.' prefix) e.g. 'Filesystem' or 'UI.Android'
   * @param {string} invocationAPI.api the method name e.g. 'openFile' or 'createSearchView'
   * @param {object} scopeVars holder for context specific values (basically just wraps sourceUrl)
   * @param {string} scopeVars.sourceUrl source URL of js file entry point
   * @param {Module} [scopeVars.module] module
   */
  function genInvoker(wrapperAPI, realAPI, apiName, invocationAPI, scopeVars) {
    let apiNamespace = wrapperAPI;
    const namespace = invocationAPI.namespace;

    if (namespace !== apiName) {
      const names = namespace.split('.');

      for (const name of names) {
        let api; // Create a module wrapper only if it hasn't been wrapped already.

        if (Object.prototype.hasOwnProperty.call(apiNamespace, name)) {
          api = apiNamespace[name];
        } else {
          function SandboxAPI() {
            const proto = Object.getPrototypeOf(this);
            Object.defineProperty(this, '_events', {
              get: function () {
                return proto._events;
              },
              set: function (value) {
                proto._events = value;
              } });

          }

          SandboxAPI.prototype = apiNamespace[name];
          api = new SandboxAPI();
          apiNamespace[name] = api;
        }

        apiNamespace = api;
        realAPI = realAPI[name];
      }
    }

    let delegate = realAPI[invocationAPI.api]; // These invokers form a call hierarchy so we need to
    // provide a way back to the actual root Titanium / actual impl.

    while (delegate.__delegate__) {
      delegate = delegate.__delegate__;
    }

    apiNamespace[invocationAPI.api] = createInvoker(realAPI, delegate, scopeVars);
  }

  var genInvoker_1 = genInvoker;
  /**
   * Creates and returns a single invoker function that wraps
   * a delegate function, thisObj, and scopeVars
   * @param {object} thisObj The `this` object to use when invoking the `delegate` function
   * @param {function} delegate The function to wrap/delegate to under the hood
   * @param {object} scopeVars The scope variables to splice into the arguments when calling the delegate
   * @param {string} scopeVars.sourceUrl the only real relevent scope variable!
   * @return {function}
   */

  function createInvoker(thisObj, delegate, scopeVars) {
    const urlInvoker = function invoker(...args) {
      // eslint-disable-line func-style
      args.splice(0, 0, invoker.__scopeVars__);
      return delegate.apply(invoker.__thisObj__, args);
    };

    urlInvoker.__delegate__ = delegate;
    urlInvoker.__thisObj__ = thisObj;
    urlInvoker.__scopeVars__ = scopeVars;
    return urlInvoker;
  }

  var createInvoker_1 = createInvoker;
  var invoker = {
    genInvoker: genInvoker_1,
    createInvoker: createInvoker_1 };


  /**
   * Appcelerator Titanium Mobile
   * Copyright (c) 2011-Present by Appcelerator, Inc. All Rights Reserved.
   * Licensed under the terms of the Apache Public License
   * Please see the LICENSE included with this distribution for details.
   */

  function bootstrap$2(global, kroll) {
    const assets = kroll.binding('assets');
    const Script = kroll.binding('evals').Script;
    /**
     * The loaded index.json file from the app. Used to store the encrypted JS assets'
     * filenames/offsets.
     */

    let fileIndex; // FIXME: fix file name parity between platforms

    const INDEX_JSON = 'index.json';

    class Module {
      /**
       * [Module description]
       * @param {string} id      module id
       * @param {Module} parent  parent module
       */
      constructor(id, parent) {
        this.id = id;
        this.exports = {};
        this.parent = parent;
        this.filename = null;
        this.loaded = false;
        this.wrapperCache = {};
        this.isService = false; // toggled on if this module is the service entry point
      }
      /**
       * Attempts to load the module. If no file is found
       * with the provided name an exception will be thrown.
       * Once the contents of the file are read, it is run
       * in the current context. A sandbox is created by
       * executing the code inside a wrapper function.
       * This provides a speed boost vs creating a new context.
       *
       * @param  {String} filename [description]
       * @param  {String} source   [description]
       * @returns {void}
       */


      load(filename, source) {
        if (this.loaded) {
          throw new Error('Module already loaded.');
        }

        this.filename = filename;
        this.path = path.dirname(filename);
        this.paths = this.nodeModulesPaths(this.path);

        if (!source) {
          source = assets.readAsset(`Resources${filename}`);
        } // Stick it in the cache


        Module.cache[this.filename] = this;

        this._runScript(source, this.filename);

        this.loaded = true;
      }
      /**
       * Generates a context-specific module wrapper, and wraps
       * each invocation API in an external (3rd party) module
       * See invoker.js for more info
       * @param  {object} externalModule native module proxy
       * @param  {string} sourceUrl      the current js file url
       * @return {object}                wrapper around the externalModule
       */


      createModuleWrapper(externalModule, sourceUrl) {
        // The module wrapper forwards on using the original as a prototype
        function ModuleWrapper() {}

        ModuleWrapper.prototype = externalModule;
        const wrapper = new ModuleWrapper();

        {
          // Android-specific portion!
          // Here we take the APIs defined in the bootstrap.js
          // and effectively lazily hook them
          // We explicitly guard the code so iOS doesn't even use/include the referenced invoker.js import
          const invocationAPIs = externalModule.invocationAPIs || [];

          for (const api of invocationAPIs) {
            const delegate = externalModule[api];

            if (!delegate) {
              continue;
            }

            wrapper[api] = invoker.createInvoker(externalModule, delegate, new kroll.ScopeVars({
              sourceUrl }));

          }
        }

        wrapper.addEventListener = function (...args) {
          externalModule.addEventListener.apply(externalModule, args);
        };

        wrapper.removeEventListener = function (...args) {
          externalModule.removeEventListener.apply(externalModule, args);
        };

        wrapper.fireEvent = function (...args) {
          externalModule.fireEvent.apply(externalModule, args);
        };

        return wrapper;
      }
      /**
       * Takes a CommonJS module and uses it to extend an existing external/native module. The exports are added to the external module.
       * @param  {Object} externalModule The external/native module we're extending
       * @param  {String} id             module id
       */


      extendModuleWithCommonJs(externalModule, id) {
        if (!kroll.isExternalCommonJsModule(id)) {
          return;
        } // Load under fake name, or the commonjs side of the native module gets cached in place of the native module!
        // See TIMOB-24932


        const fakeId = `${id}.commonjs`;
        const jsModule = new Module(fakeId, this);
        jsModule.load(fakeId, kroll.getExternalCommonJsModule(id));

        if (jsModule.exports) {
          console.trace(`Extending native module '${id}' with the CommonJS module that was packaged with it.`);
          kroll.extend(externalModule, jsModule.exports);
        }
      }
      /**
       * Loads a native / external (3rd party) module
       * @param  {String} id              module id
       * @param  {object} externalBinding external binding object
       * @return {Object}                 The exported module
       */


      loadExternalModule(id, externalBinding) {
        // try to get the cached module...
        let externalModule = Module.cache[id];

        if (!externalModule) {
          // iOS and Android differ quite a bit here.
          // With ios, we should already have the native module loaded
          // There's no special "bootstrap.js" file packaged within it
          // On Android, we load a bootstrap.js bundled with the module
          {
            // This is the process for Android, first grab the bootstrap source
            const source = externalBinding.bootstrap; // Load the native module's bootstrap JS

            const module = new Module(id, this);
            module.load(`${id}/bootstrap.js`, source); // Bootstrap and load the module using the native bindings

            const result = module.exports.bootstrap(externalBinding); // Cache the external module instance after it's been modified by it's bootstrap script

            externalModule = result;
          }
        }

        if (!externalModule) {
          console.trace(`Unable to load external module: ${id}`);
          return null;
        } // cache the loaded native module (before we extend it)


        Module.cache[id] = externalModule; // We cache each context-specific module wrapper
        // on the parent module, rather than in the Module.cache

        let wrapper = this.wrapperCache[id];

        if (wrapper) {
          return wrapper;
        }

        const sourceUrl = `app://${this.filename}`; // FIXME: If this.filename starts with '/', we need to drop it, I think?

        wrapper = this.createModuleWrapper(externalModule, sourceUrl); // Then we "extend" the API/module using any shipped JS code (assets/<module.id>.js)

        this.extendModuleWithCommonJs(wrapper, id);
        this.wrapperCache[id] = wrapper;
        return wrapper;
      } // See https://nodejs.org/api/modules.html#modules_all_together

      /**
       * Require another module as a child of this module.
       * This parent module's path is used as the base for relative paths
       * when loading the child. Returns the exports object
       * of the child module.
       *
       * @param  {String} request  The path to the requested module
       * @return {Object}          The loaded module
       */


      require(request) {
        // 2. If X begins with './' or '/' or '../'
        const start = request.substring(0, 2); // hack up the start of the string to check relative/absolute/"naked" module id

        if (start === './' || start === '..') {
          const loaded = this.loadAsFileOrDirectory(path.normalize(this.path + '/' + request));

          if (loaded) {
            return loaded.exports;
          } // Root/absolute path (internally when reading the file, we prepend "Resources/" as root dir)

        } else if (request.substring(0, 1) === '/') {
          const loaded = this.loadAsFileOrDirectory(path.normalize(request));

          if (loaded) {
            return loaded.exports;
          }
        } else {
          // Despite being step 1 in Node.JS psuedo-code, we moved it down here because we don't allow native modules
          // to start with './', '..' or '/' - so this avoids a lot of misses on requires starting that way
          // 1. If X is a core module,
          let loaded = this.loadCoreModule(request);

          if (loaded) {
            // a. return the core module
            // b. STOP
            return loaded;
          } // Look for CommonJS module


          if (request.indexOf('/') === -1) {
            // For CommonJS we need to look for module.id/module.id.js first...
            const filename = `/${request}/${request}.js`; // Only look for this _exact file_. DO NOT APPEND .js or .json to it!

            if (this.filenameExists(filename)) {
              loaded = this.loadJavascriptText(filename);

              if (loaded) {
                return loaded.exports;
              }
            } // Then try module.id as directory


            loaded = this.loadAsDirectory(`/${request}`);

            if (loaded) {
              return loaded.exports;
            }
          } // Allow looking through node_modules
          // 3. LOAD_NODE_MODULES(X, dirname(Y))


          loaded = this.loadNodeModules(request, this.paths);

          if (loaded) {
            return loaded.exports;
          } // Fallback to old Titanium behavior of assuming it's actually an absolute path
          // We'd like to warn users about legacy style require syntax so they can update, but the new syntax is not backwards compatible.
          // So for now, let's just be quite about it. In future versions of the SDK (7.0?) we should warn (once 5.x is end of life so backwards compat is not necessary)
          // eslint-disable-next-line max-len
          // console.warn(`require called with un-prefixed module id: ${request}, should be a core or CommonJS module. Falling back to old Ti behavior and assuming it's an absolute path: /${request}`);


          loaded = this.loadAsFileOrDirectory(path.normalize(`/${request}`));

          if (loaded) {
            return loaded.exports;
          }
        } // 4. THROW "not found"


        throw new Error(`Requested module not found: ${request}`); // TODO Set 'code' property to 'MODULE_NOT_FOUND' to match Node?
      }
      /**
       * Loads the core module if it exists. If not, returns null.
       *
       * @param  {String}  id The request module id
       * @return {Object}    true if the module id matches a native or CommonJS module id, (or it's first path segment does).
       */


      loadCoreModule(id) {
        // skip bad ids, relative ids, absolute ids. "native"/"core" modules should be of form "module.id" or "module.id/sub.file.js"
        if (!id || id.startsWith('.') || id.startsWith('/')) {
          return null;
        } // check if we have a cached copy of the wrapper


        if (this.wrapperCache[id]) {
          return this.wrapperCache[id];
        }

        const parts = id.split('/');
        const externalBinding = kroll.externalBinding(parts[0]);

        if (externalBinding) {
          if (parts.length === 1) {
            // This is the "root" of an external module. It can look like:
            // request("com.example.mymodule")
            // We can load and return it right away (caching occurs in the called function).
            return this.loadExternalModule(parts[0], externalBinding);
          } // Could be a sub-module (CommonJS) of an external native module.
          // We allow that since TIMOB-9730.


          if (kroll.isExternalCommonJsModule(parts[0])) {
            const externalCommonJsContents = kroll.getExternalCommonJsModule(id);

            if (externalCommonJsContents) {
              // found it
              // FIXME Re-use loadAsJavaScriptText?
              const module = new Module(id, this);
              module.load(id, externalCommonJsContents);
              return module.exports;
            }
          }
        }

        return null; // failed to load
      }
      /**
       * Attempts to load a node module by id from the starting path
       * @param  {string} moduleId       The path of the module to load.
       * @param  {string[]} dirs       paths to search
       * @return {Module|null}      The module, if loaded. null if not.
       */


      loadNodeModules(moduleId, dirs) {
        // 2. for each DIR in DIRS:
        for (const dir of dirs) {
          // a. LOAD_AS_FILE(DIR/X)
          // b. LOAD_AS_DIRECTORY(DIR/X)
          const mod = this.loadAsFileOrDirectory(path.join(dir, moduleId));

          if (mod) {
            return mod;
          }
        }

        return null;
      }
      /**
       * Determine the set of paths to search for node_modules
       * @param  {string} startDir       The starting directory
       * @return {string[]}              The array of paths to search
       */


      nodeModulesPaths(startDir) {
        // Make sure we have an absolute path to start with
        startDir = path.resolve(startDir); // Return early if we are at root, this avoids doing a pointless loop
        // and also returning an array with duplicate entries
        // e.g. ["/node_modules", "/node_modules"]

        if (startDir === '/') {
          return ['/node_modules'];
        } // 1. let PARTS = path split(START)


        const parts = startDir.split('/'); // 2. let I = count of PARTS - 1

        let i = parts.length - 1; // 3. let DIRS = []

        const dirs = []; // 4. while I >= 0,

        while (i >= 0) {
          // a. if PARTS[I] = "node_modules" CONTINUE
          if (parts[i] === 'node_modules' || parts[i] === '') {
            i -= 1;
            continue;
          } // b. DIR = path join(PARTS[0 .. I] + "node_modules")


          const dir = path.join(parts.slice(0, i + 1).join('/'), 'node_modules'); // c. DIRS = DIRS + DIR

          dirs.push(dir); // d. let I = I - 1

          i -= 1;
        } // Always add /node_modules to the search path


        dirs.push('/node_modules');
        return dirs;
      }
      /**
       * Attempts to load a given path as a file or directory.
       * @param  {string} normalizedPath The path of the module to load.
       * @return {Module|null} The loaded module. null if unable to load.
       */


      loadAsFileOrDirectory(normalizedPath) {
        // a. LOAD_AS_FILE(Y + X)
        let loaded = this.loadAsFile(normalizedPath);

        if (loaded) {
          return loaded;
        } // b. LOAD_AS_DIRECTORY(Y + X)


        loaded = this.loadAsDirectory(normalizedPath);

        if (loaded) {
          return loaded;
        }

        return null;
      }
      /**
       * Loads a given file as a Javascript file, returning the module.exports.
       * @param  {string} filename File we're attempting to load
       * @return {Module} the loaded module
       */


      loadJavascriptText(filename) {
        // Look in the cache!
        if (Module.cache[filename]) {
          return Module.cache[filename];
        }

        const module = new Module(filename, this);
        module.load(filename);
        return module;
      }
      /**
       * Loads a JSON file by reading it's contents, doing a JSON.parse and returning the parsed object.
       *
       * @param  {String} filename File we're attempting to load
       * @return {Module} The loaded module instance
       */


      loadJavascriptObject(filename) {
        // Look in the cache!
        if (Module.cache[filename]) {
          return Module.cache[filename];
        }

        const module = new Module(filename, this);
        module.filename = filename;
        module.path = path.dirname(filename);
        const source = assets.readAsset(`Resources${filename}`); // Stick it in the cache

        Module.cache[filename] = module;
        module.exports = JSON.parse(source);
        module.loaded = true;
        return module;
      }
      /**
       * Attempts to load a file by it's full filename according to NodeJS rules.
       *
       * @param  {string} id The filename
       * @return {Module|null} Module instance if loaded, null if not found.
       */


      loadAsFile(id) {
        // 1. If X is a file, load X as JavaScript text.  STOP
        let filename = id;

        if (this.filenameExists(filename)) {
          // If the file has a .json extension, load as JavascriptObject
          if (filename.length > 5 && filename.slice(-4) === 'json') {
            return this.loadJavascriptObject(filename);
          }

          return this.loadJavascriptText(filename);
        } // 2. If X.js is a file, load X.js as JavaScript text.  STOP


        filename = id + '.js';

        if (this.filenameExists(filename)) {
          return this.loadJavascriptText(filename);
        } // 3. If X.json is a file, parse X.json to a JavaScript Object.  STOP


        filename = id + '.json';

        if (this.filenameExists(filename)) {
          return this.loadJavascriptObject(filename);
        } // failed to load anything!


        return null;
      }
      /**
       * Attempts to load a directory according to NodeJS rules.
       *
       * @param  {string} id The directory name
       * @return {Module|null} Loaded module, null if not found.
       */


      loadAsDirectory(id) {
        // 1. If X/package.json is a file,
        let filename = path.resolve(id, 'package.json');

        if (this.filenameExists(filename)) {
          // a. Parse X/package.json, and look for "main" field.
          const object = this.loadJavascriptObject(filename);

          if (object && object.exports && object.exports.main) {
            // b. let M = X + (json main field)
            const m = path.resolve(id, object.exports.main); // c. LOAD_AS_FILE(M)

            return this.loadAsFileOrDirectory(m);
          }
        } // 2. If X/index.js is a file, load X/index.js as JavaScript text.  STOP


        filename = path.resolve(id, 'index.js');

        if (this.filenameExists(filename)) {
          return this.loadJavascriptText(filename);
        } // 3. If X/index.json is a file, parse X/index.json to a JavaScript object. STOP


        filename = path.resolve(id, 'index.json');

        if (this.filenameExists(filename)) {
          return this.loadJavascriptObject(filename);
        }

        return null;
      }
      /**
       * Setup a sandbox and run the module's script inside it.
       * Returns the result of the executed script.
       * @param  {String} source   [description]
       * @param  {String} filename [description]
       * @return {*}          [description]
       */


      _runScript(source, filename) {
        const self = this;

        function require(path) {
          return self.require(path);
        }

        require.main = Module.main; // This "first time" run is really only for app.js, AFAICT, and needs
        // an activity. If app was restarted for Service only, we don't want
        // to go this route. So added currentActivity check. (bill)

        if (self.id === '.' && !this.isService) {
          global.require = require; // check if we have an inspector binding...

          const inspector = kroll.binding('inspector');

          if (inspector) {
            // If debugger is enabled, load app.js and pause right before we execute it
            const inspectorWrapper = inspector.callAndPauseOnStart;

            if (inspectorWrapper) {
              // FIXME Why can't we do normal Module.wrap(source) here?
              // I get "Uncaught TypeError: Cannot read property 'createTabGroup' of undefined" for "Ti.UI.createTabGroup();"
              // Not sure why app.js is special case and can't be run under normal self-invoking wrapping function that gets passed in global/kroll/Ti/etc
              // Instead, let's use a slightly modified version of callAndPauseOnStart:
              // It will compile the source as-is, schedule a pause and then run the source.
              return inspectorWrapper(source, filename);
            }
          } // run app.js "normally" (i.e. not under debugger/inspector)


          return Script.runInThisContext(source, filename, true);
        } // In V8, we treat external modules the same as native modules.  First, we wrap the
        // module code and then run it in the current context.  This will allow external modules to
        // access globals as mentioned in TIMOB-11752. This will also help resolve startup slowness that
        // occurs as a result of creating a new context during startup in TIMOB-12286.


        source = Module.wrap(source);
        const f = Script.runInThisContext(source, filename, true);
        return f(this.exports, require, this, filename, path.dirname(filename), Titanium, Ti, global, kroll);
      }
      /**
       * Look up a filename in the app's index.json file
       * @param  {String} filename the file we're looking for
       * @return {Boolean}         true if the filename exists in the index.json
       */


      filenameExists(filename) {
        filename = 'Resources' + filename; // When we actually look for files, assume "Resources/" is the root

        if (!fileIndex) {
          const json = assets.readAsset(INDEX_JSON);
          fileIndex = JSON.parse(json);
        }

        return fileIndex && filename in fileIndex;
      }}



    Module.cache = [];
    Module.main = null;
    Module.wrapper = ['(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {', '\n});'];

    Module.wrap = function (script) {
      return Module.wrapper[0] + script + Module.wrapper[1];
    };
    /**
     * [runModule description]
     * @param  {String} source            JS Source code
     * @param  {String} filename          Filename of the module
     * @param  {Titanium.Service|null|Titanium.Android.Activity} activityOrService [description]
     * @return {Module}                   The loaded Module
     */


    Module.runModule = function (source, filename, activityOrService) {
      let id = filename;

      if (!Module.main) {
        id = '.';
      }

      const module = new Module(id, null); // FIXME: I don't know why instanceof for Titanium.Service works here!
      // On Android, it's an apiname of Ti.Android.Service
      // On iOS, we don't yet pass in the value, but we do set Ti.App.currentService property beforehand!
      // Can we remove the preload stuff in KrollBridge.m to pass along the service instance into this like we do on Andorid?

      module.isService = activityOrService instanceof Titanium.Service;

      {
        if (module.isService) {
          Object.defineProperty(Ti.Android, 'currentService', {
            value: activityOrService,
            writable: false,
            configurable: true });

        } else {
          Object.defineProperty(Ti.Android, 'currentService', {
            value: null,
            writable: false,
            configurable: true });

        }
      }

      if (!Module.main) {
        Module.main = module;
      }

      filename = filename.replace('Resources/', '/'); // normalize back to absolute paths (which really are relative to Resources under the hood)

      module.load(filename, source);

      {
        Object.defineProperty(Ti.Android, 'currentService', {
          value: null,
          writable: false,
          configurable: true });

      }

      return module;
    };

    return Module;
  }

  /**
   * This hangs the Proxy type off Ti namespace. It also generates a hidden _properties object
   * that is used to store property values on the JS side for java Proxies.
   * Basically these get/set methods are fallbacks for when a Java proxy doesn't have a native method to handle getting/setting the property.
   * (see Proxy.h/ProxyBindingV8.cpp.fm for more info)
   * @param {object} tiBinding the underlying 'Titanium' native binding (see KrollBindings::initTitanium)
   * @param {object} Ti the global.Titanium object
   */
  function ProxyBootstrap(tiBinding, Ti) {
    const Proxy = tiBinding.Proxy;
    Ti.Proxy = Proxy;

    Proxy.defineProperties = function (proxyPrototype, names) {
      const properties = {};
      const len = names.length;

      for (let i = 0; i < len; ++i) {
        const name = names[i];
        properties[name] = {
          get: function () {
            // eslint-disable-line no-loop-func
            return this.getProperty(name);
          },
          set: function (value) {
            // eslint-disable-line no-loop-func
            this.setPropertyAndFire(name, value);
          },
          enumerable: true };

      }

      Object.defineProperties(proxyPrototype, properties);
    };

    Object.defineProperty(Proxy.prototype, 'getProperty', {
      value: function (property) {
        return this._properties[property];
      },
      enumerable: false });

    Object.defineProperty(Proxy.prototype, 'setProperty', {
      value: function (property, value) {
        return this._properties[property] = value;
      },
      enumerable: false });

    Object.defineProperty(Proxy.prototype, 'setPropertiesAndFire', {
      value: function (properties) {
        const ownNames = Object.getOwnPropertyNames(properties);
        const len = ownNames.length;
        const changes = [];

        for (let i = 0; i < len; ++i) {
          const property = ownNames[i];
          const value = properties[property];

          if (!property) {
            continue;
          }

          const oldValue = this._properties[property];
          this._properties[property] = value;

          if (value !== oldValue) {
            changes.push([property, oldValue, value]);
          }
        }

        if (changes.length > 0) {
          this.onPropertiesChanged(changes);
        }
      },
      enumerable: false });

  }

  /* globals OS_ANDROID,OS_IOS */
  function bootstrap$1(global, kroll) {
    {
      const tiBinding = kroll.binding('Titanium');
      const Ti = tiBinding.Titanium;

      const bootstrap = kroll.NativeModule.require('bootstrap'); // The bootstrap defines lazy namespace property tree **and**
      // sets up special APIs that get wrapped to pass along sourceUrl via a KrollInvocation object


      bootstrap.bootstrap(Ti);
      bootstrap.defineLazyBinding(Ti, 'API'); // Basically does the same thing iOS does for API module (lazy property getter)
      // Here, we go through all the specially marked APIs to generate the wrappers to pass in the sourceUrl
      // TODO: This is all insane, and we should just bake it into the Proxy conversion stuff to grab and pass along sourceUrl
      // Rather than carry it all over the place like this!
      // We already need to generate a KrollInvocation object to wrap the sourceUrl!

      function TitaniumWrapper(context) {
        const sourceUrl = this.sourceUrl = context.sourceUrl;
        const scopeVars = new kroll.ScopeVars({
          sourceUrl });

        Ti.bindInvocationAPIs(this, scopeVars);
      }

      TitaniumWrapper.prototype = Ti;
      Ti.Wrapper = TitaniumWrapper; // -----------------------------------------------------------------------
      // This loops through all known APIs that require an
      // Invocation object and wraps them so we can pass a
      // source URL as the first argument

      Ti.bindInvocationAPIs = function (wrapperTi, scopeVars) {
        for (const api of Ti.invocationAPIs) {
          // separate each invoker into it's own private scope
          invoker.genInvoker(wrapperTi, Ti, 'Titanium', api, scopeVars);
        }
      };

      ProxyBootstrap(tiBinding, Ti);
      return new TitaniumWrapper({
        // Even though the entry point is really ti://kroll.js, that will break resolution of urls under the covers!
        // So basically just assume app.js as the relative file base
        sourceUrl: 'app://app.js' });

    }
  }

  // Copyright Joyent, Inc. and other Node contributors.
  // Permission is hereby granted, free of charge, to any person obtaining a
  // copy of this software and associated documentation files (the
  // "Software"), to deal in the Software without restriction, including
  // without limitation the rights to use, copy, modify, merge, publish,
  // distribute, sublicense, and/or sell copies of the Software, and to permit
  // persons to whom the Software is furnished to do so, subject to the
  // following conditions:
  // The above copyright notice and this permission notice shall be included
  // in all copies or substantial portions of the Software.
  // THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
  // OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  // MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
  // NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
  // DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
  // OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
  // USE OR OTHER DEALINGS IN THE SOFTWARE.
  // Modifications Copyright 2011-Present Appcelerator, Inc.
  function EventEmitterBootstrap(global, kroll) {
    const TAG = 'EventEmitter';
    const EventEmitter = kroll.EventEmitter;
    const isArray = Array.isArray; // By default EventEmitters will print a warning if more than
    // 10 listeners are added to it. This is a useful default which
    // helps finding memory leaks.

    Object.defineProperty(EventEmitter.prototype, 'callHandler', {
      value: function (handler, type, data) {
        // kroll.log(TAG, "calling event handler: type:" + type + ", data: " + data + ", handler: " + handler);
        var handled = false,
        cancelBubble = data.cancelBubble,
        event;

        if (handler.listener && handler.listener.call) {
          // Create event object, copy any custom event data, and set the "type" and "source" properties.
          event = {
            type: type,
            source: this };

          kroll.extend(event, data);

          if (handler.self && event.source == handler.self.view) {
            // eslint-disable-line eqeqeq
            event.source = handler.self;
          }

          handler.listener.call(this, event); // The "cancelBubble" property may be reset in the handler.

          if (event.cancelBubble !== cancelBubble) {
            cancelBubble = event.cancelBubble;
          }

          handled = true;
        } else if (kroll.DBG) {
          kroll.log(TAG, 'handler for event \'' + type + '\' is ' + typeof handler.listener + ' and cannot be called.');
        } // Bubble the events to the parent view if needed.


        if (data.bubbles && !cancelBubble) {
          handled = this._fireSyncEventToParent(type, data) || handled;
        }

        return handled;
      },
      enumerable: false });

    Object.defineProperty(EventEmitter.prototype, 'emit', {
      value: function (type) {
        var handled = false,
        data = arguments[1],
        handler,
        listeners; // Set the "bubbles" and "cancelBubble" properties for event data.

        if (data !== null && typeof data === 'object') {
          data.bubbles = !!data.bubbles;
          data.cancelBubble = !!data.cancelBubble;
        } else {
          data = {
            bubbles: false,
            cancelBubble: false };

        }

        if (this._hasJavaListener) {
          this._onEventFired(type, data);
        }

        if (!this._events || !this._events[type] || !this.callHandler) {
          if (data.bubbles && !data.cancelBubble) {
            handled = this._fireSyncEventToParent(type, data);
          }

          return handled;
        }

        handler = this._events[type];

        if (typeof handler.listener === 'function') {
          handled = this.callHandler(handler, type, data);
        } else if (isArray(handler)) {
          listeners = handler.slice();

          for (var i = 0, l = listeners.length; i < l; i++) {
            handled = this.callHandler(listeners[i], type, data) || handled;
          }
        } else if (data.bubbles && !data.cancelBubble) {
          handled = this._fireSyncEventToParent(type, data);
        }

        return handled;
      },
      enumerable: false });
    // Titanium compatibility

    Object.defineProperty(EventEmitter.prototype, 'fireEvent', {
      value: EventEmitter.prototype.emit,
      enumerable: false,
      writable: true });

    Object.defineProperty(EventEmitter.prototype, 'fireSyncEvent', {
      value: EventEmitter.prototype.emit,
      enumerable: false });
    // EventEmitter is defined in src/node_events.cc
    // EventEmitter.prototype.emit() is also defined there.

    Object.defineProperty(EventEmitter.prototype, 'addListener', {
      value: function (type, listener, view) {
        if (typeof listener !== 'function') {
          throw new Error('addListener only takes instances of Function. The listener for event "' + type + '" is "' + typeof listener + '"');
        }

        if (!this._events) {
          this._events = {};
        }

        var id; // Setup ID first so we can pass count in to "listenerAdded"

        if (!this._events[type]) {
          id = 0;
        } else if (isArray(this._events[type])) {
          id = this._events[type].length;
        } else {
          id = 1;
        }

        var listenerWrapper = {};
        listenerWrapper.listener = listener;
        listenerWrapper.self = view;

        if (!this._events[type]) {
          // Optimize the case of one listener. Don't need the extra array object.
          this._events[type] = listenerWrapper;
        } else if (isArray(this._events[type])) {
          // If we've already got an array, just append.
          this._events[type].push(listenerWrapper);
        } else {
          // Adding the second element, need to change to array.
          this._events[type] = [this._events[type], listenerWrapper];
        } // Notify the Java proxy if this is the first listener added.


        if (id === 0) {
          this._hasListenersForEventType(type, true);
        }

        return id;
      },
      enumerable: false });
    // The JavaObject prototype will provide a version of this
    // that delegates back to the Java proxy. Non-Java versions
    // of EventEmitter don't care, so this no op is called instead.

    Object.defineProperty(EventEmitter.prototype, '_listenerForEvent', {
      value: function () {},
      enumerable: false });

    Object.defineProperty(EventEmitter.prototype, 'on', {
      value: EventEmitter.prototype.addListener,
      enumerable: false });
    // Titanium compatibility

    Object.defineProperty(EventEmitter.prototype, 'addEventListener', {
      value: EventEmitter.prototype.addListener,
      enumerable: false,
      writable: true });

    Object.defineProperty(EventEmitter.prototype, 'once', {
      value: function (type, listener) {
        var self = this;

        function g() {
          self.removeListener(type, g);
          listener.apply(this, arguments);
        }

        g.listener = listener;
        self.on(type, g);
        return this;
      },
      enumerable: false });

    Object.defineProperty(EventEmitter.prototype, 'removeListener', {
      value: function (type, listener) {
        if (typeof listener !== 'function') {
          throw new Error('removeListener only takes instances of Function');
        } // does not use listeners(), so no side effect of creating _events[type]


        if (!this._events || !this._events[type]) {
          return this;
        }

        var list = this._events[type];
        var count = 0;

        if (isArray(list)) {
          var position = -1; // Also support listener indexes / ids

          if (typeof listener === 'number') {
            position = listener;

            if (position > list.length || position < 0) {
              return this;
            }
          } else {
            for (var i = 0, length = list.length; i < length; i++) {
              if (list[i].listener === listener) {
                position = i;
                break;
              }
            }
          }

          if (position < 0) {
            return this;
          }

          list.splice(position, 1);

          if (list.length === 0) {
            delete this._events[type];
          }

          count = list.length;
        } else if (list.listener === listener || listener == 0) {
          // eslint-disable-line eqeqeq
          delete this._events[type];
        } else {
          return this;
        }

        if (count === 0) {
          this._hasListenersForEventType(type, false);
        }

        return this;
      },
      enumerable: false });

    Object.defineProperty(EventEmitter.prototype, 'removeEventListener', {
      value: EventEmitter.prototype.removeListener,
      enumerable: false,
      writable: true });

    Object.defineProperty(EventEmitter.prototype, 'removeAllListeners', {
      value: function (type) {
        // does not use listeners(), so no side effect of creating _events[type]
        if (type && this._events && this._events[type]) {
          this._events[type] = null;

          this._hasListenersForEventType(type, false);
        }

        return this;
      },
      enumerable: false });

    Object.defineProperty(EventEmitter.prototype, 'listeners', {
      value: function (type) {
        if (!this._events) {
          this._events = {};
        }

        if (!this._events[type]) {
          this._events[type] = [];
        }

        if (!isArray(this._events[type])) {
          this._events[type] = [this._events[type]];
        }

        return this._events[type];
      },
      enumerable: false });

    return EventEmitter;
  }

  /**
   * This is used by Android to require "baked-in" source.
   * SDK and module builds will bake in the raw source as c strings, and this will wrap
   * loading that code in via kroll.NativeModule.require(<id>)
   * For more information, see the bootstrap.js.ejs template.
   */
  function NativeModuleBootstrap(global, kroll) {
    const Script = kroll.binding('evals').Script;
    const runInThisContext = Script.runInThisContext;

    function NativeModule(id) {
      this.filename = id + '.js';
      this.id = id;
      this.exports = {};
      this.loaded = false;
    }
    /**
     * This should be an object with string keys (baked in module ids) -> string values (source of the baked in js code)
     */


    NativeModule._source = kroll.binding('natives');
    NativeModule._cache = {};

    NativeModule.require = function (id) {
      if (id === 'native_module') {
        return NativeModule;
      }

      if (id === 'invoker') {
        return invoker; // Android native modules use a bootstrap.js file that assumes there's a builtin 'invoker'
      }

      const cached = NativeModule.getCached(id);

      if (cached) {
        return cached.exports;
      }

      if (!NativeModule.exists(id)) {
        throw new Error('No such native module ' + id);
      }

      const nativeModule = new NativeModule(id);
      nativeModule.compile();
      nativeModule.cache();
      return nativeModule.exports;
    };

    NativeModule.getCached = function (id) {
      return NativeModule._cache[id];
    };

    NativeModule.exists = function (id) {
      return id in NativeModule._source;
    };

    NativeModule.getSource = function (id) {
      return NativeModule._source[id];
    };

    NativeModule.wrap = function (script) {
      return NativeModule.wrapper[0] + script + NativeModule.wrapper[1];
    };

    NativeModule.wrapper = ['(function (exports, require, module, __filename, __dirname, Titanium, Ti, global, kroll) {', '\n});'];

    NativeModule.prototype.compile = function () {
      let source = NativeModule.getSource(this.id);
      source = NativeModule.wrap(source); // All native modules have their filename prefixed with ti:/

      const filename = `ti:/${this.filename}`;
      const fn = runInThisContext(source, filename, true);
      fn(this.exports, NativeModule.require, this, this.filename, null, global.Ti, global.Ti, global, kroll);
      this.loaded = true;
    };

    NativeModule.prototype.cache = function () {
      NativeModule._cache[this.id] = this;
    };

    return NativeModule;
  }

  // This is the file each platform loads on boot *before* we launch ti.main.js to insert all our shims/extensions
  /**
   * main bootstrapping function
   * @param {object} global the global object
   * @param {object} kroll; the kroll module/binding
   * @return {void}       [description]
   */

  function bootstrap(global, kroll) {
    // Works identical to Object.hasOwnProperty, except
    // also works if the given object does not have the method
    // on its prototype or it has been masked.
    function hasOwnProperty(object, property) {
      return Object.hasOwnProperty.call(object, property);
    }

    kroll.extend = function (thisObject, otherObject) {
      if (!otherObject) {
        // extend with what?!  denied!
        return;
      }

      for (var name in otherObject) {
        if (hasOwnProperty(otherObject, name)) {
          thisObject[name] = otherObject[name];
        }
      }

      return thisObject;
    };
    /**
     * This is used to shuttle the sourceUrl around to APIs that may need to
     * resolve relative paths based on the invoking file.
     * (see KrollInvocation.java for more)
     * @param {object} vars key/value pairs to store
     * @param {string} vars.sourceUrl the source URL of the file calling the API
     * @constructor
     * @returns {ScopeVars}
     */


    function ScopeVars(vars) {
      if (!vars) {
        return this;
      }

      const keys = Object.keys(vars);
      const length = keys.length;

      for (var i = 0; i < length; ++i) {
        const key = keys[i];
        this[key] = vars[key];
      }
    }

    function startup() {
      global.global = global; // hang the global object off itself

      global.kroll = kroll; // hang our special under the hood kroll object off the global

      {
        kroll.ScopeVars = ScopeVars; // external module bootstrap.js expects to call kroll.NativeModule.require directly to load in their own source
        // and to refer to the baked in "bootstrap.js" for the SDK and "invoker.js" to hang lazy APIs/wrap api calls to pass in scope vars

        kroll.NativeModule = NativeModuleBootstrap(global, kroll); // Android uses it's own EventEmitter impl, and it's baked right into the proxy class chain
        // It assumes it can call back into java proxies to alert when listeners are added/removed
        // FIXME: Get it to use the events.js impl in the node extension, and get iOS to bake that into it's proxies as well!

        EventEmitterBootstrap(global, kroll);
      }

      global.Ti = global.Titanium = bootstrap$1(global, kroll);
      global.Module = bootstrap$2(global, kroll);
    }

    startup();
  }

  return bootstrap;

})();
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInRpLmtlcm5lbC5qcyJdLCJuYW1lcyI6WyJhc3NlcnRBcmd1bWVudFR5cGUiLCJhcmciLCJuYW1lIiwidHlwZW5hbWUiLCJ0eXBlIiwidG9Mb3dlckNhc2UiLCJUeXBlRXJyb3IiLCJGT1JXQVJEX1NMQVNIIiwiQkFDS1dBUkRfU0xBU0giLCJpc1dpbmRvd3NEZXZpY2VOYW1lIiwiY2hhckNvZGUiLCJpc0Fic29sdXRlIiwiaXNQb3NpeCIsImZpbGVwYXRoIiwibGVuZ3RoIiwiZmlyc3RDaGFyIiwiY2hhckNvZGVBdCIsImNoYXJBdCIsInRoaXJkQ2hhciIsImRpcm5hbWUiLCJzZXBhcmF0b3IiLCJmcm9tSW5kZXgiLCJoYWRUcmFpbGluZyIsImVuZHNXaXRoIiwiZm91bmRJbmRleCIsImxhc3RJbmRleE9mIiwic2xpY2UiLCJleHRuYW1lIiwiaW5kZXgiLCJlbmRJbmRleCIsImxhc3RJbmRleFdpbjMyU2VwYXJhdG9yIiwiaSIsImNoYXIiLCJiYXNlbmFtZSIsImV4dCIsInVuZGVmaW5lZCIsImxhc3RDaGFyQ29kZSIsImxhc3RJbmRleCIsImJhc2UiLCJub3JtYWxpemUiLCJpc1dpbmRvd3MiLCJyZXBsYWNlIiwiaGFkTGVhZGluZyIsInN0YXJ0c1dpdGgiLCJpc1VOQyIsInBhcnRzIiwic3BsaXQiLCJyZXN1bHQiLCJzZWdtZW50IiwicG9wIiwicHVzaCIsIm5vcm1hbGl6ZWQiLCJqb2luIiwiYXNzZXJ0U2VnbWVudCIsInBhdGhzIiwicmVzb2x2ZSIsInJlc29sdmVkIiwiaGl0Um9vdCIsImdsb2JhbCIsInByb2Nlc3MiLCJjd2QiLCJyZWxhdGl2ZSIsImZyb20iLCJ0byIsInVwQ291bnQiLCJyZW1haW5pbmdQYXRoIiwicmVwZWF0IiwicGFyc2UiLCJyb290IiwiZGlyIiwiYmFzZUxlbmd0aCIsInRvU3VidHJhY3QiLCJmaXJzdENoYXJDb2RlIiwidGhpcmRDaGFyQ29kZSIsImZvcm1hdCIsInBhdGhPYmplY3QiLCJ0b05hbWVzcGFjZWRQYXRoIiwicmVzb2x2ZWRQYXRoIiwiV2luMzJQYXRoIiwic2VwIiwiZGVsaW1pdGVyIiwiUG9zaXhQYXRoIiwicGF0aCIsIndpbjMyIiwicG9zaXgiLCJnZW5JbnZva2VyIiwid3JhcHBlckFQSSIsInJlYWxBUEkiLCJhcGlOYW1lIiwiaW52b2NhdGlvbkFQSSIsInNjb3BlVmFycyIsImFwaU5hbWVzcGFjZSIsIm5hbWVzcGFjZSIsIm5hbWVzIiwiYXBpIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaGFzT3duUHJvcGVydHkiLCJjYWxsIiwiU2FuZGJveEFQSSIsInByb3RvIiwiZ2V0UHJvdG90eXBlT2YiLCJkZWZpbmVQcm9wZXJ0eSIsImdldCIsIl9ldmVudHMiLCJzZXQiLCJ2YWx1ZSIsImRlbGVnYXRlIiwiX19kZWxlZ2F0ZV9fIiwiY3JlYXRlSW52b2tlciIsImdlbkludm9rZXJfMSIsInRoaXNPYmoiLCJ1cmxJbnZva2VyIiwiaW52b2tlciIsImFyZ3MiLCJzcGxpY2UiLCJfX3Njb3BlVmFyc19fIiwiYXBwbHkiLCJfX3RoaXNPYmpfXyIsImNyZWF0ZUludm9rZXJfMSIsImJvb3RzdHJhcCQyIiwia3JvbGwiLCJhc3NldHMiLCJiaW5kaW5nIiwiU2NyaXB0IiwiZmlsZUluZGV4IiwiSU5ERVhfSlNPTiIsIk1vZHVsZSIsImNvbnN0cnVjdG9yIiwiaWQiLCJwYXJlbnQiLCJleHBvcnRzIiwiZmlsZW5hbWUiLCJsb2FkZWQiLCJ3cmFwcGVyQ2FjaGUiLCJpc1NlcnZpY2UiLCJsb2FkIiwic291cmNlIiwiRXJyb3IiLCJub2RlTW9kdWxlc1BhdGhzIiwicmVhZEFzc2V0IiwiY2FjaGUiLCJfcnVuU2NyaXB0IiwiY3JlYXRlTW9kdWxlV3JhcHBlciIsImV4dGVybmFsTW9kdWxlIiwic291cmNlVXJsIiwiTW9kdWxlV3JhcHBlciIsIndyYXBwZXIiLCJpbnZvY2F0aW9uQVBJcyIsIlNjb3BlVmFycyIsImFkZEV2ZW50TGlzdGVuZXIiLCJyZW1vdmVFdmVudExpc3RlbmVyIiwiZmlyZUV2ZW50IiwiZXh0ZW5kTW9kdWxlV2l0aENvbW1vbkpzIiwiaXNFeHRlcm5hbENvbW1vbkpzTW9kdWxlIiwiZmFrZUlkIiwianNNb2R1bGUiLCJnZXRFeHRlcm5hbENvbW1vbkpzTW9kdWxlIiwiY29uc29sZSIsInRyYWNlIiwiZXh0ZW5kIiwibG9hZEV4dGVybmFsTW9kdWxlIiwiZXh0ZXJuYWxCaW5kaW5nIiwiYm9vdHN0cmFwIiwibW9kdWxlIiwicmVxdWlyZSIsInJlcXVlc3QiLCJzdGFydCIsInN1YnN0cmluZyIsImxvYWRBc0ZpbGVPckRpcmVjdG9yeSIsImxvYWRDb3JlTW9kdWxlIiwiaW5kZXhPZiIsImZpbGVuYW1lRXhpc3RzIiwibG9hZEphdmFzY3JpcHRUZXh0IiwibG9hZEFzRGlyZWN0b3J5IiwibG9hZE5vZGVNb2R1bGVzIiwiZXh0ZXJuYWxDb21tb25Kc0NvbnRlbnRzIiwibW9kdWxlSWQiLCJkaXJzIiwibW9kIiwic3RhcnREaXIiLCJub3JtYWxpemVkUGF0aCIsImxvYWRBc0ZpbGUiLCJsb2FkSmF2YXNjcmlwdE9iamVjdCIsIkpTT04iLCJvYmplY3QiLCJtYWluIiwibSIsInNlbGYiLCJpbnNwZWN0b3IiLCJpbnNwZWN0b3JXcmFwcGVyIiwiY2FsbEFuZFBhdXNlT25TdGFydCIsInJ1bkluVGhpc0NvbnRleHQiLCJ3cmFwIiwiZiIsIlRpdGFuaXVtIiwiVGkiLCJqc29uIiwic2NyaXB0IiwicnVuTW9kdWxlIiwiYWN0aXZpdHlPclNlcnZpY2UiLCJTZXJ2aWNlIiwiQW5kcm9pZCIsIndyaXRhYmxlIiwiY29uZmlndXJhYmxlIiwiUHJveHlCb290c3RyYXAiLCJ0aUJpbmRpbmciLCJQcm94eSIsImRlZmluZVByb3BlcnRpZXMiLCJwcm94eVByb3RvdHlwZSIsInByb3BlcnRpZXMiLCJsZW4iLCJnZXRQcm9wZXJ0eSIsInNldFByb3BlcnR5QW5kRmlyZSIsImVudW1lcmFibGUiLCJwcm9wZXJ0eSIsIl9wcm9wZXJ0aWVzIiwib3duTmFtZXMiLCJnZXRPd25Qcm9wZXJ0eU5hbWVzIiwiY2hhbmdlcyIsIm9sZFZhbHVlIiwib25Qcm9wZXJ0aWVzQ2hhbmdlZCIsImJvb3RzdHJhcCQxIiwiTmF0aXZlTW9kdWxlIiwiZGVmaW5lTGF6eUJpbmRpbmciLCJUaXRhbml1bVdyYXBwZXIiLCJjb250ZXh0IiwiYmluZEludm9jYXRpb25BUElzIiwiV3JhcHBlciIsIndyYXBwZXJUaSIsIkV2ZW50RW1pdHRlckJvb3RzdHJhcCIsIlRBRyIsIkV2ZW50RW1pdHRlciIsImlzQXJyYXkiLCJBcnJheSIsImhhbmRsZXIiLCJkYXRhIiwiaGFuZGxlZCIsImNhbmNlbEJ1YmJsZSIsImV2ZW50IiwibGlzdGVuZXIiLCJ2aWV3IiwiREJHIiwibG9nIiwiYnViYmxlcyIsIl9maXJlU3luY0V2ZW50VG9QYXJlbnQiLCJhcmd1bWVudHMiLCJsaXN0ZW5lcnMiLCJfaGFzSmF2YUxpc3RlbmVyIiwiX29uRXZlbnRGaXJlZCIsImNhbGxIYW5kbGVyIiwibCIsImVtaXQiLCJsaXN0ZW5lcldyYXBwZXIiLCJfaGFzTGlzdGVuZXJzRm9yRXZlbnRUeXBlIiwiYWRkTGlzdGVuZXIiLCJnIiwicmVtb3ZlTGlzdGVuZXIiLCJvbiIsImxpc3QiLCJjb3VudCIsInBvc2l0aW9uIiwiTmF0aXZlTW9kdWxlQm9vdHN0cmFwIiwiX3NvdXJjZSIsIl9jYWNoZSIsImNhY2hlZCIsImdldENhY2hlZCIsImV4aXN0cyIsIm5hdGl2ZU1vZHVsZSIsImNvbXBpbGUiLCJnZXRTb3VyY2UiLCJmbiIsInRoaXNPYmplY3QiLCJvdGhlck9iamVjdCIsInZhcnMiLCJrZXlzIiwia2V5Iiwic3RhcnR1cCJdLCJtYXBwaW5ncyI6IkFBQUMsYUFBWTtBQUNaOztBQUVBO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0MsV0FBU0Esa0JBQVQsQ0FBNEJDLEdBQTVCLEVBQWlDQyxJQUFqQyxFQUF1Q0MsUUFBdkMsRUFBaUQ7QUFDL0MsVUFBTUMsSUFBSSxHQUFHLE9BQU9ILEdBQXBCOztBQUVBLFFBQUlHLElBQUksS0FBS0QsUUFBUSxDQUFDRSxXQUFULEVBQWIsRUFB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XHQgKiBAcGFyYW0gIHsqfSBhcmcgcGFzc2VkIGluIGFyZ3VtZW50IHZhbHVlXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gbmFtZSBuYW1lIG9mIHRoZSBhcmd1bWVudFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHR5cGVuYW1lIGkuZS4gJ3N0cmluZycsICdGdW5jdGlvbicgKHZhbHVlIGlzIGNvbXBhcmVkIHRvIHR5cGVvZiBhZnRlciBsb3dlcmNhc2luZylcblx0ICogQHJldHVybiB7dm9pZH1cblx0ICogQHRocm93cyB7VHlwZUVycm9yfVxuXHQgKi9cblx0ZnVuY3Rpb24gYXNzZXJ0QXJndW1lbnRUeXBlKGFyZywgbmFtZSwgdHlwZW5hbWUpIHtcblx0ICBjb25zdCB0eXBlID0gdHlwZW9mIGFyZztcblxuXHQgIGlmICh0eXBlICE9PSB0eXBlbmFtZS50b0xvd2VyQ2FzZSgpKSB7XG5cdCAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBUaGUgXCIke25hbWV9XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlICR7dHlwZW5hbWV9LiBSZWNlaXZlZCB0eXBlICR7dHlwZX1gKTtcblx0ICB9XG5cdH1cblxuXHRjb25zdCBGT1JXQVJEX1NMQVNIID0gNDc7IC8vICcvJ1xuXG5cdGNvbnN0IEJBQ0tXQVJEX1NMQVNIID0gOTI7IC8vICdcXFxcJ1xuXG5cdC8qKlxuXHQgKiBJcyB0aGlzIFthLXpBLVpdP1xuXHQgKiBAcGFyYW0gIHtudW1iZXJ9ICBjaGFyQ29kZSB2YWx1ZSBmcm9tIFN0cmluZy5jaGFyQ29kZUF0KClcblx0ICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblxuXHRmdW5jdGlvbiBpc1dpbmRvd3NEZXZpY2VOYW1lKGNoYXJDb2RlKSB7XG5cdCAgcmV0dXJuIGNoYXJDb2RlID49IDY1ICYmIGNoYXJDb2RlIDw9IDkwIHx8IGNoYXJDb2RlID49IDk3ICYmIGNoYXJDb2RlIDw9IDEyMjtcblx0fVxuXHQvKipcblx0ICogW2lzQWJzb2x1dGUgZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge2Jvb2xlYW59IGlzUG9zaXggd2hldGhlciB0aGlzIGltcGwgaXMgZm9yIFBPU0lYIG9yIG5vdFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVwYXRoICAgaW5wdXQgZmlsZSBwYXRoXG5cdCAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBpc0Fic29sdXRlKGlzUG9zaXgsIGZpbGVwYXRoKSB7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKGZpbGVwYXRoLCAncGF0aCcsICdzdHJpbmcnKTtcblx0ICBjb25zdCBsZW5ndGggPSBmaWxlcGF0aC5sZW5ndGg7IC8vIGVtcHR5IHN0cmluZyBzcGVjaWFsIGNhc2VcblxuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiBmYWxzZTtcblx0ICB9XG5cblx0ICBjb25zdCBmaXJzdENoYXIgPSBmaWxlcGF0aC5jaGFyQ29kZUF0KDApO1xuXG5cdCAgaWYgKGZpcnN0Q2hhciA9PT0gRk9SV0FSRF9TTEFTSCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfSAvLyB3ZSBhbHJlYWR5IGRpZCBvdXIgY2hlY2tzIGZvciBwb3NpeFxuXG5cblx0ICBpZiAoaXNQb3NpeCkge1xuXHQgICAgcmV0dXJuIGZhbHNlO1xuXHQgIH0gLy8gd2luMzIgZnJvbSBoZXJlIG9uIG91dFxuXG5cblx0ICBpZiAoZmlyc3RDaGFyID09PSBCQUNLV0FSRF9TTEFTSCkge1xuXHQgICAgcmV0dXJuIHRydWU7XG5cdCAgfVxuXG5cdCAgaWYgKGxlbmd0aCA+IDIgJiYgaXNXaW5kb3dzRGV2aWNlTmFtZShmaXJzdENoYXIpICYmIGZpbGVwYXRoLmNoYXJBdCgxKSA9PT0gJzonKSB7XG5cdCAgICBjb25zdCB0aGlyZENoYXIgPSBmaWxlcGF0aC5jaGFyQXQoMik7XG5cdCAgICByZXR1cm4gdGhpcmRDaGFyID09PSAnLycgfHwgdGhpcmRDaGFyID09PSAnXFxcXCc7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIGZhbHNlO1xuXHR9XG5cdC8qKlxuXHQgKiBbZGlybmFtZSBkZXNjcmlwdGlvbl1cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggICBpbnB1dCBmaWxlIHBhdGhcblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBkaXJuYW1lKHNlcGFyYXRvciwgZmlsZXBhdGgpIHtcblx0ICBhc3NlcnRBcmd1bWVudFR5cGUoZmlsZXBhdGgsICdwYXRoJywgJ3N0cmluZycpO1xuXHQgIGNvbnN0IGxlbmd0aCA9IGZpbGVwYXRoLmxlbmd0aDtcblxuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAnLic7XG5cdCAgfSAvLyBpZ25vcmUgdHJhaWxpbmcgc2VwYXJhdG9yXG5cblxuXHQgIGxldCBmcm9tSW5kZXggPSBsZW5ndGggLSAxO1xuXHQgIGNvbnN0IGhhZFRyYWlsaW5nID0gZmlsZXBhdGguZW5kc1dpdGgoc2VwYXJhdG9yKTtcblxuXHQgIGlmIChoYWRUcmFpbGluZykge1xuXHQgICAgZnJvbUluZGV4LS07XG5cdCAgfVxuXG5cdCAgY29uc3QgZm91bmRJbmRleCA9IGZpbGVwYXRoLmxhc3RJbmRleE9mKHNlcGFyYXRvciwgZnJvbUluZGV4KTsgLy8gbm8gc2VwYXJhdG9yc1xuXG5cdCAgaWYgKGZvdW5kSW5kZXggPT09IC0xKSB7XG5cdCAgICAvLyBoYW5kbGUgc3BlY2lhbCBjYXNlIG9mIHJvb3Qgd2luZG93cyBwYXRoc1xuXHQgICAgaWYgKGxlbmd0aCA+PSAyICYmIHNlcGFyYXRvciA9PT0gJ1xcXFwnICYmIGZpbGVwYXRoLmNoYXJBdCgxKSA9PT0gJzonKSB7XG5cdCAgICAgIGNvbnN0IGZpcnN0Q2hhciA9IGZpbGVwYXRoLmNoYXJDb2RlQXQoMCk7XG5cblx0ICAgICAgaWYgKGlzV2luZG93c0RldmljZU5hbWUoZmlyc3RDaGFyKSkge1xuXHQgICAgICAgIHJldHVybiBmaWxlcGF0aDsgLy8gaXQncyBhIHJvb3Qgd2luZG93cyBwYXRoXG5cdCAgICAgIH1cblx0ICAgIH1cblxuXHQgICAgcmV0dXJuICcuJztcblx0ICB9IC8vIG9ubHkgZm91bmQgcm9vdCBzZXBhcmF0b3JcblxuXG5cdCAgaWYgKGZvdW5kSW5kZXggPT09IDApIHtcblx0ICAgIHJldHVybiBzZXBhcmF0b3I7IC8vIGlmIGl0IHdhcyAnLycsIHJldHVybiB0aGF0XG5cdCAgfSAvLyBIYW5kbGUgc3BlY2lhbCBjYXNlIG9mICcvL3NvbWV0aGluZydcblxuXG5cdCAgaWYgKGZvdW5kSW5kZXggPT09IDEgJiYgc2VwYXJhdG9yID09PSAnLycgJiYgZmlsZXBhdGguY2hhckF0KDApID09PSAnLycpIHtcblx0ICAgIHJldHVybiAnLy8nO1xuXHQgIH1cblxuXHQgIHJldHVybiBmaWxlcGF0aC5zbGljZSgwLCBmb3VuZEluZGV4KTtcblx0fVxuXHQvKipcblx0ICogW2V4dG5hbWUgZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yICBwbGF0Zm9ybS1zcGVjaWZpYyBmaWxlIHNlcGFyYXRvclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVwYXRoICAgaW5wdXQgZmlsZSBwYXRoXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXG5cblx0ZnVuY3Rpb24gZXh0bmFtZShzZXBhcmF0b3IsIGZpbGVwYXRoKSB7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKGZpbGVwYXRoLCAncGF0aCcsICdzdHJpbmcnKTtcblx0ICBjb25zdCBpbmRleCA9IGZpbGVwYXRoLmxhc3RJbmRleE9mKCcuJyk7XG5cblx0ICBpZiAoaW5kZXggPT09IC0xIHx8IGluZGV4ID09PSAwKSB7XG5cdCAgICByZXR1cm4gJyc7XG5cdCAgfSAvLyBpZ25vcmUgdHJhaWxpbmcgc2VwYXJhdG9yXG5cblxuXHQgIGxldCBlbmRJbmRleCA9IGZpbGVwYXRoLmxlbmd0aDtcblxuXHQgIGlmIChmaWxlcGF0aC5lbmRzV2l0aChzZXBhcmF0b3IpKSB7XG5cdCAgICBlbmRJbmRleC0tO1xuXHQgIH1cblxuXHQgIHJldHVybiBmaWxlcGF0aC5zbGljZShpbmRleCwgZW5kSW5kZXgpO1xuXHR9XG5cblx0ZnVuY3Rpb24gbGFzdEluZGV4V2luMzJTZXBhcmF0b3IoZmlsZXBhdGgsIGluZGV4KSB7XG5cdCAgZm9yIChsZXQgaSA9IGluZGV4OyBpID49IDA7IGktLSkge1xuXHQgICAgY29uc3QgY2hhciA9IGZpbGVwYXRoLmNoYXJDb2RlQXQoaSk7XG5cblx0ICAgIGlmIChjaGFyID09PSBCQUNLV0FSRF9TTEFTSCB8fCBjaGFyID09PSBGT1JXQVJEX1NMQVNIKSB7XG5cdCAgICAgIHJldHVybiBpO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIHJldHVybiAtMTtcblx0fVxuXHQvKipcblx0ICogW2Jhc2VuYW1lIGRlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHNlcGFyYXRvciAgcGxhdGZvcm0tc3BlY2lmaWMgZmlsZSBzZXBhcmF0b3Jcblx0ICogQHBhcmFtICB7c3RyaW5nfSBmaWxlcGF0aCAgIGlucHV0IGZpbGUgcGF0aFxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IFtleHRdICAgICAgZmlsZSBleHRlbnNpb24gdG8gZHJvcCBpZiBpdCBleGlzdHNcblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBiYXNlbmFtZShzZXBhcmF0b3IsIGZpbGVwYXRoLCBleHQpIHtcblx0ICBhc3NlcnRBcmd1bWVudFR5cGUoZmlsZXBhdGgsICdwYXRoJywgJ3N0cmluZycpO1xuXG5cdCAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkKSB7XG5cdCAgICBhc3NlcnRBcmd1bWVudFR5cGUoZXh0LCAnZXh0JywgJ3N0cmluZycpO1xuXHQgIH1cblxuXHQgIGNvbnN0IGxlbmd0aCA9IGZpbGVwYXRoLmxlbmd0aDtcblxuXHQgIGlmIChsZW5ndGggPT09IDApIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cblx0ICBjb25zdCBpc1Bvc2l4ID0gc2VwYXJhdG9yID09PSAnLyc7XG5cdCAgbGV0IGVuZEluZGV4ID0gbGVuZ3RoOyAvLyBkcm9wIHRyYWlsaW5nIHNlcGFyYXRvciAoaWYgdGhlcmUgaXMgb25lKVxuXG5cdCAgY29uc3QgbGFzdENoYXJDb2RlID0gZmlsZXBhdGguY2hhckNvZGVBdChsZW5ndGggLSAxKTtcblxuXHQgIGlmIChsYXN0Q2hhckNvZGUgPT09IEZPUldBUkRfU0xBU0ggfHwgIWlzUG9zaXggJiYgbGFzdENoYXJDb2RlID09PSBCQUNLV0FSRF9TTEFTSCkge1xuXHQgICAgZW5kSW5kZXgtLTtcblx0ICB9IC8vIEZpbmQgbGFzdCBvY2N1cmVuY2Ugb2Ygc2VwYXJhdG9yXG5cblxuXHQgIGxldCBsYXN0SW5kZXggPSAtMTtcblxuXHQgIGlmIChpc1Bvc2l4KSB7XG5cdCAgICBsYXN0SW5kZXggPSBmaWxlcGF0aC5sYXN0SW5kZXhPZihzZXBhcmF0b3IsIGVuZEluZGV4IC0gMSk7XG5cdCAgfSBlbHNlIHtcblx0ICAgIC8vIE9uIHdpbjMyLCBoYW5kbGUgKmVpdGhlciogc2VwYXJhdG9yIVxuXHQgICAgbGFzdEluZGV4ID0gbGFzdEluZGV4V2luMzJTZXBhcmF0b3IoZmlsZXBhdGgsIGVuZEluZGV4IC0gMSk7IC8vIGhhbmRsZSBzcGVjaWFsIGNhc2Ugb2Ygcm9vdCBwYXRoIGxpa2UgJ0M6JyBvciAnQzpcXFxcJ1xuXG5cdCAgICBpZiAoKGxhc3RJbmRleCA9PT0gMiB8fCBsYXN0SW5kZXggPT09IC0xKSAmJiBmaWxlcGF0aC5jaGFyQXQoMSkgPT09ICc6JyAmJiBpc1dpbmRvd3NEZXZpY2VOYW1lKGZpbGVwYXRoLmNoYXJDb2RlQXQoMCkpKSB7XG5cdCAgICAgIHJldHVybiAnJztcblx0ICAgIH1cblx0ICB9IC8vIFRha2UgZnJvbSBsYXN0IG9jY3VycmVuY2Ugb2Ygc2VwYXJhdG9yIHRvIGVuZCBvZiBzdHJpbmcgKG9yIGJlZ2lubmluZyB0byBlbmQgaWYgbm90IGZvdW5kKVxuXG5cblx0ICBjb25zdCBiYXNlID0gZmlsZXBhdGguc2xpY2UobGFzdEluZGV4ICsgMSwgZW5kSW5kZXgpOyAvLyBkcm9wIHRyYWlsaW5nIGV4dGVuc2lvbiAoaWYgc3BlY2lmaWVkKVxuXG5cdCAgaWYgKGV4dCA9PT0gdW5kZWZpbmVkKSB7XG5cdCAgICByZXR1cm4gYmFzZTtcblx0ICB9XG5cblx0ICByZXR1cm4gYmFzZS5lbmRzV2l0aChleHQpID8gYmFzZS5zbGljZSgwLCBiYXNlLmxlbmd0aCAtIGV4dC5sZW5ndGgpIDogYmFzZTtcblx0fVxuXHQvKipcblx0ICogVGhlIGBwYXRoLm5vcm1hbGl6ZSgpYCBtZXRob2Qgbm9ybWFsaXplcyB0aGUgZ2l2ZW4gcGF0aCwgcmVzb2x2aW5nICcuLicgYW5kICcuJyBzZWdtZW50cy5cblx0ICpcblx0ICogV2hlbiBtdWx0aXBsZSwgc2VxdWVudGlhbCBwYXRoIHNlZ21lbnQgc2VwYXJhdGlvbiBjaGFyYWN0ZXJzIGFyZSBmb3VuZCAoZS5nLlxuXHQgKiAvIG9uIFBPU0lYIGFuZCBlaXRoZXIgXFwgb3IgLyBvbiBXaW5kb3dzKSwgdGhleSBhcmUgcmVwbGFjZWQgYnkgYSBzaW5nbGVcblx0ICogaW5zdGFuY2Ugb2YgdGhlIHBsYXRmb3JtLXNwZWNpZmljIHBhdGggc2VnbWVudCBzZXBhcmF0b3IgKC8gb24gUE9TSVggYW5kIFxcXG5cdCAqIG9uIFdpbmRvd3MpLiBUcmFpbGluZyBzZXBhcmF0b3JzIGFyZSBwcmVzZXJ2ZWQuXG5cdCAqXG5cdCAqIElmIHRoZSBwYXRoIGlzIGEgemVyby1sZW5ndGggc3RyaW5nLCAnLicgaXMgcmV0dXJuZWQsIHJlcHJlc2VudGluZyB0aGVcblx0ICogY3VycmVudCB3b3JraW5nIGRpcmVjdG9yeS5cblx0ICpcblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gZmlsZXBhdGggIGlucHV0IGZpbGUgcGF0aFxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9IFtkZXNjcmlwdGlvbl1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBub3JtYWxpemUoc2VwYXJhdG9yLCBmaWxlcGF0aCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShmaWxlcGF0aCwgJ3BhdGgnLCAnc3RyaW5nJyk7XG5cblx0ICBpZiAoZmlsZXBhdGgubGVuZ3RoID09PSAwKSB7XG5cdCAgICByZXR1cm4gJy4nO1xuXHQgIH0gLy8gV2luZG93cyBjYW4gaGFuZGxlICcvJyBvciAnXFxcXCcgYW5kIGJvdGggc2hvdWxkIGJlIHR1cm5lZCBpbnRvIHNlcGFyYXRvclxuXG5cblx0ICBjb25zdCBpc1dpbmRvd3MgPSBzZXBhcmF0b3IgPT09ICdcXFxcJztcblxuXHQgIGlmIChpc1dpbmRvd3MpIHtcblx0ICAgIGZpbGVwYXRoID0gZmlsZXBhdGgucmVwbGFjZSgvXFwvL2csIHNlcGFyYXRvcik7XG5cdCAgfVxuXG5cdCAgY29uc3QgaGFkTGVhZGluZyA9IGZpbGVwYXRoLnN0YXJ0c1dpdGgoc2VwYXJhdG9yKTsgLy8gT24gV2luZG93cywgbmVlZCB0byBoYW5kbGUgVU5DIHBhdGhzIChcXFxcaG9zdC1uYW1lXFxcXHJlc291cmNlXFxcXGRpcikgc3BlY2lhbCB0byByZXRhaW4gbGVhZGluZyBkb3VibGUgYmFja3NsYXNoXG5cblx0ICBjb25zdCBpc1VOQyA9IGhhZExlYWRpbmcgJiYgaXNXaW5kb3dzICYmIGZpbGVwYXRoLmxlbmd0aCA+IDIgJiYgZmlsZXBhdGguY2hhckF0KDEpID09PSAnXFxcXCc7XG5cdCAgY29uc3QgaGFkVHJhaWxpbmcgPSBmaWxlcGF0aC5lbmRzV2l0aChzZXBhcmF0b3IpO1xuXHQgIGNvbnN0IHBhcnRzID0gZmlsZXBhdGguc3BsaXQoc2VwYXJhdG9yKTtcblx0ICBjb25zdCByZXN1bHQgPSBbXTtcblxuXHQgIGZvciAoY29uc3Qgc2VnbWVudCBvZiBwYXJ0cykge1xuXHQgICAgaWYgKHNlZ21lbnQubGVuZ3RoICE9PSAwICYmIHNlZ21lbnQgIT09ICcuJykge1xuXHQgICAgICBpZiAoc2VnbWVudCA9PT0gJy4uJykge1xuXHQgICAgICAgIHJlc3VsdC5wb3AoKTsgLy8gRklYTUU6IFdoYXQgaWYgdGhpcyBnb2VzIGFib3ZlIHJvb3Q/IFNob3VsZCB3ZSB0aHJvdyBhbiBlcnJvcj9cblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXN1bHQucHVzaChzZWdtZW50KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXHQgIH1cblxuXHQgIGxldCBub3JtYWxpemVkID0gaGFkTGVhZGluZyA/IHNlcGFyYXRvciA6ICcnO1xuXHQgIG5vcm1hbGl6ZWQgKz0gcmVzdWx0LmpvaW4oc2VwYXJhdG9yKTtcblxuXHQgIGlmIChoYWRUcmFpbGluZykge1xuXHQgICAgbm9ybWFsaXplZCArPSBzZXBhcmF0b3I7XG5cdCAgfVxuXG5cdCAgaWYgKGlzVU5DKSB7XG5cdCAgICBub3JtYWxpemVkID0gJ1xcXFwnICsgbm9ybWFsaXplZDtcblx0ICB9XG5cblx0ICByZXR1cm4gbm9ybWFsaXplZDtcblx0fVxuXHQvKipcblx0ICogW2Fzc2VydFNlZ21lbnQgZGVzY3JpcHRpb25dXG5cdCAqIEBwYXJhbSAgeyp9IHNlZ21lbnQgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHt2b2lkfSAgICAgICAgIFtkZXNjcmlwdGlvbl1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBhc3NlcnRTZWdtZW50KHNlZ21lbnQpIHtcblx0ICBpZiAodHlwZW9mIHNlZ21lbnQgIT09ICdzdHJpbmcnKSB7XG5cdCAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBQYXRoIG11c3QgYmUgYSBzdHJpbmcuIFJlY2VpdmVkICR7c2VnbWVudH1gKTtcblx0ICB9XG5cdH1cblx0LyoqXG5cdCAqIFRoZSBgcGF0aC5qb2luKClgIG1ldGhvZCBqb2lucyBhbGwgZ2l2ZW4gcGF0aCBzZWdtZW50cyB0b2dldGhlciB1c2luZyB0aGVcblx0ICogcGxhdGZvcm0tc3BlY2lmaWMgc2VwYXJhdG9yIGFzIGEgZGVsaW1pdGVyLCB0aGVuIG5vcm1hbGl6ZXMgdGhlIHJlc3VsdGluZyBwYXRoLlxuXHQgKiBaZXJvLWxlbmd0aCBwYXRoIHNlZ21lbnRzIGFyZSBpZ25vcmVkLiBJZiB0aGUgam9pbmVkIHBhdGggc3RyaW5nIGlzIGEgemVyby1cblx0ICogbGVuZ3RoIHN0cmluZyB0aGVuICcuJyB3aWxsIGJlIHJldHVybmVkLCByZXByZXNlbnRpbmcgdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge3N0cmluZ1tdfSBwYXRocyBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge3N0cmluZ30gICAgICAgVGhlIGpvaW5lZCBmaWxlcGF0aFxuXHQgKi9cblxuXG5cdGZ1bmN0aW9uIGpvaW4oc2VwYXJhdG9yLCBwYXRocykge1xuXHQgIGNvbnN0IHJlc3VsdCA9IFtdOyAvLyBuYWl2ZSBpbXBsOiBqdXN0IGpvaW4gYWxsIHRoZSBwYXRocyB3aXRoIHNlcGFyYXRvclxuXG5cdCAgZm9yIChjb25zdCBzZWdtZW50IG9mIHBhdGhzKSB7XG5cdCAgICBhc3NlcnRTZWdtZW50KHNlZ21lbnQpO1xuXG5cdCAgICBpZiAoc2VnbWVudC5sZW5ndGggIT09IDApIHtcblx0ICAgICAgcmVzdWx0LnB1c2goc2VnbWVudCk7XG5cdCAgICB9XG5cdCAgfVxuXG5cdCAgcmV0dXJuIG5vcm1hbGl6ZShzZXBhcmF0b3IsIHJlc3VsdC5qb2luKHNlcGFyYXRvcikpO1xuXHR9XG5cdC8qKlxuXHQgKiBUaGUgYHBhdGgucmVzb2x2ZSgpYCBtZXRob2QgcmVzb2x2ZXMgYSBzZXF1ZW5jZSBvZiBwYXRocyBvciBwYXRoIHNlZ21lbnRzIGludG8gYW4gYWJzb2x1dGUgcGF0aC5cblx0ICpcblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgcGxhdGZvcm0tc3BlY2lmaWMgZmlsZSBzZXBhcmF0b3Jcblx0ICogQHBhcmFtICB7c3RyaW5nW119IHBhdGhzIFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXG5cblx0ZnVuY3Rpb24gcmVzb2x2ZShzZXBhcmF0b3IsIHBhdGhzKSB7XG5cdCAgbGV0IHJlc29sdmVkID0gJyc7XG5cdCAgbGV0IGhpdFJvb3QgPSBmYWxzZTtcblx0ICBjb25zdCBpc1Bvc2l4ID0gc2VwYXJhdG9yID09PSAnLyc7IC8vIGdvIGZyb20gcmlnaHQgdG8gbGVmdCB1bnRpbCB3ZSBoaXQgYWJzb2x1dGUgcGF0aC9yb290XG5cblx0ICBmb3IgKGxldCBpID0gcGF0aHMubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcblx0ICAgIGNvbnN0IHNlZ21lbnQgPSBwYXRoc1tpXTtcblx0ICAgIGFzc2VydFNlZ21lbnQoc2VnbWVudCk7XG5cblx0ICAgIGlmIChzZWdtZW50Lmxlbmd0aCA9PT0gMCkge1xuXHQgICAgICBjb250aW51ZTsgLy8gc2tpcCBlbXB0eVxuXHQgICAgfVxuXG5cdCAgICByZXNvbHZlZCA9IHNlZ21lbnQgKyBzZXBhcmF0b3IgKyByZXNvbHZlZDsgLy8gcHJlcGVuZCBuZXcgc2VnbWVudFxuXG5cdCAgICBpZiAoaXNBYnNvbHV0ZShpc1Bvc2l4LCBzZWdtZW50KSkge1xuXHQgICAgICAvLyBoYXZlIHdlIGJhY2tlZCBpbnRvIGFuIGFic29sdXRlIHBhdGg/XG5cdCAgICAgIGhpdFJvb3QgPSB0cnVlO1xuXHQgICAgICBicmVhaztcblx0ICAgIH1cblx0ICB9IC8vIGlmIHdlIGRpZG4ndCBoaXQgcm9vdCwgcHJlcGVuZCBjd2RcblxuXG5cdCAgaWYgKCFoaXRSb290KSB7XG5cdCAgICByZXNvbHZlZCA9IChnbG9iYWwucHJvY2VzcyA/IHByb2Nlc3MuY3dkKCkgOiAnLycpICsgc2VwYXJhdG9yICsgcmVzb2x2ZWQ7XG5cdCAgfVxuXG5cdCAgY29uc3Qgbm9ybWFsaXplZCA9IG5vcm1hbGl6ZShzZXBhcmF0b3IsIHJlc29sdmVkKTtcblxuXHQgIGlmIChub3JtYWxpemVkLmNoYXJBdChub3JtYWxpemVkLmxlbmd0aCAtIDEpID09PSBzZXBhcmF0b3IpIHtcblx0ICAgIC8vIEZJWE1FOiBIYW5kbGUgVU5DIHBhdGhzIG9uIFdpbmRvd3MgYXMgd2VsbCwgc28gd2UgZG9uJ3QgdHJpbSB0cmFpbGluZyBzZXBhcmF0b3Igb24gc29tZXRoaW5nIGxpa2UgJ1xcXFxcXFxcaG9zdC1uYW1lXFxcXHJlc291cmNlXFxcXCdcblx0ICAgIC8vIERvbid0IHJlbW92ZSB0cmFpbGluZyBzZXBhcmF0b3IgaWYgdGhpcyBpcyByb290IHBhdGggb24gd2luZG93cyFcblx0ICAgIGlmICghaXNQb3NpeCAmJiBub3JtYWxpemVkLmxlbmd0aCA9PT0gMyAmJiBub3JtYWxpemVkLmNoYXJBdCgxKSA9PT0gJzonICYmIGlzV2luZG93c0RldmljZU5hbWUobm9ybWFsaXplZC5jaGFyQ29kZUF0KDApKSkge1xuXHQgICAgICByZXR1cm4gbm9ybWFsaXplZDtcblx0ICAgIH0gLy8gb3RoZXJ3aXNlIHRyaW0gdHJhaWxpbmcgc2VwYXJhdG9yXG5cblxuXHQgICAgcmV0dXJuIG5vcm1hbGl6ZWQuc2xpY2UoMCwgbm9ybWFsaXplZC5sZW5ndGggLSAxKTtcblx0ICB9XG5cblx0ICByZXR1cm4gbm9ybWFsaXplZDtcblx0fVxuXHQvKipcblx0ICogVGhlIGBwYXRoLnJlbGF0aXZlKClgIG1ldGhvZCByZXR1cm5zIHRoZSByZWxhdGl2ZSBwYXRoIGBmcm9tYCBmcm9tIHRvIGB0b2AgYmFzZWRcblx0ICogb24gdGhlIGN1cnJlbnQgd29ya2luZyBkaXJlY3RvcnkuIElmIGZyb20gYW5kIHRvIGVhY2ggcmVzb2x2ZSB0byB0aGUgc2FtZVxuXHQgKiBwYXRoIChhZnRlciBjYWxsaW5nIGBwYXRoLnJlc29sdmUoKWAgb24gZWFjaCksIGEgemVyby1sZW5ndGggc3RyaW5nIGlzIHJldHVybmVkLlxuXHQgKlxuXHQgKiBJZiBhIHplcm8tbGVuZ3RoIHN0cmluZyBpcyBwYXNzZWQgYXMgYGZyb21gIG9yIGB0b2AsIHRoZSBjdXJyZW50IHdvcmtpbmcgZGlyZWN0b3J5XG5cdCAqIHdpbGwgYmUgdXNlZCBpbnN0ZWFkIG9mIHRoZSB6ZXJvLWxlbmd0aCBzdHJpbmdzLlxuXHQgKlxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHNlcGFyYXRvciBwbGF0Zm9ybS1zcGVjaWZpYyBmaWxlIHNlcGFyYXRvclxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZyb20gW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHRvICAgW2Rlc2NyaXB0aW9uXVxuXHQgKiBAcmV0dXJuIHtzdHJpbmd9ICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblxuXG5cdGZ1bmN0aW9uIHJlbGF0aXZlKHNlcGFyYXRvciwgZnJvbSwgdG8pIHtcblx0ICBhc3NlcnRBcmd1bWVudFR5cGUoZnJvbSwgJ2Zyb20nLCAnc3RyaW5nJyk7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKHRvLCAndG8nLCAnc3RyaW5nJyk7XG5cblx0ICBpZiAoZnJvbSA9PT0gdG8pIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9XG5cblx0ICBmcm9tID0gcmVzb2x2ZShzZXBhcmF0b3IsIFtmcm9tXSk7XG5cdCAgdG8gPSByZXNvbHZlKHNlcGFyYXRvciwgW3RvXSk7XG5cblx0ICBpZiAoZnJvbSA9PT0gdG8pIHtcblx0ICAgIHJldHVybiAnJztcblx0ICB9IC8vIHdlIG5vdyBoYXZlIHR3byBhYnNvbHV0ZSBwYXRocyxcblx0ICAvLyBsZXRzIFwiZ28gdXBcIiBmcm9tIGBmcm9tYCB1bnRpbCB3ZSByZWFjaCBjb21tb24gYmFzZSBkaXIgb2YgYHRvYFxuXHQgIC8vIGNvbnN0IG9yaWdpbmFsRnJvbSA9IGZyb207XG5cblxuXHQgIGxldCB1cENvdW50ID0gMDtcblx0ICBsZXQgcmVtYWluaW5nUGF0aCA9ICcnO1xuXG5cdCAgd2hpbGUgKHRydWUpIHtcblx0ICAgIGlmICh0by5zdGFydHNXaXRoKGZyb20pKSB7XG5cdCAgICAgIC8vIG1hdGNoISByZWNvcmQgcmVzdC4uLj9cblx0ICAgICAgcmVtYWluaW5nUGF0aCA9IHRvLnNsaWNlKGZyb20ubGVuZ3RoKTtcblx0ICAgICAgYnJlYWs7XG5cdCAgICB9IC8vIEZJWE1FOiBCcmVhay90aHJvdyBpZiB3ZSBoaXQgYmFkIGVkZ2UgY2FzZSBvZiBubyBjb21tb24gcm9vdCFcblxuXG5cdCAgICBmcm9tID0gZGlybmFtZShzZXBhcmF0b3IsIGZyb20pO1xuXHQgICAgdXBDb3VudCsrO1xuXHQgIH0gLy8gcmVtb3ZlIGxlYWRpbmcgc2VwYXJhdG9yIGZyb20gcmVtYWluaW5nUGF0aCBpZiB0aGVyZSBpcyBhbnlcblxuXG5cdCAgaWYgKHJlbWFpbmluZ1BhdGgubGVuZ3RoID4gMCkge1xuXHQgICAgcmVtYWluaW5nUGF0aCA9IHJlbWFpbmluZ1BhdGguc2xpY2UoMSk7XG5cdCAgfVxuXG5cdCAgcmV0dXJuICgnLi4nICsgc2VwYXJhdG9yKS5yZXBlYXQodXBDb3VudCkgKyByZW1haW5pbmdQYXRoO1xuXHR9XG5cdC8qKlxuXHQgKiBUaGUgYHBhdGgucGFyc2UoKWAgbWV0aG9kIHJldHVybnMgYW4gb2JqZWN0IHdob3NlIHByb3BlcnRpZXMgcmVwcmVzZW50XG5cdCAqIHNpZ25pZmljYW50IGVsZW1lbnRzIG9mIHRoZSBwYXRoLiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZCxcblx0ICogc2VlIGBwYXRoLnNlcGAuXG5cdCAqXG5cdCAqIFRoZSByZXR1cm5lZCBvYmplY3Qgd2lsbCBoYXZlIHRoZSBmb2xsb3dpbmcgcHJvcGVydGllczpcblx0ICpcblx0ICogLSBkaXIgPHN0cmluZz5cblx0ICogLSByb290IDxzdHJpbmc+XG5cdCAqIC0gYmFzZSA8c3RyaW5nPlxuXHQgKiAtIG5hbWUgPHN0cmluZz5cblx0ICogLSBleHQgPHN0cmluZz5cblx0ICogQHBhcmFtICB7c3RyaW5nfSBzZXBhcmF0b3IgcGxhdGZvcm0tc3BlY2lmaWMgZmlsZSBzZXBhcmF0b3Jcblx0ICogQHBhcmFtICB7c3RyaW5nfSBmaWxlcGF0aCBbZGVzY3JpcHRpb25dXG5cdCAqIEByZXR1cm4ge29iamVjdH1cblx0ICovXG5cblxuXHRmdW5jdGlvbiBwYXJzZShzZXBhcmF0b3IsIGZpbGVwYXRoKSB7XG5cdCAgYXNzZXJ0QXJndW1lbnRUeXBlKGZpbGVwYXRoLCAncGF0aCcsICdzdHJpbmcnKTtcblx0ICBjb25zdCByZXN1bHQgPSB7XG5cdCAgICByb290OiAnJyxcblx0ICAgIGRpcjogJycsXG5cdCAgICBiYXNlOiAnJyxcblx0ICAgIGV4dDogJycsXG5cdCAgICBuYW1lOiAnJ1xuXHQgIH07XG5cdCAgY29uc3QgbGVuZ3RoID0gZmlsZXBhdGgubGVuZ3RoO1xuXG5cdCAgaWYgKGxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0ICB9IC8vIENoZWF0IGFuZCBqdXN0IGNhbGwgb3VyIG90aGVyIG1ldGhvZHMgZm9yIGRpcm5hbWUvYmFzZW5hbWUvZXh0bmFtZT9cblxuXG5cdCAgcmVzdWx0LmJhc2UgPSBiYXNlbmFtZShzZXBhcmF0b3IsIGZpbGVwYXRoKTtcblx0ICByZXN1bHQuZXh0ID0gZXh0bmFtZShzZXBhcmF0b3IsIHJlc3VsdC5iYXNlKTtcblx0ICBjb25zdCBiYXNlTGVuZ3RoID0gcmVzdWx0LmJhc2UubGVuZ3RoO1xuXHQgIHJlc3VsdC5uYW1lID0gcmVzdWx0LmJhc2Uuc2xpY2UoMCwgYmFzZUxlbmd0aCAtIHJlc3VsdC5leHQubGVuZ3RoKTtcblx0ICBjb25zdCB0b1N1YnRyYWN0ID0gYmFzZUxlbmd0aCA9PT0gMCA/IDAgOiBiYXNlTGVuZ3RoICsgMTtcblx0ICByZXN1bHQuZGlyID0gZmlsZXBhdGguc2xpY2UoMCwgZmlsZXBhdGgubGVuZ3RoIC0gdG9TdWJ0cmFjdCk7IC8vIGRyb3AgdHJhaWxpbmcgc2VwYXJhdG9yIVxuXG5cdCAgY29uc3QgZmlyc3RDaGFyQ29kZSA9IGZpbGVwYXRoLmNoYXJDb2RlQXQoMCk7IC8vIGJvdGggd2luMzIgYW5kIFBPU0lYIHJldHVybiAnLycgcm9vdFxuXG5cdCAgaWYgKGZpcnN0Q2hhckNvZGUgPT09IEZPUldBUkRfU0xBU0gpIHtcblx0ICAgIHJlc3VsdC5yb290ID0gJy8nO1xuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0ICB9IC8vIHdlJ3JlIGRvbmUgd2l0aCBQT1NJWC4uLlxuXG5cblx0ICBpZiAoc2VwYXJhdG9yID09PSAnLycpIHtcblx0ICAgIHJldHVybiByZXN1bHQ7XG5cdCAgfSAvLyBmb3Igd2luMzIuLi5cblxuXG5cdCAgaWYgKGZpcnN0Q2hhckNvZGUgPT09IEJBQ0tXQVJEX1NMQVNIKSB7XG5cdCAgICAvLyBGSVhNRTogSGFuZGxlIFVOQyBwYXRocyBsaWtlICdcXFxcXFxcXGhvc3QtbmFtZVxcXFxyZXNvdXJjZVxcXFxmaWxlX3BhdGgnXG5cdCAgICAvLyBuZWVkIHRvIHJldGFpbiAnXFxcXFxcXFxob3N0LW5hbWVcXFxccmVzb3VyY2VcXFxcJyBhcyByb290IGluIHRoYXQgY2FzZSFcblx0ICAgIHJlc3VsdC5yb290ID0gJ1xcXFwnO1xuXHQgICAgcmV0dXJuIHJlc3VsdDtcblx0ICB9IC8vIGNoZWNrIGZvciBDOiBzdHlsZSByb290XG5cblxuXHQgIGlmIChsZW5ndGggPiAxICYmIGlzV2luZG93c0RldmljZU5hbWUoZmlyc3RDaGFyQ29kZSkgJiYgZmlsZXBhdGguY2hhckF0KDEpID09PSAnOicpIHtcblx0ICAgIGlmIChsZW5ndGggPiAyKSB7XG5cdCAgICAgIC8vIGlzIGl0IGxpa2UgQzpcXFxcP1xuXHQgICAgICBjb25zdCB0aGlyZENoYXJDb2RlID0gZmlsZXBhdGguY2hhckNvZGVBdCgyKTtcblxuXHQgICAgICBpZiAodGhpcmRDaGFyQ29kZSA9PT0gRk9SV0FSRF9TTEFTSCB8fCB0aGlyZENoYXJDb2RlID09PSBCQUNLV0FSRF9TTEFTSCkge1xuXHQgICAgICAgIHJlc3VsdC5yb290ID0gZmlsZXBhdGguc2xpY2UoMCwgMyk7XG5cdCAgICAgICAgcmV0dXJuIHJlc3VsdDtcblx0ICAgICAgfVxuXHQgICAgfSAvLyBub3BlLCBqdXN0IEM6LCBubyB0cmFpbGluZyBzZXBhcmF0b3JcblxuXG5cdCAgICByZXN1bHQucm9vdCA9IGZpbGVwYXRoLnNsaWNlKDAsIDIpO1xuXHQgIH1cblxuXHQgIHJldHVybiByZXN1bHQ7XG5cdH1cblx0LyoqXG5cdCAqIFRoZSBgcGF0aC5mb3JtYXQoKWAgbWV0aG9kIHJldHVybnMgYSBwYXRoIHN0cmluZyBmcm9tIGFuIG9iamVjdC4gVGhpcyBpcyB0aGVcblx0ICogb3Bwb3NpdGUgb2YgYHBhdGgucGFyc2UoKWAuXG5cdCAqXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gc2VwYXJhdG9yIHBsYXRmb3JtLXNwZWNpZmljIGZpbGUgc2VwYXJhdG9yXG5cdCAqIEBwYXJhbSAge29iamVjdH0gcGF0aE9iamVjdCBvYmplY3Qgb2YgZm9ybWF0IHJldHVybmVkIGJ5IGBwYXRoLnBhcnNlKClgXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gcGF0aE9iamVjdC5kaXIgZGlyZWN0b3J5IG5hbWVcblx0ICogQHBhcmFtICB7c3RyaW5nfSBwYXRoT2JqZWN0LnJvb3QgZmlsZSByb290IGRpciwgaWdub3JlZCBpZiBgcGF0aE9iamVjdC5kaXJgIGlzIHByb3ZpZGVkXG5cdCAqIEBwYXJhbSAge3N0cmluZ30gcGF0aE9iamVjdC5iYXNlIGZpbGUgYmFzZW5hbWVcblx0ICogQHBhcmFtICB7c3RyaW5nfSBwYXRoT2JqZWN0Lm5hbWUgYmFzZW5hbWUgbWludXMgZXh0ZW5zaW9uLCBpZ25vcmVkIGlmIGBwYXRoT2JqZWN0LmJhc2VgIGV4aXN0c1xuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IHBhdGhPYmplY3QuZXh0IGZpbGUgZXh0ZW5zaW9uLCBpZ25vcmVkIGlmIGBwYXRoT2JqZWN0LmJhc2VgIGV4aXN0c1xuXHQgKiBAcmV0dXJuIHtzdHJpbmd9XG5cdCAqL1xuXG5cblx0ZnVuY3Rpb24gZm9ybWF0KHNlcGFyYXRvciwgcGF0aE9iamVjdCkge1xuXHQgIGFzc2VydEFyZ3VtZW50VHlwZShwYXRoT2JqZWN0LCAncGF0aE9iamVjdCcsICdvYmplY3QnKTtcblx0ICBjb25zdCBiYXNlID0gcGF0aE9iamVjdC5iYXNlIHx8IGAke3BhdGhPYmplY3QubmFtZSB8fCAnJ30ke3BhdGhPYmplY3QuZXh0IHx8ICcnfWA7IC8vIGFwcGVuZCBiYXNlIHRvIHJvb3QgaWYgYGRpcmAgd2Fzbid0IHNwZWNpZmllZCwgb3IgaWZcblx0ICAvLyBkaXIgaXMgdGhlIHJvb3RcblxuXHQgIGlmICghcGF0aE9iamVjdC5kaXIgfHwgcGF0aE9iamVjdC5kaXIgPT09IHBhdGhPYmplY3Qucm9vdCkge1xuXHQgICAgcmV0dXJuIGAke3BhdGhPYmplY3Qucm9vdCB8fCAnJ30ke2Jhc2V9YDtcblx0ICB9IC8vIGNvbWJpbmUgZGlyICsgLyArIGJhc2VcblxuXG5cdCAgcmV0dXJuIGAke3BhdGhPYmplY3QuZGlyfSR7c2VwYXJhdG9yfSR7YmFzZX1gO1xuXHR9XG5cdC8qKlxuXHQgKiBPbiBXaW5kb3dzIHN5c3RlbXMgb25seSwgcmV0dXJucyBhbiBlcXVpdmFsZW50IG5hbWVzcGFjZS1wcmVmaXhlZCBwYXRoIGZvclxuXHQgKiB0aGUgZ2l2ZW4gcGF0aC4gSWYgcGF0aCBpcyBub3QgYSBzdHJpbmcsIHBhdGggd2lsbCBiZSByZXR1cm5lZCB3aXRob3V0IG1vZGlmaWNhdGlvbnMuXG5cdCAqIFNlZSBodHRwczovL2RvY3MubWljcm9zb2Z0LmNvbS9lbi11cy93aW5kb3dzL2Rlc2t0b3AvRmlsZUlPL25hbWluZy1hLWZpbGUjbmFtZXNwYWNlc1xuXHQgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVwYXRoIFtkZXNjcmlwdGlvbl1cblx0ICogQHJldHVybiB7c3RyaW5nfSAgICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAqL1xuXG5cblx0ZnVuY3Rpb24gdG9OYW1lc3BhY2VkUGF0aChmaWxlcGF0aCkge1xuXHQgIGlmICh0eXBlb2YgZmlsZXBhdGggIT09ICdzdHJpbmcnKSB7XG5cdCAgICByZXR1cm4gZmlsZXBhdGg7XG5cdCAgfVxuXG5cdCAgaWYgKGZpbGVwYXRoLmxlbmd0aCA9PT0gMCkge1xuXHQgICAgcmV0dXJuICcnO1xuXHQgIH1cblxuXHQgIGNvbnN0IHJlc29sdmVkUGF0aCA9IHJlc29sdmUoJ1xcXFwnLCBbZmlsZXBhdGhdKTtcblx0ICBjb25zdCBsZW5ndGggPSByZXNvbHZlZFBhdGgubGVuZ3RoO1xuXG5cdCAgaWYgKGxlbmd0aCA8IDIpIHtcblx0ICAgIC8vIG5lZWQgJ1xcXFxcXFxcJyBvciAnQzonIG1pbmltdW1cblx0ICAgIHJldHVybiBmaWxlcGF0aDtcblx0ICB9XG5cblx0ICBjb25zdCBmaXJzdENoYXJDb2RlID0gcmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMCk7IC8vIGlmIHN0YXJ0IHdpdGggJ1xcXFxcXFxcJywgcHJlZml4IHdpdGggVU5DIHJvb3QsIGRyb3AgdGhlIHNsYXNoZXNcblxuXHQgIGlmIChmaXJzdENoYXJDb2RlID09PSBCQUNLV0FSRF9TTEFTSCAmJiByZXNvbHZlZFBhdGguY2hhckF0KDEpID09PSAnXFxcXCcpIHtcblx0ICAgIC8vIHJldHVybiBhcy1pcyBpZiBpdCdzIGFuIGFyZWFkeSBsb25nIHBhdGggKCdcXFxcXFxcXD9cXFxcJyBvciAnXFxcXFxcXFwuXFxcXCcgcHJlZml4KVxuXHQgICAgaWYgKGxlbmd0aCA+PSAzKSB7XG5cdCAgICAgIGNvbnN0IHRoaXJkQ2hhciA9IHJlc29sdmVkUGF0aC5jaGFyQXQoMik7XG5cblx0ICAgICAgaWYgKHRoaXJkQ2hhciA9PT0gJz8nIHx8IHRoaXJkQ2hhciA9PT0gJy4nKSB7XG5cdCAgICAgICAgcmV0dXJuIGZpbGVwYXRoO1xuXHQgICAgICB9XG5cdCAgICB9XG5cblx0ICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXFVOQ1xcXFwnICsgcmVzb2x2ZWRQYXRoLnNsaWNlKDIpO1xuXHQgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlTmFtZShmaXJzdENoYXJDb2RlKSAmJiByZXNvbHZlZFBhdGguY2hhckF0KDEpID09PSAnOicpIHtcblx0ICAgIHJldHVybiAnXFxcXFxcXFw/XFxcXCcgKyByZXNvbHZlZFBhdGg7XG5cdCAgfVxuXG5cdCAgcmV0dXJuIGZpbGVwYXRoO1xuXHR9XG5cblx0Y29uc3QgV2luMzJQYXRoID0ge1xuXHQgIHNlcDogJ1xcXFwnLFxuXHQgIGRlbGltaXRlcjogJzsnLFxuXHQgIGJhc2VuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgsIGV4dCkge1xuXHQgICAgcmV0dXJuIGJhc2VuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCwgZXh0KTtcblx0ICB9LFxuXHQgIG5vcm1hbGl6ZTogZnVuY3Rpb24gKGZpbGVwYXRoKSB7XG5cdCAgICByZXR1cm4gbm9ybWFsaXplKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBqb2luOiBmdW5jdGlvbiAoLi4ucGF0aHMpIHtcblx0ICAgIHJldHVybiBqb2luKHRoaXMuc2VwLCBwYXRocyk7XG5cdCAgfSxcblx0ICBleHRuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBleHRuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBkaXJuYW1lOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBkaXJuYW1lKHRoaXMuc2VwLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICBpc0Fic29sdXRlOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBpc0Fic29sdXRlKGZhbHNlLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICByZWxhdGl2ZTogZnVuY3Rpb24gKGZyb20sIHRvKSB7XG5cdCAgICByZXR1cm4gcmVsYXRpdmUodGhpcy5zZXAsIGZyb20sIHRvKTtcblx0ICB9LFxuXHQgIHJlc29sdmU6IGZ1bmN0aW9uICguLi5wYXRocykge1xuXHQgICAgcmV0dXJuIHJlc29sdmUodGhpcy5zZXAsIHBhdGhzKTtcblx0ICB9LFxuXHQgIHBhcnNlOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBwYXJzZSh0aGlzLnNlcCwgZmlsZXBhdGgpO1xuXHQgIH0sXG5cdCAgZm9ybWF0OiBmdW5jdGlvbiAocGF0aE9iamVjdCkge1xuXHQgICAgcmV0dXJuIGZvcm1hdCh0aGlzLnNlcCwgcGF0aE9iamVjdCk7XG5cdCAgfSxcblx0ICB0b05hbWVzcGFjZWRQYXRoOiB0b05hbWVzcGFjZWRQYXRoXG5cdH07XG5cdGNvbnN0IFBvc2l4UGF0aCA9IHtcblx0ICBzZXA6ICcvJyxcblx0ICBkZWxpbWl0ZXI6ICc6Jyxcblx0ICBiYXNlbmFtZTogZnVuY3Rpb24gKGZpbGVwYXRoLCBleHQpIHtcblx0ICAgIHJldHVybiBiYXNlbmFtZSh0aGlzLnNlcCwgZmlsZXBhdGgsIGV4dCk7XG5cdCAgfSxcblx0ICBub3JtYWxpemU6IGZ1bmN0aW9uIChmaWxlcGF0aCkge1xuXHQgICAgcmV0dXJuIG5vcm1hbGl6ZSh0aGlzLnNlcCwgZmlsZXBhdGgpO1xuXHQgIH0sXG5cdCAgam9pbjogZnVuY3Rpb24gKC4uLnBhdGhzKSB7XG5cdCAgICByZXR1cm4gam9pbih0aGlzLnNlcCwgcGF0aHMpO1xuXHQgIH0sXG5cdCAgZXh0bmFtZTogZnVuY3Rpb24gKGZpbGVwYXRoKSB7XG5cdCAgICByZXR1cm4gZXh0bmFtZSh0aGlzLnNlcCwgZmlsZXBhdGgpO1xuXHQgIH0sXG5cdCAgZGlybmFtZTogZnVuY3Rpb24gKGZpbGVwYXRoKSB7XG5cdCAgICByZXR1cm4gZGlybmFtZSh0aGlzLnNlcCwgZmlsZXBhdGgpO1xuXHQgIH0sXG5cdCAgaXNBYnNvbHV0ZTogZnVuY3Rpb24gKGZpbGVwYXRoKSB7XG5cdCAgICByZXR1cm4gaXNBYnNvbHV0ZSh0cnVlLCBmaWxlcGF0aCk7XG5cdCAgfSxcblx0ICByZWxhdGl2ZTogZnVuY3Rpb24gKGZyb20sIHRvKSB7XG5cdCAgICByZXR1cm4gcmVsYXRpdmUodGhpcy5zZXAsIGZyb20sIHRvKTtcblx0ICB9LFxuXHQgIHJlc29sdmU6IGZ1bmN0aW9uICguLi5wYXRocykge1xuXHQgICAgcmV0dXJuIHJlc29sdmUodGhpcy5zZXAsIHBhdGhzKTtcblx0ICB9LFxuXHQgIHBhcnNlOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBwYXJzZSh0aGlzLnNlcCwgZmlsZXBhdGgpO1xuXHQgIH0sXG5cdCAgZm9ybWF0OiBmdW5jdGlvbiAocGF0aE9iamVjdCkge1xuXHQgICAgcmV0dXJuIGZvcm1hdCh0aGlzLnNlcCwgcGF0aE9iamVjdCk7XG5cdCAgfSxcblx0ICB0b05hbWVzcGFjZWRQYXRoOiBmdW5jdGlvbiAoZmlsZXBhdGgpIHtcblx0ICAgIHJldHVybiBmaWxlcGF0aDsgLy8gbm8tb3Bcblx0ICB9XG5cdH07XG5cdGNvbnN0IHBhdGggPSBQb3NpeFBhdGg7XG5cdHBhdGgud2luMzIgPSBXaW4zMlBhdGg7XG5cdHBhdGgucG9zaXggPSBQb3NpeFBhdGg7XG5cblx0LyoqXG5cdCAqIEFwcGNlbGVyYXRvciBUaXRhbml1bSBNb2JpbGVcblx0ICogQ29weXJpZ2h0IChjKSAyMDExLVByZXNlbnQgYnkgQXBwY2VsZXJhdG9yLCBJbmMuIEFsbCBSaWdodHMgUmVzZXJ2ZWQuXG5cdCAqIExpY2Vuc2VkIHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgQXBhY2hlIFB1YmxpYyBMaWNlbnNlXG5cdCAqIFBsZWFzZSBzZWUgdGhlIExJQ0VOU0UgaW5jbHVkZWQgd2l0aCB0aGlzIGRpc3RyaWJ1dGlvbiBmb3IgZGV0YWlscy5cblx0ICovXG5cblx0LyoqXG5cdCAqIEdlbmVyYXRlcyBhIHdyYXBwZWQgaW52b2tlciBmdW5jdGlvbiBmb3IgYSBzcGVjaWZpYyBBUElcblx0ICogVGhpcyBsZXRzIHVzIHBhc3MgaW4gY29udGV4dC1zcGVjaWZpYyBkYXRhIHRvIGEgZnVuY3Rpb25cblx0ICogZGVmaW5lZCBpbiBhbiBBUEkgbmFtZXNwYWNlIChpLmUuIG9uIGEgbW9kdWxlKVxuXHQgKlxuXHQgKiBXZSB1c2UgdGhpcyBmb3IgY3JlYXRlIG1ldGhvZHMsIGFuZCBvdGhlciBBUElzIHRoYXQgdGFrZVxuXHQgKiBhIEtyb2xsSW52b2NhdGlvbiBvYmplY3QgYXMgdGhlaXIgZmlyc3QgYXJndW1lbnQgaW4gSmF2YVxuXHQgKlxuXHQgKiBGb3IgZXhhbXBsZSwgYW4gaW52b2tlciBmb3IgYSBcImNyZWF0ZVwiIG1ldGhvZCBtaWdodCBsb29rXG5cdCAqIHNvbWV0aGluZyBsaWtlIHRoaXM6XG5cdCAqXG5cdCAqICAgICBmdW5jdGlvbiBjcmVhdGVWaWV3KHNvdXJjZVVybCwgb3B0aW9ucykge1xuXHQgKiAgICAgICAgIHZhciB2aWV3ID0gbmV3IFZpZXcob3B0aW9ucyk7XG5cdCAqICAgICAgICAgdmlldy5zb3VyY2VVcmwgPSBzb3VyY2VVcmw7XG5cdCAqICAgICAgICAgcmV0dXJuIHZpZXc7XG5cdCAqICAgICB9XG5cdCAqXG5cdCAqIEFuZCB0aGUgY29ycmVzcG9uZGluZyBpbnZva2VyIGZvciBhcHAuanMgd291bGQgbG9vayBsaWtlOlxuXHQgKlxuXHQgKiAgICAgVUkuY3JlYXRlVmlldyA9IGZ1bmN0aW9uKCkge1xuXHQgKiAgICAgICAgIHJldHVybiBjcmVhdGVWaWV3KFwiYXBwOi8vYXBwLmpzXCIsIGFyZ3VtZW50c1swXSk7XG5cdCAqICAgICB9XG5cdCAqXG5cdCAqIHdyYXBwZXJBUEk6IFRoZSBzY29wZSBzcGVjaWZpYyBBUEkgKG1vZHVsZSkgd3JhcHBlclxuXHQgKiByZWFsQVBJOiBUaGUgYWN0dWFsIG1vZHVsZSBpbXBsZW1lbnRhdGlvblxuXHQgKiBhcGlOYW1lOiBUaGUgdG9wIGxldmVsIEFQSSBuYW1lIG9mIHRoZSByb290IG1vZHVsZVxuXHQgKiBpbnZvY2F0aW9uQVBJOiBUaGUgYWN0dWFsIEFQSSB0byBnZW5lcmF0ZSBhbiBpbnZva2VyIGZvclxuXHQgKiBzY29wZVZhcnM6IEEgbWFwIHRoYXQgaXMgcGFzc2VkIGludG8gZWFjaCBpbnZva2VyXG5cdCAqL1xuXG5cdC8qKlxuXHQgKiBAcGFyYW0ge29iamVjdH0gd3JhcHBlckFQSSBlLmcuIFRpdGFuaXVtV3JhcHBlclxuXHQgKiBAcGFyYW0ge29iamVjdH0gcmVhbEFQSSBlLmcuIFRpdGFuaXVtXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBhcGlOYW1lIGUuZy4gJ1RpdGFuaXVtJ1xuXHQgKiBAcGFyYW0ge29iamVjdH0gaW52b2NhdGlvbkFQSSBkZXRhaWxzIG9uIHRoZSBhcGkgd2UncmUgd3JhcHBpbmdcblx0ICogQHBhcmFtIHtzdHJpbmd9IGludm9jYXRpb25BUEkubmFtZXNwYWNlIHRoZSBuYW1lc3BhY2Ugb2YgdGhlIHByb3h5IHdoZXJlIG1ldGhvZCBoYW5ncyAody9vICdUaS4nIHByZWZpeCkgZS5nLiAnRmlsZXN5c3RlbScgb3IgJ1VJLkFuZHJvaWQnXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBpbnZvY2F0aW9uQVBJLmFwaSB0aGUgbWV0aG9kIG5hbWUgZS5nLiAnb3BlbkZpbGUnIG9yICdjcmVhdGVTZWFyY2hWaWV3J1xuXHQgKiBAcGFyYW0ge29iamVjdH0gc2NvcGVWYXJzIGhvbGRlciBmb3IgY29udGV4dCBzcGVjaWZpYyB2YWx1ZXMgKGJhc2ljYWxseSBqdXN0IHdyYXBzIHNvdXJjZVVybClcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNjb3BlVmFycy5zb3VyY2VVcmwgc291cmNlIFVSTCBvZiBqcyBmaWxlIGVudHJ5IHBvaW50XG5cdCAqIEBwYXJhbSB7TW9kdWxlfSBbc2NvcGVWYXJzLm1vZHVsZV0gbW9kdWxlXG5cdCAqL1xuXHRmdW5jdGlvbiBnZW5JbnZva2VyKHdyYXBwZXJBUEksIHJlYWxBUEksIGFwaU5hbWUsIGludm9jYXRpb25BUEksIHNjb3BlVmFycykge1xuXHQgIGxldCBhcGlOYW1lc3BhY2UgPSB3cmFwcGVyQVBJO1xuXHQgIGNvbnN0IG5hbWVzcGFjZSA9IGludm9jYXRpb25BUEkubmFtZXNwYWNlO1xuXG5cdCAgaWYgKG5hbWVzcGFjZSAhPT0gYXBpTmFtZSkge1xuXHQgICAgY29uc3QgbmFtZXMgPSBuYW1lc3BhY2Uuc3BsaXQoJy4nKTtcblxuXHQgICAgZm9yIChjb25zdCBuYW1lIG9mIG5hbWVzKSB7XG5cdCAgICAgIGxldCBhcGk7IC8vIENyZWF0ZSBhIG1vZHVsZSB3cmFwcGVyIG9ubHkgaWYgaXQgaGFzbid0IGJlZW4gd3JhcHBlZCBhbHJlYWR5LlxuXG5cdCAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwoYXBpTmFtZXNwYWNlLCBuYW1lKSkge1xuXHQgICAgICAgIGFwaSA9IGFwaU5hbWVzcGFjZVtuYW1lXTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBmdW5jdGlvbiBTYW5kYm94QVBJKCkge1xuXHQgICAgICAgICAgY29uc3QgcHJvdG8gPSBPYmplY3QuZ2V0UHJvdG90eXBlT2YodGhpcyk7XG5cdCAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkodGhpcywgJ19ldmVudHMnLCB7XG5cdCAgICAgICAgICAgIGdldDogZnVuY3Rpb24gKCkge1xuXHQgICAgICAgICAgICAgIHJldHVybiBwcm90by5fZXZlbnRzO1xuXHQgICAgICAgICAgICB9LFxuXHQgICAgICAgICAgICBzZXQ6IGZ1bmN0aW9uICh2YWx1ZSkge1xuXHQgICAgICAgICAgICAgIHByb3RvLl9ldmVudHMgPSB2YWx1ZTtcblx0ICAgICAgICAgICAgfVxuXHQgICAgICAgICAgfSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgU2FuZGJveEFQSS5wcm90b3R5cGUgPSBhcGlOYW1lc3BhY2VbbmFtZV07XG5cdCAgICAgICAgYXBpID0gbmV3IFNhbmRib3hBUEkoKTtcblx0ICAgICAgICBhcGlOYW1lc3BhY2VbbmFtZV0gPSBhcGk7XG5cdCAgICAgIH1cblxuXHQgICAgICBhcGlOYW1lc3BhY2UgPSBhcGk7XG5cdCAgICAgIHJlYWxBUEkgPSByZWFsQVBJW25hbWVdO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIGxldCBkZWxlZ2F0ZSA9IHJlYWxBUElbaW52b2NhdGlvbkFQSS5hcGldOyAvLyBUaGVzZSBpbnZva2VycyBmb3JtIGEgY2FsbCBoaWVyYXJjaHkgc28gd2UgbmVlZCB0b1xuXHQgIC8vIHByb3ZpZGUgYSB3YXkgYmFjayB0byB0aGUgYWN0dWFsIHJvb3QgVGl0YW5pdW0gLyBhY3R1YWwgaW1wbC5cblxuXHQgIHdoaWxlIChkZWxlZ2F0ZS5fX2RlbGVnYXRlX18pIHtcblx0ICAgIGRlbGVnYXRlID0gZGVsZWdhdGUuX19kZWxlZ2F0ZV9fO1xuXHQgIH1cblxuXHQgIGFwaU5hbWVzcGFjZVtpbnZvY2F0aW9uQVBJLmFwaV0gPSBjcmVhdGVJbnZva2VyKHJlYWxBUEksIGRlbGVnYXRlLCBzY29wZVZhcnMpO1xuXHR9XG5cblx0dmFyIGdlbkludm9rZXJfMSA9IGdlbkludm9rZXI7XG5cdC8qKlxuXHQgKiBDcmVhdGVzIGFuZCByZXR1cm5zIGEgc2luZ2xlIGludm9rZXIgZnVuY3Rpb24gdGhhdCB3cmFwc1xuXHQgKiBhIGRlbGVnYXRlIGZ1bmN0aW9uLCB0aGlzT2JqLCBhbmQgc2NvcGVWYXJzXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSB0aGlzT2JqIFRoZSBgdGhpc2Agb2JqZWN0IHRvIHVzZSB3aGVuIGludm9raW5nIHRoZSBgZGVsZWdhdGVgIGZ1bmN0aW9uXG5cdCAqIEBwYXJhbSB7ZnVuY3Rpb259IGRlbGVnYXRlIFRoZSBmdW5jdGlvbiB0byB3cmFwL2RlbGVnYXRlIHRvIHVuZGVyIHRoZSBob29kXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBzY29wZVZhcnMgVGhlIHNjb3BlIHZhcmlhYmxlcyB0byBzcGxpY2UgaW50byB0aGUgYXJndW1lbnRzIHdoZW4gY2FsbGluZyB0aGUgZGVsZWdhdGVcblx0ICogQHBhcmFtIHtzdHJpbmd9IHNjb3BlVmFycy5zb3VyY2VVcmwgdGhlIG9ubHkgcmVhbCByZWxldmVudCBzY29wZSB2YXJpYWJsZSFcblx0ICogQHJldHVybiB7ZnVuY3Rpb259XG5cdCAqL1xuXG5cdGZ1bmN0aW9uIGNyZWF0ZUludm9rZXIodGhpc09iaiwgZGVsZWdhdGUsIHNjb3BlVmFycykge1xuXHQgIGNvbnN0IHVybEludm9rZXIgPSBmdW5jdGlvbiBpbnZva2VyKC4uLmFyZ3MpIHtcblx0ICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZnVuYy1zdHlsZVxuXHQgICAgYXJncy5zcGxpY2UoMCwgMCwgaW52b2tlci5fX3Njb3BlVmFyc19fKTtcblx0ICAgIHJldHVybiBkZWxlZ2F0ZS5hcHBseShpbnZva2VyLl9fdGhpc09ial9fLCBhcmdzKTtcblx0ICB9O1xuXG5cdCAgdXJsSW52b2tlci5fX2RlbGVnYXRlX18gPSBkZWxlZ2F0ZTtcblx0ICB1cmxJbnZva2VyLl9fdGhpc09ial9fID0gdGhpc09iajtcblx0ICB1cmxJbnZva2VyLl9fc2NvcGVWYXJzX18gPSBzY29wZVZhcnM7XG5cdCAgcmV0dXJuIHVybEludm9rZXI7XG5cdH1cblxuXHR2YXIgY3JlYXRlSW52b2tlcl8xID0gY3JlYXRlSW52b2tlcjtcblx0dmFyIGludm9rZXIgPSB7XG5cdCAgZ2VuSW52b2tlcjogZ2VuSW52b2tlcl8xLFxuXHQgIGNyZWF0ZUludm9rZXI6IGNyZWF0ZUludm9rZXJfMVxuXHR9O1xuXG5cdC8qKlxuXHQgKiBBcHBjZWxlcmF0b3IgVGl0YW5pdW0gTW9iaWxlXG5cdCAqIENvcHlyaWdodCAoYykgMjAxMS1QcmVzZW50IGJ5IEFwcGNlbGVyYXRvciwgSW5jLiBBbGwgUmlnaHRzIFJlc2VydmVkLlxuXHQgKiBMaWNlbnNlZCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEFwYWNoZSBQdWJsaWMgTGljZW5zZVxuXHQgKiBQbGVhc2Ugc2VlIHRoZSBMSUNFTlNFIGluY2x1ZGVkIHdpdGggdGhpcyBkaXN0cmlidXRpb24gZm9yIGRldGFpbHMuXG5cdCAqL1xuXG5cdGZ1bmN0aW9uIGJvb3RzdHJhcCQyKGdsb2JhbCwga3JvbGwpIHtcblx0ICBjb25zdCBhc3NldHMgPSBrcm9sbC5iaW5kaW5nKCdhc3NldHMnKTtcblx0ICBjb25zdCBTY3JpcHQgPSBrcm9sbC5iaW5kaW5nKCdldmFscycpLlNjcmlwdCA7XG5cdCAgLyoqXG5cdCAgICogVGhlIGxvYWRlZCBpbmRleC5qc29uIGZpbGUgZnJvbSB0aGUgYXBwLiBVc2VkIHRvIHN0b3JlIHRoZSBlbmNyeXB0ZWQgSlMgYXNzZXRzJ1xuXHQgICAqIGZpbGVuYW1lcy9vZmZzZXRzLlxuXHQgICAqL1xuXG5cdCAgbGV0IGZpbGVJbmRleDsgLy8gRklYTUU6IGZpeCBmaWxlIG5hbWUgcGFyaXR5IGJldHdlZW4gcGxhdGZvcm1zXG5cblx0ICBjb25zdCBJTkRFWF9KU09OID0gJ2luZGV4Lmpzb24nIDtcblxuXHQgIGNsYXNzIE1vZHVsZSB7XG5cdCAgICAvKipcblx0ICAgICAqIFtNb2R1bGUgZGVzY3JpcHRpb25dXG5cdCAgICAgKiBAcGFyYW0ge3N0cmluZ30gaWQgICAgICBtb2R1bGUgaWRcblx0ICAgICAqIEBwYXJhbSB7TW9kdWxlfSBwYXJlbnQgIHBhcmVudCBtb2R1bGVcblx0ICAgICAqL1xuXHQgICAgY29uc3RydWN0b3IoaWQsIHBhcmVudCkge1xuXHQgICAgICB0aGlzLmlkID0gaWQ7XG5cdCAgICAgIHRoaXMuZXhwb3J0cyA9IHt9O1xuXHQgICAgICB0aGlzLnBhcmVudCA9IHBhcmVudDtcblx0ICAgICAgdGhpcy5maWxlbmFtZSA9IG51bGw7XG5cdCAgICAgIHRoaXMubG9hZGVkID0gZmFsc2U7XG5cdCAgICAgIHRoaXMud3JhcHBlckNhY2hlID0ge307XG5cdCAgICAgIHRoaXMuaXNTZXJ2aWNlID0gZmFsc2U7IC8vIHRvZ2dsZWQgb24gaWYgdGhpcyBtb2R1bGUgaXMgdGhlIHNlcnZpY2UgZW50cnkgcG9pbnRcblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogQXR0ZW1wdHMgdG8gbG9hZCB0aGUgbW9kdWxlLiBJZiBubyBmaWxlIGlzIGZvdW5kXG5cdCAgICAgKiB3aXRoIHRoZSBwcm92aWRlZCBuYW1lIGFuIGV4Y2VwdGlvbiB3aWxsIGJlIHRocm93bi5cblx0ICAgICAqIE9uY2UgdGhlIGNvbnRlbnRzIG9mIHRoZSBmaWxlIGFyZSByZWFkLCBpdCBpcyBydW5cblx0ICAgICAqIGluIHRoZSBjdXJyZW50IGNvbnRleHQuIEEgc2FuZGJveCBpcyBjcmVhdGVkIGJ5XG5cdCAgICAgKiBleGVjdXRpbmcgdGhlIGNvZGUgaW5zaWRlIGEgd3JhcHBlciBmdW5jdGlvbi5cblx0ICAgICAqIFRoaXMgcHJvdmlkZXMgYSBzcGVlZCBib29zdCB2cyBjcmVhdGluZyBhIG5ldyBjb250ZXh0LlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgW2Rlc2NyaXB0aW9uXVxuXHQgICAgICogQHBhcmFtICB7U3RyaW5nfSBzb3VyY2UgICBbZGVzY3JpcHRpb25dXG5cdCAgICAgKiBAcmV0dXJucyB7dm9pZH1cblx0ICAgICAqL1xuXG5cblx0ICAgIGxvYWQoZmlsZW5hbWUsIHNvdXJjZSkge1xuXHQgICAgICBpZiAodGhpcy5sb2FkZWQpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ01vZHVsZSBhbHJlYWR5IGxvYWRlZC4nKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHRoaXMuZmlsZW5hbWUgPSBmaWxlbmFtZTtcblx0ICAgICAgdGhpcy5wYXRoID0gcGF0aC5kaXJuYW1lKGZpbGVuYW1lKTtcblx0ICAgICAgdGhpcy5wYXRocyA9IHRoaXMubm9kZU1vZHVsZXNQYXRocyh0aGlzLnBhdGgpO1xuXG5cdCAgICAgIGlmICghc291cmNlKSB7XG5cdCAgICAgICAgc291cmNlID0gYXNzZXRzLnJlYWRBc3NldChgUmVzb3VyY2VzJHtmaWxlbmFtZX1gICk7XG5cdCAgICAgIH0gLy8gU3RpY2sgaXQgaW4gdGhlIGNhY2hlXG5cblxuXHQgICAgICBNb2R1bGUuY2FjaGVbdGhpcy5maWxlbmFtZV0gPSB0aGlzO1xuXG5cdCAgICAgIHRoaXMuX3J1blNjcmlwdChzb3VyY2UsIHRoaXMuZmlsZW5hbWUpO1xuXG5cdCAgICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogR2VuZXJhdGVzIGEgY29udGV4dC1zcGVjaWZpYyBtb2R1bGUgd3JhcHBlciwgYW5kIHdyYXBzXG5cdCAgICAgKiBlYWNoIGludm9jYXRpb24gQVBJIGluIGFuIGV4dGVybmFsICgzcmQgcGFydHkpIG1vZHVsZVxuXHQgICAgICogU2VlIGludm9rZXIuanMgZm9yIG1vcmUgaW5mb1xuXHQgICAgICogQHBhcmFtICB7b2JqZWN0fSBleHRlcm5hbE1vZHVsZSBuYXRpdmUgbW9kdWxlIHByb3h5XG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHNvdXJjZVVybCAgICAgIHRoZSBjdXJyZW50IGpzIGZpbGUgdXJsXG5cdCAgICAgKiBAcmV0dXJuIHtvYmplY3R9ICAgICAgICAgICAgICAgIHdyYXBwZXIgYXJvdW5kIHRoZSBleHRlcm5hbE1vZHVsZVxuXHQgICAgICovXG5cblxuXHQgICAgY3JlYXRlTW9kdWxlV3JhcHBlcihleHRlcm5hbE1vZHVsZSwgc291cmNlVXJsKSB7XG5cdCAgICAgIC8vIFRoZSBtb2R1bGUgd3JhcHBlciBmb3J3YXJkcyBvbiB1c2luZyB0aGUgb3JpZ2luYWwgYXMgYSBwcm90b3R5cGVcblx0ICAgICAgZnVuY3Rpb24gTW9kdWxlV3JhcHBlcigpIHt9XG5cblx0ICAgICAgTW9kdWxlV3JhcHBlci5wcm90b3R5cGUgPSBleHRlcm5hbE1vZHVsZTtcblx0ICAgICAgY29uc3Qgd3JhcHBlciA9IG5ldyBNb2R1bGVXcmFwcGVyKCk7XG5cblx0ICAgICAge1xuXHQgICAgICAgIC8vIEFuZHJvaWQtc3BlY2lmaWMgcG9ydGlvbiFcblx0ICAgICAgICAvLyBIZXJlIHdlIHRha2UgdGhlIEFQSXMgZGVmaW5lZCBpbiB0aGUgYm9vdHN0cmFwLmpzXG5cdCAgICAgICAgLy8gYW5kIGVmZmVjdGl2ZWx5IGxhemlseSBob29rIHRoZW1cblx0ICAgICAgICAvLyBXZSBleHBsaWNpdGx5IGd1YXJkIHRoZSBjb2RlIHNvIGlPUyBkb2Vzbid0IGV2ZW4gdXNlL2luY2x1ZGUgdGhlIHJlZmVyZW5jZWQgaW52b2tlci5qcyBpbXBvcnRcblx0ICAgICAgICBjb25zdCBpbnZvY2F0aW9uQVBJcyA9IGV4dGVybmFsTW9kdWxlLmludm9jYXRpb25BUElzIHx8IFtdO1xuXG5cdCAgICAgICAgZm9yIChjb25zdCBhcGkgb2YgaW52b2NhdGlvbkFQSXMpIHtcblx0ICAgICAgICAgIGNvbnN0IGRlbGVnYXRlID0gZXh0ZXJuYWxNb2R1bGVbYXBpXTtcblxuXHQgICAgICAgICAgaWYgKCFkZWxlZ2F0ZSkge1xuXHQgICAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICAgIH1cblxuXHQgICAgICAgICAgd3JhcHBlclthcGldID0gaW52b2tlci5jcmVhdGVJbnZva2VyKGV4dGVybmFsTW9kdWxlLCBkZWxlZ2F0ZSwgbmV3IGtyb2xsLlNjb3BlVmFycyh7XG5cdCAgICAgICAgICAgIHNvdXJjZVVybFxuXHQgICAgICAgICAgfSkpO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHdyYXBwZXIuYWRkRXZlbnRMaXN0ZW5lciA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdCAgICAgICAgZXh0ZXJuYWxNb2R1bGUuYWRkRXZlbnRMaXN0ZW5lci5hcHBseShleHRlcm5hbE1vZHVsZSwgYXJncyk7XG5cdCAgICAgIH07XG5cblx0ICAgICAgd3JhcHBlci5yZW1vdmVFdmVudExpc3RlbmVyID0gZnVuY3Rpb24gKC4uLmFyZ3MpIHtcblx0ICAgICAgICBleHRlcm5hbE1vZHVsZS5yZW1vdmVFdmVudExpc3RlbmVyLmFwcGx5KGV4dGVybmFsTW9kdWxlLCBhcmdzKTtcblx0ICAgICAgfTtcblxuXHQgICAgICB3cmFwcGVyLmZpcmVFdmVudCA9IGZ1bmN0aW9uICguLi5hcmdzKSB7XG5cdCAgICAgICAgZXh0ZXJuYWxNb2R1bGUuZmlyZUV2ZW50LmFwcGx5KGV4dGVybmFsTW9kdWxlLCBhcmdzKTtcblx0ICAgICAgfTtcblxuXHQgICAgICByZXR1cm4gd3JhcHBlcjtcblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogVGFrZXMgYSBDb21tb25KUyBtb2R1bGUgYW5kIHVzZXMgaXQgdG8gZXh0ZW5kIGFuIGV4aXN0aW5nIGV4dGVybmFsL25hdGl2ZSBtb2R1bGUuIFRoZSBleHBvcnRzIGFyZSBhZGRlZCB0byB0aGUgZXh0ZXJuYWwgbW9kdWxlLlxuXHQgICAgICogQHBhcmFtICB7T2JqZWN0fSBleHRlcm5hbE1vZHVsZSBUaGUgZXh0ZXJuYWwvbmF0aXZlIG1vZHVsZSB3ZSdyZSBleHRlbmRpbmdcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gaWQgICAgICAgICAgICAgbW9kdWxlIGlkXG5cdCAgICAgKi9cblxuXG5cdCAgICBleHRlbmRNb2R1bGVXaXRoQ29tbW9uSnMoZXh0ZXJuYWxNb2R1bGUsIGlkKSB7XG5cdCAgICAgIGlmICgha3JvbGwuaXNFeHRlcm5hbENvbW1vbkpzTW9kdWxlKGlkKSkge1xuXHQgICAgICAgIHJldHVybjtcblx0ICAgICAgfSAvLyBMb2FkIHVuZGVyIGZha2UgbmFtZSwgb3IgdGhlIGNvbW1vbmpzIHNpZGUgb2YgdGhlIG5hdGl2ZSBtb2R1bGUgZ2V0cyBjYWNoZWQgaW4gcGxhY2Ugb2YgdGhlIG5hdGl2ZSBtb2R1bGUhXG5cdCAgICAgIC8vIFNlZSBUSU1PQi0yNDkzMlxuXG5cblx0ICAgICAgY29uc3QgZmFrZUlkID0gYCR7aWR9LmNvbW1vbmpzYDtcblx0ICAgICAgY29uc3QganNNb2R1bGUgPSBuZXcgTW9kdWxlKGZha2VJZCwgdGhpcyk7XG5cdCAgICAgIGpzTW9kdWxlLmxvYWQoZmFrZUlkLCBrcm9sbC5nZXRFeHRlcm5hbENvbW1vbkpzTW9kdWxlKGlkKSk7XG5cblx0ICAgICAgaWYgKGpzTW9kdWxlLmV4cG9ydHMpIHtcblx0ICAgICAgICBjb25zb2xlLnRyYWNlKGBFeHRlbmRpbmcgbmF0aXZlIG1vZHVsZSAnJHtpZH0nIHdpdGggdGhlIENvbW1vbkpTIG1vZHVsZSB0aGF0IHdhcyBwYWNrYWdlZCB3aXRoIGl0LmApO1xuXHQgICAgICAgIGtyb2xsLmV4dGVuZChleHRlcm5hbE1vZHVsZSwganNNb2R1bGUuZXhwb3J0cyk7XG5cdCAgICAgIH1cblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogTG9hZHMgYSBuYXRpdmUgLyBleHRlcm5hbCAoM3JkIHBhcnR5KSBtb2R1bGVcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gaWQgICAgICAgICAgICAgIG1vZHVsZSBpZFxuXHQgICAgICogQHBhcmFtICB7b2JqZWN0fSBleHRlcm5hbEJpbmRpbmcgZXh0ZXJuYWwgYmluZGluZyBvYmplY3Rcblx0ICAgICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgICAgICAgIFRoZSBleHBvcnRlZCBtb2R1bGVcblx0ICAgICAqL1xuXG5cblx0ICAgIGxvYWRFeHRlcm5hbE1vZHVsZShpZCwgZXh0ZXJuYWxCaW5kaW5nKSB7XG5cdCAgICAgIC8vIHRyeSB0byBnZXQgdGhlIGNhY2hlZCBtb2R1bGUuLi5cblx0ICAgICAgbGV0IGV4dGVybmFsTW9kdWxlID0gTW9kdWxlLmNhY2hlW2lkXTtcblxuXHQgICAgICBpZiAoIWV4dGVybmFsTW9kdWxlKSB7XG5cdCAgICAgICAgLy8gaU9TIGFuZCBBbmRyb2lkIGRpZmZlciBxdWl0ZSBhIGJpdCBoZXJlLlxuXHQgICAgICAgIC8vIFdpdGggaW9zLCB3ZSBzaG91bGQgYWxyZWFkeSBoYXZlIHRoZSBuYXRpdmUgbW9kdWxlIGxvYWRlZFxuXHQgICAgICAgIC8vIFRoZXJlJ3Mgbm8gc3BlY2lhbCBcImJvb3RzdHJhcC5qc1wiIGZpbGUgcGFja2FnZWQgd2l0aGluIGl0XG5cdCAgICAgICAgLy8gT24gQW5kcm9pZCwgd2UgbG9hZCBhIGJvb3RzdHJhcC5qcyBidW5kbGVkIHdpdGggdGhlIG1vZHVsZVxuXHQgICAgICAgIHtcblx0ICAgICAgICAgIC8vIFRoaXMgaXMgdGhlIHByb2Nlc3MgZm9yIEFuZHJvaWQsIGZpcnN0IGdyYWIgdGhlIGJvb3RzdHJhcCBzb3VyY2Vcblx0ICAgICAgICAgIGNvbnN0IHNvdXJjZSA9IGV4dGVybmFsQmluZGluZy5ib290c3RyYXA7IC8vIExvYWQgdGhlIG5hdGl2ZSBtb2R1bGUncyBib290c3RyYXAgSlNcblxuXHQgICAgICAgICAgY29uc3QgbW9kdWxlID0gbmV3IE1vZHVsZShpZCwgdGhpcyk7XG5cdCAgICAgICAgICBtb2R1bGUubG9hZChgJHtpZH0vYm9vdHN0cmFwLmpzYCwgc291cmNlKTsgLy8gQm9vdHN0cmFwIGFuZCBsb2FkIHRoZSBtb2R1bGUgdXNpbmcgdGhlIG5hdGl2ZSBiaW5kaW5nc1xuXG5cdCAgICAgICAgICBjb25zdCByZXN1bHQgPSBtb2R1bGUuZXhwb3J0cy5ib290c3RyYXAoZXh0ZXJuYWxCaW5kaW5nKTsgLy8gQ2FjaGUgdGhlIGV4dGVybmFsIG1vZHVsZSBpbnN0YW5jZSBhZnRlciBpdCdzIGJlZW4gbW9kaWZpZWQgYnkgaXQncyBib290c3RyYXAgc2NyaXB0XG5cblx0ICAgICAgICAgIGV4dGVybmFsTW9kdWxlID0gcmVzdWx0O1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghZXh0ZXJuYWxNb2R1bGUpIHtcblx0ICAgICAgICBjb25zb2xlLnRyYWNlKGBVbmFibGUgdG8gbG9hZCBleHRlcm5hbCBtb2R1bGU6ICR7aWR9YCk7XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgIH0gLy8gY2FjaGUgdGhlIGxvYWRlZCBuYXRpdmUgbW9kdWxlIChiZWZvcmUgd2UgZXh0ZW5kIGl0KVxuXG5cblx0ICAgICAgTW9kdWxlLmNhY2hlW2lkXSA9IGV4dGVybmFsTW9kdWxlOyAvLyBXZSBjYWNoZSBlYWNoIGNvbnRleHQtc3BlY2lmaWMgbW9kdWxlIHdyYXBwZXJcblx0ICAgICAgLy8gb24gdGhlIHBhcmVudCBtb2R1bGUsIHJhdGhlciB0aGFuIGluIHRoZSBNb2R1bGUuY2FjaGVcblxuXHQgICAgICBsZXQgd3JhcHBlciA9IHRoaXMud3JhcHBlckNhY2hlW2lkXTtcblxuXHQgICAgICBpZiAod3JhcHBlcikge1xuXHQgICAgICAgIHJldHVybiB3cmFwcGVyO1xuXHQgICAgICB9XG5cblx0ICAgICAgY29uc3Qgc291cmNlVXJsID0gYGFwcDovLyR7dGhpcy5maWxlbmFtZX1gOyAvLyBGSVhNRTogSWYgdGhpcy5maWxlbmFtZSBzdGFydHMgd2l0aCAnLycsIHdlIG5lZWQgdG8gZHJvcCBpdCwgSSB0aGluaz9cblxuXHQgICAgICB3cmFwcGVyID0gdGhpcy5jcmVhdGVNb2R1bGVXcmFwcGVyKGV4dGVybmFsTW9kdWxlLCBzb3VyY2VVcmwpOyAvLyBUaGVuIHdlIFwiZXh0ZW5kXCIgdGhlIEFQSS9tb2R1bGUgdXNpbmcgYW55IHNoaXBwZWQgSlMgY29kZSAoYXNzZXRzLzxtb2R1bGUuaWQ+LmpzKVxuXG5cdCAgICAgIHRoaXMuZXh0ZW5kTW9kdWxlV2l0aENvbW1vbkpzKHdyYXBwZXIsIGlkKTtcblx0ICAgICAgdGhpcy53cmFwcGVyQ2FjaGVbaWRdID0gd3JhcHBlcjtcblx0ICAgICAgcmV0dXJuIHdyYXBwZXI7XG5cdCAgICB9IC8vIFNlZSBodHRwczovL25vZGVqcy5vcmcvYXBpL21vZHVsZXMuaHRtbCNtb2R1bGVzX2FsbF90b2dldGhlclxuXG5cdCAgICAvKipcblx0ICAgICAqIFJlcXVpcmUgYW5vdGhlciBtb2R1bGUgYXMgYSBjaGlsZCBvZiB0aGlzIG1vZHVsZS5cblx0ICAgICAqIFRoaXMgcGFyZW50IG1vZHVsZSdzIHBhdGggaXMgdXNlZCBhcyB0aGUgYmFzZSBmb3IgcmVsYXRpdmUgcGF0aHNcblx0ICAgICAqIHdoZW4gbG9hZGluZyB0aGUgY2hpbGQuIFJldHVybnMgdGhlIGV4cG9ydHMgb2JqZWN0XG5cdCAgICAgKiBvZiB0aGUgY2hpbGQgbW9kdWxlLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gcmVxdWVzdCAgVGhlIHBhdGggdG8gdGhlIHJlcXVlc3RlZCBtb2R1bGVcblx0ICAgICAqIEByZXR1cm4ge09iamVjdH0gICAgICAgICAgVGhlIGxvYWRlZCBtb2R1bGVcblx0ICAgICAqL1xuXG5cblx0ICAgIHJlcXVpcmUocmVxdWVzdCkge1xuXHQgICAgICAvLyAyLiBJZiBYIGJlZ2lucyB3aXRoICcuLycgb3IgJy8nIG9yICcuLi8nXG5cdCAgICAgIGNvbnN0IHN0YXJ0ID0gcmVxdWVzdC5zdWJzdHJpbmcoMCwgMik7IC8vIGhhY2sgdXAgdGhlIHN0YXJ0IG9mIHRoZSBzdHJpbmcgdG8gY2hlY2sgcmVsYXRpdmUvYWJzb2x1dGUvXCJuYWtlZFwiIG1vZHVsZSBpZFxuXG5cdCAgICAgIGlmIChzdGFydCA9PT0gJy4vJyB8fCBzdGFydCA9PT0gJy4uJykge1xuXHQgICAgICAgIGNvbnN0IGxvYWRlZCA9IHRoaXMubG9hZEFzRmlsZU9yRGlyZWN0b3J5KHBhdGgubm9ybWFsaXplKHRoaXMucGF0aCArICcvJyArIHJlcXVlc3QpKTtcblxuXHQgICAgICAgIGlmIChsb2FkZWQpIHtcblx0ICAgICAgICAgIHJldHVybiBsb2FkZWQuZXhwb3J0cztcblx0ICAgICAgICB9IC8vIFJvb3QvYWJzb2x1dGUgcGF0aCAoaW50ZXJuYWxseSB3aGVuIHJlYWRpbmcgdGhlIGZpbGUsIHdlIHByZXBlbmQgXCJSZXNvdXJjZXMvXCIgYXMgcm9vdCBkaXIpXG5cblx0ICAgICAgfSBlbHNlIGlmIChyZXF1ZXN0LnN1YnN0cmluZygwLCAxKSA9PT0gJy8nKSB7XG5cdCAgICAgICAgY29uc3QgbG9hZGVkID0gdGhpcy5sb2FkQXNGaWxlT3JEaXJlY3RvcnkocGF0aC5ub3JtYWxpemUocmVxdWVzdCkpO1xuXG5cdCAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBEZXNwaXRlIGJlaW5nIHN0ZXAgMSBpbiBOb2RlLkpTIHBzdWVkby1jb2RlLCB3ZSBtb3ZlZCBpdCBkb3duIGhlcmUgYmVjYXVzZSB3ZSBkb24ndCBhbGxvdyBuYXRpdmUgbW9kdWxlc1xuXHQgICAgICAgIC8vIHRvIHN0YXJ0IHdpdGggJy4vJywgJy4uJyBvciAnLycgLSBzbyB0aGlzIGF2b2lkcyBhIGxvdCBvZiBtaXNzZXMgb24gcmVxdWlyZXMgc3RhcnRpbmcgdGhhdCB3YXlcblx0ICAgICAgICAvLyAxLiBJZiBYIGlzIGEgY29yZSBtb2R1bGUsXG5cdCAgICAgICAgbGV0IGxvYWRlZCA9IHRoaXMubG9hZENvcmVNb2R1bGUocmVxdWVzdCk7XG5cblx0ICAgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgICAvLyBhLiByZXR1cm4gdGhlIGNvcmUgbW9kdWxlXG5cdCAgICAgICAgICAvLyBiLiBTVE9QXG5cdCAgICAgICAgICByZXR1cm4gbG9hZGVkO1xuXHQgICAgICAgIH0gLy8gTG9vayBmb3IgQ29tbW9uSlMgbW9kdWxlXG5cblxuXHQgICAgICAgIGlmIChyZXF1ZXN0LmluZGV4T2YoJy8nKSA9PT0gLTEpIHtcblx0ICAgICAgICAgIC8vIEZvciBDb21tb25KUyB3ZSBuZWVkIHRvIGxvb2sgZm9yIG1vZHVsZS5pZC9tb2R1bGUuaWQuanMgZmlyc3QuLi5cblx0ICAgICAgICAgIGNvbnN0IGZpbGVuYW1lID0gYC8ke3JlcXVlc3R9LyR7cmVxdWVzdH0uanNgOyAvLyBPbmx5IGxvb2sgZm9yIHRoaXMgX2V4YWN0IGZpbGVfLiBETyBOT1QgQVBQRU5EIC5qcyBvciAuanNvbiB0byBpdCFcblxuXHQgICAgICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgICAgIGxvYWRlZCA9IHRoaXMubG9hZEphdmFzY3JpcHRUZXh0KGZpbGVuYW1lKTtcblxuXHQgICAgICAgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgICAgICAgcmV0dXJuIGxvYWRlZC5leHBvcnRzO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9IC8vIFRoZW4gdHJ5IG1vZHVsZS5pZCBhcyBkaXJlY3RvcnlcblxuXG5cdCAgICAgICAgICBsb2FkZWQgPSB0aGlzLmxvYWRBc0RpcmVjdG9yeShgLyR7cmVxdWVzdH1gKTtcblxuXHQgICAgICAgICAgaWYgKGxvYWRlZCkge1xuXHQgICAgICAgICAgICByZXR1cm4gbG9hZGVkLmV4cG9ydHM7XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfSAvLyBBbGxvdyBsb29raW5nIHRocm91Z2ggbm9kZV9tb2R1bGVzXG5cdCAgICAgICAgLy8gMy4gTE9BRF9OT0RFX01PRFVMRVMoWCwgZGlybmFtZShZKSlcblxuXG5cdCAgICAgICAgbG9hZGVkID0gdGhpcy5sb2FkTm9kZU1vZHVsZXMocmVxdWVzdCwgdGhpcy5wYXRocyk7XG5cblx0ICAgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgICByZXR1cm4gbG9hZGVkLmV4cG9ydHM7XG5cdCAgICAgICAgfSAvLyBGYWxsYmFjayB0byBvbGQgVGl0YW5pdW0gYmVoYXZpb3Igb2YgYXNzdW1pbmcgaXQncyBhY3R1YWxseSBhbiBhYnNvbHV0ZSBwYXRoXG5cdCAgICAgICAgLy8gV2UnZCBsaWtlIHRvIHdhcm4gdXNlcnMgYWJvdXQgbGVnYWN5IHN0eWxlIHJlcXVpcmUgc3ludGF4IHNvIHRoZXkgY2FuIHVwZGF0ZSwgYnV0IHRoZSBuZXcgc3ludGF4IGlzIG5vdCBiYWNrd2FyZHMgY29tcGF0aWJsZS5cblx0ICAgICAgICAvLyBTbyBmb3Igbm93LCBsZXQncyBqdXN0IGJlIHF1aXRlIGFib3V0IGl0LiBJbiBmdXR1cmUgdmVyc2lvbnMgb2YgdGhlIFNESyAoNy4wPykgd2Ugc2hvdWxkIHdhcm4gKG9uY2UgNS54IGlzIGVuZCBvZiBsaWZlIHNvIGJhY2t3YXJkcyBjb21wYXQgaXMgbm90IG5lY2Vzc2FyeSlcblx0ICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgbWF4LWxlblxuXHQgICAgICAgIC8vIGNvbnNvbGUud2FybihgcmVxdWlyZSBjYWxsZWQgd2l0aCB1bi1wcmVmaXhlZCBtb2R1bGUgaWQ6ICR7cmVxdWVzdH0sIHNob3VsZCBiZSBhIGNvcmUgb3IgQ29tbW9uSlMgbW9kdWxlLiBGYWxsaW5nIGJhY2sgdG8gb2xkIFRpIGJlaGF2aW9yIGFuZCBhc3N1bWluZyBpdCdzIGFuIGFic29sdXRlIHBhdGg6IC8ke3JlcXVlc3R9YCk7XG5cblxuXHQgICAgICAgIGxvYWRlZCA9IHRoaXMubG9hZEFzRmlsZU9yRGlyZWN0b3J5KHBhdGgubm9ybWFsaXplKGAvJHtyZXF1ZXN0fWApKTtcblxuXHQgICAgICAgIGlmIChsb2FkZWQpIHtcblx0ICAgICAgICAgIHJldHVybiBsb2FkZWQuZXhwb3J0cztcblx0ICAgICAgICB9XG5cdCAgICAgIH0gLy8gNC4gVEhST1cgXCJub3QgZm91bmRcIlxuXG5cblx0ICAgICAgdGhyb3cgbmV3IEVycm9yKGBSZXF1ZXN0ZWQgbW9kdWxlIG5vdCBmb3VuZDogJHtyZXF1ZXN0fWApOyAvLyBUT0RPIFNldCAnY29kZScgcHJvcGVydHkgdG8gJ01PRFVMRV9OT1RfRk9VTkQnIHRvIG1hdGNoIE5vZGU/XG5cdCAgICB9XG5cdCAgICAvKipcblx0ICAgICAqIExvYWRzIHRoZSBjb3JlIG1vZHVsZSBpZiBpdCBleGlzdHMuIElmIG5vdCwgcmV0dXJucyBudWxsLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gIGlkIFRoZSByZXF1ZXN0IG1vZHVsZSBpZFxuXHQgICAgICogQHJldHVybiB7T2JqZWN0fSAgICB0cnVlIGlmIHRoZSBtb2R1bGUgaWQgbWF0Y2hlcyBhIG5hdGl2ZSBvciBDb21tb25KUyBtb2R1bGUgaWQsIChvciBpdCdzIGZpcnN0IHBhdGggc2VnbWVudCBkb2VzKS5cblx0ICAgICAqL1xuXG5cblx0ICAgIGxvYWRDb3JlTW9kdWxlKGlkKSB7XG5cdCAgICAgIC8vIHNraXAgYmFkIGlkcywgcmVsYXRpdmUgaWRzLCBhYnNvbHV0ZSBpZHMuIFwibmF0aXZlXCIvXCJjb3JlXCIgbW9kdWxlcyBzaG91bGQgYmUgb2YgZm9ybSBcIm1vZHVsZS5pZFwiIG9yIFwibW9kdWxlLmlkL3N1Yi5maWxlLmpzXCJcblx0ICAgICAgaWYgKCFpZCB8fCBpZC5zdGFydHNXaXRoKCcuJykgfHwgaWQuc3RhcnRzV2l0aCgnLycpKSB7XG5cdCAgICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICAgIH0gLy8gY2hlY2sgaWYgd2UgaGF2ZSBhIGNhY2hlZCBjb3B5IG9mIHRoZSB3cmFwcGVyXG5cblxuXHQgICAgICBpZiAodGhpcy53cmFwcGVyQ2FjaGVbaWRdKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMud3JhcHBlckNhY2hlW2lkXTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGNvbnN0IHBhcnRzID0gaWQuc3BsaXQoJy8nKTtcblx0ICAgICAgY29uc3QgZXh0ZXJuYWxCaW5kaW5nID0ga3JvbGwuZXh0ZXJuYWxCaW5kaW5nKHBhcnRzWzBdKTtcblxuXHQgICAgICBpZiAoZXh0ZXJuYWxCaW5kaW5nKSB7XG5cdCAgICAgICAgaWYgKHBhcnRzLmxlbmd0aCA9PT0gMSkge1xuXHQgICAgICAgICAgLy8gVGhpcyBpcyB0aGUgXCJyb290XCIgb2YgYW4gZXh0ZXJuYWwgbW9kdWxlLiBJdCBjYW4gbG9vayBsaWtlOlxuXHQgICAgICAgICAgLy8gcmVxdWVzdChcImNvbS5leGFtcGxlLm15bW9kdWxlXCIpXG5cdCAgICAgICAgICAvLyBXZSBjYW4gbG9hZCBhbmQgcmV0dXJuIGl0IHJpZ2h0IGF3YXkgKGNhY2hpbmcgb2NjdXJzIGluIHRoZSBjYWxsZWQgZnVuY3Rpb24pLlxuXHQgICAgICAgICAgcmV0dXJuIHRoaXMubG9hZEV4dGVybmFsTW9kdWxlKHBhcnRzWzBdLCBleHRlcm5hbEJpbmRpbmcpO1xuXHQgICAgICAgIH0gLy8gQ291bGQgYmUgYSBzdWItbW9kdWxlIChDb21tb25KUykgb2YgYW4gZXh0ZXJuYWwgbmF0aXZlIG1vZHVsZS5cblx0ICAgICAgICAvLyBXZSBhbGxvdyB0aGF0IHNpbmNlIFRJTU9CLTk3MzAuXG5cblxuXHQgICAgICAgIGlmIChrcm9sbC5pc0V4dGVybmFsQ29tbW9uSnNNb2R1bGUocGFydHNbMF0pKSB7XG5cdCAgICAgICAgICBjb25zdCBleHRlcm5hbENvbW1vbkpzQ29udGVudHMgPSBrcm9sbC5nZXRFeHRlcm5hbENvbW1vbkpzTW9kdWxlKGlkKTtcblxuXHQgICAgICAgICAgaWYgKGV4dGVybmFsQ29tbW9uSnNDb250ZW50cykge1xuXHQgICAgICAgICAgICAvLyBmb3VuZCBpdFxuXHQgICAgICAgICAgICAvLyBGSVhNRSBSZS11c2UgbG9hZEFzSmF2YVNjcmlwdFRleHQ/XG5cdCAgICAgICAgICAgIGNvbnN0IG1vZHVsZSA9IG5ldyBNb2R1bGUoaWQsIHRoaXMpO1xuXHQgICAgICAgICAgICBtb2R1bGUubG9hZChpZCwgZXh0ZXJuYWxDb21tb25Kc0NvbnRlbnRzKTtcblx0ICAgICAgICAgICAgcmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuXHQgICAgICAgICAgfVxuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBudWxsOyAvLyBmYWlsZWQgdG8gbG9hZFxuXHQgICAgfVxuXHQgICAgLyoqXG5cdCAgICAgKiBBdHRlbXB0cyB0byBsb2FkIGEgbm9kZSBtb2R1bGUgYnkgaWQgZnJvbSB0aGUgc3RhcnRpbmcgcGF0aFxuXHQgICAgICogQHBhcmFtICB7c3RyaW5nfSBtb2R1bGVJZCAgICAgICBUaGUgcGF0aCBvZiB0aGUgbW9kdWxlIHRvIGxvYWQuXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmdbXX0gZGlycyAgICAgICBwYXRocyB0byBzZWFyY2hcblx0ICAgICAqIEByZXR1cm4ge01vZHVsZXxudWxsfSAgICAgIFRoZSBtb2R1bGUsIGlmIGxvYWRlZC4gbnVsbCBpZiBub3QuXG5cdCAgICAgKi9cblxuXG5cdCAgICBsb2FkTm9kZU1vZHVsZXMobW9kdWxlSWQsIGRpcnMpIHtcblx0ICAgICAgLy8gMi4gZm9yIGVhY2ggRElSIGluIERJUlM6XG5cdCAgICAgIGZvciAoY29uc3QgZGlyIG9mIGRpcnMpIHtcblx0ICAgICAgICAvLyBhLiBMT0FEX0FTX0ZJTEUoRElSL1gpXG5cdCAgICAgICAgLy8gYi4gTE9BRF9BU19ESVJFQ1RPUlkoRElSL1gpXG5cdCAgICAgICAgY29uc3QgbW9kID0gdGhpcy5sb2FkQXNGaWxlT3JEaXJlY3RvcnkocGF0aC5qb2luKGRpciwgbW9kdWxlSWQpKTtcblxuXHQgICAgICAgIGlmIChtb2QpIHtcblx0ICAgICAgICAgIHJldHVybiBtb2Q7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cdCAgICAvKipcblx0ICAgICAqIERldGVybWluZSB0aGUgc2V0IG9mIHBhdGhzIHRvIHNlYXJjaCBmb3Igbm9kZV9tb2R1bGVzXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IHN0YXJ0RGlyICAgICAgIFRoZSBzdGFydGluZyBkaXJlY3Rvcnlcblx0ICAgICAqIEByZXR1cm4ge3N0cmluZ1tdfSAgICAgICAgICAgICAgVGhlIGFycmF5IG9mIHBhdGhzIHRvIHNlYXJjaFxuXHQgICAgICovXG5cblxuXHQgICAgbm9kZU1vZHVsZXNQYXRocyhzdGFydERpcikge1xuXHQgICAgICAvLyBNYWtlIHN1cmUgd2UgaGF2ZSBhbiBhYnNvbHV0ZSBwYXRoIHRvIHN0YXJ0IHdpdGhcblx0ICAgICAgc3RhcnREaXIgPSBwYXRoLnJlc29sdmUoc3RhcnREaXIpOyAvLyBSZXR1cm4gZWFybHkgaWYgd2UgYXJlIGF0IHJvb3QsIHRoaXMgYXZvaWRzIGRvaW5nIGEgcG9pbnRsZXNzIGxvb3Bcblx0ICAgICAgLy8gYW5kIGFsc28gcmV0dXJuaW5nIGFuIGFycmF5IHdpdGggZHVwbGljYXRlIGVudHJpZXNcblx0ICAgICAgLy8gZS5nLiBbXCIvbm9kZV9tb2R1bGVzXCIsIFwiL25vZGVfbW9kdWxlc1wiXVxuXG5cdCAgICAgIGlmIChzdGFydERpciA9PT0gJy8nKSB7XG5cdCAgICAgICAgcmV0dXJuIFsnL25vZGVfbW9kdWxlcyddO1xuXHQgICAgICB9IC8vIDEuIGxldCBQQVJUUyA9IHBhdGggc3BsaXQoU1RBUlQpXG5cblxuXHQgICAgICBjb25zdCBwYXJ0cyA9IHN0YXJ0RGlyLnNwbGl0KCcvJyk7IC8vIDIuIGxldCBJID0gY291bnQgb2YgUEFSVFMgLSAxXG5cblx0ICAgICAgbGV0IGkgPSBwYXJ0cy5sZW5ndGggLSAxOyAvLyAzLiBsZXQgRElSUyA9IFtdXG5cblx0ICAgICAgY29uc3QgZGlycyA9IFtdOyAvLyA0LiB3aGlsZSBJID49IDAsXG5cblx0ICAgICAgd2hpbGUgKGkgPj0gMCkge1xuXHQgICAgICAgIC8vIGEuIGlmIFBBUlRTW0ldID0gXCJub2RlX21vZHVsZXNcIiBDT05USU5VRVxuXHQgICAgICAgIGlmIChwYXJ0c1tpXSA9PT0gJ25vZGVfbW9kdWxlcycgfHwgcGFydHNbaV0gPT09ICcnKSB7XG5cdCAgICAgICAgICBpIC09IDE7XG5cdCAgICAgICAgICBjb250aW51ZTtcblx0ICAgICAgICB9IC8vIGIuIERJUiA9IHBhdGggam9pbihQQVJUU1swIC4uIEldICsgXCJub2RlX21vZHVsZXNcIilcblxuXG5cdCAgICAgICAgY29uc3QgZGlyID0gcGF0aC5qb2luKHBhcnRzLnNsaWNlKDAsIGkgKyAxKS5qb2luKCcvJyksICdub2RlX21vZHVsZXMnKTsgLy8gYy4gRElSUyA9IERJUlMgKyBESVJcblxuXHQgICAgICAgIGRpcnMucHVzaChkaXIpOyAvLyBkLiBsZXQgSSA9IEkgLSAxXG5cblx0ICAgICAgICBpIC09IDE7XG5cdCAgICAgIH0gLy8gQWx3YXlzIGFkZCAvbm9kZV9tb2R1bGVzIHRvIHRoZSBzZWFyY2ggcGF0aFxuXG5cblx0ICAgICAgZGlycy5wdXNoKCcvbm9kZV9tb2R1bGVzJyk7XG5cdCAgICAgIHJldHVybiBkaXJzO1xuXHQgICAgfVxuXHQgICAgLyoqXG5cdCAgICAgKiBBdHRlbXB0cyB0byBsb2FkIGEgZ2l2ZW4gcGF0aCBhcyBhIGZpbGUgb3IgZGlyZWN0b3J5LlxuXHQgICAgICogQHBhcmFtICB7c3RyaW5nfSBub3JtYWxpemVkUGF0aCBUaGUgcGF0aCBvZiB0aGUgbW9kdWxlIHRvIGxvYWQuXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV8bnVsbH0gVGhlIGxvYWRlZCBtb2R1bGUuIG51bGwgaWYgdW5hYmxlIHRvIGxvYWQuXG5cdCAgICAgKi9cblxuXG5cdCAgICBsb2FkQXNGaWxlT3JEaXJlY3Rvcnkobm9ybWFsaXplZFBhdGgpIHtcblx0ICAgICAgLy8gYS4gTE9BRF9BU19GSUxFKFkgKyBYKVxuXHQgICAgICBsZXQgbG9hZGVkID0gdGhpcy5sb2FkQXNGaWxlKG5vcm1hbGl6ZWRQYXRoKTtcblxuXHQgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgcmV0dXJuIGxvYWRlZDtcblx0ICAgICAgfSAvLyBiLiBMT0FEX0FTX0RJUkVDVE9SWShZICsgWClcblxuXG5cdCAgICAgIGxvYWRlZCA9IHRoaXMubG9hZEFzRGlyZWN0b3J5KG5vcm1hbGl6ZWRQYXRoKTtcblxuXHQgICAgICBpZiAobG9hZGVkKSB7XG5cdCAgICAgICAgcmV0dXJuIGxvYWRlZDtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBudWxsO1xuXHQgICAgfVxuXHQgICAgLyoqXG5cdCAgICAgKiBMb2FkcyBhIGdpdmVuIGZpbGUgYXMgYSBKYXZhc2NyaXB0IGZpbGUsIHJldHVybmluZyB0aGUgbW9kdWxlLmV4cG9ydHMuXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGZpbGVuYW1lIEZpbGUgd2UncmUgYXR0ZW1wdGluZyB0byBsb2FkXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV9IHRoZSBsb2FkZWQgbW9kdWxlXG5cdCAgICAgKi9cblxuXG5cdCAgICBsb2FkSmF2YXNjcmlwdFRleHQoZmlsZW5hbWUpIHtcblx0ICAgICAgLy8gTG9vayBpbiB0aGUgY2FjaGUhXG5cdCAgICAgIGlmIChNb2R1bGUuY2FjaGVbZmlsZW5hbWVdKSB7XG5cdCAgICAgICAgcmV0dXJuIE1vZHVsZS5jYWNoZVtmaWxlbmFtZV07XG5cdCAgICAgIH1cblxuXHQgICAgICBjb25zdCBtb2R1bGUgPSBuZXcgTW9kdWxlKGZpbGVuYW1lLCB0aGlzKTtcblx0ICAgICAgbW9kdWxlLmxvYWQoZmlsZW5hbWUpO1xuXHQgICAgICByZXR1cm4gbW9kdWxlO1xuXHQgICAgfVxuXHQgICAgLyoqXG5cdCAgICAgKiBMb2FkcyBhIEpTT04gZmlsZSBieSByZWFkaW5nIGl0J3MgY29udGVudHMsIGRvaW5nIGEgSlNPTi5wYXJzZSBhbmQgcmV0dXJuaW5nIHRoZSBwYXJzZWQgb2JqZWN0LlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgRmlsZSB3ZSdyZSBhdHRlbXB0aW5nIHRvIGxvYWRcblx0ICAgICAqIEByZXR1cm4ge01vZHVsZX0gVGhlIGxvYWRlZCBtb2R1bGUgaW5zdGFuY2Vcblx0ICAgICAqL1xuXG5cblx0ICAgIGxvYWRKYXZhc2NyaXB0T2JqZWN0KGZpbGVuYW1lKSB7XG5cdCAgICAgIC8vIExvb2sgaW4gdGhlIGNhY2hlIVxuXHQgICAgICBpZiAoTW9kdWxlLmNhY2hlW2ZpbGVuYW1lXSkge1xuXHQgICAgICAgIHJldHVybiBNb2R1bGUuY2FjaGVbZmlsZW5hbWVdO1xuXHQgICAgICB9XG5cblx0ICAgICAgY29uc3QgbW9kdWxlID0gbmV3IE1vZHVsZShmaWxlbmFtZSwgdGhpcyk7XG5cdCAgICAgIG1vZHVsZS5maWxlbmFtZSA9IGZpbGVuYW1lO1xuXHQgICAgICBtb2R1bGUucGF0aCA9IHBhdGguZGlybmFtZShmaWxlbmFtZSk7XG5cdCAgICAgIGNvbnN0IHNvdXJjZSA9IGFzc2V0cy5yZWFkQXNzZXQoYFJlc291cmNlcyR7ZmlsZW5hbWV9YCApOyAvLyBTdGljayBpdCBpbiB0aGUgY2FjaGVcblxuXHQgICAgICBNb2R1bGUuY2FjaGVbZmlsZW5hbWVdID0gbW9kdWxlO1xuXHQgICAgICBtb2R1bGUuZXhwb3J0cyA9IEpTT04ucGFyc2Uoc291cmNlKTtcblx0ICAgICAgbW9kdWxlLmxvYWRlZCA9IHRydWU7XG5cdCAgICAgIHJldHVybiBtb2R1bGU7XG5cdCAgICB9XG5cdCAgICAvKipcblx0ICAgICAqIEF0dGVtcHRzIHRvIGxvYWQgYSBmaWxlIGJ5IGl0J3MgZnVsbCBmaWxlbmFtZSBhY2NvcmRpbmcgdG8gTm9kZUpTIHJ1bGVzLlxuXHQgICAgICpcblx0ICAgICAqIEBwYXJhbSAge3N0cmluZ30gaWQgVGhlIGZpbGVuYW1lXG5cdCAgICAgKiBAcmV0dXJuIHtNb2R1bGV8bnVsbH0gTW9kdWxlIGluc3RhbmNlIGlmIGxvYWRlZCwgbnVsbCBpZiBub3QgZm91bmQuXG5cdCAgICAgKi9cblxuXG5cdCAgICBsb2FkQXNGaWxlKGlkKSB7XG5cdCAgICAgIC8vIDEuIElmIFggaXMgYSBmaWxlLCBsb2FkIFggYXMgSmF2YVNjcmlwdCB0ZXh0LiAgU1RPUFxuXHQgICAgICBsZXQgZmlsZW5hbWUgPSBpZDtcblxuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICAvLyBJZiB0aGUgZmlsZSBoYXMgYSAuanNvbiBleHRlbnNpb24sIGxvYWQgYXMgSmF2YXNjcmlwdE9iamVjdFxuXHQgICAgICAgIGlmIChmaWxlbmFtZS5sZW5ndGggPiA1ICYmIGZpbGVuYW1lLnNsaWNlKC00KSA9PT0gJ2pzb24nKSB7XG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5sb2FkSmF2YXNjcmlwdE9iamVjdChmaWxlbmFtZSk7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgcmV0dXJuIHRoaXMubG9hZEphdmFzY3JpcHRUZXh0KGZpbGVuYW1lKTtcblx0ICAgICAgfSAvLyAyLiBJZiBYLmpzIGlzIGEgZmlsZSwgbG9hZCBYLmpzIGFzIEphdmFTY3JpcHQgdGV4dC4gIFNUT1BcblxuXG5cdCAgICAgIGZpbGVuYW1lID0gaWQgKyAnLmpzJztcblxuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5sb2FkSmF2YXNjcmlwdFRleHQoZmlsZW5hbWUpO1xuXHQgICAgICB9IC8vIDMuIElmIFguanNvbiBpcyBhIGZpbGUsIHBhcnNlIFguanNvbiB0byBhIEphdmFTY3JpcHQgT2JqZWN0LiAgU1RPUFxuXG5cblx0ICAgICAgZmlsZW5hbWUgPSBpZCArICcuanNvbic7XG5cblx0ICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXMubG9hZEphdmFzY3JpcHRPYmplY3QoZmlsZW5hbWUpO1xuXHQgICAgICB9IC8vIGZhaWxlZCB0byBsb2FkIGFueXRoaW5nIVxuXG5cblx0ICAgICAgcmV0dXJuIG51bGw7XG5cdCAgICB9XG5cdCAgICAvKipcblx0ICAgICAqIEF0dGVtcHRzIHRvIGxvYWQgYSBkaXJlY3RvcnkgYWNjb3JkaW5nIHRvIE5vZGVKUyBydWxlcy5cblx0ICAgICAqXG5cdCAgICAgKiBAcGFyYW0gIHtzdHJpbmd9IGlkIFRoZSBkaXJlY3RvcnkgbmFtZVxuXHQgICAgICogQHJldHVybiB7TW9kdWxlfG51bGx9IExvYWRlZCBtb2R1bGUsIG51bGwgaWYgbm90IGZvdW5kLlxuXHQgICAgICovXG5cblxuXHQgICAgbG9hZEFzRGlyZWN0b3J5KGlkKSB7XG5cdCAgICAgIC8vIDEuIElmIFgvcGFja2FnZS5qc29uIGlzIGEgZmlsZSxcblx0ICAgICAgbGV0IGZpbGVuYW1lID0gcGF0aC5yZXNvbHZlKGlkLCAncGFja2FnZS5qc29uJyk7XG5cblx0ICAgICAgaWYgKHRoaXMuZmlsZW5hbWVFeGlzdHMoZmlsZW5hbWUpKSB7XG5cdCAgICAgICAgLy8gYS4gUGFyc2UgWC9wYWNrYWdlLmpzb24sIGFuZCBsb29rIGZvciBcIm1haW5cIiBmaWVsZC5cblx0ICAgICAgICBjb25zdCBvYmplY3QgPSB0aGlzLmxvYWRKYXZhc2NyaXB0T2JqZWN0KGZpbGVuYW1lKTtcblxuXHQgICAgICAgIGlmIChvYmplY3QgJiYgb2JqZWN0LmV4cG9ydHMgJiYgb2JqZWN0LmV4cG9ydHMubWFpbikge1xuXHQgICAgICAgICAgLy8gYi4gbGV0IE0gPSBYICsgKGpzb24gbWFpbiBmaWVsZClcblx0ICAgICAgICAgIGNvbnN0IG0gPSBwYXRoLnJlc29sdmUoaWQsIG9iamVjdC5leHBvcnRzLm1haW4pOyAvLyBjLiBMT0FEX0FTX0ZJTEUoTSlcblxuXHQgICAgICAgICAgcmV0dXJuIHRoaXMubG9hZEFzRmlsZU9yRGlyZWN0b3J5KG0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSAvLyAyLiBJZiBYL2luZGV4LmpzIGlzIGEgZmlsZSwgbG9hZCBYL2luZGV4LmpzIGFzIEphdmFTY3JpcHQgdGV4dC4gIFNUT1BcblxuXG5cdCAgICAgIGZpbGVuYW1lID0gcGF0aC5yZXNvbHZlKGlkLCAnaW5kZXguanMnKTtcblxuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5sb2FkSmF2YXNjcmlwdFRleHQoZmlsZW5hbWUpO1xuXHQgICAgICB9IC8vIDMuIElmIFgvaW5kZXguanNvbiBpcyBhIGZpbGUsIHBhcnNlIFgvaW5kZXguanNvbiB0byBhIEphdmFTY3JpcHQgb2JqZWN0LiBTVE9QXG5cblxuXHQgICAgICBmaWxlbmFtZSA9IHBhdGgucmVzb2x2ZShpZCwgJ2luZGV4Lmpzb24nKTtcblxuXHQgICAgICBpZiAodGhpcy5maWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkpIHtcblx0ICAgICAgICByZXR1cm4gdGhpcy5sb2FkSmF2YXNjcmlwdE9iamVjdChmaWxlbmFtZSk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gbnVsbDtcblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogU2V0dXAgYSBzYW5kYm94IGFuZCBydW4gdGhlIG1vZHVsZSdzIHNjcmlwdCBpbnNpZGUgaXQuXG5cdCAgICAgKiBSZXR1cm5zIHRoZSByZXN1bHQgb2YgdGhlIGV4ZWN1dGVkIHNjcmlwdC5cblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gc291cmNlICAgW2Rlc2NyaXB0aW9uXVxuXHQgICAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlbmFtZSBbZGVzY3JpcHRpb25dXG5cdCAgICAgKiBAcmV0dXJuIHsqfSAgICAgICAgICBbZGVzY3JpcHRpb25dXG5cdCAgICAgKi9cblxuXG5cdCAgICBfcnVuU2NyaXB0KHNvdXJjZSwgZmlsZW5hbWUpIHtcblx0ICAgICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cblx0ICAgICAgZnVuY3Rpb24gcmVxdWlyZShwYXRoKSB7XG5cdCAgICAgICAgcmV0dXJuIHNlbGYucmVxdWlyZShwYXRoKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJlcXVpcmUubWFpbiA9IE1vZHVsZS5tYWluOyAvLyBUaGlzIFwiZmlyc3QgdGltZVwiIHJ1biBpcyByZWFsbHkgb25seSBmb3IgYXBwLmpzLCBBRkFJQ1QsIGFuZCBuZWVkc1xuXHQgICAgICAvLyBhbiBhY3Rpdml0eS4gSWYgYXBwIHdhcyByZXN0YXJ0ZWQgZm9yIFNlcnZpY2Ugb25seSwgd2UgZG9uJ3Qgd2FudFxuXHQgICAgICAvLyB0byBnbyB0aGlzIHJvdXRlLiBTbyBhZGRlZCBjdXJyZW50QWN0aXZpdHkgY2hlY2suIChiaWxsKVxuXG5cdCAgICAgIGlmIChzZWxmLmlkID09PSAnLicgJiYgIXRoaXMuaXNTZXJ2aWNlKSB7XG5cdCAgICAgICAgZ2xvYmFsLnJlcXVpcmUgPSByZXF1aXJlOyAvLyBjaGVjayBpZiB3ZSBoYXZlIGFuIGluc3BlY3RvciBiaW5kaW5nLi4uXG5cblx0ICAgICAgICBjb25zdCBpbnNwZWN0b3IgPSBrcm9sbC5iaW5kaW5nKCdpbnNwZWN0b3InKTtcblxuXHQgICAgICAgIGlmIChpbnNwZWN0b3IpIHtcblx0ICAgICAgICAgIC8vIElmIGRlYnVnZ2VyIGlzIGVuYWJsZWQsIGxvYWQgYXBwLmpzIGFuZCBwYXVzZSByaWdodCBiZWZvcmUgd2UgZXhlY3V0ZSBpdFxuXHQgICAgICAgICAgY29uc3QgaW5zcGVjdG9yV3JhcHBlciA9IGluc3BlY3Rvci5jYWxsQW5kUGF1c2VPblN0YXJ0O1xuXG5cdCAgICAgICAgICBpZiAoaW5zcGVjdG9yV3JhcHBlcikge1xuXHQgICAgICAgICAgICAvLyBGSVhNRSBXaHkgY2FuJ3Qgd2UgZG8gbm9ybWFsIE1vZHVsZS53cmFwKHNvdXJjZSkgaGVyZT9cblx0ICAgICAgICAgICAgLy8gSSBnZXQgXCJVbmNhdWdodCBUeXBlRXJyb3I6IENhbm5vdCByZWFkIHByb3BlcnR5ICdjcmVhdGVUYWJHcm91cCcgb2YgdW5kZWZpbmVkXCIgZm9yIFwiVGkuVUkuY3JlYXRlVGFiR3JvdXAoKTtcIlxuXHQgICAgICAgICAgICAvLyBOb3Qgc3VyZSB3aHkgYXBwLmpzIGlzIHNwZWNpYWwgY2FzZSBhbmQgY2FuJ3QgYmUgcnVuIHVuZGVyIG5vcm1hbCBzZWxmLWludm9raW5nIHdyYXBwaW5nIGZ1bmN0aW9uIHRoYXQgZ2V0cyBwYXNzZWQgaW4gZ2xvYmFsL2tyb2xsL1RpL2V0Y1xuXHQgICAgICAgICAgICAvLyBJbnN0ZWFkLCBsZXQncyB1c2UgYSBzbGlnaHRseSBtb2RpZmllZCB2ZXJzaW9uIG9mIGNhbGxBbmRQYXVzZU9uU3RhcnQ6XG5cdCAgICAgICAgICAgIC8vIEl0IHdpbGwgY29tcGlsZSB0aGUgc291cmNlIGFzLWlzLCBzY2hlZHVsZSBhIHBhdXNlIGFuZCB0aGVuIHJ1biB0aGUgc291cmNlLlxuXHQgICAgICAgICAgICByZXR1cm4gaW5zcGVjdG9yV3JhcHBlcihzb3VyY2UsIGZpbGVuYW1lKTtcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IC8vIHJ1biBhcHAuanMgXCJub3JtYWxseVwiIChpLmUuIG5vdCB1bmRlciBkZWJ1Z2dlci9pbnNwZWN0b3IpXG5cblxuXHQgICAgICAgIHJldHVybiBTY3JpcHQucnVuSW5UaGlzQ29udGV4dChzb3VyY2UsIGZpbGVuYW1lLCB0cnVlKTtcblx0ICAgICAgfSAvLyBJbiBWOCwgd2UgdHJlYXQgZXh0ZXJuYWwgbW9kdWxlcyB0aGUgc2FtZSBhcyBuYXRpdmUgbW9kdWxlcy4gIEZpcnN0LCB3ZSB3cmFwIHRoZVxuXHQgICAgICAvLyBtb2R1bGUgY29kZSBhbmQgdGhlbiBydW4gaXQgaW4gdGhlIGN1cnJlbnQgY29udGV4dC4gIFRoaXMgd2lsbCBhbGxvdyBleHRlcm5hbCBtb2R1bGVzIHRvXG5cdCAgICAgIC8vIGFjY2VzcyBnbG9iYWxzIGFzIG1lbnRpb25lZCBpbiBUSU1PQi0xMTc1Mi4gVGhpcyB3aWxsIGFsc28gaGVscCByZXNvbHZlIHN0YXJ0dXAgc2xvd25lc3MgdGhhdFxuXHQgICAgICAvLyBvY2N1cnMgYXMgYSByZXN1bHQgb2YgY3JlYXRpbmcgYSBuZXcgY29udGV4dCBkdXJpbmcgc3RhcnR1cCBpbiBUSU1PQi0xMjI4Ni5cblxuXG5cdCAgICAgIHNvdXJjZSA9IE1vZHVsZS53cmFwKHNvdXJjZSk7XG5cdCAgICAgIGNvbnN0IGYgPSBTY3JpcHQucnVuSW5UaGlzQ29udGV4dChzb3VyY2UsIGZpbGVuYW1lLCB0cnVlKTtcblx0ICAgICAgcmV0dXJuIGYodGhpcy5leHBvcnRzLCByZXF1aXJlLCB0aGlzLCBmaWxlbmFtZSwgcGF0aC5kaXJuYW1lKGZpbGVuYW1lKSwgVGl0YW5pdW0sIFRpLCBnbG9iYWwsIGtyb2xsKTtcblx0ICAgIH1cblx0ICAgIC8qKlxuXHQgICAgICogTG9vayB1cCBhIGZpbGVuYW1lIGluIHRoZSBhcHAncyBpbmRleC5qc29uIGZpbGVcblx0ICAgICAqIEBwYXJhbSAge1N0cmluZ30gZmlsZW5hbWUgdGhlIGZpbGUgd2UncmUgbG9va2luZyBmb3Jcblx0ICAgICAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgdHJ1ZSBpZiB0aGUgZmlsZW5hbWUgZXhpc3RzIGluIHRoZSBpbmRleC5qc29uXG5cdCAgICAgKi9cblxuXG5cdCAgICBmaWxlbmFtZUV4aXN0cyhmaWxlbmFtZSkge1xuXHQgICAgICBmaWxlbmFtZSA9ICdSZXNvdXJjZXMnICsgZmlsZW5hbWU7IC8vIFdoZW4gd2UgYWN0dWFsbHkgbG9vayBmb3IgZmlsZXMsIGFzc3VtZSBcIlJlc291cmNlcy9cIiBpcyB0aGUgcm9vdFxuXG5cdCAgICAgIGlmICghZmlsZUluZGV4KSB7XG5cdCAgICAgICAgY29uc3QganNvbiA9IGFzc2V0cy5yZWFkQXNzZXQoSU5ERVhfSlNPTik7XG5cdCAgICAgICAgZmlsZUluZGV4ID0gSlNPTi5wYXJzZShqc29uKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBmaWxlSW5kZXggJiYgZmlsZW5hbWUgaW4gZmlsZUluZGV4O1xuXHQgICAgfVxuXG5cdCAgfVxuXG5cdCAgTW9kdWxlLmNhY2hlID0gW107XG5cdCAgTW9kdWxlLm1haW4gPSBudWxsO1xuXHQgIE1vZHVsZS53cmFwcGVyID0gWycoZnVuY3Rpb24gKGV4cG9ydHMsIHJlcXVpcmUsIG1vZHVsZSwgX19maWxlbmFtZSwgX19kaXJuYW1lLCBUaXRhbml1bSwgVGksIGdsb2JhbCwga3JvbGwpIHsnLCAnXFxufSk7J107XG5cblx0ICBNb2R1bGUud3JhcCA9IGZ1bmN0aW9uIChzY3JpcHQpIHtcblx0ICAgIHJldHVybiBNb2R1bGUud3JhcHBlclswXSArIHNjcmlwdCArIE1vZHVsZS53cmFwcGVyWzFdO1xuXHQgIH07XG5cdCAgLyoqXG5cdCAgICogW3J1bk1vZHVsZSBkZXNjcmlwdGlvbl1cblx0ICAgKiBAcGFyYW0gIHtTdHJpbmd9IHNvdXJjZSAgICAgICAgICAgIEpTIFNvdXJjZSBjb2RlXG5cdCAgICogQHBhcmFtICB7U3RyaW5nfSBmaWxlbmFtZSAgICAgICAgICBGaWxlbmFtZSBvZiB0aGUgbW9kdWxlXG5cdCAgICogQHBhcmFtICB7VGl0YW5pdW0uU2VydmljZXxudWxsfFRpdGFuaXVtLkFuZHJvaWQuQWN0aXZpdHl9IGFjdGl2aXR5T3JTZXJ2aWNlIFtkZXNjcmlwdGlvbl1cblx0ICAgKiBAcmV0dXJuIHtNb2R1bGV9ICAgICAgICAgICAgICAgICAgIFRoZSBsb2FkZWQgTW9kdWxlXG5cdCAgICovXG5cblxuXHQgIE1vZHVsZS5ydW5Nb2R1bGUgPSBmdW5jdGlvbiAoc291cmNlLCBmaWxlbmFtZSwgYWN0aXZpdHlPclNlcnZpY2UpIHtcblx0ICAgIGxldCBpZCA9IGZpbGVuYW1lO1xuXG5cdCAgICBpZiAoIU1vZHVsZS5tYWluKSB7XG5cdCAgICAgIGlkID0gJy4nO1xuXHQgICAgfVxuXG5cdCAgICBjb25zdCBtb2R1bGUgPSBuZXcgTW9kdWxlKGlkLCBudWxsKTsgLy8gRklYTUU6IEkgZG9uJ3Qga25vdyB3aHkgaW5zdGFuY2VvZiBmb3IgVGl0YW5pdW0uU2VydmljZSB3b3JrcyBoZXJlIVxuXHQgICAgLy8gT24gQW5kcm9pZCwgaXQncyBhbiBhcGluYW1lIG9mIFRpLkFuZHJvaWQuU2VydmljZVxuXHQgICAgLy8gT24gaU9TLCB3ZSBkb24ndCB5ZXQgcGFzcyBpbiB0aGUgdmFsdWUsIGJ1dCB3ZSBkbyBzZXQgVGkuQXBwLmN1cnJlbnRTZXJ2aWNlIHByb3BlcnR5IGJlZm9yZWhhbmQhXG5cdCAgICAvLyBDYW4gd2UgcmVtb3ZlIHRoZSBwcmVsb2FkIHN0dWZmIGluIEtyb2xsQnJpZGdlLm0gdG8gcGFzcyBhbG9uZyB0aGUgc2VydmljZSBpbnN0YW5jZSBpbnRvIHRoaXMgbGlrZSB3ZSBkbyBvbiBBbmRvcmlkP1xuXG5cdCAgICBtb2R1bGUuaXNTZXJ2aWNlID0gYWN0aXZpdHlPclNlcnZpY2UgaW5zdGFuY2VvZiBUaXRhbml1bS5TZXJ2aWNlIDtcblxuXHQgICAge1xuXHQgICAgICBpZiAobW9kdWxlLmlzU2VydmljZSkge1xuXHQgICAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaS5BbmRyb2lkLCAnY3VycmVudFNlcnZpY2UnLCB7XG5cdCAgICAgICAgICB2YWx1ZTogYWN0aXZpdHlPclNlcnZpY2UsXG5cdCAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG5cdCAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcblx0ICAgICAgICB9KTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoVGkuQW5kcm9pZCwgJ2N1cnJlbnRTZXJ2aWNlJywge1xuXHQgICAgICAgICAgdmFsdWU6IG51bGwsXG5cdCAgICAgICAgICB3cml0YWJsZTogZmFsc2UsXG5cdCAgICAgICAgICBjb25maWd1cmFibGU6IHRydWVcblx0ICAgICAgICB9KTtcblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICBpZiAoIU1vZHVsZS5tYWluKSB7XG5cdCAgICAgIE1vZHVsZS5tYWluID0gbW9kdWxlO1xuXHQgICAgfVxuXG5cdCAgICBmaWxlbmFtZSA9IGZpbGVuYW1lLnJlcGxhY2UoJ1Jlc291cmNlcy8nLCAnLycpOyAvLyBub3JtYWxpemUgYmFjayB0byBhYnNvbHV0ZSBwYXRocyAod2hpY2ggcmVhbGx5IGFyZSByZWxhdGl2ZSB0byBSZXNvdXJjZXMgdW5kZXIgdGhlIGhvb2QpXG5cblx0ICAgIG1vZHVsZS5sb2FkKGZpbGVuYW1lLCBzb3VyY2UpO1xuXG5cdCAgICB7XG5cdCAgICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShUaS5BbmRyb2lkLCAnY3VycmVudFNlcnZpY2UnLCB7XG5cdCAgICAgICAgdmFsdWU6IG51bGwsXG5cdCAgICAgICAgd3JpdGFibGU6IGZhbHNlLFxuXHQgICAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHQgICAgICB9KTtcblx0ICAgIH1cblxuXHQgICAgcmV0dXJuIG1vZHVsZTtcblx0ICB9O1xuXG5cdCAgcmV0dXJuIE1vZHVsZTtcblx0fVxuXG5cdC8qKlxuXHQgKiBUaGlzIGhhbmdzIHRoZSBQcm94eSB0eXBlIG9mZiBUaSBuYW1lc3BhY2UuIEl0IGFsc28gZ2VuZXJhdGVzIGEgaGlkZGVuIF9wcm9wZXJ0aWVzIG9iamVjdFxuXHQgKiB0aGF0IGlzIHVzZWQgdG8gc3RvcmUgcHJvcGVydHkgdmFsdWVzIG9uIHRoZSBKUyBzaWRlIGZvciBqYXZhIFByb3hpZXMuXG5cdCAqIEJhc2ljYWxseSB0aGVzZSBnZXQvc2V0IG1ldGhvZHMgYXJlIGZhbGxiYWNrcyBmb3Igd2hlbiBhIEphdmEgcHJveHkgZG9lc24ndCBoYXZlIGEgbmF0aXZlIG1ldGhvZCB0byBoYW5kbGUgZ2V0dGluZy9zZXR0aW5nIHRoZSBwcm9wZXJ0eS5cblx0ICogKHNlZSBQcm94eS5oL1Byb3h5QmluZGluZ1Y4LmNwcC5mbSBmb3IgbW9yZSBpbmZvKVxuXHQgKiBAcGFyYW0ge29iamVjdH0gdGlCaW5kaW5nIHRoZSB1bmRlcmx5aW5nICdUaXRhbml1bScgbmF0aXZlIGJpbmRpbmcgKHNlZSBLcm9sbEJpbmRpbmdzOjppbml0VGl0YW5pdW0pXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBUaSB0aGUgZ2xvYmFsLlRpdGFuaXVtIG9iamVjdFxuXHQgKi9cblx0ZnVuY3Rpb24gUHJveHlCb290c3RyYXAodGlCaW5kaW5nLCBUaSkge1xuXHQgIGNvbnN0IFByb3h5ID0gdGlCaW5kaW5nLlByb3h5O1xuXHQgIFRpLlByb3h5ID0gUHJveHk7XG5cblx0ICBQcm94eS5kZWZpbmVQcm9wZXJ0aWVzID0gZnVuY3Rpb24gKHByb3h5UHJvdG90eXBlLCBuYW1lcykge1xuXHQgICAgY29uc3QgcHJvcGVydGllcyA9IHt9O1xuXHQgICAgY29uc3QgbGVuID0gbmFtZXMubGVuZ3RoO1xuXG5cdCAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdCAgICAgIGNvbnN0IG5hbWUgPSBuYW1lc1tpXTtcblx0ICAgICAgcHJvcGVydGllc1tuYW1lXSA9IHtcblx0ICAgICAgICBnZXQ6IGZ1bmN0aW9uICgpIHtcblx0ICAgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbG9vcC1mdW5jXG5cdCAgICAgICAgICByZXR1cm4gdGhpcy5nZXRQcm9wZXJ0eShuYW1lKTtcblx0ICAgICAgICB9LFxuXHQgICAgICAgIHNldDogZnVuY3Rpb24gKHZhbHVlKSB7XG5cdCAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLWxvb3AtZnVuY1xuXHQgICAgICAgICAgdGhpcy5zZXRQcm9wZXJ0eUFuZEZpcmUobmFtZSwgdmFsdWUpO1xuXHQgICAgICAgIH0sXG5cdCAgICAgICAgZW51bWVyYWJsZTogdHJ1ZVxuXHQgICAgICB9O1xuXHQgICAgfVxuXG5cdCAgICBPYmplY3QuZGVmaW5lUHJvcGVydGllcyhwcm94eVByb3RvdHlwZSwgcHJvcGVydGllcyk7XG5cdCAgfTtcblxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShQcm94eS5wcm90b3R5cGUsICdnZXRQcm9wZXJ0eScsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAocHJvcGVydHkpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuX3Byb3BlcnRpZXNbcHJvcGVydHldO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7XG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KFByb3h5LnByb3RvdHlwZSwgJ3NldFByb3BlcnR5Jywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uIChwcm9wZXJ0eSwgdmFsdWUpIHtcblx0ICAgICAgcmV0dXJuIHRoaXMuX3Byb3BlcnRpZXNbcHJvcGVydHldID0gdmFsdWU7XG5cdCAgICB9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoUHJveHkucHJvdG90eXBlLCAnc2V0UHJvcGVydGllc0FuZEZpcmUnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHByb3BlcnRpZXMpIHtcblx0ICAgICAgY29uc3Qgb3duTmFtZXMgPSBPYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhwcm9wZXJ0aWVzKTtcblx0ICAgICAgY29uc3QgbGVuID0gb3duTmFtZXMubGVuZ3RoO1xuXHQgICAgICBjb25zdCBjaGFuZ2VzID0gW107XG5cblx0ICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHQgICAgICAgIGNvbnN0IHByb3BlcnR5ID0gb3duTmFtZXNbaV07XG5cdCAgICAgICAgY29uc3QgdmFsdWUgPSBwcm9wZXJ0aWVzW3Byb3BlcnR5XTtcblxuXHQgICAgICAgIGlmICghcHJvcGVydHkpIHtcblx0ICAgICAgICAgIGNvbnRpbnVlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGNvbnN0IG9sZFZhbHVlID0gdGhpcy5fcHJvcGVydGllc1twcm9wZXJ0eV07XG5cdCAgICAgICAgdGhpcy5fcHJvcGVydGllc1twcm9wZXJ0eV0gPSB2YWx1ZTtcblxuXHQgICAgICAgIGlmICh2YWx1ZSAhPT0gb2xkVmFsdWUpIHtcblx0ICAgICAgICAgIGNoYW5nZXMucHVzaChbcHJvcGVydHksIG9sZFZhbHVlLCB2YWx1ZV0pO1xuXHQgICAgICAgIH1cblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjaGFuZ2VzLmxlbmd0aCA+IDApIHtcblx0ICAgICAgICB0aGlzLm9uUHJvcGVydGllc0NoYW5nZWQoY2hhbmdlcyk7XG5cdCAgICAgIH1cblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHR9XG5cblx0LyogZ2xvYmFscyBPU19BTkRST0lELE9TX0lPUyAqL1xuXHRmdW5jdGlvbiBib290c3RyYXAkMShnbG9iYWwsIGtyb2xsKSB7XG5cdCAge1xuXHQgICAgY29uc3QgdGlCaW5kaW5nID0ga3JvbGwuYmluZGluZygnVGl0YW5pdW0nKTtcblx0ICAgIGNvbnN0IFRpID0gdGlCaW5kaW5nLlRpdGFuaXVtO1xuXG5cdCAgICBjb25zdCBib290c3RyYXAgPSBrcm9sbC5OYXRpdmVNb2R1bGUucmVxdWlyZSgnYm9vdHN0cmFwJyk7IC8vIFRoZSBib290c3RyYXAgZGVmaW5lcyBsYXp5IG5hbWVzcGFjZSBwcm9wZXJ0eSB0cmVlICoqYW5kKipcblx0ICAgIC8vIHNldHMgdXAgc3BlY2lhbCBBUElzIHRoYXQgZ2V0IHdyYXBwZWQgdG8gcGFzcyBhbG9uZyBzb3VyY2VVcmwgdmlhIGEgS3JvbGxJbnZvY2F0aW9uIG9iamVjdFxuXG5cblx0ICAgIGJvb3RzdHJhcC5ib290c3RyYXAoVGkpO1xuXHQgICAgYm9vdHN0cmFwLmRlZmluZUxhenlCaW5kaW5nKFRpLCAnQVBJJyk7IC8vIEJhc2ljYWxseSBkb2VzIHRoZSBzYW1lIHRoaW5nIGlPUyBkb2VzIGZvciBBUEkgbW9kdWxlIChsYXp5IHByb3BlcnR5IGdldHRlcilcblx0ICAgIC8vIEhlcmUsIHdlIGdvIHRocm91Z2ggYWxsIHRoZSBzcGVjaWFsbHkgbWFya2VkIEFQSXMgdG8gZ2VuZXJhdGUgdGhlIHdyYXBwZXJzIHRvIHBhc3MgaW4gdGhlIHNvdXJjZVVybFxuXHQgICAgLy8gVE9ETzogVGhpcyBpcyBhbGwgaW5zYW5lLCBhbmQgd2Ugc2hvdWxkIGp1c3QgYmFrZSBpdCBpbnRvIHRoZSBQcm94eSBjb252ZXJzaW9uIHN0dWZmIHRvIGdyYWIgYW5kIHBhc3MgYWxvbmcgc291cmNlVXJsXG5cdCAgICAvLyBSYXRoZXIgdGhhbiBjYXJyeSBpdCBhbGwgb3ZlciB0aGUgcGxhY2UgbGlrZSB0aGlzIVxuXHQgICAgLy8gV2UgYWxyZWFkeSBuZWVkIHRvIGdlbmVyYXRlIGEgS3JvbGxJbnZvY2F0aW9uIG9iamVjdCB0byB3cmFwIHRoZSBzb3VyY2VVcmwhXG5cblx0ICAgIGZ1bmN0aW9uIFRpdGFuaXVtV3JhcHBlcihjb250ZXh0KSB7XG5cdCAgICAgIGNvbnN0IHNvdXJjZVVybCA9IHRoaXMuc291cmNlVXJsID0gY29udGV4dC5zb3VyY2VVcmw7XG5cdCAgICAgIGNvbnN0IHNjb3BlVmFycyA9IG5ldyBrcm9sbC5TY29wZVZhcnMoe1xuXHQgICAgICAgIHNvdXJjZVVybFxuXHQgICAgICB9KTtcblx0ICAgICAgVGkuYmluZEludm9jYXRpb25BUElzKHRoaXMsIHNjb3BlVmFycyk7XG5cdCAgICB9XG5cblx0ICAgIFRpdGFuaXVtV3JhcHBlci5wcm90b3R5cGUgPSBUaTtcblx0ICAgIFRpLldyYXBwZXIgPSBUaXRhbml1bVdyYXBwZXI7IC8vIC0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tLS0tXG5cdCAgICAvLyBUaGlzIGxvb3BzIHRocm91Z2ggYWxsIGtub3duIEFQSXMgdGhhdCByZXF1aXJlIGFuXG5cdCAgICAvLyBJbnZvY2F0aW9uIG9iamVjdCBhbmQgd3JhcHMgdGhlbSBzbyB3ZSBjYW4gcGFzcyBhXG5cdCAgICAvLyBzb3VyY2UgVVJMIGFzIHRoZSBmaXJzdCBhcmd1bWVudFxuXG5cdCAgICBUaS5iaW5kSW52b2NhdGlvbkFQSXMgPSBmdW5jdGlvbiAod3JhcHBlclRpLCBzY29wZVZhcnMpIHtcblx0ICAgICAgZm9yIChjb25zdCBhcGkgb2YgVGkuaW52b2NhdGlvbkFQSXMpIHtcblx0ICAgICAgICAvLyBzZXBhcmF0ZSBlYWNoIGludm9rZXIgaW50byBpdCdzIG93biBwcml2YXRlIHNjb3BlXG5cdCAgICAgICAgaW52b2tlci5nZW5JbnZva2VyKHdyYXBwZXJUaSwgVGksICdUaXRhbml1bScsIGFwaSwgc2NvcGVWYXJzKTtcblx0ICAgICAgfVxuXHQgICAgfTtcblxuXHQgICAgUHJveHlCb290c3RyYXAodGlCaW5kaW5nLCBUaSk7XG5cdCAgICByZXR1cm4gbmV3IFRpdGFuaXVtV3JhcHBlcih7XG5cdCAgICAgIC8vIEV2ZW4gdGhvdWdoIHRoZSBlbnRyeSBwb2ludCBpcyByZWFsbHkgdGk6Ly9rcm9sbC5qcywgdGhhdCB3aWxsIGJyZWFrIHJlc29sdXRpb24gb2YgdXJscyB1bmRlciB0aGUgY292ZXJzIVxuXHQgICAgICAvLyBTbyBiYXNpY2FsbHkganVzdCBhc3N1bWUgYXBwLmpzIGFzIHRoZSByZWxhdGl2ZSBmaWxlIGJhc2Vcblx0ICAgICAgc291cmNlVXJsOiAnYXBwOi8vYXBwLmpzJ1xuXHQgICAgfSk7XG5cdCAgfVxuXHR9XG5cblx0Ly8gQ29weXJpZ2h0IEpveWVudCwgSW5jLiBhbmQgb3RoZXIgTm9kZSBjb250cmlidXRvcnMuXG5cdC8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG5cdC8vIGNvcHkgb2YgdGhpcyBzb2Z0d2FyZSBhbmQgYXNzb2NpYXRlZCBkb2N1bWVudGF0aW9uIGZpbGVzICh0aGVcblx0Ly8gXCJTb2Z0d2FyZVwiKSwgdG8gZGVhbCBpbiB0aGUgU29mdHdhcmUgd2l0aG91dCByZXN0cmljdGlvbiwgaW5jbHVkaW5nXG5cdC8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcblx0Ly8gZGlzdHJpYnV0ZSwgc3VibGljZW5zZSwgYW5kL29yIHNlbGwgY29waWVzIG9mIHRoZSBTb2Z0d2FyZSwgYW5kIHRvIHBlcm1pdFxuXHQvLyBwZXJzb25zIHRvIHdob20gdGhlIFNvZnR3YXJlIGlzIGZ1cm5pc2hlZCB0byBkbyBzbywgc3ViamVjdCB0byB0aGVcblx0Ly8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG5cdC8vIFRoZSBhYm92ZSBjb3B5cmlnaHQgbm90aWNlIGFuZCB0aGlzIHBlcm1pc3Npb24gbm90aWNlIHNoYWxsIGJlIGluY2x1ZGVkXG5cdC8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuXHQvLyBUSEUgU09GVFdBUkUgSVMgUFJPVklERUQgXCJBUyBJU1wiLCBXSVRIT1VUIFdBUlJBTlRZIE9GIEFOWSBLSU5ELCBFWFBSRVNTXG5cdC8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcblx0Ly8gTUVSQ0hBTlRBQklMSVRZLCBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRSBBTkQgTk9OSU5GUklOR0VNRU5ULiBJTlxuXHQvLyBOTyBFVkVOVCBTSEFMTCBUSEUgQVVUSE9SUyBPUiBDT1BZUklHSFQgSE9MREVSUyBCRSBMSUFCTEUgRk9SIEFOWSBDTEFJTSxcblx0Ly8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG5cdC8vIE9USEVSV0lTRSwgQVJJU0lORyBGUk9NLCBPVVQgT0YgT1IgSU4gQ09OTkVDVElPTiBXSVRIIFRIRSBTT0ZUV0FSRSBPUiBUSEVcblx0Ly8gVVNFIE9SIE9USEVSIERFQUxJTkdTIElOIFRIRSBTT0ZUV0FSRS5cblx0Ly8gTW9kaWZpY2F0aW9ucyBDb3B5cmlnaHQgMjAxMS1QcmVzZW50IEFwcGNlbGVyYXRvciwgSW5jLlxuXHRmdW5jdGlvbiBFdmVudEVtaXR0ZXJCb290c3RyYXAoZ2xvYmFsLCBrcm9sbCkge1xuXHQgIGNvbnN0IFRBRyA9ICdFdmVudEVtaXR0ZXInO1xuXHQgIGNvbnN0IEV2ZW50RW1pdHRlciA9IGtyb2xsLkV2ZW50RW1pdHRlcjtcblx0ICBjb25zdCBpc0FycmF5ID0gQXJyYXkuaXNBcnJheTsgLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhblxuXHQgIC8vIDEwIGxpc3RlbmVycyBhcmUgYWRkZWQgdG8gaXQuIFRoaXMgaXMgYSB1c2VmdWwgZGVmYXVsdCB3aGljaFxuXHQgIC8vIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuXG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlci5wcm90b3R5cGUsICdjYWxsSGFuZGxlcicsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAoaGFuZGxlciwgdHlwZSwgZGF0YSkge1xuXHQgICAgICAvLyBrcm9sbC5sb2coVEFHLCBcImNhbGxpbmcgZXZlbnQgaGFuZGxlcjogdHlwZTpcIiArIHR5cGUgKyBcIiwgZGF0YTogXCIgKyBkYXRhICsgXCIsIGhhbmRsZXI6IFwiICsgaGFuZGxlcik7XG5cdCAgICAgIHZhciBoYW5kbGVkID0gZmFsc2UsXG5cdCAgICAgICAgICBjYW5jZWxCdWJibGUgPSBkYXRhLmNhbmNlbEJ1YmJsZSxcblx0ICAgICAgICAgIGV2ZW50O1xuXG5cdCAgICAgIGlmIChoYW5kbGVyLmxpc3RlbmVyICYmIGhhbmRsZXIubGlzdGVuZXIuY2FsbCkge1xuXHQgICAgICAgIC8vIENyZWF0ZSBldmVudCBvYmplY3QsIGNvcHkgYW55IGN1c3RvbSBldmVudCBkYXRhLCBhbmQgc2V0IHRoZSBcInR5cGVcIiBhbmQgXCJzb3VyY2VcIiBwcm9wZXJ0aWVzLlxuXHQgICAgICAgIGV2ZW50ID0ge1xuXHQgICAgICAgICAgdHlwZTogdHlwZSxcblx0ICAgICAgICAgIHNvdXJjZTogdGhpc1xuXHQgICAgICAgIH07XG5cdCAgICAgICAga3JvbGwuZXh0ZW5kKGV2ZW50LCBkYXRhKTtcblxuXHQgICAgICAgIGlmIChoYW5kbGVyLnNlbGYgJiYgZXZlbnQuc291cmNlID09IGhhbmRsZXIuc2VsZi52aWV3KSB7XG5cdCAgICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIGVxZXFlcVxuXHQgICAgICAgICAgZXZlbnQuc291cmNlID0gaGFuZGxlci5zZWxmO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGhhbmRsZXIubGlzdGVuZXIuY2FsbCh0aGlzLCBldmVudCk7IC8vIFRoZSBcImNhbmNlbEJ1YmJsZVwiIHByb3BlcnR5IG1heSBiZSByZXNldCBpbiB0aGUgaGFuZGxlci5cblxuXHQgICAgICAgIGlmIChldmVudC5jYW5jZWxCdWJibGUgIT09IGNhbmNlbEJ1YmJsZSkge1xuXHQgICAgICAgICAgY2FuY2VsQnViYmxlID0gZXZlbnQuY2FuY2VsQnViYmxlO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGhhbmRsZWQgPSB0cnVlO1xuXHQgICAgICB9IGVsc2UgaWYgKGtyb2xsLkRCRykge1xuXHQgICAgICAgIGtyb2xsLmxvZyhUQUcsICdoYW5kbGVyIGZvciBldmVudCBcXCcnICsgdHlwZSArICdcXCcgaXMgJyArIHR5cGVvZiBoYW5kbGVyLmxpc3RlbmVyICsgJyBhbmQgY2Fubm90IGJlIGNhbGxlZC4nKTtcblx0ICAgICAgfSAvLyBCdWJibGUgdGhlIGV2ZW50cyB0byB0aGUgcGFyZW50IHZpZXcgaWYgbmVlZGVkLlxuXG5cblx0ICAgICAgaWYgKGRhdGEuYnViYmxlcyAmJiAhY2FuY2VsQnViYmxlKSB7XG5cdCAgICAgICAgaGFuZGxlZCA9IHRoaXMuX2ZpcmVTeW5jRXZlbnRUb1BhcmVudCh0eXBlLCBkYXRhKSB8fCBoYW5kbGVkO1xuXHQgICAgICB9XG5cblx0ICAgICAgcmV0dXJuIGhhbmRsZWQ7XG5cdCAgICB9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ2VtaXQnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHR5cGUpIHtcblx0ICAgICAgdmFyIGhhbmRsZWQgPSBmYWxzZSxcblx0ICAgICAgICAgIGRhdGEgPSBhcmd1bWVudHNbMV0sXG5cdCAgICAgICAgICBoYW5kbGVyLFxuXHQgICAgICAgICAgbGlzdGVuZXJzOyAvLyBTZXQgdGhlIFwiYnViYmxlc1wiIGFuZCBcImNhbmNlbEJ1YmJsZVwiIHByb3BlcnRpZXMgZm9yIGV2ZW50IGRhdGEuXG5cblx0ICAgICAgaWYgKGRhdGEgIT09IG51bGwgJiYgdHlwZW9mIGRhdGEgPT09ICdvYmplY3QnKSB7XG5cdCAgICAgICAgZGF0YS5idWJibGVzID0gISFkYXRhLmJ1YmJsZXM7XG5cdCAgICAgICAgZGF0YS5jYW5jZWxCdWJibGUgPSAhIWRhdGEuY2FuY2VsQnViYmxlO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGRhdGEgPSB7XG5cdCAgICAgICAgICBidWJibGVzOiBmYWxzZSxcblx0ICAgICAgICAgIGNhbmNlbEJ1YmJsZTogZmFsc2Vcblx0ICAgICAgICB9O1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKHRoaXMuX2hhc0phdmFMaXN0ZW5lcikge1xuXHQgICAgICAgIHRoaXMuX29uRXZlbnRGaXJlZCh0eXBlLCBkYXRhKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5fZXZlbnRzIHx8ICF0aGlzLl9ldmVudHNbdHlwZV0gfHwgIXRoaXMuY2FsbEhhbmRsZXIpIHtcblx0ICAgICAgICBpZiAoZGF0YS5idWJibGVzICYmICFkYXRhLmNhbmNlbEJ1YmJsZSkge1xuXHQgICAgICAgICAgaGFuZGxlZCA9IHRoaXMuX2ZpcmVTeW5jRXZlbnRUb1BhcmVudCh0eXBlLCBkYXRhKTtcblx0ICAgICAgICB9XG5cblx0ICAgICAgICByZXR1cm4gaGFuZGxlZDtcblx0ICAgICAgfVxuXG5cdCAgICAgIGhhbmRsZXIgPSB0aGlzLl9ldmVudHNbdHlwZV07XG5cblx0ICAgICAgaWYgKHR5cGVvZiBoYW5kbGVyLmxpc3RlbmVyID09PSAnZnVuY3Rpb24nKSB7XG5cdCAgICAgICAgaGFuZGxlZCA9IHRoaXMuY2FsbEhhbmRsZXIoaGFuZGxlciwgdHlwZSwgZGF0YSk7XG5cdCAgICAgIH0gZWxzZSBpZiAoaXNBcnJheShoYW5kbGVyKSkge1xuXHQgICAgICAgIGxpc3RlbmVycyA9IGhhbmRsZXIuc2xpY2UoKTtcblxuXHQgICAgICAgIGZvciAodmFyIGkgPSAwLCBsID0gbGlzdGVuZXJzLmxlbmd0aDsgaSA8IGw7IGkrKykge1xuXHQgICAgICAgICAgaGFuZGxlZCA9IHRoaXMuY2FsbEhhbmRsZXIobGlzdGVuZXJzW2ldLCB0eXBlLCBkYXRhKSB8fCBoYW5kbGVkO1xuXHQgICAgICAgIH1cblx0ICAgICAgfSBlbHNlIGlmIChkYXRhLmJ1YmJsZXMgJiYgIWRhdGEuY2FuY2VsQnViYmxlKSB7XG5cdCAgICAgICAgaGFuZGxlZCA9IHRoaXMuX2ZpcmVTeW5jRXZlbnRUb1BhcmVudCh0eXBlLCBkYXRhKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBoYW5kbGVkO1xuXHQgICAgfSxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7IC8vIFRpdGFuaXVtIGNvbXBhdGliaWxpdHlcblxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnZmlyZUV2ZW50Jywge1xuXHQgICAgdmFsdWU6IEV2ZW50RW1pdHRlci5wcm90b3R5cGUuZW1pdCxcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlLFxuXHQgICAgd3JpdGFibGU6IHRydWVcblx0ICB9KTtcblx0ICBPYmplY3QuZGVmaW5lUHJvcGVydHkoRXZlbnRFbWl0dGVyLnByb3RvdHlwZSwgJ2ZpcmVTeW5jRXZlbnQnLCB7XG5cdCAgICB2YWx1ZTogRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTsgLy8gRXZlbnRFbWl0dGVyIGlzIGRlZmluZWQgaW4gc3JjL25vZGVfZXZlbnRzLmNjXG5cdCAgLy8gRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0KCkgaXMgYWxzbyBkZWZpbmVkIHRoZXJlLlxuXG5cdCAgT2JqZWN0LmRlZmluZVByb3BlcnR5KEV2ZW50RW1pdHRlci5wcm90b3R5cGUsICdhZGRMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIsIHZpZXcpIHtcblx0ICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciAhPT0gJ2Z1bmN0aW9uJykge1xuXHQgICAgICAgIHRocm93IG5ldyBFcnJvcignYWRkTGlzdGVuZXIgb25seSB0YWtlcyBpbnN0YW5jZXMgb2YgRnVuY3Rpb24uIFRoZSBsaXN0ZW5lciBmb3IgZXZlbnQgXCInICsgdHlwZSArICdcIiBpcyBcIicgKyB0eXBlb2YgbGlzdGVuZXIgKyAnXCInKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmICghdGhpcy5fZXZlbnRzKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgaWQ7IC8vIFNldHVwIElEIGZpcnN0IHNvIHdlIGNhbiBwYXNzIGNvdW50IGluIHRvIFwibGlzdGVuZXJBZGRlZFwiXG5cblx0ICAgICAgaWYgKCF0aGlzLl9ldmVudHNbdHlwZV0pIHtcblx0ICAgICAgICBpZCA9IDA7XG5cdCAgICAgIH0gZWxzZSBpZiAoaXNBcnJheSh0aGlzLl9ldmVudHNbdHlwZV0pKSB7XG5cdCAgICAgICAgaWQgPSB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoO1xuXHQgICAgICB9IGVsc2Uge1xuXHQgICAgICAgIGlkID0gMTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHZhciBsaXN0ZW5lcldyYXBwZXIgPSB7fTtcblx0ICAgICAgbGlzdGVuZXJXcmFwcGVyLmxpc3RlbmVyID0gbGlzdGVuZXI7XG5cdCAgICAgIGxpc3RlbmVyV3JhcHBlci5zZWxmID0gdmlldztcblxuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuXHQgICAgICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuXHQgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyV3JhcHBlcjtcblx0ICAgICAgfSBlbHNlIGlmIChpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblx0ICAgICAgICAvLyBJZiB3ZSd2ZSBhbHJlYWR5IGdvdCBhbiBhcnJheSwganVzdCBhcHBlbmQuXG5cdCAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLnB1c2gobGlzdGVuZXJXcmFwcGVyKTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cblx0ICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcldyYXBwZXJdO1xuXHQgICAgICB9IC8vIE5vdGlmeSB0aGUgSmF2YSBwcm94eSBpZiB0aGlzIGlzIHRoZSBmaXJzdCBsaXN0ZW5lciBhZGRlZC5cblxuXG5cdCAgICAgIGlmIChpZCA9PT0gMCkge1xuXHQgICAgICAgIHRoaXMuX2hhc0xpc3RlbmVyc0ZvckV2ZW50VHlwZSh0eXBlLCB0cnVlKTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiBpZDtcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pOyAvLyBUaGUgSmF2YU9iamVjdCBwcm90b3R5cGUgd2lsbCBwcm92aWRlIGEgdmVyc2lvbiBvZiB0aGlzXG5cdCAgLy8gdGhhdCBkZWxlZ2F0ZXMgYmFjayB0byB0aGUgSmF2YSBwcm94eS4gTm9uLUphdmEgdmVyc2lvbnNcblx0ICAvLyBvZiBFdmVudEVtaXR0ZXIgZG9uJ3QgY2FyZSwgc28gdGhpcyBubyBvcCBpcyBjYWxsZWQgaW5zdGVhZC5cblxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnX2xpc3RlbmVyRm9yRXZlbnQnLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKCkge30sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnb24nLCB7XG5cdCAgICB2YWx1ZTogRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5hZGRMaXN0ZW5lcixcblx0ICAgIGVudW1lcmFibGU6IGZhbHNlXG5cdCAgfSk7IC8vIFRpdGFuaXVtIGNvbXBhdGliaWxpdHlcblxuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnYWRkRXZlbnRMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyLFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2UsXG5cdCAgICB3cml0YWJsZTogdHJ1ZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnb25jZScsIHtcblx0ICAgIHZhbHVlOiBmdW5jdGlvbiAodHlwZSwgbGlzdGVuZXIpIHtcblx0ICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG5cdCAgICAgIGZ1bmN0aW9uIGcoKSB7XG5cdCAgICAgICAgc2VsZi5yZW1vdmVMaXN0ZW5lcih0eXBlLCBnKTtcblx0ICAgICAgICBsaXN0ZW5lci5hcHBseSh0aGlzLCBhcmd1bWVudHMpO1xuXHQgICAgICB9XG5cblx0ICAgICAgZy5saXN0ZW5lciA9IGxpc3RlbmVyO1xuXHQgICAgICBzZWxmLm9uKHR5cGUsIGcpO1xuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAncmVtb3ZlTGlzdGVuZXInLCB7XG5cdCAgICB2YWx1ZTogZnVuY3Rpb24gKHR5cGUsIGxpc3RlbmVyKSB7XG5cdCAgICAgIGlmICh0eXBlb2YgbGlzdGVuZXIgIT09ICdmdW5jdGlvbicpIHtcblx0ICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ3JlbW92ZUxpc3RlbmVyIG9ubHkgdGFrZXMgaW5zdGFuY2VzIG9mIEZ1bmN0aW9uJyk7XG5cdCAgICAgIH0gLy8gZG9lcyBub3QgdXNlIGxpc3RlbmVycygpLCBzbyBubyBzaWRlIGVmZmVjdCBvZiBjcmVhdGluZyBfZXZlbnRzW3R5cGVdXG5cblxuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG5cdCAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgIH1cblxuXHQgICAgICB2YXIgbGlzdCA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblx0ICAgICAgdmFyIGNvdW50ID0gMDtcblxuXHQgICAgICBpZiAoaXNBcnJheShsaXN0KSkge1xuXHQgICAgICAgIHZhciBwb3NpdGlvbiA9IC0xOyAvLyBBbHNvIHN1cHBvcnQgbGlzdGVuZXIgaW5kZXhlcyAvIGlkc1xuXG5cdCAgICAgICAgaWYgKHR5cGVvZiBsaXN0ZW5lciA9PT0gJ251bWJlcicpIHtcblx0ICAgICAgICAgIHBvc2l0aW9uID0gbGlzdGVuZXI7XG5cblx0ICAgICAgICAgIGlmIChwb3NpdGlvbiA+IGxpc3QubGVuZ3RoIHx8IHBvc2l0aW9uIDwgMCkge1xuXHQgICAgICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgICAgIH1cblx0ICAgICAgICB9IGVsc2Uge1xuXHQgICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGxlbmd0aCA9IGxpc3QubGVuZ3RoOyBpIDwgbGVuZ3RoOyBpKyspIHtcblx0ICAgICAgICAgICAgaWYgKGxpc3RbaV0ubGlzdGVuZXIgPT09IGxpc3RlbmVyKSB7XG5cdCAgICAgICAgICAgICAgcG9zaXRpb24gPSBpO1xuXHQgICAgICAgICAgICAgIGJyZWFrO1xuXHQgICAgICAgICAgICB9XG5cdCAgICAgICAgICB9XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgaWYgKHBvc2l0aW9uIDwgMCkge1xuXHQgICAgICAgICAgcmV0dXJuIHRoaXM7XG5cdCAgICAgICAgfVxuXG5cdCAgICAgICAgbGlzdC5zcGxpY2UocG9zaXRpb24sIDEpO1xuXG5cdCAgICAgICAgaWYgKGxpc3QubGVuZ3RoID09PSAwKSB7XG5cdCAgICAgICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuXHQgICAgICAgIH1cblxuXHQgICAgICAgIGNvdW50ID0gbGlzdC5sZW5ndGg7XG5cdCAgICAgIH0gZWxzZSBpZiAobGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIgfHwgbGlzdGVuZXIgPT0gMCkge1xuXHQgICAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXG5cdCAgICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblx0ICAgICAgfSBlbHNlIHtcblx0ICAgICAgICByZXR1cm4gdGhpcztcblx0ICAgICAgfVxuXG5cdCAgICAgIGlmIChjb3VudCA9PT0gMCkge1xuXHQgICAgICAgIHRoaXMuX2hhc0xpc3RlbmVyc0ZvckV2ZW50VHlwZSh0eXBlLCBmYWxzZSk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAncmVtb3ZlRXZlbnRMaXN0ZW5lcicsIHtcblx0ICAgIHZhbHVlOiBFdmVudEVtaXR0ZXIucHJvdG90eXBlLnJlbW92ZUxpc3RlbmVyLFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2UsXG5cdCAgICB3cml0YWJsZTogdHJ1ZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAncmVtb3ZlQWxsTGlzdGVuZXJzJywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uICh0eXBlKSB7XG5cdCAgICAgIC8vIGRvZXMgbm90IHVzZSBsaXN0ZW5lcnMoKSwgc28gbm8gc2lkZSBlZmZlY3Qgb2YgY3JlYXRpbmcgX2V2ZW50c1t0eXBlXVxuXHQgICAgICBpZiAodHlwZSAmJiB0aGlzLl9ldmVudHMgJiYgdGhpcy5fZXZlbnRzW3R5cGVdKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdID0gbnVsbDtcblxuXHQgICAgICAgIHRoaXMuX2hhc0xpc3RlbmVyc0ZvckV2ZW50VHlwZSh0eXBlLCBmYWxzZSk7XG5cdCAgICAgIH1cblxuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH0sXG5cdCAgICBlbnVtZXJhYmxlOiBmYWxzZVxuXHQgIH0pO1xuXHQgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShFdmVudEVtaXR0ZXIucHJvdG90eXBlLCAnbGlzdGVuZXJzJywge1xuXHQgICAgdmFsdWU6IGZ1bmN0aW9uICh0eXBlKSB7XG5cdCAgICAgIGlmICghdGhpcy5fZXZlbnRzKSB7XG5cdCAgICAgICAgdGhpcy5fZXZlbnRzID0ge307XG5cdCAgICAgIH1cblxuXHQgICAgICBpZiAoIXRoaXMuX2V2ZW50c1t0eXBlXSkge1xuXHQgICAgICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IFtdO1xuXHQgICAgICB9XG5cblx0ICAgICAgaWYgKCFpc0FycmF5KHRoaXMuX2V2ZW50c1t0eXBlXSkpIHtcblx0ICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdXTtcblx0ICAgICAgfVxuXG5cdCAgICAgIHJldHVybiB0aGlzLl9ldmVudHNbdHlwZV07XG5cdCAgICB9LFxuXHQgICAgZW51bWVyYWJsZTogZmFsc2Vcblx0ICB9KTtcblx0ICByZXR1cm4gRXZlbnRFbWl0dGVyO1xuXHR9XG5cblx0LyoqXG5cdCAqIFRoaXMgaXMgdXNlZCBieSBBbmRyb2lkIHRvIHJlcXVpcmUgXCJiYWtlZC1pblwiIHNvdXJjZS5cblx0ICogU0RLIGFuZCBtb2R1bGUgYnVpbGRzIHdpbGwgYmFrZSBpbiB0aGUgcmF3IHNvdXJjZSBhcyBjIHN0cmluZ3MsIGFuZCB0aGlzIHdpbGwgd3JhcFxuXHQgKiBsb2FkaW5nIHRoYXQgY29kZSBpbiB2aWEga3JvbGwuTmF0aXZlTW9kdWxlLnJlcXVpcmUoPGlkPilcblx0ICogRm9yIG1vcmUgaW5mb3JtYXRpb24sIHNlZSB0aGUgYm9vdHN0cmFwLmpzLmVqcyB0ZW1wbGF0ZS5cblx0ICovXG5cdGZ1bmN0aW9uIE5hdGl2ZU1vZHVsZUJvb3RzdHJhcChnbG9iYWwsIGtyb2xsKSB7XG5cdCAgY29uc3QgU2NyaXB0ID0ga3JvbGwuYmluZGluZygnZXZhbHMnKS5TY3JpcHQ7XG5cdCAgY29uc3QgcnVuSW5UaGlzQ29udGV4dCA9IFNjcmlwdC5ydW5JblRoaXNDb250ZXh0O1xuXG5cdCAgZnVuY3Rpb24gTmF0aXZlTW9kdWxlKGlkKSB7XG5cdCAgICB0aGlzLmZpbGVuYW1lID0gaWQgKyAnLmpzJztcblx0ICAgIHRoaXMuaWQgPSBpZDtcblx0ICAgIHRoaXMuZXhwb3J0cyA9IHt9O1xuXHQgICAgdGhpcy5sb2FkZWQgPSBmYWxzZTtcblx0ICB9XG5cdCAgLyoqXG5cdCAgICogVGhpcyBzaG91bGQgYmUgYW4gb2JqZWN0IHdpdGggc3RyaW5nIGtleXMgKGJha2VkIGluIG1vZHVsZSBpZHMpIC0+IHN0cmluZyB2YWx1ZXMgKHNvdXJjZSBvZiB0aGUgYmFrZWQgaW4ganMgY29kZSlcblx0ICAgKi9cblxuXG5cdCAgTmF0aXZlTW9kdWxlLl9zb3VyY2UgPSBrcm9sbC5iaW5kaW5nKCduYXRpdmVzJyk7XG5cdCAgTmF0aXZlTW9kdWxlLl9jYWNoZSA9IHt9O1xuXG5cdCAgTmF0aXZlTW9kdWxlLnJlcXVpcmUgPSBmdW5jdGlvbiAoaWQpIHtcblx0ICAgIGlmIChpZCA9PT0gJ25hdGl2ZV9tb2R1bGUnKSB7XG5cdCAgICAgIHJldHVybiBOYXRpdmVNb2R1bGU7XG5cdCAgICB9XG5cblx0ICAgIGlmIChpZCA9PT0gJ2ludm9rZXInKSB7XG5cdCAgICAgIHJldHVybiBpbnZva2VyOyAvLyBBbmRyb2lkIG5hdGl2ZSBtb2R1bGVzIHVzZSBhIGJvb3RzdHJhcC5qcyBmaWxlIHRoYXQgYXNzdW1lcyB0aGVyZSdzIGEgYnVpbHRpbiAnaW52b2tlcidcblx0ICAgIH1cblxuXHQgICAgY29uc3QgY2FjaGVkID0gTmF0aXZlTW9kdWxlLmdldENhY2hlZChpZCk7XG5cblx0ICAgIGlmIChjYWNoZWQpIHtcblx0ICAgICAgcmV0dXJuIGNhY2hlZC5leHBvcnRzO1xuXHQgICAgfVxuXG5cdCAgICBpZiAoIU5hdGl2ZU1vZHVsZS5leGlzdHMoaWQpKSB7XG5cdCAgICAgIHRocm93IG5ldyBFcnJvcignTm8gc3VjaCBuYXRpdmUgbW9kdWxlICcgKyBpZCk7XG5cdCAgICB9XG5cblx0ICAgIGNvbnN0IG5hdGl2ZU1vZHVsZSA9IG5ldyBOYXRpdmVNb2R1bGUoaWQpO1xuXHQgICAgbmF0aXZlTW9kdWxlLmNvbXBpbGUoKTtcblx0ICAgIG5hdGl2ZU1vZHVsZS5jYWNoZSgpO1xuXHQgICAgcmV0dXJuIG5hdGl2ZU1vZHVsZS5leHBvcnRzO1xuXHQgIH07XG5cblx0ICBOYXRpdmVNb2R1bGUuZ2V0Q2FjaGVkID0gZnVuY3Rpb24gKGlkKSB7XG5cdCAgICByZXR1cm4gTmF0aXZlTW9kdWxlLl9jYWNoZVtpZF07XG5cdCAgfTtcblxuXHQgIE5hdGl2ZU1vZHVsZS5leGlzdHMgPSBmdW5jdGlvbiAoaWQpIHtcblx0ICAgIHJldHVybiBpZCBpbiBOYXRpdmVNb2R1bGUuX3NvdXJjZTtcblx0ICB9O1xuXG5cdCAgTmF0aXZlTW9kdWxlLmdldFNvdXJjZSA9IGZ1bmN0aW9uIChpZCkge1xuXHQgICAgcmV0dXJuIE5hdGl2ZU1vZHVsZS5fc291cmNlW2lkXTtcblx0ICB9O1xuXG5cdCAgTmF0aXZlTW9kdWxlLndyYXAgPSBmdW5jdGlvbiAoc2NyaXB0KSB7XG5cdCAgICByZXR1cm4gTmF0aXZlTW9kdWxlLndyYXBwZXJbMF0gKyBzY3JpcHQgKyBOYXRpdmVNb2R1bGUud3JhcHBlclsxXTtcblx0ICB9O1xuXG5cdCAgTmF0aXZlTW9kdWxlLndyYXBwZXIgPSBbJyhmdW5jdGlvbiAoZXhwb3J0cywgcmVxdWlyZSwgbW9kdWxlLCBfX2ZpbGVuYW1lLCBfX2Rpcm5hbWUsIFRpdGFuaXVtLCBUaSwgZ2xvYmFsLCBrcm9sbCkgeycsICdcXG59KTsnXTtcblxuXHQgIE5hdGl2ZU1vZHVsZS5wcm90b3R5cGUuY29tcGlsZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIGxldCBzb3VyY2UgPSBOYXRpdmVNb2R1bGUuZ2V0U291cmNlKHRoaXMuaWQpO1xuXHQgICAgc291cmNlID0gTmF0aXZlTW9kdWxlLndyYXAoc291cmNlKTsgLy8gQWxsIG5hdGl2ZSBtb2R1bGVzIGhhdmUgdGhlaXIgZmlsZW5hbWUgcHJlZml4ZWQgd2l0aCB0aTovXG5cblx0ICAgIGNvbnN0IGZpbGVuYW1lID0gYHRpOi8ke3RoaXMuZmlsZW5hbWV9YDtcblx0ICAgIGNvbnN0IGZuID0gcnVuSW5UaGlzQ29udGV4dChzb3VyY2UsIGZpbGVuYW1lLCB0cnVlKTtcblx0ICAgIGZuKHRoaXMuZXhwb3J0cywgTmF0aXZlTW9kdWxlLnJlcXVpcmUsIHRoaXMsIHRoaXMuZmlsZW5hbWUsIG51bGwsIGdsb2JhbC5UaSwgZ2xvYmFsLlRpLCBnbG9iYWwsIGtyb2xsKTtcblx0ICAgIHRoaXMubG9hZGVkID0gdHJ1ZTtcblx0ICB9O1xuXG5cdCAgTmF0aXZlTW9kdWxlLnByb3RvdHlwZS5jYWNoZSA9IGZ1bmN0aW9uICgpIHtcblx0ICAgIE5hdGl2ZU1vZHVsZS5fY2FjaGVbdGhpcy5pZF0gPSB0aGlzO1xuXHQgIH07XG5cblx0ICByZXR1cm4gTmF0aXZlTW9kdWxlO1xuXHR9XG5cblx0Ly8gVGhpcyBpcyB0aGUgZmlsZSBlYWNoIHBsYXRmb3JtIGxvYWRzIG9uIGJvb3QgKmJlZm9yZSogd2UgbGF1bmNoIHRpLm1haW4uanMgdG8gaW5zZXJ0IGFsbCBvdXIgc2hpbXMvZXh0ZW5zaW9uc1xuXHQvKipcblx0ICogbWFpbiBib290c3RyYXBwaW5nIGZ1bmN0aW9uXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBnbG9iYWwgdGhlIGdsb2JhbCBvYmplY3Rcblx0ICogQHBhcmFtIHtvYmplY3R9IGtyb2xsOyB0aGUga3JvbGwgbW9kdWxlL2JpbmRpbmdcblx0ICogQHJldHVybiB7dm9pZH0gICAgICAgW2Rlc2NyaXB0aW9uXVxuXHQgKi9cblxuXHRmdW5jdGlvbiBib290c3RyYXAoZ2xvYmFsLCBrcm9sbCkge1xuXHQgIC8vIFdvcmtzIGlkZW50aWNhbCB0byBPYmplY3QuaGFzT3duUHJvcGVydHksIGV4Y2VwdFxuXHQgIC8vIGFsc28gd29ya3MgaWYgdGhlIGdpdmVuIG9iamVjdCBkb2VzIG5vdCBoYXZlIHRoZSBtZXRob2Rcblx0ICAvLyBvbiBpdHMgcHJvdG90eXBlIG9yIGl0IGhhcyBiZWVuIG1hc2tlZC5cblx0ICBmdW5jdGlvbiBoYXNPd25Qcm9wZXJ0eShvYmplY3QsIHByb3BlcnR5KSB7XG5cdCAgICByZXR1cm4gT2JqZWN0Lmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7XG5cdCAgfVxuXG5cdCAga3JvbGwuZXh0ZW5kID0gZnVuY3Rpb24gKHRoaXNPYmplY3QsIG90aGVyT2JqZWN0KSB7XG5cdCAgICBpZiAoIW90aGVyT2JqZWN0KSB7XG5cdCAgICAgIC8vIGV4dGVuZCB3aXRoIHdoYXQ/ISAgZGVuaWVkIVxuXHQgICAgICByZXR1cm47XG5cdCAgICB9XG5cblx0ICAgIGZvciAodmFyIG5hbWUgaW4gb3RoZXJPYmplY3QpIHtcblx0ICAgICAgaWYgKGhhc093blByb3BlcnR5KG90aGVyT2JqZWN0LCBuYW1lKSkge1xuXHQgICAgICAgIHRoaXNPYmplY3RbbmFtZV0gPSBvdGhlck9iamVjdFtuYW1lXTtcblx0ICAgICAgfVxuXHQgICAgfVxuXG5cdCAgICByZXR1cm4gdGhpc09iamVjdDtcblx0ICB9O1xuXHQgIC8qKlxuXHQgICAqIFRoaXMgaXMgdXNlZCB0byBzaHV0dGxlIHRoZSBzb3VyY2VVcmwgYXJvdW5kIHRvIEFQSXMgdGhhdCBtYXkgbmVlZCB0b1xuXHQgICAqIHJlc29sdmUgcmVsYXRpdmUgcGF0aHMgYmFzZWQgb24gdGhlIGludm9raW5nIGZpbGUuXG5cdCAgICogKHNlZSBLcm9sbEludm9jYXRpb24uamF2YSBmb3IgbW9yZSlcblx0ICAgKiBAcGFyYW0ge29iamVjdH0gdmFycyBrZXkvdmFsdWUgcGFpcnMgdG8gc3RvcmVcblx0ICAgKiBAcGFyYW0ge3N0cmluZ30gdmFycy5zb3VyY2VVcmwgdGhlIHNvdXJjZSBVUkwgb2YgdGhlIGZpbGUgY2FsbGluZyB0aGUgQVBJXG5cdCAgICogQGNvbnN0cnVjdG9yXG5cdCAgICogQHJldHVybnMge1Njb3BlVmFyc31cblx0ICAgKi9cblxuXG5cdCAgZnVuY3Rpb24gU2NvcGVWYXJzKHZhcnMpIHtcblx0ICAgIGlmICghdmFycykge1xuXHQgICAgICByZXR1cm4gdGhpcztcblx0ICAgIH1cblxuXHQgICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHZhcnMpO1xuXHQgICAgY29uc3QgbGVuZ3RoID0ga2V5cy5sZW5ndGg7XG5cblx0ICAgIGZvciAodmFyIGkgPSAwOyBpIDwgbGVuZ3RoOyArK2kpIHtcblx0ICAgICAgY29uc3Qga2V5ID0ga2V5c1tpXTtcblx0ICAgICAgdGhpc1trZXldID0gdmFyc1trZXldO1xuXHQgICAgfVxuXHQgIH1cblxuXHQgIGZ1bmN0aW9uIHN0YXJ0dXAoKSB7XG5cdCAgICBnbG9iYWwuZ2xvYmFsID0gZ2xvYmFsOyAvLyBoYW5nIHRoZSBnbG9iYWwgb2JqZWN0IG9mZiBpdHNlbGZcblxuXHQgICAgZ2xvYmFsLmtyb2xsID0ga3JvbGw7IC8vIGhhbmcgb3VyIHNwZWNpYWwgdW5kZXIgdGhlIGhvb2Qga3JvbGwgb2JqZWN0IG9mZiB0aGUgZ2xvYmFsXG5cblx0ICAgIHtcblx0ICAgICAga3JvbGwuU2NvcGVWYXJzID0gU2NvcGVWYXJzOyAvLyBleHRlcm5hbCBtb2R1bGUgYm9vdHN0cmFwLmpzIGV4cGVjdHMgdG8gY2FsbCBrcm9sbC5OYXRpdmVNb2R1bGUucmVxdWlyZSBkaXJlY3RseSB0byBsb2FkIGluIHRoZWlyIG93biBzb3VyY2Vcblx0ICAgICAgLy8gYW5kIHRvIHJlZmVyIHRvIHRoZSBiYWtlZCBpbiBcImJvb3RzdHJhcC5qc1wiIGZvciB0aGUgU0RLIGFuZCBcImludm9rZXIuanNcIiB0byBoYW5nIGxhenkgQVBJcy93cmFwIGFwaSBjYWxscyB0byBwYXNzIGluIHNjb3BlIHZhcnNcblxuXHQgICAgICBrcm9sbC5OYXRpdmVNb2R1bGUgPSBOYXRpdmVNb2R1bGVCb290c3RyYXAoZ2xvYmFsLCBrcm9sbCk7IC8vIEFuZHJvaWQgdXNlcyBpdCdzIG93biBFdmVudEVtaXR0ZXIgaW1wbCwgYW5kIGl0J3MgYmFrZWQgcmlnaHQgaW50byB0aGUgcHJveHkgY2xhc3MgY2hhaW5cblx0ICAgICAgLy8gSXQgYXNzdW1lcyBpdCBjYW4gY2FsbCBiYWNrIGludG8gamF2YSBwcm94aWVzIHRvIGFsZXJ0IHdoZW4gbGlzdGVuZXJzIGFyZSBhZGRlZC9yZW1vdmVkXG5cdCAgICAgIC8vIEZJWE1FOiBHZXQgaXQgdG8gdXNlIHRoZSBldmVudHMuanMgaW1wbCBpbiB0aGUgbm9kZSBleHRlbnNpb24sIGFuZCBnZXQgaU9TIHRvIGJha2UgdGhhdCBpbnRvIGl0J3MgcHJveGllcyBhcyB3ZWxsIVxuXG5cdCAgICAgIEV2ZW50RW1pdHRlckJvb3RzdHJhcChnbG9iYWwsIGtyb2xsKTtcblx0ICAgIH1cblxuXHQgICAgZ2xvYmFsLlRpID0gZ2xvYmFsLlRpdGFuaXVtID0gYm9vdHN0cmFwJDEoZ2xvYmFsLCBrcm9sbCk7XG5cdCAgICBnbG9iYWwuTW9kdWxlID0gYm9vdHN0cmFwJDIoZ2xvYmFsLCBrcm9sbCk7XG5cdCAgfVxuXG5cdCAgc3RhcnR1cCgpO1xuXHR9XG5cblx0cmV0dXJuIGJvb3RzdHJhcDtcblxufSgpKTtcbiJdLCJzb3VyY2VSb290IjoiL1VzZXJzL21hY0Nlc2FyL0xpYnJhcnkvQXBwbGljYXRpb24gU3VwcG9ydC9UaXRhbml1bS9tb2JpbGVzZGsvb3N4LzEwLjAuMC5HQS9jb21tb24vUmVzb3VyY2VzL2FuZHJvaWQifQ==
