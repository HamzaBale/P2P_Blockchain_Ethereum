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
        bytes32 merkleFirst;
        bytes32 merkleSecond;
        uint ethFirst;
        uint ethSecond;
        uint firstNumShips;
        uint secondNumShips;
        uint accusationTimeout;
        address accusedPlayer;
        address playerTurn;
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
  event AttackRes(string  _result,address _attacker,uint _gameId);
  //event game end
  event GameEnd(uint indexed _gameId,address _winner,address _loser,string _cause);
  //accusation
  event AccusationTriggered(uint indexed _gameId,address _accused,address _accuser);
  //Array of games
  Game[] public listOfGames;
  //variable to keep the number of open games.
  uint public openGames = 0;
  constructor() {
  }

  //GAS PRICE FOR ALL FUNCTIONS: 20000000000

  //GAS USED: 144797
  //TOTAL PRICE = 0.00289594 eth
  //Game Creation, creates a game by setting the number of ships and the board dimension.
  function CreateGame(uint _boardDim,uint _numberOfShips) public{ 
    listOfGames.push(Game(msg.sender,address(0),_boardDim,0,address(0),0,0,0,0,0,_numberOfShips,_numberOfShips,0,address(0),msg.sender));
    openGames++;
    emit UintOutput(msg.sender,listOfGames.length - 1);
  }

  //GAS USED FOR RANDOM JOIN: 90415
  //GAS USED FOR JOINING SPECIFIC GAME: 64370
  //TOTAL PRICE = 0.0018083 -- 0.0012874
  //Function to join a game, can be random or with an index.
  function JoinGame(bool _isRand,uint _gameIndex) public {//Join a game.
    if(openGames <= 0) revert ErrorOut({err:"No open games"});
    
    bool found = false;
    uint returnIndex = 0;
    if(!_isRand) { //can be joined specifically by passing a game id.
      require(_gameIndex < listOfGames.length,"Something went wrong!");
      returnIndex = _gameIndex;
      if(listOfGames[returnIndex].first == address(0)) revert ErrorOut({err:"You can't join this game, because there's no player here!"});
      //if(listOfGames[returnIndex].first == msg.sender) revert("User can't access his own game!"); commented just for testing purposes
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

  //GAS USED: 75033
  //TOTAL PRICE = 0.00150066 eth
  //Used to commit a certain amount of eth, after commit phase the opponent can accept this amount or commit a new one.
  function AmountCommit(uint _gameId,uint _amount) public{
    if(listOfGames[_gameId].first == address(0)) revert ErrorOut({err:"The creator id is null"});
    require(_amount > 0 && _gameId < listOfGames.length,"The amount or the gameId are null!");
    require(listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender,"this user is not part of the game!");
    if(listOfGames[_gameId].amount != 0) revert ErrorOut({err:"The amount for this game has already been decided"});
    listOfGames[_gameId].tempAmount = _amount;
    listOfGames[_gameId].amountRequester = msg.sender;
    emit AmountToSpend(_gameId, _amount,msg.sender);
  }
  //GAS USED: 58563
  //TOTAL PRICE = 0.00117126 eth
  //Accept the current commited amount
  function AcceptedAmount(uint _gameId) public{
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    require(listOfGames[_gameId].amountRequester != address(0) && listOfGames[_gameId].amountRequester != msg.sender,"Something went wrong!");
    if(listOfGames[_gameId].amount != 0) revert ErrorOut({err:"The amount for this game has already been decided!"});
    if(listOfGames[_gameId].tempAmount == 0) revert ErrorOut({err:"The amount for this game wasn't decided yet!"});
    listOfGames[_gameId].amount = listOfGames[_gameId].tempAmount;//tempAmount is used to store the latest commited amount.
    emit AmountDecided(_gameId,listOfGames[_gameId].amount);
  }
  //GAS USED: 51737
  //TOTAL PRICE =0.00103474eth
  //Send eth from externally owned accounts to contract
  function SendEther(uint _gameId) public payable {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    require(msg.value > 0,"Eth are 0!");
    if(listOfGames[_gameId].first == msg.sender) listOfGames[_gameId].ethFirst = msg.value;
    else listOfGames[_gameId].ethSecond = msg.value;
    }
    //GAS USED: 36734
    //TOTAL PRICE = 0.00103474eth
    //Attack the opponent passing a row and a column
    function AttackOpponent(uint _gameId, uint _row, uint _col) public {
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    require(listOfGames[_gameId].playerTurn == msg.sender);
    listOfGames[_gameId].accusedPlayer = address(0);
    listOfGames[_gameId].accusationTimeout = 0;
    if(listOfGames[_gameId].first == msg.sender) {
      //triggers event that will be received by the opponent
      emit AttackOpp(_gameId,msg.sender,listOfGames[_gameId].second,_row,_col);
      //turn passes to the opponent
      listOfGames[_gameId].playerTurn = listOfGames[_gameId].second;
      }
    else {
      emit AttackOpp(_gameId,msg.sender,listOfGames[_gameId].first,_row,_col);
      listOfGames[_gameId].playerTurn = listOfGames[_gameId].first;
    }
    }

     //GAS USED: 54397
    //TOTAL PRICE = 0.00103474eth
    function SendMerkleRoot(bytes32 _merkleroot, uint _gameId) public{//Done at the start of the game by both players, otherwise the game don't start.
      bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
      require(condition,"Something went wrong!");
      if(listOfGames[_gameId].first == msg.sender) listOfGames[_gameId].merkleFirst = _merkleroot;
      else listOfGames[_gameId].merkleSecond = _merkleroot;
      if(listOfGames[_gameId].merkleSecond != 0 && listOfGames[_gameId].merkleFirst != 0) emit GameStarted(listOfGames[_gameId].first, listOfGames[_gameId].second);
    }


    //GAS USED: 41678
    //TOTAL PRICE = 0.00103474eth
    //GAS USED FOR END GAME: 55256
    //Merkle proof that is called after an attack
    function MerkleProofAttack(uint _gameId,string memory _attackRes,bytes32 _attackHash,bytes32[] memory merkleProof) payable public{
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    bytes memory byteArraytemp;

    bytes32 temp = _attackHash;
    for(uint i = 0; i < merkleProof.length; i++){//in the variable temp at the end of the loop, we will have the merkle root calculated from the merkle proof.
        byteArraytemp = abi.encodePacked(merkleProof[i] ^ temp);
        temp = keccak256(byteArraytemp);
      }
      
    if(listOfGames[_gameId].first == msg.sender) {
      bytes32 temp1_el = keccak256(abi.encodePacked(temp));
      bytes32 temp2_el = keccak256(abi.encodePacked(listOfGames[_gameId].merkleFirst));
      if(temp1_el == temp2_el ) {
        emit AttackRes(_attackRes,listOfGames[_gameId].second,_gameId);
        if(compare(_attackRes,"1")) listOfGames[_gameId].firstNumShips = listOfGames[_gameId].firstNumShips - 1;
      }
      else { //if the root calculated is not equal to the one stored, then the player is cheating and the game ends
        emit GameEnd(_gameId,listOfGames[_gameId].second,listOfGames[_gameId].first,"Cheater detected, the eth will be sent to the winner!");
        payable(listOfGames[_gameId].second).transfer(listOfGames[_gameId].amount * 2);
      }
      if(listOfGames[_gameId].firstNumShips <= 0) {payable(listOfGames[_gameId].second).transfer(listOfGames[_gameId].amount * 2);
      emit GameEnd(_gameId,listOfGames[_gameId].second,listOfGames[_gameId].first,"End Of Game!");
      }
    }
    else { //Same as above just for the second player
          bytes32 temp1_el = keccak256(abi.encodePacked(temp));
          bytes32 temp2_el = keccak256(abi.encodePacked(listOfGames[_gameId].merkleSecond));

          if(temp1_el == temp2_el) {
            emit AttackRes(_attackRes,listOfGames[_gameId].first,_gameId);
            if(compare(_attackRes,"1")) listOfGames[_gameId].secondNumShips = listOfGames[_gameId].secondNumShips - 1;

          }
      else {
        emit GameEnd(_gameId,listOfGames[_gameId].first,listOfGames[_gameId].second,"Cheater detected, the eth will be sent to the winner!");
        payable(listOfGames[_gameId].first).transfer(listOfGames[_gameId].amount * 2);
      }
      if(listOfGames[_gameId].secondNumShips <= 0) {
        payable(listOfGames[_gameId].first).transfer(listOfGames[_gameId].amount * 2);
      emit GameEnd(_gameId,listOfGames[_gameId].first,listOfGames[_gameId].second,"End Of Game!");
      }
    }
    
    }

     function compare(string memory str1, string memory str2) public pure returns (bool) {
        return keccak256(abi.encodePacked(str1)) == keccak256(abi.encodePacked(str2));
    }

   //GAS USED: 76349
   //TOTAL PRICE: 0.00152698 eth
   //Notify the opponent to play, this can trigger the timeout event and the end of the game.
   function triggerAccusation(uint _gameId) public {        
    bool condition = _gameId < listOfGames.length && listOfGames[_gameId].first != address(0) && listOfGames[_gameId].second != address(0) && (listOfGames[_gameId].first == msg.sender || listOfGames[_gameId].second == msg.sender);
    require(condition,"Something went wrong!");
    address accusedPlayer = address(0);
    if(listOfGames[_gameId].second == msg.sender) accusedPlayer = listOfGames[_gameId].first;
    else  accusedPlayer = listOfGames[_gameId].second;
    
    if(listOfGames[_gameId].accusationTimeout != 0){
        if(block.number >= listOfGames[_gameId].accusationTimeout){ //more than 5 blocks have been mined after the notify has been triggered
          if(listOfGames[_gameId].accusedPlayer == listOfGames[_gameId].second) payable(listOfGames[_gameId].first).transfer(listOfGames[_gameId].amount * 2);
          else payable(listOfGames[_gameId].second).transfer(listOfGames[_gameId].amount);
          //the game ends
          emit GameEnd(_gameId,listOfGames[_gameId].first,listOfGames[_gameId].second,"Timeout, the game ended because someone didn't play!");
        } else emit AccusationTriggered(_gameId,accusedPlayer,msg.sender);
    } else {
      listOfGames[_gameId].accusationTimeout = block.number + 5;
 
      listOfGames[_gameId].accusedPlayer = accusedPlayer;
      emit AccusationTriggered(_gameId,accusedPlayer,msg.sender);
    }
 
    }    

 

   function checkStringNotEmpty(string memory inString) public pure returns (bool) {
        return bytes(inString).length != 0;
    }

  //GAS USED: 31668
  //TOTAL PRICE = 0.00063336
  function LeaveGame(uint _gameId) public { //you can leave the game only if you are the creator and before the game has started.
    require(_gameId < listOfGames.length && listOfGames[_gameId].first == msg.sender && listOfGames[_gameId].second == address(0),"You can't leave the game if you're not the owner!");
    listOfGames[_gameId].first = address(0);
    openGames--;
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
