// Version client connectée au backend 
// Configuration du système solaire
const planetsData = [
  { name: 'Soleil', radius: 5, distance: 0, color: 0xffff00, speed: 0, texture: null },
  { name: 'Mercure', radius: 0.4, distance: 8, color: 0x8c7853, speed: 0.02 },
  { name: 'Vénus', radius: 0.6, distance: 11, color: 0xffc649, speed: 0.015 },
  { name: 'Terre', radius: 0.6, distance: 14, color: 0x6b93d6, speed: 0.01 },
  { name: 'Mars', radius: 0.5, distance: 18, color: 0xc1440e, speed: 0.008 },
  { name: 'Jupiter', radius: 1.2, distance: 24, color: 0xd8ca9d, speed: 0.005 },
  { name: 'Saturne', radius: 1.0, distance: 30, color: 0xfad5a5, speed: 0.003 },
  { name: 'Uranus', radius: 0.8, distance: 36, color: 0x4fd0e7, speed: 0.002 },
  { name: 'Neptune', radius: 0.8, distance: 42, color: 0x4b70dd, speed: 0.001 }
];

// Planètes personnalisées chargées depuis le backend (MySQL)
let customPlanets = [];
let db = null; 

let scene, camera, renderer, controls;
let planets = [];
let orbits = [];
let labels = [];
let showOrbits = true;
let showLabels = true;
let rotationSpeed = 1;
let nasaData = {};

// --- Fonctions utilitaires pour communiquer avec l'API backend / MySQL ---

// Sauvegarder une planète dans MySQL via l'API
async function savePlanetToServer(planetData) {
  const response = await fetch('/api/planets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      pseudo: planetData.pseudo,
      planetName: planetData.name,
      type: planetData.type,
      size: planetData.size,
      distance: planetData.distance,
      temperature: planetData.temperature,
      atmosphere: planetData.atmosphere,
      hasWater: planetData.hasWater
    })
  });

  if (!response.ok) {
    throw new Error('Erreur lors de la sauvegarde sur le serveur: ' + response.status);
  }

  const data = await response.json();
  return data.id;
}

// Charger toutes les planètes personnalisées depuis MySQL
async function loadPlanetsFromServer() {
  const response = await fetch('/api/planets');
  if (!response.ok) {
    throw new Error('Erreur lors du chargement des planètes: ' + response.status);
  }
  return await response.json();
}

// Supprimer une planète dans MySQL
async function deletePlanetFromServer(planetId) {
  const response = await fetch(`/api/planets/${planetId}`, {
    method: 'DELETE'
  });
  if (!response.ok) {
    throw new Error('Erreur lors de la suppression de la planète: ' + response.status);
  }
}

// Supprimer toutes les planètes personnalisées dans MySQL
async function deleteAllPlanetsFromServer() {
  const planets = await loadPlanetsFromServer();
  for (const planet of planets) {
    await deletePlanetFromServer(planet.id);
  }
}

// Contrôles de caméra simplifiés
function createSimpleControls(camera, domElement) {
  let isDragging = false;
  let previousMousePosition = { x: 0, y: 0 };
  let spherical = new THREE.Spherical();
  spherical.setFromVector3(camera.position);
  
  const controls = {
    enableDamping: true,
    dampingFactor: 0.05,
    minDistance: 10,
    maxDistance: 200,
    target: new THREE.Vector3(0, 0, 0),
    
    reset: function() {
      camera.position.set(0, 20, 50);
      spherical.setFromVector3(camera.position);
    },
    
    update: function() {
      camera.lookAt(this.target);
    }
  };

  domElement.addEventListener('mousedown', (e) => {
    isDragging = true;
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  domElement.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - previousMousePosition.x;
    const deltaY = e.clientY - previousMousePosition.y;
    
    spherical.theta -= deltaX * 0.01;
    spherical.phi += deltaY * 0.01;
    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi));
    
    camera.position.setFromSpherical(spherical);
    previousMousePosition = { x: e.clientX, y: e.clientY };
  });

  domElement.addEventListener('mouseup', () => {
    isDragging = false;
  });

  domElement.addEventListener('wheel', (e) => {
    e.preventDefault();
    spherical.radius += e.deltaY * 0.01;
    spherical.radius = Math.max(controls.minDistance, Math.min(controls.maxDistance, spherical.radius));
    camera.position.setFromSpherical(spherical);
  });

  return controls;
}

