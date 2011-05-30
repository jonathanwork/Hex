handler = function(info, hex, admin, config, admins)
{
	var chan, cmd, cmd_end, index, flush, nick, reply, pm, log;
	flush = false;
	nick = info[1];
	chan = info[3];

	pm =  chan.search(/^[^#]/) !== -1;
	if (pm)
	{
		chan = nick;
	}

	reply = /^(.+) @ ?(.+)/.exec(info[4]);
	if (reply)
	{
		info[4] = reply[1];
		nick = reply[2];
	}

	index = info[4].indexOf(' ');
	cmd = (index === -1) ? info[4] : info[4].slice(0, index);
	cmd_end = (index === -1) ? null : info[4].slice(index + 1);

	if (cmd.search(/(\.|\/)/) !== -1)
	{
		return false;
	}

	switch (cmd.toLowerCase())
	{
		case 'a':
		case 'admin':
			if (!admin)
			{
				console.log(nick + ' tried to access admin without correct permissions.')
				return false;
			}
			index = cmd_end.indexOf(' ');
			cmd = (index === -1) ? cmd_end : cmd_end.slice(0, index);
			cmd_end = (index === -1) ? null : cmd_end.slice(index + 1);

			switch (cmd.toLowerCase())
			{
				case 'help':
				case 'h':
					chan = nick;
					if (cmd_end !== null && cmd_end.toLowerCase() === 'all')
					{
						reply = [
							'Full list of admin commands, followed by the required admin level in brackets:',
							'help [all]                  - return a list of commands [and what they do]. (1)',
							'ban <user> [<channel>]      - bans a user from a channel. If channel is not specified, defaults to current. (4)',
							'devoice <user> [<channel>]  - devoice a user in a channel. If channel is not specified, defaults to current. (2)',
							'gline <user>                - glines the specified user. Feature not yet operational. (9)',
							'join <channel>              - join a specified channel. (7)',
							'kick <user> [<channel>]     - kick a user from a channel. If channel is not specified, defaults to current. (3)',
							'part [<channel>]            - part a specified channel. If channel is not specified, defaults to current. (7)',
							'quit                        - quits the bot. (10)',
							'raw <command>               - sends the command as raw IRC. (10)',
							'remove <command>            - deletes a command. Please bear in mind that some commands cannot be removed. (6)',
							'restart                     - restarts the bot. (10)',
							'set <command> <message>     - sets a responce to a specified command (eg "set test hello world" will cause the bot to say "hello world" when the user says "hex: test"). (6)',
							'shun <user>                 - tempshuns the specified user. Feature not yet operational. (9)',
							'voice <user> [<chan>]       - voice a user in a channel. If channel is not specified, defaults to current. (2)',
							'End of help.'
						];
						break;
					}
					reply = [
						'Currently available admin commands:',
						'help, ban, devoice, gline, join, kick, part, quit, raw, remove, restart, set, shun, voice.',
						'Please not that not all features may be operational, as the bot is still under development.'
					];
					break;

				case 'ban':
					if (admin < 4)
					{
						reply = 'Admin level 4 required for this operation.';
						break;
					}
					if (cmd_end.indexOf(' ') !== -1)
					{
						cmd_end = cmd_end.slice(0, cmd_end.indexOf(' '));
						chan = cmd_end.slice(cmd_end.indexOf(' ') + 1);
					}
					hex.kick(cmd_end, chan, 'Requested (' + nick + ')', true);
					log = 'ban ' + cmd_end + ' (from ' + chan + ')';
					break;

				case 'devoice':
					if (admin < 2)
					{
						reply = 'Admin level 2 required for this operation.';
						break;
					}
					if (cmd_end.indexOf(' ') !== -1)
					{
						cmd_end = cmd_end.slice(0, cmd_end.indexOf(' '));
						chan = cmd_end.slice(cmd_end.indexOf(' ') + 1);
					}
					hex.raw('MODE ' + chan + ' -v ' + cmd_end);
					log = 'devoice ' + cmd_end + ' (from ' + chan + ')';
					break;

				case 'flush':
					flush = true;
					reply = 'Flushing...';
					break;

				case 'gline':
					if (admin < 9)
					{
						reply = 'Admin level 9 required for this operation.';
						break;
					}
					reply = 'Feature hasn\'t yet been developed.';
					break;

				case 'join':
					if (admin < 7)
					{
						reply = 'Admin level 7 required for this operation.';
						break;
					}
					hex.join(cmd_end);
					config.chans.push(cmd_end);
					log = 'join ' + cmd_end;
					flush = true;
					break;

				case 'kick':
					if (admin < 3)
					{
						reply = 'Admin level 3 required for this operation.';
						break;
					}
					if (cmd_end.indexOf(' ') !== -1)
					{
						cmd_end = cmd_end.slice(0, cmd_end.indexOf(' '));
						chan = cmd_end.slice(cmd_end.indexOf(' ') + 1);
					}
					hex.kick(cmd_end, chan, 'Requested (' + nick + ')');
					log = 'kick ' + cmd_end + ' (from ' + chan + ')';
					break;

				case 'part':
					if (admin < 7)
					{
						reply = 'Admin level 7 required for this operation.';
						break;
					}
					if (cmd_end)
					{
						chan = cmd_end;
					}
					config.chans.splice(config.chans.indexOf(chan), 1);
					hex.part(chan, 'Requested (' + nick + ')');
					flush = true;
					break;

				case 'quit':
				case 'q':
				case 'restart':
					if (admin < 10)
					{
						reply = 'Admin level 10 required for this operation.';
						break;
					}
					hex.quit('Requested (' + nick + ')');
					console.log('Restart called by ' + nick);
					process.exit();
					break;

				case 'raw':
					if (admin < 10)
					{
						reply = 'Admin level 10 required for this operation.';
						break;
					}
					hex.raw(cmd_end);
					console.log(nick + ' sent RAW: ' + cmd_end);
					break;

				case 'remove':
				case 'rm':
					if (admin < 6)
					{
						reply = 'Admin level 6 required for this operation.';
						break;
					}
					var fs = require('fs');
					fs.unlinkSync('./msgs/' + cmd_end);
					reply = 'Successfully removed ' + cmd_end;
					log = cmd + ' ' + cmd_end;
					break;

				case 'set':
					if (admin < 6)
					{
						reply = 'Admin level 6 required for this operation.';
						break;
					}

					cmd = cmd_end.slice(0, cmd_end.indexOf(' '));
					cmd_end = cmd_end.slice(cmd_end.indexOf(' ') + 1);

					log = 'set ' + cmd;

					var fs = require('fs');
					fs.writeFileSync('./msgs/' + cmd, cmd_end);
					reply = 'Successfully set ' + cmd;
					break;

				case 'shun':
					if (admin < 9)
					{
						reply = 'Admin level 9 required for this operation.';
						break;
					}
					reply = 'Feature hasn\'t yet been developed.';
					break;

				case 'su':
					//dont check whether admin is level 10 yet - level 3s can list admins
					cmd = cmd_end.split(' ', 3);
					switch (cmd[0].toLowerCase())
					{
						case 'add':
						case 'set':
							if (admin < 10)
							{
								reply = 'Admin level 10 required for this operation.';
								break;
							}
							regex = '^:NickServ![^@]+@[^ ]+ NOTICE [^ ]+ :STATUS ' + cmd[1] + ' ([0-3])';
							hex.on_once(new RegExp(regex), function(status)
							{
								if (status[1] === '3')
								{
									console.log(cmd[1] + ' added as admin.');
									if (hex.info.names[chan][cmd[1]] !== undefined)
									{
										admins[cmd[1]] = {
											host: hex.info.names[chan][cmd[1]].host,
											level: cmd[2]
										}
									}
								}
							});
							hex.msg('NickServ', 'STATUS ' + cmd[1]);
							config.su[cmd[1]] = cmd[2];
							console.log(cmd[1] + ' added as admin by ' + nick);
							reply = 'Successfully added ' + cmd[1] + ' as level ' + cmd[2];
							flush = true;
							break;

						case 'remove':
						case 'rm':
							if (admin < 10)
							{
								reply = 'Admin level 10 required for this operation.';
								break;
							}
							delete config.su[cmd[1]];
							delete admins[cmd[1]];
							reply = 'Successfully removed ' + cmd[1] + ' as super user.';
							flush = true;
							break;

						case 'list':
							var su_nick;
							if (admin < 3)
							{
								reply = 'Admin level 3 required for this operation.';
								break;
							}
							chan = nick;
							reply = ['List of admins, followed by their level and whether they are signed in or not:'];
							for (su_nick in config.su)
							{
								reply.push(su_nick + ' is level ' + config.su[su_nick] + ' and is' + ((admins[su_nick] === undefined) ? ' not' : '') + ' currently signed in.');
							}
							reply.push('End of list.');
							break;

						case 'default':
							reply = 'The only commands under "admin su" are "add" (or "set"), "remove" (or "rm"), and "list".';
							break;
					}
					log = 'su ' + cmd;
					break;

				case 'topic':
					if (admin < 10)
					{
						reply = 'Admin level 10 required for this operation.';
						break;
					}
					if (cmd_end === null)
					{
						reply = 'You need to specify a command, such as append / set / root.';
						break;
					}
					var end, topic;
					end = (cmd_end.indexOf(' ') === -1) ? undefined : cmd_end.indexOf(' ');
					cmd = cmd_end.slice(0, end);
					cmd_end = cmd_end.slice(end + 1);

					if (cmd_end === cmd)
					{
						cmd_end = null;
					}

					if (config.tmp.topic === undefined)
					{
						config.tmp.topic = config.topic.root.join(' ' + config.topic.seperator + ' ');
					}

					switch (cmd.toLowerCase())
					{
						case 'append':
							log = 'topic append';
							topic = config.topic.root;
							topic.push(cmd_end);
							topic = topic.join(' ' + config.topic.seperator + ' ');
							break;

						case 'set':
							log = 'topic set';
							topic = config.topic.root;
							topic[cmd_end.slice(0, 1) - 1] = cmd_end.slice(2);
							topic = topic.join(' ' + config.topic.seperator + ' ');
							break;

						case 'root':
							log = 'topic root';
							topic = config.tmp.topic;
							break;

						default:
							topic = cmd + (cmd_end ? ' ' + cmd_end : '');
							topic = topic.split(' ' + config.topic.seperator + ' ');
							config.topic.root = topic;
							topic = config.topic.root.join(' ' + config.topic.seperator + ' ');
							break;
					}
					if (topic)
					{
						topic = '\xE2\x96\xBA ' + topic + ' \xE2\x97\x84';
						hex.raw('TOPIC ' + chan + ' :' + topic);
					}
					break;

				case 'voice':
					if (admin < 2)
					{
						reply = 'Admin level 2 required for this operation.';
						break;
					}
					if (cmd_end.indexOf(' ') !== -1)
					{
						cmd_end = cmd_end.slice(0, cmd_end.indexOf(' '));
						chan = cmd_end.slice(cmd_end.indexOf(' ') + 1);
					}
					hex.raw('MODE ' + chan + ' +v ' + cmd_end);
					break;

				default:
					reply = 'Command not found. Try "hex: admin help" for a list of admin features.';
					break;
			}
			console.log('"admin ' + ((log === undefined) ? cmd : log) + '" called by ' + nick);
			break;

		case 'g':
		case 'google':
			reply = 'http://google.com/search?q=' + encodeURIComponent(cmd_end);
			break;

		case 'help':
			reply = 'Under construction.';
			break;

		case 'lmgtfy':
			reply = 'http://lmgtfy.com/?q=' + encodeURIComponent(cmd_end);
			break;

		case 'w':
		case 'wiki':
			var http = require('http');
			var options = {
				host: 'x10hosting.com',
				port: 80,
				path: '/wiki/index.php?title=Special%3ASearch&search=' + encodeURIComponent(cmd_end),
				method: 'GET'
			};

			var req = http.request(options, function(res)
			{
				if (res.statusCode === 302 || res.statusCode === 301)
				{
					var url = res.headers.location
				}
				else
				{
					var url = 'http://x10hosting.com/wiki/index.php?title=Special%3ASearch&search=' + encodeURIComponent(cmd_end);
				}
				hex.msg(chan, nick + ': ' + url);
				res.setEncoding('utf8');
			});
			req.on('error', function(e)
			{
				console.log('Problem with request: ' + e.message);
			});
			req.end();

			break;

		case 'wa':
		case 'wolfram':
		case 'wolframalpha':
			reply = 'http://www.wolframalpha.com/input/?i=' + encodeURIComponent(cmd_end);
			break;

		case 'whoami':
			reply = 'Your nick is "' + info[1] + '". Your hostmask is "' + info[2] + '". ';
			reply += (admin) ? 'You are admin level ' + admin + '.' : 'You are not an admin.';
			break;

		default:
			var file, fs = require('fs');
			try
			{
				file = fs.readFileSync('./msgs/' + cmd, 'utf8');
			}
			catch(err)
			{
				if (pm)
				{
					reply = 'Command not found. Please try "help" for a list of commands.';
				}
				break;
			}
			reply = file.split('\n');
			break;
	}

	if (reply)
	{
		if (typeof reply === 'string')
		{
			reply = [reply];
		}
		var interval = setInterval(function()
		{
			if (reply.length === 0 || reply[0] === undefined)
			{
				clearInterval(interval);
				return;
			}
			hex.msg(chan, ((pm) ? '' : nick + ': ') + reply[0]);
			reply.splice(0, 1);
		}, 200);
	}
	return flush;
}

html_decode = function(s)
{
	var c, m, d = s;

	arr = d.match(/&#[0-9]{1,5};/g);

	// if no matches found in string then skip
	if (arr !== null)
	{
		for (var x = 0; x < arr.length; x++)
		{
			m = arr[x];
			c = m.substring(2, m.length - 1);
			if (c >= -32768 && c <= 65535)
			{
				d = d.replace(m, String.fromCharCode(c));
			}
			else
			{
				d = d.replace(m, "");
			}
		}
	}
	return d;
}

//URL sent in chat
url_handler = function(url, chan)
{
	var http = require('http');
	var options = {
		host: url[1],
		port: 80,
		path: url[2]
	};

	var req = http.get(options, function(res)
	{
		var title;
		res.setEncoding('utf8');
		if (res.statusCode === 200)
		{
			res.on('data', function (chunk)
			{
				title = /\<title\>([^<]+)\<\/title\>/i.exec(chunk);
				if (title)
				{
					hex.msg(chan, 'Page title: "' + html_decode(title[1]) + '"');
				}
			});
			return;
		}
	}).on('error', function(e)
	{
		console.log('Problem with HTTP request: ' + e.message);
	});
}