var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var PORT = 3000;

var namerinoOfProjectino = 'Project B';

var idCounter = {
	users : 69,
	lobbys : 69
}

function User(socket, name){
	this.socket = socket;
	this.name = name;
	this.id = idCounter.users++;
	this.remove = function(){
		var userIndex = users.indexOf(this);
		users.splice(userIndex, 1);
	}
	this.getUserLobby = function(){
		var lobby;
		for(var i = 0; i < lobbys.length; i++){
			var u = lobbys[i].users;
			for(var x = 0; x < u.length; x++){
				if(this.id === u[x]){
					lobby = lobbys[i];
					break
				}
			}
		}
		if(typeof(lobby) === undefined){
			return false;
		} else {
			return lobby;
		}
	}
}

function Lobby(name, master){
	this.name = name;
	this.master = master.id;
	this.id = idCounter.lobbys++;
	this.users = [];
	this.users.push(master.id);
	this.addUser = function(user){
		this.users.push(user.id);
	}
	this.delete = function(){
		for (var i = this.users.length - 1; i >= 0; i--) {
			var id = this.users[i];
			var user = findUserById(id);
			user.socket.emit('lobbyDisconnect');
		};
		lobbys.splice(lobbys.indexOf(this), 1);
	}
	this.removeUser = function(user){
		if(user.id == this.master){
			this.delete();
		} else {
			this.users.splice(this.users.indexOf(user.id), 1);
		}
	}
}

var users = [];
var lobbys = [];
var consoleBuffer = [];

function findUserBySocket(socket){
	var user;
	for(var i = 0; i < users.length; i++){
		if(users[i].socket === socket){
			user = users[i];
			break;
		}
	} 
	if(typeof(user) === undefined){
		return false;
	} else {
		return user;
	}
}
function findUserById(id){
	var user; 
	for(var i = 0; i < users.length; i++){
		if(users[i].id === id){
			user = users[i];
			break;
		}
	}
	if(typeof(user) === undefined){
		return false;
	} else {
		return user;
	}
}

function findLobbyById(id){
	var lobby; 
	for(var i = 0; i < lobbys.length; i++){
		if(lobbys[i].id === id){
			lobby = lobbys[i];
			break;
		}
	}
	if(typeof(lobby) === undefined){
		return false;
	} else {
		return lobby;
	}
}
// http server 

app.set('view engine', 'ejs');
app.use(express.static('public'));

app.get('/', function(req, res){
	res.render('mainpage', {title: namerinoOfProjectino});
});

app.get('/game', function(req, res){
	res.render('game', {title: namerinoOfProjectino, lobbys: lobbys});
});

app.get('/testing', function(req, res){
	res.render('testing');
});


app.get('/*', function(req, res){
	res.render('404');
});

// websocket server
io.on('connection', function(socket){

	consoleBuffer.push(socket.id + ' is trying to connect');

	socket.on('login', function(name){
		if(name !== '' || name !== undefined){
			var user = new User(socket, name)
			users.push(user);
			consoleBuffer.push('#'+user.id+' '+user.name+' connected');
		}
	});

	socket.on('getLobbys', function(){
		var sendLobbys = [];
		for(var i = 0; i < lobbys.length; i++){
			sendLobbys.push({name: lobbys[i].name, id: lobbys[i].id});
		}
		socket.emit('getLobbys', JSON.stringify(sendLobbys));
	});

	socket.on('joinLobby', function(d){
		var user = findUserBySocket(socket);
		var id = parseInt(d);
		var lobby = findLobbyById(id);
		if(!user.getUserLobby()){
			lobby.addUser(user);
			var data = {id : lobby.id, name : lobby.name, users : lobby.users};
			socket.emit('joinLobby', JSON.stringify(data));
		} else {
			socket.emit('joinLobby', 'error1');
		}
		
	});

	socket.on('lobbyInit', function(){
		var user = findUserBySocket(socket);
		if(!user.getUserLobby()){
			var lobby = new Lobby(user.name+"'s game", user);
			lobbys.push(lobby);
			socket.emit('lobbyInit', 'success');
		} else {
			socket.emit('lobbyInit', 'error1');
		}
	});

	socket.on('disconnect', function(){
		var user = findUserBySocket(socket);
		consoleBuffer.push('#'+user.id+' '+user.name+' disconected');
		var lobby = user.getUserLobby();
		if(lobby){
			lobby.removeUser(user);
		}
		user.remove();
	});

});

var magic = ['-',"\\", '|', "/", "-", "\\", "|", "/"];
//var magic = ['Janko', 'je', 'Frajer'];
var magicCounter = 0;

http.listen(PORT);

	setInterval(function(){
		process.stdout.clearLine();
		process.stdout.cursorTo(0);
		process.stdout.write('\033c');
		console.log('###############################################');
		console.log('SUPER AWESOME SERVER IS RUNNING ON PORT: '+PORT);
		console.log('###############################################\n');

		process.stdout.write('users:\n');
		for(var i = 0; i < users.length; i++){
			process.stdout.write('#'+users[i].id+' '+users[i].name+'\n');
		}
		process.stdout.write('\nlobbys: \n');
		for(var i = 0; i < lobbys.length; i++){
			process.stdout.write('#'+lobbys[i].id+' '+lobbys[i].name+'\n');
		}
		process.stdout.write('\nLogs: \n');
		for(var i = 0; i < consoleBuffer.length; i++){
			process.stdout.write(consoleBuffer[i]+'\n');
		}
	}, 500);