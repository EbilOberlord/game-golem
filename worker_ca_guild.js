/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Workers, Worker, Config, Dashboard, History, Page, Queue, Resources,
	Generals, Player,
	APP, APPID, APPID_, PREFIX, userID, imagepath,
	isRelease, version, revision, Images, window, browser,
	LOG_ERROR, LOG_WARN, LOG_LOG, LOG_INFO, LOG_DEBUG, log,
	QUEUE_CONTINUE, QUEUE_RELEASE, QUEUE_FINISH,
	isArray, isFunction, isNumber, isObject, isString, isWorker
*//********** Worker.Guild() **********
* Handle guild battles
* Auto-attack Guild targets
*/
var Guild = new Worker('Guild');

Guild.settings = {
	taint:true
};

Guild.defaults['castle_age'] = {
	pages:'battle_guild battle_guild_battle'
};

Guild.option = {
	general:true,
	general_choice:'any',
	join:false,
	collect:true,
	tokens:'min',
	safety:60000,
	order:'health',
	ignore:'',
	limit:'',
	cleric:false,
	active:true,
	live:true,
	suppress:false
};

Guild.data = {
	skip:{}		// dangerous target list - name based
};

Guild.runtime = {
	status:null,	// wait, start, fight, collect
	next:0,			// next battle (or when we'll next check for a battle)
	start:0,		// start of battle
	finish:0,		// end of battle
	tokens:10,		// current token count
	next_token:0,	// next token point
	rank:0,
	points:0,
	burn:false,
	stunned:false,
	my_class:null,	// current class
	collected:0,	// last collection mark
	check:0
};

Guild.temp = {
	status:{
		none:'Unknown',
		wait:'Waiting for Next Battle',
		start:'Entering Battle',
		fight:'In Battle',
		collect:'Collecting Reward'
	},
	last:null // name of last target, .data[last] then we've lost so skip them
};

Guild.display = [
	{
		id:'general',
		label:'Use Best General',
		checkbox:true
	},{
		advanced:true,
		id:'general_choice',
		label:'Use General',
		require:'!general',
		select:'generals'
	},{
		id:'join',
		label:'Automatically Join',
		checkbox:true
	},{
		id:'delay',
		label:'Join Delay',
		require:'join',
		select:{
			0:'None',
			60000:'1 minute',
			120000:'2 minutes',
			180000:'3 minutes',
			240000:'4 minutes',
			300000:'5 minutes'
		}
	},{
		id:'collect',
		label:'Collect Rewards',
		checkbox:true
	},{
		id:'tokens',
		label:'Use Tokens',
		select:{min:'Immediately', healthy:'Save if Stunned', max:'Save Up'}
	},{
		id:'safety',
		label:'Safety Margin',
		require:'tokens!="min"',
		select:{
			30000:'30 seconds',
			45000:'45 seconds',
			60000:'1 minute',
			90000:'1.5 minutes',
			120000:'2 minutes',
			150000:'2.5 minutes',
			180000:'3 minutes',
			240000:'4 minutes'
		}
	},{
		id:'order',
		label:'Attack',
		select:{
			health:'Lowest Health',
			level:'Lowest Level',
			maxhealth:'Lowest Max Health',
			activity:'Lowest Activity',
			health2:'Highest Health',
			level2:'Highest Level',
			maxhealth2:'Highest Max Health',
			activity2:'Highest Activity',
			levelactive:'Lowest Level with Activity',
			levelactive2:'Highest Level with Activity'
		}
	},{
		advanced:true,
		id:'limit',
		label:'Relative Level',
		text:true,
		help:'Positive values are levels above your own, negative are below. Leave blank for no limit'
	},{
		id:'cleric',
		label:'Attack Clerics First',
		checkbox:true,
		help:'This will attack active clerics first before considering others.'
		  + ' Note: this works in conjunction with Actives First, Live First'
		  + ' and the ordering preference.'
	},{
		id:'active',
		label:'Attack Actives First',
		checkbox:true,
		help:'This will attack active targets first before considering others.'
		  + ' Note: this works in conjunction with Clerics First, Live First'
		  + ' and the ordering preference.'
	},{
		id:'live',
		label:'Attack Live First',
		checkbox:true,
		help:'This will attack live targets first before considering others.'
		  + ' Note: this works in conjunction with Clerics First, Actives First'
		  + ' and the ordering preference.'
	},{
		id:'defeat',
		label:'Avoid Defeat',
		checkbox:true,
		help:"This will prevent you attacking targets against which you've been defeated."
	},{
		advanced:true,
		id:'suppress',
		label:'Suppress Actives',
		checkbox:true,
		help:'Continue to fight stunned active targets with remaining health.'
	},{
		advanced:true,
		id:'ignore',
		label:'Ignore Targets',
		text:true,
		help:'Ignore any targets with names containing these tags - use | to separate multiple tags'
	}
];

