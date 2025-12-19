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

// Planètes personnalisées chargées depuis la base de données
let customPlanets = [];

let scene, camera, renderer, controls;
let planets = [];
let orbits = [];
let labels = [];
let showOrbits = true;
let showLabels = true;
let rotationSpeed = 1;
let nasaData = {};

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
function init() {
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
  loadCustomPlanets();

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
      planetName: formData.get('planetName'),
      type: formData.get('type'),
      size: parseFloat(formData.get('size')),
      distance: parseFloat(formData.get('distance')),
      temperature: parseFloat(formData.get('temperature')),
      atmosphere: atmosphere,
      hasWater: document.getElementById('hasWater').checked
    };

    try {
      const response = await fetch('/api/planets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(planetData)
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Planète ajoutée avec succès!');
        modal.classList.remove('active');
        planetForm.reset();
        
        // Recharger les planètes personnalisées
        await loadCustomPlanets();
      } else {
        alert('Erreur: ' + result.error);
      }
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
  } else {
    // Informations de base pour les planètes du système solaire
    const planetInfo = planetsData.find(p => p.name === planetName);
    if (planetInfo) {
      infoElement.textContent = `Rayon: ${planetInfo.radius} unités | Distance: ${planetInfo.distance} unités`;
    }

    // Charger les données NASA si disponibles
    if (nasaData[planetName]) {
      const data = nasaData[planetName];
      if (data.items && data.items.length > 0) {
        const image = data.items[0].links[0].href;
        imageElement.src = image;
        imageElement.style.display = 'block';
      }
    } else {
      // Charger les données depuis l'API
      try {
        const response = await fetch(`/api/nasa/planet/${planetName}`);
        const data = await response.json();
        nasaData[planetName] = data;
        
        if (data.collection && data.collection.items && data.collection.items.length > 0) {
          const image = data.collection.items[0].links[0].href;
          imageElement.src = image;
          imageElement.style.display = 'block';
        }
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        imageElement.style.display = 'none';
      }
    }
  }

  infoPanel.classList.add('active');
}

// Fermer le panneau d'information
function closeInfoPanel() {
  document.getElementById('infoPanel').classList.remove('active');
}

// Charger les données NASA
async function loadNasaData() {
  try {
    const response = await fetch('/api/nasa/apod');
    const data = await response.json();
    console.log('Données NASA APOD:', data);
    alert('Données NASA chargées! Consultez la console pour plus de détails.');
  } catch (error) {
    console.error('Erreur lors du chargement des données NASA:', error);
    alert('Erreur lors du chargement des données NASA');
  }
}

// Charger les planètes personnalisées depuis la base de données
async function loadCustomPlanets() {
  try {
    const response = await fetch('/api/planets');
    const customPlanetsData = await response.json();
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
    planetData: planetData
  };

  scene.add(planet);
  planets.push(planet);
}

// Démarrer l'application
init();

