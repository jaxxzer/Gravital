var Gravital = Gravital || {};
Gravital.Tutorial2 = function () {};

Gravital.Tutorial2.prototype = 
{	
	create: function()
	{
		// add background
		this.tilesprite = this.game.add.tileSprite(0,0,2000, 2000, 'space');
		
		//First add the Player with text that describes it
        var blackHole = this.game.add.sprite(145, 95, 'BlackHole' );
        blackHole.scale.setTo(0.5, 0.5);
        this.game.physics.p2.enable(blackHole);
        
        blackHole.body.angularDamping = 0;
        blackHole.body.angularVelocity = 2;
        
		
		//Text for the Asteroids
		var rtext = "This is a black hole. They are super dense, and hard to spot.\nWatch out!"
		var rstyle = { font: "20px Arial", fill: "#fff", align: "left" };
		var rt = this.game.add.text(520, 110, rtext, rstyle);
		rt.anchor.set(0.5);	
		
		//The Gas Planet
		var sat = this.game.add.sprite(800,200, 'Satellite1');
		sat.scale.setTo(1,1);
        sat.animations.add('spin');
        sat.animations.play('spin', 15, true);
  	
		//Gas Planet text
		var ptext = "This is a satellite, one of many types of foreign debris.\nThese objects have special properties, and convey temporary powers."
		var pstyle = { font: "20px Arial", fill: "#fff", align: "right" };
		var pt = this.game.add.text(480, 290, ptext, pstyle);
		pt.anchor.set(0.5);	
	},

	update: function() 
	{
		//Start the game!
		if (this.game.input.activePointer.justPressed())
		{
			this.game.state.start('Game');
		}
		
	}
};