// Site storage for the Ontology Alchemy Game on masteringallyship.com.
//
// The game was written as a claude.ai artifact and saves through window.claude.use("db")
// and window.claude.use("user"). Those exist only inside claude.ai. On the site this file
// provides the same small surface the game calls (doc().get/set, collection().doc(),
// collection().orderBy().limit().get(), user.id()) backed by this browser's localStorage,
// so the welcome-back line, the Wuxing Wheel and the open-threads ledger work for a
// returning client on the same device. Nothing here talks to a server.
//
// If localStorage is unavailable (private mode, blocked storage), use() resolves to null,
// which the game already treats as "no persistence": it plays exactly as before, unsaved.
(function () {
  "use strict";
  window.__ontologySite = true;
  if (window.claude && typeof window.claude.use === "function") return;

  var PREFIX = "oag:";
  var store = null;
  try {
    var probe = PREFIX + "__probe";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    store = window.localStorage;
  } catch (e) {
    store = null;
  }

  function read(key, fallback) {
    try {
      var raw = store.getItem(PREFIX + key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch (e) {
      return fallback;
    }
  }
  function write(key, value) {
    store.setItem(PREFIX + key, JSON.stringify(value));
  }

  function snapshot(value) {
    return { exists: value !== undefined && value !== null, data: function () { return value; } };
  }

  function docRef(path) {
    return {
      get: function () { return Promise.resolve(snapshot(read("doc:" + path, null))); },
      set: function (value) {
        write("doc:" + path, value);
        var cut = path.lastIndexOf("/");
        var coll = path.slice(0, cut);
        var id = path.slice(cut + 1);
        var ids = read("index:" + coll, []);
        if (ids.indexOf(id) === -1) { ids.push(id); write("index:" + coll, ids); }
        return Promise.resolve();
      },
      collection: function (name) { return collectionRef(path + "/" + name); },
    };
  }

  function collectionRef(path, order, max) {
    return {
      doc: function (id) { return docRef(path + "/" + id); },
      orderBy: function (field, dir) { return collectionRef(path, { field: field, dir: dir || "asc" }, max); },
      limit: function (n) { return collectionRef(path, order, n); },
      get: function () {
        var docs = read("index:" + path, [])
          .map(function (id) { return read("doc:" + path + "/" + id, null); })
          .filter(function (d) { return d !== null; });
        if (order) {
          docs.sort(function (a, b) {
            var x = a[order.field], y = b[order.field];
            var c = x < y ? -1 : x > y ? 1 : 0;
            return order.dir === "desc" ? -c : c;
          });
        }
        if (typeof max === "number") docs = docs.slice(0, max);
        return Promise.resolve({ docs: docs.map(function (d) { return { data: function () { return d; } }; }) });
      },
    };
  }

  function userId() {
    var id = read("uid", null);
    if (!id) {
      id = "p_" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      write("uid", id);
    }
    return id;
  }

  window.claude = {
    use: function (name) {
      if (!store) return Promise.resolve(null);
      if (name === "db") return Promise.resolve({ doc: docRef });
      if (name === "user") return Promise.resolve({ id: function () { return Promise.resolve(userId()); } });
      return Promise.resolve(null);
    },
  };
})();
