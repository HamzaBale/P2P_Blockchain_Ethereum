
var gameId = null;
var gameAmount = null;
var boardDim = null;
var board = null;
var merkleProofMatrix = [];
var numberOfShips = null;
var initialNumberOfShips = null;
var attackedRow = null;
var attackedCol = null;
App = {

  web3Provider: null,
  contracts: {},


  init: async function () {
    return await App.initWeb3();
  },

  initWeb3: async function () {//in order to interact between the interface and the contract, it checks where the web3js library is.

    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable(); // Request account access

      } catch (error) {
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

  initContract: function () {
    $.getJSON("Battleship.json", function (data) {
      BattleshipArtifact = data; // Get the contract artifact and  initialize it
      App.contracts.Battleship = TruffleContract(BattleshipArtifact);
      // Set the web3.js provider for our contract to the provider defined in the previous function
      App.contracts.Battleship.setProvider(App.web3Provider);
      // Use the contract to retrieve and mark the adopted pets
      //return App.initBoard();

    });

    return App.bindEvents();
  },

  bindEvents: async function () {

    //Game creation and joining
    $(document).on('click', '#CreateGameBtn', App.CreateGame);
    $(document).on('click', '#JoinGameIdBtn', App.JoinGameId);
    $(document).on('click', '#JoinRandGameBtn', App.JoinRandomGame);
    $(document).on('input', "#BoardDim", (event) => boardDim = event.target.value);
    $(document).on('input', "#NumShips", (event) => {numberOfShips = event.target.value;initialNumberOfShips = numberOfShips;});

    //Go Back to main menu button
    $(document).on('click', '#GoBackToMainBtn', App.LeaveGame);
    //Amount of money to send in order to decide how much to bet.
    $(document).on('input', '#AmountToSend', App.UnlockButtons);
    //Accept the amount of money set
    $(document).on('click', '#AcceptAmount', App.AcceptAmount);
    //To set new amount of money
    $(document).on('click', '#NewAmountBtn', App.AmountCommit);
    $(document).on('input', '#NewAmount', () => { gameAmount = $('#NewAmount').val(); });

    //Insert ship in table
    $(document).on('click', "#ShipSub", App.AddShip);
    $(document).on('click', "#ResetBoard", App.ResetBoard);
    $(document).on('click', "#SubmitBoard", App.SubmitBoard);
    //Attack Phase
    $(document).on('click', "#ShipSubAtt", App.SubmitAttack);
    //Notify opponent
    $(document).on('click', "#NotifyOpp", App.NotifyOpponent);
    $('#CreateGameBtn').prop("disabled", true);

 

  },

  UnlockButtons: function () {
    gameAmount = $('#AmountToSend').val();
    if (gameAmount) {
      $('#CreateGameBtn').prop("disabled", false);

    } else {
      $('#CreateGameBtn').prop("disabled", true);
    }

  },
  AmountCommit: function () {
    if (!gameAmount || gameId == null || gameId < 0) return alert("Game amount or game id are null!");
    return App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.AmountCommit(gameId, window.web3Utils.toWei(gameAmount.toString()));
    }).then(function (reciept) {
      alert("You sent the following: " + (gameAmount) + " eth. You need to wait for your opponent to accept this amount!");
      $('#NewAmountBtn').prop("disabled", true);
      $('#AcceptAmount').prop("disabled", true);


    }).catch(function (err) {
      console.error(err);
      throw new Error(err);
    })
  },
  AcceptAmount: function () {

    //GO TO BOARD
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.AcceptedAmount(gameId);
    }).then(function (reciept) {
      $('#GameBoard').show();
      $('#AmountValidation').hide();
    }).catch(function (err) {
      console.error(err);
      throw new Error(err);
    })



  },



  CreateGame: function () {

    if (!boardDim) return alert("You must choose a board dimension");
    if (boardDim % 2 != 0) return alert("You must choose a board dimension that is multiple of 2!");



    if (!numberOfShips) return alert("You must choose number of ships");


    App.contracts.Battleship.deployed().then(async function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.CreateGame(boardDim, numberOfShips);
    }).then(async function (reciept) {
      var logsArray = reciept.logs;
      gameId = logsArray[0].args._value.toNumber();
      if (gameId < 0) console.error("Something went wrong, game id is negative!");
      else {
        try {
          await App.AmountCommit();
        } catch (error) {
          return console.error(error);
        }
        alert("Game Created");
        $('#GameCreationContainer').hide();
        $('#GameBoardContainer').show();
        $('#CreationGameTitle').text("Welcome to the waiting room, wait until someone joins! Game ID: " + gameId);
        App.PAST_EVENTS();
      }


    }).catch(function (err) {
      console.error(err);
    });

  },

  JoinGameId: function () {

    var inputValue = $('#GameId').val();
    if (!inputValue) alert("You must select a game ID!");
    else {
      App.contracts.Battleship.deployed().then(function (instance) {
        battleshipInstance = instance;
        return battleshipInstance.JoinGame(false, inputValue);
      }).then(function (reciept) {
        gameId = inputValue;
        gameAmount = reciept.logs[0].args._amountTemp.toNumber();
        boardDim = reciept.logs[0].args._boardDim.toNumber();
        numberOfShips = reciept.logs[0].args._numberOfShips.toNumber();
        initialNumberOfShips = numberOfShips;
        alert("You joined the game, the amount of ETH was set to " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");

        $('#GameCreationContainer').hide();
        $('#AmountValidation').show();
        $("#GameBoardTitle").text("Welcome to the game with ID " + gameId + " Choose an amount or accept the one that your oppenent advised. The current amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");

        App.PAST_EVENTS();



      }).catch(function (err) {
        console.error(err);

      })
    }

  },
  JoinRandomGame: function () {
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.JoinGame(true, 0);
    }).then(function (reciept) {
      gameId = reciept.logs[0].args._gameId.toNumber();
      gameAmount = reciept.logs[0].args._amountTemp.toNumber();
      boardDim = reciept.logs[0].args._boardDim.toNumber();
      numberOfShips = reciept.logs[0].args._numberOfShips.toNumber();
      initialNumberOfShips = numberOfShips;
      alert("You joined the game, the amount of ETH was set to " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");

      $('#GameCreationContainer').hide();
      $('#AmountValidation').show();
      $("#GameBoardTitle").text("Welcome to the game number " + gameId + ", Choose an amount or accept the one that your oppenent advised. The current amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");
      App.PAST_EVENTS();

    }).catch(function (err) {
      console.error(err);

    })

  },


  CreateTable: async function () {
    var table = document.getElementById("GameTable");
    var enemyTable = document.getElementById("EnemyTable");
    for (let i = 0; i < boardDim; i++) {
      const row = table.insertRow(i);
      const enemyrow = enemyTable.insertRow(i);
      for (let j = 0; j < boardDim; j++) {
        const cell = row.insertCell(j);
        const enemycell = enemyrow.insertCell(j);
        cell.textContent = 0;
      }
    }
    $(document).ready(function () {
      $('#GameTable td').click(function () {
        var cellIndex = $(this).index();
        var rowIndex = $(this).parent().index();
        console.log(cellIndex);
        $("#ShipRow").val(rowIndex)
        $("#ShipCol").val(cellIndex)
      });
    });
    $(document).ready(function () {
      $('#EnemyTable td').click(function () {
        var cellIndex = $(this).index();
        var rowIndex = $(this).parent().index();
        console.log(cellIndex);
        $("#ShipRowAtt").val(rowIndex)
        $("#ShipColAtt").val(cellIndex)
      });
    });


  },

  AddShip: function () {
    var row = $("#ShipRow").val();
    var colSize = ($("#ShipCol").val());
    if (row < 0 || row == "") return alert("You must choose a row to start with!");
    if (colSize < 0 || colSize == "") return alert("You must choose a column!");
    if (numberOfShips == 0) return alert("Too many ships! Remaining: " + numberOfShips);
    var table = document.getElementById("GameTable");

    if (table.rows[row].cells[colSize].textContent == 1) return alert("you've already put a ship in that position!");
    table.rows[row].cells[colSize].textContent = 1;
    numberOfShips = numberOfShips - 1;
    $("#shipsToPlace").text("The number of ships to place is " + numberOfShips);
  },
  ResetBoard: function () {
    var table = document.getElementById("GameTable");
    for (let i = 0; i < boardDim; i++) {
      for (let j = 0; j < boardDim; j++) {
        table.rows[i].cells[j].textContent = 0;
      }
    }
    numberOfShips = initialNumberOfShips;
    $("#shipsToPlace").text("The number of ships to place is " + numberOfShips);

  },
  SubmitBoard: async function () {
    let merkleroot = await App.CreateMerkleTree();
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.SendMerkleRoot(merkleroot, gameId);
    }).then(function (reciept) {
      alert("Merkle root sent to the contract succefully!");
      $("#WaitOpp").show();
      $("#ShipDiv").hide();
      $("#ResetBoard").hide();
      $("#SubmitBoard").hide();
      board = document.getElementById("GameTable");
      enemyTable = document.getElementById("EnemyTable");
      App.PAST_EVENTS();

    }).catch(function (err) {
      console.error(err);
    })
  },
  SubmitAttack: function () {
    var row = $("#ShipRowAtt").val();
    var col = $("#ShipColAtt").val();
    if (row < 0 || row == "") return alert("You must choose a row!");
    if (col < 0 || col == "") return alert("You must choose a column!");
    if (col > (boardDim - 1) || row > (boardDim - 1)) return alert("column or row out of bounds!");
    if (enemyTable.rows[row].cells[col].style.backgroundColor == "white") return alert("You've already attacked this cell!");


    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.AttackOpponent(gameId, (row),(col));
    }).then(function (reciept) {
      attackedCol = col;
      attackedRow = row;
      alert("attack sent, wait for your turn!");
      $('#ShipSubAtt').prop("disabled", true);
      $('#NotifyOpp').prop("disabled", false);



    }).catch(function (err) {
      console.error(err);
    });

  },
  LeaveGame: function (event) {
    event.preventDefault();
    var val = confirm("Are you sure you want to leave the game?");
    if (val == true) {
      if (gameId == null) alert("Something went wrong, gameId is null!");
      else {
        App.contracts.Battleship.deployed().then(function (instance) {
          battleshipInstance = instance;
          return battleshipInstance.LeaveGame(gameId);
        }).then(function (reciept) {

          $('#GameCreationContainer').show();
          $('#GameBoardContainer').hide();

        }).catch(function (err) {
          console.error(err);
        });

      }
    }
  },
  PAST_EVENTS: async function () {
    let lastBlock = null;
    let lastDate = Date.now();
    await battleshipInstance.allEvents(
      (err, events) => {

        if (events.event == "AmountDecided" && events.args._gameId.toNumber() == gameId && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;
          gameAmount = events.args._amount.toNumber();
          App.contracts.Battleship.deployed().then(function (instance) {
            battleshipInstance = instance;
            return battleshipInstance.SendEther(events.args._gameId.toNumber(), { value: (gameAmount) });
          }).then(function (reciept) {
            $("#GameBoardContainer").hide();

            $("#GameBoard").show();
            $("#shipsToPlace").text("The number of ships to place is " + numberOfShips);

            $("#AmountValidation").hide();

            App.CreateTable();

          }).catch(function (err) {
            console.error(err);
          });

        } else if (events.event == "AmountToSpend" && events.args._gameId.toNumber() == gameId && events.args._from != web3.eth.defaultAccount) {
          lastBlock = events.blockNumber;
          gameAmount = events.args._amount.toNumber();
          alert("The new amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");
          $("#GameBoardContainer").hide();
          $("#AmountValidation").show();
          $("#GameBoardTitle").text("Welcome to the game with ID " + gameId + ", Choose an amount or accept the one that your oppenent advised. The current amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");
          $('#NewAmountBtn').prop("disabled", false);
          $('#AcceptAmount').prop("disabled", false);
        } else if (events.event == "GameStarted" && (events.args._first == web3.eth.defaultAccount || events.args._second == web3.eth.defaultAccount) && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;

          if (events.args._first == web3.eth.defaultAccount) {
            $('#NotifyOpp').prop("disabled", true);
            $('#ShipSubAtt').prop("disabled", false);
          }


          $("#WaitOpp").hide();
          $("#shipAttackDiv").show();
          $("#EnemyTableDiv").show();
          $("#ShipDiv").hide();
          $("#ResetBoard").hide();
          $("#SubmitBoard").hide();

        } else if (events.event == "AmountToSpend" && events.args._gameId.toNumber() == gameId && events.args._from != web3.eth.defaultAccount && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;
          gameAmount = events.args._amount.toNumber();
          alert("The new amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");
          $("#GameBoardContainer").hide();
          $("#AmountValidation").show();
          $("#GameBoardTitle").text("Welcome to the game with ID " + gameId + ", Choose an amount or accept the one that your oppenent advised. The current amount is " + window.web3Utils.fromWei(gameAmount.toString()) + " eth");
        } else if (events.event == "GameEnd" && events.args._gameId.toNumber() == gameId) {
          alert("The game ended, reason: " + events.args._cause + " The winner is " + events.args._winner);
          App.resetGame();

        }
        else if (events.event == "AttackRes" && events.args._gameId.toNumber() == gameId && events.args._attacker == web3.eth.defaultAccount && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;
          if (events.args._result == "1") {
            enemyTable.rows[attackedRow].cells[attackedCol].style.backgroundColor = "green";
          } else enemyTable.rows[attackedRow].cells[attackedCol].style.backgroundColor = "red";
        }
        else if (events.event == "AttackOpp" && events.args._gameId.toNumber() == gameId && events.args._opponent == web3.eth.defaultAccount && events.blockNumber != lastBlock) {

          lastBlock = events.blockNumber;

          var row = events.args._row.toNumber();
          var col = events.args._col.toNumber();

          var merkleProof = App.merkleProof(row, col);
          let flatIndex = row * boardDim + col;
          if (board.rows[row].cells[col].textContent == "1") {
            App.merkleProofAttack("1", merkleProofMatrix[0][flatIndex].toString(), merkleProof);
            board.rows[row].cells[col].textContent = "hit";
          } else {
            App.merkleProofAttack("0", merkleProofMatrix[0][flatIndex].toString(), merkleProof);
          }
          $('#ShipSubAtt').prop("disabled", false);
          $('#NotifyOpp').prop("disabled", true);


        }
        else if (events.event == "AccusationTriggered" && events.args._gameId.toNumber() == gameId && events.args._accused == web3.eth.defaultAccount && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;
          alert("The opponent triggered a notification! If you don't play you will automatically lose the game!");
        } else if (events.event == "AccusationTriggered" && events.args._gameId.toNumber() == gameId && events.args._accuser == web3.eth.defaultAccount && events.blockNumber != lastBlock) {
          lastBlock = events.blockNumber;
          $('#NotifyOpp').prop("disabled", false);
        }

      });
  },
  getRandomInt: function (max) {
    return Math.floor(Math.random() * max);
  },
  CreateMerkleTree: async function () { //Creates merkle tree and returns the root
    var table = document.getElementById("GameTable");
    var boardArray = [];

    for (let i = 0; i < boardDim; i++) {
      for (let j = 0; j < boardDim; j++) {
        boardArray.push((table.rows[i].cells[j].textContent));
      }
    }
    let tempBoard = [];
    for (let i = 0; i < boardArray.length; i++) {
      tempBoard.push(window.web3Utils.keccak256(boardArray[i] + App.getRandomInt(10)));

    }


    merkleProofMatrix.push(tempBoard);

    let tempArray = [];
    let stop = false
    while (!stop) {
      tempArray = [];
      for (let i = 0; i < tempBoard.length; i = i + 2) {
        if (i + 1 < tempBoard.length) {
          tempArray.push(window.web3Utils.keccak256(App.xor(tempBoard[i], tempBoard[i + 1])));
        }
      }

      tempBoard = tempArray;
      merkleProofMatrix.push(tempBoard);
      if (tempArray.length == 1 || tempArray.length == 0) stop = true;
    }
    return tempArray[0]; //root
  },
  merkleProof: function (row, col) {
    var merkleProof = [];
    let flatIndex = row * boardDim + col;
    merkleProofMatrix.forEach(arr => {
      if (arr.length > 1) {

        if (flatIndex % 2 == 0) {
          merkleProof.push((arr[flatIndex + 1]).toString());
          flatIndex = flatIndex / 2;
        } else {
          merkleProof.push((arr[flatIndex - 1]).toString());
          flatIndex = (flatIndex - 1) / 2;
        }
      }

    });


    return merkleProof;

  },
  merkleProofAttack: function (attackRes, hash, merkleProof) {
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.MerkleProofAttack(gameId, attackRes.toString(), hash, merkleProof);
    }).then(function (reciept) {
    }).catch(function (err) {
      console.error(err);
    });
  },
  resetGame: function () {
    location.reload();
  },
  NotifyOpponent: function () {
    App.contracts.Battleship.deployed().then(function (instance) {
      battleshipInstance = instance;
      return battleshipInstance.triggerAccusation(gameId);
    }).then(function (reciept) {
      $('#NotifyOpp').prop("disabled", true);
    }).catch(function (err) {
      console.error(err);
    });
  },

  xor: function (a, b) {
    var BN = window.web3Utils.BN;
    let c = new BN(a.slice(2), 16).xor(new BN(b.slice(2), 16)).toString(16);
    result = "0x" + c.padStart(64, "0");
    return result;
  },




};

$(function () {
  $(window).load(function () {
    App.init();
  });
});


