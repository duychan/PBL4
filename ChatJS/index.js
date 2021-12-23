const express = require('express');
const app = express();
const http = require("http").createServer(app);
const { Server } = require('socket.io')
const io = new Server(http);
const port = 3000;
const fs = require('fs')

let connections = []
let gameWords = {}
let gameCode = 0
let wordList = []
let host = false

fs.readFile('trimmed_word_list.json', (err, data) => {
    if (err) {
        throw err;
    } else {
        wordList = JSON.parse(data)
        wordList = wordList['words']
    }
})

io.sockets.on('connection', (socket) => {
    connections.push(socket);
    console.log(`Connected: ${connections.length} sockets connected`);

    socket.emit('query_ingame');
    socket.on('answer_ingame', (inGame) => {
        if (inGame === true) {
            socket.emit('quit_game');
        }
    });

    socket.on('disconnect', () => {
        let gameCode = socket.gameCode;

        connections.splice(connections.indexOf(socket), 1);

        if (socket.role === 'drawer') {
            let allClients = getClientsFromGame(gameCode);
            if (allClients.length > 0) {
                let s = allClients[[getRandomNumberInRange(0, allClients.length)]];

                s.role = 'drawer';
                s.emit('player_role', s.role);
                s.emit('game_word', getCurrentWord(gameCode));
            }
        }

        // broadcast that this socket has left the game
        socket.broadcast.to(socket.gameCode).emit('player_left', socket.playerName);
        io.to(socket.gameCode).emit('active_players', getActivePlayers(socket.gameCode));

        console.log(`Game #${socket.gameCode}: Player "${socket.playerName}" has left.`);
        console.log(`Disconnected: ${connections.length} sockets connected`);
    });

    socket.on('new_game', (data) => {
        // initialize game
        gameCode = generateGameCode();
        currentWord = getGameWord(wordList)
        gameWords[gameCode] = currentWord;

        console.log(`New game started (#${gameCode}) with the word "${currentWord}".`);

        // initialize player
        socket.gameCode = gameCode;
        socket.time_stage = data.time * 1000;
        socket.playerName = data.name;
        socket.role = 'drawer';
        socket.score = 0;

        // join player to game
        socket.join(gameCode); // this needs to be before the room broadcast
        io.to(socket.gameCode).emit('active_players', getActivePlayers(gameCode));

        // tell client what to do
        socket.emit('game_word', currentWord);
        socket.emit('game_code', gameCode);
        socket.emit('player_role', socket.role);
    });

    socket.on('join_game', (gameCode, playerName) => {
        if (gameWords.hasOwnProperty(gameCode)) {
            // initialize player
            socket.gameCode = gameCode;
            socket.playerName = playerName;
            socket.role = 'guesser';
            socket.score = 0;

            // join player to game
            socket.join(gameCode); // this needs to be before the room broadcast
            io.to(socket.gameCode).emit('active_players', getActivePlayers(gameCode));
            console.log(`Game #${gameCode}: Player "${playerName}" has joined.`);

            // tell client what to do
            socket.emit('player_role', socket.role);
            socket.emit('game_found');
            socket.emit('game_code', gameCode);

            // broadcast that this socket has joined the game
            socket.broadcast.to(socket.gameCode).emit('player_joined', socket.playerName);
        } else {
            socket.emit('game_not_found');
        }
    });

    socket.on('mouse_down', function(data) {
        socket.to(socket.gameCode).emit('mouse_down', data);
        // socket.to(room_id).emit('mouse_down',data);
    })
    socket.on('mouse_move', function(data) {
        socket.to(socket.gameCode).emit('mouse_move', data);
    })
    socket.on('mouse_up', function() {
        socket.to(socket.gameCode).emit('mouse_up');
    })
    socket.on('undo', function() {
        socket.to(socket.gameCode).emit('undo');
    })
    socket.on('redo', function() {
        socket.to(socket.gameCode).emit('redo');
    })
    socket.on('lineTemp', function() {
        socket.to(socket.gameCode).emit('lineTemp');
    })
    socket.on('drawLine', function(data) {
        socket.to(socket.gameCode).emit('drawLine', data);
    })
    socket.on('drawRect', function(data) {
            socket.to(socket.gameCode).emit('drawRect', data);
        })
        // socket.on('draw_event', (line_data) => {
        // 	// block guessers from sending drawings to the other players
        // 	if (socket.role === 'drawer') {
        // 		socket.broadcast.to(socket.gameCode).emit('draw_data', line_data);
        // 	}
        // });

    socket.on('make_guess', (guess) => {
        if (guess === '') {
            return;
        } else if (guess.toLowerCase() === getCurrentWord(socket.gameCode).toLowerCase()) {
            socket.time_stage /= 2;
            io.to(socket.gameCode).emit('winner', socket.playerName, getCurrentWord(socket.gameCode));
            console.log(` Game #${socket.gameCode}: ${socket.playerName} won! (word was "${getCurrentWord(socket.gameCode)}")`);
            if (!host) {
                setTimeout(startNewGame, 10000, socket);
            }
            host = true;
        } else {
            io.to(socket.gameCode).emit('display_guess', socket.playerName, guess);
        }
    });

    socket.on('request_new_word', () => {
        if (socket.role === 'drawer') { // prevent non-drawers from changing the word
            currentWord = getGameWord(wordList)
            gameWords[socket.gameCode] = currentWord;
            socket.emit('game_word', currentWord);
            io.to(socket.gameCode).emit('clear_draw_screen');
        }
    });

    socket.on('clear_draw_screen', () => {
        if (socket.role === 'drawer') {
            io.to(socket.gameCode).emit('clear_draw_screen');
            // drawer (and only the drawer) can request all screens to be cleared
        }
    })
})



app.use(express.static(__dirname + '/public'));

function gameLoop(loop, game_code) {
    let sockets = getClientsFromGame(game_code)
    for (let i = 0; i < loop; i++) {
        sockets.forEach(element => {
            startNewGame(element);
        })
    }
}

function generateGameCode() {
    return String(getRandomNumberInRange(100000, 999999));
}

function getGameWord(words) {
    return words[getRandomNumberInRange(0, words.length - 1)];
}

function getRandomNumberInRange(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
}

function getActivePlayers(gameCode) {
    let sockets = getClientsFromGame(gameCode);

    let players = [];

    sockets.forEach((socket) => {
        players.push({
            'name': socket.playerName,
            'role': socket.role
        });
    });

    return players;
}

function getClientsFromGame(gameCode) {
    return connections.filter((socket) => {
        return socket.gameCode === gameCode;
    });
}

function getCurrentWord(gameCode) {
    return gameWords[gameCode];
}

function startNewGame(socket) {
    host = false;
    gameWords[socket.gameCode] = getGameWord(wordList);
    getClientsFromGame(socket.gameCode).forEach((s) => {
        s.role = 'guesser';
    })
    io.to(socket.gameCode).emit('player_role', 'guesser'); // set all players to guessers and then immediately set the previous winner to a drawer
    socket.role = 'drawer';
    socket.emit('player_role', socket.role);
    socket.emit('game_word', getCurrentWord(socket.gameCode));
    io.to(socket.gameCode).emit('start_new_game');
    io.to(socket.gameCode).emit('active_players', getActivePlayers(socket.gameCode));
}
http.listen(port, function() {
    console.log("Running")
})