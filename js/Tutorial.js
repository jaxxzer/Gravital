var Gravital = Gravital || {};
Gravital.Tutorial = function () {};

Gravital.Tutorial.prototype = 
{	
	create: function()
	{
		// add background
		this.tilesprite = this.game.add.tileSprite(0,0,2000, 2000, 'space');
		
		//First add the Player with text that describes it
        var rock = this.game.add.sprite(40, 50, 'asteroid' );
        var spin = rock.animations.add('spin');
        rock.animations.play('spin', 15, true);
		
		//Text for the Asteroids
		var rtext = "Help this asteroid grow by navigating it around space with your mouse.\nThere are smaller asteroids flying around that you can absorb to grow larger."
		var rstyle = { font: "20px Arial", fill: "#fff", align: "left" };
		var rt = this.game.add.text(520, 110, rtext, rstyle);
		rt.anchor.set(0.5);	
		
		//The Gas Planet
		var plan = this.game.add.sprite(750,200, 'ball');
		plan.scale.setTo(0.5,0.5);
		
		//Animation for Gas Planet Emitter	
		var gas = this.game.add.sprite(720,170, 'gasParticleOrange');
        var gasAnimation = gas.animations.add('gasAnimation');
        gas.animations.play('gasAnimation', this.game.rnd.integerInRange(5,25), true);
		
  	
		//Gas Planet text
		var ptext = "This is a gas planet. If it's larger than you, it'll kill you.\n If it's not, you can absorb it. Careful of its gravity.\nIt emits gas particles you can absorb to get larger."
		var pstyle = { font: "20px Arial", fill: "#fff", align: "right" };
		var pt = this.game.add.text(480, 290, ptext, pstyle);
		pt.anchor.set(0.5);	
		
		//The Comet
		var com = this.game.add.sprite(80, this.game.height-180, 'comet');
		com.scale.setTo(0.3, 0.3);
		
		//Comet emitter animation
		com.emitter = this.game.add.emitter(100, this.game.height-125, 100);
        com.emitter.minParticleScale = 0.01;
        com.emitter.maxParticleScale = 0.01;
        com.emitter.makeParticles('cometDust');
		com.emitter.start(false, 1000, 10);
		
		//Commet text
		var ctext = "This is a comet. You can absorb it, too.\nIt leaves residue as it flies."
		var cstyle = { font: "20px Arial", fill: "#fff", align: "left" };
		var ct = this.game.add.text(360, this.game.height-140, ctext, cstyle);
		ct.anchor.set(0.5);	
		
		
		// show game start text
		var text = "Tap to start";
		var style = { font: "30px Arial", fill: "#fff", align: "center" };
		var t = this.game.add.text(this.game.width/2, this.game.height-30, text, style);
		t.anchor.set(0.5);		
		
		
		
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