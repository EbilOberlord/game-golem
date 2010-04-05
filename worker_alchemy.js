/********** Worker.Alchemy **********
* Get all ingredients and recipes
*/
var Alchemy = new Worker('Alchemy', 'keep_alchemy');
Alchemy.data = {
	ingredients:{},
	recipe:{}
};

Alchemy.option = {
	perform:true,
	hearts:false
};

Alchemy.runtime = {
	best:null
};

Alchemy.display = [
	{
		id:'perform',
		label:'Automatically Perform',
		checkbox:true
	},{
		id:'hearts',
		label:'Use Battle Hearts',
		checkbox:true
	}
];

Alchemy.parse = function(change) {
	var ingredients = Alchemy.data.ingredients = {}, recipe = Alchemy.data.recipe = {};
	$('div.ingredientUnit').each(function(i,el){
		var name = $('img', el).attr('src').filepart();
		ingredients[name] = $(el).text().regex(/x([0-9]+)/);
	});
	$('div.alchemyQuestBack,div.alchemyRecipeBack,div.alchemyRecipeBackMonster').each(function(i,el){
		var me = {}, title = $('div.recipeTitle', el).text().trim().replace('RECIPES: ','');
		if (title.indexOf(' (')>0) {title = title.substr(0, title.indexOf(' ('));}
		if ($(el).hasClass('alchemyQuestBack')) {me.type = 'Quest';}
		else if ($(el).hasClass('alchemyRecipeBack')) {me.type = 'Recipe';}
		else if ($(el).hasClass('alchemyRecipeBackMonster')) {me.type = 'Summons';}
		else {me.type = 'wtf';}
		me.ingredients = {};
		$('div.recipeImgContainer', el).parent().each(function(i,el){
			var name = $('img', el).attr('src').filepart();
			me.ingredients[name] = ($(el).text().regex(/x([0-9]+)/) || 1);
		});
		recipe[title] = me;
	});
};

Alchemy.update = function() {
	var best = null, recipe = this.data.recipe, r, i;
	for (r in recipe) {
		if (recipe[r].type === 'Recipe') {
			best = r;
			for (i in recipe[r].ingredients) {
				if ((!Alchemy.option.hearts && i === 'raid_hearts.gif') || recipe[r].ingredients[i] > (Alchemy.data.ingredients[i] || 0)) {
					best = null;
					break;
				}
			}
			if (best) {break;}
		}
	}
	this.runtime.best = best;
};

Alchemy.work = function(state) {
	if (!Alchemy.option.perform || !Alchemy.runtime.best) {
		return false;
	}
	if (!state || !Page.to('keep_alchemy')) {
		return true;
	}
	debug('Alchemy: Perform - '+Alchemy.runtime.best);
	$('div.alchemyRecipeBack').each(function(i,el){
		if($('div.recipeTitle', el).text().indexOf(Alchemy.runtime.best) >= 0) {
			Page.click($('input[type="image"]', el));
			return true;
		}
	});
	return true;
};

