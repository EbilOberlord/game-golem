/*jslint browser:true, laxbreak:true, forin:true, sub:true, onevar:true, undef:true, eqeqeq:true, regexp:false */
/*global
	$, Worker, Workers, Config, Dashboard, Main, // Page, Queue, Settings:true,
	//Battle, Generals, LevelUp, Player,
	APP, APPID, APPNAME, PREFIX, userID, imagepath,
	isRelease, version, revision, Images, window, browser,
	LOG_ERROR, LOG_WARN, LOG_LOG, LOG_INFO, LOG_DEBUG, log,
	isArray, isFunction, isNumber, isObject, isString, isWorker,
	plural, localStorage, confirm, alert
*/
/********** Worker.Settings **********
* Save and Load settings by name - never does anything to CA beyond Page.reload()
*/
var Settings = new Worker('Settings');
Settings._rootpath = false; // Override save path so we don't get limited to per-user
Settings.option = Settings.runtime = null;

Settings.settings = {
	system:true,
	unsortable:true,
	advanced:true,
	no_disable:true,
	taint:true
};

Settings.temp = {
	worker:null,
	edit:null,
	paths:['-']
};

Settings.init = function() {
	var i, j;
	for (i in Workers) {
		for (j in Workers[i]._datatypes) {
			this.temp.paths.push(i + '.' + j);
		}
	}
	this.temp.paths.sort();
	if (this.data['- default -']) {
		this.data = this.data['- default -'];
	}
};

Settings.menu = function(worker, key) {
	var i, j, k, keys = [];
	if (worker) {
		if (!key) {
			if (Config.option.advanced) {
				for (i in worker._datatypes) {
					keys.push(i+':' + (worker.name === this.temp.worker && i === this.temp.edit ? '=' : '') + 'Edit "' + worker.name + '.' + i + '"');
				}
				keys.push('---');
			}
			keys.push('backup:Backup Options');
			keys.push('restore:Restore Options');
			return keys;
		} else if (key) {
			if (key === 'backup') {
				if (confirm("BACKUP WARNING!!!\n\nAbout to replace '+worker.name+' backup options.\n\nAre you sure?")) {
					this.set(['data', worker.name], $.extend(true, {}, worker.option));
				}
			} else if (key === 'restore') {
				if (confirm("RESTORE WARNING!!!\n\nAbout to restore '+worker.name+' options.\n\nAre you sure?")) {
					worker._replace('option', $.extend(true, {}, this.data[worker.name]));
				}
			} else if (this.temp.worker === worker.name && this.temp.edit === key) {
				this.temp.worker = this.temp.edit = null;
				this._notify('data');// Force dashboard update
			} else {
				this.temp.worker = worker.name;
				this.temp.edit = key;
				this._notify('data');// Force dashboard update
				Dashboard.set(['option','active'], this.name);
			}
		}
	} else {
		if (!key) {
			keys.push('backup:Backup&nbsp;Options');
			keys.push('restore:Restore&nbsp;Options');
			if (Config.option.advanced) {
				keys.push('---');
				keys.push('reset:!Reset&nbsp;Golem');
				keys.push('reset:!Wipe&nbsp;Golem');
			}
			return keys;
		} else {
			if (key === 'backup') {
				if (confirm("BACKUP WARNING!!!\n\nAbout to replace backup options for all workers.\n\nAre you sure?")) {
					for (i in Workers) {
						this.set(['data',i], $.extend(true, {}, Workers[i].option));
					}
				}
			} else if (key === 'restore') {
				if (confirm("RESTORE WARNING!!!\n\nAbout to restore options for all workers.\n\nAre you sure?")) {
					for (i in Workers) {
						if (i in this.data) {
							Workers[i]._replace('option', $.extend(true, {}, this.data[i]));
						}
					}
				}
			} else if (key === 'reset') {
				keys = [];
				k = localStorage.length;
				for (i = 0; i < localStorage.length; i++) {
					j = localStorage.key(i);
					if (isString(j) && j.indexOf('golem.' + APP + '.') === 0) {
						keys.push(j);
					}
				}
				if (confirm('IMPORTANT WARNING!!!\n\nAbout to delete all data for Golem on '+APPNAME+'.\n\nAre you sure?'
				  + ' (' + keys.length + '/' + k + ' keys)'
				)) {
					if (confirm("VERY IMPORTANT WARNING!!!\n\nThis will clear everything, reload the page, and make Golem act like it is the first time it has ever been used on "+APPNAME+".\n\nAre you REALLY sure??")) {
						// Well, they've had two chances...
//						log(LOG_INFO, 'Reset: '+keys.length+'/'+k+' keys total');
						Main.shutdown();
						try {
							while (keys.length > 0) {
								j = keys.pop();
								localStorage.removeItem(j);
								if ((i = localStorage.getItem(j)) !== null) {
									throw new Error('removeItem failed on ' + j + ' [' + JSON.shallow(i) + ']');
								}
							}
							window.location.replace(window.location.href);
						} catch (e) {
							log(e, e.name + ' in ' + this.name + '.menu(): ' + e.message);
						}
					}
				}
			} else if (key === 'wipe') {
				keys = [];
				k = localStorage.length;
				for (i = 0; i < localStorage.length; i++) {
					j = localStorage.key(i);
					if (isString(j) && j.indexOf('golem.') === 0) {
						keys.push(j);
					}
				}
				if (confirm('IMPORTANT WARNING!!!\n\nAbout to delete all data for Golem on ALL Apps.\n\nAre you sure?'
				  + ' (' + keys.length + '/' + k + ' keys)'
				)) {
					if (confirm("VERY IMPORTANT WARNING!!!\n\nThis will clear everything, reload the page, and make Golem act like it is the first time it has ever been used.\n\nAre you REALLY sure??")) {
						// Well, they've had two chances...
//						log(LOG_INFO, 'Wipe: '+keys.length+'/'+k+' keys total');
						Main.shutdown();
						try {
							while (keys.length > 0) {
								j = keys.pop();
								localStorage.removeItem(j);
								if ((i = localStorage.getItem(j)) !== null) {
									throw new Error('removeItem failed on ' + j + ' [' + JSON.shallow(i) + ']');
								}
							}
							window.location.replace(window.location.href);
						} catch (e2) {
							log(e2, e2.name + ' in ' + this.name + '.menu(): ' + e2.message);
						}
					}
				}
			}
		}
	}
};

