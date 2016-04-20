var Gravital = Gravital || {};

Gravital.Boot = function() {};

Gravital.Boot.prototype = 
{
	preload: function() 
	{
		// if we do use load screen.
		//this.load.image('logo', 'assets/img/logo.png');
		//this.load.image('preloadbar', 'assets/img/preloader-bar.png');
	},
	create: function()
	{
		/*
		//loading screen will have a white background
		this.game.stage.backgroundColor = '#fff';

		// //scaling options
		// this.scale.scaleMode = Phaser.ScaleManager.RESIZE;
		// this.scale.minWidth = 240;
 		// this.scale.minHeight = 170;
		// this.scale.maxWidth = 2880;
		// this.scale.maxHeight = 1920;
		
		
		//have the game centered horizontally
		this.scale.pageAlignHorizontally = true;
	
		// screen size will be set automatically
		// DEPRECATED this.scale.setScreenSize(true);

		//physics system for movement
		//this.game.physics.startSystem(Phaser.Physics.ARCADE);
		*/
		this.state.start('Preload');
	}
};