Playing Battleship on Ethereum
1. Project Description
The Battleship board game is played by two players who cannot see each others’ board until the end of the game.
The game operates on hidden information, and that hidden state influences each action taken by the players.
The game is divided into two phases: during the placement phase, each player places k ships of varying lengths and of constant width on their board, a n X n matrix which represents a coarse  discretization of the ocean. After the first phase, the game proceeds to the shooting phase, which consists of players taking turns and making guesses about the location of the ships on the opponent’s board (referred to as launching a torpedo).
The guess consists of telling the opponents the coordinates [i,j] of a zone of the board. If any of the opponent’s ships are at that location, the opponent replies “Hit!”, otherwise “Miss!”. Once all the squares that the ship occupies have been hit, the ship is considered “sunk”. 
The termination of the game happens when one of the players has sunk all of their opponent’s ships and that player wins the game.

2. The project requires the implementation of the Battleship game on the Ethereum blockchain, so that the properties of the blockchain, i.e. tamper-freeness, the possibility of auditing the fair rules of the game, encoded in smart contracts, instant and secure reward payments, and secure rewarding implementation, can be exploited.

INSTRUCTIONS
1) truffle installation: https://archive.trufflesuite.com/docs/truffle/how-to/install/
2) metamask: https://metamask.io/download/, download it and create an account
3) truffle migrate – deploy the contract, to execute in project root folder.
4) npm install – install dependecies
5) npm run dev – run the application