Guild.target_rx = new RegExp(
  '^(.*)'								// 0: name
  + ' Level *: (\\d+)'					// 1: level
  + ' Class *: ([^ ]+)'					// 2: class
  + ' Health *: (\\d+)\\/(\\d+)'		// 3/4: health, maxhealth
  + ' Status *: ([^ ]+)'				// 5: status
  + '(?: \\w+){1,2} Points *: (\\d+)'	// 6: activity
);

Guild.init = function(old_revision, fresh) {
	var now = Date.now(), i, list;

	// BEGIN: fix up "under level 4" generals
	if (this.option.general_choice === 'under level 4') {
		this.set('option.general_choice', 'under max level');
	}
	// END

	// BEGIN: Map old skip list from root of data into a sub-element
	if (old_revision < 1182 && revision >= 1182 && !fresh) {
		list = [];
		for (i in this.data) {
			if (this.data[i] === true) {
				list.push(i);
				this.set(['data',i]);
			}
		}
		for (i = 0; i < list.length; i++) {
			this.set(['data','skip',list[i]], true);
		}
	}
	// END

	// BEGIN: Map old option.start to option.join
	if (old_revision < 1183 && revision >= 1183 && !fresh) {
		if (this.option.hasOwnProperty('start')) {
			this.set('option.join', this.option.start || false);
			this.set('option.start');
		}
	}
	// END

	this._trigger('#'+APPID_+'guild_token_current_value', 'tokens'); //fix
	this._watch(this, 'option.collect'); // force a collect retry on toggle
};

