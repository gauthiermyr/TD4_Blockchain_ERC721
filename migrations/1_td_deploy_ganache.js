const Str = require('@supercharge/strings')
// const BigNumber = require('bignumber.js');

var TDErc20 = artifacts.require("ERC20TD.sol");
var evaluator = artifacts.require("Evaluator.sol");
var evaluator2 = artifacts.require("Evaluator2.sol");
var ExerciceSolution = artifacts.require("ExerciceSolution.sol");


module.exports = (deployer, network, accounts) => {
    deployer.then(async () => {
        await deployTDToken(deployer, network, accounts); 
        await deployEvaluator(deployer, network, accounts); 
        await setPermissionsAndRandomValues(deployer, network, accounts); 
        await doExercices(deployer, network, accounts); 
        await deployRecap(deployer, network, accounts); 
    });
};

async function deployTDToken(deployer, network, accounts) {
	TDToken = await TDErc20.new("TD-ERC721-101","TD-ERC721-101",web3.utils.toBN("0"))
	// TDToken = await TDErc20.at("0x46a9Dc47185F769ef9a11927B0f9d2fd0dEc3304")
}

async function deployEvaluator(deployer, network, accounts) {
	Evaluator = await evaluator.new(TDToken.address)
	// Evaluator = await evaluator.at("0x6B19d275dA33857a3f35F7c1034048Ba1abF75CD") 
	Evaluator2 = await evaluator2.new(TDToken.address)
	// Evaluator = await evaluator.at("0x00000000000000000000000000000000000000")
}

async function setPermissionsAndRandomValues(deployer, network, accounts) {
	await TDToken.setTeacher(Evaluator.address, true)
	await TDToken.setTeacher(Evaluator2.address, true)
	randomNames = []
	randomLegs = []
	randomSex = []
	randomWings = []
	for (i = 0; i < 20; i++)
		{
		randomNames.push(Str.random(15))
		randomLegs.push(Math.floor(Math.random()*5))
		randomSex.push(Math.floor(Math.random()*2))
		randomWings.push(Math.floor(Math.random()*2))
		// randomTickers.push(web3.utils.utf8ToBytes(Str.random(5)))
		// randomTickers.push(Str.random(5))
		}

	await Evaluator.setRandomValuesStore(randomNames, randomLegs, randomSex, randomWings);
	await Evaluator2.setRandomValuesStore(randomNames, randomLegs, randomSex, randomWings);
}

function toEther(bignum){
	bignum = new web3.utils.BN(bignum).toString();
    bignum = web3.utils.fromWei(bignum, 'ether');
	return bignum;
}

async function deployRecap(deployer, network, accounts) {
	var balance = await TDToken.balanceOf(accounts[0]);
	console.log(`Balance: ${toEther(balance)}/20`);
}

async function doExercices(deployer, network, accounts){
	//deploy ERC721 contract
	MyERC721 = await ExerciceSolution.new("@gauthiermyr","TD5");

	//submit
	await Evaluator.submitExercice(MyERC721.address);

	//do exercice 1
	// mint token
	await MyERC721.declareAnimal(0, 100000, 1, "Gauthier");
	//transfer to Evaluator
	await MyERC721.transferFrom(accounts[0], Evaluator.address, 1);
	//validate ex
	await Evaluator.ex1_testERC721();

	//do exercice 2a
	await Evaluator.ex2a_getAnimalToCreateAttributes();

	//do exercice 2b
	const sex = await Evaluator.readSex(accounts[0]);
	const legs = await Evaluator.readLegs(accounts[0]);
	const wings = await Evaluator.readWings(accounts[0]);
	const name = await Evaluator.readName(accounts[0]);

	await MyERC721.declareAnimal(sex, legs, wings, name);
	await MyERC721.transferFrom(accounts[0], Evaluator.address, 2);
	await Evaluator.ex2b_testDeclaredAnimal(2);

	//do exercice 3
	await Evaluator.sendTransaction({from:accounts[0],value:1000000000000000000})
	await Evaluator.ex3_testRegisterBreeder();

	//do exercice 4
	await Evaluator.ex4_testDeclareAnimal();

	//do exercice 5
	await Evaluator.ex5_declareDeadAnimal();

	//do exercice 6a
	await Evaluator.ex6a_auctionAnimal_offer();

	//do exercice 6b
	await MyERC721.declareAnimal(0, 100000, 1, "Gauthier");
	const num = await MyERC721.lastMintedToken();
	await MyERC721.offerForSale(num, 1000000000000000)

	await Evaluator.ex6b_auctionAnimal_buy(num);

	//submit for evaluator 2
	await Evaluator2.submitExercice(MyERC721.address);

	//setup for evaluator 2
	await Evaluator2.ex2a_getAnimalToCreateAttributes();
	await MyERC721.registerExtraBreeder(Evaluator2.address);
	await Evaluator2.sendTransaction({from:accounts[0],value:1000000000000000000})


	//do exercice 7a
	await MyERC721.declareAnimal(0, 100000, 1, "Gauthier 1");
	const parent1 = await MyERC721.lastMintedToken();
	await MyERC721.transferFrom(accounts[0], Evaluator2.address, parent1);

	await MyERC721.declareAnimal(1, 90000, 0, "Gauthier 2");
	const parent2 = await MyERC721.lastMintedToken();
	await MyERC721.offerForReproduction(parent2, 10000),
	await MyERC721.authorizedExtraBreederToReproduce(parent2, Evaluator2.address),

	await Evaluator2.ex7a_breedAnimalWithParents(parent1, parent2);

	//do exercice 7b
	await MyERC721.declareAnimal(0, 100000, 1, "Gauthier 1");
	const parent3 = await MyERC721.lastMintedToken();
	await MyERC721.transferFrom(accounts[0], Evaluator2.address, parent3);
	await Evaluator2.ex7b_offerAnimalForReproduction();

	//do exercice 7c
	await MyERC721.declareAnimal(0, 100000, 1, "Gauthier 1");
	const parent4 = await MyERC721.lastMintedToken();
	await MyERC721.offerForReproduction(parent4, 10000),
	await Evaluator2.ex7c_payForReproduction(parent4);
}


