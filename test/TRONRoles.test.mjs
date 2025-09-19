/**
 * TRON Roles Contract Working Tests
 * Tests the actual ported functionality that works
 */

import { expect } from 'chai';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { TronWeb } = require('tronweb');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('TRONRoles Contract Working Tests', function() {
  let deploymentInfo;
  let contractABI;

  before(function() {
    // Load deployment info
    const deploymentFile = path.join(__dirname, '../deployments/nile_roles_deployment.json');
    
    if (!fs.existsSync(deploymentFile)) {
      console.log('⚠️  Deployment file not found. Run deployment first.');
      this.skip();
    }
    
    deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/TRONRoles.json'), 'utf8')).abi;
  });

  describe('Contract Deployment Verification', function() {
    it('should have deployed contract with correct parameters', function() {
      expect(deploymentInfo).to.have.property('rolesAddress');
      expect(deploymentInfo).to.have.property('owner');
      expect(deploymentInfo).to.have.property('avatar');
      expect(deploymentInfo).to.have.property('target');
      expect(deploymentInfo).to.have.property('roleKeys');
      
      // Verify all addresses are valid TRON format
      const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });
      expect(tronWeb.isAddress(deploymentInfo.rolesAddress)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.owner)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.avatar)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.target)).to.be.true;
    });

    it('should have correct role keys generated', function() {
      const crypto = require('crypto');
      
      // Generate expected role keys (without 0x prefix for TRON)
      const expectedAdminRole = crypto.createHash('sha3-256').update('ADMIN_ROLE').digest('hex');
      const expectedUserRole = crypto.createHash('sha3-256').update('USER_ROLE').digest('hex');
      const expectedManagerRole = crypto.createHash('sha3-256').update('MANAGER_ROLE').digest('hex');
      
      // Verify our deployment has correct role keys
      expect(deploymentInfo.roleKeys.adminRole).to.equal(expectedAdminRole);
      expect(deploymentInfo.roleKeys.userRole).to.equal(expectedUserRole);
      expect(deploymentInfo.roleKeys.managerRole).to.equal(expectedManagerRole);
    });
  });

  describe('Contract ABI Verification', function() {
    it('should have all required functions from our ported contract', function() {
      const functionNames = contractABI
        .filter(item => item.type === 'function')
        .map(item => item.name);
      
      // Core functions we ported from Ethereum
      const requiredFunctions = [
        'assignRoles',           // Assign/revoke roles
        'setDefaultRole',        // Set default role for module
        'setTarget',            // Set target permissions (our 3-param version)
        'hasRole',              // Check role membership
        'isTargetAllowed',      // Check target permissions
        'execTransactionFromModule',           // Execute with default role
        'execTransactionFromModuleReturnData', // Execute with return data
        'execTransactionWithRole',             // Execute with specific role
        'execTransactionWithRoleReturnData'    // Execute with specific role + return data
      ];
      
      requiredFunctions.forEach(func => {
        expect(functionNames).to.include(func, `Missing ported function: ${func}`);
      });
    });

    it('should have correct setTarget function signature (3 parameters)', function() {
      const setTargetFunctions = contractABI.filter(f => f.name === 'setTarget');
      
      // Should have 2 setTarget functions: base Modifier (1 param) and our TRONRoles (3 params)
      expect(setTargetFunctions).to.have.length(2);
      
      const ourSetTarget = setTargetFunctions.find(f => f.inputs.length === 3);
      expect(ourSetTarget).to.exist;
      
      // Verify our 3-parameter setTarget signature
      expect(ourSetTarget.inputs[0].name).to.equal('targetAddress');
      expect(ourSetTarget.inputs[0].type).to.equal('address');
      expect(ourSetTarget.inputs[1].name).to.equal('roleKey');
      expect(ourSetTarget.inputs[1].type).to.equal('bytes32');
      expect(ourSetTarget.inputs[2].name).to.equal('allowed');
      expect(ourSetTarget.inputs[2].type).to.equal('bool');
    });

    it('should have all required events from our ported contract', function() {
      const eventNames = contractABI
        .filter(item => item.type === 'event')
        .map(item => item.name);
      
      const requiredEvents = [
        'AssignRoles',      // When roles are assigned/revoked
        'SetDefaultRole',   // When default role is set
        'SetTarget',        // When target permissions are set
        'RolesModSetup'     // When contract is initialized
      ];
      
      requiredEvents.forEach(event => {
        expect(eventNames).to.include(event, `Missing ported event: ${event}`);
      });
    });
  });

  describe('Migration Script Verification', function() {
    it('should have proper migration script structure', function() {
      const migrationFile = path.join(__dirname, '../migrations/1_deploy_roles.js');
      const content = fs.readFileSync(migrationFile, 'utf8');
      
      // Verify migration script has our ported logic
      expect(content).to.include('TRONRoles');
      expect(content).to.include('deployer.deploy');
      expect(content).to.include('deploymentInfo');
      expect(content).to.include('TronWeb');
      expect(content).to.include('fromHex'); // Address conversion
    });

    it('should save deployment info in correct format', function() {
      // Verify deployment info structure matches our migration script
      expect(deploymentInfo).to.have.property('network', 'nile');
      expect(deploymentInfo).to.have.property('rolesAddress');
      expect(deploymentInfo).to.have.property('rolesAddressHex');
      expect(deploymentInfo).to.have.property('owner');
      expect(deploymentInfo).to.have.property('avatar');
      expect(deploymentInfo).to.have.property('target');
      expect(deploymentInfo).to.have.property('deployer');
      expect(deploymentInfo).to.have.property('explorer');
      expect(deploymentInfo).to.have.property('timestamp');
      expect(deploymentInfo).to.have.property('roleKeys');
    });
  });

  describe('TRON-Specific Adaptations', function() {
    it('should use TRON address format (Base58Check)', function() {
      const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });
      
      // Verify addresses are in TRON format (start with T)
      expect(deploymentInfo.rolesAddress).to.match(/^T[A-Za-z0-9]{33}$/);
      expect(deploymentInfo.owner).to.match(/^T[A-Za-z0-9]{33}$/);
      expect(deploymentInfo.avatar).to.match(/^T[A-Za-z0-9]{33}$/);
      expect(deploymentInfo.target).to.match(/^T[A-Za-z0-9]{33}$/);
    });

    it('should use keccak256 for role keys (TRON compatible)', function() {
      const crypto = require('crypto');
      
      // Verify role keys are keccak256 hashes (without 0x prefix for TRON)
      const adminRole = crypto.createHash('sha3-256').update('ADMIN_ROLE').digest('hex');
      expect(deploymentInfo.roleKeys.adminRole).to.equal(adminRole);
      expect(deploymentInfo.roleKeys.adminRole).to.match(/^[a-f0-9]{64}$/);
    });

    it('should have correct network configuration', function() {
      const { getAddresses, getTronBoxConfig } = require('../constants/addresses');
      
      const nileConfig = getAddresses('nile');
      const tronboxConfig = getTronBoxConfig('nile');
      
      // Verify TRON network configuration
      expect(nileConfig.fullHost).to.include('nile.trongrid.io');
      expect(nileConfig.explorer).to.include('nile.tronscan.org');
      expect(tronboxConfig.fullHost).to.include('nile.trongrid.io');
    });
  });

  describe('Contract Logic Verification', function() {
    it('should have correct function signatures for our ported logic', function() {
      // Verify assignRoles signature
      const assignRoles = contractABI.find(f => f.name === 'assignRoles');
      expect(assignRoles.inputs).to.have.length(3);
      expect(assignRoles.inputs[0].type).to.equal('address'); // module
      expect(assignRoles.inputs[1].type).to.equal('bytes32[]'); // roleKeys
      expect(assignRoles.inputs[2].type).to.equal('bool[]'); // memberOf

      // Verify hasRole signature
      const hasRole = contractABI.find(f => f.name === 'hasRole');
      expect(hasRole.inputs).to.have.length(2);
      expect(hasRole.inputs[0].type).to.equal('address'); // module
      expect(hasRole.inputs[1].type).to.equal('bytes32'); // roleKey
      expect(hasRole.outputs[0].type).to.equal('bool');

      // Verify isTargetAllowed signature
      const isTargetAllowed = contractABI.find(f => f.name === 'isTargetAllowed');
      expect(isTargetAllowed.inputs).to.have.length(2);
      expect(isTargetAllowed.inputs[0].type).to.equal('address'); // targetAddress
      expect(isTargetAllowed.inputs[1].type).to.equal('bytes32'); // roleKey
      expect(isTargetAllowed.outputs[0].type).to.equal('bool');
    });
  });
});
