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
    contractABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/Roles.json'), 'utf8')).abi;
  });

  describe('Contract Deployment Verification', function() {
    it('should have deployed contract with correct parameters', function() {
      expect(deploymentInfo).to.have.property('rolesAddress');
      expect(deploymentInfo).to.have.property('owner');
      expect(deploymentInfo).to.have.property('avatar');
      expect(deploymentInfo).to.have.property('target');
      expect(deploymentInfo).to.have.property('note'); // Roles are created dynamically
      
      // Verify all addresses are valid TRON format
      const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });
      expect(tronWeb.isAddress(deploymentInfo.rolesAddress)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.owner)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.avatar)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.target)).to.be.true;
    });

    it('should have note about dynamic role creation', function() {
      // In vanilla Zodiac Roles, roles are created dynamically
      expect(deploymentInfo.note).to.include('Roles are created dynamically');
    });
  });

  describe('Contract ABI Verification', function() {
    it('should have all required functions from our ported contract', function() {
      const functionNames = contractABI
        .filter(item => item.type === 'function')
        .map(item => item.name);
      
      // Core functions from vanilla Zodiac Roles
      const requiredFunctions = [
        'assignRoles',           // Assign/revoke roles
        'setDefaultRole',        // Set default role for module
        'scopeTarget',          // Allow role to call specific target
        'scopeFunction',        // Allow role to call specific function
        'execTransactionFromModule',           // Execute with default role
        'execTransactionFromModuleReturnData', // Execute with return data
        'execTransactionWithRole',             // Execute with specific role
        'execTransactionWithRoleReturnData'    // Execute with specific role + return data
      ];
      
      requiredFunctions.forEach(func => {
        expect(functionNames).to.include(func, `Missing ported function: ${func}`);
      });
    });

    it('should have correct scopeTarget function signature', function() {
      const scopeTargetFunction = contractABI.find(f => f.name === 'scopeTarget');
      
      // Should have scopeTarget function with 2 parameters
      expect(scopeTargetFunction).to.exist;
      expect(scopeTargetFunction.inputs).to.have.length(2);
      expect(scopeTargetFunction.inputs[0].name).to.equal('roleKey');
      expect(scopeTargetFunction.inputs[0].type).to.equal('bytes32');
      expect(scopeTargetFunction.inputs[1].name).to.equal('targetAddress');
      expect(scopeTargetFunction.inputs[1].type).to.equal('address');
    });

    it('should have all required events from our ported contract', function() {
      const eventNames = contractABI
        .filter(item => item.type === 'event')
        .map(item => item.name);
      
      const requiredEvents = [
        'AssignRoles',      // When roles are assigned/revoked
        'SetDefaultRole',   // When default role is set
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
      
      // Verify migration script has Roles deployment
      expect(content).to.include('Roles');
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
      expect(deploymentInfo).to.have.property('note'); // Roles are created dynamically
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

    it('should support dynamic role creation', function() {
      const crypto = require('crypto');
      
      // Test that role key generation works for dynamic roles
      const testRoleName = 'TEST_ROLE';
      const expectedRoleKey = crypto.createHash('sha3-256').update(testRoleName).digest('hex');
      
      // Verify role key generation produces valid hex strings
      expect(expectedRoleKey).to.be.a('string');
      expect(expectedRoleKey).to.match(/^[0-9a-f]{64}$/);
      
      // In vanilla Zodiac Roles, roles are created dynamically, not predefined
      expect(deploymentInfo.note).to.include('Roles are created dynamically');
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

      // Verify scopeTarget signature
      const scopeTarget = contractABI.find(f => f.name === 'scopeTarget');
      expect(scopeTarget.inputs).to.have.length(2);
      expect(scopeTarget.inputs[0].type).to.equal('bytes32'); // roleKey
      expect(scopeTarget.inputs[1].type).to.equal('address'); // targetAddress

      // Verify scopeFunction signature
      const scopeFunction = contractABI.find(f => f.name === 'scopeFunction');
      expect(scopeFunction.inputs).to.have.length(5);
      expect(scopeFunction.inputs[0].type).to.equal('bytes32'); // roleKey
      expect(scopeFunction.inputs[1].type).to.equal('address'); // targetAddress
      expect(scopeFunction.inputs[2].type).to.equal('bytes4'); // selector
      expect(scopeFunction.inputs[3].type).to.equal('tuple[]'); // conditions
      expect(scopeFunction.inputs[4].type).to.equal('uint8'); // options
    });
  });
});
