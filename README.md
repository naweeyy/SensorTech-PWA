# SensorTech — README simple

Description

> Application PWA pour consulter les données des capteurs (tabs `sondes` et `toilettes`), avec cache Workbox et notifications locales.

Commandes rapides

```bash
# installer les dépendances
pnpm install

# développement (http://localhost:5173)
pnpm dev

# build production
pnpm build

# servir la build pour tester le SW (http://localhost:4173)
pnpm preview
```

Configuration API

> Crée un fichier `.env` ou ajoute dans ton environnement :

```env
VITE_API_URL=https://example.com
```

L'app appelle :

- `${VITE_API_URL}/sondes`
- `${VITE_API_URL}/toilettes`

Vite PWA (extrait de `vite.config.ts`)

> Workbox est configuré pour mettre en cache les requêtes API vers `/sondes` et `/toilettes` (NetworkFirst).

```ts
VitePWA({
  registerType: "autoUpdate",
  includeAssets: ["vite.svg"],
  manifest: {},
  workbox: {
    globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
    runtimeCaching: [
      {
        urlPattern: ({ url }) => /\/(sondes|toilettes)$/i.test(url.pathname),
        handler: "NetworkFirst",
        options: {
          cacheName: "api-cache",
          expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
          networkTimeoutSeconds: 3,
          cacheableResponse: { statuses: [0, 200] },
        },
      },
    ],
    cleanupOutdatedCaches: true,
    skipWaiting: true,
    clientsClaim: true,
  },
});
```

Notifications (extrait de `src/main.tsx`)

> Fonction simple utilisée par `Tableau.tsx` pour afficher des notifications locales (demande de permission).

```ts
export const sentNotification = (message: string) => {
  Notification.requestPermission().then((result) => {
    if (result === "granted") {
      new Notification(message);
    }
  });
};
```

Notes :

- Les notifications fonctionnent seulement sur `https` (ou `localhost`).
- Tu peux améliorer en demandant la permission au démarrage et en utiliser des options (icon, tag, etc.).

Composant principal

> `src/components/Tableau.tsx` gère :

- les onglets `sondes` / `toilettes`
- le fetch sur `${VITE_API_URL}/{tab}`
- le fallback vers le cache (cache côté page + Workbox)
- l'envoi de notifications sur mise à jour, basculement online/offline, et erreurs

Tester le mode hors-ligne

1. `pnpm build`
2. `pnpm preview`
3. Ouvrir DevTools → Application → Service Workers et Cache Storage
4. Mettre le réseau en "Offline" dans DevTools → vérifier que les données en cache sont affichées
