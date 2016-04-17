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
		
		// scroll background
		
		// show game start text
		var text = "Tap to begin";
		var style = { font: "30px Arial", fill: "#fff", align: "center" };
		var t = this.game.add.text(this.game.width/2, this.game.height/2, text, style);
		t.anchor.set(0.5);
		
		//highest score
		//text = "Highest score: "+this.highestScore;
		//style = { font: "15px Arial", fill: "#fff", align: "center" };
  
		//var h = this.game.add.text(this.game.width/2, this.game.height/2 + 50, text, style);
		//h.anchor.set(0.5);
	},
	update: function() 
	{
		if (this.game.input.activePointer.justPressed())
		{
			this.game.state.start('Game');
		}
	}
};