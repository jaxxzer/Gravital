var Gravital = Gravital || {};

Gravital.game = new Phaser.Game( 1000, 600, Phaser.CANVAS, 'game');

Gravital.game.state.add('Boot', Gravital.Boot);
Gravital.game.state.add('Preload', Gravital.Preload);
Gravital.game.state.add('MainMenu', Gravital.MainMenu);
Gravital.game.state.add('Tutorial', Gravital.Tutorial);
Gravital.game.state.add('Game', Gravital.Game);

Gravital.game.state.start('Boot');