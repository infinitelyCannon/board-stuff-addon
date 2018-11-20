import React from 'react';
import _ from 'lodash';

const cardTemp = [
    {type: "cardSPADESACE"},
    {type: "cardSPADESACE"},
    {type: "cardSPADESACE"},
    {type: "cardSPADESACE"},
    {type: "cardSPADESACE"}
];

function Header(props){
    return (
        <nav>
            <div className="nav-wrapper">
                <a style={{fontSize: '1.7rem'}} className="brand-logo">{props.name == "" ? "Board Game" : props.name}</a>
            </div>
        </nav>
    );
}

class App extends React.Component{
    constructor(props){
        super(props);
        this.state = {
            connected: false,
            player: "",
            playerInput: "",
            socket: null,
            cards: [],
            selected: -1
        };

        this.handlePlayer = this.handlePlayer.bind(this);
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleMessage = this.handleMessage.bind(this);
        this.selectCard = this.selectCard.bind(this);
        this.sendCard = this.sendCard.bind(this);
    }

    componentDidMount(){
        var app = this;

        this.setState({
            socket: Object.assign(new WebSocket("wss://" + window.location.hostname + ":" + window.location.port), {
                onopen: function(){
                    console.log("React Connected");
                },
                onmessage: function(event){
                    app.handleMessage(event.data);
                },
                onclose: function(){
                    console.log("Connection Closed");
                }
            })
        });
    }

    handlePlayer(event){
        this.setState({playerInput: event.target.value});
    }

    handleMessage(msg){
        var obj;
        try{
            obj = JSON.parse(msg);
        }
        catch(e){
            obj = msg;
        }        
        if(typeof obj === 'object'){
            switch(obj.type){
                case "error":
                    console.error(obj.data);
                    break;
                case "warn":
                    alert("Warning\n" + obj.data);
                    break;
                case "result":
                    if(obj.data == "ADDED_OK"){
                        console.log("Connected to Game!");
                        this.setState({connected: true});
                    }
                    break;
                case "give":
                    this.setState({cards: _.concat(this.state.cards, {type: obj.card})});
                    break;
                default:
                    break;
            }
        }
        else{
            console.log("Incomming: " + obj);
        }
    }

    selectCard(index){
        console.log("Picked card at: " + index);
        this.setState({selected: index});
    }

    sendCard(){
        var indx = this.state.selected;

        if(this.state.selected == -1){
            alert("Note: No card selected.");
            return;
        }
            
        if(this.state.cards.length == 0){
            alert("Note: You have no cards.");
            return;
        }

        this.state.socket.send(JSON.stringify({type: "send", from: this.state.player, card: this.state.cards[this.state.selected].type}));
        this.setState({selected: -1, cards: _.filter(this.state.cards, (n, i) => {return i != indx})});
    }

    handleSubmit(event){
        event.preventDefault();
        if(this.state.playerInput == "UNITY_GAME"){
            alert("This name is not allowed");
            this.setState({playerInput: ""});
            return;
        }
       // console.log("Got: " + this.state.playerInput);
       this.setState({player: this.state.playerInput});
       this.state.socket.send(JSON.stringify({
           type: "register",
           name: this.state.playerInput
       }));
       this.setState({playerInput: ""});
    }

    render(){
        return (
            <div>
                <Header name={this.state.player} />
                <div style={{marginTop: '10px'}}>
                    {!this.state.connected && (
                        <div id="emptyHand">
                            <div id="blankCard"></div>
                            <div style={{flexBasis: "100%", display: 'flex', justifyContent: 'center'}}>
                                <h5 id="cardInfo">You have no cards.</h5>
                            </div>
                            <form onSubmit={this.handleSubmit} style={{flexBasis: "100%"}}>
                                <div className="input-field">
                                    <input onChange={this.handlePlayer} value={this.state.playerInput} type="text" id="playerName" />
                                    <label htmlFor="playerName">Enter Name</label>
                                </div>
                                <div className="input-field">
                                    <button id="subBtn" type="submit" className="btn waves-effect waves-light">
                                        Submit
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                    {
                        this.state.connected && (
                            <div id="hand">
                                {
                                    _.map(this.state.cards, (card, idx) => (
                                        <div key={idx.toString()} className={"game-card" + (this.state.selected == idx ? " active" : "")}>
                                            <img onClick={(e) => this.selectCard(idx, e)} src={"public/img/" + card.type + ".png"} />
                                        </div>
                                    ))
                                }
                            </div>
                        )
                    }
                    <a onClick={() => this.sendCard()} className="waves-effect btn-large waves-light">
                        Send Card
                    </a>
                </div>
            </div>
        );
    }
};

export default App;