Guild.page = function(page, change) {
	var now = Date.now(), i, tmp, txt, buttons;

	switch (page) {
	case 'battle_guild':
		if ($('input[src*="dragon_list_btn_3."]').length) {
			// enter button - battle is on (or collect)
			if ((this.runtime.collected || 0) < (this.runtime.start || 0)) {
				this.set('runtime.check', now);
			} else if ((i = this.runtime.next || 0) > now) {
				this._remindMs(i - now, 'start');
			} else if ((this.runtime.start || 0) < now) {
				this.set('runtime.check', now);
			}
		} else {
			// battle is done
			if ((this.runtime.start || 0) > now) {
				this.set('runtime.start', now - 2);
			}
			if ((this.runtime.finish || 0) > now) {
				this.set('runtime.finish', now - 1);
			}
			if ($('input[src*="dragon_list_btn_2."]').length
			  && (this.runtime.collected || 0) < (this.runtime.start || 0)
			) {
				this.set('runtime.status', 'collect');
			} else {
				this.set('runtime.status', 'wait');
				this.set('runtime.collected', 0);
			}
			i = now - (this.runtime.finish || 0);
			if (i < (9*60+20)*60*1000) {
				this.set('runtime.next', i = now + 5*60*1000);
			} else if (i < 10*60*60*1000) {
				this.set('runtime.next', i = now + 10*60*1000);
			} else {
				this.set('runtime.next', i = now + 30*60*1000);
			}
			this._remindMs(i - now, 'start');
		}
		break;

	case 'battle_guild_battle':
		if ($('#guild_battle_banner_section:contains("You Must Be Apart of Either")').length) { 
			log(LOG_INFO, '# not our battle');
			Page.set('temp.page', null);
			return change;
		}

		buttons = 0; // buttons flag

		// join button
		tmp = $('input[src*="guild_enter_battle_button."]');
		if (tmp.length) {
			this.set('runtime.status', 'start');
			this.set('skip'); // Forget old "lose" list
			this.set('runtime.collected', 0);
			buttons |= 1;
		}

		// collect button
		tmp = $('input[src*="guild_battle_collectbtn_small."]'
		  + ',input[src*="arena3_collectbutton."]');
		if (tmp.length) {
			this.set('runtime.status', 'collect');
			this.set('runtime.collected', 0);
			buttons |= 2;
		}

		// battle timer
		tmp = $('#'+APPID_+'monsterTicker');
		if (tmp.length && isNumber(i = tmp.text().parseTimer())
		  && i > 0 && i < Date.HUGE
		) {
			if (!buttons) {
				this.set('runtime.status', 'fight');
			}
			this.set('runtime.start', now + (i - 5*60*60)*1000);
			this.set('runtime.finish', now + i*1000);
			if (i*1000 > this.option.safety) {
				this._remind(i*1000 - this.option.safety, 'fight');
			} else {
				this.set('runtime.burn', true);
			}
			this._remind(i, 'finish');
			this.set('runtime.next',
			  i = Math.max(now + 9*60*60*1000, this.runtime.next || 0));
			this._remindMs(i - now, 'start');
		} else {
			// battle is done
			if ((this.runtime.start || 0) > now) {
				this.set('runtime.start', now - 2);
			}
			if ((this.runtime.finish || 0) > now) {
				this.set('runtime.finish', now - 1);
			}
			if (!buttons) {
				this.set('runtime.collected', now);
			}
			if (this.runtime.status !== 'wait'
			  && (this.runtime.collected || 0) < (this.runtime.start || 0)
			) {
				this.set('runtime.status', 'collect');
			} else {
				this.set('runtime.status', 'wait');
			}
		}

		// token count
		tmp = $('#'+APPID_+'guild_token_current_value');
		if (tmp.length && isNumber(i = tmp.text().regex(/(\d+)/))) {
			this.set('runtime.tokens', i);
		}

		// token timer
		tmp = $('#'+APPID_+'guild_token_time_value');
		if (tmp.length && isNumber(i = tmp.text().parseTimer())
		  && i >= 0 && i < Date.HUGE
		) {
			this.set('runtime.next_token', now + i*1000);
			this._remind(i, 'tokens');
		}

		// record activity points
		tmp = $('#'+APPID_+'results_main_wrapper');
		if (tmp.length) {
			i = tmp.text().regex(/\+(\d+) \w+ Activity Points/i);
			if (isNumber(i)) {
				History.add('guild', i);
				History.add('guild_count', 1);
				this._notify('data');// Force dashboard update
			}
		}

		// update skip list with losses
		if ($('img[src*="battle_defeat"]').length && this.temp.last) {
			this.set(['data','skip',this.temp.last], true);
		}
		this.set('temp.last', null);

		if (this.runtime.status === 'start'
		  || this.runtime.status === 'fight'
		) {
			txt = '';
			if ((tmp = $('#'+APPID_+'guild_battle_banner_section')).length) {
				txt = tmp.text().trim(true);
			}
			if ((i = txt.regex(this.target_rx))) {
				if (isString(i[2])) {
					this.set('runtime.my_class', i[2]);
				}
				if (isString(i[5])) {
					this.set('runtime.stunned', i[5] === 'Stunned');
				}
			} else {
				log(LOG_INFO, '# bad self parse: ' + txt);
			}
		}
		break;
	}

	return change;
};

