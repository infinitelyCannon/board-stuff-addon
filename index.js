const express = require('express');
const app = express();
const expressWs = require('express-ws')(app, undefined, {wsOptions: {clientTracking: true}});
const path = require('path');
let CLIENTS = [];

app.use((req, res, next) => {
    //console.log('middleware');
    req.testing = 'testing';
    return next();
});

app.use('/public', express.static('public'));

app.get('/', (req, res, next) => res.sendFile(path.join(__dirname + '/index.html')));

app.ws('/', (ws, req) => {
    ws.on('message', (msg) => {
        let obj;
        try{
            obj = JSON.parse(msg);
        }
        catch(e){
            obj = msg;
        }
        if(typeof obj === "object" && obj.type == "register"){
            console.log("Got Player: " + obj.name);
            if(obj.name != "UNITY_GAME"){
                addPlayer(obj.name, ws);
            }
            else
                CLIENTS.push({player: obj.name, client: ws});
        }
        else if(typeof obj === 'object' && obj.type == "broad"){
            sendAll("Hello to All!");
        }
        else if(typeof obj === 'object' && obj.type == "result"){
            if(obj.data == "ADD_PLAYER_SUCESS"){
                sendTo(obj.player, {
                    type: "result",
                    data: "ADDED_OK"
                });
            }
        }
        else if(typeof obj === 'object' && obj.type == "give"){
            sendTo(obj.name, obj);
        }
        else if(typeof obj === 'object' && obj.type == "send"){
            sendTo("UNITY_GAME", "GET_CARD:" + obj.card + ":" + obj.from);
        }
        else{
            console.log("Returning: " + obj);
            ws.send(obj);
        }
    });
});

function sendTo(person, msg){
    let data;

    if(person != "UNITY_GAME"){
        try{
            data = JSON.stringify(msg);
        }
        catch(e){
            data = msg
        }
    }
    else
        data = msg;

    for(let i = 0; i < CLIENTS.length; i++){
        if(CLIENTS[i].player == person){
            CLIENTS[i].client.send(data);
        }
    }
}

function addPlayer(person, ws){
    for(let i = 0; i < CLIENTS.length; i++){
        if(CLIENTS[i].player == "UNITY_GAME"){
            CLIENTS[i].client.send("ADD_PLAYER:" + person);
            CLIENTS.push({player: person, client: ws});
            return;
        }
    }

    ws.send(JSON.stringify({
        type: "warn",
        data: "No game is connected to the server."
    }));
}

function sendAll(message){
    for(let i = 0; i < CLIENTS.length; i++){
        CLIENTS[i].client.send(message);
    }
}

app.listen(3000, () => console.log("App listening on port 3000"));