// Initialisation
async function init() {
  // Scène
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Caméra
  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(0, 20, 50);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('canvas-container').appendChild(renderer.domElement);

  // Contrôles de la caméra simplifiés
  controls = createSimpleControls(camera, renderer.domElement);

  // Étoiles
  createStars();

  // Créer les planètes
  createPlanets();

  // Charger les planètes personnalisées
  await loadCustomPlanets();

  // Événements
  setupEventListeners();

  // Masquer le loading
  document.getElementById('loading').style.display = 'none';

  // Animation
  animate();
}

// Créer les étoiles
function createStars() {
  const starsGeometry = new THREE.BufferGeometry();
  const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff, size: 0.1 });

  const starsVertices = [];
  for (let i = 0; i < 10000; i++) {
    const x = (Math.random() - 0.5) * 2000;
    const y = (Math.random() - 0.5) * 2000;
    const z = (Math.random() - 0.5) * 2000;
    starsVertices.push(x, y, z);
  }

  starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);
}

// Créer les planètes
function createPlanets() {
  planetsData.forEach((data, index) => {
    let geometry, material, planet;

    if (data.name === 'Soleil') {
      // Soleil avec émission de lumière
      geometry = new THREE.SphereGeometry(data.radius, 32, 32);
      material = new THREE.MeshBasicMaterial({ color: data.color });
      planet = new THREE.Mesh(geometry, material);
      
      // Ajouter une lumière au soleil
      const sunLight = new THREE.PointLight(0xffffff, 2, 300);
      planet.add(sunLight);
    } else {
      geometry = new THREE.SphereGeometry(data.radius, 32, 32);
      material = new THREE.MeshPhongMaterial({ color: data.color });
      planet = new THREE.Mesh(geometry, material);
      
      // Créer l'orbite
      const orbitGeometry = new THREE.RingGeometry(data.distance - 0.1, data.distance + 0.1, 64);
      const orbitMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x444444, 
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.3
      });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = -Math.PI / 2;
      scene.add(orbit);
      orbits.push(orbit);

      // Créer le label
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 64;
      context.fillStyle = 'rgba(0, 0, 0, 0.5)';
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = '#ffffff';
      context.font = '24px Arial';
      context.textAlign = 'center';
      context.fillText(data.name, canvas.width / 2, canvas.height / 2);

      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.scale.set(4, 1, 1);
      sprite.position.set(data.distance, data.radius + 2, 0);
      scene.add(sprite);
      labels.push(sprite);
    }

    planet.userData = {
      name: data.name,
      speed: data.speed,
      distance: data.distance,
      angle: Math.random() * Math.PI * 2
    };

    scene.add(planet);
    planets.push(planet);
  });
}

