var Gravital = Gravital || {};

Gravital.Game = function() {};
Gravital.Game.prototype =
{
	create: function()
	{
		// declare variables;

		this.player;
		this.debugText; // Debug text
        this.scoreText; // Score text
		
        // Size of game world in pixels
        this.sizeX = 5000;
        this.sizeY = 5000;
        
		this.worldBuffer = 150; // Buffer for respawning masses beyond edge of game area
		
		//var G = 0.50;
		this.G = 10000; // Gravitational constant
		this.accel_max = 200.0; // Factor to limit acceleration on sprites, so they don't wizz off
		
		this.numAsteroids = 400; // Number of masses other than the player that will be created
		this.asteroids; // Group of all asteroids
		this.asteroidCollisionGroup; // CollisionGroup for the masses

		this.comets; // Group of all comets
		this.cometCollisionGroup;
        
		this.gasPlanets; // Group of all gas planets
		this.gasCollisionGroup;
        this.gasPlanetCollisionGroup;
        
        this.specialObjects;
        this.specialCollisionGroup;
        
        this.blackHoles;
        this.blackHoleCollisionGroup;
        
        this.asteroidDensity = 1.0;
        this.cometDensity = 1.5;
        this.gasDensity = 0.25;
        this.gasParticleDensity = 0.5;
        
		this.enemyDensity = 100.0; // Density of enemies
		this.playerDensity = 100.0; // Density of the player
		
		this.playerStartMass = 100.0; // The initial mass of the player
		
		this.sound;
		
		this.globalScaleFactor = 1;
		
		// actual "Create"
		// Play music
        this.music = this.add.audio('soundtrack1');
        this.music.play();
        
		this.tilesprite = this.game.add.tileSprite(0,0, this.sizeX * 2, this.sizeY * 2, 'space');
        this.tilesprite.scale.setTo(1, 1);
        
        // Create sound sprite for blip noise
    	this.sound = this.game.add.audio('asteroidHit');
    	this.sound.allowMultiple = true;
    	this.sound.addMarker('asteroidHit', 0.0, 1.0);
        
        // Set the playable area
        this.game.world.setBounds(0, 0, this.sizeX, this.sizeY);
        
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        
        //Create new CollisionGroup for the masses
    	this.asteroidCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasPlanetCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.cometCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.satelliteCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.blackHoleCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.ufoCollisionGroup = this.game.physics.p2.createCollisionGroup();
        
        this.game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        this.game.physics.p2.setImpactEvents(true);
        
        this.gasPlanets = this.game.add.group();
        this.comets = this.game.add.group();
        this.asteroids = this.game.add.group();
        this.specialObjects = this.game.add.group();
        this.blackHoles = this.game.add.group();
        
        // Create a sprite at the center of the screen using the 'logo' image.
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'asteroid' );
        this.player.massType = 'asteroid';
        this.player.px1000 = this.getImageScale1000px(this.player);
        
        // Camera will follow player around the playable area
        this.game.camera.follow(this.player);
        this.game.camera.deadzone = new Phaser.Rectangle(250, 250, 400, 100);
        
        // P2 physics suits all masses
        this.game.physics.p2.enable(this.player); 
        this.player.body.x = 1000;
        this.player.body.y = 1000;
		this.player.x = 1000;
        this.player.y = 1000;
        
        // Initialize relative physical parameters of the player
        this.player.body.mass = this.playerStartMass;
        this.player.body.density = this.playerDensity;
        this.updateSize(this.player); // Adjust size of the sprite
        this.player.body.damping = 0;
        
        // Enable collisions between the player and children of asteroidCollisionGroup
        this.player.body.collides([this.asteroidCollisionGroup, this.gasCollisionGroup, this.gasPlanetCollisionGroup, this.ufoCollisionGroup]);
        
        // Set the callback method when player collides with another mass
        this.player.body.createGroupCallback(this.asteroidCollisionGroup, this.absorbAsteroid, this);
        this.player.body.createGroupCallback(this.gasCollisionGroup, this.absorbGas, this);
        this.player.body.createGroupCallback(this.gasPlanetCollisionGroup, this.absorbGasPlanet, this);
        this.player.body.createGroupCallback(this.ufoCollisionGroup, this.ufoCollide, this);
        
        // Animate the player sprite
        var spin = this.player.animations.add('spin');
        this.player.animations.play('spin', 15, true);
        
        
        // Create asteroids
        for (var i = 0; i < this.numAsteroids; i++) {
            this.createAsteroid(this.game.rnd.integerInRange(0,this.game.world.width), this.game.rnd.integerInRange(0,this.game.world.height));
        }
        
        // Create comets
        var comet = this.createComet(500,500);
        comet.body.velocity.x = 200;
        comet.body.velocity.y = 300;
        
        var comet2 = this.createComet(0,0);
        comet2.body.velocity.x = 1000;
        comet2.body.velocity.y = 800;
        
        var comet3 = this.createComet(5000, 5600);
        comet3.body.velocity.x = -1800;
        comet3.body.velocity.y = 1900;
        
        var comet4 = this.createComet(3250, 8600);
        comet3.body.velocity.x = -500;
        comet3.body.velocity.y = 1900;
        
        // Create gas giants
        this.createGasPlanet(1100,400);
        
        // Create special objects
        this.createSatellite(1000,800,-120,-120,50,50);
        this.createUFO(1200, 1200, -80, -80, 300, 500);
        
        // Create black holes
        this.createBlackHole(400, 800, 0, 0, 1000, 3000);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        this.debugText = this.game.add.text( this.game.world.centerX, 15, "", style );
        this.debugText.anchor.setTo(0.5, 0.0);
        
        style = { font: "25px Verdana", fill: "#ea09ff", align: "center" };
        this.scoreText = this.game.add.text( this.game.world.centerX, 15, "", style );
        this.scoreText.anchor.setTo(0.5, 0.0);
        
        // fullscreen support
        
        // Stretch to fill
        this.game.scale.fullScreenScaleMode = Phaser.ScaleManager.EXACT_FIT;

        // Keep original size
        // game.scale.fullScreenScaleMode = Phaser.ScaleManager.NO_SCALE;

        // Maintain aspect ratio
        // game.scale.fullScreenScaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.input.onDown.add(this.gofull, this);
	},
    gofull: function()
    {
        if (this.game.scale.isFullScreen)
            {
                this.game.scale.stopFullScreen();
            }
        else
            {
                this.game.scale.startFullScreen(false);
            } 
    },
	update: function()
	{	
        // Reset player force so we can calculate new gravitational pull
		this.player.body.force.x = 0;
        this.player.body.force.y = 0;
        
        // Calculate gravitational pull of all objects, and update special properties
		this.updateAsteroids();
        this.updateComets();
        this.updateGasPlanets();
        this.updateSpecialObjects();
        this.updateBlackHoles();
        
        // User input
        this.updatePlayer();
		this.game.world.wrap(this.player.body, -50, false, true, true); //Make the world wrap around
        
        this.updateScore();
		
        //this.scaleAll(); // Update global scale factor and scale all sprites in order to 'zoom out'
        this.debugGame(); // Update Debug output
	},
    
	updatePlayer: function()
	{
		//player.body.mass *= 0.9997; // Player looses mass at a rate proportional to current mass
        
        // Add gravitational force between the player and the mouse, so that the player can be moved with the mouse
        var angle = this.get_angle(this.player.body, {"x":this.game.input.mousePointer.x+this.game.camera.x, "y":this.game.input.mousePointer.y+this.game.camera.y});
        var r2 = this.get_r2(this.player.body, {"x":this.game.input.mousePointer.x+this.game.camera.x, "y":this.game.input.mousePointer.y+this.game.camera.y});
        if(r2 < this.player.height * this.player.height) {
            r2 = this.player.height * this.player.height;
        }

        
        this.player.body.force.x += (this.G * Math.cos(angle) * this.player.body.mass * this.player.body.mass / r2);
        this.player.body.force.y += (this.G * Math.sin(angle) * this.player.body.mass * this.player.body.mass / r2);
        this.constrain_acceleration(this.player);
		
	},
	updateAsteroids: function()
	{
		this.asteroids.forEachExists(this.updateAsteroid, this);
	},
	updateAsteroid: function(asteroid)
	{
		this.applyGravity(asteroid, this.player); // Gravity
		this.checkBounds(asteroid); // Wrap around game boundaries
	},
	updateComets: function()
	{
        this.comets.forEachExists(this.updateComet,this);
	},
	updateComet: function(comet)
	{     
            var cometSpread = 0.1; // Factor for how much comet dust spreads out
        
            // Update emitter position to match parent sprite
            comet.emitter.x = comet.x;
            comet.emitter.y = comet.y;
            comet.body.rotation = Math.atan2(comet.body.velocity.y, comet.body.velocity.x) - 2.4;
            
            // Update emitter spread according to velocity of parent sprite
            comet.emitter.setXSpeed(-comet.body.velocity.x * cometSpread, comet.body.velocity.x * cometSpread);
            comet.emitter.setYSpeed(-comet.body.velocity.y * cometSpread, comet.body.velocity.y * cometSpread);
            
            this.applyGravity(comet, this.player); // Gravity
            this.checkBounds(comet); // Wrap around game boundaries
	},
	updateGasPlanets: function()
	{
        this.gasPlanets.forEach(this.updateGasPlanet,this, false);
	},
	updateGasPlanet: function(gasPlanet)
	{
            gasPlanet.gas.forEachAlive(this.updateGas,this);
            if(gasPlanet.alive) {
                // Update emission rate of gas particles according to proximity to player
                var distance = this.get_dist(this.player, gasPlanet);
                distance -= gasPlanet.height/2;
                distance -= this.player.height/2;

                if(distance > 400) {
                    gasPlanet.timer.pause();
                } else{

                    gasPlanet.timer.resume();
                    gasPlanet.timer.events[0].delay = distance*3;
                }
                this.applyGravity(gasPlanet, this.player); // Gravity
                this.checkBounds(gasPlanet); // Wrap around game boundaries
            } else {
                if(gasPlanet.gas.countLiving() < 1) {
                    this.gasPlanets.remove(gasPlanet);
                    gasPlanet.destroy();
                }
            }  
		
	},
	updateGas: function(gas)
	{
		this.applyGravity(gas, this.player);
		this.checkBounds(gas);
	},
    updateSpecialObjects: function()
    {
        this.specialObjects.forEachExists(this.updateSpecialObject, this);
    },
    updateSpecialObject: function(sprite) {
        
        switch(sprite.massType) {
            case 'sat':
                {
                var r2 = this.get_dist(sprite, this.player);
                sprite.sound.volume = this.constrain(200/r2, 0, 10);
                this.applyGravity(this.player, sprite);
                }
                break;
            case 'ufo':
                {
                sprite.body.rotation = Math.atan2(sprite.body.velocity.y, sprite.body.velocity.x);  
                }
                break;
            default:
                break;
        }
        
        this.checkBounds(sprite);
    },
    updateBlackHoles: function()
    {
        this.blackHoles.forEachExists(this.updateBlackHole, this);   
    },
    updateBlackHole: function(blackHole)
    {
        this.applyGravity(blackHole, this.player);
        this.checkBounds(blackHole);
    },
    constrain: function(val, min, max) {
        if(val < min) {
            val = min;
        } else if(val > max) {
            val = max;
        }
        return val;
    },
	createAsteroid: function(x,y)
	{
		var asteroid = this.asteroids.create(x, y, 'asteroid');
        asteroid.px1000 = this.getImageScale1000px(asteroid);
		this.game.physics.p2.enable(asteroid);
        asteroid.massType = 'asteroid';
		asteroid.body.density = this.enemyDensity;
        asteroid.body.mass = 5 * this.game.rnd.frac() * this.player.body.mass/this.numAsteroids;
        this.updateSize(asteroid);
		
		var spin = asteroid.animations.add('spin');
		asteroid.animations.play('spin', 30, true);

		asteroid.body.collides(this.asteroidCollisionGroup);
		asteroid.body.collideWorldBounds = false;
		
		asteroid.body.velocity.x = this.game.rnd.integerInRange(-250,250);
		asteroid.body.velocity.y = this.game.rnd.integerInRange(-250,250);            

		asteroid.body.damping = 0;
	
		this.asteroids.add(asteroid);
	},
	createComet: function(x,y)
	{
		var comet = this.game.add.sprite(x, y, 'comet');
        comet.px1000 = this.getImageScale1000px(comet);
        comet.anchor.setTo(0.5);
        comet.scale.setTo(0.2);
        
        this.game.physics.p2.enable(comet);
        comet.body.setCollisionGroup(this.cometCollisionGroup);
        comet.massType = 'comet';
        comet.body.mass = 5;
        comet.body.density = 100;
        comet.body.damping = 0;
        comet.body.collideWorldBounds = false;
        comet.emitter = this.game.add.emitter(comet.x, comet.y, 300);
        comet.emitter.physicsBodyType = Phaser.Physics.P2; // Doesn't work for some reason, Phaser hasn't implemented yet
        comet.emitter.enableBody = true;
        comet.emitter.enableBodyDebug = true;
        
        //Constrain size of particles
        comet.emitter.minParticleScale = 0.01;
        comet.emitter.maxParticleScale = 0.01;
        
        comet.emitter.makeParticles('cometDust');
        comet.emitter.setAll('body.mass', 0.00001);
        comet.emitter.setXSpeed(-100, 100);
        comet.emitter.setYSpeed(-100, 100);
        comet.emitter.gravity = 0;
        comet.emitter.start(false, 5000, 10);
        
        comet.exists = true;
        
        this.comets.add(comet); // Add this comet to the comet group
        
        return comet;
	},
	createGasPlanet: function(x,y)
	{
		var planet = this.game.add.sprite(x,y, 'ball');
        planet.px1000 = this.getImageScale1000px(planet);
        planet.anchor.setTo(0.5);
        planet.scale.setTo(2);
        planet.massType = 'gasPlanet';
        
        this.game.physics.p2.enable(planet);
        planet.body.mass = 750;
        planet.body.density = 40.0;
        planet.body.damping = 0;
        planet.body.angularDamping = 0;
        planet.body.angularVelocity = -0.2;
        planet.body.collideWorldBounds = false;
        
        
        // Timer to control emission of gas
        planet.timer = this.game.time.create(true);
        planet.timer.loop(1000, this.emitGas, this, planet);
        planet.timer.start();
        
        planet.gas = this.game.add.group(); // Group for the gas planet's emitted gas particles
        
        var numGasParticles = 300
        // Create the gas particles (they won't be emitted until player is close enough)
        for(var i = 0; i < numGasParticles; i++) {
            var gasParticle = planet.gas.create(500, 500, 'gasParticleOrange');

            this.game.physics.p2.enable(gasParticle);
            gasParticle.px1000 = this.getImageScale1000px(gasParticle);
            gasParticle.massType = 'gasParticle';
            
            gasParticle.body.mass = planet.body.mass/numGasParticles;
            gasParticle.body.density = planet.body.density;
            
            
            this.updateSize(gasParticle);
            gasParticle.body.setCollisionGroup(this.gasCollisionGroup);
           
            gasParticle.kill();
            gasParticle.body.collides(this.asteroidCollisionGroup);
            gasParticle.body.collideWorldBounds = false;
            gasParticle.body.damping = 0;
           

            gasParticle.body.planetX = planet.x;
            gasParticle.body.planetY = planet.y;
            
            var gasAnimation = gasParticle.animations.add('gasAnimation');
            gasParticle.animations.play('gasAnimation', this.game.rnd.integerInRange(5,25), true);
            //temp.tint = 0xeeaa00;// Slooooow, edit image file
        }
        
        // Scale planet according to size and density
        this.updateSize(planet);
        planet.body.setCollisionGroup(this.gasPlanetCollisionGroup);
        planet.body.collides(this.asteroidCollisionGroup);
        // Add planet to the gasPlanets group
        this.gasPlanets.add(planet);
        
        return planet;  
	},
    createBlackHole: function(x, y, vx, vy, mass, density) {
        var blackHole = this.game.add.sprite(x, y, 'BlackHole');
        this.game.physics.p2.enable(blackHole);
        
        blackHole.collideWorldBounds = false;
        blackHole.massType = 'blackHole';
        blackHole.body.mass = mass;
        blackHole.body.density = density;
        blackHole.body.velocity.x = vx;
        blackHole.body.velocity.y = vy;
        blackHole.body.angularDamping = 0;
        blackHole.body.angularVelocity = 1;
        
        blackHole.px1000 = this.getImageScale1000px(blackHole);
        this.updateSize(blackHole);
        
        this.blackHoles.add(blackHole);
        return blackHole;
    },
    createSatellite: function(x, y, vx, vy, mass, density) {
        
        var sat = this.game.add.sprite(x, y, 'Satellite1');
        sat.animations.add('spin');
        sat.animations.play('spin', 15, true);
        this.game.physics.p2.enable(sat);
        sat.collideWorldBounds = false;
        sat.px1000 = this.getImageScale1000px(sat);
        
        sat.massType = 'sat';
        
        sat.body.mass = mass;
        sat.body.density = density;
        sat.body.damping = 0;
        this.updateSize(sat);
        sat.body.velocity.x = vx;
        sat.body.velocity.y = vy;
        
        sat.body.angularDamping = 0;
        sat.body.angularVelocity = 0.5;
        
        sat.sound = this.game.add.audio('SatelliteSound1');
        sat.sound.allowMultiple = false;
        
        // Timer for sat noise
        sat.noiseTimer = this.game.time.create(true);
        sat.noiseTimer.loop(1000, function(){sat.sound.play();}, this, sat);
        sat.noiseTimer.start();
        
        // Add sat to the specialObjects group
        this.specialObjects.add(sat);
        
        return sat;
    },
    createUFO: function(x, y, vx, vy, mass, density) {
        var ufo = this.game.add.sprite(x, y, 'UFO');

        this.game.physics.p2.enable(ufo);
        ufo.collideWorldBounds = false;
        ufo.px1000 = this.getImageScale1000px(ufo);
        
        ufo.massType = 'ufo';
        
        ufo.body.mass = mass;
        ufo.body.density = density;
        ufo.body.damping = 0;
        this.updateSize(ufo);
        ufo.body.velocity.x = vx;
        ufo.body.velocity.y = vy;
        
        ufo.body.angularDamping = 0;
        
        ufo.sound = this.game.add.audio('UFOSound1');
        ufo.sound.allowMultiple = false;
        
        // Timer for ufo movement
        ufo.moveTimer = this.game.time.create(true);
        ufo.moveTimer.loop(750, 
            function() {
                ufo.body.velocity.x = this.game.rnd.integerInRange(-1000,1000);
                ufo.body.velocity.y = this.game.rnd.integerInRange(-1000,1000);
            },
            this, ufo);
        ufo.moveTimer.start();
        ufo.body.setCollisionGroup(this.ufoCollisionGroup);
        ufo.body.collides(this.asteroidCollisionGroup);
        // Add ufo to the specialObjects group
        this.specialObjects.add(ufo);
        
        return ufo;
    },
    ufoCollide: function(playerBody, ufoBody) {
//        playerBody.x = this.game.rnd.integerInRange(0, this.game.world.width);
//        playerBody.y = this.game.rnd.integerInRange(0, this.game.world.height);
        playerBody.x = 0;
        playerBody.y = 0;
        playerBody.velocity.x = 30;
        playerBody.velocity.y = 30;
        ufoBody.sprite.sound.play();
    },
    setupMass: function(sprite) {
        this.game.physics.p2.enable(sprite);
        sprite.px1000 = this.getImageScale1000px(sprite);
        sprite.body.damping = 0;
        sprite.collideWorldBounds = false;
    },
	emitGas: function(GasPlanet)
	{
        if(GasPlanet.alive) {
            var nextgas = GasPlanet.gas.getFirstDead();
            if(nextgas) {
                var angle = this.get_angle(GasPlanet, this.player);
                angle += this.game.rnd.frac() * 0.3 * this.game.rnd.integerInRange(-1,1);
                nextgas.reset(GasPlanet.x + Math.cos(angle) * (GasPlanet.height/2 - nextgas.height/2), GasPlanet.y + Math.sin(angle)*(GasPlanet.height/2 - nextgas.height/2));
                nextgas.body.velocity.x = GasPlanet.body.velocity.x;
                nextgas.body.velocity.y = GasPlanet.body.velocity.y;

                nextgas.revive();

                GasPlanet.body.mass -= nextgas.body.mass;
                if(GasPlanet.body.mass <= 0) {
                    this.resetGasPlanet(GasPlanet);
                } else {
                    this.updateSize(GasPlanet);
                }
            }
        }
	},
    resetGasPlanet: function(gasPlanet) {
            gasPlanet.timer.stop();
            gasPlanet.kill();
            this.createGasPlanet(200,200);
    },
	absorbGas: function(body1, body2)
	{
        this.animateText(body2.x, body2.y, body2.mass.toFixed(1));
        body1.mass += body2.mass;
        this.updateSize(body1.sprite); // player grows
		body2.sprite.kill();
	},
	absorbAsteroid: function(body1, body2)
	{
        this.animateText(body2.x, body2.y, body2.mass.toFixed(1));
		this.sound.play('asteroidHit');
        if(this.player.body.mass < 10000) {
            body1.mass += body2.mass; // Player absorbs mass
 
        }
        
        this.updateSize(body1.sprite); // Player grows
        this.resetAsteroid(body2); // Reset the mass that was absorbed
	},
    absorbGasPlanet: function(playerBody, gasPlanetBody) {
        if(playerBody.sprite.height >= gasPlanetBody.sprite.height) {
            playerBody.mass += gasPlanetBody.mass;
            this.updateSize(playerBody.sprite);
            this.resetGasPlanet(gasPlanetBody.sprite);
        } else {
            //this.music.stop();
            //this.game.state.start('Loss');
            //this.game.state.start('MainMenu');
        }
    },
    gameOver: function() {
        
    },
    fadingText(x, y, height, duration) {
        
    },
    scaleAll: function() {
        this.globalScaleFactor = 10/Math.sqrt(player.body.mass);
        this.asteroids.forEach(this.updateSize, this, false);
        this.gasPlanets.forEach(
            function(gasPlanet) {
                gasPlanet.gas.forEach(this.updateSize, this, false);
                this.updateSize(gasPlanet)
            }, this, false);
        this.comets.forEach(this.updateSize, this, false);
        this.updateSize(this.player);
    },
	updateSize: function(sprite) 
	{
		var scaleFactor = sprite.body.mass/sprite.body.density;
		scaleFactor = Math.cbrt(scaleFactor);
        scaleFactor *= 0.1;
        scaleFactor *= this.globalScaleFactor;

    
        sprite.scale.setTo(sprite.px1000 * scaleFactor); // Update size based on mass and density 10
        sprite.massRadius = sprite.height/2;
        sprite.body.setCircle(sprite.height/3); // Create new body to fit new size
        
        switch(sprite.massType) {
                
            case 'asteroid':
                sprite.body.setCollisionGroup(this.asteroidCollisionGroup); // CollisionGroup must be updated when a new body is created
                break;
            case 'comet':
                sprite.body.setCollisionGroup(this.cometCollisionGroup);
                break;
            case 'gasPlanet':
                sprite.body.setCollisionGroup(this.gasPlanetCollisionGroup);
                break;
            case 'gasParticle':
                sprite.body.setCollisionGroup(this.gasCollisionGroup);
                break;
            case 'ufo':
                sprite.body.setCollisionGroup(this.ufoCollisionGroup);
                break;
            default:
                sprite.body.setCollisionGroup(this.asteroidCollisionGroup);
                break;
        }
    },
    getImageScale1000px: function (sprite) {
        sprite.scale.setTo(1);
        return 1000.0 / sprite.height;  
    },
    
    //Wrap world boundaries for sprite
	checkBounds: function (sprite) 
	{
        if(sprite.body.x < 0 - this.worldBuffer) {
            sprite.body.x = this.game.world.width + this.worldBuffer;
        } else if(sprite.body.x > this.game.world.width + this.worldBuffer) {
            sprite.body.x = 0 - this.worldBuffer;
        }

        if(sprite.body.y < 0 - this.worldBuffer) {
            sprite.body.y = this.game.world.height + this.worldBuffer;
        } else if(sprite.body.y > this.game.world.height + this.worldBuffer) {
            sprite.body.y = 0 - this.worldBuffer;
        } 
    },
	resetAsteroid: function (body) 
	{

        var side = this.game.rnd.integerInRange(1,4);
        var newX, newY;
        switch(side) { // Chose an edge of the world to locate the sprite (offscreen)
            case 1: // Top
                newX = this.game.rnd.integerInRange(-100, this.game.world.width+100);
                newY = this.game.rnd.integerInRange(-150,-50);
                break;
            case 2: // Bottom
                newX = this.game.rnd.integerInRange(-100, this.game.world.width+100);
                newY = this.game.rnd.integerInRange(this.game.world.height + 50, this.game.world.height + 150);
                break;
            case 3: // Left
                newX = this.game.rnd.integerInRange(-150,-50);
                newY = this.game.rnd.integerInRange(-100, this.game.world.height + 100);
                break;
            case 4: // Right
            default:
                newX = this.game.rnd.integerInRange(this.game.world.width + 50, this.game.world.width + 150);
                newY = this.game.rnd.integerInRange(-100, this.game.world.height + 100);

        }

        body.reset(newX, newY); // Put the sprite there
        // Give the sprite a new mass / size
        body.mass = 5 * this.game.rnd.frac() * this.player.body.mass/this.numAsteroids;
        this.updateSize(body.sprite);
    },
    animateText(x, y, text) {
        var animatedText;
        var style = { font: "18px Verdana", fill: "#ffffff", align: "center" };
        animatedText = this.game.add.text( x, y, 100, style );
        animatedText.anchor.setTo(0.5, 0.5);
        animatedText.setText(text);
        animatedText.x = x;
        animatedText.y = y;
        animatedText.alpha = 1;
        this.game.time.events.add(0, function() {
            this.game.add.tween(animatedText).to({y: y - 30}, 500, Phaser.Easing.Linear.None, true);    this.game.add.tween(animatedText).to({alpha: 0}, 500, Phaser.Easing.Linear.None, true);
        }, this); 
    },
	
	applyGravity: function (sprite1, sprite2) 
	{

        var angle = this.get_angle(sprite1, sprite2);
        var r2 = this.get_r2(sprite1, sprite2);

        sprite1.body.force.x = (this.G * Math.cos(angle) * sprite1.body.mass * sprite2.body.mass) / r2;
        sprite1.body.force.y = (this.G * Math.sin(angle) * sprite1.body.mass * sprite2.body.mass) / r2;
        this.constrain_acceleration(sprite1);
        sprite2.body.force.x += -sprite1.body.force.x;
        sprite2.body.force.y += -sprite1.body.force.y;
        
    },
	render: function()
	{
		
	},
	debugGame: function () 
	{
//        this.debugText.setText("\
//                        player.mass: " 
//                    + this.player.body.mass.toFixed(4)
//                    + "\nplayer.radius: "
//                    + this.player.height/2
//                    + "\nx: " + this.player.x + " y: " + this.debugText);
        this.debugText.x = this.game.camera.x + this.debugText.width;
        this.debugText.y = this.game.camera.y + this.game.camera.height - this.debugText.height;
    },
    updateScore: function ()
    {
        this.scoreText.x = this.game.camera.x + 500;
        this.scoreText.y = this.game.camera.y;
        this.scoreText.setText( "Mass: " + this.player.body.mass.toFixed(2)
                              + "\tRadius: " + (this.player.height/2).toFixed(2));
    },
	
	 // Returns the angle between two objects
    get_angle: function (object1, object2) 
	{
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    },
	
	// Returns the distance squared between two objects
    get_r2: function (object1, object2) 
	{
        return ((object2.x - object1.x) * (object2.x - object1.x)) + ((object2.y - object1.y) *  (object2.y - object1.y));
    },
	
	get_dist: function (object1, object2) {
        return Math.sqrt(this.get_r2(object1, object2)) / this.globalScaleFactor;
    },
    
	// This will constrain the acceleration on an object to a maximum magnitude
    constrain_acceleration: function (object) 
	{
        var accel_x = object.body.force.x/object.body.mass;
        var accel_y = object.body.force.y/object.body.mass;
        
        if(accel_x > this.accel_max) {
            object.body.force.x = this.accel_max * object.body.mass;
        } else if (accel_x < -this.accel_max) {
            object.body.force.x = -this.accel_max * object.body.mass;
        }
        
        if(accel_y > this.accel_max) {
            object.body.force.y = this.accel_max * object.body.mass;
        } else if (accel_y < -this.accel_max) {
            object.body.force.y = -this.accel_max * object.body.mass;
        }
        
    },
    
    // This will constrain the force on an object to a maximum magnitude
    constrain_force: function (object) 
	{
        var force_x = object.body.force.x;
        var force_y = object.body.force.y;
        
        if(force_x > this.force_max) {
            object.body.force.x = this.force_max;
        } else if(force_x < -this.force_max) {
            object.body.force.x = -this.force_max;
        }
        
        if(force_y > this.force_max) {
            object.body.force.y = this.force_max;
        } else if(force_y < -this.force_max) {
            object.body.force.y = -this.force_max;
        }
    }	
};