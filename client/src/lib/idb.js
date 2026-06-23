const IDB = {
  DB_NAME: 'worldcup2026',
  DB_VERSION: 2,
  STORE: 'apiCache',

  open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(this.STORE)) {
          db.createObjectStore(this.STORE);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  get(key) {
    return this.open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(this.STORE, 'readonly');
          const req = tx.objectStore(this.STORE).get(key);
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => reject(req.error);
        })
    );
  },

  set(key, value) {
    return this.open().then(
      (db) =>
        new Promise((resolve, reject) => {
          const tx = db.transaction(this.STORE, 'readwrite');
          tx.objectStore(this.STORE).put(value, key);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        })
    );
  },

  async getAll() {
    const keys = ['teams', 'games', 'stadiums', 'groups', 'squads'];
    const results = await Promise.all(keys.map((k) => this.get(k)));
    const cache = {};
    keys.forEach((k, i) => {
      if (results[i]) cache[k] = results[i];
    });
    return cache;
  },

  saveAll({ teams, games, stadiums, groups, squads }) {
    const now = Date.now();
    const writes = [
      this.set('teams', { data: teams, cachedAt: now }),
      this.set('games', { data: games, cachedAt: now }),
      this.set('stadiums', { data: stadiums, cachedAt: now }),
      this.set('groups', { data: groups, cachedAt: now })
    ];
    if (squads) {
      writes.push(this.set('squads', { data: squads, cachedAt: now }));
    }
    return Promise.all(writes);
  }
};

export default IDB;