// Animation
function animate() {
  requestAnimationFrame(animate);

  // Rotation des planètes autour du soleil
  planets.forEach((planet, index) => {
    if (planet.userData.name !== 'Soleil') {
      planet.userData.angle += planet.userData.speed * rotationSpeed;
      const x = Math.cos(planet.userData.angle) * planet.userData.distance;
      const z = Math.sin(planet.userData.angle) * planet.userData.distance;
      planet.position.set(x, 0, z);
      
      // Rotation de la planète sur elle-même
      planet.rotation.y += 0.01 * rotationSpeed;
    } else {
      // Rotation du soleil
      planet.rotation.y += 0.002 * rotationSpeed;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}

// Gestionnaires d'événements
function setupEventListeners() {
  // Réinitialiser la vue
  document.getElementById('resetView').addEventListener('click', () => {
    camera.position.set(0, 20, 50);
    controls.reset();
  });

  // Toggle orbites
  document.getElementById('toggleOrbits').addEventListener('click', () => {
    showOrbits = !showOrbits;
    orbits.forEach(orbit => {
      orbit.visible = showOrbits;
    });
  });

  // Toggle labels
  document.getElementById('toggleLabels').addEventListener('click', () => {
    showLabels = !showLabels;
    labels.forEach(label => {
      label.visible = showLabels;
    });
  });

  // Contrôle de vitesse
  const speedControl = document.getElementById('speedControl');
  speedControl.addEventListener('input', (e) => {
    rotationSpeed = parseFloat(e.target.value);
    document.getElementById('speedValue').textContent = rotationSpeed.toFixed(1) + 'x';
  });

  // Redimensionnement
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Clic sur une planète
  renderer.domElement.addEventListener('click', onPlanetClick);

  // Gestion du modal d'ajout de planète
  const modal = document.getElementById('planetModal');
  const addPlanetBtn = document.getElementById('addPlanetBtn');
  const closeModal = document.querySelector('.close-modal');
  const cancelBtn = document.getElementById('cancelBtn');
  const planetForm = document.getElementById('planetForm');

  addPlanetBtn.addEventListener('click', () => {
    modal.classList.add('active');
  });

  closeModal.addEventListener('click', () => {
    modal.classList.remove('active');
    planetForm.reset();
  });

  cancelBtn.addEventListener('click', () => {
    modal.classList.remove('active');
    planetForm.reset();
  });

  // Fermer le modal en cliquant en dehors
  window.addEventListener('click', (event) => {
    if (event.target === modal) {
      modal.classList.remove('active');
      planetForm.reset();
    }
  });

  // Bouton pour supprimer toutes les planètes
  const deleteAllPlanetsBtn = document.getElementById('deleteAllPlanetsBtn');
  deleteAllPlanetsBtn.addEventListener('click', async () => {
    if (customPlanets.length === 0) {
      alert('Aucune planète personnalisée à supprimer.');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer toutes les ${customPlanets.length} planète(s) personnalisée(s) ?`)) {
      try {
        await deleteAllPlanetsFromServer();
        customPlanets = [];
        
        // Supprimer toutes les planètes personnalisées de la scène
        const planetsToRemove = [];
        const orbitsToRemove = [];
        const labelsToRemove = [];
        
        planets.forEach((planet, index) => {
          if (planet.userData.custom) {
            scene.remove(planet);
            planetsToRemove.push(index);
            
            // Trouver et supprimer l'orbite correspondante
            orbits.forEach((orbit, orbitIndex) => {
              if (Math.abs(orbit.geometry.parameters.innerRadius - (planet.userData.distance - 0.1)) < 0.01) {
                scene.remove(orbit);
                orbitsToRemove.push(orbitIndex);
              }
            });
            
            // Trouver et supprimer le label correspondant
            labels.forEach((label, labelIndex) => {
              if (Math.abs(label.position.x - planet.userData.distance) < 0.01) {
                scene.remove(label);
                labelsToRemove.push(labelIndex);
              }
            });
          }
        });
        
        // Retirer les éléments des tableaux (en ordre inverse pour éviter les problèmes d'index)
        planetsToRemove.reverse().forEach(index => planets.splice(index, 1));
        orbitsToRemove.reverse().forEach(index => orbits.splice(index, 1));
        labelsToRemove.reverse().forEach(index => labels.splice(index, 1));
        
        alert('Toutes les planètes personnalisées ont été supprimées.');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression des planètes.');
      }
    }
  });

  // Bouton pour supprimer une planète spécifique
  const deletePlanetBtn = document.getElementById('deletePlanetBtn');
  deletePlanetBtn.addEventListener('click', async () => {
    const infoPanel = document.getElementById('infoPanel');
    const planetName = document.getElementById('planetName').textContent;
    const customPlanet = customPlanets.find(p => p.name === planetName);
    
    if (!customPlanet || !customPlanet.id) {
      alert('Cette planète ne peut pas être supprimée.');
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer la planète "${planetName}" ?`)) {
      try {
        await deletePlanetFromServer(customPlanet.id);
        
        // Supprimer la planète de la scène en utilisant l'ID
        const planetToRemove = planets.find(p => p.userData.planetId === customPlanet.id && p.userData.custom);
        if (planetToRemove) {
          scene.remove(planetToRemove);
          const planetIndex = planets.indexOf(planetToRemove);
          if (planetIndex > -1) planets.splice(planetIndex, 1);
          
          // Supprimer l'orbite correspondante
          const orbitToRemove = orbits.find((orbit, orbitIndex) => {
            return Math.abs(orbit.geometry.parameters.innerRadius - (planetToRemove.userData.distance - 0.1)) < 0.01;
          });
          if (orbitToRemove) {
            scene.remove(orbitToRemove);
            const orbitIndex = orbits.indexOf(orbitToRemove);
            if (orbitIndex > -1) orbits.splice(orbitIndex, 1);
          }
          
          // Supprimer le label correspondant
          const labelToRemove = labels.find((label) => {
            return Math.abs(label.position.x - planetToRemove.userData.distance) < 0.01;
          });
          if (labelToRemove) {
            scene.remove(labelToRemove);
            const labelIndex = labels.indexOf(labelToRemove);
            if (labelIndex > -1) labels.splice(labelIndex, 1);
          }
        }
        
        // Retirer de la liste des planètes personnalisées
        customPlanets = customPlanets.filter(p => p.id !== customPlanet.id);
        
        // Fermer le panneau d'information
        infoPanel.classList.remove('active');
        
        alert('Planète supprimée avec succès.');
      } catch (error) {
        console.error('Erreur lors de la suppression:', error);
        alert('Erreur lors de la suppression de la planète.');
      }
    }
  });

  // Gestion de la soumission du formulaire
  planetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(planetForm);
    const atmosphere = [];
    
    // Récupérer les cases d'atmosphère cochées
    const atmosphereCheckboxes = planetForm.querySelectorAll('input[name="atmosphere"]:checked');
    atmosphereCheckboxes.forEach(checkbox => {
      atmosphere.push(checkbox.value);
    });
    
    const planetData = {
      pseudo: formData.get('pseudo'),
      name: formData.get('planetName'),
      type: formData.get('type'),
      size: parseFloat(formData.get('size')),
      distance: parseFloat(formData.get('distance')),
      temperature: parseFloat(formData.get('temperature')),
      atmosphere: atmosphere,
      hasWater: document.getElementById('hasWater').checked,
      createdAt: new Date().toISOString()
    };

    try {
      // Sauvegarder dans la base MySQL via l'API
      const planetId = await savePlanetToServer(planetData);
      planetData.id = planetId; // Ajouter l'ID retourné par le backend
      
      alert('Planète ajoutée avec succès!');
      modal.classList.remove('active');
      planetForm.reset();
      
      // Recharger les planètes personnalisées pour avoir l'ID complet
      await loadCustomPlanets();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la planète:', error);
      alert('Erreur lors de l\'ajout de la planète. Veuillez réessayer.');
    }
  });
}

