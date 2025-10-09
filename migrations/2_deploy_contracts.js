const DrugTraceability = artifacts.require("DrugTraceability");

module.exports = function(deployer) {
  deployer.deploy(DrugTraceability);
};