Guild.update = function(event, events) {
	var now = Date.now(), i, j, status, visit;

	if (this.runtime.check) {
		visit = true;
	}

	if (events.findEvent(this, 'init')) {
		// invalidate stale collection point
		if ((this.runtime.collected || 0) < (this.runtime.start || 0)) {
			this.set('runtime.collected', 0);
		}

		// last battle may still be on
		if ((this.runtime.finish || 0) > now) {
			if ((i = this.runtime.next_token || 0) && i < now) {
				j = (now - i) / (6*60*1000);
				this.set('runtime.tokens',
				  Math.min(10, (this.runtime.tokens || 0) + 1 + Math.floor(j)));
				this.set('runtime.next_token', i + Math.ceil(j) * 6*60*1000);
				if (this.runtime.tokens < 10) {
					this._remindMs(this.runtime.next_token - now, 'tokens');
				}
			}
		} else {
			// state is unclear, so trigger a visit, just to be safe
			visit = true;
		}

		// wake on next battle
		if ((i = this.runtime.next || 0) > now) {
			this._remindMs(i - now, 'start');
		} else {
			visit = true;
		}
	}
	if (!isString(this.runtime.status)) {
		visit = true;
	}

	if (events.findEvent(this, 'watch', 'option.collect')
	  && this.option.collect
	) {
		// force a collect attempt on collect option toggle
		if (this.runtime.status === 'wait') {
			this.set('runtime.status', 'collect');
		}
		this.set('runtime.collected', 0);
	}

	if ((this.runtime.finish || 0) > now
	  && (events.findEvent(null, 'trigger', 'tokens')
	  || events.findEvent(null, 'reminder', 'tokens'))
	) {
		this.set('runtime.tokens',
		  Math.min(10, (this.runtime.tokens || 0) + 1));
		if (this.runtime.tokens < 10) {
			this.set('runtime.next_token',
			  (this.runtime.next_token || now) + 6*60*1000);
			this._remindMs(this.runtime.next_token - now, 'tokens');
		}
	}

	if (this.runtime.status === 'fight' && (this.runtime.finish || 0) > now) {
		if ((i = this.runtime.finish - this.option.safety - now) > 0) {
			this._remindMs(i, 'fight');
			this.set('runtime.burn', (this.runtime.tokens || 0) >= 10);
		} else {
			this.set('runtime.burn', true);
		}
	}

	this.set(['option','_sleep'],
	  !visit && Page.get('battle_guild')
	  && !(this.runtime.status === 'wait' && (this.runtime.next || 0) <= now)
	  && !(this.runtime.status === 'start'
		&& (this.runtime.finish || 0) > now
	    && this.option.join
		&& Player.get('stamina', 0, 'number') >= 20
		&& (this.runtime.start || 0) + this.option.delay <= now)
	  && !(this.runtime.status === 'fight'
		&& (this.runtime.finish || 0) > now
	    && this.runtime.tokens
		&& ((this.runtime.start || 0) + this.option.delay <= now)
		&& (this.option.tokens === 'min'
		  || (this.option.tokens === 'healthy'
			&& (!this.runtime.stunned || this.runtime.burn))
		  || (this.option.tokens === 'max' && this.runtime.burn)))
	  && !(this.runtime.status === 'collect' && this.option.collect
	    && (this.runtime.collected || 0) <= (this.runtime.start || 0))
	);

	status = this.get('runtime.status', 'wait');

	Dashboard.status(this, 'Status: ' + this.temp.status[status]
	  + (status === 'wait' ? ' (' + Page.addTimer('guild_start', this.runtime.next) + ')' : '')
	  + (status === 'fight' ? ' (' + Page.addTimer('guild_finish', this.runtime.finish) + ')' : '')
	  + ', Tokens: ' + Config.makeImage('guild', 'Guild Stamina') + ' ' + this.runtime.tokens + ' / 10'
	);

	return true;
};

