
var gameId = null;
var gameAmount = null;
var boardDim = null;
var board = null;
var merkleProofMatrix = [];
var numberOfShips = null;
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
            numberOfShips = reciept.logs[0].args._numberOfShips.toNumber();

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
        numberOfShips = reciept.logs[0].args._numberOfShips.toNumber();

        
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
    if((colSize + 1) > numberOfShips)  return alert("Too many ships! Remaining: "+numberOfShips);
    var table = document.getElementById("GameTable");
    for(let i = 0; i <= colSize; i++) table.rows[i].cells[rowId].textContent = 1;
    numberOfShips = numberOfShips - (colSize + 1);
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
            $("#ShipDiv").hide();
            $("#ResetBoard").hide();
            $("#SubmitBoard").hide();
            board = document.getElementById("GameTable");
            App.PAST_EVENTS();

      }).catch(function(err) {
           console.log(err);
        })
  },
  SubmitAttack:function(){  
    var row = $("#ShipRowAtt").val();
    var col = $("#ShipColAtt").val();
    if(row < 0 || row == "") return alert("You must choose a row!");
    if(col < 0 || col == "") return alert("You must choose a column!");

    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
       return battleshipInstance.AttackOpponent(gameId,row,col);
      }).then(function (reciept){
        alert("attack sent, wait for your turn!");
        $('#ShipSubAtt').prop("disabled", true);

        
      }).catch(function(err) {
           console.error(err);
        });

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
             return battleshipInstance.SendEther( events.args._gameId.toNumber(),{value: web3.utils.toWei(gameAmount.toString())});
            }).then(function (reciept){
          $("#GameBoardContainer").hide();
          alert("Game Started!");
          console.log(events);
          console.log("Game Started 1");
          $("#GameBoard").show();
          $("#shipsToPlace").text("The number of ships to place is "+numberOfShips);

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
          
          if(events.args._first == web3.eth.defaultAccount) $('#ShipSubAtt').prop("disabled", false);
          

          $("#WaitOpp").hide();
          $("#shipAttackDiv").show();
          $("#ShipDiv").hide();
          $("#ResetBoard").hide();
          $("#SubmitBoard").hide();
         lastBlock = events.blockNumber;
        } else if(events.event =="AmountToSpend" && events.args._gameId.toNumber()== gameId && events.args._from != web3.eth.defaultAccount && events.blockNumber != lastBlock){
        gameAmount = events.args._amount.toNumber();
        alert("The new amount is "+ gameAmount);
          $("#GameBoardContainer").hide();
          $("#AmountValidation").show();
          $("#GameBoardTitle").text("Welcome to the game with ID "+gameId+ ", Choose an amount or accept the one that your oppenent advised. The current amount is "+gameAmount);
          lastBlock = events.blockNumber;
        } else if(events.event =="AttackOpp" && events.args._gameId.toNumber() == gameId && events.args._opponent == web3.eth.defaultAccount && events.blockNumber != lastBlock){
          var row = events.args._row.toNumber();
          var col = events.args._col.toNumber();

          console.log("attack Row: "+events.args._row.toNumber());
          console.log("attack Col: "+events.args._col.toNumber());
          
          var merkleProof = App.merkleProof(row,col);

          if(board.rows[row].cells[col].textContent == "1"){
            console.log("ship"); 
            //App.merkleProofAttack(1,merkleProof);
            board.rows[row].cells[col].textContent == "hit";
          } else {console.log("fail");
            //App.merkleProofAttack(0,merkleProof);        
        }
          App.CheckIfLost();  
        $('#ShipSubAtt').prop("disabled", false);

    
          lastBlock = events.blockNumber;
        }
      });
  },

  CreateMerkleTree:  async function(){ //Creates merkle tree and returns the root
    var table = document.getElementById("GameTable");
    var boardArray =[];

    for(let i = 0; i < boardDim; i++){
      for (let j = 0; j < boardDim; j++) {
        boardArray.push((table.rows[i].cells[j].textContent));
      }
    }
    let tempBoard = [];
    for(let i = 0 ; i < boardArray.length; i++){
      tempBoard.push(Web3.utils.keccak256(boardArray[i]));

    } 
    console.log(tempBoard);

    merkleProofMatrix.push(tempBoard);

    let tempArray = [];
    let stop =false
    while(!stop){
    tempArray = [];
    for(let i = 0; i < tempBoard.length; i = i + 2){
      if(i + 1 < tempBoard.length){
        tempArray.push(Web3.utils.keccak256(App.encodePacked(tempBoard[i],tempBoard[i+1])));
      }
    }
    console.log(tempArray);
    tempBoard = tempArray;
    merkleProofMatrix.push(tempBoard);
    if(tempArray.length == 1 || tempArray.length == 0) stop = true;
  }
    return tempArray[0]; //root
  },
  merkleProof: function(row,col){
    var merkleProof = [];
    let flatIndex = row * boardDim + col;
    merkleProofMatrix.forEach(arr => {
      if(arr.length > 1){
        if(flatIndex%2 == 0){
          merkleProof.push((arr[flatIndex+1]));
          flatIndex = flatIndex/2;
        } else {
          merkleProof.push((arr[flatIndex]));
          flatIndex = (flatIndex+1)/2;
        }
      }
 
    });
    console.log(merkleProof);
    
    return merkleProof;
            
  },
  merkleProofAttack: function(attackRes,merkleProof){
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
       return battleshipInstance.MerkleProofAttack(gameId,attackRes.toString(),merkleProof);
      }).then(function (reciept){
        console.log(reciept);  
      }).catch(function(err) {
           console.error(err);
        });
  },
  encodePacked: function(str1,str2){
    // Remove "0x" from str2
    const modifiedStr2 = str2.replace("0x", "");
    
    // Concatenate the modified strings
    const concatenated = str1 + modifiedStr2;
    
    return concatenated;
    
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


