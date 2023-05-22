// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Battleship {
  //struct for the Game
  struct Game {
        address first;
        address second;
        uint amount;
        uint tempAmount;
        string merkle_first;
        string merkle_second;
  }
  //event to send when game starts
  event GameStarted(address indexed _first,address indexed _second, uint indexed _gameId);
  //event to declare the amount of money the game will have, it is used during the decision of how much money to spend in the game
  event AmountToSpend(uint indexed _gameId,uint _amount);
  //event for the amount that the game will have
  event AmountDecided(uint indexed _gameId,uint _amount);

  //Array of games
  Game[] public listOfGames;
  //variable to keep the number of open games.
  uint public openGames = 0;
  constructor() {
  }

  function CreateGame() public returns (uint) { //Game Creation, creates a game with only the first player saved.
    listOfGames.push(Game(msg.sender,address(0),0,0,"",""));
    openGames++;
    return listOfGames.length - 1; 
  }
  function JoinGame(bool _isRand,uint _gameIndex) public returns (uint){//Join a game.
    if(openGames <= 0) revert("No open games");
    
    bool found = false;
    uint returnIndex = 0;
    if(!_isRand) { //can be joined specifically by passing a game id.
      require(_gameIndex < listOfGames.length);
      returnIndex = _gameIndex;
      if(listOfGames[_gameIndex].second != address(0)) revert("Game is not Free");
      listOfGames[(_gameIndex)].second = msg.sender;
      openGames--;
      found = true;
    }
    //can be joined randomly, the contract will find a random game from the open ones.

    if(_isRand && !found){
      bytes32 rand = randGenerator();
      uint index = uint(rand) % openGames + 1;
      for(uint i = 0; i < listOfGames.length; i++){
        if(listOfGames[i].second == address(0) && index > 1) index--;
        else if (listOfGames[i].second == address(0) && index == 1) {
          listOfGames[i].second = msg.sender;
          returnIndex = i;
          openGames--;
          found = true;
          break;
        }
      }
    }

    if(found) {
      emit GameStarted(listOfGames[returnIndex].first,listOfGames[returnIndex].second,returnIndex);
      }

    if(!found) revert("Not able to find an open game");
    return returnIndex;
  }

  function amountCommit(uint _gameId,uint _amount) public{
    require(_amount > 0 && _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0));
    require(listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    if(listOfGames[_gameId].amount != 0) revert("The amount for this game has already been decided");
    listOfGames[_gameId].tempAmount = _amount;
    emit AmountToSpend(_gameId, _amount);
  }
  function acceptedAmount(uint _gameId) public {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition);
    if(listOfGames[_gameId].amount != 0) revert("The amount for this game has already been decided!");
    if(listOfGames[_gameId].tempAmount == 0) revert("The amount for this game wasn't decided yet!");
    listOfGames[_gameId].amount = listOfGames[_gameId].tempAmount;
    emit AmountDecided(_gameId,listOfGames[_gameId].amount);
  }


  function randGenerator() private view returns (bytes32){
    //Helps with random number generation
    bytes32 bhash=blockhash(block.number-1);
    bytes memory bytesArray = new bytes(32);
    for (uint i; i <32; i++)
    {bytesArray[i] =bhash[i];}
    bytes32 rand = keccak256(bytesArray);
    return rand;
  }


}