Settings.dashboard = function() {
	var i, j, o, x, y, z, total, rawtot, path = this.temp.worker+'.'+this.temp.edit, html = '', storage = [];
	html = '<select id="golem_settings_path">';
	for (i=0; i<this.temp.paths.length; i++) {
		html += '<option value="' + this.temp.paths[i] + '"' + (this.temp.paths[i] === path ? ' selected' : '') + '>' + this.temp.paths[i] + '</option>';
	}
	html += '</select>';
	html += '<input id="golem_settings_refresh" type="button" value="Refresh">';
	if (this.temp.worker && this.temp.edit === 'data') {
		Workers[this.temp.worker]._unflush();
	}
	if (!this.temp.worker) {
		total = rawtot = 0;
		o = [];
		for (i in Workers) {
		    o.push(i);
		}
		o.sort();
		for (i = 0; i < o.length; i++) {
			for (j in Workers[o[i]]._storage) {
				if (Workers[o[i]]._storage[j]) {
					x = Workers[o[i]]._storage[j] || 0;
					y = Workers[o[i]]._rawsize[j] || x;
					z = Workers[o[i]]._numvars[j] || 0;
					total += x;
					rawtot += y;
					storage.push('<tr>');
					storage.push('<th>' + o[i] + '.' + j + '</th>');
					storage.push('<td style="text-align:right;">' + x.addCommas() + ' bytes</td>');
					storage.push('<td style="text-align:right;">' + y.addCommas() + ' bytes</td>');
					storage.push('<td style="text-align:right;">' + (x !== y ? (x * 100 / y).SI() + '%' : '&nbsp;') + '</td>');
					storage.push('<td style="text-align:right;">' + (z ? z + ' key' + plural(z) : '&nbsp;') + '</td>');
					storage.push('</tr>');
				}
			}
		}
		html += ' No worker specified (total ' + total.addCommas();
		if (total !== rawtot) {
			html += '/' + rawtot.addCommas();
		}
		html += ' bytes';
		if (total !== rawtot) {
			html += ', ' + (total * 100 / rawtot).SI() + '%';
		}
		html += ')<br><table>' + storage.join('') + '</table>';
	} else if (!this.temp.edit) {
		html += ' No ' + this.temp.worker + ' element specified.';
	} else if (typeof Workers[this.temp.worker][this.temp.edit] === 'undefined') {
		html += ' The element is undefined.';
	} else if (Workers[this.temp.worker][this.temp.edit] === null) {
		html += ' The element is null.';
	} else if (typeof Workers[this.temp.worker][this.temp.edit] !== 'object') {
		html += ' The element is scalar.';
	} else {
		i = length(Workers[this.temp.worker][this.temp.edit]);
		html += ' The element contains ' + i + ' element' + plural(i);
		if (Workers[this.temp.worker]._storage[this.temp.edit]) {
			html += ' (' + (Workers[this.temp.worker]._storage[this.temp.edit]).addCommas() + ' bytes)';
		}
		html += '.';
	}
	if (this.temp.worker && this.temp.edit) {
		if (Config.option.advanced) {
			html += '<input style="float:right;" id="golem_settings_save" type="button" value="Save">';
		}
		html += '<div style="position:relative;"><textarea id="golem_settings_edit" style="position:absolute;width:98%;top:0;left:0;right:0;">' + JSON.stringify(Workers[this.temp.worker][this.temp.edit], null, '   ') + '</textarea></div>';
	}
	$('#golem-dashboard-Settings').html(html);
	$('#golem_settings_refresh').click(function(){Settings.dashboard();});
	$('#golem_settings_save').click(function(){
		var data;
		try {
			data = JSON.parse($('#golem_settings_edit').val());
		} catch(e) {
			alert("ERROR!!!\n\nBadly formed JSON data.\n\nPlease check the data and try again!");
			return;
		}
		if (confirm("WARNING!!!\n\nReplacing internal data can be dangrous, only do this if you know exactly what you are doing.\n\nAre you sure you wish to replace "+Settings.temp.worker+'.'+Settings.temp.edit+"?")) {
			// Need to copy data over and then trigger any notifications
			Workers[Settings.temp.worker]._replace(Settings.temp.edit, data);
		}
	});
	$('#golem_settings_path').change(function(){
		var path = $(this).val().regex(/([^.]*)\.?(.*)/);
		if (path[0] in Workers) {
			Settings.temp.worker = path[0];
			Settings.temp.edit = path[1];
		} else {
			Settings.temp.worker = Settings.temp.edit = null;
		}
		Settings.dashboard();
	});
	$('#golem_settings_edit').autoSize();
};

