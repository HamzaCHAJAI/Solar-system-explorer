# Guide d'installation - Solar System Explorer

## Option 1 : Utilisation sans Node.js (Recommandé si npm ne fonctionne pas)

Cette version utilise IndexedDB (base de données du navigateur) et ne nécessite **aucune installation**.

### Étapes :

1. **Ouvrir directement le fichier** `solar3d.html` dans votre navigateur
   - Double-cliquez sur `solar3d.html`
   - OU faites un clic droit → "Ouvrir avec" → votre navigateur

2. **C'est tout !** L'application fonctionne directement.

### Avantages :
- ✅ Aucune installation nécessaire
- ✅ Fonctionne immédiatement
- ✅ Les planètes sont sauvegardées dans le navigateur (IndexedDB)
- ✅ Pas besoin de serveur

### Limitations :
- Les données sont stockées localement dans votre navigateur
- Si vous supprimez les données du navigateur, les planètes personnalisées seront perdues

---

## Option 2 : Utilisation avec Node.js (Serveur + SQLite)

Si vous voulez utiliser la version avec serveur et base de données SQLite :

### Prérequis :
- Node.js installé (téléchargez depuis https://nodejs.org/)
- npm (inclus avec Node.js)

### Étapes :

1. **Installer Node.js** :
   - Téléchargez depuis : https://nodejs.org/
   - Installez la version LTS (recommandée)
   - Redémarrez votre terminal après l'installation

2. **Vérifier l'installation** :
   ```bash
   node --version
   npm --version
   ```

3. **Installer les dépendances** :
   ```bash
   npm install
   ```

4. **Démarrer le serveur** :
   ```bash
   npm start
   ```

5. **Ouvrir dans le navigateur** :
   - Page 3D : http://localhost:3000/3d
   - Page principale : http://localhost:3000

### Avantages :
- ✅ Base de données SQLite persistante
- ✅ API REST pour gérer les planètes
- ✅ Intégration avec les APIs NASA

---

## Résolution des problèmes

### "npm n'est pas reconnu"
- **Solution** : Installez Node.js depuis https://nodejs.org/
- Après l'installation, redémarrez votre terminal
- Utilisez l'**Option 1** si vous ne voulez pas installer Node.js

### L'application ne se charge pas
- Vérifiez que vous utilisez un navigateur moderne (Chrome, Firefox, Edge)
- Vérifiez la console du navigateur (F12) pour les erreurs

### Les planètes personnalisées disparaissent
- **Avec Option 1** : Ne supprimez pas les données du navigateur
- **Avec Option 2** : Vérifiez que le fichier `planets.db` existe

---

## Fichiers importants

- `solar3d.html` : Page principale 3D
- `solar3d-client.js` : Version client (sans serveur) - **Utilisé par défaut**
- `solar3d.js` : Version serveur (nécessite Node.js)
- `server.js` : Serveur Node.js (nécessite npm install)

