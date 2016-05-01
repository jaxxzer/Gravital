var Gravital = Gravital || {};

Gravital.Game = function() {};
Gravital.Game.prototype =
{
	create: function()
	{
		// declare variables;
		
//        var spriteTest1 = this.game.add.sprite(400, 600, 'ball');
//        spriteTest1.anchor.setTo(0.5);
//        spriteTest1.px1000 = this.getImageScale1000px(spriteTest1);
//        spriteTest1.scale.setTo(spriteTest1.px1000);
//        
//        var spriteTest2 = this.game.add.sprite(500, 500, 'ball');
//        spriteTest2.anchor.setTo(0.5);
//        spriteTest2.px1000 = this.getImageScale1000px(spriteTest2);
//        spriteTest2.scale.setTo(spriteTest1.px1000*0.5);
        
        
		this.player;
		this.text; // Debug text
		
		this.worldBuffer = 150; // Buffer for respawning masses beyond edge of game area
		
		//var G = 0.50;
		this.G = 10000; // Gravitational constant
		this.accel_max = 200.0; // Factor to limit acceleration on sprites, so they don't wizz off
		
		this.numAsteroids = 50; // Number of masses other than the player that will be created
		this.asteroids; // Group of all asteroids
		this.asteroidCollisionGroup; // CollisionGroup for the masses

		this.comets; // Group of all comets
		this.cometCollisionGroup;
        
		this.gasPlanets; // Group of all gas planets
		this.gasCollisionGroup;
        this.gasPlanetCollisionGroup;
        
        this.specialObjects;
        this.specialCollisionGroup;
        
        this.asteroidDensity = 1.0;
        this.cometDensity = 1.5;
        this.gasDensity = 0.25;
        this.gasParticleDensity = 0.5;
        
		this.enemyDensity = 100.0; // Density of enemies
		this.playerDensity = 100.0; // Density of the player
		
		this.playerStartMass = 100.0; // The initial mass of the player
		
		this.sound;
		
		
		
		// actual "Create"
		// Play music
        this.music = this.add.audio('soundtrack1');
        this.music.play();
        
		this.tilesprite = this.game.add.tileSprite(0,0,2000, 2000, 'space');
        
        // Create sound sprite for blip noise
    	this.sound = this.game.add.audio('asteroidHit');
    	this.sound.allowMultiple = true;
    	this.sound.addMarker('asteroidHit', 0.0, 1.0);
        
        // Set the playable area
        this.game.world.setBounds(0, 0, 2000,2000);
        
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        
        //Create new CollisionGroup for the masses
    	this.asteroidCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasPlanetCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.cometCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        this.game.physics.p2.setImpactEvents(true);
        
        this.gasPlanets = this.game.add.group();
        this.comets = this.game.add.group();
        this.asteroids = this.game.add.group();
        
        // Create a sprite at the center of the screen using the 'logo' image.
        this.player = this.game.add.sprite(this.game.world.centerX, this.game.world.centerY, 'asteroid' );
        this.player.px1000 = this.getImageScale1000px(this.player);
        
        // Camera will follow player around the playable area
        this.game.camera.follow(this.player);
        this.game.camera.deadzone = new Phaser.Rectangle(100, 100, 800, 400);
        
        // P2 physics suits all masses
        this.game.physics.p2.enable(this.player); 
        this.player.body.x = 800;
        this.player.body.y = 800;
		this.player.x = 800;
        this.player.y = 800;
        
        // Initialize relative physical parameters of the player
        this.player.body.mass = this.playerStartMass;
        this.player.body.density = this.playerDensity;
        this.updateSize(this.player); // Adjust size of the sprite
        this.player.body.damping = 0;
        
        // Enable collisions between the player and children of asteroidCollisionGroup
        this.player.body.collides([this.asteroidCollisionGroup, this.gasCollisionGroup, this.gasPlanetCollisionGroup]);
        
        // Set the callback method when player collides with another mass
        this.player.body.createGroupCallback(this.asteroidCollisionGroup, this.absorbAsteroid, this);
        this.player.body.createGroupCallback(this.gasCollisionGroup, this.absorbGas, this);
        this.player.body.createGroupCallback(this.gasPlanetCollisionGroup, this.absorbGasPlanet, this);
        
//        player.body.debug = true; // Will show the P2 physics body
        
        // Animate the player sprite
        var spin = this.player.animations.add('spin');
        this.player.animations.play('spin', 15, true);
        
        
        // Create asteroids
        for (var i = 0; i < this.numAsteroids; i++) {
            this.createAsteroid(this.game.rnd.integerInRange(0,this.game.world.width), this.game.rnd.integerInRange(0,this.game.world.height));
        }
        
        // Create comets
        var comet = this.createComet(500,500);
        comet.body.velocity.x = 50;
        comet.body.velocity.y = -50;
        
        var comet2 = this.createComet(0,0);
        comet2.body.velocity.x = 500;
        comet2.body.velocity.y = 500;
        
        // Create gas giants
        this.createGasPlanet(1100,400);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        this.text = this.game.add.text( this.game.world.centerX, 15, "Build something awesome.", style );
        this.text.anchor.setTo(0.5, 0.0);
	},
	update: function()
	{	
		this.player.body.force.x = 0;
        this.player.body.force.y = 0;
		this.updateAsteroids();
        this.updateComets();
        this.updateGasPlanets();
        
        this.updatePlayer();
		this.game.world.wrap(this.player.body, -50, false, true, true); //Make the world wrap around
		
        this.debugGame(); // Display some text with information
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
        comet.body.mass = 0.0001;
        comet.body.damping = 0;
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
        
        planet.body.collideWorldBounds = false;
        
        
        // Timer to control emission of gas
        planet.timer = this.game.time.create(true);
        planet.timer.loop(1000, this.emitGas, this, planet);
        planet.timer.start();
        
        planet.gas = this.game.add.group(); // Group for the gas planet's emitted gas particles
        
        var numGasParticles = 300
        // Create the gas particles (they won't be emitted until player is close enough)
        for(var i = 0; i < numGasParticles; i++) {
            var temp = planet.gas.create(500, 500, 'gasParticleOrange');

            this.game.physics.p2.enable(temp);
            temp.px1000 = this.getImageScale1000px(temp);
            temp.massType = 'gasParticle';
            
            temp.body.mass = planet.body.mass/numGasParticles;
            temp.body.density = planet.body.density;
            
            //temp.body.setCircle(10);
            this.updateSize(temp);
            temp.body.setCollisionGroup(this.gasCollisionGroup);
            //temp.scale.setTo(0.25);
            temp.kill();
            temp.body.collides(this.asteroidCollisionGroup);
            temp.body.collideWorldBounds = false;
            temp.body.damping = 0;
           
            //updateSize(temp); // ToDo: Tune gas mass and density so we can use this
            //temp.body.massType = 'special';
            temp.body.planetX = planet.x;
            temp.body.planetY = planet.y;
            
            var gasAnimation = temp.animations.add('gasAnimation');
            temp.animations.play('gasAnimation', this.game.rnd.integerInRange(5,25), true);
            //temp.tint = 0xeeaa00;
        }
        
        // Scale planet according to size and density
        this.updateSize(planet);
        planet.body.setCollisionGroup(this.gasPlanetCollisionGroup);
        planet.body.collides(this.asteroidCollisionGroup);
        // Add planet to the gasPlanets group
        this.gasPlanets.add(planet);
        
        return planet;  
	},
    createUFO: function(x, y, vx, vy, mass, density) {
        
        var specialObject = this.game.add.sprite(x, y, 'UFO');
        this.game.physics.p2.enable(sprite);
        sprite.px1000 = this.getImageScale1000px(sprite);
        this.setupMass(specialObject);
        sprite.body.mass = mass;
        sprite.body.density = density;
        this.updateSize(sprite);
        sprite.body.velocity.x = vx;
        sprite.body.velocity.y = vy;
        
        return sprite;
    },
    setupMass: function(sprite) {

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
                this.text.setText(GasPlanet.height + "," + this.player.height);

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
        this.animateText(body2.x, body2.y, body2.mass.toFixed(0));
        body1.mass += body2.mass;
		body2.sprite.kill();
	},
	absorbAsteroid: function(body1, body2)
	{
        this.animateText(body2.x, body2.y, body2.mass.toFixed(0));
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
            this.resetGasPlanet(gasPlanetBody.sprite);
        } else {
            this.music.stop();
            this.game.state.start('MainMenu');
        }
    },
    gameOver: function() {
        
    },
    fadingText(x, y, height, duration) {
        
    },
	updateSize: function(sprite) 
	{
		var scaleFactor = sprite.body.mass/sprite.body.density;
		scaleFactor = Math.cbrt(scaleFactor);
        scaleFactor *= 0.1;
        //scaleFactor *= 10 / Math.sqrt(this.player.body.mass);
    
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
            default:
                sprite.body.setCollisionGroup(this.asteroidCollisionGroup);
                break;
        }
    },
    getImageScale1000px: function (sprite) {
        sprite.scale.setTo(1);
        return 1000.0 / sprite.height;  
    },
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
//        this.text.setText("\
//                        player.mass: " 
//                    + this.player.body.mass.toFixed(4)
//                    + "\nplayer.radius: "
//                    + this.player.height/2
//                    + "\nx: " + this.player.x + " y: " + this.debugText);
        this.text.x = this.game.camera.x + this.text.width;
        this.text.y = this.game.camera.y + this.game.camera.height - this.text.height;
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
        return Math.sqrt(this.get_r2(object1, object2));
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