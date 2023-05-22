App = {
  web3Provider: null,
  contracts: {},
  
  init: async function() {
    // Load pets.
    $.getJSON('../pets.json', function(data) {
      var petsRow = $('#petsRow');
      var petTemplate = $('#petTemplate');

      for (i = 0; i < data.length; i ++) {
        petTemplate.find('.panel-title').text(data[i].name);
        petTemplate.find('img').attr('src', data[i].picture);
        petTemplate.find('.pet-breed').text(data[i].breed);
        petTemplate.find('.pet-age').text(data[i].age);
        petTemplate.find('.pet-location').text(data[i].location);
        petTemplate.find('.btn-adopt').attr('data-id', data[i].id);

        petsRow.append(petTemplate.html());
      }
    });

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
      console.log(web3.eth.accounts);
      web3.eth.defaultAccount = web3.eth.accounts[0];
      return App.initContract();
  },

  initContract: function() {
    $.getJSON("Battleship.json", function(data) {
    var BattleshipArtifact = data; // Get the contract artifact and  initialize it
    App.contracts.Battleship = TruffleContract(BattleshipArtifact);
    // Set the web3.js provider for our contract to the provider defined in the previous function
    App.contracts.Battleship.setProvider(App.web3Provider);
    // Use the contract to retrieve and mark the adopted pets
    //return App.initBoard();
    });
    return App.bindEvents();
    },

  bindEvents: function() {
    $(document).on('click', '.btn-adopt', App.handleAdopt);
    $(document).on('click', '#CreateGameBtn', App.CreateGame);
    $(document).on('click', '#JoinGameIdBtn', App.JoinGameId);
    
  },

  initBoard: function() {
    
  },

  CreateGame: function(){

    App.contracts.Battleship.deployed().then(function (instance) {
        battleshipInstance = instance;
         return battleshipInstance.CreateGame();
        }).then(function (gameId){
          console.log(gameId);
          console.log("Game Created");
        }).catch(function(err) {
                console.log(err.message);
              });;




  },

  JoinGameId: function(){
    var inputValue = $('#GameId').val();
    if(!inputValue) alert("You must select a game ID!");
    else{
      console.log(inputValue);
      // TODO JOIN GAME BY ID
    }

  },

  handleAdopt: function(event) {
    event.preventDefault();

    var petId = parseInt($(event.target).data('id'));

    alert(petId);
    /*
     * Replace me...
     */
  }

  

};

$(function() {
  $(window).load(function() {
    App.init();
  });
});


