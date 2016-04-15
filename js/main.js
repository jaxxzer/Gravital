window.onload = function() {
    // You might want to start with a template that uses GameStates:
    //     https://github.com/photonstorm/phaser/tree/master/resources/Project%20Templates/Basic
    
    // You can copy-and-paste the code from any of the examples at http://examples.phaser.io here.
    // You will need to change the fourth parameter to "new Phaser.Game()" from
    // 'phaser-example' to 'game', which is the id of the HTML element where we
    // want the game to go.
    // The assets (and code) can be found at: https://github.com/photonstorm/phaser/tree/master/examples/assets
    // You will need to change the paths you pass to "game.load.image()" or any other
    // loading functions to reflect where you are putting the assets.
    // All loading functions will typically all be found inside "preload()".
    
    "use strict";
    
    var game = new Phaser.Game( 1000, 600, Phaser.CANVAS, 'game', { preload: preload, create: create, update: update, render: render} );
    
    function preload() {
        game.load.audio('blip', 'assets/Blip.ogg');
        game.load.spritesheet('asteroid', 'assets/asteroid_sprite_sheet.png', 128, 128, 32);
        game.load.image('ball', 'assets/blueball.png');
        game.load.image('space', 'assets/SPACE.jpg');
    }
    var tilesprite;
    var player;
    var text;
    
    var worldBuffer = 150;
    
    //var G = 0.50;
    var G = 5000; // Gravitational constant
    var accel_max = 200.0; // Factor to limit acceleration on sprites, so they don't wizz off
    
    var masses; // Group of all masses in the game
    var massCollisionGroup; // CollisionGroup for the masses
    var mass;
    
    var gasPlanets; // Group of all gas planets
    var gasCollisionGroup;
    
    var comets; // Group of all comets
    
    var asteroids; // Group of all asteroids
    
    var enemyDensity = 100.0; // Density of enemies
    var playerDensity = 100.0; // Density of the player
    
    var playerStartMass = 100.0; // The initial mass of the player
    
    var numAsteroids = 50; // Number of masses other than the player that will be created
    
    var asteroid;
    var spin;
    var sound;

    var cometSpread = 0.1;

    
    var gasTimer;
    
    function create() {
        tilesprite = game.add.tileSprite(0,0,2000, 2000, 'space'); // Background image
        
        // Create sound sprite for blip noise
    	sound = game.add.audio('blip');
    	sound.allowMultiple = true;
    	sound.addMarker('blip', 0.0, 1.0);
        
        // Set the playable area
        game.world.setBounds(0, 0, 2000,2000);
        
        game.physics.startSystem(Phaser.Physics.P2JS);
        
        //Create new CollisionGroup for the masses
    	massCollisionGroup = game.physics.p2.createCollisionGroup();
        gasCollisionGroup = game.physics.p2.createCollisionGroup();
        game.physics.p2.updateBoundsCollisionGroup(); // So sprites will still collide with world bounds
        game.physics.p2.setImpactEvents(true);
        
        // All masses are a part of this group
        masses = game.add.group();
        gasPlanets = game.add.group();
        comets = game.add.group();
        asteroids = game.add.group();
        
        // Create a sprite at the center of the screen using the 'logo' image.
        player = game.add.sprite(game.world.centerX, game.world.centerY, 'asteroid' );
        
        // Camera will follow player around the playable area
        game.camera.follow(player);
        game.camera.deadzone = new Phaser.Rectangle(100, 100, 800, 400);
        
        // P2 physics suits all masses
        game.physics.p2.enable(player); 
        player.body.x = 800;
        player.body.y = 800;
        player.x = 800;
        player.y = 800;
        
        // Initialize relative physical parameters of the player
        player.body.mass = playerStartMass;
        player.body.density = playerDensity;
        updateSize(player); // Adjust size of the sprite
        
        // Enable collisions between the player and children of massCollisionGroup
        player.body.collides([massCollisionGroup, gasCollisionGroup]);
        
        // Set the callback method when player collides with another mass
        player.body.createGroupCallback(massCollisionGroup, absorb, this);
        player.body.createGroupCallback(gasCollisionGroup, returnGas, this);
        
//        player.body.debug = true; // Will show the P2 physics body
        
        // Animate the player sprite
        spin = player.animations.add('spin');
        player.animations.play('spin', 15, true);
        
        
        // Create asteroids
        for (var i = 0; i < numAsteroids; i++) {
            createAsteroid(game.rnd.integerInRange(0,game.world.width), game.rnd.integerInRange(0,game.world.height));
        }
        
        // Create comets
        var comet = createComet(500,500);
        comet.body.velocity.x = 5;
        comet.body.velocity.y = 5;
        
        
        var comet2 = createComet(0,0);
        comet2.body.velocity.x = 500;
        comet2.body.velocity.y = 500;
        
        // Create gas giants
        createGasPlanet(1100,400);
        
        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo(0.5, 0.0);
    }
    


    function update() {
        //player.body.mass *= 0.9997; // Player looses mass at a rate proportional to current mass

        // Add gravitational force between the player and the mouse, so that the player can be moved with the mouse
        var angle = get_angle(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        var r2 = get_r2(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        
        player.body.force.x += (G * Math.cos(angle) * player.body.mass * player.body.mass / r2);
        player.body.force.y += (G * Math.sin(angle) * player.body.mass * player.body.mass / r2);
        constrain_acceleration(player);

        debugGame(); // Display some text with information
        
        updateAsteroids();
        updateComets();
        updateGasPlanets();  
    }
    
    function updateAsteroids() {
        asteroids.forEachExists(function(asteroid) {
            applyForce(asteroid); // Gravity
            checkBounds(asteroid); // Wrap around game boundaries
        });
    }
    
    function updateComets() {
        comets.forEachExists(function(comet) {
            
            // Update emitter position to match parent sprite
            comet.emitter.x = comet.x;
            comet.emitter.y = comet.y;
            
            // Update emitter spread according to velocity of parent sprite
            comet.emitter.setXSpeed(-comet.body.velocity.x * cometSpread, comet.body.velocity.x * cometSpread);
            comet.emitter.setYSpeed(-comet.body.velocity.y * cometSpread, comet.body.velocity.y * cometSpread);
            
            applyForce(comet); // Gravity
            checkBounds(comet); // Wrap around game boundaries
        }); 
    }
    
    function updateGasPlanets() {
        gasPlanets.forEachExists(function(gasPlanet) {
            
            // Update emission rate of gas particles according to proximity to player
            var distance = get_dist(player, gasPlanet);
            distance -= gasPlanet.height/2;

            if(distance > 400) {
                gasPlanet.timer.pause();
            } else{

                gasPlanet.timer.resume();
                gasPlanet.timer.events[0].delay = distance*3;
            }
            
            gasPlanet.gas.forEachExists(function(gas) {
                applyForce(gas);
                checkBounds(gas);
            });
            
            applyForce(gasPlanet); // Gravity
            checkBounds(gasPlanet); // Wrap around game boundaries
        });
    }
    
    function createAsteroid(x, y) {
            asteroid = asteroids.create(x, y, 'asteroid');
            game.physics.p2.enable(asteroid);
            asteroid.body.density = enemyDensity;
            newEnemy(asteroid);
            
            spin = asteroid.animations.add('spin');
            asteroid.animations.play('spin', game.rnd.integerInRange(5,25), true);

            asteroid.body.collides(massCollisionGroup);
            asteroid.body.collideWorldBounds = false;
            
            asteroid.body.velocity.x = game.rnd.integerInRange(-250,250);
            asteroid.body.velocity.y = game.rnd.integerInRange(-250,250);            

            asteroid.body.damping = 0;
        
            asteroids.add(asteroid);
    }
    
    function createComet(x, y) {
        var comet = game.add.sprite(x, y, 'ball');
        comet.anchor.setTo(0.5);
        comet.scale.setTo(0.03);
        
        game.physics.p2.enable(comet);
        comet.body.mass = 0.0001;
        comet.body.damping = 0;
        comet.emitter = game.add.emitter(comet.x, comet.y, 300);
        comet.emitter.physicsBodyType = Phaser.Physics.P2; // Doesn't work for some reason, Phaser hasn't implemented yet
        comet.emitter.enableBody = true;
        comet.emitter.enableBodyDebug = true;
        
        //Constrain size of particles
        comet.emitter.minParticleScale = 0.01;
        comet.emitter.maxParticleScale = 0.01;
        
        comet.emitter.makeParticles('ball');
        comet.emitter.setAll('body.mass', 0.00001);
        comet.emitter.setXSpeed(-100, 100);
        comet.emitter.setYSpeed(-100, 100);
        comet.emitter.gravity = 0;
        comet.emitter.start(false, 5000, 10);
        
        comet.exists = true;
        
        comets.add(comet); // Add this comet to the comet group
        
        return comet;
    }
    
    function createGasPlanet(x, y) {
        var planet = game.add.sprite(x,y, 'ball');
        planet.anchor.setTo(0.5);
        planet.scale.setTo(2);
        
        game.physics.p2.enable(planet);
        planet.body.mass = 500;
        planet.body.density = 50;
        //masses.add(planet);
        
        // Timer to control emission of gas
        planet.timer = game.time.create(true);
        planet.timer.loop(1000, emitGas, this, planet);
        planet.timer.start();
        
        planet.gas = game.add.group(); // Group for the gas planet's emitted gas particles
        
        // Create the gas particles (they won't be emitted until player is close enough)
        for(var i = 0; i < 90; i++) {
            var temp = planet.gas.create(500, 500, 'ball');
            game.physics.p2.enable(temp);
            temp.body.setCircle(10);
            temp.body.setCollisionGroup(gasCollisionGroup);
            temp.scale.setTo(0.05);
            temp.kill();
            temp.body.collides(massCollisionGroup);
            temp.body.damping = 0;
            temp.body.mass = 3;
            temp.body.density = 5000;
            //updateSize(temp); // ToDo: Tune gas mass and density so we can use this
            //temp.body.massType = 'special';
            temp.body.planetX = planet.x;
            temp.body.planetY = planet.y;
        }
        
        // Scale planet according to size and density
        updateSize(planet);
        
        // Add planet to the gasPlanets group
        gasPlanets.add(planet);
        
        return planet;  
    }
    
    // Emit a gas particle from the edge of a gas giant in the direction of the player
    function emitGas(GasPlanet) {
        var nextgas = GasPlanet.gas.getFirstDead();
        if(nextgas) {
            var angle = get_angle(GasPlanet, player);
            angle += game.rnd.frac() * 0.3 *game.rnd.integerInRange(-1,1);
            nextgas.reset(GasPlanet.x + Math.cos(angle)*(GasPlanet.height/2 - nextgas.height*2), GasPlanet.y + Math.sin(angle)*(GasPlanet.height/2 - nextgas.height*2));
            //GasPlanet.body.mass -= nextgas.body.mass;
            nextgas.revive();
            if(GasPlanet.body.mass > 50) {
                GasPlanet.body.mass -= nextgas.body.mass;
                updateSize(GasPlanet);
            }
        }
    }
    
        // kills gas object, returns it to it's owner
    function returnGas(body1, body2) {
        body2.sprite.kill();
    } 
  
    function render() {
//        game.debug.body(comet.emitter);
//        game.debug.cameraInfo(game.camera, 32, 32);
    }
    
    function debugGame () {
        text.setText("\
                        player.mass: " 
                    + player.body.mass.toFixed(4)
                    + "\nplayer.radius: "
                    + player.height/2
                    + "\nx: " + player.x + " y: " + player.y);
        text.x = game.camera.x + text.width;
        text.y = game.camera.y + game.camera.height - text.height;
    }
    
    // Body 1 absorbs mass of body 2, and body 2 is reset or killed
    function absorb(body1, body2) {
        sound.play('blip');
        if(player.body.mass < 10000) {
            body1.mass += body2.mass; // Player absorbs mass
 
        }
        updateSize(body1.sprite); // Player grows
        resetBody(body2); // Reset the mass that was absorbed
    }
    
    // Scale a sprite according to it's mass and density
    function updateSize(sprite) {
        sprite.scale.setTo(Math.cbrt(sprite.body.mass/sprite.body.density)); // Update size based on mass and density
        sprite.body.setCircle(sprite.height/3); // Create new body to fit new size
        sprite.body.setCollisionGroup(massCollisionGroup); // CollisionGroup must be updated when a new body is created
    }
    
    // Check if a sprite has left the game area, and wrap it's position to the other side of the game area
    function checkBounds(sprite) {
        if(sprite.body.x < 0 - worldBuffer) {
            sprite.body.x = game.world.width + worldBuffer;
        } else if(sprite.body.x > game.world.width + worldBuffer) {
            sprite.body.x = 0 - worldBuffer;
        }

        if(sprite.body.y < 0 - worldBuffer) {
            sprite.body.y = game.world.height + worldBuffer;
        } else if(sprite.body.y > game.world.height + worldBuffer) {
            sprite.body.y = 0 - worldBuffer;
        } 
    }
    
    // Recycle an enemy mass by moving it offscreen and giving it a new mass
    function resetBody(body) {

        var side = game.rnd.integerInRange(1,4);
        var newX, newY;
        switch(side) { // Chose an edge of the world to locate the sprite (offscreen)
            case 1: // Top
                newX = game.rnd.integerInRange(-100, game.world.width+100);
                newY = game.rnd.integerInRange(-150,-50);
                break;
            case 2: // Bottom
                newX = game.rnd.integerInRange(-100, game.world.width+100);
                newY = game.rnd.integerInRange(game.world.height + 50, game.world.height + 150);
                break;
            case 3: // Left
                newX = game.rnd.integerInRange(-150,-50);
                newY = game.rnd.integerInRange(-100, game.world.height + 100);
                break;
            case 4: // Right
            default:
                newX = game.rnd.integerInRange(game.world.width + 50, game.world.width + 150);
                newY = game.rnd.integerInRange(-100, game.world.height + 100);

        }

        body.reset(newX, newY); // Put the sprite there
        newEnemy(body.sprite); // Give the sprite a new mass / size
        
    }
    
    // This will spawn new enemies according to the context of the game
    // Enemy types might be asteroids, planets, moons, stars, comets, dust, or black holes
    // The likleyhood of each type of enemy spawning could be set to tune gameplay experience
    function newEnemy(sprite) {
        sprite.body.mass = 5 * game.rnd.frac() * player.body.mass/numAsteroids;
        updateSize(sprite);
    }
    
    // Returns the angle between two objects
    function get_angle(object1, object2) {
        return Math.atan2(object2.y - object1.y, object2.x - object1.x);
    }
    
    // Returns the distance squared between two objects
    function get_r2(object1, object2) {
        return ((object2.x - object1.x) * (object2.x - object1.x)) + ((object2.y - object1.y) *  (object2.y - object1.y));
    }
    
    function get_dist(object1, object2) {
        return Math.sqrt(get_r2(object1, object2));
    }
    
    
    function applyForce(item) {
        if(item.length > 0) {
            apply_forces(item);
        } else {

        var angle = get_angle(item, player);
        var r2 = get_r2(item, player);

        item.body.force.x = (G * Math.cos(angle) * item.body.mass * player.body.mass) / r2;
        item.body.force.y = (G * Math.sin(angle) * item.body.mass * player.body.mass) / r2;
        constrain_acceleration(item);
        }
    }
    
    // This will constrain the acceleration on an object to a maximum magnitude
    function constrain_acceleration(object) {
        var accel_x = object.body.force.x/object.body.mass;
        var accel_y = object.body.force.y/object.body.mass;
        
        if(accel_x > accel_max) {
            object.body.force.x = accel_max * object.body.mass;
        } else if (accel_x < -accel_max) {
            object.body.force.x = -accel_max * object.body.mass;
        }
        
        if(accel_y > accel_max) {
            object.body.force.y = accel_max * object.body.mass;
        } else if (accel_y < -accel_max) {
            object.body.force.y = -accel_max * object.body.mass;
        }
        
    }
    
    // This will constrain the force on an object to a maximum magnitude
    function constrain_force(object) {
        var force_x = object.body.force.x;
        var force_y = object.body.force.y;
        
        if(force_x > force_max) {
            object.body.force.x = force_max;
        } else if(force_x < -force_max) {
            object.body.force.x = -force_max;
        }
        
        if(force_y > force_max) {
            object.body.force.y = force_max;
        } else if(force_y < -force_max) {
            object.body.force.y = -force_max;
        }
    }
};



//    function updateBounds(group) {
//        group.forEachAlive(function(item) {
//            
//            if(item.length > 0) {
//                
//                updateBounds(item);
//            } else {
//            
//                if(item.body.x < 0 - worldBuffer) {
//                    item.body.x = game.world.width + worldBuffer;
//                } else if(item.body.x > game.world.width + worldBuffer) {
//                    item.body.x = 0 - worldBuffer;
//                }
//
//                if(item.body.y < 0 - worldBuffer) {
//                    item.body.y = game.world.height + worldBuffer;
//                } else if(item.body.y > game.world.height + worldBuffer) {
//                    item.body.y = 0 - worldBuffer;
//                }
//            }
//        }); 
//    }



//    // Calculates the center of mass for the entire set of masses in a group, then applies a gravitational force to each mass in the group towards the center of mass
//    function apply_forces(group) {
////        var mass_product_sum = get_product_sum(group);  
////        var mass_sum = get_mass_sum(group);
////
////        // F = G * m1m2/r^2
////        group.forEachAlive(function(item) {
////            
////            // Calculate center of mass, excluding the current mass
////            var com_x = (mass_product_sum.x - (item.body.mass * item.x)) / (mass_sum - item.body.mass);
////            var com_y = (mass_product_sum.y - (item.body.mass * item.y)) / (mass_sum - item.body.mass);
////            
////            var angle = get_angle(item, {"x":com_x, "y":com_y}); // Angle between current mass and center of mass
////            var r2 = get_r2(item, {"x":com_x, "y":com_y}); // Angle between current mass and the center of mass
////            
////            item.body.force.x = (G * Math.cos(angle) * mass_product_sum.x / r2);
////            item.body.force.y = (G * Math.sin(angle) * mass_product_sum.y / r2);
////            
////            constrain_acceleration(item); // Limit acceleration
////        }); 
//        
//        group.forEachAlive(function(item) {
//            if(item.length > 0) {
//                apply_forces(item);
//            } else {
//                
//            var angle = get_angle(item, player);
//            var r2 = get_r2(item, player);
//            
//            item.body.force.x = (G * Math.cos(angle) * item.body.mass * player.body.mass) / r2;
//            item.body.force.y = (G * Math.sin(angle) * item.body.mass * player.body.mass) / r2;
//            constrain_acceleration(item);
//            }
//        });
//    }


//    function get_mass_sum(group) {
//        var sum = 0.0;
//        group.forEachAlive(function(item) {
//            sum += item.body.mass;
//        });
//        return sum;
//    } 
//    
//    function get_product_sum(group) {
//        var sum_x = 0.0;
//        var sum_y = 0.0;
//        group.forEachAlive(function(item) {
//            sum_x += item.body.mass * item.x;
//            sum_y += item.body.mass * item.y;
//        });
//        
//        return {"x" : sum_x, "y" : sum_y};
//    }