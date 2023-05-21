// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Battleship {
   struct Game {
        address first;
        address second;
  }
  Game[] public listOfGames;
  uint public openGames = 0;
  constructor() {
  }

  function CreateGame() public returns (uint) { //Game Creation, creates a game with only the first player saved.
    listOfGames.push(Game(msg.sender,address(0)));
    openGames++;
    return listOfGames.length - 1; 
  }
  function JoinGame(bool isRand,uint gameIndex) public returns (uint){//Join a game.
    if(openGames <= 0) revert("No open games");
    if(!isRand) { //can be joined specifically by passing a game id.
      if(listOfGames[gameIndex].second != address(0)) revert("Game is not Free");
      listOfGames[(gameIndex)].second = msg.sender;
      openGames--;
      return (gameIndex);
    }
    //can be joined randomly, the contract will find a random game from the open ones.
    bytes32 rand = randGenerator();
    bool found = false;
    uint index = uint(rand) % openGames + 1;
    uint returnIndex = 0;
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
    if(!found) revert("Not able to find an open game");
    return returnIndex;
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