Guild.work = function(state) {
	var now = Date.now(), i, j, tmp, txt, page, general,
		skip, test, target, ignore,
		best, besttarget, any, anytarget, level, tokens;

	// wait:
	// - check list page
	// start:
	// - check battle page, click join button
	// fight:
	// - check battle page, find a target or jump a gate
	// collect:
	// - check battle page, click collect button

	if (state) {
		if (this.runtime.status === 'fight') {
			if (!this.option.generals) {
				general = this.option.general_choice || 'any';
			} else {
				if (!general || general === 'any') {
					switch (this.runtime.my_class || 'any') {
					case 'Cleric':
						general = Generals.best('guild_mage_heal_gate');
						break;
					case 'Mage':
						general = Generals.best('guild_mage_damage_gate');
						break;
					case 'Rogue':
						general = Generals.best('guild_rogue_damage');
						if (!general || general === 'any') {
							general = Generals.best('guild_rogue_evade');
						}
						break;
					case 'Warrior':
						general = Generals.best('guild_warrior_confidence');
						break;
					}
				}
				if (!general || general === 'any') {
					general = Generals.best('guild_damage');
				}
				if (!general || general === 'any') {
					general = Generals.best('duel');
				}
			}
			if (general && general !== 'any' && !Generals.to(general)) {
				return QUEUE_CONTINUE;
			}
		}

		if (this.runtime.status === 'wait'
		  || Page.temp.page !== (page = 'battle_guild_battle')
		  || Page.isStale(page, now - 30*1000)
		) {
			// visit battle list page
			if (!Page.to('battle_guild', '', 30)) {
				return QUEUE_CONTINUE;
			}
		}

		if (this.runtime.status !== 'wait'
		  && Page.temp.page === 'battle_guild'
		) {
			// visit battle page
			tmp = $('input[src*="dragon_list_btn_3."]'
			  + ',input[src*="dragon_list_btn_2."]');
			if (!tmp.length) {
				log(LOG_INFO, "Can't find enter button, bailing.");
				this.set('runtime.status', 'wait');
				return QUEUE_FINISH;
			} else if (!Page.click(tmp[0])) {
				log(LOG_INFO, "Can't click enter button, bailing.");
				return QUEUE_FINISH;
			}
			return QUEUE_CONTINUE;
		}

		this.set('runtime.check', 0);

		// is there a join button?
		if (this.option.join && Page.temp.page === 'battle_guild_battle'
		  && (this.runtime.start || 0) + this.option.delay <= now
		) {
			tmp = $('input[src*="guild_enter_battle_button."]');
			if (tmp.length) {
				log('Joining Battle');
				if (!Page.click(tmp[0])) {
					log(LOG_INFO, "Can't click join button!?");
					return QUEUE_FINISH;
				}
				return QUEUE_CONTINUE;
			}
		}

		// is there a collect button?
		if (this.option.collect && Page.temp.page === 'battle_guild_battle') {
			tmp = $('input[src*="guild_battle_collectbtn_small."]'
			  + ',input[src*="arena3_collectbutton."]');
			if (tmp.length) {
				log('Collecting Reward');
				if (!Page.click(tmp[0])) {
					log(LOG_INFO, "Can't click collect button!?");
					return QUEUE_FINISH;
				}
				return QUEUE_CONTINUE;
			}
		}

		if (this.runtime.status === 'fight'
		  && Page.temp.page === 'battle_guild_battle'
		) {
			ignore = this.option.ignore
			  && this.option.ignore.length ? this.option.ignore.split('|') : [];
			level = Player.get('level', 1, 'number');
			tokens = this.get(['runtime','tokens'], 0, 'number');
			best = besttarget = null;
			any = anytarget = null;
			tmp = $('#'+APPID_+'enemy_guild_member_list_1 > div'
			  + ', #'+APPID_+'enemy_guild_member_list_2 > div'
			  + ', #'+APPID_+'enemy_guild_member_list_3 > div'
			  + ', #'+APPID_+'enemy_guild_member_list_4 > div');
			if (!tmp.length) {
				tmp = $('#enemy_guild_member_list'
				  + ' > div[id*="enemy_guild_member_list_"]'
				  + ':contains("No Soldiers Posted In This Position!")');
			}
			for (i = 0; i < tmp.length; i++) {
				txt = tmp.eq(i).text().trim(true);
				target = txt.regex(this.target_rx);
				skip = false;
				if (!target) {
					test = 'no targets';
					skip = true;
				} else if (this.option.defeat && this.data[target[0]]) {
					test = 'defeat protection';
					skip = true;
				} else if (isNumber(this.option.limit)
				  && target[1] > level + this.option.limit
				) {
					test = 'tough target';
					skip = true;
				}
				if (!skip) {
					for (j = ignore.length - 1; j >= 0; j--) {
						if (target[0].indexOf(ignore[j]) >= 0) {
							test = 'ignore list';
							skip = true;
							break;
						}
					}
				}
				if (skip) {
					if (!target) {
						log(LOG_DEBUG, '# skip: ' + test);
					} else {
						log(LOG_DEBUG, '# skip: ' + test + ': '
						  + ' ' + (target[6] ? 'active' : 'inactive')
						  + ' ' + target[1] + '/' + target[2]
						  + ' ' + target[3] + '/' + target[4]
						  + ' ' + target[0]
						);
					}
					continue;
				}
				if (target[3] > 0
				  && (this.option.cleric ? (target[2] === 'Cleric' && target[6]) || !best || besttarget[2] !== 'Cleric' || !besttarget[6] : true)
				  && (this.option.active ? target[6] || !best || !besttarget[6] : true)
				  && (this.option.live ? target[3] >= 200 || !best || besttarget[3] < 200 : true)
				  && (this.option.suppress ? target[6] : target[3] >= 200)
				  && this.best_target(target, besttarget)
				) {
					log(LOG_INFO, '# ' + (best ? '' : 'initial ')
					  + 'best.' + i + ':'
					  + ' ' + (target[6] ? 'active' : 'inactive')
					  + ' ' + target[1] + '/' + target[2]
					  + ' ' + target[3] + '/' + target[4]
					  + ' ' + target[0]
					);
					best = tmp.eq(i);
					besttarget = target;
				} else if (target[3] > 0
				  && (this.runtime.burn || (this.runtime.tokens || 0) >= 10)
				  && this.best_target(target, anytarget)
				) {
				    any = tmp.eq(i);
				    anytarget = target;
				}
			}
			if (!best && any) {
				best = any;
				besttarget = anytarget;
			}
			if (!best && tmp.length) {
				// cheap and dirty gate change hack
				j = tmp.length;
				i = tmp.closest('div[id^="enemy_guild_member_list_"]').attr('id').regex(/enemy_guild_member_list_(\d+)/i);
				tmp = $('#'+APPID_+'enemy_guild_tab_'+(i+1)+'.imgButton');
				if (tmp.length && Page.click(tmp[0])) {
					log(LOG_INFO, 'No targets, trying gate ' + (i+1));
					return QUEUE_CONTINUE;
				} else {
					log(LOG_INFO, 'No targets, no next gate ('+j+')');
					return QUEUE_FINISH;
				}
			} else if (best) {
				log('Attacking'
				  + ' ' + (besttarget[6] ? 'active' : 'inactive')
				  + ' ' + besttarget[1] + '/' + besttarget[2]
				  + ' ' + besttarget[3] + '/' + besttarget[4]
				  + ' ' + besttarget[0]
				);
				tmp = $('input[src*="monster_duel_button."]', best);
				if (!tmp.length) {
					log(LOG_INFO, "Can't find attack button, backing out.");
					page = 'battle_guild';
					Page.to(page, '', 30);
				} else if (!Page.click(tmp[0])) {
					log(LOG_INFO, "Can't click attack button, backing out.");
					page = 'battle_guild';
					Page.to(page, '', 30);
					this.set(['temp','last'], null);
				} else {
					this.set(['temp','last'], besttarget[0]);
				}
			} else {
				log(LOG_INFO, 'No targets, no next gate (0)');
				return QUEUE_FINISH;
			}
		} else if (this.runtime.status === 'fight') {
			log(LOG_INFO, '# wrong fight page: ' + Page.temp.page);
		}
	}

	return QUEUE_CONTINUE;
};

