# Solar System Explorer

Une application web interactive pour explorer le système solaire avec visualisation 2D et 3D, intégrant les APIs NASA.

## Fonctionnalités

- **Page principale** : Visualisation interactive 2D du système solaire avec informations détaillées sur chaque planète
- **Page 3D** : Visualisation 3D interactive du système solaire avec contrôles de caméra
- **Intégration NASA** : Accès aux images et données de la NASA via leurs APIs
- **Backend Node.js** : Serveur Express pour gérer les requêtes API

## Installation

1. Installer les dépendances :
```bash
npm install
```

2. Démarrer le serveur :
```bash
npm start
```

Pour le développement avec rechargement automatique :
```bash
npm run dev
```

3. Ouvrir votre navigateur à :
- Page principale : http://localhost:3000
- Page 3D : http://localhost:3000/3d

## APIs NASA utilisées

- **APOD (Astronomy Picture of the Day)** : Image astronomique du jour
- **NASA Image and Video Library** : Recherche d'images de planètes et objets célestes

## Structure du projet

```
├── index.html          # Page principale (2D)
├── solar3d.html        # Page système solaire 3D
├── solar3d.js          # Script JavaScript pour la visualisation 3D
├── style.css           # Styles CSS pour la page principale
├── server.js           # Serveur Node.js/Express
├── package.json        # Dépendances du projet
└── README.md           # Documentation
```

## Technologies utilisées

- **Frontend** : HTML5, CSS3, JavaScript, Three.js
- **Backend** : Node.js, Express
- **APIs** : NASA APIs (APOD, Image and Video Library)

## Notes

- Pour utiliser les APIs NASA avec votre propre clé API, remplacez `DEMO_KEY` dans `server.js` par votre clé API NASA
- Obtenez votre clé API gratuite sur : https://api.nasa.gov/

## Auteur

Hamza Chajai et Julien Ledouble


