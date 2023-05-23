var gameId = null;
var gameAmount = null;
var boardDim = null;
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


    $(document).on('click',"#xxx",App.CreateTable);
    
    

    $('#CreateGameBtn').prop("disabled", true);

  
    
    
  },

  initBoard: function() {
    
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
        App.CreateTable();

    
      }).catch(function(err) {
        console.log(err);
          throw new Error(err);
        })



  },



  CreateGame:  function(){

    if(!boardDim) return alert("You must choose a board dimension");

    App.contracts.Battleship.deployed().then(async function (instance) {
        battleshipInstance = instance;

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
            const PAST_EVENT_DECIDED = async () => {
              await battleshipInstance.allEvents("AmountDecided",
                (err, events) => {
                  var gameIdTemp = events.args._gameId.toNumber();
                  if(events.event =="AmountDecided" && gameIdTemp == gameId){
                  gameAmount = events.args._amount.toNumber();
                    $("#GameBoardContainer").hide();
                    alert("Game Started!");

                    $("#GameBoard").show();
                    $("#AmountValidation").hide();
                    App.CreateTable();
                  }
                });
            };
            const PAST_EVENT_COMMIT = async () => {
              await battleshipInstance.allEvents("AmountToCommit",
                (err, events) => {
                  var gameIdTemp = events.args._gameId.toNumber();
                  var fromAccount = events.args._from;
            
                  if(events.event =="AmountToSpend" && gameIdTemp == gameId && fromAccount != web3.eth.defaultAccount){
                  gameAmount = events.args._amount.toNumber();
                    alert("The new amount is "+ gameAmount);
                    $("#GameBoardContainer").hide();
                    $("#AmountValidation").show();
                    $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+ ", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
                    
                    resolve('Operation completed.');
                  }
                });
            };
            PAST_EVENT_DECIDED();
            PAST_EVENT_COMMIT();
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
            const PAST_EVENT_DECIDED = async () => {
              await battleshipInstance.allEvents("AmountDecided",
                (err, events) => {
                  var gameIdTemp = events.args._gameId.toNumber();
                  if(events.event =="AmountDecided" && gameIdTemp == gameId){
                    gameAmount = events.args._amount.toNumber();
                    $("#AmountValidation").hide();
                    alert("Game Started!");
                    $("#GameBoard").show();
                    resolve('Operation completed.');
                  }
                });
            };
            const PAST_EVENT_COMMIT = async () => {
              await battleshipInstance.allEvents("AmountToCommit",
                (err, events) => {
                  var gameIdTemp = events.args._gameId.toNumber();
                  var fromAccount = events.args._from;
                  if(events.event =="AmountToSpend" && gameIdTemp == gameId && fromAccount != web3.eth.defaultAccount){
                  gameAmount = events.args._amount.toNumber();
                  alert("The new amount is "+ gameAmount);
                    $("#GameBoardContainer").hide();
                    $("#AmountValidation").show();
                    $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+ ", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);

                    resolve('Operation completed.');
                  }
                });
            };
            PAST_EVENT_DECIDED();
            PAST_EVENT_COMMIT();
            

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
        alert("You joined the game, the amount of ETH was set to "+gameAmount);
        
        $('#GameCreationContainer').hide();
        $('#AmountValidation').show();
        $("#GameBoardTitle").text("Welcome to the game number "+gameId+", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
        
      }).catch(function(err) {
           console.log(err);

        })

  },


  CreateTable: function(){
    var table = document.getElementById("GameTable");
    var tableArr = [
  [1, 0, 1],
  [1, 0, 1],
  [0, 0, 0]
  ];

  for(let i = 0; i < tableArr.length; i++){
    table.insertRow(i);
    for (let j = 0; j < tableArr[i].length; j++) {
      const cell = tableArr[i].insertCell(j);
      cell.textContent = tableArr[i][j];
    }
  }

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

  }
};

$(function() {
  $(window).load(function() {
    App.init();
  });
});


