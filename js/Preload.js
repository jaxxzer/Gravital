var Gravital = Gravital || {};

// load game assets
Gravital.Preload = function(){};

Gravital.Preload.prototype = 
{
	preload: function()
	{
		/* this shows load screen bar
		this.splash = this.add.sprite(this.game.world.centerX, this.game.world.centerY, 'logo');
		this.splash.anchor.setTo(0.5);
		
		this.preloadBar = this.add.sprite(this.game.world.centerX, this.game.world.centerY + 128, 'preloadbar');
		this.preloadBar.anchor.setTo(0.5);
		this.load.setPreloadSprite(this.preloadBar);
		*/
		
		// load game assets
		this.load.audio('blip', 'assets/audio/Blip.ogg');
		this.load.audio('soundtrack1', 'assets/audio/Ital Tek - Strangelove VIP.ogg');
        this.load.spritesheet('asteroid', 'assets/img/asteroid_sprite_sheet.png', 128, 128, 32);
        this.load.spritesheet('gasParticleOrange', 'assets/img/GasParticleSpriteSheetOrange.png', 256, 255.8, 30);
        this.load.spritesheet('Satellite1', 'assets/img/Satellite1.png', 160, 160, 36);
        this.load.image('ball', 'assets/img/planet2.png');
        this.load.image('space', 'assets/img/SPACE.jpg');
        this.load.image('comet', 'assets/img/comet.png');
        this.load.image('cometDust', 'assets/img/cometDust.png');
        this.load.image('BlackHole', 'assets/img/blackHole.png');
        this.load.audio('soundtrack1', 'assets/audio/Ital Tek - Strangelove VIP.ogg');
        this.load.audio('asteroidHit', 'assets/audio/Hit1.ogg');
        this.load.audio('SatelliteSound1', 'assets/audio/SatelliteSound1.ogg')
	},
	create: function() 
	{
		this.state.start('MainMenu');
	}
};