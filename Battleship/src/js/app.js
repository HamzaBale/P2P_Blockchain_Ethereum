
var gameId = null;
var gameAmount = null;
var boardDim = null;
var shipDim = null;
App = {
  
  web3Provider: null,
  contracts: {},
  
  init: async function() {
    return await App.initWeb3();
  },

  initWeb3: async function() {//in order to interact between the interface and the contract, it checks where the web3js library is.

    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
      await window.ethereum.enable(); // Request account access
      
      } catch(error) {
      console.error("User denied account access"); // User was denied account access
      }
      }
      else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
      }
      else {
      App.web3Provider = new Web3.provider.HttpProvider("http://localhost:7545");
      }
      web3 = new Web3(App.web3Provider);
      web3.eth.defaultAccount = web3.eth.accounts[0];
      return App.initContract();
  },

  initContract: function() {
    $.getJSON("Battleship.json",  function(data) {
     BattleshipArtifact = data; // Get the contract artifact and  initialize it
    App.contracts.Battleship = TruffleContract(BattleshipArtifact);
    // Set the web3.js provider for our contract to the provider defined in the previous function
    App.contracts.Battleship.setProvider(App.web3Provider);
    // Use the contract to retrieve and mark the adopted pets
    //return App.initBoard();
    
    });

    return App.bindEvents();
    },

  bindEvents: async function() {
    
    //Game creation and joining
    $(document).on('click', '#CreateGameBtn', App.CreateGame);
    $(document).on('click', '#JoinGameIdBtn', App.JoinGameId);
    $(document).on('click', '#JoinRandGameBtn', App.JoinRandomGame);
    $(document).on('input',"#BoardDim", (event) => boardDim = event.target.value);
    //Go Back to main menu button
    $(document).on('click', '#GoBackToMainBtn', App.LeaveGame);
    //Amount of money to send in order to decide how much to bet.
    $(document).on('input', '#AmountToSend', App.UnlockButtons);
    //Accept the amount of money set
    $(document).on('click', '#AcceptAmount', App.AcceptAmount);
    //To set new amount of money
    $(document).on('click', '#NewAmountBtn', App.AmountCommit);
    $(document).on('input', '#NewAmount', () => { gameAmount = $('#NewAmount').val(); AmountCommit()});

    //Insert ship in table
    $(document).on('click',"#ShipSub",App.AddShip);
    $(document).on('click',"#ResetBoard",App.ResetBoard);
    $(document).on('click',"#SubmitBoard",App.SubmitBoard);
    //Attack Phase
    $(document).on('click',"#ShipSubAtt",App.SubmitAttack);
    
  
    $('#CreateGameBtn').prop("disabled", true);
    
  },

  UnlockButtons: function(){
    gameAmount = $('#AmountToSend').val();
    if(gameAmount){
      $('#CreateGameBtn').prop("disabled", false);

    } else {
      $('#CreateGameBtn').prop("disabled", true);
    }

  },
  AmountCommit: function(){
    console.log(gameId +"  "+ gameAmount);
    if(!gameAmount || gameId == null || gameId < 0) return alert("Game amount or game id are null!");
    return App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      console.log(gameId,parseInt(gameAmount));
       return battleshipInstance.AmountCommit(gameId,parseInt(gameAmount));
      }).then(function (reciept){
        alert("You sent the following "+ gameAmount+". You need to wait for your opponent to accept this amount!");
      }).catch(function(err) {
        console.log(err);
          throw new Error(err);
        })
  },
  AcceptAmount: function(){
    
    //GO TO BOARD
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
       return battleshipInstance.AcceptedAmount(gameId);
      }).then(function (reciept){
        console.log(reciept);
        $('#GameBoard').show();
        $('#AmountValidation').hide();
      }).catch(function(err) {
        console.log(err);
          throw new Error(err);
        })



  },



  CreateGame:  function(){

    console.log(gameAmount.toString() + "000000000000000000");
    return App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
       return battleshipInstance.receiveEther(0,{value: gameAmount.toString() + "000000000000000000"});
      }).then(function (reciept){
                  
        App.contracts.Battleship.deployed().then(function (instance) {
          battleshipInstance = instance;
           return battleshipInstance.getList();
          }).then(function (reciept){
                      console.log(reciept);          
          }).catch(function(err) {
               console.error(err);
            });
        
      }).catch(function(err) {
           console.error(err);
        });

















    if(!boardDim) return alert("You must choose a board dimension");

    App.contracts.Battleship.deployed().then(async function (instance) {
        battleshipInstance = instance;
        console.log(battleshipInstance);
         return battleshipInstance.CreateGame(boardDim);
        }).then(async function (reciept){
          var logsArray = reciept.logs;
            gameId = logsArray[0].args._value.toNumber();
            console.log(gameId);
            if(gameId < 0) console.error("Something went wrong, game id is negative!");
            else {
              try {
                await App.AmountCommit();
              } catch (error) {
                return console.log(error);
              }
              alert("Game Created");
              $('#GameCreationContainer').hide();
              $('#GameBoardContainer').show();
              $('#CreationGameTitle').text("Welcome to the waiting room, wait until someone joins! Game ID: "+gameId);
              App.PAST_EVENTS();
            }
          
          
        }).catch(function(err) {
             console.error(err);
          });

  },

  JoinGameId: function(){
    
    var inputValue = $('#GameId').val();
    if(!inputValue) alert("You must select a game ID!");
    else{
        App.contracts.Battleship.deployed().then(function (instance) {
          battleshipInstance = instance;
           return battleshipInstance.JoinGame(false,inputValue);
          }).then(function (reciept){
            console.log(reciept);
            gameId = inputValue;
            gameAmount = reciept.logs[0].args._amountTemp.toNumber();
            boardDim = reciept.logs[0].args._boardDim.toNumber();
            alert("You joined the game, the amount of ETH was set to "+gameAmount);
            
            $('#GameCreationContainer').hide();
            $('#AmountValidation').show();
            $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+" Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
 
            App.PAST_EVENTS();
       
            

          }).catch(function(err) {
               console.log(err);

            })
    }

  },
  JoinRandomGame: function(){
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
       return battleshipInstance.JoinGame(true,0);
      }).then(function (reciept){
        console.log(reciept);
        gameId = reciept.logs[0].args._gameId.toNumber();
        gameAmount = reciept.logs[0].args._amountTemp.toNumber();
        boardDim = reciept.logs[0].args._boardDim.toNumber();

        alert("You joined the game, the amount of ETH was set to "+gameAmount);
        
        $('#GameCreationContainer').hide();
        $('#AmountValidation').show();
        $("#GameBoardTitle").text("Welcome to the game number "+gameId+", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
        App.PAST_EVENTS();
        
      }).catch(function(err) {
           console.log(err);

        })

  },


  CreateTable: async function(){
    var table = document.getElementById("GameTable");
  for(let i = 0; i < boardDim; i++){
   const row = table.insertRow(i);
    for (let j = 0; j < boardDim; j++) {
      const cell = row.insertCell(j);
      cell.textContent = 0;
    }
  }

  
  },

  AddShip: function(){
    var rowId = $("#ShipRow").val();
    var colSize = $("#ShipCol").val();
    if(rowId < 0 || rowId == "") return alert("You must choose a row!");
    if(colSize < 0 || colSize == "") return alert("You must choose the dimension of the ship!");
    var table = document.getElementById("GameTable");
    for(let i = 0; i <= colSize; i++) table.rows[i].cells[rowId].textContent = 1;

  },
  ResetBoard: function(){
    var table = document.getElementById("GameTable");
    for(let i = 0; i < boardDim; i++){
       for (let j = 0; j < boardDim; j++) {
        table.rows[i].cells[j].textContent = 0;
       }
     }
  },
  SubmitBoard: async function(){
    let merkleroot = await App.CreateMerkleTree();
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      console.log(merkleroot);
       return battleshipInstance.SendMerkleRoot(merkleroot,gameId);
      }).then(function (reciept){
            alert("Merkle root sent to the contract succefully!");
            console.log(reciept);
            $("#WaitOpp").show();
            App.PAST_EVENTS();

      }).catch(function(err) {
           console.log(err);
        })
  },
  SubmitAttack:function(){  
    var rowId = $("#ShipRowAtt").val();
    var colSize = $("#ShipColAtt").val();
    if(rowId < 0 || rowId == "") return alert("You must choose a row!");
    if(colSize < 0 || colSize == "") return alert("You must choose a column!");

  },
  LeaveGame: function(event) {
    event.preventDefault();
    var val = confirm("Are you sure you want to leave the game?");
    if (val == true) {
      console.log("You pressed OK.");
      if(gameId == null) alert("Something went wrong, gameId is null!");
      else{
      App.contracts.Battleship.deployed().then(function (instance) {
        battleshipInstance = instance;
         return battleshipInstance.LeaveGame(gameId);
        }).then(function (reciept){
          console.log(reciept);
          $('#GameCreationContainer').show();
          $('#GameBoardContainer').hide();
          
        }).catch(function(err) {
             console.error(err);
          });

      }
    }

  },
 PAST_EVENTS : async function() {
    let lastBlock = null;
    await battleshipInstance.allEvents("",
      (err, events) => {
        console.log(events);
        if(events.event =="AmountDecided" && events.args._gameId.toNumber() == gameId  && events.blockNumber != lastBlock){
            
          gameAmount = events.args._amount.toNumber();
          App.contracts.Battleship.deployed().then(function (instance) {
            battleshipInstance = instance;
             return battleshipInstance.receiveEther(_gameId,{value: web3.utils.toWei(gameAmount.toString(), 'wei')});
            }).then(function (reciept){
                        
          $("#GameBoardContainer").hide();
          alert("Game Started!");
          console.log(events);
          console.log("Game Started 1");
          $("#GameBoard").show();
          $("#AmountValidation").hide();
         console.log("BOARD SIZE: "+boardDim);
          App.CreateTable();
              
            }).catch(function(err) {
                 console.error(err);
              });
         lastBlock = events.blockNumber;

        }else if(events.event =="AmountToSpend" && events.args._gameId.toNumber()  == gameId && events.args._from != web3.eth.defaultAccount){
        gameAmount = events.args._amount.toNumber();
          alert("The new amount is "+ gameAmount);
          $("#GameBoardContainer").hide();
          $("#AmountValidation").show();
          $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+ ", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
        } else if(events.event =="GameStarted" && (events.args._first == web3.eth.defaultAccount || events.args._second == web3.eth.defaultAccount)  && events.blockNumber != lastBlock){
          console.log("CI SONO");
          $("#WaitOpp").hide();
          $("#shipAttackDiv").show();
          $("#ShipDiv").hide();
          $("#ResetBoard").hide();
          $("#SubmitBoard").hide();
         lastBlock = events.blockNumber;
        } else if(events.event =="AmountToSpend" && events.args._gameId.toNumber()== gameId && events.args._from != web3.eth.defaultAccount){
        gameAmount = events.args._amount.toNumber();
        alert("The new amount is "+ gameAmount);
          $("#GameBoardContainer").hide();
          $("#AmountValidation").show();
          $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+ ", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
          resolve('Operation completed.');
        }
      });
  },

  CreateMerkleTree:  async function(){ //Creates merkle tree and returns the root
    var table = document.getElementById("GameTable");
    var boardArray = [];

    for(let i = 0; i < boardDim; i++){
      for (let j = 0; j < boardDim; j++) {
        boardArray.push((table.rows[i].cells[j].textContent));
      }
    }
    let tempBoard = [];
    for(let i = 0 ; i < boardArray.length; i++){
      tempBoard.push(await App.sha256(boardArray[i]));
    } 

    let tempArray = [];
    let stop =false
    while(!stop){
    tempArray = [];
    for(let i = 0; i < tempBoard.length; i = i + 2){
      if(i + 1 < tempBoard.length){
        tempArray.push(await App.sha256(tempBoard[i] + tempBoard[i+1]));
      }
    }
    console.log(tempArray);
    tempBoard = tempArray;
    if(tempArray.length == 1 || tempArray.length == 0) stop = true;
  }
    return tempArray[0]; //root
  },
  sha256:async function(message){
    const msgBuffer = new TextEncoder('utf-8').encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
   // convert bytes to hex string
    const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('');
    return hashHex;
  }

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});


