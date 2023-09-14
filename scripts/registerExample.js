const hre = require('hardhat')
const evm = require('./evm')
//const ethers = require("ethers");
const { provider, Signer, Wallet } = require('ethers')
const ENS = artifacts.require('./registry/ENSRegistry')
const { makeInterfaceId } = require('@openzeppelin/test-helpers')
const namehash = require('eth-ens-namehash')
const Interface = require('ethers/lib/utils')

const DAY = 24 * 60 * 60
const REGISTRATION_TIME = 28 * DAY
const BUFFERED_REGISTRATION_COST = ethers.utils.parseUnits('1', 18) //REGISTRATION_TIME + 3 * DAY + 1000000000000000000
const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'
const secret =
  '0x0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEC'

function computeInterfaceId(iface) {
  return makeInterfaceId.ERC165(
    Object.values(iface.functions).map((frag) => frag.format('sighash')),
  )
}

async function main() {
  //ens = await ENS.new()
  //console.log(ens)

  const privKey =
    'ef5177cd0b6b21c87db5a0bf35d4084a8a57a9d6a064f86d51ac85f2b873a4e2'
  const provider = ethers.provider
  const { deployer, owner } = await hre.getNamedAccounts()
  registrar = await deployments.get('BaseRegistrarImplementation')
  registrar = await hre.ethers.getContractAt(
    'BaseRegistrarImplementation',
    registrar.address,
  )
  //console.log(await registrar.controllers("0x74e1E80b892392ee5046A59Ddd4438714c276b38")) // legacy

  r = namehash.hash('eth')
  //controller = await deployments.get('LegacyETHRegistrarController')
  controller = await deployments.get('ETHRegistrarController')
  const artifact = controller.abi
  //controller = await hre.ethers.getContractAt("ETHRegistrarController_mainnet_9380471", controller.address)
  controller = await hre.ethers.getContractAt(
    'ETHRegistrarController',
    controller.address,
  )

  nameWrapper = await deployments.get('NameWrapper')
  nameWrapper = await hre.ethers.getContractAt(
    'NameWrapper',
    nameWrapper.address,
  )

  resolver = await deployments.get('PublicResolver')
  resolver = await hre.ethers.getContractAt('PublicResolver', resolver.address)
  resolver.connect(deployer)

  const interfaceId = '0x018fac06' // computeInterfaceId(new Interface.Interface(artifact))
  /*const tx = await resolver.setInterface(
      namehash.hash('eth'),
      interfaceId,
      controller.address,
    )
    res = await tx.wait()*/

  ENSRegistry = await deployments.get('ENSRegistry')
  ENSRegistry = await hre.ethers.getContractAt(
    'ENSRegistry',
    ENSRegistry.address,
  )

  n = 'test16'
  n2 = n + '.eth'
  registrantAccount = deployer
  const callData = [
    resolver.interface.encodeFunctionData('setAddr(bytes32,address)', [
      namehash.hash(n2),
      registrantAccount,
    ]),
    resolver.interface.encodeFunctionData('setText', [
      namehash.hash(n2),
      'url',
      'ethereum.com',
    ]),
  ]

  controller = await deployments.get('ETHRegistrarController')
  controller = await hre.ethers.getContractAt(
    'ETHRegistrarController',
    controller.address,
  )
  const wallet = new Wallet(privKey, provider)
  controller.connect(deployer)
  tx = await registerName(n)
  r = await tx.wait()
  // ENSRegistry.connect(deployer)
  r2 = namehash.hash(n2)
  console.log(await ENSRegistry.owner(r2))
  console.log(resolver.address)
  //tx = await ENSRegistry.setResolver(r2, owner)
  console.log(tx)
  r = await tx.wait()
  console.log(r)
  //await controller.register(ethers.encodeBytes32String("test.eth"), deployer, 86400)
  //console.log(res.address)

  async function registerName(
    name,
    txOptions = { value: BUFFERED_REGISTRATION_COST, gasLimit: 2500000 },
  ) {
    var commitment = await controller.makeCommitment(
      name,
      registrantAccount,
      REGISTRATION_TIME,
      secret,
      resolver.address,
      callData,
      true,
      0,
    )
    var tx = await controller.commit(commitment)

    res = (await controller.minCommitmentAge()).toNumber()

    //await evm.advanceTime(res)
    await new Promise((r) => setTimeout(r, (res + 5) * 1000))

    // await
    var tx = await controller.register(
      name,
      registrantAccount,
      REGISTRATION_TIME,
      secret,
      resolver.address,
      callData,
      true,
      0,
      txOptions,
    )

    return tx
  }

  /*const signer_wallet = new Wallet(privKey);
    const signer = await ethers.getSigner(signer_wallet);
    ownerAccount = signer
    console.log(ownerAccount)
    contractAddress = "0xdcc236e4487c07AaD38578776a38015E7a13A066"
    registrar = await hre.ethers.getContractAt("BaseRegistrarImplementation", contractAddress, {
      from: signer_wallet,
    })
    await registrar.addController(ownerAccount, { from: ownerAccount })

    await ens.setSubnodeOwner('0x0', sha3('eth'), registrar.address)
    const myContract = await hre.ethers.getContractAt("MyContract", contractAddress);

    var tx = await registrar.register(
        sha3('newname'),
        ownerAccount,
        86400,
        { from: ownerAccount },
      )
    console.log(tx)
    var block = await web3.eth.getBlock(tx.receipt.blockHash)
    console.log(block)*/
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