// Détection de clic sur une planète
function onPlanetClick(event) {
  const mouse = new THREE.Vector2();
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(mouse, camera);

  const intersects = raycaster.intersectObjects(planets);
  if (intersects.length > 0) {
    const planet = intersects[0].object;
    showPlanetInfo(planet.userData.name);
  }
}

// Afficher les informations d'une planète
async function showPlanetInfo(planetName) {
  const infoPanel = document.getElementById('infoPanel');
  const nameElement = document.getElementById('planetName');
  const infoElement = document.getElementById('planetInfo');
  const imageElement = document.getElementById('planetImage');
  const planetActions = document.getElementById('planetActions');

  nameElement.textContent = planetName;
  
  // Vérifier si c'est une planète personnalisée
  const customPlanet = customPlanets.find(p => p.name === planetName);
  
  if (customPlanet) {
    // Afficher les informations de la planète personnalisée
    const atmosphereText = Array.isArray(customPlanet.atmosphere) 
      ? customPlanet.atmosphere.join(', ') 
      : customPlanet.atmosphere || 'Aucune';
    
    infoElement.innerHTML = `
      <strong>Pseudo:</strong> ${customPlanet.pseudo}<br>
      <strong>Type:</strong> ${customPlanet.type}<br>
      <strong>Taille:</strong> ${customPlanet.size} unités<br>
      <strong>Distance:</strong> ${customPlanet.distance} unités<br>
      <strong>Température:</strong> ${customPlanet.temperature}°C<br>
      <strong>Atmosphère:</strong> ${atmosphereText}<br>
      <strong>Eau:</strong> ${customPlanet.hasWater ? 'Oui' : 'Non'}
    `;
    imageElement.style.display = 'none';
    
    // Afficher le bouton de suppression pour les planètes personnalisées
    planetActions.style.display = 'block';
  } else {
    // Informations de base pour les planètes du système solaire
    const planetInfo = planetsData.find(p => p.name === planetName);
    if (planetInfo) {
      infoElement.textContent = `Rayon: ${planetInfo.radius} unités | Distance: ${planetInfo.distance} unités`;
    }
    imageElement.style.display = 'none';
    
    // Masquer le bouton de suppression pour les planètes du système solaire
    planetActions.style.display = 'none';
  }

  infoPanel.classList.add('active');
}

