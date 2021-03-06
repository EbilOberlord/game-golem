/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Workers, Config, Dashboard, Page, Queue, // Army, History, Resources,
	Generals, Player, //Battle, LevelUp,
	APP, APPID, PREFIX, userID, imagepath,
	isRelease, version, revision, Images, window, browser,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	isArray, isFunction, isNumber, isObject, isString, isWorker
*/
/********** Worker.Bank **********
* Auto-banking
*/
var Bank = new Worker('Bank');
Bank.data = null;

Bank.settings = {
	taint:true
};

Bank.defaults['castle_age'] = {};

Bank.option = {
	general:true,
	auto:true,
	above:10000,
	hand:0,
	keep:10000
};

Bank.temp = {
	force:false
};

Bank.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		id:'auto',
		label:'Bank Automatically',
		checkbox:true
	},{
		id:'above',
		label:'Bank Above',
		text:true
	},{
		id:'hand',
		label:'Keep in Cash',
		text:true
	},{
		id:'keep',
		label:'Keep in Bank',
		text:true
	}
];

Bank.setup = function() {
	// BEGIN: Use global "Show Status" instead of custom option
	if ('status' in this.option) {
		this.set(['option','_hide_status'], !this.option.status);
		this.set(['option','status']);
	}
	// END
};

Bank.init = function() {
	this._watch('Player', 'data.cash');// We want other things too, but they all change in relation to this
};

Bank.work = function(state) {
	if (state) {
		this.stash();
	}
	return QUEUE_CONTINUE;
};

Bank.update = function(event) {
	Dashboard.status(this, Config.makeImage('gold') + '$' + Player.get('worth', 0).addCommas() + ' (' + Config.makeImage('gold') + '$' + Bank.worth().addCommas() + ' available)');
	this.set('option._sleep', !(this.temp.force || (this.option.auto && Player.get('cash', 0) >= Math.max(10, this.option.above, this.option.hand))));
};

// Return true when finished
Bank.stash = function(amount) {
	var cash = Player.get('cash', 0);
	amount = (isNumber(amount) ? Math.min(cash, amount) : cash) - this.option.hand;
	if (!amount || amount <= 10) {
		return true;
	}
	if ((this.option.general && !Generals.to('bank')) || !Page.to('keep_stats')) {
		return false;
	}
	$('input[name="stash_gold"]').val(amount);
	Page.click('input[value="Stash"]');
	this.set(['temp','force'], false);
	return true;
};

// Return true when finished
Bank.retrieve = function(amount) {
	Worker.find(Queue.get('temp.current')).settings.bank = true;
	amount -= Player.get('cash', 0);
	if (amount <= 0 || (Player.get('bank', 0) - this.option.keep) < amount) {
		return true; // Got to deal with being poor exactly the same as having it in hand...
	}
	if (!Page.to('keep_stats')) {
		return false;
	}
	$('input[name="get_gold"]').val(amount.toString());
	Page.click('input[value="Retrieve"]');
	return false;
};

Bank.worth = function(amount) { // Anything withdrawing should check this first!
	var worth = Player.get('worth', 0) - this.option.keep;
	if (typeof amount === 'number') {
		return (amount <= worth);
	}
	return worth;
};

Bank.menu = function(worker, key) {
	if (worker === this) {
		if (!key && !this.option._disabled) {
			return ['bank:Bank Now'];
		} else if (key === 'bank') {
			this.set(['temp','force'], true);
		}
	}
};

