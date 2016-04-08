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
    var gasCollisionGroup;
    
    var enemyDensity = 100.0; // Density of enemies
    var playerDensity = 100.0; // Density of the player
    
    var playerStartMass = 100.0; // The initial mass of the player
    
    var numEnemies = 50; // Number of masses other than the player that will be created
    
    var asteroid;
    var spin;
    var sound;
    var comet;
    var comet2;
    var cometSpread = 0.1;
    var jupiter;
    
    var gasTimer;
    
    function create() {
        tilesprite = game.add.tileSprite(0,0,2000, 2000, 'space');
        
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
        
        // Create a sprite at the center of the screen using the 'logo' image.
        //player = masses.create(game.world.centerX, game.world.centerY, 'asteroid' );
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
        
        for (var i = 0; i < numEnemies; i++) {
            mass = masses.create(game.rnd.integerInRange(0,game.world.width), game.rnd.integerInRange(0,game.world.height), 'asteroid');
            game.physics.p2.enable(mass);
            mass.body.density = enemyDensity;
            newEnemy(mass);
            
            spin = mass.animations.add('spin');
            mass.animations.play('spin', game.rnd.integerInRange(5,25), true);

            mass.body.collides(massCollisionGroup);
            mass.body.collideWorldBounds = false;
            
            mass.body.velocity.x = game.rnd.integerInRange(-250,250);
            mass.body.velocity.y = game.rnd.integerInRange(-250,250);
            mass.body.damping = 0;
        }

        // Add some text using a CSS style.
        // Center it in X, and position its top 15 pixels from the top of the world.
        var style = { font: "25px Verdana", fill: "#9999ff", align: "center" };
        text = game.add.text( game.world.centerX, 15, "Build something awesome.", style );
        text.anchor.setTo(0.5, 0.0);
        
        
        comet = createComet(500,500);
        comet.body.velocity.x = 5;
        comet.body.velocity.y = 5;
        
        
        masses.add(comet);
        
        comet2 = createComet(0,0);
        comet2.body.velocity.x = 500;
        comet2.body.velocity.y = 500;
        masses.add(comet2);
        
        jupiter = createGasPlanet(1100,400);
        
        //gasTimer = game.time.events.loop(Phaser.Timer.SECOND, ressurect, this);
        
    }
    
    function ressurect() {
        emitGas(jupiter);
    }
    
    function returnGas(body1, body2) {
        body2.sprite.reset(body2.planetX, body2.planetY);
        body2.sprite.kill();
    }

    function update() {
        //player.body.mass *= 0.9997; // Player looses mass at a rate proportional to current mass
        
        apply_forces(masses);
        // Add gravitational force between the player and the mouse, so that the player can be moved with the mouse
        var angle = get_angle(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        var r2 = get_r2(player.body, {"x":game.input.mousePointer.x+game.camera.x, "y":game.input.mousePointer.y+game.camera.y});
        
        player.body.force.x += (G * Math.cos(angle) * player.body.mass * player.body.mass / r2);
        player.body.force.y += (G * Math.sin(angle) * player.body.mass * player.body.mass / r2);
        constrain_acceleration(player);
        
//        player.body.x = game.input.mousePointer.x;
//        player.body.y = game.input.mousePointer.y;
        
        //debugGame(); // Display some text with information
        comet.emitter.x = comet.x;
        comet.emitter.y = comet.y;
        comet2.emitter.x = comet2.x;
        comet2.emitter.y = comet2.y;
        comet.emitter.setXSpeed(-comet.body.velocity.x *cometSpread, comet.body.velocity.x *cometSpread);
        comet.emitter.setYSpeed(-comet.body.velocity.y*cometSpread, comet.body.velocity.y *cometSpread);
        comet2.emitter.setXSpeed(-comet.body.velocity.x *cometSpread, comet.body.velocity.x *cometSpread);
        comet2.emitter.setYSpeed(-comet.body.velocity.y*cometSpread, comet.body.velocity.y *cometSpread);
        
        
        updateBounds(masses);
        updateGasPlanets();
         // Apply gravitational force calculation to every mass in the game
        //apply_forces(comet.emitter);
        
        
    }
    
    function updateGasPlanets() {
        var distance = get_dist(player, jupiter);
        distance -= jupiter.height/2;
        
        
        text.x = game.camera.x + text.width;
        text.y = game.camera.y + game.camera.height - text.height;
        
        if(distance > 400) {
            jupiter.timer.pause();
        } else{
            
            jupiter.timer.resume();
       jupiter.timer.events[0].delay = distance;
        }
        
        
    }
    
    function updateBounds(group) {
        group.forEachAlive(function(item) {
            
            if(item.length > 0) {
                
                updateBounds(item);
            } else {
            
                if(item.body.x < 0 - worldBuffer) {
                    item.body.x = game.world.width + worldBuffer;
                } else if(item.body.x > game.world.width + worldBuffer) {
                    item.body.x = 0 - worldBuffer;
                }

                if(item.body.y < 0 - worldBuffer) {
                    item.body.y = game.world.height + worldBuffer;
                } else if(item.body.y > game.world.height + worldBuffer) {
                    item.body.y = 0 - worldBuffer;
                }
            }
        }); 
    }
    
    function createGasPlanet(x, y) {
        var planet = game.add.sprite(x,y, 'ball');
        planet.anchor.setTo(0.5);
        planet.scale.setTo(2);
        
        game.physics.p2.enable(planet);
        planet.body.mass = 500;
        planet.body.density = 50;
        masses.add(planet);
        
        planet.timer = game.time.create(true);
        planet.timer.loop(1000, ressurect, this);
        planet.timer.start();
        
        
        
        planet.gas = game.add.group();
        
        
        
        for(var i = 0; i < 90; i++) {
            var temp = planet.gas.create(500, 500, 'ball');
            game.physics.p2.enable(temp);
            temp.body.setCircle(10);
            temp.body.setCollisionGroup(gasCollisionGroup);
            temp.scale.setTo(0.05);
            temp.kill();
            temp.body.collides(massCollisionGroup);
            temp.body.damping = 0;
            temp.body.mass = 10;
            temp.body.massType = 'special';
            temp.body.planetX = planet.x;
            temp.body.planetY = planet.y;
        }
        masses.add(planet.gas);
        updateSize(planet);
        return planet;
    }
    
    function emitGas(GasPlanet) {
        var nextgas = GasPlanet.gas.getFirstDead();
        if(nextgas) {
            var angle = get_angle(GasPlanet, player);
            text.setText(angle);
            angle += game.rnd.frac() * 0.3 *game.rnd.integerInRange(-1,1);
            nextgas.reset(GasPlanet.x + Math.cos(angle)*(GasPlanet.height/2 - nextgas.height/2), GasPlanet.y + Math.sin(angle)*(GasPlanet.height/2 - nextgas.height/2));
            //GasPlanet.body.mass -= nextgas.body.mass;
            nextgas.revive();
        }
    }
    
    function createComet(x, y) {
        var comet = game.add.sprite(x, y, 'ball');
        comet.anchor.setTo(0.5);
        comet.scale.setTo(0.03);
        
        game.physics.p2.enable(comet);
        comet.body.mass = 0.0001;
        comet.body.damping = 0;
        comet.emitter = game.add.emitter(comet.x, comet.y, 300);
        comet.emitter.physicsBodyType = Phaser.Physics.P2;
        comet.emitter.enableBody = true;
        comet.emitter.enableBodyDebug = true;
        comet.emitter.minParticleScale = 0.01;
        comet.emitter.maxParticleScale = 0.01;
        comet.emitter.makeParticles('ball');
        comet.emitter.setAll('body.mass', 0.00001);
        comet.emitter.setXSpeed(-100, 100);
        comet.emitter.setYSpeed(-100, 100);
        comet.emitter.gravity = 0;
        comet.emitter.start(false, 5000, 10);
        
        return comet;
    }
    
    function render() {
        game.debug.body(comet.emitter);
//        game.debug.cameraInfo(game.camera, 32, 32);
    }
    
    function debugGame () {
        text.setText("\
                        player.mass: " 
                    + player.body.mass.toFixed(4)
                    + "\nplayer.radius: "
                    + player.height/2
                    + "\nx: " + player.x + " y: " + player.y
                    + "\ncomettype: " + player.body.force.x);
        text.x = game.camera.x + text.width;
        text.y = game.camera.y + game.camera.height - text.height;
    }
    
    function absorb(body1, body2) {
        sound.play('blip');
        body1.mass += body2.mass; // Player absorbs mass
        updateSize(body1.sprite); // Player grows
        resetBody(body2); // Reset the mass that was absorbed
    }
    
    function updateSize(sprite) {
        sprite.scale.setTo(Math.cbrt(sprite.body.mass/sprite.body.density)); // Update size based on mass and density
        sprite.body.setCircle(sprite.height/3); // Create new body to fit new size
        sprite.body.setCollisionGroup(massCollisionGroup); // CollisionGroup must be updated when a new body is created
    }
    
    // Recycle an enemy mass by moving it offscreen and giving it a new mass
    function resetBody(body) {
        if(body.massType == 'special') {
            body.sprite.kill();
           
        } else {
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
    }
    
    // This will spawn new enemies according to the context of the game
    // Enemy types might be asteroids, planets, moons, stars, comets, dust, or black holes
    // The likleyhood of each type of enemy spawning could be set to tune gameplay experience
    function newEnemy(sprite) {
        sprite.body.mass = 5 * game.rnd.frac() * player.body.mass/numEnemies;
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
    
    // Calculates the center of mass for the entire set of masses in a group, then applies a gravitational force to each mass in the group towards the center of mass
    function apply_forces(group) {
//        var mass_product_sum = get_product_sum(group);  
//        var mass_sum = get_mass_sum(group);
//
//        // F = G * m1m2/r^2
//        group.forEachAlive(function(item) {
//            
//            // Calculate center of mass, excluding the current mass
//            var com_x = (mass_product_sum.x - (item.body.mass * item.x)) / (mass_sum - item.body.mass);
//            var com_y = (mass_product_sum.y - (item.body.mass * item.y)) / (mass_sum - item.body.mass);
//            
//            var angle = get_angle(item, {"x":com_x, "y":com_y}); // Angle between current mass and center of mass
//            var r2 = get_r2(item, {"x":com_x, "y":com_y}); // Angle between current mass and the center of mass
//            
//            item.body.force.x = (G * Math.cos(angle) * mass_product_sum.x / r2);
//            item.body.force.y = (G * Math.sin(angle) * mass_product_sum.y / r2);
//            
//            constrain_acceleration(item); // Limit acceleration
//        }); 
        
        group.forEachAlive(function(item) {
            if(item.length > 0) {
                apply_forces(item);
            } else {
                
            var angle = get_angle(item, player);
            var r2 = get_r2(item, player);
            
            item.body.force.x = (G * Math.cos(angle) * item.body.mass * player.body.mass) / r2;
            item.body.force.y = (G * Math.sin(angle) * item.body.mass * player.body.mass) / r2;
            constrain_acceleration(item);
            }
        });
    }

    
    function get_mass_sum(group) {
        var sum = 0.0;
        group.forEachAlive(function(item) {
            sum += item.body.mass;
        });
        return sum;
    } 
    
    function get_product_sum(group) {
        var sum_x = 0.0;
        var sum_y = 0.0;
        group.forEachAlive(function(item) {
            sum_x += item.body.mass * item.x;
            sum_y += item.body.mass * item.y;
        });
        
        return {"x" : sum_x, "y" : sum_y};
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