Guild.best_target = function(target1, target2) {
	var cmp = false, v1, v2;

	if (isArray(target1)) {
		if (!isArray(target2)) {
			cmp = true;
		} else {
			switch (this.option.order) {
			case 'level':		cmp = target1[1] < target2[1];	break;
			case 'health':		cmp = target1[3] < target2[3];	break;
			case 'maxhealth':	cmp = target1[4] < target2[4];	break;
			case 'activity':	cmp = target1[6] < target2[6];	break;
			case 'level2':		cmp = target1[1] > target2[1];	break;
			case 'health2':		cmp = target1[3] > target2[3];	break;
			case 'maxhealth2':	cmp = target1[4] > target2[4];	break;
			case 'activity2':	cmp = target1[6] > target2[6];	break;
			case 'levelactive':
				v1 = target1[1] || 1e99;
				if (target1[6]) {
					v1 = -1.0 / v1;
				}
				v2 = target2[1] || 1e99;
				if (target2[6]) {
					v2 = -1.0 / v2;
				}
				cmp = v1 < v2;
				break;
			case 'levelactive2':
				v1 = target1[1] || 1e99;
				if (!target1[6]) {
					v1 = -1.0 / v1;
				}
				v2 = target2[1] || 1e99;
				if (!target2[6]) {
					v2 = -1.0 / v2;
				}
				cmp = v1 > v2;
				break;
			}
		}
	}

	return cmp;
};