// Fermer le panneau d'information
function closeInfoPanel() {
  document.getElementById('infoPanel').classList.remove('active');
}

// Charger les planètes personnalisées depuis IndexedDB
async function loadCustomPlanets() {
  try {
    const customPlanetsData = await loadPlanetsFromServer();
    
    // Supprimer les anciennes planètes personnalisées de la scène
    const planetsToRemove = [];
    const orbitsToRemove = [];
    const labelsToRemove = [];
    
    planets.forEach((planet, index) => {
      if (planet.userData.custom) {
        scene.remove(planet);
        planetsToRemove.push(index);
        
        // Trouver et marquer l'orbite correspondante
        orbits.forEach((orbit, orbitIndex) => {
          if (Math.abs(orbit.geometry.parameters.innerRadius - (planet.userData.distance - 0.1)) < 0.01) {
            scene.remove(orbit);
            orbitsToRemove.push(orbitIndex);
          }
        });
        
        // Trouver et marquer le label correspondant
        labels.forEach((label, labelIndex) => {
          if (Math.abs(label.position.x - planet.userData.distance) < 0.01) {
            scene.remove(label);
            labelsToRemove.push(labelIndex);
          }
        });
      }
    });
    
    // Retirer les éléments des tableaux (en ordre inverse)
    planetsToRemove.reverse().forEach(index => planets.splice(index, 1));
    orbitsToRemove.reverse().forEach(index => orbits.splice(index, 1));
    labelsToRemove.reverse().forEach(index => labels.splice(index, 1));
    
    // Mettre à jour la liste des planètes personnalisées
    customPlanets = customPlanetsData;
    
    // Créer les planètes personnalisées dans la scène
    customPlanets.forEach(planetData => {
      createCustomPlanet(planetData);
    });
  } catch (error) {
    console.error('Erreur lors du chargement des planètes personnalisées:', error);
  }
}

// Créer une planète personnalisée
function createCustomPlanet(planetData) {
  // Déterminer la couleur en fonction du type
  let color = 0x888888; // Couleur par défaut
  switch(planetData.type) {
    case 'rocheuse':
      color = 0x8c7853; // Marron/beige
      break;
    case 'gazeuse':
      color = 0xd8ca9d; // Jaune pâle
      break;
    case 'oceanique':
      color = 0x4b70dd; // Bleu
      break;
  }

  // Ajuster la vitesse en fonction de la distance (plus loin = plus lent)
  const speed = 0.01 / (planetData.distance / 10);

  const geometry = new THREE.SphereGeometry(planetData.size, 32, 32);
  const material = new THREE.MeshPhongMaterial({ color: color });
  const planet = new THREE.Mesh(geometry, material);

  // Créer l'orbite
  const orbitGeometry = new THREE.RingGeometry(planetData.distance - 0.1, planetData.distance + 0.1, 64);
  const orbitMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x444444, 
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3
  });
  const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
  orbit.rotation.x = -Math.PI / 2;
  scene.add(orbit);
  orbits.push(orbit);

  // Créer le label
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  canvas.width = 256;
  canvas.height = 64;
  context.fillStyle = 'rgba(0, 0, 0, 0.5)';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.font = '24px Arial';
  context.textAlign = 'center';
  context.fillText(planetData.name, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);
  sprite.position.set(planetData.distance, planetData.size + 2, 0);
  scene.add(sprite);
  labels.push(sprite);

  planet.userData = {
    name: planetData.name,
    speed: speed,
    distance: planetData.distance,
    angle: Math.random() * Math.PI * 2,
    custom: true,
    planetId: planetData.id,
    planetData: planetData
  };

  scene.add(planet);
  planets.push(planet);
}

// Démarrer l'application
init();


