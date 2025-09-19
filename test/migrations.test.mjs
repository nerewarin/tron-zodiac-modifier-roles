/**
 * Migration Scripts Tests
 * Tests the functionality of migration scripts
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

describe('Migration Scripts Tests', function() {
  let deploymentInfo;

  before(function() {
    const deploymentFile = path.join(__dirname, '../deployments/nile_roles_deployment.json');
    
    if (fs.existsSync(deploymentFile)) {
      deploymentInfo = JSON.parse(fs.readFileSync(deploymentFile, 'utf8'));
    } else {
      console.log('⚠️  Deployment file not found. Run deployment first.');
    }
  });

  describe('Deployment Information', function() {
    it('should have valid deployment file', function() {
      expect(deploymentInfo).to.be.an('object');
      expect(deploymentInfo).to.have.property('network', 'nile');
      expect(deploymentInfo).to.have.property('rolesAddress');
      expect(deploymentInfo).to.have.property('owner');
      expect(deploymentInfo).to.have.property('avatar');
      expect(deploymentInfo).to.have.property('target');
      expect(deploymentInfo).to.have.property('roleKeys');
    });

    it('should have valid TRON addresses', function() {
      const tronWeb = new TronWeb({ fullHost: 'https://nile.trongrid.io' });
      
      expect(tronWeb.isAddress(deploymentInfo.rolesAddress)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.owner)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.avatar)).to.be.true;
      expect(tronWeb.isAddress(deploymentInfo.target)).to.be.true;
    });

    it('should have valid role keys', function() {
      expect(deploymentInfo.roleKeys).to.have.property('adminRole');
      expect(deploymentInfo.roleKeys).to.have.property('userRole');
      expect(deploymentInfo.roleKeys).to.have.property('managerRole');
      
      // Validate role key format (64 hex characters)
      expect(deploymentInfo.roleKeys.adminRole).to.match(/^[a-f0-9]{64}$/);
      expect(deploymentInfo.roleKeys.userRole).to.match(/^[a-f0-9]{64}$/);
      expect(deploymentInfo.roleKeys.managerRole).to.match(/^[a-f0-9]{64}$/);
    });

    it('should have valid timestamps', function() {
      expect(deploymentInfo).to.have.property('timestamp');
      const timestamp = new Date(deploymentInfo.timestamp);
      expect(timestamp).to.be.instanceOf(Date);
      expect(timestamp.getTime()).to.be.a('number');
    });
  });

  describe('Migration Script Structure', function() {
    it('should have 0_deploy_migrations.js', function() {
      const migrationFile = path.join(__dirname, '../migrations/0_deploy_migrations.js');
      expect(fs.existsSync(migrationFile)).to.be.true;
      
      const content = fs.readFileSync(migrationFile, 'utf8');
      expect(content).to.include('Migrations');
      expect(content).to.include('deployer.deploy');
    });

    it('should have 1_deploy_roles.js', function() {
      const migrationFile = path.join(__dirname, '../migrations/1_deploy_roles.js');
      expect(fs.existsSync(migrationFile)).to.be.true;
      
      const content = fs.readFileSync(migrationFile, 'utf8');
      expect(content).to.include('TRONRoles');
      expect(content).to.include('deployer.deploy');
      expect(content).to.include('deploymentInfo');
    });
  });

  describe('Migration Script Content', function() {
    it('should have proper TRONRoles deployment', function() {
      const migrationFile = path.join(__dirname, '../migrations/1_deploy_roles.js');
      const content = fs.readFileSync(migrationFile, 'utf8');
      
      // Check for required imports
      expect(content).to.include('artifacts.require');
      expect(content).to.include('getAddresses');
      expect(content).to.include('TronWeb');
      
      // Check for deployment logic
      expect(content).to.include('deployer.deploy(TRONRoles');
      expect(content).to.include('deploymentInfo');
      expect(content).to.include('writeFileSync');
    });

    it('should have proper Migrations deployment', function() {
      const migrationFile = path.join(__dirname, '../migrations/0_deploy_migrations.js');
      const content = fs.readFileSync(migrationFile, 'utf8');
      
      expect(content).to.include('Migrations');
      expect(content).to.include('deployer.deploy(Migrations)');
    });
  });

  describe('Contract Artifacts', function() {
    it('should have TRONRoles artifact', function() {
      const artifactFile = path.join(__dirname, '../build/contracts/TRONRoles.json');
      expect(fs.existsSync(artifactFile)).to.be.true;
      
      const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
      expect(artifact).to.have.property('abi');
      expect(artifact).to.have.property('bytecode');
      expect(artifact.abi).to.be.an('array');
    });

    it('should have Migrations artifact', function() {
      const artifactFile = path.join(__dirname, '../build/contracts/Migrations.json');
      expect(fs.existsSync(artifactFile)).to.be.true;
      
      const artifact = JSON.parse(fs.readFileSync(artifactFile, 'utf8'));
      expect(artifact).to.have.property('abi');
      expect(artifact).to.have.property('bytecode');
    });
  });

  describe('Network Configuration', function() {
    it('should have valid network configuration', function() {
      const { getAddresses, getTronBoxConfig } = require('../constants/addresses');
      
      const nileConfig = getAddresses('nile');
      const tronboxConfig = getTronBoxConfig('nile');
      
      expect(nileConfig).to.have.property('usdt');
      expect(nileConfig).to.have.property('fullHost');
      expect(nileConfig).to.have.property('explorer');
      
      expect(tronboxConfig).to.have.property('fullHost');
      expect(tronboxConfig).to.have.property('feeLimit');
      expect(tronboxConfig).to.have.property('userFeePercentage');
      
      // Validate URLs
      expect(nileConfig.fullHost).to.include('nile.trongrid.io');
      expect(nileConfig.explorer).to.include('nile.tronscan.org');
    });
  });
});
