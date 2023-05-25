var Battleship = artifacts.require("../contracts/Battleship.sol"); //contract name, it's used to search for the contract

module.exports = function(deployer){
    deployer.deploy(Battleship);//deploys the contract
};

//Battleship.deployed().then(function(instance) {return instance.CreateGame(2);});