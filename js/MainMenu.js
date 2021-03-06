var Gravital = Gravital || {};
Gravital.MainMenu = function () {};

Gravital.MainMenu.prototype = 
{
	init: function (score)
	{
		var score = score || 0;
		this.highestScore = this.highestScore || 0;
		this.highestScore = Math.max(score, this.highestScore);
	},
	
	create: function()
	{
		// add background
		this.tilesprite = this.game.add.tileSprite(0,0,2000, 2000, 'space');
		
		// scroll background
			
		// buffer
		this.worldBuffer = 50; 
        
		// show game start text
		var text = "Click for tutorial";
		var style = { font: "30px Arial", fill: "#fff", align: "center" };
		var t = this.game.add.text(this.game.width/2, this.game.height/2, text, style);
		t.anchor.set(0.5);
		
		//highest score
		//text = "Highest score: "+this.highestScore;
		//style = { font: "15px Arial", fill: "#fff", align: "center" };
  
		//var h = this.game.add.text(this.game.width/2, this.game.height/2 + 50, text, style);
		//h.anchor.set(0.5);
		
        
        // gmae to look like actual game
        //this.game.world.setBounds(0, 0, 800,800);
        
        this.game.physics.startSystem(Phaser.Physics.P2JS);
        
        
        this.asteroidCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.gasPlanetCollisionGroup = this.game.physics.p2.createCollisionGroup();
        this.cometCollisionGroup = this.game.physics.p2.createCollisionGroup();
        //this.satelliteCollisionGroup = this.game.physics.p2.createCollisionGroup();
        //this.blackHoleCollisionGroup = this.game.physics.p2.createCollisionGroup();
        //this.ufoCollisionGroup = this.game.physics.p2.createCollisionGroup();
        
         
        this.game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        this.game.physics.p2.setImpactEvents(true);
        
        this.gasPlanets = this.game.add.group();
        this.comets = this.game.add.group();
        this.asteroids = this.game.add.group();
        
       
		// random stuff on menu screen
		for (var i = 0; i < 5; i++) {
            this.createAsteroid(this.game.rnd.integerInRange(0,this.game.world.width), this.game.rnd.integerInRange(0,this.game.world.height));
        }
		
		this.comets = this.game.add.group();
		for (var i = 0; i <2; i ++)
		{
			this.createComet(this.game.rnd.integerInRange(0,this.game.world.width), this.game.rnd.integerInRange(0,this.game.world.height));
		}
        this.createGasPlanet(1100,400);
		
	},
	createAsteroid: function(x,y)
	{
		var asteroid = this.asteroids.create(x, y, 'asteroid');
        asteroid.px1000 = this.getImageScale1000px(asteroid);
		this.game.physics.p2.enable(asteroid);
        //asteroid.massType = 'asteroid';
		//asteroid.body.density = this.enemyDensity;
		//this.newEnemy(asteroid);
		
		var spin = asteroid.animations.add('spin');
		asteroid.animations.play('spin', 30, true);

		//asteroid.body.collides(this.asteroidCollisionGroup);
		//asteroid.body.collideWorldBounds = false;
		
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
        //comet.body.setCollisionGroup(this.cometCollisionGroup);
        //comet.massType = 'comet';
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
		
		
        comet.body.velocity.x = this.game.rnd.integerInRange(-1000,1000);
        comet.body.velocity.y = this.game.rnd.integerInRange(-1000,1000);
        
        this.comets.add(comet); // Add this comet to the comet group
        
        return comet;
	},
    getImageScale1000px: function (sprite) {
        sprite.scale.setTo(1);
        return 1000.0 / sprite.height;  
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
            
            //this.applyGravity(comet, this.player); // Gravity
            this.checkBounds(comet); // Wrap around game boundaries
        if (comet.body.velocity.x < 400 && comet.body.velocity.x > -400)
        {
            comet.body.velocity.x = this.game.rnd.integerInRange(-1000,1000);
        }
        if (comet.body.velocity.y <400 && comet.body.velocity.y > -400)
        {
            comet.body.velocity.y = this.game.rnd.integerInRange(-1000,1000);
        }
	},
    createGasPlanet: function(x,y)
	{
		var planet = this.game.add.sprite(x,y, 'ball');
        planet.px1000 = this.getImageScale1000px(planet);
        planet.anchor.setTo(0.5);
        planet.scale.setTo(2);
        planet.massType = 'gasPlanet';
        
        
        
        return planet;  
	},
    updateAsteroids: function()
	{
		this.asteroids.forEachExists(this.updateAsteroid, this);
	},
	updateAsteroid: function(asteroid)
	{
		//this.applyGravity(asteroid, this.player); // Gravity
		this.checkBounds(asteroid); // Wrap around game boundaries
	},
	update: function() 
	{
		if (this.game.input.activePointer.justPressed())
		{
			this.game.state.start('Tutorial');
		}
        this.updateAsteroids();
        this.updateComets();
		
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
};