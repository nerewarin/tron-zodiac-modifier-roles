const Roles = artifacts.require('Roles');
const Integrity = artifacts.require('Integrity');
const Packer = artifacts.require('Packer');
const { getAddresses } = require('../constants/addresses');
const fs = require('fs');
const path = require('path');
const TronWeb = require('tronweb');

module.exports = async function (deployer, network, accounts) {
  console.log('Deploying complete TRON Zodiac Roles system to network:', network);
  console.log('Environment variables:');
  console.log('  - PRIVATE_KEY set:', !!process.env.PRIVATE_KEY);
  console.log('  - TRONSCAN_API_KEY set:', !!process.env.TRONSCAN_API_KEY);
  console.log('  - NODE_ENV:', process.env.NODE_ENV || 'undefined');
  
  // Get network configuration
  const networkConfig = getAddresses(network);
  console.log('Network configuration loaded:', !!networkConfig);
  
  // Note: In TronBox, 'accounts' is a string, not an array!
  console.log("Deployer:", accounts);
  console.log("Deployer type:", typeof accounts);
  
  // For testing, we'll use the deployer account as owner, avatar, and target
  // In production, these would be actual Safe addresses
  const owner = accounts;
  const avatar = accounts; // This will be replaced with actual Safe address
  const target = accounts; // This will be replaced with actual Safe address
  
  console.log('Deployment parameters:');
  console.log('Owner:', owner);
  console.log('Avatar:', avatar);
  console.log('Target:', target);
  console.log('Network:', network);
  
  // Step 1: Deploy required libraries first
  console.log('\n📚 Step 1: Deploying required libraries...');
  
  let integrityInstance, packerInstance;
  
  try {
    console.log('Deploying Integrity library...');
    console.log('  - Library artifact loaded:', !!Integrity);
    console.log('  - Deployer available:', !!deployer);
    console.log('  - Network:', network);
    
    await deployer.deploy(Integrity);
    integrityInstance = await Integrity.deployed();
    console.log('✅ Integrity library deployed successfully!');
    console.log('  - Address (hex):', integrityInstance.address);
    console.log('  - Transaction hash:', integrityInstance.transactionHash);
  } catch (error) {
    console.error('❌ Integrity library deployment failed:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Full error:', error);
    throw error;
  }
  
  try {
    console.log('\nDeploying Packer library...');
    console.log('  - Library artifact loaded:', !!Packer);
    
    await deployer.deploy(Packer);
    packerInstance = await Packer.deployed();
    console.log('✅ Packer library deployed successfully!');
    console.log('  - Address (hex):', packerInstance.address);
    console.log('  - Transaction hash:', packerInstance.transactionHash);
  } catch (error) {
    console.error('❌ Packer library deployment failed:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Full error:', error);
    throw error;
  }
  
  // Step 2: Link libraries to Roles contract
  console.log('\n🔗 Step 2: Linking libraries to Roles contract...');
  
  try {
    console.log('Linking Integrity library to Roles...');
    await deployer.link(Integrity, Roles);
    console.log('  - Integrity library linked successfully');
    
    console.log('Linking Packer library to Roles...');
    await deployer.link(Packer, Roles);
    console.log('  - Packer library linked successfully');
    
    console.log('✅ All libraries linked successfully!');
  } catch (error) {
    console.error('❌ Library linking failed:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Full error:', error);
    throw error;
  }
  
  // Step 3: Deploy the main Roles contract
  console.log('\n🚀 Step 3: Deploying main Roles contract...');
  
  try {
    console.log('Deploying Roles contract with parameters:');
    console.log('  - Owner:', owner);
    console.log('  - Avatar:', avatar);
    console.log('  - Target:', target);
    console.log('  - Linked libraries: Integrity, Packer');
    
    await deployer.deploy(Roles, owner, avatar, target);
    console.log('✅ Roles contract deployment initiated successfully!');
  } catch (error) {
    console.error('❌ Roles contract deployment failed:');
    console.error('  - Error type:', error.constructor.name);
    console.error('  - Error message:', error.message);
    console.error('  - Error code:', error.code);
    console.error('  - Full error:', error);
    throw error;
  }
  
  const rolesInstance = await Roles.deployed();
  console.log('TRON Roles module deployed at:', rolesInstance.address);
  
  // Convert hex address to TRON address format
  const tronAddress = TronWeb.utils.address.fromHex(rolesInstance.address);
  console.log('TRON address format:', tronAddress);
  
  // Store comprehensive deployment info
  const deploymentInfo = {
    network: network,
    rolesAddress: tronAddress, // Use TRON address format
    rolesAddressHex: rolesInstance.address, // Keep hex for reference
    integrityAddress: integrityInstance.address,
    packerAddress: packerInstance.address,
    owner: owner,
    avatar: avatar,
    target: target,
    deployer: accounts,
    explorer: networkConfig.explorer,
    timestamp: new Date().toISOString()
    // Note: Roles are created dynamically in Zodiac Roles system
  };
  
  // Save deployment info to JSON file
  const deploymentsDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentsDir)) {
    fs.mkdirSync(deploymentsDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentsDir, `${network}_roles_deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log('\n🎉 Complete TRON Zodiac Roles system deployed successfully!');
  console.log('📊 Deployment Summary:');
  console.log('  • Integrity Library:', integrityInstance.address);
  console.log('  • Packer Library:', packerInstance.address);
  console.log('  • Roles Contract (hex):', rolesInstance.address);
  console.log('  • Roles Contract (TRON):', tronAddress);
  console.log('  • Explorer URL:', networkConfig.explorer);
  console.log('  • Contract URL:', `${networkConfig.explorer}/#/contract/${tronAddress}`);
  console.log('  • Deployment info saved to:', deploymentFile);
  
  // Note: Roles are created dynamically in Zodiac Roles system
  console.log('ℹ️  Roles are created dynamically using assignRole() function');
  console.log('   Use getRoleKey("ROLE_NAME") to generate role keys as needed');

  return rolesInstance;
};
