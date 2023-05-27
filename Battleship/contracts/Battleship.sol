// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;
contract Battleship {
  //struct for the Game
  struct Game {
        address first;
        address second;
        uint boardDim;
        uint amount;
        address amountRequester;//used to don't allow a user to commit an amount and accept it all by himself.
        uint tempAmount;
        string merkleFirst;
        string merkleSecond;
        uint ethFirst;
        uint ethSecond;
        uint firstNumShips;
        uint secondNumShips;
  }
  //event to send when game starts
  event GameCreated(address indexed _first,address indexed _second,uint _amountTemp ,uint indexed _gameId,uint _boardDim,uint _numberOfShips);
  //event to declare the amount of money the game will have, it is used during the decision of how much money to spend in the game
  event AmountToSpend(uint indexed _gameId,uint _amount,address _from);
  //event for the amount that the game will have
  event AmountDecided(uint indexed _gameId,uint _amount);
  //event for outputting an uint value
  event UintOutput(address indexed _from,uint _value);
  //ErrorOut string
  error ErrorOut(string err);
  //The game has officially started.
  event GameStarted(address indexed _first, address indexed _second);
  //Attack the opponent
  event AttackOpp(uint indexed _gameId ,address _attacker, address _opponent, uint _row, uint _col);
  //event after attack
  event AttackRes(uint _result);

  //Array of games
  Game[] public listOfGames;
  //variable to keep the number of open games.
  uint public openGames = 0;
  constructor() {
  }

  function CreateGame(uint _boardDim,uint _numberOfShips) public{ //Game Creation, creates a game with only the first player saved.
    listOfGames.push(Game(msg.sender,address(0),_boardDim,0,address(0),0,"","",0,0,_numberOfShips,_numberOfShips));
    openGames++;
    emit UintOutput(msg.sender,listOfGames.length - 1); 
  }
  function JoinGame(bool _isRand,uint _gameIndex) public {//Join a game.
    if(openGames <= 0) revert ErrorOut({err:"No open games"});
    
    bool found = false;
    uint returnIndex = 0;
    if(!_isRand) { //can be joined specifically by passing a game id.
      require(_gameIndex < listOfGames.length,"Something went wrong!");
      returnIndex = _gameIndex;
      if(listOfGames[returnIndex].first == address(0)) revert ErrorOut({err:"You can't join this game, because there's no player here!"});
      //if(listOfGames[returnIndex].first == msg.sender) revert("User can't access his own game!");
      if(listOfGames[returnIndex].second != address(0)) revert ErrorOut({err:"Game is not Free"});
      listOfGames[(returnIndex)].second = msg.sender;
      openGames--;
      found = true;
    }
    //can be joined randomly, the contract will find a random game from the open ones.

    if(_isRand && !found){
      bytes32 rand = randGenerator();
      uint index = uint(rand) % openGames + 1;
      for(uint i = 0; i < listOfGames.length; i++){
        if(listOfGames[i].second == address(0) && listOfGames[i].first != address(0) && index > 1) index--;
        else if (listOfGames[i].second == address(0) && listOfGames[i].first != address(0) && index == 1) {
          listOfGames[i].second = msg.sender;
          returnIndex = i;
          openGames--;
          found = true;
          break;
        }
      }
    }

    if(found) emit GameCreated(listOfGames[returnIndex].first,listOfGames[returnIndex].second,listOfGames[returnIndex].tempAmount,returnIndex,listOfGames[returnIndex].boardDim,listOfGames[returnIndex].firstNumShips);
      
    if(!found)revert ErrorOut({err:"Not able to find an open game"});
  }

  function AmountCommit(uint _gameId,uint _amount) public{
    if(listOfGames[_gameId].first == address(0)) revert ErrorOut({err:"The creator id is null"});
    require(_amount > 0 && _gameId < listOfGames.length,"The amount or the gameId are null!");
    require(listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender,"this user is not part of the game!");
    if(listOfGames[_gameId].amount != 0) revert ErrorOut({err:"The amount for this game has already been decided"});
    listOfGames[_gameId].tempAmount = _amount;
    listOfGames[_gameId].amountRequester = msg.sender;
    emit AmountToSpend(_gameId, _amount,msg.sender);
  }
  function AcceptedAmount(uint _gameId) public{
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    require(listOfGames[_gameId].amountRequester != address(0) && listOfGames[_gameId].amountRequester != msg.sender,"Something went wrong!");
    if(listOfGames[_gameId].amount != 0) revert ErrorOut({err:"The amount for this game has already been decided!"});
    if(listOfGames[_gameId].tempAmount == 0) revert ErrorOut({err:"The amount for this game wasn't decided yet!"});
    listOfGames[_gameId].amount = listOfGames[_gameId].tempAmount;
    emit AmountDecided(_gameId,listOfGames[_gameId].amount);
  }
  function SendEther(uint _gameId) public payable {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    require(msg.value > 0,"Eth are 0!");
    if(listOfGames[_gameId].first == msg.sender) listOfGames[_gameId].ethFirst = msg.value;
    else listOfGames[_gameId].ethSecond = msg.value;
    }
    function AttackOpponent(uint _gameId, uint _row, uint _col) public {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    if(listOfGames[_gameId].first == msg.sender) emit AttackOpp(_gameId,msg.sender,listOfGames[_gameId].second,_row,_col);
    else emit AttackOpp(_gameId,msg.sender,listOfGames[_gameId].first,_row,_col);
    }

    function MerkleProofAttack(uint _gameId,string memory _attackRes,bytes32 _attackHash,bytes32[] memory merkleProof) public returns (bytes32) {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    bytes memory byteArray = abi.encodePacked(_attackHash);
    bytes memory byteArraytemp;

    bytes32 temp;
    for(uint i = 0; i < merkleProof.length; i++){
        byteArraytemp = abi.encodePacked(merkleProof[i]);
        temp = keccak256(abi.encodePacked(byteArray,byteArraytemp));
        byteArray = abi.encode(temp);
      }
      return temp;
   /* if(listOfGames[_gameId].first == msg.sender) {
      if(compare(string(abi.encode(temp)),listOfGames[_gameId].merkleFirst)) {
        emit AttackRes(1);
        if(compare(_attackRes,"1")) listOfGames[_gameId].firstNumShips = listOfGames[_gameId].firstNumShips - 1;
      }
      else revert("Merkle proof failed!");
    }
    else {
          if(compare(string(abi.encode(temp)),listOfGames[_gameId].merkleSecond)) {
            emit AttackRes(1);
            if(compare(_attackRes,"1")) listOfGames[_gameId].firstNumShips = listOfGames[_gameId].firstNumShips - 1;

          }
      else revert("Merkle proof failed!");
    }*/
    
    }



     function compare(string memory str1, string memory str2) public pure returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }



    function getList(uint _gameId) public view returns (Game memory){
      return listOfGames[_gameId];
    }

  function SendMerkleRoot(string memory _merkleroot, uint _gameId) public{//Done at the start of the game by both players, otherwise the game don't start.
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    if(listOfGames[_gameId].first == msg.sender) listOfGames[_gameId].merkleFirst = _merkleroot;
    else listOfGames[_gameId].merkleSecond = _merkleroot;
    if(checkStringNotEmpty(listOfGames[_gameId].merkleSecond) && checkStringNotEmpty(listOfGames[_gameId].merkleFirst)) emit GameStarted(listOfGames[_gameId].first, listOfGames[_gameId].second);
  }

   function checkStringNotEmpty(string memory inString) public pure returns (bool) {
        return bytes(inString).length != 0;
    }

  function LeaveGame(uint _gameId) public { //you can leave the game only if you are the creator and before the game has started.
    require(_gameId < listOfGames.length && listOfGames[_gameId].first == msg.sender && listOfGames[_gameId].second == address(0),"You can't leave the game if you're not the owner!");
    listOfGames[_gameId].first = address(0);
    openGames--;
  }


  //TO DO START GAME, CONTROLLO CHE AMOUNT è STATO DECISO


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
